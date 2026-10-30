'use strict';
// Mothlight core: namespace, utilities, state, saving, resources, UI plumbing.
const G = window.G = {};
G.SAVE_KEY = 'mothlight.save.v1';

// ---------------------------------------------------------------- utilities
G.rand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
G.chance = p => Math.random() < p;
G.pick = a => a[Math.floor(Math.random() * a.length)];
G.clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
G.esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
G.now = () => Date.now();

G.fmt = function (n) {
  n = Math.floor(n);
  const a = Math.abs(n);
  if (a < 1e6) return n.toLocaleString('en-US');
  const units = [[1e15, 'Qa'], [1e12, 'T'], [1e9, 'B'], [1e6, 'M']];
  for (const [v, u] of units) if (a >= v) return (n / v).toFixed(2) + u;
  return String(n);
};
G.fmtRate = r => (r < 100 ? r.toFixed(1) : G.fmt(r));
G.fmtTime = function (ms) {
  let s = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(s / 3600); s -= h * 3600;
  const m = Math.floor(s / 60); s -= m * 60;
  if (h) return `${h}h ${m}m`;
  if (m) return `${m}m ${s}s`;
  return `${s}s`;
};
G.isNight = () => { const h = new Date().getHours(); return h >= 21 || h < 5; };
G.plural = (n, w) => (n === 1 ? w : w + 's');

// ---------------------------------------------------------------- state
G.defaultState = () => ({
  v: 1, created: Date.now(), last: Date.now(),
  name: 'Wanderer',
  motes: 0, total: 0, inhaled: 0, released: 0, fed: 0,
  glowcaps: 0, moonstones: 0,
  hp: 54,
  tabs: { hut: true, options: true },
  mem: {}, flags: {}, inv: {},
  eq: { weapon: null, body: null, head: null, feet: null, charm: null },
  spells: {}, lantern: 0, lenses: 0,
  locs: { hut: true }, seenLocs: {},
  garden: { plots: 3, p: [] },
  recipes: {}, sky: {}, pages: {}, beasts: {}, ach: {},
  maps: {}, bounty: null, riddles: {}, endings: {},
  stats: {
    time: 0, deaths: 0, kills: 0, steps: 0, jarClicks: 0, fished: 0, broken: 0,
    wellTossed: 0, wellOnes: 0, diceWins: 0, diceStreak: 0, brewed: 0, caught: 0, harvested: 0, runs: 0,
  },
  ng: 0,
});

G.isObj = o => o && typeof o === 'object' && !Array.isArray(o);
G.merge = function (def, obj) {
  for (const k in def) {
    if (obj[k] === undefined) obj[k] = def[k];
    else if (G.isObj(def[k]) && G.isObj(obj[k]) && Object.keys(def[k]).length) G.merge(def[k], obj[k]);
  }
  return obj;
};

G.S = G.defaultState();

G.save = function () {
  G.S.last = Date.now();
  try { localStorage.setItem(G.SAVE_KEY, JSON.stringify(G.S)); } catch (e) { /* storage unavailable */ }
};
G.load = function () {
  try {
    const raw = localStorage.getItem(G.SAVE_KEY);
    if (raw) { G.S = G.merge(G.defaultState(), JSON.parse(raw)); return true; }
  } catch (e) { console.warn('Load failed', e); }
  return false;
};
G.exportSave = () => btoa(unescape(encodeURIComponent(JSON.stringify(G.S))));
G.importSave = function (str) {
  const obj = JSON.parse(decodeURIComponent(escape(atob(str.trim()))));
  if (!obj || typeof obj.motes !== 'number') throw new Error('Not a Mothlight save');
  G.S = G.merge(G.defaultState(), obj);
  G.save();
  location.reload();
};
G.wipe = function () {
  G.noSave = true;
  try { localStorage.removeItem(G.SAVE_KEY); } catch (e) { /* ignore */ }
  location.reload();
};

