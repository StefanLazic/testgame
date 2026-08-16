# 🐱 Whisker Wizard

A 3D mobile arena game: a magic cat defends the rug against endless waves of mice.

Built with [three.js](https://threejs.org/) as **plain static files** — no build step,
no bundler, no CDN. Open `index.html` (or serve the folder) and play.

```bash
python3 -m http.server 8000   # then visit http://localhost:8000
```

## Controls

| Action | Touch | Keyboard |
| --- | --- | --- |
| Move | drag anywhere on the left half of the screen | WASD / arrows |
| 🐾 Claw swipe | tap/hold the paw button | Space or J |
| ☄️ Hairball Comet | tap the comet button (20 mana) | K |
| ⚡ Thunder Whiskers | tap the bolt button (45 mana) | L |

Attacks auto-aim at the nearest mouse, so one thumb is enough.

## Things to find out for yourself

Mice fall from the ceiling. Every fifth wave brings a crowned Mouse King who charges
and calls for backup. And mice sometimes drop catnip — pick it up.

## Layout

```
index.html      title / help / game-over screens, HUD and touch controls
styles.css      mobile-first UI (safe-area aware, portrait + landscape)
js/main.js      boot, screen management, HUD bindings
js/game.js      simulation: waves, enemies, abilities, camera
js/models.js    procedural low-poly cat, mice, arena
js/fx.js        pooled particles, shockwave rings, lightning, camera shake
js/audio.js     WebAudio synthesised sound effects (no audio files)
js/input.js     dynamic virtual joystick + buttons + keyboard fallback
vendor/         three.js r180 build (MIT, see vendor/THREE_LICENSE)
```

See `notes.md` for the development log.
