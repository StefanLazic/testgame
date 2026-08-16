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
