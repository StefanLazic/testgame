// Localisation guards: a missing Serbian string used to be invisible until a
// player hit it, so the parity between the two dictionaries is now a test.
import test from 'node:test';
import assert from 'node:assert/strict';
import { LANGS, t, setLang, getLang, STRINGS } from '../../js/i18n.js';
import { TOWER_ORDER, ENEMIES, WAVES } from '../../js/config.js';

test('both languages are declared', () => {
  assert.deepEqual([...LANGS].sort(), ['en', 'sr']);
});

test('every English key has a Serbian translation and vice versa', () => {
  const en = Object.keys(STRINGS.en).sort();
  const sr = Object.keys(STRINGS.sr).sort();
  const missingSr = en.filter((k) => !STRINGS.sr[k]);
  const extraSr = sr.filter((k) => !STRINGS.en[k]);
  assert.deepEqual(missingSr, [], `missing Serbian keys: ${missingSr.join(', ')}`);
  assert.deepEqual(extraSr, [], `Serbian keys with no English original: ${extraSr.join(', ')}`);
});

test('placeholders match between languages', () => {
  const holes = (s) => [...String(s).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
  for (const key of Object.keys(STRINGS.en)) {
    assert.deepEqual(holes(STRINGS.sr[key]), holes(STRINGS.en[key]), `placeholders differ for ${key}`);
  }
});

test('every cat, enemy and wave has a name and a blurb where needed', () => {
  for (const lang of LANGS) {
    for (const kind of TOWER_ORDER) {
      assert.ok(STRINGS[lang][`tower.${kind}.name`], `${lang}: tower.${kind}.name`);
      assert.ok(STRINGS[lang][`tower.${kind}.blurb`], `${lang}: tower.${kind}.blurb`);
    }
    for (const kind of Object.keys(ENEMIES)) {
      assert.ok(STRINGS[lang][`enemy.${kind}.name`], `${lang}: enemy.${kind}.name`);
    }
    for (let w = 1; w <= WAVES.length; w++) {
      assert.ok(STRINGS[lang][`wave.${w}.name`], `${lang}: wave.${w}.name`);
    }
  }
});

test('t() fills placeholders and falls back instead of rendering undefined', () => {
  assert.match(t('toast.sold', { gold: 42 }), /42/);
  assert.equal(t('definitely.not.a.key'), 'definitely.not.a.key');
});

test('switching language changes the rendered string', () => {
  const before = getLang();
  setLang('en');
  const en = t('title.play');
  setLang('sr');
  const sr = t('title.play');
  assert.notEqual(en, sr);
  setLang(before);
});
