'use strict';
// Screens: top bar, hut, pack, garden, cauldron, spells, sky, journal, options.

// ---------------------------------------------------------------- top bar
G.renderTop = function () {
  const S = G.S, el = document.getElementById('topbar');
  if (!el) return;
  const parts = ['<span class="logo">MOTHLIGHT</span>', `<span class="res">${G.bind('motes')} <span class="dim">${G.bind('rate')}</span></span>`];
  if (S.flags.got_glowcaps || S.glowcaps) parts.push(`<span class="res gc"><span class="v">${G.bind('glowcaps')}</span> glowcaps</span>`);
  if (S.flags.got_moonstones || S.moonstones) parts.push(`<span class="res ms"><span class="v">${G.bind('moonstones')}</span> moonstones</span>`);
  if (S.flags.showHp) parts.push(`<span class="res hp">HP <span class="v">${G.bind('hp')}</span></span>`);
  if (G.shooting) parts.push(G.btn('<span class="shooting">&#10022; A shooting mote! Catch it!</span>', 'catchShooting'));
  parts.push(G.bind('boost'));
  el.innerHTML = parts.join('');
};
G.B.motes = () => `<span class="v">${G.fmt(G.S.motes)}</span> ${G.plural(Math.floor(G.S.motes), 'mote')}`;
G.B.rate = () => (G.S.lenses || G.S.mem.warmth ? `(+${G.fmtRate(G.rate())}/s)` : '');
G.B.glowcaps = () => G.fmt(G.S.glowcaps);
G.B.moonstones = () => G.fmt(G.S.moonstones);
G.B.hp = () => `${Math.ceil(G.S.hp)}/${G.calc().maxHp}`;
G.B.boost = () => (G.boost && G.boost.until > Date.now() ? `<span class="gold">x${G.boost.mult} motes ${G.fmtTime(G.boost.until - Date.now())}</span>` : '');

// ---------------------------------------------------------------- hut
G.HUT = [
  ' ________________________________________________ ',
  '|  .------------------.                 _______  |',
  '|  |AAAAAAAAAAAAAAAAAA|                |       | |',
  '|  |BBBBBBBBBBBBBBBBBB|                |       | |',
  '|  |CCCCCCCCCCCCCCCCCC|                |    o  | |',
  "|  '------------------'                |       | |",
  '|     _______                          |       | |',
  '|    (_______)                F        |       | |',
  '|    |DDDDDDD|                G        |       | |',
  '|    |EEEEEEE|               |~|       |       | |',
  '|    |HHHHHHH|              _|_|_      |       | |',
  '|    |IIIIIII|         ____|_____|___  |_______| |',
  '|  ==|_______|==      |______________|           |',
  '|________________________________________________|',
];
G.skyRow = function (r) {
  const S = G.S, out = [];
  const sun = S.flags.sunrise || S.endings.newsun;
  for (let c = 0; c < 18; c++) {
    const h = (c * 7 + r * 13) % 11;
    let ch = h === 0 ? '.' : h === 5 && r !== 1 ? '*' : ' ';
    if (ch === '*' && Math.random() < 0.15) ch = '.';
    out.push([ch, sun ? 'gold' : 'faint']);
  }
  if (sun) {
    const face = S.endings.newsun ? ['\\ | /', '-(^-^)-', '/ | \\'] : ['\\ | /', '-( O )-', '/ | \\'];
    const f = face[r], off = r === 1 ? 10 : 11;
    for (let i = 0; i < f.length; i++) out[off + i] = [f[i], 'gold'];
  } else if (r === 1) { out[12] = ['(', 'dim']; out[13] = [' ', 'dim']; out[14] = [')', 'dim']; }
  if (S.flags.pip && r === 2) { const p = 3 + Math.floor(Date.now() / 1500) % 4; out[p] = ['°', 'cyan']; }
  return out.map(([c, k]) => `<span class="${k}">${c}</span>`).join('');
};
G.jarRow = function (r) {
  const m = G.S.motes, fill = m >= 1e5 ? 4 : m >= 1000 ? 3 : m >= 30 ? 2 : m >= 1 ? 1 : 0;
  if (3 - r >= fill) return '       ';
  let s = '';
  for (let i = 0; i < 7; i++) s += G.pick(['.', ':', '*', "'", '.', ' ', '°']);
  return `<span class="gold">${s}</span>`;
};
G.B.hutart = function () {
  const S = G.S;
  let f1 = ' ', f2 = ' ';
  if (S.endings.newsun) { f1 = ' '; f2 = ' '; }
  else if (G.wickAsleep) { f2 = '<span class="faint">.</span>'; }
  else if (S.flags.wick) {
    const big = S.flags.wickReady;
    f1 = `<span class="wick">${G.pick(['(', ')', ' ', big ? '*' : '('])}</span>`;
    f2 = `<span class="${big ? 'gold' : 'wick'}">${G.pick(['^', 'A', '^', 'a'])}</span>`;
  }
  return G.HUT.map(line => line
    .replace(/A{18}/, G.skyRow(0)).replace(/B{18}/, G.skyRow(1)).replace(/C{18}/, G.skyRow(2))
    .replace(/D{7}/, G.jarRow(0)).replace(/E{7}/, G.jarRow(1)).replace(/H{7}/, G.jarRow(2)).replace(/I{7}/, G.jarRow(3))
    .replace('F', f1).replace('G', f2)
    .replace('(_______)', '<span class="jar" data-down="shake" title="Shake the jar">(_______)</span>')
  ).join('\n');
};
G.B.bubble = () => G.esc(G.wickLine || '');
G.B.inhaled = () => `You have inhaled <b>${G.fmt(G.S.inhaled)}</b> ${G.plural(G.S.inhaled, 'mote')}.${G.S.flags.showHp ? ` <span class="dim">(max HP ${G.calc().maxHp})</span>` : ''}`;
G.B.released = () => `Released into the dark: <b>${G.fmt(G.S.released)}</b>${G.S.flags.pip ? ` <span class="dim">(Pip hits for ${G.pipDmg()})</span>` : ''}`;