// ---------------------------------------------------------------- resources
const CUR = { motes: 1, glowcaps: 1, moonstones: 1 };
G.isCur = id => !!CUR[id];
G.count = id => (CUR[id] ? G.S[id] : (G.S.inv[id] || 0));
G.has = (id, n = 1) => G.count(id) >= n;
G.itemName = function (id, n = 2) {
  if (id === 'motes') return G.plural(n, 'mote');
  if (id === 'glowcaps') return G.plural(n, 'glowcap');
  if (id === 'moonstones') return G.plural(n, 'moonstone');
  const it = G.ITEMS[id];
  return it ? it.n : id;
};
G.give = function (id, n = 1, opts = {}) {
  const S = G.S;
  if (n <= 0) return;
  if (id === 'motes') { S.motes += n; S.total += n; }
  else if (CUR[id]) S[id] += n;
  else {
    if (!G.ITEMS[id]) { console.warn('Unknown item', id); return; }
    const first = !S.inv[id] && !S.flags['got_' + id];
    S.inv[id] = (S.inv[id] || 0) + n;
    S.flags['got_' + id] = 1;
    if (!S.tabs.pack) G.unlockTab('pack');
    const it = G.ITEMS[id];
    if (first && it.onFirst) it.onFirst();
  }
  if (!opts.quiet) G.log(`+${G.fmt(n)} ${G.itemName(id, n)}`, 'loot');
  G.invalidate();
};
G.take = function (id, n = 1) {
  const S = G.S;
  if (CUR[id]) S[id] = Math.max(0, S[id] - n);
  else {
    S.inv[id] = (S.inv[id] || 0) - n;
    if (S.inv[id] <= 0) {
      delete S.inv[id];
      for (const slot in S.eq) if (S.eq[slot] === id) S.eq[slot] = null;
    }
  }
  G.invalidate();
};
G.canPay = cost => Object.keys(cost).every(k => G.count(k) >= cost[k]);
G.pay = function (cost) {
  if (!G.canPay(cost)) return false;
  for (const k in cost) G.take(k, cost[k]);
  return true;
};
G.costText = cost => Object.keys(cost).map(k => `${G.fmt(cost[k])} ${G.itemName(k, cost[k])}`).join(', ');
G.encCost = c => Object.keys(c).map(k => k + ':' + c[k]).join('|');
G.decCost = function (s) {
  const o = {};
  s.split('|').forEach(p => { const i = p.lastIndexOf(':'); if (i > 0) o[p.slice(0, i)] = +p.slice(i + 1); });
  return o;
};

// ---------------------------------------------------------------- log, toasts, wick
G.logs = [];
G.log = function (msg, cls = '') {
  G.logs.push({ msg, cls });
  if (G.logs.length > 40) G.logs.shift();
  G.renderLog();
};
G.renderLog = function () {
  const el = document.getElementById('log');
  if (!el) return;
  el.innerHTML = G.logs.slice(-7).map(l => `<div class="l ${l.cls}">${l.msg}</div>`).join('');
};
G.wickLine = '';
G.say = function (msg, quiet) {
  G.wickLine = msg;
  G.lastWick = Date.now();
  if (!quiet) G.log(`<span class="wk">Wick:</span> ${msg}`, 'wick');
};
G.toast = function (html, ms = 4200) {
  const box = document.getElementById('toasts');
  if (!box) return;
  const d = document.createElement('div');
  d.className = 'toast';
  d.innerHTML = html;
  box.appendChild(d);
  setTimeout(() => d.remove(), ms);
};

// ---------------------------------------------------------------- tabs & views
G.TABS = [
  ['hut', 'Hut'], ['map', 'Map'], ['pack', 'Pack'], ['garden', 'Garden'], ['cauldron', 'Cauldron'],
  ['spells', 'Spells'], ['sky', 'Sky'], ['journal', 'Journal'], ['options', 'Options'],
];
G.newTabs = {};
G.unlockTab = function (id, quiet) {
  if (G.S.tabs[id]) return;
  G.S.tabs[id] = true;
  G.newTabs[id] = true;
  const t = G.TABS.find(x => x[0] === id);
  if (!quiet) G.log(`A new tab appears: <b>${t ? t[1] : id}</b>`, 'unlock');
  G.renderTabs();
};
G.view = { tab: 'hut', loc: null, sub: null };
G.go = function (tab, loc = null, sub = null) {
  if (G.Dun && G.Dun.active) return;
  G.view = { tab, loc, sub };
  delete G.newTabs[tab];
  G.renderTabs();
  G.refresh();
  window.scrollTo(0, 0);
};
G.SCREENS = {};
G.refresh = function () {
  if (G.Dun && G.Dun.active) return;
  const scr = G.SCREENS[G.view.tab];
  const el = document.getElementById('screen');
  if (!scr || !el) return;
  el.innerHTML = scr.render();
  G.updateBinds();
};
G.renderTabs = function () {
  const el = document.getElementById('tabs');
  if (!el) return;
  const locked = G.Dun && G.Dun.active;
  el.className = locked ? 'locked' : '';
  el.innerHTML = G.TABS.filter(t => G.S.tabs[t[0]]).map(t =>
    `<button class="tab ${G.view.tab === t[0] ? 'on' : ''} ${G.newTabs[t[0]] ? 'new' : ''}" data-act="tab" data-arg="${t[0]}">${t[1]}</button>`
  ).join('');
};

// ---------------------------------------------------------------- binds (live values)
G.B = {};
G.bind = (key, arg = '') => `<span data-b="${key}" data-i="${G.esc(arg)}">${G.B[key](arg)}</span>`;
G.updateBinds = function () {
  document.querySelectorAll('[data-b]').forEach(el => {
    const f = G.B[el.dataset.b];
    if (!f) return;
    const v = String(f(el.dataset.i));
    if (el._v !== v) { el.innerHTML = v; el._v = v; }
  });
  document.querySelectorAll('[data-cost]').forEach(el => {
    if (el.dataset.lock) return;
    el.disabled = !G.canPay(G.decCost(el.dataset.cost));
  });
};

