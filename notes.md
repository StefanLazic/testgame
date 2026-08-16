# Whisker Wizard — build notes

A 3D arena game where a magic cat defends the rug from waves of mice.
Static-only: no build step, no bundler, no external CDN. `index.html` loads
ES modules directly and three.js is vendored into `/vendor`.

## 2026-08-16 — foundations

- **Vendored three.js** (`three.module.min.js` + `three.core.min.js`, r180) instead of
  using a CDN, so the repo works on any plain static host and offline.
- **`index.html`** is the single entry point: title screen, how-to-play, game-over
  screen, HUD and touch controls all live here as DOM overlays on top of one
  `<canvas>`. An import map maps `three` to the vendored module.
- **`styles.css`**: mobile-first. Uses `env(safe-area-inset-*)` for notches,
  `touch-action: none` to kill scroll/zoom, and clamps font sizes so it reads on a
  320px phone as well as a tablet. Landscape media query compacts the panels.
- **`js/models.js`**: every mesh is procedural (spheres/boxes/cones). The cat has
  ears, whisker lines, a wave-animated tail chain and a tiny wizard hat. Mice come in
  grunt / fast / tank / king flavours with their own palettes.
- **`js/fx.js`**: pooled additive sprites for particles, expanding rings for AoE, a
  jagged line generator for lightning bolts, plus a camera shake accumulator.
- **`js/audio.js`**: all sound is synthesised with WebAudio (oscillators + filtered
  noise bursts). No audio files to ship or download.
- **`js/input.js`**: dynamic virtual joystick — the stick appears wherever you first
  touch the left half of the screen, which is far kinder on phones than a fixed pad.
  Keyboard (WASD + J/K/L) works too for desktop testing.
- **`js/game.js`**: the sim. Waves, pooling for enemies, separation steering for the
  swarm, camera follow with look-ahead.

### Combat design

- **🐾 Claw** — free, 0.4s cooldown, cone in front. Auto-aims at the nearest mouse so
  you never have to fight the camera on a touchscreen.
- **☄️ Hairball Comet** (20 mana) — physical projectile, explodes with falloff damage.
- **⚡ Thunder Whiskers** (45 mana) — big ring nuke that stuns everything nearby and
  draws a lightning bolt to each victim. The panic button.

### Surprises

- Mice **fall from the ceiling** when they spawn instead of walking in.
- Every 5th wave spawns a **Mouse King** that periodically *charges* at you and
  screams for reinforcements mid-charge.
- Mice sometimes drop **catnip**. Picking it up triggers *Catnip Frenzy*: the cat grows,
  moves 50% faster, leaves a rainbow trail, regenerates mana 3x, and simply
  **body-slams mice to death on contact**.

### Testing

Served locally with `python3 -m http.server` and smoke-tested in headless Chromium
(SwiftShader) at a 390x844 mobile viewport: no console errors, title -> play ->
joystick drag -> all three abilities.

## 2026-08-16 — polish pass

- **Boss health bar**: when the Mouse King is alive a gold/red bar appears under the
  HUD so you can see the fight going somewhere.
- **Hold to attack**: ability buttons now repeat while held (pointer capture +
  `held` flags in `input.js`), so you don't have to jackhammer the screen. Keyboard
  keys behave the same way.
- **Bug fixes found while testing**:
  - Enemy update iterated the live array while damage could splice from it and the
    king could push new spawns into it — now iterates a snapshot.
  - `flash` was uninitialised on pooled enemies.
- **Instrumented headless testing** (`window.game` is exposed for the console):
  45s autoplay soak at 360x740 under SwiftShader software rendering held ~27fps with
  no console errors, no particle/geometry leaks (sprites return to the pool, ring and
  projectile geometries are disposed), ~72 draw calls.
- Verified landscape 740x360 (buttons stay inside the viewport), game over → restart,
  and a forced wave-5 Mouse King fight including its guaranteed catnip drop.

## 2026-08-16 — look & feel

- Title screen is now a live diorama: the camera orbits the cat while a ring of mice
  (including the King) circles it. The menu overlay was lightened so the 3D scene reads
  through it instead of being a flat purple wash.