G.SCREENS.hut = {
  render() {
    const S = G.S, f = S.flags;
    const right = [];
    right.push(`<div class="big-num">${G.bind('motes')}</div><div class="dim">${G.bind('rate')}</div>`);
    if (S.endings.newsun) right.push(`<div class="bubble">From the sky, enormous and delighted: "${G.esc(G.wickLine || 'HELLO DOWN THERE! I can see your house from here!')}"</div>`);
    else if (f.wick) right.push(`<div class="bubble">${G.bind('bubble')}</div>`);
    else right.push('<p class="dim">It has been dusk for a very, very long time.<br>On the windowsill, an old jar catches drifting motes of light.</p>');
    right.push('<div class="stack">');
    right.push(G.btn('Shake the jar', 'shake'));
    if (f.canInhale) right.push(`<div><hr class="sep">${G.bind('inhaled')}<br>${G.btn('Inhale 1', 'inhale', '1')}${S.total >= 100 ? G.btn('Inhale 50', 'inhale', '50') : ''}${S.total >= 2000 ? G.btn('Inhale all', 'inhale', 'all') : ''}</div>`);
    if (f.canRelease) right.push(`<div>${G.bind('released')}<br>${G.btn('Release 1', 'release', '1')}${S.total >= 200 ? G.btn('Release 50', 'release', '50') : ''}${S.total >= 5000 ? G.btn('Release 1,000', 'release', '1000') : ''}</div>`);
    if (f.wick && !S.endings.newsun) {
      const m = G.nextMemory();
      right.push('<hr class="sep">');
      if (m) right.push(`<div>${G.btn('Feed Wick', 'feed', '', { cost: { motes: m.cost } })}<div class="small dim">She might remember something. (${Object.keys(S.mem).length}/${G.MEMORIES.length} memories)</div></div>`);
      else right.push('<div class="dim">Wick remembers everything now.</div>');
      if (Object.keys(S.mem).length) right.push(G.btn('Remember together', 'rememberAll'));
    }
    if (S.mem.door) right.push(`<hr class="sep">${G.btn('Go outside', 'tab', 'map')}`);
    right.push('</div>');
    return `<div class="row"><div class="col art-col"><pre class="art" id="jar-art">${G.bind('hutart')}</pre></div><div class="col">${right.join('')}</div></div>`;
  },
};
G.A.rememberAll = function () {
  const html = G.MEMORIES.filter(m => G.S.mem[m.id]).map(m => `<h3>${m.t}</h3><div class="txt wick">${G.esc(m.txt)}</div>`).join('<hr class="sep">');
  G.modal(html, [{ label: 'Close' }], { cls: 'wide' });
};

