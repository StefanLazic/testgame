// The version shown on the title screen must stay in sync with package.json,
// and every pull request is expected to bump it (see docs/AGENTS.md).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { VERSION } from '../../js/version.js';

const pkg = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));

test('the version is plain semver', () => {
  assert.match(VERSION, /^\d+\.\d+\.\d+$/);
});

test('js/version.js and package.json agree', () => {
  assert.equal(pkg.version, VERSION);
});
