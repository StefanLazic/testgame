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

## 2026-08-16 — polish pass

- **Path chevrons**: soft glowing arrows bob along the route so the walk
  direction is obvious at a glance on a 360px-wide screen.
- **Tap rules tightened**: while a cat is selected in the shop, tapping a tile
  that already holds a cat opens its upgrade panel instead of scolding you, and
  the refusal toast now says *why* (no fish vs. on the path).
- Final boss HP raised to 6000 after a stress test where 24 level-3 cats
  deleted the Rat King in seconds.
- Verified with touch events (not just mouse clicks) in both 390×844 portrait and
  844×390 landscape: shop tap ➜ tile tap places, second tap selects, no errors.

## 2026-08-17 — curses, pillows and a queen

- **Frost lost its splash.** It was quietly the best value in the shop: an area
  slow *and* area damage for 95 🐟. It is now a single-target chill (damage
  nudged 7 ➜ 9 to pay for the lost area) so slowing a pack is a real investment
  in several Frost cats rather than one.
- **Chef ➜ 😴 Sleepy.** Same job (lobbed splash, ground only) with a new
  personality: nightcap, closed eyes, a floating `zzz`, and a pillow that arcs
  through the air and lands with a *whump*. Fire rate dropped 0.42 ➜ 0.34 and
  damage rose 52 ➜ 58, so she is now unmistakably the slow, heavy hitter.
- **🧙 Witch (300 🐟)** does zero damage. Every 60 seconds she hexes the
  highest-HP pest in range, and her collar decides the hex: level 1 turns it
  into a 🐸 **Frog** (mouse stats — a dog becoming a frog is the single funniest
  thing in the game), level 2 **petrifies** it inside a stone shell for 10
  seconds, level 3 **destroys** it outright. Bosses and mini-bosses are immune,
  which keeps waves 5 and 10 honest. If she has no legal target the cooldown
  retries every half second, so she never wastes a charge on an empty board.
- **👑 Mimi-chan (3000 🐟)**, the queen, is priced by formula: ten times the
  most expensive ordinary cat, computed in `config.js` so she rescales
  automatically. She has one ability, no upgrades and no range ring — every 10
  seconds the *entire board* stops to bow for 1 second, complete with a golden
  shockwave and every pest nodding in unison. Saving up for her means playing
  the first six waves poor; a full run only mints around 7000 🐟 total.
- **New shared systems**: `stunT` (movement hard-stopped, damage still lands),
  `bowT` (the nod animation), enemy `_transform()` that swaps one pest for
  another while keeping its exact place in the queue, and a removable stone
  shell that is cleaned up on despawn so pooled models never leak it.
- **Mobile**: seven shop buttons no longer squeeze to nothing — the row scrolls
  horizontally with a 54 px minimum touch target (and is capped to 62vw in
  landscape). Verified at 360×740 and 390×844 with touch taps.
- **Headless playtest** (Chromium + swiftshader): frog transform, 10-second
  petrification (enemy progress frozen), instant kill, board-wide bow (16/17
  pests bowing — the 17th had just died), and boss curse immunity all confirmed
  with no console errors.

## 2026-08-17 — Serbian localisation 🇷🇸

- **New `js/i18n.js`** holds every player-visible string in two languages,
  English and Serbian (Latin script), behind a tiny `t('key', { params })`
  helper. Placeholders are `{named}`, missing keys fall back to English and then
  to the key itself, so a forgotten translation can never render as `undefined`.
- **Serbian is the default.** The choice is stored in `localStorage` under
  `cd-lang`; the 🌐 button on the title screen flips between *Srpski* and
  *English* and re-renders everything live (static markup, shop buttons, HUD).
- **Static markup is annotated, not duplicated.** `index.html` ships the Serbian
  text inline (so the very first paint is already localised, even before the
  modules load) and marks each node with `data-i18n`, `data-i18n-html` (for the
  bolded help rules) or `data-i18n-aria`. `applyStatic()` rewrites them —
  including `<title>`, the meta description and `<html lang>` (`sr-Latn`/`en`).
- **Dynamic strings** — toasts, banners, the boss bar, the wave counter, the
  tower panel, the game-over taunts — all go through `t()` now. Cat, enemy,
  wave and curse names moved to i18n keys (`tower.frost.name`,
  `enemy.ratking.name`, `wave.5.name`, `curse.2.text`); `config.js` keeps its
  English names as a fallback and stays the single source of balance truth.
- **Gotcha found while refactoring**: `game.js` used `const t = this.selected`
  in `upgradeSelected()`/`sellSelected()`, which shadowed the new `t()`
  translator. Those locals are now `tw`.
- Translation choices worth remembering: *štetočine* for pests, *Pacovski kralj*
  for the Rat King, *Ser Lajavko* for Sir Barksalot, *Mimi-čan* for the queen,
  *mačja trava* for catnip. The panel says `Ledena 🐱` rather than
  `Mačka Ledena` — Serbian gender agreement makes a literal "X Cat" read badly.
- **Mobile**: the language pill keeps a 44 px touch target and sits under the
  title buttons, so nothing else on the small-screen layout moved.
- **Headless playtest** (Chromium + swiftshader, 390×844 with touch events):
  title, help, shop, HUD, tower panel, wave banner and toasts all render in
  Serbian, switching to English updates the shop live, and the console stayed
  clean.
