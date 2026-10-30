'use strict';
// Game systems: income, Wick, inventory use, garden, cauldron, forge, fishing, dice, bounties, well, glimmers.

// ---------------------------------------------------------------- income
G.rate = function () {
  const S = G.S;
  let base = 1;
  for (let i = 0; i < S.lenses; i++) base += G.LENSES[i].add;
  let m = 1;
  if (S.mem.warmth) m *= 1.25;
  if (S.mem.fall) m *= 1.1;
  if (S.mem.siblings) m *= 1.25;
  if (S.sky.kettle) m *= 1.25;
  if (S.sky.ember) m *= 1.5;
  m *= 1 + 0.02 * Object.keys(S.ach).length;
  m *= 1 + G.calc().mote / 100;
  if (S.flags.sunrise) m *= 2;
  if (S.ng) m *= 1 + 0.25 * S.ng;
  if (G.boost && G.boost.until > Date.now()) m *= G.boost.mult;
  return base * m;
};

G.nextShooting = Date.now() + 120e3;
G.lastInput = Date.now();

G.idleTick = function (dt) {
  const S = G.S, now = Date.now();
  const gain = G.rate() * dt / 1000;
  S.motes += gain;
  S.total += gain;
  S.stats.time += dt;
  if (!G.Dun.active) {
    const mx = G.calc().maxHp;
    if (S.hp < mx) S.hp = Math.min(mx, S.hp + (mx * 0.012 + 0.2) * dt / 1000);
    if (S.hp > mx) S.hp = mx;
  }
  G.storyBeats();
  // shooting motes
  if (!G.shooting && now > G.nextShooting && !G.Dun.active && S.flags.wick) {
    G.shooting = { until: now + 14000 };
    G.renderTop();
  }
  if (G.shooting && now > G.shooting.until) {
    G.shooting = null;
    G.nextShooting = now + G.rand(150, 330) * 1000;
    G.renderTop();
  }
  // Wick dozes off if left alone on the hut screen
  if (S.flags.wick && G.view.tab === 'hut' && !G.modalOpen && now - G.lastInput > 300e3 && !G.wickAsleep) {
    G.wickAsleep = true;
    G.say('Zzz... mmh... singing... zzz...');
    if (!S.flags.dreamt) {
      S.flags.dreamt = 1;
      G.earn('dreams');
      G.gainPage('dream', true);
    }
    G.refresh();
  }
  // idle chatter
  if (S.flags.wick && !G.wickAsleep && G.view.tab === 'hut' && now - (G.lastWick || 0) > 70e3) {
    G.say(G.pick(G.WICK_IDLE), true);
    G.refresh();
  }
};

G.input = function () {
  G.lastInput = Date.now();
  if (G.wickAsleep) {
    G.wickAsleep = false;
    G.say('Hm? I wasn\'t asleep. I was... meditating. On light.');
    if (G.view.tab === 'hut') G.refresh();
  }
};

// One-off moments driven by totals.
G.storyBeats = function () {
  const S = G.S, f = S.flags;
  const beat = (flag, cond, fn) => { if (!f[flag] && cond) { f[flag] = 1; fn(); if (G.view.tab === 'hut') G.refresh(); } };
  beat('b_jar', S.total >= 2, () => G.log('The old jar on the windowsill has caught a mote of drifting light.'));
  beat('canInhale', S.total >= 6, () => G.log('The motes smell like warm bread. You could breathe them in.'));
  beat('canRelease', S.total >= 9, () => G.log('Or you could let them go, back into the dark.'));
  beat('wick', S.total >= 13, () => {
    G.say('...hhhff. Oh! LIGHT! Hello! Is that a jar of light? Don\'t drop it. I\'m... Wick? I think I\'m Wick. Feed me a few of those motes and I bet I\'ll remember more.');
    G.toast('The candle on the table flickers awake.');
  });
  beat('pip', S.released >= 300, () => {
    G.say('Look! On the windowsill! A tiny moth, drawn by all the light you gave away. I\'m calling it Pip. Pip is coming with you on adventures now. Pip has decided.');
    G.toast('Pip the moth has joined you.');
  });
  if (S.inhaled >= 1e4 && !f.glow1) { f.glow1 = 1; G.log('Your skin has a faint golden shimmer now.'); }
  if (S.inhaled >= 1e6 && !f.glow2) { f.glow2 = 1; G.log('You glow. Actually glow. Moths follow you in the street.'); }
};
G.pipDmg = () => 1 + Math.floor(Math.sqrt(G.S.released) / 8);