- Brightened the lighting rig (hemisphere 1.15 → 1.5, warmer sun) and the rug colour.
  Measured average frame colour from headless screenshots before/after: the playfield
  went from roughly rgb(46,26,74) to rgb(70,41,112), which is much more readable on a
  phone screen in daylight.
- The game-over screen freezes the arena instead of cutting to the menu orbit, so you
  see the swarm that finally got you.
- Added a README with controls and file layout.

## 2026-08-16 — genre change: arena ➜ tower defense

The game is now **Claw Defense**. The player no longer drives a cat around; they
place cat *towers* along a winding kitchen path and defend a bowl of milk from
ten waves of pests. Everything is still plain static files (`index.html` + ES
modules + vendored three.js), no build step.

- **`js/config.js` (new)** — single source of balance truth: board size, path
  waypoints, tower/enemy stats, wave table, prices. Tuning the game never means
  touching engine code.
- **Board**: a 9×19 grid (tall, so it fills a phone screen) with a serpentine
  brown path from the mouse hole to the milk bowl. Tiles off the path are
  buildable; the `pathTiles` set is derived from the waypoint list so the path
  and the build grid can never disagree.
- **Camera**: fixed, no panning or pinch — instead `_fitCamera()` projects the
  board corners and binary-searches the camera distance, then pans vertically
  until the top/bottom margins match. That keeps the whole board on screen and
  clear of the HUD chips and shop bar on any aspect ratio, portrait or landscape.
- **Removed** `js/input.js` (virtual joystick) — controls are now taps.
- **Deleted** the old arena/player code; `models.js` was rewritten for towers,
  four pest species, bosses, the map, bowl, bullets and pickups. `fx.js` and the
  WebAudio `audio.js` survived (audio gained a new sfx table).

### The five cats

| Cat | Cost | Role |
| --- | --- | --- |
| 🏹 Archer | 70 | cheap, reliable single target, hits air |
| 🔮 Wizard | 120 | slow arcane orbs with splash, hits air |
| ❄️ Frost | 95 | weak damage but chills and slows a small area, hits air |
| 🥷 Ninja | 150 | 3.6 shots/sec shuriken, ground only, 22% crits for 3× |
| 🍳 Chef | 210 | lobs a frying pan, huge splash, ground only |

Each upgrades twice (+62% damage, +13% range, +18% fire rate per level) and
gains a visible golden collar. Selling refunds 70%.

### Pests

Mice, snakes (fast), dogs (armoured), and **birds that fly in a straight line
over the whole maze** — only Archer/Wizard/Frost can touch them, which is what
stops a wall of Ninjas from solving the game.

### Economy

Start with 🐟 260. Fish come from kills, a post-wave bonus (`45 + 18×wave`) and
an *early bird* bonus of 3 fish per second of prep time skipped — so a confident
player can snowball.

### Testing

Headless Chromium (SwiftShader) smoke test: title ➜ play ➜ place all five cats ➜
run a wave, no console errors. Camera framing verified numerically at 390×844,
360×640, 820×1180 and 844×390.

## 2026-08-16 — balance, bosses and the title diorama

- **Automated playtest**: a headless Chromium script drives a deliberately naive
  AI (buys the most expensive affordable cat on the tile touching the most path
  segments, occasionally upgrades a random one) at 3× speed. It died on wave 9
  with 222 kills, which felt like the right shape for a game a thinking player
  should be able to win. Mini-boss HP trimmed 1500 ➜ 1200 and the final boss
  5200 ➜ 4200 so bosses don't turn into a stalemate.
- **Title screen is now a live diorama**: `startDemo()` places one of each cat on
  random path-adjacent tiles and trickles mice/snakes/birds down the path with
  no stakes — leaks and kills are silent in `demo` phase. It doubles as a
  permanent smoke test: if the sim is broken, the title screen shows it.
- **Sir Barksalot howls** every 6 seconds: a shockwave ring that cleanses slows
  and gives every pest within 9 units +45% speed for 3 seconds. It turns wave 5
  from "big health bar" into a timing problem.
- **The Rat King** enrages below 45% HP (+50% speed) and coughs out three extra
  mice every 3.5 seconds from its own position.
- Boss waves are announced during the previous prep phase so nobody gets
  ambushed while saving up.
