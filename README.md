# Mothlight

An ASCII incremental RPG that runs in the browser. It has been dusk for a very long time. A jar on your windowsill catches drifting motes of light, and the candle on your table is about to wake up.

**Play it now: <https://dallinks.github.io/mothlight/>**

## Playing

Open `index.html` in a browser. Nothing needs to be installed or built. It also runs from a local server:

```bash
py -m http.server 8642 --directory mothlight
```

Progress saves to the browser automatically every 20 seconds. Options has export, import and wipe.

### Controls on expeditions

| Key | Action |
| --- | --- |
| WASD or the arrow keys | Move. Walk into foes to attack them, and into chests, signs, levers and people to use them |
| 1 to 8 | Cast the spells you've learned |
| H G T Z C L B | Drink potions (Healing, Greater, Tonic, Shadowstep, Clarity, Lumen, Bomb) |
| Space | Cast and reel at Stillwater Lake |

On touch screens, an on-screen d-pad appears.

## What's in it

- **The hut.** Motes collect over time. You can inhale them (more max HP), release them (something small might notice), or feed them to Wick, the candle. Each feeding brings back one of her 11 memories, and those unlock new parts of the game and tell her backstory.
- **13 locations** on an ASCII world map. Eight of them are hand-built expeditions: Whisperwheat Field, Rootdeep Caves, Thornwood, the Drowned Shrine, the Lumenwright Ruins, the Pale Steps, the Cocoon Spire and the Underneath.
- **Real-time top-down exploration.** Dark places only show what your lantern lights, plus torches and glowing creatures. Areas you've seen stay drawn on the map. The game also has tall grass that hides you, ice that slides you along, cold that drains you, locked doors and keys, lever-and-gate puzzles, cracked walls, and false walls.
- **26 kinds of foe and 8 bosses**, each boss with its own behaviour: summoning, charging, teleporting, a shield, shard volleys, wing gusts, light drain.
- **88 items**, including gear for 5 slots, 6 lanterns, 7 jar lenses and 8 spells.
- **Side systems:** a garden, a cauldron with 11 recipes to discover by experimenting (2 of them secret), a forge, fishing with a timing minigame, knucklebones dice, tavern bounties, rumours, riddles, a wishing well, and 8 constellations to relight on the roof.
- **Lore:** 28 journal pages, a bestiary, NPC side quests, and 3 endings plus a post-game. New Game+ is also available.
- **53 glimmers** (achievements), 18 of them hidden. Each one adds 2% to your mote rate.

Some secrets need the real-world clock, the keyboard, or a very careful look at the map and sky. The tavern rumours hint at most of them.

## Project layout

```
index.html          shell; loads the scripts in order (plain scripts, no build step)
css/style.css       theme and tile colours
js/core.js          namespace, state, saving, resources, UI plumbing (binds, buttons, modals)
js/data/items.js    items, lanterns, lenses, spells, recipes, forge, seeds
js/data/enemies.js  foes and bosses
js/data/lore.js     memories, journal pages, constellations, rumours, riddles, glimmers
js/data/maps.js     expedition maps, drawn with a small builder (rect, cave, path, put)
js/systems.js       income, Wick, garden, cauldron, forge, fishing, dice, bounties, well
js/dungeon.js       the expedition engine: light, sight, AI, combat, spells, bosses
js/screens.js       hut, pack, garden, cauldron, spells, sky, journal, options
js/places.js        world map, village shops, NPCs, boss story beats, endings
js/secrets.js       words you can type
js/main.js          boot, main loop, input
tools/validate-maps.js  checks every map: legend coverage, reachability (with ice physics), sealed secrets
```

### Adding a map

1. Build it in `js/data/maps.js` with `G.MapBuilder`.
2. Add the per-map `legend` entries: mobs, chests, pages, doors, levers, gates, NPCs and torches.
3. Add the location to `G.LOCS` and `G.PLACES` in `js/places.js`.
4. Run the validator:

```bash
node tools/validate-maps.js
```

When you change a script, bump the `?v=` query in `index.html` so browsers don't serve the cached copy.
