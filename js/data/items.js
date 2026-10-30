'use strict';
// Items. t = weapon|body|head|feet|charm|mat|ing|seed|potion|key|junk
// Gear stats: dmg [min,max], cd (attack ms), arm, hp, hpPct, crit (%), light (+radius), spd (ms faster),
// lum (+lumen), lumregen (%), cold (resist), life (% lifesteal), burn (% chance), freeze (% chance),
// reach (tiles), mote (% mote rate), grip (no ice slide), dmgPct.
G.ITEMS = {
  // ---------------- weapons
  spoon: { n: 'Wooden Spoon', t: 'weapon', dmg: [1, 3], cd: 450, d: "Marla's second-best spoon. She would like it back eventually." },
  shears: { n: 'Rusty Shears', t: 'weapon', dmg: [3, 6], cd: 500, d: 'For trimming hedges, and the things that live in hedges.' },
  club: { n: 'Bone Club', t: 'weapon', dmg: [6, 10], cd: 650, d: 'Heavy, honest and slightly smelly.' },
  sword: { n: 'Iron Shortsword', t: 'weapon', dmg: [8, 13], cd: 450, d: 'Gorrin\'s standard issue. He hums while he sharpens them.' },
  whip: { n: 'Thornwhip', t: 'weapon', dmg: [11, 17], cd: 500, reach: 2, d: 'Strikes foes two tiles away. Ouch, for everyone.' },
  gearblade: { n: 'Gearblade', t: 'weapon', dmg: [17, 25], cd: 420, crit: 5, d: 'A sword whose teeth keep turning as it cuts.' },
  frostbrand: { n: 'Frostbrand', t: 'weapon', dmg: [23, 33], cd: 480, freeze: 15, d: 'Hits may freeze foes solid for a moment.' },
  moonsickle: { n: 'Moonsickle', t: 'weapon', dmg: [29, 41], cd: 400, life: 10, d: 'It drinks a little of what it cuts. 10% of damage dealt heals you.' },
  sunsteel: { n: 'Sunsteel Edge', t: 'weapon', dmg: [46, 66], cd: 400, burn: 25, d: 'Forged around a sliver of trapped morning. Sets foes alight.' },
  destiny: { n: 'Spoon of Destiny', t: 'weapon', dmg: [62, 90], cd: 340, crit: 15, life: 5, d: 'It was always the spoon. Marla knew.' },

  // ---------------- body
  coat: { n: 'Patched Coat', t: 'body', arm: 1, d: 'More patch than coat.' },
  beetlemail: { n: 'Beetle Mail', t: 'body', arm: 3, hp: 15, d: 'Overlapping beetle shells. Clicks when you walk.' },
  wolfcloak: { n: 'Wolfpelt Cloak', t: 'body', arm: 4, hp: 20, cold: 1, d: 'Warm enough for the Pale Steps.' },
  brassplate: { n: 'Brass Plate', t: 'body', arm: 8, hp: 30, spd: -10, d: 'Shiny, sturdy, a little slow.' },
  silkrobe: { n: 'Mothsilk Robe', t: 'body', arm: 7, hp: 40, lum: 30, light: 1, d: 'Woven from silk that remembers being light.' },
  rimeplate: { n: 'Rimeguard Plate', t: 'body', arm: 14, hp: 70, cold: 1, d: 'Ice-forged plate. Never melts, never warms.' },

  // ---------------- head
  strawhat: { n: 'Straw Hat', t: 'head', arm: 1, d: "The scarecrow's hat. It still smells of the field." },
  pot: { n: 'Iron Pot', t: 'head', arm: 2, d: 'Technically a helmet. Technically a pot.' },
  minerhelm: { n: "Miner's Helm", t: 'head', arm: 3, light: 1, d: 'A dented helm with a tiny glowcap lamp on the brim.' },
  circlet: { n: 'Owlfeather Circlet', t: 'head', arm: 2, lum: 25, lumregen: 25, d: 'Quillon\'s gift. Thoughts come clearer when you wear it.' },
  antlers: { n: 'Crown of Antlers', t: 'head', arm: 5, crit: 8, d: 'The Briar Stag\'s crown, freely given in the end.' },

  // ---------------- feet
  slippers: { n: 'Soft Slippers', t: 'feet', spd: 12, d: 'Mira knitted these. They are very quiet.' },
  wolfboots: { n: 'Wolfhide Boots', t: 'feet', arm: 1, spd: 25, d: 'Run like the pack does.' },
  gearboots: { n: 'Gearspring Boots', t: 'feet', arm: 2, spd: 45, d: 'Lumenwright springs. Every step is a little leap.' },
  crampons: { n: 'Iron Crampons', t: 'feet', arm: 3, spd: 15, grip: 1, d: 'Spiked soles. You no longer slide on ice.' },

  // ---------------- charms
  clover: { n: 'Four-leaf Clover', t: 'charm', crit: 5, d: 'Found where the wheat grows thickest.' },
  luckydie: { n: "Fen's Lucky Die", t: 'charm', crit: 8, mote: 3, d: 'Weighted. Obviously.' },
  keeperlens: { n: "Keeper's Lens", t: 'charm', light: 2, d: 'Ysolde\'s spare lighthouse lens, small enough for a pocket.' },
  moonamulet: { n: 'Moonstone Amulet', t: 'charm', lum: 20, lumregen: 100, d: 'Lumen flows back twice as fast.' },
  emberheart: { n: 'Ember Heart', t: 'charm', burn: 20, hp: 30, d: 'Still warm. Still beating, a little.' },
  pearl: { n: 'Pearl of the Deep', t: 'charm', hpPct: 20, d: 'Coughed up by the Old One. Dense with patience.' },
  wellcoin: { n: "Well-Wisher's Coin", t: 'charm', mote: 7, d: 'The well gave it back. Lucky.' },
  button: { n: 'Suspicious Button', t: 'charm', d: 'It wants to be pressed. It REALLY wants to be pressed.' },
  thimble: { n: "Granny's Thimble", t: 'charm', arm: 2, lumregen: 50, d: 'Smells of nettles and stubbornness.' },

  // ---------------- materials
  straw: { n: 'Straw', t: 'mat', d: 'Dry, golden, from Whisperwheat.' },
  bone: { n: 'Bone', t: 'mat', d: 'Clean and white. Don\'t ask whose.' },
  shell: { n: 'Beetle Shell', t: 'mat', d: 'Hard as a promise.' },
  scrap: { n: 'Iron Scrap', t: 'mat', d: 'Bent nails, broken picks, useful junk.' },
  pelt: { n: 'Wolf Pelt', t: 'mat', d: 'Thick, grey, warm.' },
  thorn: { n: 'Briar Thorn', t: 'mat', d: 'Long as a finger and sharp as gossip.' },
  gear: { n: 'Clockwork Gear', t: 'mat', d: 'Lumenwright brass. It still wants to turn.' },
  frost: { n: 'Frost Shard', t: 'mat', d: 'A splinter of ice that refuses to melt.' },
  silk: { n: 'Moth Silk', t: 'mat', d: 'Soft, silver, faintly glowing.' },
  dust: { n: 'Moth Dust', t: 'mat', d: 'Shimmering wing-scales. Makes you sneeze in colours.' },
  star: { n: 'Star Fragment', t: 'mat', d: 'A cold, bright splinter that fell when the sky went dark.' },

  // ---------------- ingredients
  moonpetal: { n: 'Moonpetal', t: 'ing', d: 'A pale flower that only opens in the dark.' },
  emberroot: { n: 'Emberroot', t: 'ing', d: 'A root that is warm to the touch.' },
  frostmint: { n: 'Frostmint', t: 'ing', d: 'Cold enough to make your teeth hum.' },
  minnow: { n: 'Silver Minnow', t: 'ing', d: 'Small, quick, shiny.' },
  carp: { n: 'Gloomcarp', t: 'ing', d: 'A fat, sulky fish. Granny Nettle has opinions about them.' },
  lfish: { n: 'Lantern Fish', t: 'ing', d: 'A fish with a little light dangling over its nose.' },
  whisper: { n: 'Whisperbloom', t: 'ing', d: 'If you hold it to your ear, it tells you something true.' },

  // ---------------- seeds
  s_moon: { n: 'Moonpetal Seed', t: 'seed', d: 'Plant in the garden. Grows a Moonpetal.' },
  s_ember: { n: 'Emberroot Seed', t: 'seed', d: 'Plant in the garden. Grows Emberroot.' },
  s_frost: { n: 'Frostmint Seed', t: 'seed', d: 'Plant in the garden. Grows Frostmint.' },
  s_whisper: { n: 'Whisperbloom Seed', t: 'seed', d: 'A seed that hums. Granny says it only sprouts at night.' },

  // ---------------- potions (effects in systems.js)
  heal: { n: 'Healing Draught', t: 'potion', key: 'H', d: 'Restores 40% of your HP.' },
  greater: { n: 'Greater Draught', t: 'potion', key: 'G', d: 'Restores all of your HP.' },
  tonic: { n: 'Ember Tonic', t: 'potion', key: 'T', dun: 1, d: '+50% damage for 60 seconds.' },
  gill: { n: 'Gillweed Brew', t: 'potion', d: 'Lets you breathe water for a while. Needed for the Drowned Shrine.' },
  frostward: { n: 'Frostward', t: 'potion', d: 'Keeps the cold out for one expedition. Drunk automatically when needed.' },
  shadow: { n: 'Shadowstep Draught', t: 'potion', key: 'Z', dun: 1, d: 'Foes lose sight of you for 10 seconds.' },
  clarity: { n: 'Elixir of Clarity', t: 'potion', key: 'C', dun: 1, d: 'Reveals the whole area, including every secret wall.' },
  lumen: { n: 'Lumen Tonic', t: 'potion', key: 'L', dun: 1, d: 'Restores all of your lumen.' },
  bomb: { n: 'Ember Bomb', t: 'potion', key: 'B', dun: 1, d: 'Explodes around you: hurts foes nearby and breaks cracked walls.' },
  dawn: { n: 'Bottled Dawn', t: 'potion', d: 'A bottle of real morning. Drinking it would change you, permanently.' },
  soup: { n: "Granny's Fish Surprise", t: 'potion', d: 'Three gloomcarp, no explanation. Oddly fortifying.' },
  sludge: { n: 'Cauldron Sludge', t: 'potion', d: 'A failed brew. Drink at your own risk.' },

  // ---------------- key items
  rod: { n: 'Fishing Rod', t: 'key', d: 'Lets you fish at Stillwater Lake.' },
  pick: { n: 'Rootdeep Pick', t: 'key', d: 'Walk into cracked walls to break them.' },
  cavekey: { n: 'Rusted Key', t: 'key', d: 'Opens a door in Rootdeep Caves.' },
  briarkey: { n: 'Briar Key', t: 'key', d: 'A key grown, not forged. Opens a gate in Thornwood.' },
  coralkey: { n: 'Coral Key', t: 'key', d: 'Opens the sealed nave of the Drowned Shrine.' },
  cogkey: { n: 'Brass Cog Key', t: 'key', d: 'Opens the Inner Works of the Lumenwright Ruins.' },
  rimekey: { n: 'Rime Key', t: 'key', d: 'Opens the Matron\'s door on the Pale Steps.' },
  silkkey: { n: 'Silk Key', t: 'key', d: 'A key spun from moth silk. Opens the upper spire.' },
  shard: { n: 'Sun Shard', t: 'key', d: 'A piece of morning. The Cocoon Spire\'s door needs five.' },
  lullaby: { n: 'Lullaby Sheet', t: 'key', d: 'Music no one has sung in an age. "For Mothrael, when he cannot sleep."' },
  feather: { n: 'Crow Feather', t: 'key', d: 'Corvin\'s calling card. With it, the Night Market never closes for you.' },
  ribbon: { n: "Mira's Ribbon", t: 'key', d: 'A blue ribbon, a little chewed. Marla\'s granddaughter lost it.' },
  locket: { n: 'Tarnished Locket', t: 'key', d: 'Inside: a tiny portrait of a lighthouse.' },
  tablet1: { n: 'Lumenwright Tablet (I)', t: 'key', d: 'Covered in tiny, precise script. Quillon could translate it.' },
  tablet2: { n: 'Lumenwright Tablet (II)', t: 'key', d: 'Covered in tiny, precise script. Quillon could translate it.' },
  tablet3: { n: 'Lumenwright Tablet (III)', t: 'key', d: 'This one is scorched. Quillon could translate it.' },
  bait: { n: 'Glimmerworm Bait', t: 'key', d: 'Something big in Stillwater would love this. Only at night.' },
  oldone: { n: 'The Old One (trophy)', t: 'junk', d: 'You caught the oldest fish in Stillwater. You let it go. It left you a gift.' },
  boot: { n: 'Soggy Boot', t: 'junk', d: 'Not your size. Marla might buy it, for some reason.' },
  rock: { n: 'Pet Rock', t: 'junk', d: 'His name is Gerald. He is a very good rock.' },
};

