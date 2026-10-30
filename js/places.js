'use strict';
// The world: map, locations, shops, NPCs, boss story beats, endings.

// ---------------------------------------------------------------- world map
G.WORLD = [
  '~~~~~~~~~~~~~~~   /\\    /\\         /\\     /\\/\\       /\\    /\\/\\      /\\  ',
  '~~~~~~~~~~~~~~   /  \\  /  \\  /\\   /  \\   /    \\  /\\  /  \\  /    \\    /  \\ ',
  '~~~~~~~~~~~~~   /    \\/    \\/  \\_/    \\_/      \\/  \\/    \\/      \\  /    \\',
  '~~~~~~~~~~~~                    ^        ^          ^         ^     \\/    ',
  '~~~~~~~~~~~        ^      ^                   ^           ^               ',
  '~~~~~~~~~~                       ^      ##=##                     ^       ',
  '~~~~~~~~~    T T T T T T T             #####          ^                   ',
  '~~~~~~~~   T T T T T T T T T             :                     n n n      ',
  '~~~~~~~~  T T T T T T T T T T            :                   n n n n n    ',
  '~~~~~~~~   T T T T T T T T T             :                  n n n n n n   ',
  '~~~~~~~~~   T T T T T T T T      . . . . : . . .              n n n n     ',
  '~~~~~~~~~~    T T T T T T     .          :       .                        ',
  '~~~~~~~~~~~                 .            :        .     ,,,,,,,,,,,,      ',
  '~~~~~~~~~~~~           \u2248\u2248\u2248\u2248\u2248\u2248\u2248\u2248\u2248         :         .  ,,,,,,,,,,,,,,,     ',
  '~~~~~~~~~~~~~        \u2248\u2248\u2248\u2248\u2248\u2248\u2248\u2248\u2248\u2248\u2248\u2248\u2248       :          .,,,,,,,,,,,,,,,,     ',
  '~~~~~~~~~~~~~~        \u2248\u2248\u2248\u2248\u2248\u2248\u2248\u2248\u2248\u2248\u2248        :         . ,,,,,,,,,,,,,,,      ',
  '~~~~~~~~~~~~~~~         \u2248\u2248\u2248\u2248\u2248\u2248\u2248     . . .:. . . .     ,,,,,,,,,,,,        ',
  '~~~~~~~~~~~~~~~~               . .       :      . .                       ',
  '~~~~~~~~~~~~~~~~~            .      /\\   :  _   _   .                     ',
  '~~~~~~~~~~~~~~~~~~                 /__\\  : |_| |_|                        ',
  '~~~~~~~~~~~~~~~~~~~~                       |_| |_|                        ',
  '~~~~~~~~~~~~~~~~~~~~~~~                                                   ',
];
G.LOCS = {
  hut: { n: 'Your Hut', at: [35, 20], lbl: '[Hut]' },
  village: { n: 'Dimvale', at: [52, 19], lbl: '[Dimvale]' },
  field: { n: 'Whisperwheat Field', at: [55, 13], lbl: '[Whisperwheat]', map: 'field' },
  caves: { n: 'Rootdeep Caves', at: [60, 10], lbl: '[Rootdeep]', map: 'caves' },
  lake: { n: 'Stillwater Lake', at: [24, 14], lbl: '[Stillwater]' },
  forest: { n: 'Thornwood', at: [13, 8], lbl: '[Thornwood]', map: 'forest' },
  nettle: { n: "Nettle's Hollow", at: [9, 11], lbl: "[Nettle's Hollow]" },
  ruins: { n: 'Lumenwright Ruins', at: [39, 4], lbl: '[Ruins]', map: 'ruins' },
  peak: { n: 'The Pale Steps', at: [50, 3], lbl: '[Pale Steps]', map: 'peak' },
  spire: { n: 'The Cocoon Spire', at: [63, 5], lbl: '[Spire]', map: 'spire' },
  under: { n: 'The Underneath', at: [44, 9], lbl: '[Underneath]', map: 'under' },
  crow: { n: 'The Night Market', at: [28, 10], lbl: '[Night Market]' },
  lighthouse: { n: 'The Lighthouse', at: [1, 17], lbl: '[Lighthouse]' },
};
G.locOpen = function (id) {
  const S = G.S;
  if (id === 'crow') return G.isNight() || G.has('feather');
  return !!S.locs[id];
};
G.renderWorld = function () {
  const S = G.S;
  const g = G.WORLD.map(r => [...r].map(ch => {
    if (ch === '~') return ['~', 'wm-sea'];
    if (ch === '\u2248') return ['~', 'wm-lake'];
    if (ch === 'T') return ['\u2663', 'wm-forest'];
    if ('^/\\_n'.includes(ch)) return [ch, 'wm-mtn'];
    if (ch === ',') return [',', 't-tall'];
    if (ch === ':' || ch === '.') return [ch, 'wm-path'];
    if (ch === '#' || ch === '=') return [ch, 'wm-mtn'];
    if (ch === '|') return [ch, 'wm-mtn'];
    return [ch, ''];
  }));
  const put = (x, y, str, cls, act) => [...str].forEach((c, i) => { if (g[y] && g[y][x + i]) g[y][x + i] = [c, cls, act]; });
  if (S.locs.spire) [['  /\\  ', 0], [' (  ) ', 1], [' (()) ', 2], [' (  ) ', 3], ['  \\/  ', 4]].forEach(([s, y]) => put(64, y, s, 'wm-spire'));
  if (!S.locs.lighthouse) put(5, 17, '.', 'wm-secret', 'secretDot');
  for (const id in G.LOCS) {
    const L = G.LOCS[id];
    if (id === 'crow') { if (G.locOpen('crow')) put(L.at[0], L.at[1], L.lbl, 'wm-night', 'loc:' + id); continue; }
    if (!S.locs[id]) continue;
    put(L.at[0], L.at[1], L.lbl, 'wm-loc', 'loc:' + id);
  }
  return g.map(row => {
    let out = '', cur = null, buf = '';
    const flush = () => {
      if (!buf) return;
      if (cur && cur.act) out += `<span class="${cur.cls}" data-act="${cur.act.startsWith('loc:') ? 'goLoc' : cur.act}" data-arg="${cur.act.slice(4)}">${G.esc(buf)}</span>`;
      else out += `<span class="${cur ? cur.cls : ''}">${G.esc(buf)}</span>`;
      buf = '';
    };
    for (const [c, cls, act] of row) {
      const k = { cls, act };
      if (!cur || cur.cls !== cls || cur.act !== act) { flush(); cur = k; }
      buf += c;
    }
    flush();
    return out;
  }).join('\n');
};
G.A.goLoc = id => (id === 'hut' ? G.go('hut') : G.go('map', id));
G.A.secretDot = function () {
  const S = G.S;
  S.locs.lighthouse = 1;
  G.log('You squint at the tiny speck of light out at sea... it is a lighthouse!', 'unlock');
  G.earn('keeper');
  G.refresh();
};