// ---------------------------------------------------------------- hut actions
G.A.shake = function (arg, el) {
  const S = G.S;
  S.stats.jarClicks++;
  G.give('motes', 1 + G.rate() * 0.02, { quiet: true });
  const art = document.getElementById('jar-art');
  if (art) { art.classList.remove('shake'); void art.offsetWidth; art.classList.add('shake'); }
  const c = S.stats.jarClicks;
  if (S.flags.wick) {
    if (c === 15) G.say('Gently! There are motes in there. Probably feelings, too.');
    if (c === 50) G.say('You know they come in on their own, right? You don\'t have to shake them in.');
    if (c === 100) {
      G.say('STOP SHAKING THE JAR! ...oh. Something fell out of the bottom. Is that a button?');
      if (!S.flags.got_button) G.give('button');
    }
    if (c === 250) G.say('I\'m not even going to say anything any more.');
  }
  G.updateBinds();
};

G.A.inhale = function (arg) {
  const S = G.S;
  const n = arg === 'all' ? Math.floor(S.motes) : Math.min(+arg, Math.floor(S.motes));
  if (n <= 0) return;
  const before = G.calc().maxHp;
  S.motes -= n;
  S.inhaled += n;
  G.invalidate();
  S.hp += G.calc().maxHp - before;
  if (S.inhaled === n) G.log('You breathe in. Warmth spreads to your fingertips. You feel sturdier.');
  G.refresh();
};

G.A.release = function (arg) {
  const S = G.S;
  const n = Math.min(+arg, Math.floor(S.motes));
  if (n <= 0) return;
  S.motes -= n;
  S.released += n;
  if (S.released === 404) G.earn('r404');
  const r = S.released;
  if (S.flags.wick) {
    if (r === n) G.say('Bye, little ones! Off you go!');
    else if (r >= 60 && !S.flags.rel60) { S.flags.rel60 = 1; G.say('Where do you think they go? Somewhere nice, I hope.'); }
    else if (r >= 150 && !S.flags.rel150) { S.flags.rel150 = 1; G.say('Something out there is watching the lights you let go. Something small. I think it\'s curious.'); }
  }
  if (S.flags.pip && r % 1000 < n) G.log(`Pip seems stronger. (Pip hits for ${G.pipDmg()})`);
  G.refresh();
};

G.nextMemory = () => G.MEMORIES.find(m => !G.S.mem[m.id]);
G.A.feed = function () {
  const m = G.nextMemory();
  if (!m || !G.pay({ motes: m.cost })) return;
  G.S.mem[m.id] = 1;
  G.S.fed += m.cost;
  if (m.fx) m.fx();
  G.invalidate();
  G.say(m.txt, true);
  G.log(`<span class="wk">Wick remembers:</span> <b>${m.t}</b>${m.bonus ? ` <span class="gold">(${m.bonus})</span>` : ''}`, 'unlock');
  G.modal(`<div class="who">Wick remembers: ${m.t}</div><div class="txt wick">${m.txt}</div>${m.bonus ? `<p class="gold">${m.bonus}</p>` : ''}`,
    [{ label: 'Lovely' }]);
};