// ---------------------------------------------------------------- pack
G.SCREENS.pack = {
  render() {
    const S = G.S, st = G.calc();
    const slots = G.GEAR_SLOTS.map(s => {
      const id = S.eq[s];
      return `<li><span class="kv">${s.padEnd(6)}</span> ${id ? `<b>${G.ITEMS[id].n}</b> <span class="small dim">${G.gearStats(G.ITEMS[id])}</span> ${G.btn('Unequip', 'unequip', s)}` : '<span class="faint">(empty)</span>'}</li>`;
    }).join('');
    const owned = t => Object.keys(S.inv).filter(id => G.ITEMS[id] && G.ITEMS[id].t === t);
    const gear = Object.keys(S.inv).filter(id => G.GEAR_SLOTS.includes((G.ITEMS[id] || {}).t) && !Object.values(S.eq).includes(id));
    const gearHtml = gear.map(id => {
      const it = G.ITEMS[id];
      return `<li>${G.btn('Equip', 'equip', id)} <b>${it.n}</b> <span class="dim">(${it.t})</span> <span class="small dim">${G.gearStats(it)}</span>${id === 'button' ? ' ' + G.btn('Press it', 'pressButton') : ''}<br><span class="small faint">${it.d}</span></li>`;
    }).join('') || '<li class="faint">Nothing spare.</li>';
    const pots = owned('potion').map(id => `<li>${G.btn('Use', 'usePotion', id)} <b>${G.ITEMS[id].n}</b> x${S.inv[id]} <span class="small dim">${G.ITEMS[id].d}</span></li>`).join('') || '<li class="faint">None.</li>';
    const counts = t => owned(t).map(id => `<li title="${G.esc(G.ITEMS[id].d)}">${G.ITEMS[id].n} <span class="gold">x${S.inv[id]}</span></li>`).join('') || '<li class="faint">None.</li>';
    const keys = owned('key').concat(owned('junk')).map(id => `<li><b>${G.ITEMS[id].n}</b>${S.inv[id] > 1 ? ` x${S.inv[id]}` : ''} <span class="small dim">${G.ITEMS[id].d}</span></li>`).join('') || '<li class="faint">None.</li>';
    const buttonEq = S.eq.charm === 'button' ? `<p>${G.btn('Press the button', 'pressButton')}</p>` : '';
    return `<div class="row">
      <div class="col"><div class="panel"><h3>Equipped</h3><ul class="list">${slots}</ul>${buttonEq}
        <hr class="sep"><div class="small kv">HP <b>${Math.ceil(S.hp)}/${st.maxHp}</b> &middot; damage <b>${st.dmg[0]}-${st.dmg[1]}</b> &middot; ${(1000 / st.cd).toFixed(1)} hits/s &middot; armor <b>${st.arm}</b> &middot; crit <b>${st.crit}%</b><br>
        light radius <b>${S.lantern ? st.radius : 1}</b> (${G.LANTERNS[S.lantern].n}) &middot; lumen <b>${st.lumMax}</b> &middot; move <b>${st.moveDelay}ms</b>${st.cold ? ' &middot; <span class="cyan">cold resist</span>' : ''}</div></div>
        <div class="panel"><h3>Gear</h3><ul class="list">${gearHtml}</ul></div>
        <div class="panel"><h3>Potions</h3><ul class="list">${pots}</ul></div></div>
      <div class="col"><div class="panel"><h3>Materials</h3><ul class="list grid2">${counts('mat')}</ul></div>
        <div class="panel"><h3>Ingredients & seeds</h3><ul class="list grid2">${counts('ing')}${owned('seed').length ? counts('seed') : ''}</ul></div>
        <div class="panel"><h3>Key items</h3><ul class="list">${keys}</ul></div></div></div>`;
  },
};

