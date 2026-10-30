'use strict';
// Expedition maps, drawn with a small builder so walls line up.
// Global tiles: ' ' void, # wall, % cracked wall, & false wall, . floor, , grass, " tall grass, T tree,
// ~ water, = bridge, + door, ^ rock, : ice, * snow.
// Global objects: < start, > exit, $ mote pile, ? sign (texts in order), 0 light shrine.
// Everything else is defined per map in `legend`.

G.MapBuilder = function (w, h, fill, seed) {
  const g = [];
  for (let y = 0; y < h; y++) g.push(new Array(w).fill(fill));
  let s = seed || 1;
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const ok = (x, y) => x >= 0 && y >= 0 && x < w && y < h;
  const b = {
    set(x, y, c) { if (ok(x, y)) g[y][x] = c; return b; },
    rect(x, y, rw, rh, c = '.') {
      for (let j = y; j < y + rh; j++) for (let i = x; i < x + rw; i++) b.set(i, j, c);
      return b;
    },
    box(x, y, rw, rh, wall, floor) { b.rect(x, y, rw, rh, wall); return b.rect(x + 1, y + 1, rw - 2, rh - 2, floor); },
    h(x1, x2, y, c = '.') { for (let i = Math.min(x1, x2); i <= Math.max(x1, x2); i++) b.set(i, y, c); return b; },
    v(x, y1, y2, c = '.') { for (let j = Math.min(y1, y2); j <= Math.max(y1, y2); j++) b.set(x, j, c); return b; },
    // A rectangle with a few random bulges on its rim, for organic rooms.
    cave(x, y, rw, rh, c = '.', p = 0.35) {
      b.rect(x, y, rw, rh, c);
      for (let j = y - 1; j <= y + rh; j++) for (let i = x - 1; i <= x + rw; i++) {
        const ey = j === y - 1 || j === y + rh, ex = i === x - 1 || i === x + rw;
        if ((ey || ex) && !(ey && ex) && i > 0 && j > 0 && i < w - 1 && j < h - 1 && g[j][i] === fill && rnd() < p) g[j][i] = c;
      }
      return b;
    },
    noise(x, y, rw, rh, c, p, on) {
      for (let j = y; j < y + rh; j++) for (let i = x; i < x + rw; i++) if (ok(i, j) && g[j][i] === on && rnd() < p) g[j][i] = c;
      return b;
    },
    border(c) { b.h(0, w - 1, 0, c); b.h(0, w - 1, h - 1, c); b.v(0, 0, h - 1, c); return b.v(w - 1, 0, h - 1, c); },
    put(list) { for (const [c, x, y] of list) b.set(x, y, c); return b; },
    rows() { return g.map(r => r.join('')); },
  };
  return b;
};

G.MAPS = {};