G.A.catchShooting = function () {
  if (!G.shooting) return;
  const S = G.S;
  G.shooting = null;
  G.nextShooting = Date.now() + G.rand(150, 330) * 1000;
  S.stats.shooting = (S.stats.shooting || 0) + 1;
  if (G.chance(0.55)) {
    const n = Math.max(30, G.rate() * 90);
    G.give('motes', n, { quiet: true });
    G.toast(`You caught a shooting mote! +${G.fmt(n)} motes`);
  } else {
    G.boost = { until: Date.now() + 30000, mult: 5 };
    G.toast('You caught a shooting mote! The jar glows: x5 motes for 30 seconds.');
  }
  G.renderTop();
  G.refresh();
};

// ---------------------------------------------------------------- pages, bestiary, glimmers
G.gainPage = function (id, quiet) {
  const S = G.S, p = G.PAGES[id];
  if (!p || S.pages[id]) return;
  S.pages[id] = Date.now();
  if (!S.tabs.journal) G.unlockTab('journal');
  G.log(`Journal page found: <b>${p.t}</b>`, 'unlock');
  if (!quiet) G.modal(`<div class="who">${p.t}</div><div class="txt">${G.esc(p.txt)}</div>`, [{ label: 'Keep it' }]);
  else G.toast(`Journal page: ${p.t}`);
};
G.recordKill = function (id) {
  const S = G.S;
  const first = !S.beasts[id];
  S.beasts[id] = (S.beasts[id] || 0) + 1;
  S.stats.kills++;
  if (first) G.log(`New bestiary entry: <b>${G.ENEMIES[id].n}</b>`, 'unlock');
  if (S.bounty && S.bounty.mob === id && S.bounty.have < S.bounty.need) {
    S.bounty.have++;
    if (S.bounty.have === S.bounty.need) G.log('Bounty complete! Claim your reward at the Snoring Toad.', 'loot');
  }
};
G.earn = function (id) {
  const S = G.S;
  if (S.ach[id]) return;
  const a = G.ACH.find(x => x.id === id);
  if (!a) return;
  S.ach[id] = Date.now();
  G.toast(`&#10023; Glimmer: <b>${a.n}</b><br><span class="small dim">${a.d} (+2% motes)</span>`);
  G.log(`Glimmer earned: <b>${a.n}</b>`, 'loot');
  G.invalidate();
};
G.checkAch = function () {
  const S = G.S;
  for (const a of G.ACH) if (!S.ach[a.id] && a.c && a.c(S)) G.earn(a.id);
};

// ---------------------------------------------------------------- equipment & items
G.GEAR_SLOTS = ['weapon', 'body', 'head', 'feet', 'charm'];
G.equip = function (id) {
  const it = G.ITEMS[id];
  if (!it || !G.GEAR_SLOTS.includes(it.t) || !G.has(id)) return;
  G.S.eq[it.t] = id;
  G.invalidate();
  G.S.hp = Math.min(G.S.hp, G.calc().maxHp);
};
G.unequip = function (slot) { G.S.eq[slot] = null; G.invalidate(); G.S.hp = Math.min(G.S.hp, G.calc().maxHp); };
G.A.equip = id => { G.equip(id); G.refresh(); };
G.A.unequip = slot => { G.unequip(slot); G.refresh(); };

G.gearStats = function (it) {
  const p = [];
  if (it.dmg) p.push(`dmg ${it.dmg[0]}-${it.dmg[1]}`, `${(1000 / it.cd).toFixed(1)} hits/s`);
  if (it.arm) p.push(`armor ${it.arm > 0 ? '+' : ''}${it.arm}`);
  if (it.hp) p.push(`+${it.hp} HP`);
  if (it.hpPct) p.push(`+${it.hpPct}% HP`);
  if (it.crit) p.push(`+${it.crit}% crit`);
  if (it.light) p.push(`+${it.light} light`);
  if (it.spd) p.push(`${it.spd > 0 ? 'faster' : 'slower'} moves`);
  if (it.lum) p.push(`+${it.lum} lumen`);
  if (it.lumregen) p.push(`+${it.lumregen}% lumen regen`);
  if (it.cold) p.push('cold resist');
  if (it.life) p.push(`${it.life}% lifesteal`);
  if (it.burn) p.push(`${it.burn}% burn`);
  if (it.freeze) p.push(`${it.freeze}% freeze`);
  if (it.reach) p.push(`reach ${it.reach}`);
  if (it.mote) p.push(`+${it.mote}% motes`);
  if (it.grip) p.push('ice grip');
  return p.join(', ');
};