// ---------------------------------------------------------------- garden
G.B.plot = function (i) {
  const p = G.S.garden.p[i];
  if (!p) return '';
  const sd = G.SEEDS[p.seed], el = Date.now() - p.t0, k = Math.min(3, Math.floor(el / p.dur * 4));
  const art = sd.art.slice(0, k + 1);
  while (art.length < 4) art.unshift('       ');
  const ready = el >= p.dur;
  return `<pre>${art.join('\n')}</pre>${sd.n}<br>${ready ? '<span class="gold">Ready!</span>' : `<span class="dim">${G.fmtTime(p.dur - el)}</span>`}`;
};
G.SCREENS.garden = {
  render() {
    const S = G.S;
    const plots = [];
    for (let i = 0; i < S.garden.plots; i++) {
      const p = S.garden.p[i];
      let body;
      if (!p) {
        const seeds = [G.btn('Glowcaps', 'plant', i + ':glow', { cost: G.SEEDS.glow.cost })];
        for (const s of ['s_moon', 's_ember', 's_frost', 's_whisper']) if (G.has(s)) seeds.push(G.btn(`${G.SEEDS[s].n} (x${S.inv[s]})`, 'plant', i + ':' + s));
        body = `<pre class="faint">       \n       \n       \n_______</pre><span class="dim">Empty plot</span><div class="stack">${seeds.join('')}</div>`;
      } else body = `${G.bind('plot', i)}<div>${G.btn('Harvest', 'harvest', String(i))}</div>`;
      plots.push(`<div class="plot">${body}</div>`);
    }
    const next = G.PLOT_COSTS[S.garden.plots];
    let extra = '';
    if (S.flags.k_scarecrow && !S.flags.scarecrowGarden) {
      extra = `<div class="panel"><p>A battered scarecrow is standing at the edge of your garden, hat in its hands, looking sheepish. Whatever was inside it has gone. It seems to want something to do.</p>${G.btn('Give it a job', 'scarecrowJob')}</div>`;
    } else if (S.flags.scarecrowGarden) extra = '<p class="dim small">The scarecrow guards your garden with enormous dignity. Things grow 25% faster.</p>';
    return `<h2>The Garden</h2><p class="dim">Behind the hut, a patch of dark soil. Glowcaps drink the dusk; other seeds can be found or bought.${S.sky.wells ? ' The Twin Wells shine overhead: things grow faster.' : ''}</p>
      <div>${G.btn('Harvest everything ready', 'harvestAll')} ${G.btn('Plant glowcaps in every empty plot', 'replantAll')}</div><br>
      <div>${plots.join('')}</div>
      ${next ? G.btn('Clear another plot', 'buyPlot', '', { cost: { motes: next } }) : '<p class="dim">The garden can\'t get any bigger.</p>'}
      ${extra}`;
  },
};
G.A.scarecrowJob = function () {
  G.S.flags.scarecrowGarden = 1;
  G.modal('<div class="who">The Scarecrow</div><div class="txt">You point at the garden. The scarecrow looks at the garden. It looks at you. Then it stands up very straight, plants itself at the end of the rows, and spreads its arms wide.\n\nA crow lands on the fence, takes one look at it, and leaves.</div>', [{ label: 'Good scarecrow' }]);
  G.earn('redeemed');
};

// ---------------------------------------------------------------- cauldron
G.SCREENS.cauldron = {
  render() {
    const S = G.S;
    const pot = [0, 1, 2].map(i => (G.pot[i] ? `<button class="btn" data-act="potRemove" data-arg="${i}">${G.itemName(G.pot[i], 1)}</button>` : '<span class="faint">[ empty ]</span>')).join('  ');
    const ings = G.INGREDIENTS.filter(id => G.count(id) > 0).map(id => G.btn(`${G.itemName(id, 2)} <span class="gold">${G.fmt(G.count(id))}</span>`, 'potAdd', id)).join(' ');
    const known = G.RECIPES.filter(r => S.recipes[r.id]).map(r => {
      const need = {};
      for (const x of r.in) need[x] = (need[x] || 0) + 1;
      return `<li>${G.btn('Brew', 'brewKnown', r.id, { cost: need, hideCost: true })} <b>${G.ITEMS[r.id].n}</b> <span class="dim small">= ${r.in.map(x => G.itemName(x, 1)).join(' + ')}</span></li>`;
    }).join('');
    const unknown = G.RECIPES.filter(r => !S.recipes[r.id] && !r.secret).length;
    return `<h2>Granny Nettle's Cauldron</h2>
      <pre class="art">      (  )   (   )  )
       ) (   )  (  (
      ( )  (    ) )
     .-'""'""'""'""'-.
    (    ${G.pot.length ? '<span class="good">~~~~~~~~~~~</span>' : '           '}    )
     '-.__________.-'
       //        \\\\</pre>
      <p>In the pot: ${pot}</p>
      <p>${G.btn('Brew', 'brew', '', { cls: 'big' })} ${G.btn('Empty the pot', 'potEmpty')}</p>
      <div class="panel"><h3>Ingredients</h3>${ings || '<span class="faint">You have nothing to brew with.</span>'}<p class="small dim">Add two or three ingredients, then brew. Unknown mixtures make sludge.</p></div>
      <div class="panel"><h3>Known recipes</h3><ul class="list">${known || '<li class="faint">None yet.</li>'}</ul>
      <p class="small dim">${unknown ? `Granny says there are at least ${unknown} more ordinary recipes to find.` : 'You know all of Granny\'s ordinary recipes.'} "Some things, dear, aren't written down anywhere sensible."</p></div>`;
  },
};