// Lantern levels: r = light radius in dark places.
G.LANTERNS = [
  { n: 'No lantern', r: 1 },
  { n: 'Tin Lantern', r: 3, cost: { motes: 100 } },
  { n: 'Brass Lantern', r: 4, cost: { motes: 600, glowcaps: 10 } },
  { n: 'Silver Lantern', r: 5, cost: { motes: 3500, glowcaps: 30, scrap: 5 } },
  { n: 'Prism Lantern', r: 6, cost: { motes: 16000, glowcaps: 60, gear: 3 }, cracks: true },
  { n: 'Starglass Lantern', r: 8, cost: { motes: 90000, glowcaps: 120, star: 2 }, cracks: true },
  { n: 'Sunheart Lantern', r: 10, cost: { motes: 450000, glowcaps: 250, star: 4 }, cracks: true },
];

// Lenses for the jar, bought in sequence from Marla.
G.LENSES = [
  { n: 'Cracked Lens', add: 1, cost: { motes: 40 } },
  { n: 'Clear Lens', add: 2, cost: { motes: 250 } },
  { n: 'Polished Lens', add: 5, cost: { motes: 1200 } },
  { n: 'Twin Lens', add: 15, cost: { motes: 6000, glowcaps: 20 } },
  { n: 'Prism Lens', add: 40, cost: { motes: 30000, glowcaps: 60 } },
  { n: 'Lumenwright Lens', add: 120, cost: { motes: 150000, gear: 10 } },
  { n: 'Sunglass', add: 400, cost: { motes: 800000, star: 2 } },
];