// ======================================================================== Whisperwheat Field
G.MAPS.field = (() => {
  const b = G.MapBuilder(64, 22, ',', 7);
  b.border('T');
  b.rect(8, 1, 19, 7, '"');                 // the wheat
  b.box(28, 2, 19, 6, '#', '.');            // farmhouse + cellar
  b.v(40, 3, 6, '#').set(40, 4, '%').set(34, 7, '+');
  b.box(48, 1, 15, 10, '#', ',').set(55, 10, ',');  // scarecrow's paddock
  b.rect(3, 13, 18, 7, '~').rect(9, 15, 5, 2, ',').h(14, 20, 16, '=');  // pond, island, bridge
  for (const y of [13, 15, 17, 19]) for (let x = 28; x <= 46; x += 3) b.set(x, y, 'T');  // orchard
  b.rect(29, 14, 2, 1, '"').rect(38, 14, 3, 1, '"').rect(29, 16, 2, 1, '"').rect(36, 16, 2, 1, '"').rect(44, 16, 2, 1, '"');
  b.rect(52, 18, 8, 2, '"').rect(22, 11, 4, 2, '"').rect(3, 4, 3, 2, '"');
  b.put([
    ['>', 1, 10], ['<', 2, 10], ['?', 3, 8],
    ['r', 14, 2], ['r', 18, 6], ['h', 22, 4], ['c', 5, 6], ['c', 12, 9], ['v', 35, 14], ['h', 33, 16],
    ['v', 34, 18], ['v', 58, 15], ['h', 55, 19], ['r', 23, 11], ['c', 45, 11],
    ['S', 55, 5],
    ['1', 17, 3], ['2', 31, 4], ['3', 61, 2], ['4', 44, 5], ['5', 11, 15],
    ['N', 37, 4], ['p', 30, 6], ['q', 43, 4],
    ['$', 35, 8], ['$', 39, 16], ['$', 24, 20], ['$', 4, 5], ['$', 60, 9],
    ['0', 55, 12],
  ]);
  return {
    n: 'Whisperwheat Field', tier: 1, outdoor: 1, view: 9, floor: ',', motes: [12, 28],
    rows: b.rows(),
    legend: {
      r: { mob: 'rat' }, c: { mob: 'cricket' }, v: { mob: 'crow' }, h: { mob: 'lurker' }, S: { mob: 'scarecrow' },
      1: { chest: [['clover', 1]] },
      2: { chest: [['heal', 2], ['motes', 30]] },
      3: { chest: [['ribbon', 1], ['motes', 50]] },
      4: { chest: [['bomb', 1], ['motes', 150]] },
      5: { chest: [['heal', 1], ['motes', 70]] },
      N: { npc: 'tobb' }, p: { page: 'diary1' }, q: { page: 'diary2' },
    },
    signs: ['WHISPERWHEAT FIELD.\nMind the wheat, things hide in it.\nMind the scarecrow, it bites harder.\n   - Tobb'],
  };
})();

// ======================================================================== Rootdeep Caves
G.MAPS.caves = (() => {
  const b = G.MapBuilder(56, 27, '#', 3);
  b.cave(1, 1, 8, 5).h(9, 14, 3).cave(15, 1, 12, 6).v(20, 7, 9).cave(14, 10, 15, 6);
  b.v(4, 6, 11).cave(1, 12, 10, 6).h(29, 36, 12).cave(37, 8, 16, 7);
  b.rect(41, 2, 7, 4).set(44, 6, '%').set(44, 7, '.');     // hidden carving room
  b.v(5, 18, 22).set(5, 20, 'D').rect(6, 21, 24, 2);         // lower door + tunnel
  b.cave(30, 18, 24, 8, '.', 0.25);                          // the Grubmother's hollow
  b.h(30, 53, 17, '#');
  b.put([
    ['>', 1, 1], ['<', 2, 1], ['?', 6, 3],
    ['i', 25, 1], ['i', 37, 8], ['i', 10, 22],
    ['b', 19, 2], ['b', 24, 4], ['b', 17, 13], ['b', 15, 21], ['e', 42, 9], ['e', 41, 12], ['e', 5, 14],
    ['m', 47, 10], ['m', 44, 14], ['u', 23, 11], ['u', 8, 15],
    ['N', 16, 11], ['1', 27, 14], ['2', 2, 16], ['3', 51, 9], ['4', 45, 3],
    ['p', 8, 12], ['q', 43, 3], ['r', 23, 13],
    ['$', 3, 13], ['$', 48, 12], ['$', 44, 5], ['$', 21, 22], ['$', 26, 5],
    ['0', 27, 22], ['G', 41, 21], ['>', 52, 25],
  ]);
  return {
    n: 'Rootdeep Caves', tier: 2, dark: 1, floor: '.', motes: [50, 110],
    rows: b.rows(),
    legend: {
      b: { mob: 'bat' }, e: { mob: 'beetle' }, u: { mob: 'grub' }, m: { mob: 'mole' }, G: { mob: 'grubmother' },
      i: { lamp: 1 }, N: { npc: 'pell' }, D: { door: 'cavekey' },
      1: { chest: [['pick', 1], ['motes', 60]] },
      2: { chest: [['cavekey', 1], ['motes', 90]] },
      3: { chest: [['minerhelm', 1]] },
      4: { chest: [['motes', 400], ['heal', 2], ['moonstones', 1]] },
      p: { page: 'miner' }, q: { page: 'carving' }, r: { page: 'grubnotes' },
    },
    signs: ['ROOTDEEP MINE - CLOSED\nby order of Foreman Hask.\nLamps out. Grubs in. Go home.'],
  };
})();

