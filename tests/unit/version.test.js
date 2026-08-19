// The version is shown on the title screen and mirrored in package.json; both
// must stay in sync and must be plain semver so bumps are unambiguous.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { VERSION } from '../../js/version.js';
import { STRINGS, LANGS } from '../../js/i18n.js';

const pkg = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));

test('the version is semver', () => {
  assert.match(VERSION, /^\d+\.\d+\.\d+$/);
});

test('package.json mirrors js/version.js', () => {
  assert.equal(pkg.version, VERSION);
});

test('the title screen has a version label in every language', () => {
  for (const lang of LANGS) {
    assert.ok(STRINGS[lang]['title.version'], `${lang}: title.version`);
    assert.match(STRINGS[lang]['title.version'], /\{version\}/);
  }
});