// ---------------------------------------------------------------- spells
G.SCREENS.spells = {
  render() {
    const S = G.S;
    const known = G.SPELL_ORDER.filter(s => S.spells[s]);
    const list = known.map((s, i) => { const sp = G.SPELLS[s]; return `<li><b>[${i + 1}] ${sp.n}</b> <span class="cyan">${sp.lum} lumen</span> <span class="dim">(${(sp.cd / 1000).toFixed(1)}s cooldown)</span><br><span class="small">${sp.d}</span></li>`; }).join('');
    const left = G.SPELL_ORDER.length - known.length;
    return `<h2>Spellbook</h2><p class="dim">Spells burn lumen, which your lantern refills as you explore. Cast them with the number keys during an expedition.</p>
      <div class="panel"><ul class="list">${list || '<li class="faint">You know no spells.</li>'}</ul></div>
      ${left ? `<p class="dim">${left} more ${G.plural(left, 'spell')} to learn, from the Archive in Dimvale${S.spells.swarm ? '' : ' and perhaps somewhere stranger'}.</p>` : ''}`;
  },
};

// ---------------------------------------------------------------- sky
G.SKY_W = 66;
G.SKY_H = 15;
G.skyGrid = function () {
  const S = G.S, W = G.SKY_W, H = G.SKY_H;
  const g = [];
  for (let y = 0; y < H; y++) { g.push([]); for (let x = 0; x < W; x++) { const h = (x * 73 + y * 151) % 37; g[y].push([h === 0 ? '.' : h === 9 ? '·' : ' ', 'sky']); } }
  const put = (x, y, ch, cls) => { if (x >= 0 && y >= 0 && x < W && y < H) g[y][x] = [ch, cls]; };
  for (const c of G.CONSTELLATIONS) {
    const lit = S.sky[c.id];
    for (const [x, y] of c.stars) put(x, y, lit ? '*' : '.', lit ? 's-lit' : 's-star');
    if (lit) [...c.n.toUpperCase()].forEach((ch, i) => put(c.lbl[0] + i, c.lbl[1], ch, 's-lit small'));
  }
  if (S.sky.ember) {
    for (const [x, y] of G.EMBER_STAR.stars) put(x, y, '*', 's-lit');
    [...G.EMBER_STAR.n.toUpperCase()].forEach((ch, i) => put(G.EMBER_STAR.lbl[0] + i, G.EMBER_STAR.lbl[1], ch, 's-lit'));
  }
  return g.map((row, y) => row.map(([ch, cls], x) => {
    const secret = !S.sky.ember && x >= 28 && x <= 36 && y >= 8 && y <= 12;
    return secret ? `<span class="${cls} s-secret" data-act="emberSpot">${ch}</span>` : `<span class="${cls}">${ch}</span>`;
  }).join('')).join('\n');
};
G.SCREENS.sky = {
  render() {
    const S = G.S;
    const list = G.CONSTELLATIONS.map(c => `<li>${S.sky[c.id] ? `<b class="gold">${c.n}</b> <span class="small dim">${c.bonus}</span> <span class="link small" data-act="myth" data-arg="${c.id}">read myth</span>`
      : `${G.btn(`Relight ${c.n}`, 'relight', c.id, { cost: c.cost })} <span class="small dim">${c.bonus}</span>`}</li>`).join('');
    const lit = G.CONSTELLATIONS.filter(c => S.sky[c.id]).length;
    return `<h2>The Roof</h2><p class="dim">You climb the ladder behind the cupboard. The sky is full of tired stars. Give them light and they remember their shapes.</p>
      <pre class="sky art">${G.skyGrid()}</pre><br>
      <div class="panel"><h3>Constellations (${lit}/8)</h3><ul class="list">${list}</ul>
      ${S.sky.ember ? `<p>${G.btn('The Last Ember', 'myth', 'ember')} <span class="small gold">${G.EMBER_STAR.bonus}</span></p>` : ''}</div>`;
  },
};
G.A.relight = function (id) {
  const c = G.CONSTELLATIONS.find(x => x.id === id);
  if (!c || G.S.sky[id] || !G.pay(c.cost)) return;
  G.S.sky[id] = 1;
  G.invalidate();
  if (id === 'door' && !G.S.locs.lighthouse) { G.S.locs.lighthouse = 1; G.log('A light appears on your map, far out on the western shore.', 'unlock'); }
  G.modal(`<div class="who">${c.n}</div><div class="txt">The stars flare one by one, and remember who they were.\n\n${c.myth}\n\n<span class="gold">${c.bonus}</span></div>`, [{ label: 'Beautiful' }]);
};
G.A.myth = function (id) {
  const c = id === 'ember' ? G.EMBER_STAR : G.CONSTELLATIONS.find(x => x.id === id);
  G.modal(`<div class="who">${c.n}</div><div class="txt">${c.myth}</div>`);
};
G.A.emberSpot = function () {
  const S = G.S;
  if (S.sky.ember) return;
  if (!G.CONSTELLATIONS.every(c => S.sky[c.id])) {
    G.log('There is a gap in the stars here. It feels like something is missing.');
    return;
  }
  S.sky.ember = 1;
  G.invalidate();
  G.earn('emberstar');
  G.modal(`<div class="who">The Thirteenth Star</div><div class="txt">You stare at the empty patch of sky where no star has ever been... and five tiny lights blink on, shaped like a candle flame.\n\nBehind you, inside the hut, Wick goes very quiet. Then: <span class="wick">"Oh. That's me, isn't it."</span>\n\n${G.EMBER_STAR.myth}\n\n<span class="gold">${G.EMBER_STAR.bonus}</span></div>`, [{ label: 'Hello, Wick' }]);
};

