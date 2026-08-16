# 🐱 Claw Defense

A 3D mobile **tower defense** game: place cat towers around the kitchen and stop
ten waves of mice, snakes, dogs and birds before they reach the milk bowl.

Built with [three.js](https://threejs.org/) as **plain static files** — no build
step, no bundler, no CDN. Open `index.html` (or serve the folder) and play.

```bash
python3 -m http.server 8000   # then visit http://localhost:8000
```

## How to play

| Action | How |
| --- | --- |
| Place a cat | tap a cat in the shop, then tap any free floor tile |
| Inspect / upgrade / sell | tap a cat you already placed |
| Start the next wave early | tap the big button — you keep 🐟 3 per second skipped |
| Fast forward | tap the ▶▶ chip to cycle 1× / 2× / 3× |

Every pest that reaches the milk costs lives (dogs cost 2, bosses far more).
Nine lives, ten waves.

## The five cats

| Cat | Cost | Role |
| --- | --- | --- |
| 🏹 Archer | 70 | cheap, reliable single-target shots — hits air |
| 🔮 Wizard | 120 | slow arcane orbs that explode — hits air |
| ❄️ Frost | 95 | chills an area and slows everything in it — hits air |
| 🥷 Ninja | 150 | 3.6 shuriken a second with 3× crits — ground only |
| 🍳 Chef | 210 | lobs a frying pan for huge splash damage — ground only |

Each cat upgrades twice for more damage, range and fire rate.

## Things to find out for yourself

Birds ignore your beautiful maze. Golden mice are worth a fortune if you can
catch them. Catnip sometimes drops — tap it. Wave 5 brings a mini-boss who
howls, and wave 10 brings a king who does not come alone.

## Layout

```
index.html      title / help / game-over screens, HUD, shop and tower panel
styles.css      mobile-first UI (safe-area aware, portrait + landscape)
js/config.js    all balance data: board, path, towers, enemies, waves
js/main.js      boot, screen management, HUD + shop bindings
js/game.js      simulation: placement, targeting, waves, bosses, economy
js/models.js    procedural low-poly cats, pests, map, bowl, projectiles
js/fx.js        pooled particles, shockwave rings, camera shake
js/audio.js     WebAudio synthesised sound effects (no audio files)
vendor/         three.js r180 build (MIT, see vendor/THREE_LICENSE)
```

See `notes.md` for the development log.