G.A.usePotion = function (id) {
  const S = G.S;
  if (!G.has(id)) return;
  const it = G.ITEMS[id];
  const mx = G.calc().maxHp;
  if (id === 'heal' || id === 'greater') {
    if (S.hp >= mx) { G.log('You are already at full health.'); return; }
    S.hp = Math.min(mx, S.hp + mx * (id === 'heal' ? 0.4 : 1));
    G.take(id);
    G.log(`You drink the ${it.n}. You feel better.`);
  } else if (id === 'dawn') {
    if (S.flags.dawnDrunk) { G.log('You already carry a morning inside you. One is plenty.'); return; }
    G.take(id);
    S.flags.dawnDrunk = 1;
    G.invalidate();
    G.modal('<div class="who">Bottled Dawn</div><div class="txt">You uncork the bottle and drink a morning. Birds you have never heard sing somewhere behind your eyes. For the rest of your life you will carry a little more light.\n\n<span class="gold">+1 light radius, permanently.</span></div>');
  } else if (id === 'soup') {
    if (S.flags.soup) { G.log('You could not possibly. Not again.'); return; }
    G.take(id);
    S.flags.soup = 1;
    G.invalidate();
    G.modal('<div class="who">Granny\'s Fish Surprise</div><div class="txt">It tastes like a pond had an argument with a pepper. You feel enormously, unreasonably robust.\n\n<span class="gold">+50 max HP, permanently.</span></div>');
  } else if (id === 'sludge') {
    G.take(id);
    const r = G.rand(0, 4);
    if (r === 0) { S.hp = Math.min(mx, S.hp + mx * 0.15); G.log('The sludge is... restorative? Ugh. +15% HP.'); }
    else if (r === 1) { G.give('motes', 25, { quiet: true }); G.log('You hiccup, and a few motes pop out of your mouth. +25 motes.'); }
    else if (r === 2) G.log('You turn faintly green for a moment. Wick laughs so hard she nearly goes out.');
    else if (r === 3) { S.hp = Math.max(1, S.hp - mx * 0.1); G.log('Bleurgh. -10% HP.'); }
    else G.log('You hiccup a bubble shaped exactly like Granny Nettle. It frowns at you and pops.');
  } else if (it.dun) {
    G.log(`Better save the ${it.n} for an expedition.`);
    return;
  } else {
    G.log('That gets used automatically when you need it.');
    return;
  }
  G.refresh();
};

G.A.pressButton = function () {
  const S = G.S;
  if (!S.flags.pressed) {
    S.flags.pressed = 1;
    G.give('rock', 1, { quiet: true });
    G.modal('<div class="who">*click*</div><div class="txt">Somewhere under your feet, a floorboard pops up with a polite little <i>thunk</i>. Underneath is a folded note and a smooth grey rock.</div>',
      [{ label: 'Read the note', fn: () => G.gainPage('cellar') }]);
    G.earn('button');
    return;
  }
  G.log(G.pick(['*click*', '*click* Nothing happens. Satisfyingly.', 'Wick: "Stop it."', '*click*... *click*...', 'Gerald the rock looks at you with quiet disappointment.']));
};

