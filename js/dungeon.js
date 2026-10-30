'use strict';
// Expeditions: real-time top-down exploration with light, fog of war and bump combat.
(function () {
  const D = G.Dun = { active: false };
  const TILESET = new Set([' ', '#', '%', '&', '.', ',', '"', 'T', '~', '=', '+', '^', ':', '*']);
  const OPAQUE = new Set(['#', '%', '&', 'T', '^', ' ']);
  const WALK = new Set(['.', ',', '"', '=', '+', '*', ':']);
  const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const POTION_KEYS = { h: 'heal', g: 'greater', t: 'tonic', z: 'shadow', c: 'clarity', l: 'lumen', b: 'bomb' };
  const MOVE_KEYS = { arrowup: [0, -1], w: [0, -1], arrowdown: [0, 1], s: [0, 1], arrowleft: [-1, 0], a: [-1, 0], arrowright: [1, 0], d: [1, 0] };
  const VW = 61, VH = 21;
  let M = null, P = null;

  const key = (x, y) => x + ',' + y;
  const idx = (x, y) => y * M.w + x;
  const inb = (x, y) => x >= 0 && y >= 0 && x < M.w && y < M.h;
  D.ngMult = () => 1 + 0.5 * (G.S.ng || 0);

  // ------------------------------------------------------------ setup
  D.spawnCheck = function (id) {
    const S = G.S, d = G.ENEMIES[id];
    if (!d.boss) return true;
    if (S.flags['k_' + id]) return false;
    if (id === 'mothking' && (S.flags.sang || S.endings.newsun || S.endings.dawn)) return false;
    return true;
  };
  D.makeMob = function (id, x, y) {
    const d = G.ENEMIES[id], hp = Math.round(d.hp * (1 + 0.6 * (G.S.ng || 0)));
    return {
      id, d, x, y, hp, max: hp, r: d.size === 3 ? 1 : 0, home: { x, y },
      nextMove: G.rand(200, Math.min(d.spd, 2000)), nextAtk: 0, aware: false, lastSeen: 0, adj: false,
      hit: 0, frozen: 0, stunned: 0, burnUntil: 0, burnNext: 0, burnDmg: 0, summonT: 3000, summons: [],
      dormant: id === 'mothking', st: {},
    };
  };

  D.start = function (mapId) {
    const def = G.MAPS[mapId], S = G.S;
    if (!def) return;
    if (!S.maps[mapId]) S.maps[mapId] = { o: {} };
    const ms = S.maps[mapId];
    const rows = def.rows, h = rows.length, w = Math.max(...rows.map(r => r.length));
    M = D.m = {
      id: mapId, def, w, h, ms, tiles: new Array(w * h), objs: new Map(), mobs: [], projs: [], allies: [], fx: [],
      seen: new Uint8Array(w * h), vis: new Uint8Array(w * h), los: new Uint8Array(w * h), lit: new Uint8Array(w * h), flow: new Int16Array(w * h),
    };
    let start = { x: 1, y: 1 }, sign = 0;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const c = rows[y][x] || ' ', i = y * w + x, k = key(x, y);
      if (TILESET.has(c)) {
        M.tiles[i] = c === '%' && ms.o[k] ? def.floor : c;
        continue;
      }
      M.tiles[i] = def.floor;
      if (c === '<') start = { x, y };
      else if (c === '>') M.objs.set(i, { t: 'exit' });
      else if (c === '$') M.objs.set(i, { t: 'motes' });
      else if (c === '?') M.objs.set(i, { t: 'sign', text: def.signs[sign++] || '' });
      else if (c === '0') M.objs.set(i, { t: 'shrine' });
      else {
        const L = def.legend[c];
        if (!L) continue;
        if (L.mob) { if (D.spawnCheck(L.mob)) M.mobs.push(D.makeMob(L.mob, x, y)); }
        else if (L.chest) M.objs.set(i, { t: 'chest', items: L.chest, open: !!ms.o[k] });
        else if (L.page) { if (!S.pages[L.page]) M.objs.set(i, { t: 'page', id: L.page }); }
        else if (L.item) { if (!ms.o[k]) M.objs.set(i, { t: 'item', id: L.item, n: L.n || 1 }); }
        else if (L.door) M.objs.set(i, { t: 'door', key: L.door, open: !!ms.o[k], look: L.look });
        else if (L.lever) M.objs.set(i, { t: 'lever', id: L.lever });
        else if (L.gate) M.objs.set(i, { t: 'gate', need: L.gate });
        else if (L.npc) { if (!L.ally || (S.flags.sang && !S.flags.k_unlit)) M.objs.set(i, { t: 'npc', id: L.npc, ally: L.ally }); }
        else if (L.torch) M.objs.set(i, { t: 'torch', r: L.torch });
        else if (L.lamp) M.objs.set(i, { t: 'lamp', lit: !!ms.o[k] });
        else if (L.trigger) M.objs.set(i, { t: 'trigger', id: L.trigger });
        else if (L.blever) M.objs.set(i, { t: 'blever', ready: 0 });
      }
    }
    const st = G.calc();
    P = D.p = { x: start.x, y: start.y, dir: [0, 1], nextMove: 0, nextAtk: 0, lumen: st.lumMax, cds: {}, buffs: {}, slide: null, used: new Set(), hit: 0, slowUntil: 0 };
    Object.assign(D, { t: 0, msgs: [], target: null, revealed: false, lightPenalty: 0, dustUntil: 0, held: null, heldKey: null, queued: null, coldT: 2000, allyT: 8000, hudT: 0, barSig: '' });
    if (S.flags.pip) M.allies.push({ kind: 'pip', x: P.x, y: P.y, nextMove: 0, nextAtk: 0 });
    D.warded = false;
    if (def.cold && !st.cold && G.has('frostward')) { G.take('frostward'); D.warded = true; }
    D.active = true;
    S.stats.runs++;
    G.view = { tab: 'map', loc: mapId, sub: 'dungeon' };
    G.renderTabs();
    D.renderShell();
    D.computeLit();
    D.computeFov();
    D.computeFlow();
    D.msg(`You enter ${def.n}.`);
    if (D.warded) D.msg('You drink a Frostward. Warmth settles into your bones.', 'good');
    else if (def.cold && !st.cold) D.msg('It is bitterly cold. The cold will bite unless you stay near the fires.', 'bad');
    D.render();
    D.hud(true);
  };

  // ------------------------------------------------------------ world queries
  D.gateOpen = o => (Array.isArray(o.need) ? o.need.every(l => M.ms.o['lv_' + l]) : !!G.S.flags['gate_' + o.need]);
  D.blocks = function (o) {
    switch (o.t) {
      case 'exit': case 'motes': case 'page': case 'item': case 'trigger': return false;
      case 'door': return !o.open;
      case 'gate': return !D.gateOpen(o);
      default: return true;
    }
  };
  D.walkable = function (x, y) {
    if (!inb(x, y)) return false;
    const i = idx(x, y), t = M.tiles[i];
    if (t !== '&' && !WALK.has(t)) return false;
    const o = M.objs.get(i);
    return !(o && D.blocks(o));
  };
  D.opaque = function (x, y) {
    if (!inb(x, y)) return true;
    const i = idx(x, y);
    if (OPAQUE.has(M.tiles[i])) return true;
    const o = M.objs.get(i);
    return !!(o && o.t === 'door' && !o.open);
  };
  D.mobAt = function (x, y, except) {
    for (const m of M.mobs) if (m !== except && Math.abs(x - m.x) <= m.r && Math.abs(y - m.y) <= m.r) return m;
    return null;
  };
  D.footDist = (m, x, y) => Math.max(0, Math.abs(x - m.x) - m.r) + Math.max(0, Math.abs(y - m.y) - m.r);
  D.footCheb = (m, x, y) => Math.max(Math.abs(x - m.x) - m.r, Math.abs(y - m.y) - m.r, 0);
  D.canStand = function (m, x, y) {
    for (let dy = -m.r; dy <= m.r; dy++) for (let dx = -m.r; dx <= m.r; dx++) {
      const cx = x + dx, cy = y + dy;
      if (!D.walkable(cx, cy) || M.tiles[idx(cx, cy)] === '&') return false;
      if (cx === P.x && cy === P.y) return false;
      if (D.mobAt(cx, cy, m)) return false;
    }
    return true;
  };
  D.los = function (x0, y0, x1, y1) {
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy, x = x0, y = y0;
    while (!(x === x1 && y === y1)) {
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x += sx; }
      if (e2 <= dx) { err += dx; y += sy; }
      if (x === x1 && y === y1) return true;
      if (D.opaque(x, y)) return false;
    }
    return true;
  };
  D.isShielded = m => m.id === 'golem' && !(m.st.down > D.t);
  D.nearShrine = function (r) {
    for (const [i, o] of M.objs) if (o.t === 'shrine' && Math.abs(i % M.w - P.x) <= r && Math.abs(((i / M.w) | 0) - P.y) <= r) return true;
    return false;
  };

  // ------------------------------------------------------------ light & sight
  D.radius = function () {
    if (M.def.outdoor) return M.def.view;
    let r = G.calc().radius - D.lightPenalty;
    if (D.dustUntil > D.t) r = Math.min(r, 2);
    return Math.max(1, r);
  };
  D.computeLit = function () {
    M.lit.fill(0);
    for (const [i, o] of M.objs) {
      let r = 0;
      if (o.t === 'torch') r = o.r;
      else if (o.t === 'shrine') r = M.def.dim ? 2 : 3;
      else if (o.t === 'lamp' && o.lit) r = 5;
      if (!r) continue;
      const ox = i % M.w, oy = (i / M.w) | 0;
      for (let y = oy - r; y <= oy + r; y++) for (let x = ox - r; x <= ox + r; x++) {
        if (!inb(x, y) || (x - ox) ** 2 + (y - oy) ** 2 > (r + 0.5) ** 2) continue;
        if (D.los(ox, oy, x, y)) M.lit[idx(x, y)] = 1;
      }
    }
  };
  D.computeFov = function () {
    const R = D.radius(), maxD = M.def.outdoor ? R : 26;
    M.vis.fill(0);
    M.los.fill(0);
    const px = P.x, py = P.y, R2 = (R + 0.5) ** 2, M2 = (maxD + 0.5) ** 2;
    const mark = (x, y) => {
      const i = idx(x, y), d2 = (x - px) ** 2 + (y - py) ** 2;
      if (d2 > M2) return false;
      M.los[i] = 1;
      if (d2 <= R2 || M.lit[i] || D.revealed && d2 <= 4) { M.vis[i] = 1; M.seen[i] = 1; }
      return true;
    };
    mark(px, py);
    const ray = (tx, ty) => {
      const dx = Math.abs(tx - px), dy = -Math.abs(ty - py), sx = px < tx ? 1 : -1, sy = py < ty ? 1 : -1;
      let err = dx + dy, x = px, y = py;
      while (!(x === tx && y === ty)) {
        const e2 = 2 * err;
        if (e2 >= dy) { err += dy; x += sx; }
        if (e2 <= dx) { err += dx; y += sy; }
        if (!inb(x, y) || !mark(x, y) || D.opaque(x, y)) break;
      }
    };
    for (let i = -maxD; i <= maxD; i++) { ray(px + i, py - maxD); ray(px + i, py + maxD); ray(px - maxD, py + i); ray(px + maxD, py + i); }
  };
  // Distance map from the player, shared by every chasing foe.
  D.computeFlow = function () {
    const f = M.flow;
    f.fill(-1);
    const q = [idx(P.x, P.y)];
    f[q[0]] = 0;
    for (let head = 0; head < q.length; head++) {
      const i = q[head], d = f[i];
      if (d >= 32) continue;
      const x = i % M.w, y = (i / M.w) | 0;
      for (const [dx, dy] of N4) {
        const nx = x + dx, ny = y + dy;
        if (!inb(nx, ny)) continue;
        const j = idx(nx, ny);
        if (f[j] !== -1 || M.tiles[j] === '&' || !D.walkable(nx, ny)) continue;
        f[j] = d + 1;
        q.push(j);
      }
    }
  };
  D.reveal = function (r) {
    for (let y = P.y - r; y <= P.y + r; y++) for (let x = P.x - r; x <= P.x + r; x++) if (inb(x, y)) M.seen[idx(x, y)] = 1;
  };

  // ------------------------------------------------------------ messages & hud
  D.msg = function (t, cls = '') {
    D.msgs.push({ t, cls });
    if (D.msgs.length > 6) D.msgs.shift();
    const el = document.getElementById('dmsgs');
    if (el) el.innerHTML = D.msgs.map(m => `<div class="${m.cls}">${m.t}</div>`).join('');
  };
  const bar = (v, max, n, cls) => {
    const f = Math.round(G.clamp(v / max, 0, 1) * n);
    return `<span class="bar ${cls}">[<span class="f">${'#'.repeat(f)}</span><span class="e">${'-'.repeat(n - f)}</span>]</span>`;
  };
  D.renderShell = function () {
    const dp = (l, a) => `<button data-act="dmove" data-arg="${a}">${l}</button>`;
    document.getElementById('screen').innerHTML = `<div class="dungeon">
      <div class="dun-head"><h2>${M.def.n}</h2><div>${G.btn('Leave', 'flee')}</div></div>
      <pre id="dmap"></pre>
      <div class="hud" id="dhud"></div>
      <div class="hotbar" id="dbar"></div>
      <div class="dmsgs" id="dmsgs"></div>
      <div class="dpad"><span></span>${dp('&uarr;', '0,-1')}<span></span>${dp('&larr;', '-1,0')}${dp('&middot;', '0,0')}${dp('&rarr;', '1,0')}<span></span>${dp('&darr;', '0,1')}<span></span></div>
      <div class="small faint">Move with WASD or the arrow keys. Walk into foes to attack, and into things to use them.
1-8 cast spells. H G T Z C L B drink potions.</div></div>`;
  };
  D.hud = function (force) {
    const st = G.calc(), S = G.S;
    const el = document.getElementById('dhud');
    if (!el) return;
    const known = G.SPELL_ORDER.filter(s => S.spells[s]);
    let h = `<span>HP ${bar(S.hp, st.maxHp, 20, '')} ${Math.ceil(S.hp)}/${st.maxHp}</span>`;
    if (known.length) h += `<span>Lumen ${bar(P.lumen, st.lumMax, 10, 'lum')} ${Math.floor(P.lumen)}/${st.lumMax}</span>`;
    const T = D.target && M.mobs.includes(D.target) ? D.target : null;
    if (T) h += `<span class="m-${T.d.col}">${T.d.n} ${bar(T.hp, T.max, 14, '')} ${Math.ceil(T.hp)}/${T.max}${D.isShielded(T) ? ' <span class="cyan">[shielded]</span>' : ''}${T.stunned > D.t ? ' <span class="gold">[dazed]</span>' : ''}</span>`;
    const buffs = [];
    if (P.buffs.tonic > D.t) buffs.push(`<span class="gold">Ember Tonic ${G.fmtTime(P.buffs.tonic - D.t)}</span>`);
    if (P.buffs.shadow > D.t) buffs.push(`<span class="cyan">Shadowstep ${G.fmtTime(P.buffs.shadow - D.t)}</span>`);
    if (P.slowUntil > D.t) buffs.push('<span class="bad">webbed</span>');
    if (D.dustUntil > D.t) buffs.push('<span class="bad">blinded by dust</span>');
    if (D.lightPenalty) buffs.push(`<span class="bad">light -${D.lightPenalty}</span>`);
    if (M.def.cold && !st.cold) buffs.push(D.warded ? '<span class="good">frostward</span>' : '<span class="bad">freezing</span>');
    if (buffs.length) h += `<span>${buffs.join(' ')}</span>`;
    el.innerHTML = h;
    const pots = Object.entries(POTION_KEYS).filter(([, id]) => G.has(id));
    const sig = known.map(s => s + (P.cds[s] > D.t ? 0 : 1) + (P.lumen >= G.SPELLS[s].lum ? 1 : 0)).join() + '|' + pots.map(([, id]) => id + G.count(id)).join();
    if (sig === D.barSig && !force) return;
    D.barSig = sig;
    const b = known.map((s, i) => {
      const sp = G.SPELLS[s], ok = !(P.cds[s] > D.t) && P.lumen >= sp.lum;
      return `<button class="btn" data-act="dcast" data-arg="${s}" ${ok ? '' : 'disabled'} title="${G.esc(sp.d)}">${i + 1} ${sp.n} <span class="cost">${sp.lum}</span></button>`;
    }).concat(pots.map(([k, id]) => `<button class="btn" data-act="dpot" data-arg="${id}" title="${G.esc(G.ITEMS[id].d)}">${k.toUpperCase()} ${G.ITEMS[id].n} x${G.count(id)}</button>`));
    document.getElementById('dbar').innerHTML = b.join('');
  };

  // ------------------------------------------------------------ rendering
  const TG = {
    '#': ['#', 't-wall'], '.': ['.', 't-floor'], '"': ['"', 't-tall'], T: ['♣', 't-tree'], '=': ['=', 't-bridge'],
    '+': ["'", 't-door'], '^': ['^', 't-rock'], ':': [':', 't-ice'], ' ': [' ', 't-void'],
  };
  const lookGlyph = look => (look === 'T' ? ['♣', 't-tree'] : look === '^' ? ['^', 't-rock'] : ['#', 't-wall']);
  D.tileGlyph = function (x, y, t) {
    switch (t) {
      case ',': return [(x * 31 + y * 17) % 7 < 2 ? ',' : '.', 't-grass'];
      case '~': return [(x + y + Math.floor(D.t / 700)) % 5 === 0 ? '-' : '~', 't-water'];
      case '*': return [(x * 13 + y * 7) % 9 === 0 ? '*' : '.', 't-snow'];
      case '%': return G.calc().cracks || D.revealed ? ['%', 't-crack'] : lookGlyph(M.def.crackLook);
      case '&': return D.revealed || M.ms.o['f' + key(x, y)] ? [lookGlyph(M.def.falseLook)[0], 't-crack'] : lookGlyph(M.def.falseLook);
    }
    return TG[t] || [t, 't-floor'];
  };
  D.objGlyph = function (o) {
    switch (o.t) {
      case 'exit': return ['>', 't-exit'];
      case 'motes': return ['*', 't-mote'];
      case 'sign': return ['?', 't-sign'];
      case 'page': return ['¶', 't-page'];
      case 'item': return ['!', 't-key'];
      case 'chest': return o.open ? ['_', 't-open'] : ['=', 't-chest'];
      case 'shrine': return ['Ω', P.used.has(o) ? 't-shrine-used' : 't-shrine'];
      case 'door': return o.open ? ["'", 't-door'] : [o.look === 'gate' ? '#' : '+', 't-key'];
      case 'lever': return [M.ms.o['lv_' + o.id] ? '\\' : '/', 't-lever'];
      case 'gate': return D.gateOpen(o) ? ['.', 't-floor'] : ['|', 't-gate'];
      case 'npc': return o.ally ? ['W', 'm-violet m-boss'] : ['&', 't-npc'];
      case 'torch': return ['i', 't-torch'];
      case 'lamp': return ['i', o.lit ? 't-torch' : 't-wall'];
      case 'blever': return [o.ready > D.t ? '\\' : '/', 't-lever'];
    }
    return null;
  };
  D.mobVisible = function (m, x, y) {
    const i = idx(x, y);
    if (m.d.glow && M.los[i]) return true;
    if (!M.vis[i]) return false;
    const near = Math.abs(x - P.x) <= 2 && Math.abs(y - P.y) <= 2;
    return !((m.d.hide || M.tiles[i] === '"') && !near && !D.revealed);
  };
  const escCh = c => (c === '<' ? '&lt;' : c === '>' ? '&gt;' : c === '&' ? '&amp;' : c);
  D.render = function () {
    const el = document.getElementById('dmap');
    if (!el || !M) return;
    const S = G.S, vw = Math.min(VW, M.w), vh = Math.min(VH, M.h);
    const cx = G.clamp(P.x - (vw >> 1), 0, M.w - vw), cy = G.clamp(P.y - (vh >> 1), 0, M.h - vh);
    const ent = new Map();
    for (const f of M.fx) for (const [x, y] of f.cells) if (inb(x, y) && M.vis[idx(x, y)]) ent.set(idx(x, y), [f.ch, f.cls, 1]);
    for (const a of M.allies) if (inb(a.x, a.y) && M.vis[idx(a.x, a.y)]) ent.set(idx(a.x, a.y), ['°', 't-pet', 1]);
    for (const pr of M.projs) if (M.vis[idx(pr.x, pr.y)]) ent.set(idx(pr.x, pr.y), [pr.ch, pr.own === 'mob' ? 't-eproj' : 't-proj', 1]);
    for (const m of M.mobs) {
      const d = m.d;
      let cls = 'm-' + d.col + (d.boss ? ' m-boss' : '');
      if (m.hit > D.t) cls += ' t-hit';
      else if (m.frozen > D.t) cls += ' m-frozen';
      else if (D.isShielded(m)) cls += ' m-shield';
      for (let dy = -m.r; dy <= m.r; dy++) for (let dx = -m.r; dx <= m.r; dx++) {
        const x = m.x + dx, y = m.y + dy;
        if (inb(x, y) && D.mobVisible(m, x, y)) ent.set(idx(x, y), [m.r ? d.sprite[dy + 1][dx + 1] : d.ch, cls, 1]);
      }
    }
    const pcls = 't-player' + (S.inhaled >= 1e6 ? ' glow2' : S.inhaled >= 1e4 ? ' glow1' : '') + (P.hit > D.t ? ' t-phit' : '');
    ent.set(idx(P.x, P.y), ['@', pcls, 1]);
    const edge2 = M.def.outdoor ? 1e9 : (D.radius() - 0.8) ** 2;
    let html = '';
    for (let y = cy; y < cy + vh; y++) {
      let cur = null, buf = '';
      for (let x = cx; x < cx + vw; x++) {
        const i = idx(x, y);
        let g = ent.get(i);
        if (!g) {
          if (M.vis[i] || M.seen[i]) {
            const o = M.objs.get(i);
            g = (o && D.objGlyph(o)) || D.tileGlyph(x, y, M.tiles[i]);
            if (!M.vis[i]) g = [g[0], 't-dim'];
            else if (!M.lit[i] && (x - P.x) ** 2 + (y - P.y) ** 2 > edge2) g = [g[0], g[1] + ' t-edge'];
          } else g = [' ', 't-void'];
        }
        if (g[1] !== cur) {
          if (cur !== null) html += `<span class="${cur}">${buf}</span>`;
          cur = g[1];
          buf = '';
        }
        buf += escCh(g[0]);
      }
      html += `<span class="${cur}">${buf}</span>\n`;
    }
    el.innerHTML = html;
  };

  // ------------------------------------------------------------ player actions
  D.tryMove = function (dx, dy) {
    if (!D.active || D.t < P.nextMove || P.slide) return;
    if (!dx && !dy) { P.nextMove = D.t + 200; return; }
    P.dir = [dx, dy];
    const st = G.calc();
    const delay = st.moveDelay * (P.slowUntil > D.t ? 1.8 : 1);
    P.nextMove = D.t + delay;
    if (st.reach > 1 && !D.mobAt(P.x + dx, P.y + dy) && !D.opaque(P.x + dx, P.y + dy)) {
      const far = D.mobAt(P.x + 2 * dx, P.y + 2 * dy);
      if (far && !far.dormant) { D.attack(far); return; }
    }
    const nx = P.x + dx, ny = P.y + dy;
    const mob = D.mobAt(nx, ny);
    if (mob) { D.attack(mob); return; }
    if (!inb(nx, ny)) return;
    const i = idx(nx, ny), o = M.objs.get(i);
    if (o && D.blocks(o)) { P.nextMove += 120; D.interact(o, nx, ny); return; }
    const t = M.tiles[i];
    if (t === '%') {
      if (G.has('pick')) D.breakWall(nx, ny);
      else D.msg('The wall here is cracked and crumbly. If only you had something to dig with.');
      return;
    }
    if (!D.walkable(nx, ny)) { P.nextMove = D.t; return; }
    P.x = nx;
    P.y = ny;
    G.S.stats.steps++;
    if (t === '&' && !M.ms.o['f' + key(nx, ny)]) {
      M.ms.o['f' + key(nx, ny)] = 1;
      D.msg('You step straight through the wall. It was never really there!', 'good');
    }
    if (t === ':' && !st.grip) { P.slide = [dx, dy]; P.nextSlide = D.t + 55; }
    D.onStep();
    if (!D.active) return;
    D.computeFov();
    D.computeFlow();
  };
  D.slideStep = function () {
    const [dx, dy] = P.slide, nx = P.x + dx, ny = P.y + dy;
    if (!D.walkable(nx, ny) || D.mobAt(nx, ny)) { P.slide = null; return; }
    P.x = nx;
    P.y = ny;
    if (M.tiles[idx(nx, ny)] !== ':') P.slide = null;
    else P.nextSlide = D.t + 55;
    D.onStep();
    if (!D.active) return;
    D.computeFov();
    D.computeFlow();
  };
  D.breakWall = function (x, y) {
    M.tiles[idx(x, y)] = M.def.floor;
    M.ms.o[key(x, y)] = 1;
    G.S.stats.broken++;
    D.msg('The cracked wall crumbles away. A hidden passage!', 'good');
    D.computeLit();
    D.computeFov();
    D.computeFlow();
  };
  D.onStep = function () {
    const i = idx(P.x, P.y), o = M.objs.get(i), k = key(P.x, P.y);
    if (!o) return;
    if (o.t === 'exit') { D.leave(); return; }
    if (o.t === 'motes') {
      const n = Math.round(G.rand(M.def.motes[0], M.def.motes[1]) * (1 + 0.5 * (G.S.ng || 0)));
      M.objs.delete(i);
      G.give('motes', n, { quiet: true });
      D.msg(`You scoop up ${G.fmt(n)} motes.`, 'loot');
    } else if (o.t === 'page') {
      M.objs.delete(i);
      D.held = null;
      G.gainPage(o.id);
    } else if (o.t === 'item') {
      M.objs.delete(i);
      M.ms.o[k] = 1;
      D.held = null;
      G.give(o.id, o.n, { quiet: true });
      D.msg(`You pick up: ${G.itemName(o.id, o.n)}.`, 'loot');
    } else if (o.t === 'trigger') {
      const f = G.TRIGGERS[o.id];
      if (f) { D.held = null; f(o); }
    }
  };
  D.interact = function (o, x, y) {
    const S = G.S, k = key(x, y);
    D.held = null;
    D.queued = null;
    switch (o.t) {
      case 'chest': {
        if (o.open) { D.msg('Empty.'); return; }
        o.open = true;
        M.ms.o[k] = 1;
        const got = [];
        for (const [id, n] of o.items) { G.give(id, n, { quiet: true }); got.push(`${G.fmt(n)} ${G.itemName(id, n)}`); }
        D.msg(`You open the chest: ${got.join(', ')}.`, 'loot');
        G.log(`Chest: ${got.join(', ')}`, 'loot');
        return;
      }
      case 'sign': G.modal(`<div class="txt">${G.esc(o.text)}</div>`, [{ label: 'OK' }]); return;
      case 'shrine': {
        if (M.def.dim) { D.lightPenalty = 0; D.computeFov(); D.msg('You press your hands to the shrine. Your light swells back.', 'good'); }
        if (P.used.has(o)) { if (!M.def.dim) D.msg('The shrine\'s light is spent for now.'); return; }
        P.used.add(o);
        S.hp = G.calc().maxHp;
        P.lumen = G.calc().lumMax;
        D.msg('Warm light washes over you. You are fully restored.', 'good');
        return;
      }
      case 'npc': { const n = G.NPCS[o.id]; if (n) n.talk(o); return; }
      case 'door':
        if (G.has(o.key)) {
          o.open = true;
          M.ms.o[k] = 1;
          D.msg(`You unlock it with the ${G.itemName(o.key, 1)}.`, 'good');
          D.computeFov();
          D.computeFlow();
        } else D.msg(`Locked. You need the ${G.itemName(o.key, 1)}.`);
        return;
      case 'lever': {
        const on = !M.ms.o['lv_' + o.id];
        if (on) M.ms.o['lv_' + o.id] = 1; else delete M.ms.o['lv_' + o.id];
        D.msg(on ? 'CLUNK. Somewhere, gears turn.' : 'CLONK. The lever springs back.', 'good');
        D.computeFov();
        D.computeFlow();
        return;
      }
      case 'gate': D.msg('A heavy gate. It must be opened from somewhere else.'); return;
      case 'torch': D.msg('A torch, burning steadily.'); return;
      case 'lamp':
        if (o.lit) { D.msg('The old lamp burns brightly again.'); return; }
        o.lit = true;
        M.ms.o[k] = 1;
        S.flags.lamps = (S.flags.lamps || 0) + 1;
        D.msg(`You touch your lantern to the dead lamp, and it catches. (${S.flags.lamps}/3 of Odessa's lamps lit)`, 'good');
        D.computeLit();
        D.computeFov();
        return;
      case 'blever': {
        if (o.ready > D.t) { D.msg('The lever is still resetting.'); return; }
        o.ready = D.t + 12000;
        const g = M.mobs.find(m => m.id === 'golem');
        if (g) { g.st.down = D.t + 6500; D.msg('CLANK! The Unfinished\'s shield flickers and dies. Strike now!', 'good'); }
        else D.msg('CLANK. Nothing happens.');
      }
    }
  };
  D.attack = function (mob) {
    if (D.t < P.nextAtk) return;
    const st = G.calc();
    P.nextAtk = D.t + st.cd;
    D.target = mob;
    if (mob.dormant) { D.msg('He does not stir. Something about this feels wrong.'); return; }
    let dmg = G.rand(st.dmg[0], st.dmg[1]) * (1 + st.dmgPct / 100) * (P.buffs.tonic > D.t ? 1.5 : 1);
    const crit = Math.random() < st.crit / 100;
    if (crit) dmg *= 2;
    D.damageMob(mob, dmg, { melee: 1, crit });
  };
  D.weaponAvg = function () {
    const st = G.calc();
    return (st.dmg[0] + st.dmg[1]) / 2 * (1 + st.dmgPct / 100) * (P.buffs.tonic > D.t ? 1.5 : 1);
  };
  D.damageMob = function (m, raw, o = {}) {
    if (m.hp <= 0) return;
    const d = m.d;
    if (m.dormant) return;
    if (D.isShielded(m)) { if (o.melee) D.msg(`Your blow rings off ${d.n}'s shield! Find a way to drop it.`); return; }
    if (m.id === 'unlit' && D.radius() < 3) { if (o.melee) D.msg('The dark swallows your attack. You need more light! Touch a shrine.', 'bad'); return; }
    let dmg = Math.max(1, Math.round(raw - (d.def || 0)));
    if (m.stunned > D.t) dmg *= 2;
    m.hp -= dmg;
    m.hit = D.t + 140;
    if (!m.aware) { m.aware = true; m.lastSeen = D.t; }
    if (!o.ally) D.target = m;
    if (o.melee) {
      const st = G.calc();
      if (st.life) G.S.hp = Math.min(st.maxHp, G.S.hp + dmg * st.life / 100);
      if (st.burn && Math.random() < st.burn / 100) { m.burnUntil = D.t + 3000; m.burnDmg = Math.max(2, dmg * 0.2); }
      if (st.freeze && Math.random() < st.freeze / 100) { m.frozen = D.t + (d.boss ? 700 : 1600); }
      if (o.crit) D.msg(`Critical hit! ${dmg} damage.`, 'gold');
    }
    if (m.hp <= 0) D.killMob(m);
  };
  D.killMob = function (m) {
    const S = G.S, d = m.d;
    M.mobs = M.mobs.filter(x => x !== m);
    if (D.target === m) D.target = null;
    G.recordKill(m.id);
    const got = [];
    for (const [id, a, b, ch] of d.drops) {
      if (Math.random() >= ch) continue;
      const n = Math.round(G.rand(a, b) * (id === 'motes' ? 1 + 0.5 * (S.ng || 0) : 1));
      G.give(id, n, { quiet: true });
      got.push(id === 'motes' ? `${G.fmt(n)} motes` : n > 1 ? `${n} ${G.itemName(id, n)}` : G.itemName(id, 1));
    }
    D.msg(`${d.n} is defeated.${got.length ? ' (' + got.join(', ') + ')' : ''}`, d.boss ? 'gold' : 'loot');
    if (d.boss) {
      S.flags['k_' + m.id] = 1;
      for (const c of m.summons) if (c.hp > 0) { c.hp = 0; M.mobs = M.mobs.filter(x => x !== c); }
      G.save();
      const f = G.BOSS_KILL[m.id];
      if (f) f(m);
    }
  };
  D.hurt = function (raw, src, pierce) {
    if (!D.active) return;
    const st = G.calc();
    let dmg = pierce ? raw : Math.max(Math.ceil(raw * 0.4), raw - st.arm);
    dmg = Math.max(1, Math.round(dmg));
    G.S.hp -= dmg;
    P.hit = D.t + 160;
    if (G.S.hp <= 0) { G.S.hp = 0; D.die(src); }
  };
  D.die = function (src) {
    const S = G.S;
    S.stats.deaths++;
    D.stop('hut');
    S.hp = 1;
    G.modal(`<div class="who">You fall.</div><div class="txt">${src && src !== 'cold' ? `The ${G.esc(src)} was too much for you. ` : src === 'cold' ? 'The cold creeps into your bones. ' : ''}Everything goes dark, darker even than usual.\n\nThen a small, cross voice: <span class="wick">"Up you get. Come on. Home."</span>\n\nYou wake in your hut with a scorched sleeve and no memory of the walk back. Everything you found is still in your pockets.</div>`, [{ label: 'Ow' }]);
  };
  D.stop = function (where) {
    D.active = false;
    D.held = null;
    G.view = where === 'hut' ? { tab: 'hut', loc: null, sub: null } : { tab: 'map', loc: M.id === 'shrine' ? 'lake' : M.id, sub: null };
    G.renderTabs();
    G.save();
    G.refresh();
  };
  D.leave = function () {
    G.log(`You return from ${M.def.n}.`);
    D.stop();
  };

  // ------------------------------------------------------------ spells & potions
  D.fxCells = function (cells, ch, cls, ms) { M.fx.push({ cells, ch, cls, until: D.t + ms }); };
  D.ring = function (x, y, r) {
    const c = [];
    for (let j = y - r; j <= y + r; j++) for (let i = x - r; i <= x + r; i++) if ((i !== x || j !== y) && inb(i, j) && !D.opaque(i, j)) c.push([i, j]);
    return c;
  };
  D.cast = function (id) {
    const S = G.S, sp = G.SPELLS[id];
    if (!D.active || !sp || !S.spells[id]) return;
    if (P.cds[id] > D.t) { D.msg(`${sp.n} is not ready yet.`); return; }
    if (P.lumen < sp.lum) { D.msg('Not enough lumen.'); return; }
    P.lumen -= sp.lum;
    P.cds[id] = D.t + sp.cd;
    const avg = D.weaponAvg(), [dx, dy] = P.dir;
    const near = r => M.mobs.filter(m => !m.dormant && D.footCheb(m, P.x, P.y) <= r);
    switch (id) {
      case 'spark':
        M.projs.push({ x: P.x, y: P.y, dx, dy, dmg: avg * 0.8 + 5, ch: dx ? '-' : '|', own: 'player', spd: 35, next: D.t, range: 11 });
        break;
      case 'mend': {
        const st = G.calc();
        S.hp = Math.min(st.maxHp, S.hp + st.maxHp * 0.3);
        D.msg('Light knits your wounds together.', 'good');
        break;
      }
      case 'flare':
        D.fxCells(D.ring(P.x, P.y, 1), '*', 't-proj', 220);
        for (const m of near(1)) D.damageMob(m, avg * 1.5 + 8, { light: 1 });
        for (const [cx, cy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
          if (inb(P.x + cx, P.y + cy) && M.tiles[idx(P.x + cx, P.y + cy)] === '%') D.breakWall(P.x + cx, P.y + cy);
        }
        break;
      case 'blink': {
        let bx = P.x, by = P.y;
        for (let k = 1; k <= 4; k++) {
          const nx = P.x + dx * k, ny = P.y + dy * k;
          if (D.opaque(nx, ny) || (!D.walkable(nx, ny) && M.tiles[idx(nx, ny)] !== '~')) break;
          if (D.walkable(nx, ny) && !D.mobAt(nx, ny)) { bx = nx; by = ny; }
        }
        P.x = bx;
        P.y = by;
        D.fxCells([[bx, by]], '*', 't-proj', 150);
        D.onStep();
        if (!D.active) return;
        D.computeFov();
        D.computeFlow();
        break;
      }
      case 'frost':
        D.fxCells(D.ring(P.x, P.y, 3), '*', 't-ice', 300);
        for (const m of near(3)) m.frozen = D.t + (m.d.boss ? 1500 : 4000);
        D.msg('Frost blooms around you. Foes freeze solid.', 'cyan');
        break;
      case 'reveal':
        D.reveal(15);
        D.revealed = true;
        D.msg('The shape of this place unfolds in your mind. Secret walls shimmer.', 'cyan');
        break;
      case 'sunburst': {
        const hit = M.mobs.filter(m => !m.dormant && M.vis[idx(m.x, m.y)]);
        D.fxCells(hit.map(m => [m.x, m.y]), '*', 't-proj', 300);
        for (const m of hit) D.damageMob(m, avg * 3 + 60, { light: 1 });
        D.msg(`Searing light! (${hit.length} ${G.plural(hit.length, 'foe')} struck)`, 'gold');
        break;
      }
      case 'swarm':
        for (let k = 0; k < 3; k++) M.allies.push({ kind: 'swarm', x: P.x, y: P.y, nextMove: 0, nextAtk: 0, until: D.t + 15000, dmg: Math.max(4, avg * 0.6) });
        D.msg('A cloud of silver moths bursts from your lantern!', 'cyan');
        break;
    }
    D.hud(true);
  };
  D.usePotion = function (id) {
    const S = G.S;
    if (!D.active || !G.has(id)) return;
    const st = G.calc(), it = G.ITEMS[id];
    switch (id) {
      case 'heal': case 'greater':
        if (S.hp >= st.maxHp) { D.msg('You are already at full health.'); return; }
        S.hp = Math.min(st.maxHp, S.hp + st.maxHp * (id === 'heal' ? 0.4 : 1));
        break;
      case 'tonic': P.buffs.tonic = D.t + 60000; break;
      case 'shadow':
        P.buffs.shadow = D.t + 10000;
        for (const m of M.mobs) if (!m.d.boss) m.aware = false;
        break;
      case 'clarity':
        D.revealed = true;
        M.seen.fill(1);
        break;
      case 'lumen': P.lumen = st.lumMax; break;
      case 'bomb': {
        D.fxCells(D.ring(P.x, P.y, 2), '*', 't-torch', 300);
        for (const m of M.mobs.filter(x => !x.dormant && D.footCheb(x, P.x, P.y) <= 2)) D.damageMob(m, 40 + D.weaponAvg() * 2.5, { light: 1 });
        for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) if (inb(P.x + i, P.y + j) && M.tiles[idx(P.x + i, P.y + j)] === '%') D.breakWall(P.x + i, P.y + j);
        break;
      }
      default: return;
    }
    G.take(id);
    D.msg(`You use the ${it.n}.`, 'good');
    D.hud(true);
  };

  // ------------------------------------------------------------ foes
  D.mobAttack = function (m) {
    D.hurt(G.rand(m.d.dmg[0], m.d.dmg[1]) * D.ngMult(), m.d.n);
    if (!D.target) D.target = m;
  };
  D.stepTo = function (m, x, y) { if (D.canStand(m, x, y)) { m.x = x; m.y = y; return true; } return false; };
  D.stepToward = function (m) {
    if (m.r === 0) {
      let best = null, bv = 1e9;
      for (const [dx, dy] of N4) {
        const nx = m.x + dx, ny = m.y + dy;
        if (!inb(nx, ny)) continue;
        const f = M.flow[idx(nx, ny)];
        if (f >= 0 && f < bv && D.canStand(m, nx, ny)) { bv = f; best = [nx, ny]; }
      }
      if (best && bv < (M.flow[idx(m.x, m.y)] >= 0 ? M.flow[idx(m.x, m.y)] : 1e9)) { m.x = best[0]; m.y = best[1]; return; }
    }
    const dx = Math.sign(P.x - m.x), dy = Math.sign(P.y - m.y);
    const first = Math.abs(P.x - m.x) >= Math.abs(P.y - m.y);
    if (first) { if (!(dx && D.stepTo(m, m.x + dx, m.y))) if (dy) D.stepTo(m, m.x, m.y + dy); }
    else if (!(dy && D.stepTo(m, m.x, m.y + dy))) if (dx) D.stepTo(m, m.x + dx, m.y);
  };
  D.stepAway = function (m) {
    let best = null, bv = Math.abs(P.x - m.x) + Math.abs(P.y - m.y);
    for (const [dx, dy] of N4) {
      const nx = m.x + dx, ny = m.y + dy, v = Math.abs(P.x - nx) + Math.abs(P.y - ny);
      if (v > bv && D.canStand(m, nx, ny)) { bv = v; best = [nx, ny]; }
    }
    if (best) { m.x = best[0]; m.y = best[1]; }
  };
  D.wander = function (m, free) {
    const [dx, dy] = G.pick(N4), nx = m.x + dx, ny = m.y + dy;
    if (!free && (Math.abs(nx - m.home.x) > 4 || Math.abs(ny - m.home.y) > 4)) return;
    D.stepTo(m, nx, ny);
  };
  D.shoot = function (m) {
    const r = m.d.ranged;
    const vertical = Math.abs(P.x - m.x) <= m.r;
    const dx = vertical ? 0 : Math.sign(P.x - m.x), dy = vertical ? Math.sign(P.y - m.y) : 0;
    let ch = r.ch;
    if (ch === '-' && vertical) ch = '|';
    M.projs.push({ x: m.x + dx * m.r, y: m.y + dy * m.r, dx, dy, dmg: G.rand(r.dmg[0], r.dmg[1]) * D.ngMult(), ch, own: 'mob', spd: r.spd, next: D.t, range: r.r + 3, slow: r.slow, src: m.d.n });
  };
  D.summon = function (m) {
    const s = m.d.summon;
    if (!s || !m.aware || D.t < m.summonT) return;
    m.summonT = D.t + s.every;
    m.summons = m.summons.filter(x => x.hp > 0 && M.mobs.includes(x));
    if (m.summons.length >= s.max) return;
    for (let k = 0; k < 25; k++) {
      const x = m.x + G.rand(-m.r - 2, m.r + 2), y = m.y + G.rand(-m.r - 2, m.r + 2);
      if (!D.mobAt(x, y) && !(x === P.x && y === P.y) && D.walkable(x, y) && M.tiles[idx(x, y)] !== '&') {
        const c = D.makeMob(s.mob, x, y);
        c.aware = true;
        c.lastSeen = D.t;
        M.mobs.push(c);
        m.summons.push(c);
        D.msg(`${m.d.n} calls forth a ${c.d.n}!`);
        return;
      }
    }
  };
  D.AI = {
    summoner(m) { D.summon(m); },
    charger(m) {
      if (m.st.charge) {
        if (D.t < m.st.cnext) return 'skip';
        m.st.cnext = D.t + 75;
        const [dx, dy] = m.st.charge, nx = m.x + dx, ny = m.y + dy;
        if (Math.abs(P.x - nx) <= m.r && Math.abs(P.y - ny) <= m.r) {
          m.st.charge = null;
          m.nextMove = D.t + 900;
          D.msg('The Briar Stag gores you!', 'bad');
          D.hurt(G.rand(m.d.dmg[0], m.d.dmg[1]) * 2 * D.ngMult(), m.d.n);
          if (!D.active) return 'skip';
          for (let k = 0; k < 2; k++) {
            const px = P.x + dx, py = P.y + dy;
            if (!D.walkable(px, py) || D.mobAt(px, py)) break;
            P.x = px;
            P.y = py;
          }
          D.computeFov();
          D.computeFlow();
          return 'skip';
        }
        if (!D.stepTo(m, nx, ny)) {
          m.st.charge = null;
          m.stunned = D.t + 2500;
          D.msg('The Briar Stag crashes into the trees and staggers, dazed! (double damage)', 'gold');
        }
        return 'skip';
      }
      if (m.aware && D.t >= (m.st.ready || 3000)) {
        const dx = P.x - m.x, dy = P.y - m.y;
        let dir = null;
        if (Math.abs(dy) <= m.r && Math.abs(dx) >= 3) dir = [Math.sign(dx), 0];
        else if (Math.abs(dx) <= m.r && Math.abs(dy) >= 3) dir = [0, Math.sign(dy)];
        if (dir && D.los(m.x, m.y, P.x, P.y)) {
          m.st.charge = dir;
          m.st.cnext = D.t + 650;
          m.st.ready = D.t + 5000;
          D.msg('The Briar Stag lowers its antlers and paws the ground...', 'bad');
          return 'skip';
        }
      }
      return '';
    },
    eel(m) {
      D.summon(m);
      if (!m.aware || D.t < (m.st.blink || 4000)) return '';
      m.st.blink = D.t + 4800;
      for (let k = 0; k < 40; k++) {
        const x = P.x + G.rand(-3, 3), y = P.y + G.rand(-3, 3);
        if (D.footDist({ x, y, r: 1 }, P.x, P.y) >= 1 && D.canStand(m, x, y)) {
          m.x = x;
          m.y = y;
          m.nextAtk = D.t + 700;
          D.msg('The Lantern Eel vanishes into the dark water... and surges up beside you!', 'bad');
          return 'skip';
        }
      }
      return '';
    },
    golem(m) {
      if (m.aware && D.t >= (m.st.slam || 5000) && D.footCheb(m, P.x, P.y) <= 2) {
        m.st.slam = D.t + 6000;
        D.fxCells(D.ring(m.x, m.y, 3), '#', 't-torch', 260);
        D.msg('The Unfinished slams its fists into the floor! The ruins shake.', 'bad');
        D.hurt(G.rand(m.d.dmg[0], m.d.dmg[1]) * 0.8 * D.ngMult(), m.d.n);
      }
      return '';
    },
    matron(m) {
      D.summon(m);
      if (m.aware && D.t >= (m.st.shard || 2500)) {
        m.st.shard = D.t + 2600;
        for (const [dx, dy] of N4) M.projs.push({ x: m.x + dx, y: m.y + dy, dx, dy, dmg: G.rand(16, 26) * D.ngMult(), ch: '*', own: 'mob', spd: 90, next: D.t, range: 14, src: m.d.n });
      }
      return '';
    },
    mothking(m) {
      const pct = m.hp / m.max;
      if (pct < 0.66) D.summon(m);
      m.st.fast = pct < 0.33;
      if (!m.aware) return '';
      if (D.t >= (m.st.gust || 4000) && D.footCheb(m, P.x, P.y) <= 5) {
        m.st.gust = D.t + (pct < 0.33 ? 3800 : 5200);
        const gx = Math.abs(P.x - m.x) >= Math.abs(P.y - m.y) ? Math.sign(P.x - m.x) || 1 : 0;
        const gy = gx ? 0 : Math.sign(P.y - m.y) || 1;
        for (let k = 0; k < 3; k++) {
          const nx = P.x + gx, ny = P.y + gy;
          if (!D.walkable(nx, ny) || D.mobAt(nx, ny)) break;
          P.x = nx;
          P.y = ny;
        }
        D.msg('Mothrael beats his vast wings. A gale hurls you backwards!', 'bad');
        D.hurt(G.rand(10, 18) * D.ngMult(), m.d.n);
        if (!D.active) return 'skip';
        D.computeFov();
        D.computeFlow();
      }
      if (pct < 0.66 && D.t >= (m.st.dust || 0)) {
        m.st.dust = D.t + 11000;
        D.dustUntil = D.t + 5000;
        D.msg('He shakes his wings. Glittering dust smothers your light!', 'bad');
        D.computeFov();
      }
      return '';
    },
    unlit(m) {
      D.summon(m);
      if (!m.aware) return '';
      if (D.t >= (m.st.drain || 3000)) {
        m.st.drain = D.t + 4500;
        if (D.lightPenalty < G.calc().radius - 1) {
          D.lightPenalty++;
          D.msg('The Unlit breathes in. Your light shrinks.', 'bad');
          D.computeFov();
        }
      }
      return '';
    },
  };
  D.mobTick = function (m) {
    const d = m.d;
    if (m.dormant) return;
    if (m.burnUntil > D.t && D.t >= m.burnNext) {
      m.burnNext = D.t + 600;
      D.damageMob(m, m.burnDmg, { dot: 1, ally: 1 });
      if (m.hp <= 0) return;
    }
    if (m.frozen > D.t || m.stunned > D.t) return;
    if (d.ai && D.AI[d.ai] && D.AI[d.ai](m) === 'skip') return;
    if (!D.active) return;
    const dist = D.footDist(m, P.x, P.y);
    const hidden = P.buffs.shadow > D.t && dist > 1;
    const aggro = M.tiles[idx(P.x, P.y)] === '"' ? Math.ceil(d.aggro / 2) : d.aggro;
    if (!hidden && dist <= aggro && D.los(m.x, m.y, P.x, P.y)) {
      if (!m.aware) { m.aware = true; m.nextAtk = Math.max(m.nextAtk, D.t + 400); }
      m.lastSeen = D.t;
    } else if (m.aware && !d.boss && (hidden || D.t - m.lastSeen > 7000)) m.aware = false;
    if (dist === 1 && m.aware && !d.flee) {
      if (!m.adj) { m.adj = true; m.nextAtk = Math.max(m.nextAtk, D.t + 300); }
      if (D.t >= m.nextAtk) { m.nextAtk = D.t + d.atk; D.mobAttack(m); }
      return;
    }
    m.adj = false;
    if (D.t < m.nextMove) return;
    m.nextMove = D.t + Math.min(d.spd, 5000) * (m.st.fast ? 0.6 : 1) * (0.85 + Math.random() * 0.3);
    if (!m.aware) { if (!d.still && Math.random() < 0.3) D.wander(m, false); return; }
    if (d.flee) { D.stepAway(m); return; }
    if (d.erratic && Math.random() < d.erratic) { D.wander(m, true); return; }
    if (d.ranged) {
      const aligned = (Math.abs(P.x - m.x) <= m.r || Math.abs(P.y - m.y) <= m.r) && dist <= d.ranged.r && D.los(m.x, m.y, P.x, P.y);
      if (aligned && D.t >= m.nextAtk) { D.shoot(m); m.nextAtk = D.t + d.atk; return; }
      if (d.still) return;
      if (d.keep && dist < d.keep) { D.stepAway(m); return; }
    }
    if (!d.still) D.stepToward(m);
  };
  D.alliesTick = function () {
    M.allies = M.allies.filter(a => !a.until || a.until > D.t);
    for (const a of M.allies) {
      if (D.t >= a.nextAtk) {
        const tgt = M.mobs.find(m => !m.dormant && D.footDist(m, a.x, a.y) === 1);
        if (tgt) {
          D.damageMob(tgt, a.kind === 'pip' ? G.pipDmg() : a.dmg, { ally: 1 });
          a.nextAtk = D.t + (a.kind === 'pip' ? 1400 : 900);
          continue;
        }
      }
      if (D.t < a.nextMove) continue;
      a.nextMove = D.t + 200;
      let goal = null, best = 7;
      for (const m of M.mobs) {
        if (m.dormant || D.isShielded(m)) continue;
        const dd = D.footDist(m, a.x, a.y);
        if (dd < best && (m.aware || dd < 3)) { best = dd; goal = m; }
      }
      let tx = P.x, ty = P.y;
      if (goal) { tx = goal.x; ty = goal.y; } else if (Math.abs(a.x - P.x) + Math.abs(a.y - P.y) <= 2) continue;
      const opts = N4.map(([dx, dy]) => [a.x + dx, a.y + dy])
        .filter(([x, y]) => D.walkable(x, y) && !D.mobAt(x, y) && M.tiles[idx(x, y)] !== '&')
        .sort((p, q) => (Math.abs(p[0] - tx) + Math.abs(p[1] - ty)) - (Math.abs(q[0] - tx) + Math.abs(q[1] - ty)));
      if (opts.length) { a.x = opts[0][0]; a.y = opts[0][1]; }
      if (Math.abs(a.x - P.x) + Math.abs(a.y - P.y) > 12) { a.x = P.x; a.y = P.y; }
    }
  };
  D.projTick = function () {
    M.projs = M.projs.filter(pr => {
      while (D.t >= pr.next) {
        pr.next += pr.spd;
        const nx = pr.x + pr.dx, ny = pr.y + pr.dy;
        pr.range--;
        if (pr.own === 'mob' && nx === P.x && ny === P.y) {
          D.hurt(pr.dmg, pr.src);
          if (pr.slow) { P.slowUntil = D.t + 2200; D.msg('Sticky silk tangles your legs!', 'bad'); }
          return false;
        }
        if (pr.own === 'player') {
          const mob = D.mobAt(nx, ny);
          if (mob) { D.damageMob(mob, pr.dmg, { light: 1 }); return false; }
        }
        if (!inb(nx, ny) || D.opaque(nx, ny) || pr.range <= 0) return false;
        const o = M.objs.get(idx(nx, ny));
        if (o && D.blocks(o) && o.t !== 'gate') return false;
        pr.x = nx;
        pr.y = ny;
      }
      return true;
    });
  };

  // ------------------------------------------------------------ main tick & input
  D.tick = function (dt) {
    if (!D.active || G.modalOpen || document.hidden) return;
    dt = Math.min(dt, 100);
    D.t += dt;
    const st = G.calc(), S = G.S;
    P.lumen = Math.min(st.lumMax, P.lumen + st.lumRegen * dt / 1000);
    if (P.slide) { if (D.t >= P.nextSlide) D.slideStep(); }
    else if (D.queued && D.t >= P.nextMove) { const q = D.queued; D.queued = null; D.tryMove(q[0], q[1]); }
    else if (D.held) D.tryMove(D.held[0], D.held[1]);
    if (!D.active) return;
    for (const m of M.mobs.slice()) {
      if (m.hp > 0) D.mobTick(m);
      if (!D.active) return;
    }
    D.alliesTick();
    D.projTick();
    if (!D.active) return;
    if (M.def.cold && !st.cold && !D.warded) {
      D.coldT -= dt;
      if (D.coldT <= 0) {
        D.coldT = 2000;
        if (!D.nearShrine(3)) { D.msg('The cold bites.', 'bad'); D.hurt(Math.max(2, st.maxHp * 0.03), 'cold', true); }
      }
    }
    if (M.id === 'under' && S.flags.sang) {
      const u = M.mobs.find(m => m.id === 'unlit');
      if (u && u.aware) {
        D.allyT -= dt;
        if (D.allyT <= 0) {
          D.allyT = 9000;
          D.lightPenalty = 0;
          D.damageMob(u, u.max * 0.03, { light: 1, ally: 1 });
          D.msg('Mothrael spreads his wings and light pours over you!', 'cyan');
          D.computeFov();
        }
      }
    }
    if (!D.active) return;
    if (D.dustUntil && D.dustUntil <= D.t) { D.dustUntil = 0; D.computeFov(); }
    M.fx = M.fx.filter(f => f.until > D.t);
    D.render();
    D.hudT -= dt;
    if (D.hudT <= 0) { D.hudT = 100; D.hud(); }
  };
  D.keydown = function (e) {
    const k = e.key.toLowerCase();
    const dir = MOVE_KEYS[k];
    if (dir) {
      e.preventDefault();
      D.held = dir;
      D.heldKey = k;
      if (!e.repeat) {
        if (D.t >= P.nextMove && !P.slide) D.tryMove(dir[0], dir[1]);
        else D.queued = dir;
      }
      return;
    }
    if (k >= '1' && k <= '8') {
      const known = G.SPELL_ORDER.filter(s => G.S.spells[s]);
      const s = known[+k - 1];
      if (s) { e.preventDefault(); D.cast(s); }
      return;
    }
    if (POTION_KEYS[k]) { e.preventDefault(); D.usePotion(POTION_KEYS[k]); }
  };
  D.keyup = function (e) {
    if (e.key.toLowerCase() === D.heldKey) { D.held = null; D.heldKey = null; }
  };

  G.A.flee = () => { if (D.active) D.leave(); };
  G.A.dcast = id => D.cast(id);
  G.A.dpot = id => D.usePotion(id);
  G.A.dmove = arg => { const [x, y] = arg.split(',').map(Number); D.tryMove(x, y); };
  window.addEventListener('blur', () => { D.held = null; });
})();