// ======================================================================== Thornwood
G.MAPS.forest = (() => {
  const b = G.MapBuilder(62, 28, 'T', 11);
  b.cave(1, 20, 8, 6, ',').rect(8, 23, 23, 2, ',');
  b.rect(13, 15, 7, 5, ',');                                  // hidden grove
  b.rect(22, 17, 13, 6, ',').rect(30, 13, 2, 4, ',').cave(26, 9, 13, 5, ',');
  b.rect(13, 11, 13, 2, ',').cave(2, 7, 11, 8, ',');          // to Granny Nettle
  b.v(28, 6, 8, ',').cave(22, 1, 12, 5, ',');                 // the hermit
  b.rect(39, 11, 10, 2, ',').set(48, 10, ',');
  b.cave(39, 1, 19, 8, ',');                                  // the Stag's clearing
  b.rect(49, 10, 4, 2, ',').v(52, 12, 17, ',').rect(35, 20, 3, 1, ',');
  b.cave(38, 18, 20, 7, ',');                                 // bramble thicket
  b.noise(22, 17, 13, 6, '"', 0.25, ',').noise(38, 18, 20, 7, '"', 0.22, ',').noise(39, 19, 18, 5, 'T', 0.07, ',');
  b.noise(2, 20, 7, 6, '"', 0.2, ',');
  // seal the clearing and the grove
  b.h(38, 58, 9, 'T').v(38, 1, 9, 'T').set(48, 9, 'D');
  b.h(12, 20, 14, 'T').h(12, 20, 20, 'T').v(12, 14, 20, 'T').v(20, 14, 20, 'T');
  b.v(16, 20, 21, ',').set(16, 22, '&');
  b.border('T');
  b.put([
    ['>', 2, 22], ['<', 3, 22], ['?', 6, 21],
    ['q', 15, 16], ['3', 18, 17],
    ['s', 25, 18], ['s', 33, 20], ['w', 28, 21], ['t', 31, 18], ['t', 12, 24], ['w', 22, 23],
    ['w', 30, 10], ['s', 36, 12], ['t', 18, 11], ['w', 24, 3], ['s', 42, 12], ['t', 45, 11],
    ['t', 40, 20], ['t', 44, 22], ['w', 50, 19], ['s', 55, 21], ['t', 53, 23], ['w', 47, 23],
    ['N', 6, 9], ['r', 10, 13], ['2', 3, 13], ['A', 27, 2], ['1', 32, 2],
    ['0', 51, 10], ['p', 50, 11], ['Y', 48, 4], ['>', 56, 2], ['4', 57, 23],
    ['$', 6, 24], ['$', 33, 22], ['$', 37, 10], ['$', 56, 24], ['$', 11, 8], ['$', 57, 19],
  ]);
  return {
    n: 'Thornwood', tier: 3, outdoor: 1, view: 7, floor: ',', motes: [180, 360], falseLook: 'T', crackLook: 'T',
    rows: b.rows(),
    legend: {
      w: { mob: 'wolf' }, s: { mob: 'spriggan' }, t: { mob: 'thornling' }, Y: { mob: 'stag' },
      N: { npc: 'nettle' }, A: { npc: 'aurel' }, D: { door: 'briarkey', look: 'gate' },
      1: { chest: [['motes', 450], ['tonic', 2]] },
      2: { chest: [['s_moon', 2], ['s_ember', 3], ['emberroot', 2]] },
      3: { chest: [['moonstones', 1], ['motes', 700]] },
      4: { chest: [['motes', 800], ['heal', 3]] },
      p: { page: 'stagvow' }, q: { page: 'poem1' }, r: { page: 'nettle' },
    },
    signs: ['THORNWOOD.\nKeep to the path.\nThe path does not keep to you.'],
  };
})();