G.SCREENS.map = {
  render() {
    const S = G.S, v = G.view;
    if (v.loc && G.PLACES[v.loc]) return G.PLACES[v.loc].render(v.sub);
    const list = Object.keys(G.LOCS).filter(id => (id === 'crow' ? G.locOpen('crow') : S.locs[id]))
      .map(id => `<span class="link" data-act="goLoc" data-arg="${id}">${G.LOCS[id].n}</span>`).join(' &middot; ');
    return `<h2>The World</h2><pre class="art wmap">${G.renderWorld()}</pre><p>${list}</p>
      <p class="small dim">Click a place to travel there.${G.isNight() ? ' <span class="cyan">It is night where you are. Strange stalls open after dark.</span>' : ''}</p>`;
  },
};
const back = (to = null) => `<p>${to ? G.btn('Back', 'goLoc', to) : G.btn('Back to the map', 'goLoc', '')}</p>`;
G.A.goSub = arg => { const [loc, sub] = arg.split(':'); G.go('map', loc, sub || null); };

// ---------------------------------------------------------------- expedition entry
G.MAP_INTRO = {
  field: 'Golden wheat, gone grey in the endless dusk. The wind whispers through it. Things whisper back. In the middle of it all stands a scarecrow that turns its head when you are not looking.',
  caves: 'The old Rootdeep mine. The miners left when the lamps went out. Something kept digging.',
  forest: 'A forest of black oaks and briars. The paths move when you are not watching them, and the wolves move when you are.',
  shrine: 'Beneath Stillwater lies a drowned shrine, its halls still lit by drifting jellies. You will need to breathe water to reach it.',
  ruins: 'Halcyon, the City of Endless Noon, built by the Lumenwrights. Its machines still turn, guarding nothing.',
  peak: 'The Pale Steps climb to the top of the world. Ice, wind, and at the summit, a woman made of frost who is waiting for someone.',
  spire: 'An enormous cocoon of silver silk, wound around the highest peak. It hums. It is warm.',
  under: 'Under the roots of the roots. There is no light here except what you bring.',
};
G.mapProgress = function (id) {
  const S = G.S, def = G.MAPS[id], ms = S.maps[id];
  const pages = new Set();
  for (const k in def.legend) if (def.legend[k].page) pages.add(def.legend[k].page);
  const got = [...pages].filter(p => S.pages[p]).length;
  let chests = 0, opened = 0;
  def.rows.forEach((r, y) => [...r].forEach((c, x) => { if (def.legend[c] && def.legend[c].chest) { chests++; if (ms && ms.o[x + ',' + y]) opened++; } }));
  const boss = Object.values(def.legend).find(l => l.mob && G.ENEMIES[l.mob].boss);
  const bossTxt = boss ? (S.flags['k_' + boss.mob] ? `<span class="good">${G.ENEMIES[boss.mob].n} defeated</span>` : S.beasts[boss.mob] ? '' : '<span class="dim">Something big lives here.</span>') : '';
  return `<p class="small dim">Chests opened: ${opened}/${chests} &middot; Pages found: ${got}/${pages.size} ${bossTxt ? '&middot; ' + bossTxt : ''}</p>`;
};
G.enterCheck = function (id) {
  const S = G.S, def = G.MAPS[id], st = G.calc();
  if (S.hp < st.maxHp * 0.5) return `You are too hurt to set out (${Math.ceil(S.hp)}/${st.maxHp} HP). Rest a little; you heal over time.`;
  if (def.dark && !S.lantern) return 'It is pitch black in there. You will need a lantern. Odessa the Lamplighter in Dimvale sells them.';
  if (id === 'shrine' && !G.has('gill')) return 'The shrine is under the lake. You need a Gillweed Brew to breathe down there. (Granny Nettle\'s cauldron: moonpetal and a silver minnow.)';
  if (id === 'spire' && G.count('shard') < 5) return `The spire's door is sealed with five sockets shaped like pieces of sun. You have ${G.count('shard')}.`;
  return null;
};
G.A.enter = function (id) {
  const why = G.enterCheck(id);
  if (why) { G.modal(`<div class="txt">${why}</div>`); return; }
  if (id === 'shrine') { G.take('gill'); G.log('You drink the Gillweed Brew and wade into Stillwater. Your neck tickles.'); }
  if (!G.S.eq.weapon && G.MAPS[id].tier === 1 && !G.S.flags.warnedFists) {
    G.S.flags.warnedFists = 1;
    G.confirm('<div class="txt wick">Wick: "You\'re going out there with your bare hands? Marla sells spoons, you know. Wooden ones. Very intimidating."</div>', () => G.Dun.start(id), 'Go anyway');
    return;
  }
  G.Dun.start(id);
};
G.dungeonPlace = (id, extra = '') => ({
  render() {
    const def = G.MAPS[id], why = G.enterCheck(id);
    return `<h2>${def.n}</h2><p>${G.MAP_INTRO[id]}</p>${G.mapProgress(id)}${extra ? extra() : ''}
      <p>${G.btn('Set out', 'enter', id, { cls: 'big' })}</p>${why ? `<p class="small dim">${why}</p>` : ''}${back()}`;
  },
});

G.PLACES = {
  field: G.dungeonPlace('field'),
  caves: G.dungeonPlace('caves'),
  forest: G.dungeonPlace('forest'),
  ruins: G.dungeonPlace('ruins'),
  peak: G.dungeonPlace('peak', () => (G.calc().cold ? '<p class="small cyan">Your gear keeps out the cold.</p>' : `<p class="small bad">You have no cold protection. ${G.has('frostward') ? 'A Frostward will be drunk on arrival.' : 'Wear a Wolfpelt Cloak, or brew a Frostward.'}</p>`)),
  spire: G.dungeonPlace('spire'),
  under: G.dungeonPlace('under', () => (G.S.flags.sang ? '<p class="small cyan">Mothrael waits for you below.</p>' : '<p class="small bad">You go alone. The sun is free; the hunger is awake.</p>')),
};

// ---------------------------------------------------------------- Dimvale
const VILLAGE_ART = `        _         _    ___    _
   ____| |__   __| |__|   |__| |___
  |  _  |  |  |  |  ||  o  ||  |   |
  |_| |_|__|__|__|__||_____||__|___|
 ~ lamps ~  i     i     i      i   `;