// ---------------------------------------------------------------- buttons & actions
G.btn = function (label, act, arg = '', o = {}) {
  const attrs = [`class="btn ${o.cls || ''}"`, `data-act="${act}"`, `data-arg="${G.esc(arg)}"`];
  if (o.cost && !o.lock) attrs.push(`data-cost="${G.encCost(o.cost)}"`);
  if (o.lock) attrs.push('data-lock="1" disabled');
  else if (o.cost && !G.canPay(o.cost)) attrs.push('disabled');
  if (o.title) attrs.push(`title="${G.esc(o.title)}"`);
  const c = o.cost && !o.hideCost ? ` <span class="cost">(${G.costText(o.cost)})</span>` : '';
  return `<button ${attrs.join(' ')}>${label}${c}</button>`;
};
G.A = {};
G.A.tab = id => G.go(id);
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (!el || el.disabled) return;
  const f = G.A[el.dataset.act];
  if (f) { e.preventDefault(); f(el.dataset.arg, el, e); }
});

// ---------------------------------------------------------------- modal & dialogue
G.modalOpen = false;
G._mc = [];
G.modal = function (html, choices, opts = {}) {
  choices = choices || [{ label: 'Close' }];
  G._mc = choices;
  G._modalOpts = opts;
  const m = document.getElementById('modal');
  m.innerHTML = `<div class="modal-box ${opts.cls || ''}">${html}<div class="modal-choices">${
    choices.map((c, i) => `<button class="btn" data-act="mchoice" data-arg="${i}">${c.label}</button>`).join('')
  }</div></div>`;
  m.classList.remove('hidden');
  G.modalOpen = true;
  const first = m.querySelector('.modal-choices .btn');
  if (first) first.focus({ preventScroll: true });
};
G.closeModal = function () {
  const m = document.getElementById('modal');
  m.classList.add('hidden');
  m.innerHTML = '';
  G.modalOpen = false;
};
G.A.mchoice = function (i) {
  const c = G._mc[+i];
  G.closeModal();
  if (c && c.fn) c.fn();
  if (!G.modalOpen) G.refresh();
};
// Multi-page dialogue. lines: array of strings; choices shown on last page.
G.talk = function (who, lines, choices, opts = {}) {
  if (typeof lines === 'string') lines = [lines];
  let i = 0;
  const show = () => {
    const last = i === lines.length - 1;
    const body = `<div class="who">${who}</div><div class="txt">${lines[i]}</div>`;
    if (!last) G.modal(body, [{ label: 'Continue', fn: () => { i++; show(); } }], opts);
    else G.modal(body, choices || [{ label: 'Goodbye', fn: opts.onClose }], opts);
  };
  show();
};
G.confirm = function (html, yes, label = 'Yes') {
  G.modal(html, [{ label, fn: yes }, { label: 'Never mind' }]);
};

// ---------------------------------------------------------------- derived stats
G.calcV = 0;
G.invalidate = () => { G.calcV++; };
G.calc = function () {
  if (G._calc && G._calcV === G.calcV) return G._calc;
  const S = G.S;
  const o = {
    dmg: [1, 2], cd: 600, arm: 0, hp: 0, hpPct: 0, crit: 3, light: 0, spd: 0, lum: 0, lumregen: 0,
    cold: 0, life: 0, burn: 0, freeze: 0, reach: 1, mote: 0, grip: 0, dmgPct: 0,
  };
  const w = S.eq.weapon && G.ITEMS[S.eq.weapon];
  if (w) { o.dmg = w.dmg.slice(); o.cd = w.cd; o.reach = w.reach || 1; }
  for (const slot in S.eq) {
    const it = S.eq[slot] && G.ITEMS[S.eq[slot]];
    if (!it) continue;
    for (const k of ['arm', 'hp', 'hpPct', 'crit', 'light', 'spd', 'lum', 'lumregen', 'life', 'burn', 'freeze', 'mote', 'dmgPct']) o[k] += it[k] || 0;
    if (it.cold) o.cold = 1;
    if (it.grip) o.grip = 1;
  }
  if (S.sky.hound) o.hpPct += 15;
  if (S.sky.lamplighter) o.light += 1;
  if (S.sky.crown) o.dmgPct += 15;
  if (S.sky.door) o.spd += 15;
  if (S.flags.dawnDrunk) o.light += 1;
  if (S.flags.pipBond) o.crit += 2;
  const base = 50 + 4 * Math.sqrt(S.inhaled) + o.hp + (S.flags.soup ? 50 : 0);
  o.maxHp = Math.floor(base * (1 + o.hpPct / 100));
  const L = G.LANTERNS[S.lantern] || G.LANTERNS[0];
  o.radius = L.r + (S.lantern ? o.light : 0);
  o.cracks = !!L.cracks;
  o.lumMax = 20 + 10 * S.lantern + o.lum;
  o.lumRegen = (1 + o.lumregen / 100) * (S.sky.moth ? 2 : 1);
  o.moveDelay = Math.max(70, 150 - o.spd);
  G._calc = o; G._calcV = G.calcV;
  return o;
};
