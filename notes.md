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

## 2026-08-17 — Mimi-chan Defense: a second door, a barnyard and a dragon 🐉

The game is now **Mimi-chan Defense** — the framing is that every cat on the
board is defending the milk of their queen. Ten more waves were added on top of
the original ten; **waves 1–10 are untouched**, so the early game plays exactly
as before.

- **A second lane.** `config.js` gained `PATH2` (and a `PATHS` array). It starts
  in the **top-right** corner of the board — the camera looks down −z, so
  screen-right is `col = COLS-1` and screen-top is `row = 0`. Both lanes'
  tiles are reserved in `pathTiles` from the very first wave, so a maze built in
  waves 1–10 can never be invalidated later; lane 2's arrows and portal glow
  stay hidden until `SECOND_LANE_WAVE = 11`, when `setLaneOpen(1, true, true)`
  cracks the door open with a shockwave and a toast. Wave groups are now
  `[kind, count, gap, delay, lane]` and fall back to lane 0 if the lane is shut.
- **The barnyard.** Five new pests, all procedurally modelled in `models.js`:
  🐖 **flying pigs** (a lot of health, slower than birds, still air-only),
  🐢 **turtles** (very slow, huge health, heavy armour), 🐎 **horses** (fast
  with decent health *and* armour), 🐔 **chickens** (fast, and every 7 s they
  drop an egg that hatches into a chick 4.5 s later — capped at 12 live eggs so
  the board can't melt), and 🐒 **monkeys**, who lob bananas at nearby cats.
- **Cats can be hurt now.** A banana knocks a cat out for `BANANA_STUN = 3`
  seconds: it wobbles, stops shooting and stops charging its ability. It is the
  first mechanic in the game that attacks the player's side of the board, and it
  makes tower placement near the lane a real decision.
- **Wave 15 mini-boss: 🍌 Baron Bananas**, a monkey king who throws three
  bananas at a time on a shorter cooldown.
- **Wave 20: Sophie.** The dragon flies in from off-camera on a 5.2 s eased
  entrance (untargetable while `intro` is set), the screen dims for a full-screen
  cinematic — *"SOPHIE HAS DESCENDED"* — and she lands with a ring, a burst and a
  camera kick. Her three abilities: every **10 s** she burns one random cat to
  ash (no refund; 👑 Mimi-chan is immune, so the queen is the one cat guaranteed
  to survive), every **20 s** she summons a swarm of critters, and at **75 % /
  50 % / 25 %** health she summons the wave 5, 10 and 15 bosses at 45 % HP.
- **Summon placement** was the one real bug: minions were projected onto the
  nearest point of the route, and because Sophie flies diagonally that could be
  a few tiles from the bowl. `_placeOnRoute()` now clamps summons to the first
  55 % of the lane and re-derives the segment from the clamped progress.
- **UI**: the wave chip counts to `/ 20`, the cinematic overlay lives in
  `index.html` + `styles.css` (with a `prefers-reduced-motion` fallback that
  keeps the text and drops the swoop), and `ui.cinematic()` restarts the child
  animations so it can be replayed. New WebAudio effects: `portal`, `banana`,
  `bonk`, `egg`, `dragonRoar`, `dragonFire`.
- **Localisation**: every new enemy, wave name, banner, toast and help line is in
  `js/i18n.js` in both English and Serbian — *SOFI JE SLETELA*.
- **Headless playtest** (Chromium + swiftshader, 390×844 with touch): waves 11+
  open the second portal and queue both lanes, eggs hatch, bananas knock cats
  out, Sophie's entrance plays, her fire destroys a tower, all three HP-threshold
  summons fire in order, the boss bar stays on her, and the run reaches the
  victory screen with a clean console.
- **Balance pass from headless simulation.** A scripted run of waves 11→20 (a
  fully built, twice-upgraded board at 3× speed) lost the milk on wave 13, so:
  flying pigs went 240 → 170 HP and cost 1 life instead of 2 (only four cats can
  shoot air, so a pig wave was effectively unanswerable), horses went 280 → 150
  HP / 7 → 5 armour / 1 life, and `hpScale()` now keeps the original
  `1 + 0.17 × (wave − 1)` ramp for waves 1–10 and switches to a gentler
  `+0.09` per wave afterwards — the barnyard already brings its own bulk, and
  waves 1–10 stay bit-for-bit identical.

## 2026-08-19 — a test suite, at last

The game had no automated tests: every session ended with a hand-driven
headless playtest that nobody could repeat later. That is now a committed,
**zero-dependency** suite that runs on plain node and plain Chromium.

- **`package.json`** exists only so the tests have somewhere to live —
  `npm test` runs the unit tests, `npm run test:browser` runs the smoke test,
  `npm run test:all` runs both. There are no dependencies, no build step, and
  `index.html` still opens straight off the filesystem.
- **Unit tests** (`tests/unit/*.test.js`, node's built-in test runner) import
  `js/config.js` and `js/i18n.js` directly — both are pure and three.js-free.
  They lock down the balance invariants (every wave spawns a real enemy, boss
  waves have bosses, upgrade costs rise, the queen stays priced at 10× the
  priciest cat) and, importantly, **translation parity**: every key must exist
  in both languages with matching `{placeholders}`, and every cat, enemy and
  wave must have a name. A missing Serbian string used to be invisible until a
  player tripped over it.
- **Browser smoke test** (`tests/browser/smoke.test.js`) serves the repository
  from a tiny node static server and drives real headless Chromium through the
  **Chrome DevTools Protocol** over node 22's built-in `WebSocket` — no
  puppeteer, no playwright, nothing in `node_modules`. It emulates a 390×844
  phone with touch enabled, taps the actual buttons with `Input.dispatchTouchEvent`,
  and asserts: the title screen renders, WebGL initialised and built the board,
  Play starts a run, a cat can be bought and placed, a wave spawns pests, the
  cats kill something — and the console stayed clean the whole time.
- Two tiny production tweaks were needed to make `js/i18n.js` importable in
  node: `STRINGS` is exported (so parity can be asserted) and `applyStatic()`
  returns early when there is no DOM.

## 2026-08-19 — pause, and a place to put settings ⏸

The game had a fast-forward chip but no way to stop, and no way to turn the
sound off — awkward on a phone, where a run could be lost to an incoming call.

- **`js/settings.js` (new)** is a tiny store: defaults, JSON in `localStorage`
  under `cd-settings`, change listeners, and a hard rule that it must never
  throw. Private mode, blocked cookies, hand-edited garbage, no storage object
  at all — every case falls back to the defaults, and all of them are unit
  tested (`tests/unit/settings.test.js`).
- **Pause** (`game.setPaused`) freezes the simulation but keeps rendering, so
  the board stays visible behind the sheet. It also drops the accumulated
  `Clock` delta on both edges — without that, resuming after ten seconds in
  another app would lurch the whole wave forward in one frame. The test asserts
  the prep timer doesn't move while paused and doesn't jump on resume.
- **The sheet** offers Resume, Restart run, Quit to title and two settings:
  🔊 sound and 〰️ screen shake. Muting keeps the WebAudio graph alive and just
  closes the master gain, so nothing has to be rebuilt when it comes back.
  Screen shake off makes `_shakeCamera` a no-op for anyone who finds the camera
  kicks unpleasant.
- **Auto-pause** on `visibilitychange` and `blur`, plus Escape/P on a desktop
  keyboard. The ⏸ chip is a 44 px touch target next to the speed chip.

## 2026-08-19 — see the reach before you spend 🎯

Buying a cat used to be an act of faith: the range ring only appeared once your
finger was already on the floor, and the shop button showed a price and nothing
else.

- **`js/rules.js` (new)** is where pure gameplay maths now lives — no three.js,
  no DOM, so it can be unit tested. It starts with `previewStats(kind)` (the
  level 1 numbers the shop shows) and `previewTile(...)`, which parks the
  preview on the free tile next to the lane closest to the middle of the board.
- **Selecting a cat in the shop** immediately shows the ghost tile *and* its
  range ring on that tile, sized to the cat's real range, tinted mint when you
  can afford it and red when you can't. Dragging moves it as before; a drag that
  ends nowhere snaps the preview back instead of hiding it.
- **A preview card** sits above the shop with the icon, name, price, damage /
  range / fire rate and whether the cat can hit air. Ability cats (Witch,
  Mimi-chan) show their blurb instead of pretend damage numbers, and the queen —
  who has no range at all — says so and draws no ring.
- Tests: `tests/unit/rules.test.js` for the pure part, `tests/browser/preview.test.js`
  for the real UI, including that the card stays inside a 390 px phone screen.
- The CDP helper learned to `scrollIntoView` before tapping and to fail loudly
  if something covers the target — the seven-cat shop row scrolls horizontally,
  so a naive tap on the queen used to land on the kitchen floor instead.

## 2026-08-19 — A second battlefield: The Garden

The board is no longer baked into `config.js`. `js/maps.js` owns the list of
maps (size, lanes, theme, scenery) and `setBoard()` swaps the live bindings
`COLS`, `ROWS`, `PATHS`, `SECOND_LANE_WAVE` and `THEME` that everything else
imports — ES module live bindings mean no wiring had to change.

* **The Kitchen** — unchanged, so waves 1–10 still play exactly as before (a
  unit test asserts the lanes byte-for-byte).
* **The Garden** — 11×17 instead of 9×19: wider, shorter, sunnier. Grass
  checkerboard, a dirt path, a fence, and little flowers sprouting on the free
  tiles. The route is shorter, so leaks arrive sooner, but there is much more
  room to build.

A map picker sits on the title screen. Tapping a card rebuilds the diorama
immediately — the choice previews itself — and the pick is remembered in
settings (`map`), so a reload drops you back on your board.

Engine changes: lights moved to `_buildLights()` (built once) and the board
into a `this.world` group that `setMap()` throws away and rebuilds;
`_clearEntities()` is now shared by `start()` and `setMap()`.

Tests: `tests/unit/maps.test.js` validates every lane (in bounds, axis-aligned,
no zero-length segments, starts on an edge, all lanes end at the bowl, at least
60 buildable tiles) and that `useMap()` really swaps the live bindings.
`tests/browser/maps.test.js` taps through the picker, checks persistence across
a reload, and plays a wave on the garden.

## 2026-08-19 — Support cats: Ema and Sofija

Two cats that never fire a shot.

* **🎀 Ema** (🐟 190) buffs every cat inside her ribbon: +18% damage / +12% fire
  rate at level 1, up to +38% / +28% at level 3. Ribbons never stack (only the
  strongest Ema in reach counts) and she never cheers for herself, so spamming
  Emas is a trap. A buffed cat says "🎀 cheered on by Ema" in its panel and
  gets a little pink ring when the ribbon first reaches it.
* **💰 Sofija** (🐟 200) digs up fish on her own — 🐟 12 every 8 s, 🐟 28 every
  5 s at level 3 — and every pest that dies inside her purse is worth 25–60%
  more. Purses do not stack either. She speeds up during the queen's frenzy.

The maths lives in `js/rules.js` (`auraBonus`, `auraMultipliers`, `goldIncome`,
`bountyMultiplier`) over a `SUPPORT` table in `config.js`, so it is all unit
tested. The engine caches the result on each tower (`tower.buff`) and only
recomputes it when a cat is built, upgraded or sold — no per-frame distance
scans.

Both cats got hand-built models: Ema has a giant bow, pompoms and a floating
heart; Sofija wears a merchant's visor and flips a fish coin over a coin purse.

Tests: `tests/unit/support.test.js` (aura/purse maths, no stacking, no
self-buff, clamping) and `tests/browser/support.test.js` (shop entries, a
neighbour really gets buffed, the panel badge, selling removes the buff, gold
ticks up on its own, kills near Sofija pay more).

## 2026-08-19 — Squads and hybrid paths

Two systems that reward thinking about *where* cats stand and *what* they
become.

**Squads (synergies).** Two different cats within 4.6 units of each other buff
one another: Shatter (Frost + Ninja), Blizzard (Frost + Wizard), Lullaby
(Sleepy + Wizard), The Hunt (Archer + Ninja), Coven (Witch + Wizard), Charm
(Ema + Sofija) and Royal Court (Mimi-chan + Ema). A pairing counts once, but
different pairings stack — so a mixed squad beats a row of clones. Active
squads show as ✦ badges in the tower panel.

**Hybrid paths.** At the last collar a cat can specialise once, permanently,
for 1.9× its base cost. The panel offers two cards (Sniper vs Ranger, Inferno
vs Nova, Glacier vs Hailstorm, Assassin vs Shadow, Dreamer vs Boulder, Anthem
vs Duet, Banker vs Pirate, Hexer vs Doomsayer) and the cat gets a floating gem
plus a ✧ line in its panel. Every path is a multiplier table in
`BRANCHES` (config), applied inside `towerStats(kind, level, branch)`, so the
support maths, the previews and the engine all pick it up for free.

The engine now resolves multipliers in three passes when the board changes
(synergies → support ranges → auras) and caches the result per tower, so the
per-frame cost is one small object.

Tests: `tests/unit/synergy.test.js` (pairing rules, no self-synergy, no double
counting, branch tables well formed, unknown branches ignored),
`tests/unit/i18n.test.js` grew a check that every path and squad is translated,
and `tests/browser/synergy.test.js` builds a squad, sells the partner, upgrades
to the last collar, buys a path and fights a wave with it.

## 2026-08-19 — Enemy counterplay: nurses, beetles and moles

Waves 11+ now include three pests that each break one of the game's rules, so
that a single perfect tower can no longer answer everything. Waves 1–10 are
untouched (a unit test asserts this) — the new pests only appear once the
second door opens.

**💉 Nurse Hazel** heals every *other* pest within 5.2 tiles for 30 HP every
3.4 s, capped at their maximum. She punishes chip damage: kill her first or
bring burst.

**🛡️ Shield Beetle** carries a 260-point barrier on top of 190 HP and 4 armour.
Damage eats the shield before health, and after 4 quiet seconds the shield
regrows at 45/s — the wireframe bubble around it fades back in as it recharges.
It rewards sustained fire and punishes slow single shots.

**🕳️ Mole** dives for 2.2 s every 3.6 s. Underground it is untargetable and
immune to damage, curses and splash, but it also travels slower, so the trade
is time for safety. Spread your damage down the lane instead of stacking it.

All three behaviours are pure functions first — `healTargets`, `shieldAbsorb`,
`shieldRegen` and `burrowedAt` in `js/rules.js` — with the engine only doing
the bookkeeping. That kept the TDD loop fast and means the rules are testable
without a browser.

Also fixed a real bug found while wiring this up: Ema's damage aura was being
applied twice in `_fire` (once via the cached multiplier and again directly).

Tests: `tests/unit/pests.test.js` (heal targeting/self-exclusion/HP cap, shield
absorb + overkill + regen delay, burrow cycle timing, waves 1–10 frozen) and
`tests/browser/pests.test.js` (spawns each pest live, shoots a beetle through
its shield, watches it regrow, watches a nurse heal a dying mouse, and watches
a mole dive and resurface).

## 2026-08-19 — Final pass

README now covers the test harness, the two maps, the nine cats (including the
support pair), squads and paths, and hints at the three new pests without
spoiling them. Full suite green: 70 unit tests and 56 browser tests.

## 2026-08-19 — Waves 21–30 and Emilija the butterfly

Two things were wrong or missing after the last pull request.

**The instructions had drifted.** The title screen still said "Seven cats.
Twenty waves." while the roster had grown to nine (Ema, Sofija and Mimi-chan
joined), and the how-to-play screen never mentioned the support cats, squads,
hybrid paths or the counterplay pests. Fixed in `js/i18n.js` (both languages)
and `index.html`: the tagline now reads nine cats / thirty waves, the boss line
lists all six boss waves, and there are new bullets for support cats, squads &
paths, the awkward pests and Emilija herself. The HUD wave chip ships with
`1 / 30` and the total already came from `WAVES.length`, so nothing else had to
change.

**Ten new waves (21–30).** Wave 25 is the first double mini-boss: Sir
Barksalot and Baron Bananas walk in together, one from each door. Waves 27 and
29 seed a few *flutterlings* — small butterflies that foreshadow what is coming
— and wave 30 is the new final boss.

**🦋 Emilija.** An enormous butterfly with 52 000 HP and 22 armour who never
touches a cat. She glides in on a spiral of glitter (her own cinematic, banner
and warning toasts, mirroring Sophie's wave-20 arrival), then every **13 s**
plays one of three tricks, never the same one twice in a row:

1. **Shuffle** — every cat swaps tiles with another cat. Squads, synergies and
   Ema's ribbon are all recalculated, so your careful layout becomes someone
   else's careful layout.
2. **Sleep** — a third of your army (rounded up, never all of it) falls asleep
   until her *next* trick, i.e. 13 s.
3. **Children** — three flutterlings peel off her wings and fly for the milk.

13 s was chosen so that a trick lands roughly four times per minute: long
enough to rebuild and re-target after a shuffle, short enough that the board
never feels settled. Sleep lasting exactly until the next trick means the two
disruptive tricks can never stack, which keeps the fight readable.

The three tricks are pure functions in `js/rules.js` — `shufflePlan` (a
derangement, so nobody keeps their own tile), `sleepPicks` and `nextTrick` —
with the engine only doing the bookkeeping, matching how the pest counterplay
was built. Sleeping cats now snore blue Zs instead of banana stars, and the
existing `disabledT` timer does the actual work.

Tests: `tests/unit/emilija.test.js` (seeded PRNG: shuffle keeps the same tiles
and never leaves a cat in place, sleep picks a third and never the whole army,
tricks never repeat) plus new assertions in `tests/unit/config.test.js` for the
30-wave table, the double mini-boss and waves 1–20 being untouched.

**Model pass.** Emilija's wings started life as vertical planes, which looked
like a paper blade from the game's high camera. They now lie flat — like a
butterfly pinned in a case — and flap by tilting around the body, and her
palette was brightened (`0xd89bff` / `0xffa8e0` wings, gold spots) so she reads
against the dark board. Checked with a scripted screenshot at three camera
distances. The flutterlings inherit the shape and are recoloured cyan/mint so
nobody mistakes a child for the boss.

**Docs.** `docs/enemies.md` gained Emilija, the flutterlings, the 21–30 wave
table and the new "cats can be attacked" rule; `docs/cats.md` explains what a
shuffle and a nap do to a cat (and that Mimi-chan is not immune to either, but
does not care because she is global); `README.md` now says thirty waves and
hints at wave 25 and wave 30 without spoiling them. Checked the help screen on a
360×640 phone: it scrolls and the "Got it" button stays tappable with the five
new bullets.

## The family, Simba-kun and waves 31–50

Big late-game expansion, built test-first as always.

**One of a kind.** `TOWERS.queen.limit = 1` plus `canPlaceTower()` in `rules.js`.
The engine refuses the placement (toast + deny sound) and the shop button greys
out with a ✓ once Mimi-chan is on the table — and unlocks again if she is lost.

**🗡️ Simba-kun**, the samurai cat: a cleaving katana (splash + crit, ground
only) and *bushido* — every 14 s he unsheathes and cuts **and stuns** everything
around him. Two paths: 🏯 Sensei (faster, wider strike) and 🌾 Ronin (slower but
brutal). Three new squad bonuses: Dojo, Honour, Kata.

**Waves 31–50.** Steeper HP curve past 30, gym rats and knitting grannies as new
pests, and:

* **35 — 🧶 Grandma Vera** (mini boss): knits your cats up and heals her friends.
* **40 — 🤸 Simona the gymnast**: clones herself every 14 s, and every copy keeps
  her *exact* health fraction (90% hurt original → 90% hurt copy). Star jumps
  fling her 3 tiles down the lane (never into the bowl), and a handstand freezes
  her in place with 90% damage resistance.
* **40 — 🏀 Stefo**, her brother, appears the moment she falls. He never walks:
  he teleports around the kitchen and shoots baskets at the milk, one life each.
* **45 —** three mini bosses at once: Grandma Vera, Baron Bananas, Monkey King.
* **50 — 💥 Father.** He lands on half your cats. When he hits zero health he
  shouts *"I AM THE BOSS"*, heals to full and flattens 50% more. Beat him and the
  game is over — for good.

Tests: `tests/unit/family.test.js`, `tests/unit/simba.test.js` and a live
browser run in `tests/browser/family.test.js` (limit, katana, clones, handstand,
star jump, teleports, baskets, the revive). 110 unit + 81 browser checks green.

Docs updated in the same change (`docs/cats.md`, `docs/enemies.md`, `README.md`,
help screen, meta description and the victory line — the game now ends with
Father, not Emilija). Grandma Vera throws pink balls of wool instead of bananas.
Full suite: 95 unit + 81 browser checks green.