// ---------------------------------------------------------------- shops
G.buy = function (id, cost, n = 1) {
  if (!G.pay(cost)) return false;
  G.give(id, n);
  return true;
};
G.A.buyLens = function () {
  const L = G.LENSES[G.S.lenses];
  if (!L || !G.pay(L.cost)) return;
  G.S.lenses++;
  G.log(`You fit the <b>${L.n}</b> to the jar. (+${L.add} motes/s)`, 'loot');
  G.refresh();
};
G.A.buyLantern = function () {
  const L = G.LANTERNS[G.S.lantern + 1];
  if (!L || !G.pay(L.cost)) return;
  G.S.lantern++;
  G.invalidate();
  G.log(`You now carry the <b>${L.n}</b>. (light radius ${L.r})`, 'loot');
  G.refresh();
};
G.A.buySpell = function (id) {
  const sp = G.SPELLS[id];
  if (!sp || G.S.spells[id] || !G.pay(sp.price)) return;
  G.S.spells[id] = 1;
  if (!G.S.tabs.spells) G.unlockTab('spells');
  G.log(`You learn the spell <b>${sp.n}</b>.`, 'loot');
  G.refresh();
};

// ---------------------------------------------------------------- garden
G.PLOT_COSTS = [0, 0, 0, 200, 800, 2500, 8000, 25000, 80000];
G.growMult = () => (G.S.sky.wells ? 0.7 : 1) * (G.S.flags.scarecrowGarden ? 0.75 : 1);
G.A.plant = function (arg) {
  const [i, seed] = arg.split(':');
  const S = G.S, sd = G.SEEDS[seed];
  if (!sd || S.garden.p[i]) return;
  if (seed === 'glow') { if (!G.pay(sd.cost)) return; } else { if (!G.has(seed)) return; G.take(seed); }
  S.garden.p[i] = { seed, t0: Date.now(), dur: sd.dur * G.growMult() };
  G.refresh();
};
G.plotReady = p => p && Date.now() - p.t0 >= p.dur;
G.A.harvest = function (i) {
  const S = G.S, p = S.garden.p[i];
  if (!G.plotReady(p)) return;
  const [id, n] = G.SEEDS[p.seed].yield();
  S.garden.p[i] = null;
  S.stats.harvested++;
  G.give(id, n);
  if (id === 'whisper') G.gainPage('whisper');
  G.refresh();
};
G.A.harvestAll = function () {
  G.S.garden.p.forEach((p, i) => { if (G.plotReady(p)) G.A.harvest(String(i)); });
};
G.A.replantAll = function () {
  const S = G.S;
  for (let i = 0; i < S.garden.plots; i++) if (!S.garden.p[i] && G.canPay(G.SEEDS.glow.cost)) G.A.plant(i + ':glow');
};
G.A.buyPlot = function () {
  const S = G.S, c = G.PLOT_COSTS[S.garden.plots];
  if (!c || !G.pay({ motes: c })) return;
  S.garden.plots++;
  G.log('You clear another patch of the garden.');
  G.refresh();
};

// ---------------------------------------------------------------- cauldron
G.pot = [];
G.recipeKey = arr => arr.slice().sort().join('+');
G.A.potAdd = function (id) {
  if (G.pot.length >= 3) return;
  const used = G.pot.filter(x => x === id).length;
  if (G.count(id) <= used) return;
  G.pot.push(id);
  G.refresh();
};
G.A.potRemove = function (i) { G.pot.splice(+i, 1); G.refresh(); };
G.A.potEmpty = function () { G.pot = []; G.refresh(); };
G.A.brew = function () {
  const S = G.S;
  if (G.pot.length < 2) { G.log('Granny always said: at least two things in the pot, dear.'); return; }
  const key = G.recipeKey(G.pot);
  for (const id of G.pot) G.take(id, 1);
  const r = G.RECIPES.find(x => G.recipeKey(x.in) === key);
  G.pot = [];
  S.stats.brewed++;
  if (!r) {
    G.give('sludge', 1, { quiet: true });
    G.log('The cauldron burps. You have made... sludge.');
  } else {
    const first = !S.recipes[r.id];
    S.recipes[r.id] = 1;
    G.give(r.id, 1, { quiet: true });
    if (first) G.modal(`<div class="who">New recipe!</div><div class="txt">The brew turns clear and bright. You have made <b>${G.ITEMS[r.id].n}</b>.\n\n${G.ITEMS[r.id].d}</div>`, [{ label: 'Write it down' }]);
    else G.log(`You brew a <b>${G.ITEMS[r.id].n}</b>.`, 'loot');
  }
  G.refresh();
};
G.A.brewKnown = function (id) {
  const r = G.RECIPES.find(x => x.id === id);
  if (!r) return;
  const need = {};
  for (const x of r.in) need[x] = (need[x] || 0) + 1;
  if (!G.canPay(need)) return;
  G.pot = r.in.slice();
  G.A.brew();
};