G.PLACES.village = {
  render(sub) {
    const S = G.S;
    if (!S.locs.field) { S.locs.field = 1; G.log('Marla mentions a field east of the village, "if you fancy being bitten by things".', 'unlock'); }
    if (sub && G.SHOPS[sub]) return G.SHOPS[sub]();
    const places = [
      ['marla', "Marla's Sundries", 'General goods, lenses for your jar, and gossip, free of charge.'],
      ['gorrin', "Gorrin's Forge", 'Weapons, armour, and a blacksmith who hums.'],
      ['odessa', "The Lamplighter's Post", 'Odessa keeps the village lamps lit with motes. She sells lanterns.'],
      ['toad', 'The Snoring Toad', 'The tavern. Rumours, dice and bounties.'],
      ['archive', 'The Archive', 'Quillon the archivist: spells, old tablets, riddles.'],
      ['well', 'The Old Well', 'Older than the village. It listens.'],
    ];
    return `<h2>Dimvale</h2><pre class="art">${VILLAGE_ART}</pre>
      <p class="dim">A village that learned to live in the dusk. Lamps burn on every corner, fed with motes.</p>
      <ul class="list">${places.map(([id, n, d]) => `<li><span class="link" data-act="goSub" data-arg="village:${id}">${n}</span> <span class="small dim">${d}</span></li>`).join('')}</ul>${back()}`;
  },
};
const shopRow = (label, act, arg, cost, note = '') => `<li>${G.btn(label, act, arg, { cost })} ${note ? `<span class="small dim">${note}</span>` : ''}</li>`;
const vback = () => back('village');
G.A.buyItem = function (arg) {
  const [shop, i] = arg.split(':');
  const it = G.SHOP_STOCK[shop]()[+i];
  if (it && G.buy(it.id, it.cost, it.n || 1)) G.refresh();
};
G.SHOP_STOCK = {
  marla: () => [
    { id: 'spoon', cost: { motes: 20 }, once: 1 },
    { id: 'coat', cost: { motes: 60 }, once: 1 },
    { id: 'heal', cost: { motes: 40 } },
    { id: 'slippers', cost: { motes: 150 }, once: 1, hide: !G.S.flags.ribbonDone },
    { id: 'pot', cost: { motes: 250 }, once: 1 },
    { id: 'rod', cost: { motes: 300 }, once: 1, hide: !G.S.locs.lake },
  ],
  gorrin: () => [
    { id: 'shears', cost: { motes: 120 }, once: 1 },
    { id: 'sword', cost: { motes: 900 }, once: 1 },
    { id: 'brassplate', cost: { motes: 7000 }, once: 1 },
  ],
  nettle: () => [
    { id: 's_ember', cost: { motes: 100 } },
    { id: 's_moon', cost: { motes: 150 } },
    { id: 's_frost', cost: { motes: 500 }, hide: !G.S.flags.k_golem },
    { id: 'heal', cost: { glowcaps: 4 } },
  ],
  crow: () => [
    { id: 'moonsickle', cost: { moonstones: 6 }, once: 1 },
    { id: 'star', cost: { moonstones: 3 } },
    { id: 'bait', cost: { moonstones: 2 }, once: 1, hide: G.S.inv.oldone },
    { id: 's_whisper', cost: { moonstones: 2 } },
    { id: 'feather', cost: { moonstones: 10 }, once: 1 },
  ],
};
G.stockList = function (shop) {
  return G.SHOP_STOCK[shop]().map((it, i) => {
    if (it.hide) return '';
    const I = G.ITEMS[it.id];
    if (it.once && (G.has(it.id) || Object.values(G.S.eq).includes(it.id))) return `<li class="faint">${I.n} <span class="small">(owned)</span></li>`;
    return shopRow(I.n, 'buyItem', shop + ':' + i, it.cost, (G.gearStats(I) || I.d));
  }).join('');
};