G.SPELLS = {
  spark: { n: 'Spark', lum: 5, cd: 600, d: 'A bolt of light flies the way you face.', price: { motes: 200 } },
  mend: { n: 'Mend', lum: 15, cd: 4000, d: 'Heal 30% of your max HP.', price: { motes: 700 } },
  flare: { n: 'Flare', lum: 12, cd: 2500, d: 'A burst of light hurts every adjacent foe and cracks open weak walls beside you.', price: { motes: 1800 } },
  blink: { n: 'Blink', lum: 10, cd: 3000, d: 'Teleport up to 4 tiles in the direction you face.', price: { motes: 4500 } },
  frost: { n: 'Frostbite', lum: 20, cd: 8000, d: 'Freeze every foe within 3 tiles for 4 seconds.', price: { motes: 14000, frost: 3 } },
  reveal: { n: 'Reveal', lum: 25, cd: 10000, d: 'Map everything within 15 tiles and expose secret walls.', price: { motes: 28000 } },
  sunburst: { n: 'Sunburst', lum: 50, cd: 15000, d: 'Searing light strikes every foe you can see.', price: { motes: 160000, star: 1 } },
  swarm: { n: 'Moth Swarm', lum: 30, cd: 14000, d: 'Three moths fight beside you for 15 seconds.', price: { moonstones: 8 } },
};
G.SPELL_ORDER = ['spark', 'mend', 'flare', 'blink', 'frost', 'reveal', 'sunburst', 'swarm'];