// ---------------------------------------------------------------- forge
G.A.forge = function (i) {
  const r = G.FORGE[+i];
  if (!r || !G.pay(r.cost)) return;
  G.give(r.out, 1);
  G.log(`Gorrin hums as he works. You receive <b>${G.ITEMS[r.out].n}</b>.`, 'loot');
  G.refresh();
};

// ---------------------------------------------------------------- fishing
G.fish = { state: 'idle' };
G.FISH = [
  { id: 'minnow', w: 45, zone: 8, spd: 1, hits: 3 },
  { id: 'carp', w: 26, zone: 6, spd: 1.3, hits: 3 },
  { id: 'boot', w: 10, zone: 9, spd: 0.8, hits: 2 },
  { id: 'lfish', w: 8, zone: 4, spd: 1.6, hits: 3 },
  { id: 'bottle', w: 5, zone: 6, spd: 1.1, hits: 3 },
  { id: 'moonstones', w: 2, zone: 4, spd: 1.8, hits: 3 },
];
G.A.cast = function () {
  if (!G.has('rod')) return;
  const hook = G.S.sky.hook ? 0.55 : 1;
  G.fish = { state: 'waiting', biteAt: Date.now() + G.rand(2500, 9000) * hook };
  G.refresh();
};
G.rollFish = function () {
  const S = G.S;
  if (G.isNight() && G.has('bait') && !S.inv.oldone) {
    G.take('bait');
    return { id: 'oldone', zone: 3, spd: 2, hits: 5 };
  }
  const bottlesLeft = ['bottle1', 'bottle2', 'bottle3'].some(p => !S.pages[p]);
  const table = G.FISH.filter(f => f.id !== 'bottle' || bottlesLeft).map(f => ({ ...f, w: f.w + (S.sky.hook && (f.id === 'lfish' || f.id === 'moonstones') ? 6 : 0) }));
  let r = Math.random() * table.reduce((a, f) => a + f.w, 0);
  for (const f of table) { r -= f.w; if (r <= 0) return f; }
  return table[0];
};
G.A.reel = function () {
  const F = G.fish, now = Date.now();
  if (F.state === 'waiting') {
    G.fish = { state: 'idle', msg: 'You yank the line too early. Nothing there but water.' };
  } else if (F.state === 'bite') {
    const f = G.rollFish();
    const zs = G.rand(2, 28 - f.zone);
    G.fish = { state: 'reel', f, pos: 0, dir: 1, zone: [zs, zs + f.zone - 1], hits: 0, miss: 0, t: now };
  } else if (F.state === 'reel') {
    const p = Math.round(F.pos);
    if (p >= F.zone[0] && p <= F.zone[1]) {
      F.hits++;
      if (F.hits >= F.f.hits) { G.landFish(F.f); return; }
      const zs = G.rand(2, 28 - F.f.zone);
      F.zone = [zs, zs + F.f.zone - 1];
    } else {
      F.miss++;
      if (F.miss >= 3) { G.fish = { state: 'idle', msg: 'The line goes slack. It got away.' }; }
    }
  }
  G.refresh();
};
G.fishTick = function (dt) {
  const F = G.fish, now = Date.now();
  if (F.state === 'waiting' && now >= F.biteAt) { G.fish = { state: 'bite', until: now + 1000 }; G.refresh(); }
  else if (F.state === 'bite' && now > F.until) { G.fish = { state: 'idle', msg: 'Too slow. Something nibbled your hook clean.' }; G.refresh(); }
  else if (F.state === 'reel') {
    F.pos += F.dir * F.f.spd * dt / 45;
    if (F.pos >= 29) { F.pos = 29; F.dir = -1; }
    if (F.pos <= 0) { F.pos = 0; F.dir = 1; }
  }
};
G.landFish = function (f) {
  const S = G.S;
  S.stats.caught++;
  let msg;
  if (f.id === 'bottle') {
    const p = ['bottle1', 'bottle2', 'bottle3'].find(x => !S.pages[x]);
    msg = 'You fish up a bottle with a letter inside!';
    G.fish = { state: 'idle', msg };
    G.gainPage(p);
    return;
  }
  if (f.id === 'oldone') {
    G.give('oldone', 1, { quiet: true });
    G.give('pearl', 1, { quiet: true });
    G.fish = { state: 'idle', msg: 'The line goes taut as a bowstring...' };
    G.modal('<div class="who">The Old One</div><div class="txt">Something enormous and patient rises out of Stillwater. Its scales are the colour of old coins; its eyes have seen the sun. It regards you for a long moment. Then it opens its mouth, sets a pearl on the bank at your feet, and sinks back into the deep.\n\nYou decide you did not need to keep it anyway.</div>', [{ label: 'Thank you' }]);
    return;
  }
  G.give(f.id, 1, { quiet: true });
  msg = f.id === 'moonstones' ? 'A moonstone was snagged on your hook!' : `You caught a <b>${G.itemName(f.id, 1)}</b>!`;
  G.fish = { state: 'idle', msg };
  G.refresh();
};
G.FISH_PRICES = { minnow: 15, carp: 40, lfish: 250, boot: 3 };
G.A.sellFish = function (id) {
  const n = G.count(id);
  if (!n) return;
  G.take(id, n);
  G.give('motes', n * G.FISH_PRICES[id]);
  G.refresh();
};

