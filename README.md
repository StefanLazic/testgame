# 🐱 Mimi-chan Defense

A 3D mobile **tower defense** game: place cat towers around the kitchen and stop
twenty waves of mice, snakes, dogs, birds and barnyard invaders before they
reach the milk bowl. Every cat here defends the milk of their queen,
👑 **Mimi-chan** — and on the last wave a dragon comes for it.

Built with [three.js](https://threejs.org/) as **plain static files** — no build
step, no bundler, no CDN. Open `index.html` (or serve the folder) and play.

```bash
python3 -m http.server 8000   # then visit http://localhost:8000
```

## Tests

There is no build step and there are no dependencies — the test harness is a few
Node scripts that serve the folder and drive headless Chromium over the DevTools
protocol.

```bash
npm test           # fast pure-logic unit tests (config, rules, i18n, settings)
npm run test:browser   # end-to-end smoke tests in a real browser
npm run test:all       # both
```

## Languages

The game ships in **Serbian (default)** and **English**. Tap the 🌐 button on the
title screen to switch; the choice is remembered in `localStorage`. Every
player-visible string lives in [`js/i18n.js`](js/i18n.js) — add both languages
there when you add UI text, a cat, an enemy or a wave.

## How to play

| Action | How |
| --- | --- |
| Place a cat | tap a cat in the shop, then tap any free floor tile |
| Inspect / upgrade / sell | tap a cat you already placed |
| Start the next wave early | tap the big button — you keep 🐟 3 per second skipped |
| Fast forward | tap the ▶▶ chip to cycle 1× / 2× / 3× |
| Pause / settings | tap ⏸ for the pause sheet (sound, music, speed, quality, language) |
| See a cat's range before buying | select it in the shop — the preview card shows its stats and paints its range on the board |

Every pest that reaches the milk costs lives (dogs cost 2, bosses far more).
Nine lives, twenty waves. From **wave 11** a second door tears open in the
top-right corner of the kitchen and pests pour in down *two* lanes at once.

## Two kitchens

Pick your battlefield on the title screen: **The Kitchen** (9×19, the original
tiled floor) or **The Garden** (11×17, a wider grassy lawn with a longer,
loopier path and flowers everywhere). The choice is remembered.

## The nine cats

| Cat | Cost | Role |
| --- | --- | --- |
| 🏹 Archer | 70 | cheap, reliable single-target shots — hits air |
| 🔮 Wizard | 120 | slow arcane orbs that explode — hits air |
| ❄️ Frost | 95 | chills one pest and slows it — hits air |
| 🥷 Ninja | 150 | 3.6 shuriken a second with 3× crits — ground only |
| 😴 Sleepy | 210 | lobs a pillow for huge splash damage, very slowly — ground only |
| 🎀 Ema | 180 | fires nothing: buffs every cat around her (damage + fire rate) |
| 💰 Sofija | 200 | fires nothing: pays a wage every few seconds and raises nearby bounties |
| 🧙 Witch | 300 | curses one pest a minute: frog ➜ stone ➜ dust (bosses are immune) |
| 👑 Mimi-chan | 3000 | the queen: every 10 s the whole board stops to bow for 1 s |

Each cat upgrades twice for more damage, range and fire rate — the Witch's
upgrades change *which* curse she casts, and Mimi-chan needs no upgrades.

**Squads.** Certain pairs of cats standing near each other unlock a bonus (✦ in
the tower panel) — mixed squads beat rows of clones.

**Paths.** At the last collar a cat can specialise once, permanently: two cards,
one choice, a floating gem and a very different cat.

## Things to find out for yourself

Birds ignore your beautiful maze. Golden mice are worth a fortune if you can
catch them. A dog that becomes a frog is still a dog's worth of embarrassment. Catnip sometimes drops — tap it. Wave 5 brings a mini-boss who
howls, and wave 10 brings a king who does not come alone.

Later on the farm shows up: pigs that *fly*, turtles you cannot dent, horses
that are gone before you aim, chickens that lay eggs which hatch into more
chickens, and monkeys that throw bananas — a cat hit by one is knocked out for
three seconds. Wave 15 has a mini-boss with a very good throwing arm. And on
wave 20, **Sophie has descended**.

Something in there heals its friends. Something else wears a shield that grows
back if you leave it alone. And something keeps disappearing underground just as
you line up the shot.

## Layout

```
index.html      title / help / game-over screens, HUD, shop and tower panel
styles.css      mobile-first UI (safe-area aware, portrait + landscape)
js/config.js    all balance data: board, path, towers, enemies, waves
js/maps.js      the two maps and the current-map switch
js/rules.js     pure rules: previews, auras, squads, paths, pest behaviours
js/settings.js  persisted options (sound, music, speed, quality, map)
js/i18n.js      every player-visible string in Serbian and English
js/main.js      boot, screen management, HUD + shop bindings
js/game.js      simulation: placement, targeting, waves, bosses, economy
js/models.js    procedural low-poly cats, pests, map, bowl, projectiles
js/fx.js        pooled particles, shockwave rings, camera shake
js/audio.js     WebAudio synthesised sound effects (no audio files)
vendor/         three.js r180 build (MIT, see vendor/THREE_LICENSE)
tests/          unit tests + headless-browser smoke tests (no dependencies)
```

## Docs

- [`docs/cats.md`](docs/cats.md) — every cat tower, its stats and abilities
- [`docs/enemies.md`](docs/enemies.md) — every enemy, its stats and behaviours
- [`docs/AGENTS.md`](docs/AGENTS.md) — rules for keeping those docs in sync

See `notes.md` for the development log.