// ======================================================================== Drowned Shrine
G.MAPS.shrine = (() => {
  const b = G.MapBuilder(50, 30, '#', 5);
  b.rect(20, 25, 10, 4).rect(24, 15, 2, 10).set(24, 14, '.').set(24, 13, 'D');
  b.rect(3, 15, 14, 8).h(17, 23, 18).rect(6, 17, 8, 3, '~').h(6, 13, 18, '=');
  b.set(9, 14, '%').rect(6, 10, 7, 4);                       // hidden sacristy
  b.rect(33, 15, 14, 8).h(26, 32, 19).rect(36, 18, 3, 3, '~').rect(42, 16, 2, 5, '~');
  b.rect(14, 4, 20, 9).rect(16, 6, 3, 5, '~').rect(29, 6, 3, 5, '~');   // the nave
  b.v(40, 13, 14).rect(36, 1, 13, 12);                       // the eel's pool
  b.rect(37, 2, 2, 3, '~').rect(46, 2, 2, 3, '~').rect(37, 9, 2, 3, '~').rect(46, 9, 2, 3, '~');
  b.put([
    ['<', 24, 27], ['>', 25, 28], ['?', 21, 26], ['!', 29, 25], ['!', 20, 28],
    ['!', 14, 4], ['!', 33, 4], ['L', 24, 5], ['p', 15, 11], ['3', 32, 12],
    ['q', 8, 11], ['2', 11, 12],
    ['1', 45, 16], ['0', 46, 21], ['4', 4, 21],
    ['a', 5, 16], ['a', 15, 21], ['x', 11, 21], ['l', 24, 20], ['j', 22, 26], ['j', 10, 16],
    ['j', 38, 22], ['a', 35, 16], ['x', 44, 22], ['l', 30, 19], ['j', 20, 8], ['j', 28, 11],
    ['a', 22, 11], ['a', 26, 6], ['x', 40, 20],
    ['E', 42, 6], ['>', 47, 6],
    ['$', 27, 26], ['$', 4, 19], ['$', 45, 19], ['$', 20, 12], ['$', 10, 11],
  ]);
  return {
    n: 'The Drowned Shrine', tier: 4, dark: 1, floor: '.', motes: [380, 760],
    rows: b.rows(),
    legend: {
      a: { mob: 'acolyte' }, x: { mob: 'crab' }, l: { mob: 'eeling' }, j: { mob: 'jelly' }, E: { mob: 'eel' },
      '!': { torch: 3 }, D: { door: 'coralkey' }, L: { item: 'lullaby' },
      1: { chest: [['coralkey', 1], ['motes', 900]] },
      2: { chest: [['moonstones', 1], ['motes', 1500]] },
      3: { chest: [['locket', 1]] },
      4: { chest: [['moonpetal', 3], ['motes', 1200]] },
      p: { page: 'confession' }, q: { page: 'poem2' },
    },
    signs: ['THE SHRINE OF THE LULLABY.\nSilence, too, is a kind of song.'],
  };
})();