// ---------------------------------------------------------------- knucklebones
G.dice = { last: null, busy: 0 };
G.A.dice = function () {
  const S = G.S;
  const inp = document.getElementById('bet');
  let bet = Math.floor(+(inp && inp.value) || 0);
  if (Date.now() < G.dice.busy) return;
  const max = Math.min(Math.floor(S.motes / 2), 1e6);
  if (bet < 10) { G.dice.last = 'Fen: "Ten motes at least, friend. I\'ve got standards."'; G.refresh(); return; }
  if (bet > max) bet = max;
  if (bet < 10) { G.dice.last = 'Fen: "Come back when your pockets jingle."'; G.refresh(); return; }
  G.dice.busy = Date.now() + 900;
  G.dice.bet = bet;
  S.motes -= bet;
  const roll = () => [G.rand(1, 6), G.rand(1, 6), G.rand(1, 6)];
  const you = roll(), fen = roll();
  const sum = a => a[0] + a[1] + a[2];
  const triple = you[0] === you[1] && you[1] === you[2];
  let out;
  if (triple) { S.motes += bet * 5; S.total += bet * 4; out = `TRIPLES! You win ${G.fmt(bet * 5)} motes.`; }
  else if (sum(you) > sum(fen)) { S.motes += bet * 2; S.total += bet; out = `You win ${G.fmt(bet * 2)} motes.`; }
  else out = sum(you) === sum(fen) ? 'A tie. House rules: Fen wins ties.' : 'Fen wins.';
  const won = triple || sum(you) > sum(fen);
  S.stats.diceStreak = won ? S.stats.diceStreak + 1 : 0;
  if (won) S.stats.diceWins++;
  G.dice.last = `You rolled ${you.join(' ')} (${sum(you)}). Fen rolled ${fen.join(' ')} (${sum(fen)}). ${out}`;
  if (S.stats.diceStreak >= 5 && !S.flags.got_luckydie) {
    G.give('luckydie');
    G.earn('nemesis');
    G.dice.last += '\nFen slams the table. "FIVE in a row? Take it. Take my lucky die. It clearly prefers you."';
  }
  G.refresh();
};