// Cauldron recipes. Ingredient ids are sorted when matching.
G.RECIPES = [
  { id: 'heal', in: ['glowcaps', 'glowcaps'] },
  { id: 'greater', in: ['glowcaps', 'glowcaps', 'moonpetal'] },
  { id: 'tonic', in: ['emberroot', 'glowcaps'] },
  { id: 'gill', in: ['minnow', 'moonpetal'] },
  { id: 'frostward', in: ['emberroot', 'emberroot', 'shell'] },
  { id: 'shadow', in: ['dust', 'moonpetal'] },
  { id: 'clarity', in: ['lfish', 'moonpetal', 'moonpetal'] },
  { id: 'lumen', in: ['frostmint', 'glowcaps'] },
  { id: 'bomb', in: ['bone', 'emberroot', 'straw'] },
  { id: 'dawn', in: ['lfish', 'star', 'whisper'], secret: 1 },
  { id: 'soup', in: ['carp', 'carp', 'carp'], secret: 1 },
];
G.INGREDIENTS = ['glowcaps', 'moonpetal', 'emberroot', 'frostmint', 'whisper', 'minnow', 'carp', 'lfish', 'shell', 'bone', 'straw', 'dust', 'star', 'frost', 'thorn'];

// Gorrin's forge.
G.FORGE = [
  { out: 'club', cost: { motes: 150, bone: 5 } },
  { out: 'beetlemail', cost: { motes: 400, shell: 8 } },
  { out: 'wolfboots', cost: { motes: 900, pelt: 3 } },
  { out: 'wolfcloak', cost: { motes: 1600, pelt: 5, straw: 6 } },
  { out: 'whip', cost: { motes: 2200, thorn: 8, pelt: 2 } },
  { out: 'gearblade', cost: { motes: 9000, gear: 6, scrap: 4 }, need: 'gorrinGears' },
  { out: 'frostbrand', cost: { motes: 22000, frost: 8, scrap: 6 } },
  { out: 'rimeplate', cost: { motes: 32000, frost: 10, scrap: 10 } },
  { out: 'silkrobe', cost: { motes: 55000, silk: 8 } },
  { out: 'moonamulet', cost: { motes: 12000, moonstones: 3 } },
  { out: 'sunsteel', cost: { motes: 130000, star: 3, scrap: 10, frost: 4 } },
  { out: 'destiny', cost: { motes: 77777, spoon: 1, star: 1 }, secret: 1 },
];

G.SEEDS = {
  glow: { n: 'Glowcap spores', cost: { motes: 5 }, dur: 60e3, yield: () => ['glowcaps', G.rand(3, 6)], art: ['   .   ', '  (.)  ', ' (o o) ', '(O o O)'] },
  s_moon: { n: 'Moonpetal', dur: 4 * 60e3, yield: () => ['moonpetal', G.rand(1, 2)], art: ['   .   ', '   |   ', '  \\|/  ', ' -(@)- '] },
  s_ember: { n: 'Emberroot', dur: 3 * 60e3, yield: () => ['emberroot', G.rand(1, 3)], art: ['   .   ', '   ,   ', '  ,|,  ', ' ~\\|/~ '] },
  s_frost: { n: 'Frostmint', dur: 5 * 60e3, yield: () => ['frostmint', G.rand(1, 3)], art: ['   .   ', '   *   ', '  *|*  ', ' *\\|/* '] },
  s_whisper: { n: 'Whisperbloom', dur: 8 * 60e3, night: 1, yield: () => ['whisper', 1], art: ['   .   ', '   ?   ', '  (?)  ', ' ((?)) '] },
};