// ---------------------------------------------------------------- journal
G.SCREENS.journal = {
  render() {
    const S = G.S, sub = G.view.sub || 'pages';
    const tabs = [['pages', 'Pages'], ['beasts', 'Bestiary'], ['ach', 'Glimmers'], ['stats', 'Stats']]
      .map(([id, n]) => `<span class="link ${sub === id ? 'gold' : ''}" data-act="jsub" data-arg="${id}">${n}</span>`).join(' &middot; ');
    let body = '';
    if (sub === 'pages') {
      const all = Object.keys(G.PAGES), have = all.filter(id => S.pages[id]);
      body = `<p class="dim">${have.length} of ${all.length} pages found.</p><ul class="list">${all.map(id => S.pages[id]
        ? `<li><span class="link" data-act="readPage" data-arg="${id}">${G.PAGES[id].t}</span> <span class="small dim">${G.PAGES[id].where}</span></li>`
        : '<li class="faint">??? <span class="small">(missing page)</span></li>').join('')}</ul>`;
    } else if (sub === 'beasts') {
      const all = Object.keys(G.ENEMIES);
      body = `<p class="dim">${all.filter(id => S.beasts[id]).length} of ${all.length} creatures recorded.</p><ul class="list">${all.map(id => {
        const e = G.ENEMIES[id];
        return S.beasts[id] ? `<li><span class="m-${e.col}">${e.ch}</span> <b>${e.n}</b> <span class="dim small">defeated ${G.fmt(S.beasts[id])}, HP ${e.hp}</span><br><span class="small">${e.lore}</span></li>` : '<li class="faint">? ??? </li>';
      }).join('')}</ul>`;
    } else if (sub === 'ach') {
      const n = Object.keys(S.ach).length;
      body = `<p class="dim">${n} of ${G.ACH.length} glimmers. Each one makes the jar catch 2% more motes (now +${n * 2}%).</p><ul class="list grid2">${G.ACH.map(a => S.ach[a.id]
        ? `<li><b class="gold">&#10023; ${a.n}</b><br><span class="small dim">${a.d}</span></li>`
        : `<li class="faint">&#10023; ${a.hidden ? '???' : a.n}<br><span class="small">${a.hidden ? 'A hidden glimmer.' : a.d}</span></li>`).join('')}</ul>`;
    } else {
      const st = S.stats;
      const rows = [
        ['Time played', G.fmtTime(st.time)], ['Motes caught (total)', G.fmt(S.total)], ['Motes inhaled', G.fmt(S.inhaled)],
        ['Motes released', G.fmt(S.released)], ['Motes fed to Wick', G.fmt(S.fed)], ['Foes defeated', G.fmt(st.kills)],
        ['Times fallen', st.deaths], ['Expeditions', st.runs], ['Steps taken', G.fmt(st.steps)], ['Fish caught', st.caught],
        ['Harvests', st.harvested], ['Brews', st.brewed], ['Walls broken', st.broken], ['Motes down the well', G.fmt(st.wellTossed)],
        ['Jar shakes', G.fmt(st.jarClicks)], ['Shooting motes caught', st.shooting || 0], ['Endings seen', Object.keys(S.endings).length + ' / 3'],
      ];
      if (S.ng) rows.push(['New Game+', S.ng]);
      body = `<ul class="list">${rows.map(([k, v]) => `<li class="kv">${k}: <b>${v}</b></li>`).join('')}</ul>`;
    }
    return `<h2>Journal</h2><p>${tabs}</p>${body}`;
  },
};
G.A.jsub = id => { G.view.sub = id; G.refresh(); };
G.A.readPage = id => { const p = G.PAGES[id]; G.modal(`<div class="who">${p.t}</div><div class="txt">${G.esc(p.txt)}</div>`); };

// ---------------------------------------------------------------- options
G.SCREENS.options = {
  render() {
    const S = G.S;
    return `<h2>Options</h2>
      <div class="panel"><h3>Your name</h3><input type="text" id="pname" value="${G.esc(S.name)}" maxlength="24"> ${G.btn('Change name', 'rename')}</div>
      <div class="panel"><h3>Saving</h3><p class="dim small">The game saves itself every 20 seconds and when you leave.</p>
        ${G.btn('Save now', 'saveNow')} ${G.btn('Export save', 'exportSave')} ${G.btn('Import save', 'importSave')}
        <textarea id="savebox" placeholder="Paste a save here to import it."></textarea></div>
      ${S.ach.lightsout ? `<div class="panel"><h3>The switch</h3>${G.btn(document.body.classList.contains('lightsout') ? 'Lights on' : 'Lights out', 'lightsToggle')}</div>` : ''}
      ${Object.keys(S.endings).length ? `<div class="panel"><h3>New Game+</h3><p class="small dim">Start again with your glimmers, journal, bestiary and recipes. Foes are tougher; the jar catches 25% more motes.</p>${G.btn('Begin New Game+', 'ngplus', '', { cls: 'danger' })}</div>` : ''}
      <div class="panel"><h3>Start over</h3>${G.btn('Wipe my save', 'wipe', '', { cls: 'danger' })}</div>
      <p class="small faint">Mothlight. An original ASCII adventure. Thanks for keeping the lights on.</p>`;
  },
};
G.A.rename = function () {
  const v = (document.getElementById('pname').value || '').trim().slice(0, 24);
  if (!v) return;
  G.S.name = v;
  const low = v.toLowerCase();
  if (low === 'wick') G.say('That\'s MY name! Pick your own! ...Fine. Two Wicks. This is confusing.');
  else if (low === 'solenne') G.say('...Solenne? Don\'t joke about that. Please.');
  else if (low === 'mothrael') G.say('You are not a giant moth. I would have noticed.');
  else G.say(`${G.esc(v)}! That's a good name. I'd be proud to be lit next to a ${G.esc(v)}.`);
  G.refresh();
};
G.A.saveNow = () => { G.save(); G.toast('Saved.'); };
G.A.exportSave = () => { document.getElementById('savebox').value = G.exportSave(); G.toast('Save copied into the box below.'); };
G.A.importSave = function () {
  const v = document.getElementById('savebox').value;
  try { G.importSave(v); } catch (e) { G.toast('That does not look like a Mothlight save.'); }
};
G.A.wipe = () => G.confirm('<div class="txt">Really wipe everything and start from an empty jar?</div>', () => G.wipe(), 'Wipe it');
G.A.ngplus = () => G.confirm('<div class="txt">Begin New Game+? Your motes, items and progress reset; glimmers, journal, bestiary and recipes stay.</div>', () => G.newGamePlus(), 'Begin again');
G.A.lightsToggle = () => { document.body.classList.toggle('lightsout'); G.S.flags.lightsOn = !document.body.classList.contains('lightsout'); G.refresh(); };
