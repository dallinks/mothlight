// Usage: node tools/validate-maps.js [gameDir] [mapIdToPrint]
// Validates Mothlight maps: legend coverage, reachability, sealed secrets, ice sliding.
const fs = require('fs');
const vm = require('vm');
const root = process.argv[2] || require('path').join(__dirname, '..');
const ctx = { window: {}, console };
ctx.G = ctx.window.G = {};
vm.createContext(ctx);
for (const f of ['js/data/items.js', 'js/data/enemies.js', 'js/data/maps.js']) {
  vm.runInContext(fs.readFileSync(root + '/' + f, 'utf8').replace(/^'use strict';/, ''), ctx, { filename: f });
}
const G = ctx.G;
const TILES = new Set([' ', '#', '%', '&', '.', ',', '"', 'T', '~', '=', '+', '^', ':', '*']);
const GLOBAL = new Set(['<', '>', '$', '?', '0']);
const WALK = new Set(['.', ',', '"', '=', '+', '*', ':']);

for (const [id, m] of Object.entries(G.MAPS)) {
  const rows = m.rows, H = rows.length, W = Math.max(...rows.map(r => r.length));
  const at = (x, y) => (y >= 0 && y < H && x >= 0 && x < W ? rows[y][x] || ' ' : ' ');
  let start = null; const objs = []; let signs = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const c = at(x, y);
    if (TILES.has(c)) continue;
    if (c === '<') { start = [x, y]; continue; }
    if (c === '?') signs++;
    if (!GLOBAL.has(c) && !m.legend[c]) console.log(`[${id}] unknown char '${c}' at ${x},${y}`);
    if (m.legend[c] && m.legend[c].mob && !G.ENEMIES[m.legend[c].mob]) console.log(`[${id}] bad mob ${m.legend[c].mob}`);
    if (m.legend[c] && m.legend[c].chest) for (const [it] of m.legend[c].chest) if (!['motes', 'glowcaps', 'moonstones'].includes(it) && !G.ITEMS[it]) console.log(`[${id}] bad chest item ${it}`);
    objs.push({ c, x, y, L: m.legend[c] || {} });
  }
  if (signs !== m.signs.length) console.log(`[${id}] signs: ${signs} on map, ${m.signs.length} texts`);
  const blocking = o => ['?', '0'].includes(o.c) || o.L.chest || o.L.npc || o.L.lever || o.L.torch || o.L.lamp || o.L.blever;
  const objAt = {}; for (const o of objs) objAt[o.x + ',' + o.y] = o;
  function passable(x, y, secrets) {
    const o = objAt[x + ',' + y];
    if (o) {
      if (blocking(o)) return false;
      if (o.L.door || o.L.gate) return secrets;
      return true;
    }
    const c = at(x, y);
    if (c === '%' || c === '&') return secrets;
    if (c === '<') return true;
    return WALK.has(c);
  }
  const isIce = (x, y) => at(x, y) === ':' && !objAt[x + ',' + y];
  function bfs(secrets, slide) {
    const seen = new Set([start + '']); const q = [start];
    while (q.length) {
      const [x, y] = q.shift();
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        let nx = x + dx, ny = y + dy;
        if (!passable(nx, ny, secrets)) continue;
        if (slide) while (isIce(nx, ny) && passable(nx + dx, ny + dy, secrets)) { nx += dx; ny += dy; }
        const k = nx + ',' + ny;
        if (!seen.has(k)) { seen.add(k); q.push([nx, ny]); }
      }
    }
    return seen;
  }
  const reach = (set, o) => set.has(o.x + ',' + o.y) || [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => set.has((o.x + dx) + ',' + (o.y + dy)));
  const all = bfs(true, !!m.cold), plain = bfs(false, !!m.cold);
  const unreach = objs.filter(o => !reach(all, o));
  const behind = objs.filter(o => reach(all, o) && !reach(plain, o));
  console.log(`[${id}] ${W}x${H} objs=${objs.length} unreachable=${unreach.map(o => o.c + '@' + o.x + ',' + o.y).join(' ') || 'none'}`);
  console.log(`   behind doors/secrets: ${behind.map(o => o.c + '@' + o.x + ',' + o.y).join(' ') || 'none'}`);
  if (process.argv[3] === id) console.log(rows.join('\n'));
}
