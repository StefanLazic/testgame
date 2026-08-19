// Settings live behind a tiny store so they can be tested without a browser
// and so a broken / blocked localStorage can never break the game.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createSettings, DEFAULTS } from '../../js/settings.js';

function fakeStorage(initial = {}) {
  const data = { ...initial };
  return {
    data,
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => { data[k] = String(v); },
  };
}

test('starts from the defaults when nothing is stored', () => {
  const s = createSettings(fakeStorage());
  assert.deepEqual(s.all(), DEFAULTS);
  assert.equal(s.get('sound'), true);
});

test('reads previously stored values and keeps unknown defaults', () => {
  const s = createSettings(fakeStorage({ 'cd-settings': JSON.stringify({ sound: false }) }));
  assert.equal(s.get('sound'), false);
  assert.equal(s.get('shake'), DEFAULTS.shake);
});

test('set() persists as JSON', () => {
  const storage = fakeStorage();
  const s = createSettings(storage);
  s.set('sound', false);
  assert.deepEqual(JSON.parse(storage.data['cd-settings']).sound, false);
  assert.equal(createSettings(storage).get('sound'), false);
});

test('toggle() flips a boolean and returns the new value', () => {
  const s = createSettings(fakeStorage());
  assert.equal(s.toggle('sound'), false);
  assert.equal(s.toggle('sound'), true);
});

test('listeners fire on change with the key and value', () => {
  const s = createSettings(fakeStorage());
  const seen = [];
  s.onChange((key, value) => seen.push([key, value]));
  s.set('sound', false);
  s.toggle('shake');
  assert.deepEqual(seen, [['sound', false], ['shake', !DEFAULTS.shake]]);
});

test('unknown keys are ignored rather than stored', () => {
  const storage = fakeStorage();
  const s = createSettings(storage);
  s.set('nonsense', 1);
  assert.equal(s.get('nonsense'), undefined);
  assert.equal('nonsense' in s.all(), false);
});

test('survives corrupt stored JSON', () => {
  const s = createSettings(fakeStorage({ 'cd-settings': '{not json' }));
  assert.deepEqual(s.all(), DEFAULTS);
});

test('survives a storage that throws (private mode, blocked cookies)', () => {
  const hostile = {
    getItem() { throw new Error('blocked'); },
    setItem() { throw new Error('blocked'); },
  };
  const s = createSettings(hostile);
  assert.deepEqual(s.all(), DEFAULTS);
  assert.doesNotThrow(() => s.set('sound', false));
  assert.equal(s.get('sound'), false);
});

test('works with no storage at all', () => {
  const s = createSettings(null);
  assert.equal(s.get('sound'), true);
  s.set('sound', false);
  assert.equal(s.get('sound'), false);
});