// ---------------------------------------------------------------- bounties
G.BOUNTY_PAY = [0, 18, 70, 220, 520, 1100, 2200, 4500, 9000];
G.MAP_MOBS = {
  field: ['rat', 'cricket', 'crow', 'lurker'], caves: ['bat', 'beetle', 'grub', 'mole'], forest: ['wolf', 'spriggan', 'thornling'],
  shrine: ['acolyte', 'crab', 'eeling', 'jelly'], ruins: ['sentry', 'spider', 'hound'], peak: ['wraith', 'hare', 'ogre'],
  spire: ['dustmoth', 'weaver', 'knight'], under: ['shade', 'gnaw'],
};
G.offerBounty = function () {
  const S = G.S;
  const maps = Object.keys(G.MAP_MOBS).filter(m => S.maps[m]);
  if (!maps.length) return null;
  const m = G.pick(maps), mob = G.pick(G.MAP_MOBS[m]);
  const need = G.rand(5, 12);
  const tier = G.MAPS[m].tier;
  const reward = { motes: need * G.BOUNTY_PAY[tier] };
  if (G.chance(0.25)) reward.moonstones = 1;
  return { mob, map: m, need, have: 0, reward };
};
G.A.takeBounty = function () {
  if (G.S.bounty) return;
  G.S.bounty = G.bountyOffer || G.offerBounty();
  G.bountyOffer = null;
  G.refresh();
};
G.A.claimBounty = function () {
  const b = G.S.bounty;
  if (!b || b.have < b.need) return;
  for (const k in b.reward) G.give(k, b.reward[k]);
  G.S.bounty = null;
  G.log('The barkeep counts your reward onto the table.', 'loot');
  G.refresh();
};
G.A.dropBounty = function () { G.S.bounty = null; G.refresh(); };

// ---------------------------------------------------------------- the old well
G.A.toss = function () {
  const S = G.S;
  const inp = document.getElementById('toss');
  const n = Math.floor(+(inp && inp.value) || 0);
  if (n < 1 || n > S.motes) { G.wellMsg = 'The well waits. It knows you don\'t have that many.'; G.refresh(); return; }
  S.motes -= n;
  S.stats.wellTossed += n;
  let msg = G.pick(['Plink.', 'The motes spiral down, down, down, and wink out.', 'The well hums, pleased.', 'Far below, something says thank you.', 'Ripples of light, then nothing.']);
  if (n === 1) {
    S.stats.wellOnes++;
    if (S.stats.wellOnes === 50) { G.give('moonstones', 1); msg = 'The well hiccups. Something bright comes back up: a moonstone! "Thank you for visiting so often," it seems to say.'; }
  }
  if (n === 777 && !S.flags.well777) {
    S.flags.well777 = 1;
    G.give('wellcoin');
    G.earn('luckyseven');
    msg = 'Seven hundred and seventy-seven motes. The well goes very still... and then a coin flips up out of the dark and lands in your palm. Lucky.';
  }
  if (S.stats.wellTossed >= 5000 && !S.pages.well) { msg = 'The well starts to speak, in the voice of every coin ever thrown into it...'; G.gainPage('well'); }
  G.wellMsg = msg;
  G.refresh();
};

// ---------------------------------------------------------------- new game plus
G.newGamePlus = function () {
  const old = G.S, S = G.defaultState();
  S.ng = (old.ng || 0) + 1;
  for (const k of ['ach', 'pages', 'beasts', 'endings', 'recipes', 'riddles']) S[k] = old[k];
  S.name = old.name;
  S.stats.time = old.stats.time;
  S.flags.ngIntro = 1;
  G.S = S;
  G.save();
  location.reload();
};