G.SHOPS = {
  marla() {
    const S = G.S, L = G.LENSES[S.lenses];
    let quest = '';
    if (!S.flags.ribbonDone) {
      if (G.has('ribbon')) quest = `<div class="panel"><p>You show Marla the blue ribbon. Her hand goes to her mouth.</p>${G.btn("Give back Mira's ribbon", 'ribbon')}</div>`;
      else if (S.flags.k_scarecrow || S.pages.diary1) quest = '<p class="small dim">"My granddaughter Mira gave her ribbon to that dreadful scarecrow. If you ever find it..." Marla trails off.</p>';
    }
    const fish = Object.keys(G.FISH_PRICES).filter(id => G.has(id)).map(id => G.btn(`Sell ${G.ITEMS[id].n} x${G.count(id)}`, 'sellFish', id) + ` <span class="small dim">(${G.FISH_PRICES[id]} each)</span>`).join('<br>');
    const spoonTalk = S.eq.weapon === 'destiny' ? '<p class="wick small">Marla looks at your spoon for a long time. "I KNEW it," she whispers.</p>' : '';
    return `<h2>Marla's Sundries</h2><p class="dim">Marla is small and fierce and smells of cinnamon. "Buying or browsing? Browsing costs nothing. Buying costs motes."</p>${spoonTalk}
      <div class="row"><div class="col"><div class="panel"><h3>Goods</h3><ul class="list">${G.stockList('marla')}</ul></div></div>
      <div class="col"><div class="panel"><h3>Lenses for your jar</h3>${L ? `<ul class="list">${shopRow(L.n, 'buyLens', '', L.cost, `+${L.add} motes/s`)}</ul>` : '<p class="dim">"That jar has the best lens in the world already. Off you go."</p>'}
      <p class="small dim">${S.lenses} of ${G.LENSES.length} lenses fitted.</p></div>
      ${fish ? `<div class="panel"><h3>Sell fish</h3>${fish}</div>` : ''}</div></div>${quest}${vback()}`;
  },
  gorrin() {
    const S = G.S;
    const recipes = G.FORGE.map((r, i) => {
      const it = G.ITEMS[r.out];
      if (r.secret && !(G.has('spoon') && G.has('star')) && !S.flags.got_destiny) return '';
      if (r.need && !S.flags[r.need]) return `<li class="faint">${it.n} <span class="small">(Gorrin doesn't know how to make this yet)</span></li>`;
      return shopRow(`Forge ${it.n}`, 'forge', i, r.cost, G.gearStats(it));
    }).join('');
    let quest = '';
    if (!S.flags.gorrinGears) {
      if (G.has('gear', 3)) quest = `<div class="panel"><p>Gorrin's eyes light up at the brass gears in your pack.</p>${G.btn('Give Gorrin 3 Clockwork Gears', 'gorrinGears')}</div>`;
      else if (S.locs.ruins) quest = '<p class="small dim">"Lumenwright gears," Gorrin rumbles. "Bring me three. I want to see how they think."</p>';
    }
    const hum = G.has('spoon') && G.has('star') ? '<p class="small wick">Gorrin is humming a song you have heard before. Something about a spoon, and a star, and destiny.</p>' : '';
    return `<h2>Gorrin's Forge</h2><p class="dim">Gorrin is enormous and gentle and covered in soot. He hums while he works, always the same tune.</p>${hum}
      <div class="row"><div class="col"><div class="panel"><h3>For sale</h3><ul class="list">${G.stockList('gorrin')}</ul></div></div>
      <div class="col"><div class="panel"><h3>The forge</h3><ul class="list">${recipes}</ul><p class="small dim">Bring materials from your expeditions.</p></div></div></div>${quest}${vback()}`;
  },
  odessa() {
    const S = G.S, L = G.LANTERNS[S.lantern + 1];
    let quest = '';
    if (S.locs.caves && !S.flags.lampsDone) {
      if ((S.flags.lamps || 0) >= 3) quest = `<div class="panel"><p>"You lit them? All three of Rootdeep's lamps?" Odessa beams.</p>${G.btn('Tell her about the lamps', 'lampsDone')}</div>`;
      else quest = `<p class="small dim">"There are three old lamps down in Rootdeep. They went out the year the miners left. Light them for me?" (${S.flags.lamps || 0}/3)</p>`;
    }
    return `<h2>The Lamplighter's Post</h2><p class="dim">Odessa is tall and thin and moves like a candle flame. She refills the village lamps with motes every evening, though every hour is evening now.</p>
      <div class="panel"><h3>Your lantern: ${G.LANTERNS[S.lantern].n}</h3><p class="small dim">Light radius in dark places: ${G.LANTERNS[S.lantern].r}. ${S.lantern >= 4 ? 'It shows you which walls are lying.' : 'A prism lantern would show you which walls are lying.'}</p>
      ${L ? `<ul class="list">${shopRow(`Buy the ${L.n}`, 'buyLantern', '', L.cost, `radius ${L.r}${L.cracks ? ', shows cracked walls' : ''}`)}</ul>` : '<p class="gold">"That is the finest lantern I have ever seen. Mind you don\'t blind anyone."</p>'}</div>
      ${quest}${vback()}`;
  },
  toad() {
    const S = G.S;
    const b = S.bounty;
    if (!b && !G.bountyOffer) G.bountyOffer = G.offerBounty();
    const o = G.bountyOffer;
    const bounty = b
      ? `<p>Current bounty: defeat <b>${b.need} ${G.ENEMIES[b.mob].n}</b> in ${G.MAPS[b.map].n}. Progress: <b>${b.have}/${b.need}</b>. Reward: ${G.costText(b.reward)}.</p>${b.have >= b.need ? G.btn('Claim reward', 'claimBounty') : G.btn('Give up', 'dropBounty')}`
      : o ? `<p>Posted: "WANTED: ${o.need} ${G.ENEMIES[o.mob].n}, ${G.MAPS[o.map].n}." Reward: ${G.costText(o.reward)}.</p>${G.btn('Take the bounty', 'takeBounty')}` : '<p class="dim">The board is empty. Come back when you have been somewhere.</p>';
    return `<h2>The Snoring Toad</h2><pre class="art">   _______
  |  ___  |   ~ The Snoring Toad ~
  | (o o) |   est. before the dark
  |__\\_/__|</pre>
      <p class="dim">Warm, loud, and smelling of mushroom ale. Hob the barkeep polishes the same mug forever.</p>
      <div class="row"><div class="col"><div class="panel"><h3>Gossip</h3><p>${G.btn('Listen to the regulars', 'rumor')}</p><p class="quote">${G.rumorText || '...'}</p></div>
      <div class="panel"><h3>Bounty board</h3>${bounty}</div></div>
      <div class="col"><div class="panel"><h3>Knucklebones with Old Fen</h3><p class="small dim">Three dice each, high total wins double. Triples pay five times. Fen wins ties. Max bet: half your motes.</p>
      Bet: <input type="number" id="bet" min="10" value="${G.dice.bet || 50}" style="width:8em"> ${G.btn('Roll', 'dice')}<p class="quote">${G.esc(G.dice.last || 'Fen grins. He is missing exactly the teeth you would expect.')}</p>
      <p class="small dim">Win streak: ${S.stats.diceStreak}</p></div></div></div>${vback()}`;
  },
  archive() {
    const S = G.S;
    const tomes = ['spark', 'mend', 'flare', 'blink', 'frost', 'reveal', 'sunburst'].map(id => {
      const sp = G.SPELLS[id];
      if (S.spells[id]) return `<li class="faint">${sp.n} <span class="small">(learned)</span></li>`;
      return shopRow(`Learn ${sp.n}`, 'buySpell', id, sp.price, sp.d);
    }).join('');
    const tabs = [['tablet1', 'tab1'], ['tablet2', 'tab2'], ['tablet3', 'tab3']].filter(([it]) => G.has(it))
      .map(([it, pg]) => `<li>${G.btn(`Translate ${G.ITEMS[it].n}`, 'translate', it + ':' + pg, { cost: { motes: 500 } })}</li>`).join('');
    const r = G.RIDDLES.findIndex((x, i) => !S.riddles[i]);
    const riddle = r >= 0
      ? `<p class="quote">"${G.RIDDLES[r].q}"</p><input type="text" id="riddle" placeholder="your answer"> ${G.btn('Answer', 'riddle', String(r))}<p class="small dim">Prize: ${G.RIDDLES[r].prize.item ? 'something special' : G.costText(G.RIDDLES[r].prize)}${G.riddleMsg ? ' &middot; ' + G.riddleMsg : ''}</p>`
      : '<p class="gold">"You have answered every riddle I know. I shall have to write more. Or retire."</p>';
    return `<h2>The Archive</h2><p class="dim">Shelves to the ceiling and beyond. Quillon the archivist peers at you over three pairs of spectacles at once.</p>
      <div class="row"><div class="col"><div class="panel"><h3>Spell tomes</h3><ul class="list">${tomes}</ul></div></div>
      <div class="col"><div class="panel"><h3>Translation</h3>${tabs ? `<ul class="list">${tabs}</ul>` : '<p class="small dim">"Bring me any Lumenwright tablets you find. Their script is tiny and precise and very, very smug."</p>'}</div>
      <div class="panel"><h3>A riddle</h3>${riddle}</div></div></div>${vback()}`;
  },
  well() {
    return `<h2>The Old Well</h2><pre class="art">     _______
    /_______\\
    |  ___  |
    | |   | |
    |_|~~~|_|</pre>
      <p class="dim">Older than Dimvale. Coins glint far down in the dark, and so do motes. People say it remembers.</p>
      Toss <input type="number" id="toss" min="1" value="10" style="width:8em"> motes ${G.btn('Toss them in', 'toss')}
      <p class="quote">${G.esc(G.wellMsg || 'The well waits.')}</p>${vback()}`;
  },
};
G.A.rumor = () => { G.rumorText = G.esc(G.pick(G.RUMORS)); G.refresh(); };
G.A.translate = function (arg) {
  const [it, pg] = arg.split(':');
  if (!G.has(it) || !G.pay({ motes: 500 })) return;
  G.take(it);
  G.gainPage(pg);
};
G.A.riddle = function (i) {
  const S = G.S, r = G.RIDDLES[+i];
  const ans = (document.getElementById('riddle').value || '').trim().toLowerCase().replace(/[.!?"']/g, '');
  if (!r || S.riddles[i]) return;
  if (r.a.includes(ans)) {
    S.riddles[i] = 1;
    G.riddleMsg = '"Correct! Splendid!"';
    if (r.prize.item) G.give(r.prize.item); else for (const k in r.prize) G.give(k, r.prize[k]);
  } else G.riddleMsg = ans ? '"No, no. Think about it."' : '"You have to actually say something."';
  G.refresh();
};
G.A.ribbon = function () {
  const S = G.S;
  G.take('ribbon');
  S.flags.ribbonDone = 1;
  G.give('slippers');
  G.give('motes', 150);
  G.talk("Marla", ['"Oh! Oh, Mira will be beside herself." Marla ties the ribbon around her own wrist for safekeeping.', '"Here. She knitted these for the scarecrow, would you believe. I think you need them more. Soft as anything, and quiet."']);
};
G.A.gorrinGears = function () {
  if (!G.pay({ gear: 3 })) return;
  G.S.flags.gorrinGears = 1;
  G.give('motes', 500);
  G.talk('Gorrin', ['Gorrin turns the gears over in his huge hands, very gently, the way you would hold a bird.', '"They want to turn," he says. "Even now. All right. I can make a blade that remembers that." (The Gearblade can now be forged.)']);
};
G.A.lampsDone = function () {
  const S = G.S;
  S.flags.lampsDone = 1;
  G.give('motes', 400);
  G.give('glowcaps', 25);
  G.talk('Odessa', ['"My mother lit those lamps. And hers before her." Odessa\'s eyes are very bright.', '"A lamp is a promise, you know. It says: someone will come back for you. Thank you for keeping it." She presses a pouch of motes and glowcaps into your hands.']);
};

// ---------------------------------------------------------------- Stillwater Lake
const LAKE_ART = `  ~   ~      ~        ~     ~
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 ~~  ~~~   ~~~~  ~~~    ~~~  ~~~~
    ~~   ~~    ~~   ~~~~    ~~
  _________________________
 /  |                       `;
G.B.fishbar = function () {
  const F = G.fish;
  if (F.state !== 'reel') return '';
  let s = '';
  for (let i = 0; i < 30; i++) {
    const inZone = i >= F.zone[0] && i <= F.zone[1];
    const mark = Math.round(F.pos) === i;
    s += mark ? '<span class="fish-mark">|</span>' : `<span class="${inZone ? 'fish-zone' : 'faint'}">${inZone ? '=' : '-'}</span>`;
  }
  return `[${s}] <span class="small dim">${F.hits}/${F.f.hits} ${'x'.repeat(F.miss)}</span>`;
};
G.PLACES.lake = {
  render() {
    const S = G.S, F = G.fish;
    let fishing;
    if (!G.has('rod')) fishing = '<p class="dim">You could fish here if you had a rod. Marla sells them.</p>';
    else if (F.state === 'idle') fishing = `${F.msg ? `<p class="quote">${F.msg}</p>` : ''}<p>${G.btn('Cast your line', 'cast', '', { cls: 'big' })} <span class="small dim">(or press space)</span></p>`;
    else if (F.state === 'waiting') fishing = `<p class="dim">The float bobs gently. Wait for a bite...</p><p>${G.btn('Reel in', 'reel')}</p>`;
    else if (F.state === 'bite') fishing = `<p class="gold big-num">! A bite !</p><p>${G.btn('REEL!', 'reel', '', { cls: 'big' })}</p>`;
    else fishing = `<p>Press space or click Reel when the marker is in the <span class="good">green</span>.</p><pre id="fishbar">${G.B.fishbar()}</pre><p>${G.btn('Reel', 'reel', '', { cls: 'big' })}</p>`;
    const night = G.isNight() && G.has('bait') ? '<p class="small cyan">It is night. Your glimmerworm bait wriggles. Something old is awake down there.</p>' : '';
    return `<h2>Stillwater Lake</h2><pre class="art cyan">${LAKE_ART}</pre><p class="dim">Water so still it holds the stars better than the sky does.</p>
      <div class="row"><div class="col"><div class="panel"><h3>Fishing</h3>${fishing}${night}<p class="small dim">Fish caught: ${S.stats.caught}</p></div></div>
      <div class="col"><div class="panel"><h3>The Drowned Shrine</h3><p class="small">${G.MAP_INTRO.shrine}</p>${G.mapProgress('shrine')}
      <p>${G.btn('Dive down', 'enter', 'shrine')} <span class="small dim">${G.has('gill') ? `Gillweed Brews: ${G.count('gill')}` : 'Needs a Gillweed Brew.'}</span></p></div></div></div>${back()}`;
  },
};

// ---------------------------------------------------------------- Nettle's Hollow
G.PLACES.nettle = {
  render() {
    const S = G.S;
    let quest = '';
    if (!S.flags.carpDone) {
      quest = G.has('carp', 3)
        ? `<p>${G.btn('Give Granny three gloomcarp', 'nettleCarp')}</p>`
        : '<p class="small dim">"Bring me three gloomcarp from the lake, dear, and I\'ll make it worth your while."</p>';
    }
    return `<h2>Nettle's Hollow</h2><pre class="art">       ( )  ( )
     .-'''''''''-.
    /  NETTLE'S   \\
   |  ___     ___  |
   | |   |   |o o| |
   |_|___|___|___|_|</pre>
      <p class="dim">A crooked cottage under the briars, with a cauldron always on the boil. Granny Nettle is four feet tall and frightens wolves.</p>
      <div class="panel"><h3>Granny's seeds and simples</h3><ul class="list">${G.stockList('nettle')}</ul></div>
      <div class="panel"><h3>Granny says</h3><p class="quote">${G.esc(G.nettleLine || G.pick(G.NETTLE_LINES))}</p>${G.btn('Ask for advice', 'nettleTalk')}${quest}</div>${back()}`;
  },
};
G.NETTLE_LINES = [
  'Two glowcaps in the pot makes a Healing Draught. Even you can manage that.',
  'Moonpetal and a silver minnow, dear. That\'s how you breathe underwater. Don\'t ask me why. Fish know things.',
  'Emberroot and a glowcap makes the blood run hot. Good for hitting things.',
  'If you\'re going up the Pale Steps, two emberroots and a beetle shell will keep the cold out.',
  'Moth dust and moonpetal. Makes you hard to see. Makes you sneeze, too.',
  'A lantern fish and two moonpetals. Shows you the truth of a place, walls and all.',
  'Frostmint with a glowcap puts the shine back in your lantern.',
  'Bone, emberroot and straw. Goes bang. Do it outdoors.',
  'Some recipes aren\'t written down anywhere sensible. Read everything, dear. Even the scraps.',
];
G.A.nettleTalk = () => { G.nettleLine = G.pick(G.NETTLE_LINES); G.refresh(); };
G.A.nettleCarp = function () {
  if (!G.pay({ carp: 3 })) return;
  G.S.flags.carpDone = 1;
  G.give('thimble');
  G.give('s_moon', 3);
  G.talk('Granny Nettle', ['Granny sniffs the gloomcarp, one by one, like a jeweller.', '"Lovely. Sulky, fat, perfect. Here, take my old thimble, and some moonpetal seeds."', '"And whatever you do, don\'t put three gloomcarp in a pot together. ...Or do. I won\'t tell you what happens."']);
};

// ---------------------------------------------------------------- the Lighthouse
G.PLACES.lighthouse = {
  render() {
    const S = G.S;
    let quest = '';
    if (!S.flags.ysoldeFish) quest += G.has('lfish') ? `<p>${G.btn('Give Ysolde a Lantern Fish', 'ysoldeFish')}</p>` : '<p class="small dim">"Have you ever seen a lantern fish? They used to swim right up to the rocks here. I would give a great deal to see one again."</p>';
    if (!S.flags.ysoldeLocket && G.has('locket')) quest += `<p>${G.btn('Give Ysolde the tarnished locket', 'ysoldeLocket')}</p>`;
    return `<h2>The Lighthouse</h2><pre class="art">        _/\\_
       |[  ]|   <span class="gold">- - - - - - -</span>
        |  |
       /    \\
      /  []  \\
  ~~~/________\\~~~~~~~~</pre>
      <p class="dim">A lighthouse on a rock at the edge of the world, lamp burning, looking out over a sea with no ships. Its keeper, Ysolde, is surprised to see you. Then delighted.</p>
      <div class="panel"><p class="quote">${S.flags.ysoldeLocket ? '"I keep it lit for you now, wanderer. So you can always find your way back."' : '"Nobody has come out here in eleven years. Sit, sit. Tea? It\'s mostly hot water, but it\'s hot."'}</p>${quest}</div>${back()}`;
  },
};
G.A.ysoldeFish = function () {
  if (!G.pay({ lfish: 1 })) return;
  G.S.flags.ysoldeFish = 1;
  G.give('keeperlens');
  G.talk('Ysolde', ['Ysolde cups the lantern fish in her hands. Its little light shines on her face.', '"Oh, look at you. Look at you." She lets it go into the sea and watches it swim away, glowing.', '"Here. My spare lens. It\'s small, but it throws light a long way. Like you."']);
};
G.A.ysoldeLocket = function () {
  if (!G.pay({ locket: 1 })) return;
  G.S.flags.ysoldeLocket = 1;
  G.give('motes', 5000);
  G.give('moonstones', 2);
  G.talk('Ysolde', ['Ysolde opens the locket. Inside is a tiny painting of this lighthouse.', 'She doesn\'t say anything for a long time. Then she puts it on the lamp-shelf, facing the sea.', '"Thank you for bringing him home."'], [{ label: 'Goodbye', fn: () => G.gainPage('ysolde') }]);
};

// ---------------------------------------------------------------- the Night Market
G.PLACES.crow = {
  render() {
    const S = G.S;
    if (!G.locOpen('crow')) return `<h2>The Crossroads</h2><p class="dim">Just an empty crossroads. A single black feather spins in the dust. Come back after dark.</p>${back()}`;
    if (!S.flags.visitedCrow) { S.flags.visitedCrow = 1; G.checkAch(); }
    return `<h2>The Night Market</h2><pre class="art">      ___________
     /  ~ CAW ~  \\
    /_____________\\
     |  (v)  (v)  |
     |____\\___/___|</pre>
      <p class="dim">A stall of black canvas that was not there an hour ago. Behind it, a crow in a waistcoat named Corvin, who deals only in moonstones.</p>
      <div class="panel"><h3>Wares</h3><ul class="list">${G.stockList('crow')}
      ${S.spells.swarm ? '' : shopRow('Learn Moth Swarm', 'buySpell', 'swarm', G.SPELLS.swarm.price, G.SPELLS.swarm.d)}
      ${S.pages.corvin ? '' : shopRow("Corvin's Ledger (a page)", 'buyLedger', '', { moonstones: 1 }, 'Corvin\'s private sales records.')}</ul></div>
      <p class="quote">"${G.esc(G.pick(['Moonstones only. Motes are for people with jars.', 'Everything has a price. Prices do not care.', 'You have the look of someone who will do something foolish and important.', 'Caw. Excuse me. Habit.']))}"</p>${back()}`;
  },
};
G.A.buyLedger = () => { if (G.pay({ moonstones: 1 })) G.gainPage('corvin'); };

// ---------------------------------------------------------------- NPCs met on expeditions
G.NPCS = {
  tobb: {
    talk() {
      const S = G.S;
      if (S.flags.k_scarecrow && !S.flags.tobbThanks) {
        S.flags.tobbThanks = 1;
        G.give('motes', 100);
        G.talk('Farmer Tobb', ['"You did it! The scarecrow\'s just straw now. I watched something small and dark scuttle out of it and away."', '"Here, for your trouble. And if you see Mira\'s blue ribbon out in that paddock, Marla would be ever so grateful."']);
      } else if (S.flags.k_scarecrow) G.talk('Farmer Tobb', '"Quiet out there now. I almost miss the crows. Almost."');
      else G.talk('Farmer Tobb', ['"Don\'t go near the scarecrow! It used to be an ordinary scarecrow. Then the long dark came, and something climbed inside it."', '"It keeps the crows now. They bring it things. My Mira gave it her ribbon, bless her."', '"The paddock\'s in the north-east. Rest at the old shrine before you go in."']);
    },
  },
  pell: {
    talk() {
      const S = G.S;
      const lines = ['"Oh! A light! A real light! I thought I\'d be down here forever." Pell the miner is grimy and very relieved.'];
      if (!S.flags.pellGift) { S.flags.pellGift = 1; G.give('heal', 2, { quiet: true }); lines.push('"Here, take these draughts. I\'ve been too scared to drink them."'); }
      lines.push('"Hask sealed the lower tunnels. The key\'s in a chest by the broken cart, west side. And there\'s an old pick in a chest here somewhere. You can break cracked walls with it, if you see any."');
      lines.push('"Odessa\'s old lamps are still down here, too. Dead. If you lit them, it\'d be a lot less scary."');
      lines.push('"And SHE is down there. The Grubmother. Sings to her babies. Don\'t let her sing to you."');
      G.talk('Pell', lines);
    },
  },
  nettle: {
    talk() {
      const S = G.S;
      if (!S.locs.nettle) {
        S.locs.nettle = 1;
        G.unlockTab('cauldron');
        G.talk('Granny Nettle', ['A tiny old woman in a hat made of briars is weeding a patch of moonpetals with a knife. She does not look up.', '"Took you long enough. Wick\'s friend, aren\'t you? I can smell the candle on you."', '"I\'m Granny Nettle. My cottage is just through there. You can use my old cauldron, it\'s far too big for me now. I\'ve sent it to your hut. Don\'t ask how."', '"Two glowcaps makes a Healing Draught. Work the rest out yourself. That\'s half the fun."'], [{ label: 'Thank you, Granny' }]);
      } else G.talk('Granny Nettle', '"Shoo. I\'m weeding. Come to the cottage if you want to buy something."');
    },
  },
  aurel: {
    talk() {
      const S = G.S;
      if (!S.flags.gotBriar) {
        S.flags.gotBriar = 1;
        G.give('briarkey', 1, { quiet: true });
        G.talk('Aurel the Hermit', ['An old man sits on a stump, carving a tiny wooden moth. His eyes are the colour of old gold.', '"My family were Lumenwrights, long ago. We were the ones who were sorry."', '"The Stag guards the north path. It thinks it is protecting the sun by keeping everyone out. It is only keeping the world in the dark."', '"Here. A Briar Key. It opens the Stag\'s gate. When it charges, step aside and let it hit the trees."'], [{ label: 'Take the key' }]);
      } else G.talk('Aurel the Hermit', ['"Go well, little light. When it charges, step aside."']);
    },
  },
  clerk: {
    talk() {
      const S = G.S;
      if (S.flags.gate_clerk) { G.talk('Clerk-7', '"FILING COMPLETE. HAVE A BRIGHT DAY. IT IS ALWAYS NOON IN HALCYON." (It is not.)'); return; }
      const lines = ['A brass automaton sits at a desk, pen in hand, utterly still. A plaque reads: CLERK-7. ARCHIVE ACCESS.'];
      if (G.has('gear')) {
        G.take('gear');
        S.flags.gate_clerk = 1;
        lines.push('You fit one of your Clockwork Gears into the empty socket in its chest. It whirrs.', '"GOOD NOON, CITIZEN. YOUR REQUEST FOR ARCHIVE ACCESS IS... APPROVED." Somewhere to the north, a gate grinds open.', '"NOTE: THE ENGINES ARE HUNGRY. THE DRILL IS DEEP. THE QUEEN HAS GONE UP THE MOUNTAIN. PLEASE STAND BY."');
        G.Dun.computeFlow();
      } else lines.push('There is an empty socket in its chest, shaped exactly like a gear.');
      G.talk('Clerk-7', lines);
    },
  },
  mothrael: {
    talk() { G.talk('Mothrael', ['"It is close now. It is all around us. Keep your light high, little ember\'s friend. Touch the old shrines when it dims."', '"When I flare my wings, strike."']); },
  },
};

G.ITEMS.lullaby.onFirst = () => setTimeout(() => G.modal('<div class="who">Lullaby Sheet</div><div class="txt">On the altar, sealed in a bubble of air, lies a single sheet of music. The notes are simple, almost childish. At the top, in faded gold: <i>For Mothrael, when he cannot sleep.</i>\n\nYou feel that singing it would only work if you truly understood who it was for.</div>'), 50);

// ---------------------------------------------------------------- bosses
G.BOSS_KILL = {
  scarecrow() {
    G.S.locs.caves = 1;
    G.Dun.msg('Something small and dark scuttles out of the scarecrow\'s chest and away. The straw slumps. (Rootdeep Caves appears on your map.)', 'good');
  },
  grubmother() {
    G.S.locs.forest = 1;
    G.S.locs.lake = 1;
    G.Dun.msg('The Grubmother sinks into the roots. Something bright falls from her: a Sun Shard! (Thornwood and Stillwater Lake appear on your map.)', 'gold');
  },
  stag() {
    G.S.locs.ruins = 1;
    G.talk('The Briar Stag', ['The great stag kneels in the briars. When it speaks, its voice is creaking wood.', '"I swore... nothing would wake her while she slept. I thought the dark was protecting her. The dark was only hiding her from those who loved her."', '"Take my crown, little light. And this piece of morning. Go north, past the ruins of the ones who woke the hunger."'], [{ label: 'Rest now' }]);
  },
  eel() { G.Dun.msg('The Lantern Eel coils up and goes dark, at last at peace. It leaves an Ember Heart and a Sun Shard.', 'gold'); },
  golem() {
    G.S.locs.peak = 1;
    G.Dun.msg('The Unfinished grinds to a halt. In its empty chest, where a heart should be, sits a Sun Shard. (The Pale Steps appear on your map.)', 'gold');
  },
  matron() {
    G.talk('Ilvane, the Hoarfrost Matron', ['The frost falls away from her like a cloak. Underneath is an old woman, very tired.', '"You carry pieces of her. Of the morning." She touches a Sun Shard with one finger, and smiles.', '"I am sorry. Tell her I am sorry. Go to the spire. Wake him, if you can, or free her, if you must. But please... be kind to the moth. He was the only one of us who was."'], [{ label: 'I will' }]);
  },
  mothking() { G.ending('dawn'); },
  unlit() { G.ending(G.S.flags.sang ? 'twolights' : 'longday'); },
};

// ---------------------------------------------------------------- the Moth King
G.TRIGGERS = {
  mothking() {
    const D = G.Dun, S = G.S;
    const mk = D.m.mobs.find(m => m.id === 'mothking');
    if (!mk || !mk.dormant) return;
    const understands = G.MOTH_PAGES.every(p => S.pages[p]);
    const wake = () => { mk.dormant = false; mk.aware = true; mk.lastSeen = D.t; D.msg('Mothrael\'s eyes open. They are full of trapped sunlight. He rises.', 'bad'); };
    const choices = [{ label: 'Draw your weapon', fn: wake }];
    if (G.has('lullaby')) choices.push({ label: 'Sing the lullaby', fn: understands ? G.sing : () => G.modal('<div class="txt">You hum the first notes... but the words feel hollow in your mouth. You don\'t understand who this song is for, not really. Mothrael stirs, but does not wake.\n\n<span class="dim">(Perhaps his own songs, scattered across the world, would help you understand him.)</span></div>') });
    if (S.flags.wickReady) choices.push({ label: 'Let Wick burn', fn: () => (S.motes >= 1e6 ? G.ending('newsun') : G.modal('<div class="txt wick">Wick: "I need a million motes to do this. All at once. I\'m sorry. I\'m only a little flame right now."</div>')) });
    choices.push({ label: 'Step back' });
    G.talk('The Heart of the Cocoon', ['The chamber is warm, like the inside of a held breath. Silk glows on every wall.', 'Coiled in the centre is the Moth King. Mothrael. Wings like two nights folded together, eyes closed. Through the thin silk of his chest you can see something burning, gold and patient.', 'He is not attacking. He is asleep. He is holding something very carefully.'], choices);
  },
};
G.sing = function () {
  const D = G.Dun, S = G.S;
  S.flags.sang = 1;
  S.locs.under = 1;
  D.m.mobs = D.m.mobs.filter(m => m.id !== 'mothking');
  G.talk('Mothrael', [
    'You sing. The notes are simple, almost childish. Your voice cracks on the high part. It does not matter.',
    'The Moth King\'s eyes open. They are full of sunlight. He looks at you for a very long time.',
    '"That song," he says, and his voice is wind through silk. "She sang that song. Every evening, so that I would rest. I have not rested since."',
    '"I have held her for an age, little one. The hunger beneath the world is still awake. If I open my heart now, it will rise and swallow her."',
    '"But you are here. And you carry light. Come with me, down, under the roots of the roots. Together we will close that mouth. And then... then I can let her go."',
    'He unfolds his wings, impossibly vast, and drops through the floor of the spire like a falling star. (The Underneath appears on your map.)',
  ], [{ label: 'Follow him' }]);
};

// ---------------------------------------------------------------- endings
G.ENDINGS = {
  dawn: { t: 'Dawn', art: '      \\   |   /\n   --  ( SUN )  --\n      /   |   \\',
    txt: 'Mothrael falls. His great wings crumple like burnt paper, and from his chest pours light, real light, gold and impossible. It rises. It rises, and keeps rising, and becomes the sun.\n\nFor the first time in an age, it is morning in Dimvale. People run into the street and squint and cry. Marla drops her spoon. Odessa blows out every lamp in the village, laughing. Wick shouts so loudly she nearly goes out.\n\nBut far below, under the roots of the roots, something feels the warmth on its face... and wakes up hungry.\n\n(The Underneath has opened. The jar catches twice as many motes in the sunshine.)' },
  twolights: { t: 'Two Lights', art: '    \\  |  /      \\^/\n  -- (SUN) --    <W>\n    /  |  \\      /v\\',
    txt: 'The Unlit comes apart like smoke in sunlight, and the mouth beneath the world closes with a sound like a door shutting softly in another house.\n\nMothrael opens his wings, and his heart, and out of him steps a lady made of morning. Solenne. She looks at the moth for a long time. "You kept me safe," she says. "I kept you," he says. That is all. It is enough.\n\nShe rises into the sky. And the moth, at last, sleeps, curled on the warm hillside above Dimvale, where children climb on him and he pretends not to notice.\n\nIn the hut, Wick looks up at the sun and whispers: "Hi, Mum."\n\n(The jar catches twice as many motes in the sunshine.)' },
  longday: { t: 'The Long Day', art: '    \\  |  /\n  -- (SUN) --\n    /  |  \\',
    txt: 'The Unlit comes apart like smoke in sunlight. The hunger beneath the world is gone, and the sun you freed will never be swallowed again.\n\nThe moth is gone too. You think of him sometimes, when the evening comes, and you are glad that it does.\n\nIt is going to be a long, bright day.' },
  newsun: { t: 'A New Sun', art: '      .   *   .\n   *  ( ^-^ )  *\n      \'   *   \'',
    txt: 'Wick drinks a million motes, all at once. She grows. And grows. "Oh! Oh, this is... I\'m ENORMOUS! Look at me! Don\'t look directly at me!"\n\nShe rises through the roof of the cocoon, out into the sky, and becomes a small, fierce, brand-new sun. The Moth King sleeps on beneath her, holding the old sun safe. Far below, the Unlit stirs, sniffs at this strange new light, finds it unfamiliar... and goes back to sleep.\n\nIn Dimvale, the mornings are a little orange now, and they hum to themselves. Every evening, the sun winks at your hut before it sets.\n\n(The jar catches twice as many motes in the sunshine. Wick can still talk to you, loudly, from the sky.)' },
};
G.ending = function (id) {
  const S = G.S, e = G.ENDINGS[id];
  S.endings[id] = Date.now();
  if (id !== 'longday') S.flags.sunrise = 1;
  if (id === 'dawn') S.locs.under = 1;
  if (id === 'newsun') { S.motes -= 1e6; G.wickLine = 'HELLO DOWN THERE! I can see your house from here! It\'s TINY!'; }
  if (id === 'twolights' || id === 'longday') S.flags.k_unlit = 1;
  G.checkAch();
  G.save();
  const n = ['dawn', 'twolights', 'newsun'].filter(k => S.endings[k]).length;
  const show = () => G.modal(`<div class="who">Ending: ${e.t}</div><pre class="art gold">${G.esc(e.art)}</pre><div class="txt">${G.esc(e.txt)}</div>
    <hr class="sep"><p class="dim small">MOTHLIGHT. Endings found: ${n} of 3${S.endings.longday ? ' (and the long day)' : ''}. You can keep playing in the sunshine, or start New Game+ from Options.</p>`, [{ label: 'Continue', fn: () => { if (G.Dun.active) G.Dun.stop('hut'); else G.go('hut'); } }], { cls: 'wide' });
  setTimeout(show, 30);
};