// ======================================================================== Lumenwright Ruins
G.MAPS.ruins = (() => {
  const b = G.MapBuilder(60, 30, '#', 9);
  b.rect(2, 24, 12, 4).rect(14, 25, 32, 2);
  b.set(20, 24, '.').set(28, 27, '.').set(36, 24, '.').set(42, 27, '.');
  b.v(10, 13, 23).rect(3, 6, 14, 7).rect(4, 1, 8, 4);        // archive + inner archive
  b.v(30, 15, 24).rect(22, 8, 18, 7).rect(25, 1, 11, 6);     // lever hall + vault
  b.rect(41, 8, 10, 6).set(51, 10, '%').rect(52, 8, 6, 5);   // east hall + hidden
  b.set(46, 25, 'D').rect(47, 15, 12, 13).rect(42, 23, 4, 2);
  b.put([
    ['>', 3, 25], ['<', 4, 25], ['?', 6, 24],
    ['z', 20, 24], ['z', 28, 27], ['z', 36, 24], ['z', 42, 27],
    ['k', 18, 26], ['k', 33, 25], ['k', 12, 9], ['k', 35, 11], ['h', 25, 12], ['h', 44, 10], ['h', 40, 26],
    ['C', 14, 8], ['g', 8, 5], ['t', 4, 7], ['u', 5, 2], ['1', 10, 2],
    ['n', 3, 12], ['L', 23, 9], ['M', 38, 13], ['b', 30, 7], ['2', 26, 2], ['w', 34, 2],
    ['c', 40, 11], ['3', 49, 12], ['q', 54, 10], ['4', 56, 9],
    ['0', 43, 23], ['U', 52, 20], ['/', 48, 16], ['/', 57, 16], ['/', 48, 26], ['/', 57, 26], ['>', 57, 21],
    ['$', 13, 26], ['$', 6, 10], ['$', 37, 9], ['$', 45, 9], ['$', 30, 3], ['$', 55, 11], ['$', 31, 26],
  ]);
  return {
    n: 'Lumenwright Ruins', tier: 5, dark: 1, floor: '.', motes: [800, 1600],
    rows: b.rows(),
    legend: {
      z: { mob: 'sentry' }, k: { mob: 'spider' }, h: { mob: 'hound' }, U: { mob: 'golem' },
      C: { npc: 'clerk' }, g: { gate: 'clerk' }, t: { item: 'tablet1' }, u: { item: 'tablet2' }, w: { item: 'tablet3' },
      n: { lever: 'l3' }, L: { lever: 'l1' }, M: { lever: 'l2' }, b: { gate: ['l1', 'l2'] }, c: { gate: ['l3'] },
      D: { door: 'cogkey' }, '/': { blever: 1 },
      1: { chest: [['gearboots', 1], ['motes', 1500]] },
      2: { chest: [['cogkey', 1], ['motes', 3000]] },
      3: { chest: [['gear', 3], ['scrap', 5], ['motes', 2500]] },
      4: { chest: [['moonstones', 2], ['star', 1]] },
      q: { page: 'poem3' },
    },
    signs: ['HALCYON, CITY OF ENDLESS NOON.\nPopulation: (the number has been scratched out)'],
  };
})();

// ======================================================================== The Pale Steps
G.MAPS.peak = (() => {
  const b = G.MapBuilder(56, 34, '^', 13);
  b.rect(22, 29, 12, 4, '*').set(27, 28, '*');               // base camp
  b.rect(8, 20, 33, 8, ':').v(27, 18, 19, '*');              // first ice field
  b.rect(20, 13, 16, 5, '*').h(36, 41, 15, '*').set(42, 15, 'D');
  b.rect(43, 13, 12, 14, '*').rect(45, 22, 8, 3, ':');        // the Matron's terrace
  b.set(27, 12, '*').rect(4, 4, 48, 8, ':');                 // upper ice field
  b.set(3, 4, '%').rect(1, 3, 2, 3, '*');                    // hidden ledge
  // first ice field: N, W, N, E, N
  b.set(27, 23, '^').set(20, 24, '*').set(28, 20, '^');
  b.rect(11, 25, 3, 2, '*').set(14, 21, '^').set(35, 22, '^').set(38, 26, '*').set(16, 27, '^').set(17, 24, '^');
  // upper ice field
  b.set(27, 7, '^').rect(4, 8, 3, 2, '*').set(28, 9, '^').set(46, 4, '^').rect(47, 5, 3, 2, '*').set(26, 11, '^');
  b.set(15, 6, '^').set(36, 10, '^').set(40, 5, '^');
  b.put([
    ['<', 27, 31], ['>', 28, 31], ['?', 24, 30], ['$', 32, 30], ['n', 30, 30],
    ['4', 11, 25], ['n', 12, 26], ['f', 38, 26],
    ['0', 27, 14], ['p', 22, 16], ['?', 33, 16], ['$', 34, 14], ['O', 31, 13], ['f', 21, 14],
    ['2', 4, 8], ['1', 49, 5], ['n', 6, 9], ['f', 48, 6], ['q', 1, 4], ['3', 2, 5],
    ['M', 48, 19], ['g', 53, 25], ['>', 53, 14], ['f', 50, 15], ['O', 45, 25], ['$', 44, 14],
  ]);
  return {
    n: 'The Pale Steps', tier: 6, outdoor: 1, view: 8, cold: 1, floor: '*', motes: [2000, 3600], crackLook: '^',
    rows: b.rows(),
    legend: {
      f: { mob: 'wraith' }, n: { mob: 'hare' }, O: { mob: 'ogre' }, M: { mob: 'matron' },
      D: { door: 'rimekey' },
      1: { chest: [['crampons', 1], ['motes', 2500]] },
      2: { chest: [['rimekey', 1], ['motes', 3000]] },
      3: { chest: [['star', 1], ['moonstones', 2]] },
      4: { chest: [['frostmint', 3], ['s_frost', 2], ['motes', 3000]] },
      p: { page: 'climber' }, q: { page: 'poem4' }, g: { page: 'grief' },
    },
    signs: [
      'THE PALE STEPS.\nWrap up warm. Rest by the fires.',
      'A frozen climber sits here, smiling.\nIn his lap, a note: "Slide where you mean to stop."',
    ],
  };
})();

