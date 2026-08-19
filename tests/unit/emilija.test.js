// Emilija the butterfly boss rearranges your army instead of attacking it, so
// all three of her tricks are pure list maths and can be tested without a
// browser. A seeded generator keeps the randomness reproducible.
import test from 'node:test';
import assert from 'node:assert/strict';
import { shufflePlan, sleepPicks, nextTrick } from '../../js/rules.js';
import { EMILIJA } from '../../js/config.js';

// Tiny deterministic PRNG so failures are reproducible.
function seeded(seed = 1) {
  let x = seed;
  return () => {
    x = (x * 1664525 + 1013904223) % 4294967296;
    return x / 4294967296;
  };
}

test('shufflePlan keeps exactly the same tiles', () => {
  const tiles = ['1,1', '2,3', '4,5', '6,7', '8,2'];
  const plan = shufflePlan(tiles, seeded(7));
  assert.equal(plan.length, tiles.length);
  assert.deepEqual([...plan].sort(), [...tiles].sort());
});

test('shufflePlan never leaves a cat on its own tile', () => {
  const tiles = Array.from({ length: 12 }, (_, i) => `${i},0`);
  const rand = seeded(3);
  for (let run = 0; run < 200; run++) {
    const plan = shufflePlan(tiles, rand);
    assert.ok(plan.every((tile, i) => tile !== tiles[i]), `run ${run} left a cat in place`);
  }
});

test('shufflePlan copes with zero or one cat', () => {
  assert.deepEqual(shufflePlan([]), []);
  assert.deepEqual(shufflePlan(['3,3']), ['3,3']);
});

test('sleepPicks naps a third of the army, rounded up', () => {
  assert.equal(sleepPicks(9, 1 / 3, seeded(1)).length, 3);
  assert.equal(sleepPicks(10, 1 / 3, seeded(1)).length, 4);
  assert.equal(sleepPicks(1, 1 / 3, seeded(1)).length, 1);
  assert.deepEqual(sleepPicks(0, 1 / 3), []);
});

test('sleepPicks returns distinct, in-range indices and never the whole army', () => {
  const rand = seeded(11);
  for (let count = 2; count < 30; count++) {
    const picks = sleepPicks(count, EMILIJA.sleepFraction, rand);
    assert.equal(new Set(picks).size, picks.length, `duplicates at ${count}`);
    assert.ok(picks.every((i) => i >= 0 && i < count), `out of range at ${count}`);
    assert.ok(picks.length < count, `everyone fell asleep at ${count}`);
  }
});

test('nextTrick never repeats the previous trick', () => {
  const rand = seeded(5);
  let last = null;
  for (let i = 0; i < 200; i++) {
    const trick = nextTrick(EMILIJA.tricks, last, rand);
    assert.ok(EMILIJA.tricks.includes(trick));
    assert.notEqual(trick, last);
    last = trick;
  }
});

test('nextTrick still answers when there is only one trick left', () => {
  assert.equal(nextTrick(['spawn'], 'spawn', seeded(2)), 'spawn');
});
