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

`js/version.js` holds `VERSION`, which the title screen displays and
`package.json` mirrors. Bump it (semver) in **every** pull request and keep
`package.json` in sync — `tests/unit/version.test.js` checks this.
