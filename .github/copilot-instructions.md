# Copilot instructions for Claw Defense

Claw Defense is a static-hosted 3D browser tower defense game: no build step and
no bundler. `index.html` loads ES modules from `js/` with an import map to the
vendored three.js in `vendor/`. All balance data lives in `js/config.js`.

## Required: keep the character docs up to date

Whenever **cats (towers)** or **enemies** are added, removed or updated —
including any change to `TOWERS`, `ENEMIES`, `WAVES` or the related helpers in
`js/config.js`, or to their behaviour in `js/game.js` — you must update
`docs/cats.md` and/or `docs/enemies.md` in the same change.

See [`docs/AGENTS.md`](../docs/AGENTS.md) for the full checklist.

## Required: bump the version on every pull request

The version lives in `js/version.js` (mirrored in `package.json`) and is
displayed on the title screen. Bump it in every pull request: patch for fixes,
minor for new content or features, major for a rework.