// ======================================================================== Cocoon Spire
G.MAPS.spire = (() => {
  const b = G.MapBuilder(44, 40, '#', 17);
  b.rect(14, 33, 16, 5).v(21, 32, 32).rect(4, 28, 36, 4);
  b.v(37, 25, 27).rect(4, 20, 36, 5).set(3, 22, '%').rect(1, 21, 2, 3);
  b.v(6, 17, 19).set(6, 18, 'D').rect(4, 12, 36, 5);
  b.v(22, 10, 11).rect(8, 1, 28, 9);
  b.put([
    ['<', 21, 35], ['>', 22, 36], ['?', 16, 34], ['$', 25, 35],
    ['p', 5, 29], ['2', 39, 31], ['v', 10, 29], ['v', 30, 30], ['x', 20, 28], ['K', 35, 29], ['$', 14, 30],
    ['1', 4, 24], ['x', 12, 21], ['v', 25, 23], ['K', 30, 21], ['v', 36, 22], ['x', 8, 23], ['$', 24, 22], ['3', 1, 22],
    ['0', 38, 12], ['K', 12, 13], ['x', 20, 15], ['v', 28, 13], ['v', 33, 15], ['$', 18, 14],
    ['Q', 22, 10], ['W', 22, 4], ['>', 34, 8],
    ['!', 4, 28], ['!', 39, 28], ['!', 4, 20], ['!', 39, 20], ['!', 4, 12], ['!', 39, 16],
    ['!', 8, 1], ['!', 35, 1], ['!', 8, 9], ['!', 35, 9],
  ]);
  return {
    n: 'The Cocoon Spire', tier: 7, dark: 1, floor: '.', motes: [4500, 8000],
    rows: b.rows(),
    legend: {
      v: { mob: 'dustmoth' }, x: { mob: 'weaver' }, K: { mob: 'knight' }, W: { mob: 'mothking' },
      '!': { torch: 2 }, D: { door: 'silkkey' }, Q: { trigger: 'mothking' },
      1: { chest: [['silkkey', 1], ['motes', 5000]] },
      2: { chest: [['silk', 4], ['motes', 8000]] },
      3: { chest: [['star', 1], ['moonstones', 2]] },
      p: { page: 'silk' },
    },
    signs: ['THE COCOON SPIRE.\nEvery thread here was spun by someone who loved him.'],
  };
})();

// ======================================================================== The Underneath
G.MAPS.under = (() => {
  const b = G.MapBuilder(50, 30, '#', 23);
  b.rect(2, 2, 8, 4).cave(10, 3, 14, 2).cave(22, 5, 3, 6).rect(5, 8, 16, 3).set(21, 9, '.');
  b.v(23, 11, 11).rect(14, 12, 30, 15);
  b.put([
    ['<', 4, 3], ['>', 3, 3], ['p', 6, 9], ['q', 16, 3], ['q', 8, 9], ['y', 23, 8], ['$', 19, 9], ['$', 30, 25],
    ['0', 18, 15], ['0', 39, 15], ['0', 18, 23], ['0', 39, 23],
    ['X', 28, 19], ['A', 28, 24], ['>', 42, 25],
  ]);
  return {
    n: 'The Underneath', tier: 8, dark: 1, floor: '.', motes: [9000, 15000], dim: 1,
    rows: b.rows(),
    legend: {
      q: { mob: 'shade' }, y: { mob: 'gnaw' }, X: { mob: 'unlit' }, A: { npc: 'mothrael', ally: 1 },
      p: { page: 'under1' },
    },
    signs: [],
  };
})();
