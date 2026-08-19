// Regressions for two hybrid-path bugs that silently broke balance:
//
//  * Hailstorm advertised splash, but a multiplier on Frost's non-existent
//    splash is still zero, so the shards never actually shattered over a group.
//  * Dreamer granted a slow with no duration, and the engine only ever clears
//    a slow when its timer runs out — so Dreamer chilled pests forever.
import test from 'node:test';
import assert from 'node:assert/strict';
import { towerStats, BRANCHES, TOWERS } from '../../js/config.js';
import { slowFrom } from '../../js/rules.js';

test('Hailstorm really does splash — a path can grant a stat from nothing', () => {
  const base = towerStats('frost', 3);
  assert.equal(base.splash, 0, 'plain Frost is single target');
  const hail = towerStats('frost', 3, 'hail');
  assert.ok(hail.splash >= 2, `Hailstorm should splash, got ${hail.splash}`);
});

test('Glacier still multiplies the chill Frost already has', () => {
  const base = towerStats('frost', 3);
  const glacier = towerStats('frost', 3, 'glacier');
  assert.ok(glacier.slow > base.slow, 'Glacier deepens the chill');
  assert.ok(glacier.slowTime > base.slowTime, 'Glacier lengthens the chill');
  assert.ok(glacier.slow <= 0.8, 'no chill ever goes past 80%');
});

test('Dreamer grants a slow that actually wears off', () => {
  const base = towerStats('sleepy', 3);
  assert.equal(base.slow || 0, 0, 'plain Sleepy never slows');
  const dreamer = towerStats('sleepy', 3, 'dreamer');
  assert.ok(dreamer.slow > 0, 'Dreamer slows');
  assert.ok(dreamer.slowTime > 0, `a Dreamer chill must expire, got ${dreamer.slowTime}`);
  assert.ok(slowFrom(dreamer), 'the engine accepts the chill');
});

test('a slow with no duration is not a slow', () => {
  assert.equal(slowFrom({ slow: 0.45, slowTime: 0 }), null);
  assert.equal(slowFrom({ slow: 0, slowTime: 3 }), null);
  assert.equal(slowFrom({}), null);
  assert.deepEqual(slowFrom({ slow: 0.9, slowTime: 2 }), { factor: 0.8, time: 2 });
});

test('no path advertises a stat the cat cannot receive', () => {
  for (const [kind, paths] of Object.entries(BRANCHES)) {
    for (const [id, mods] of Object.entries(paths)) {
      const before = towerStats(kind, 3);
      const after = towerStats(kind, 3, id);
      for (const key of ['damage', 'range', 'rate', 'splash', 'slowTime', 'crit', 'cooldown']) {
        if (mods[key] == null) continue;
        assert.ok(before[key], `${kind}/${id} scales ${key}, which ${kind} does not have — use grants`);
        assert.ok(after[key] > 0, `${kind}/${id} zeroed ${key}`);
      }
      for (const key of Object.keys(mods.grants || {})) {
        assert.ok(after[key] > 0, `${kind}/${id} should grant ${key}`);
      }
      if (after.slow) assert.ok(after.slowTime > 0, `${kind}/${id} slows forever`);
    }
  }
});

test('Shadow ninjas learn to hit the sky, assassins do not', () => {
  assert.equal(TOWERS.ninja.air, false, 'plain Ninja is ground only');
  assert.equal(towerStats('ninja', 3, 'shadow').air, true);
  assert.equal(towerStats('ninja', 3, 'assassin').air, false);
});

test('a Sniper shoots straight through armour, a Ranger does not', () => {
  assert.equal(towerStats('archer', 3).pierce, 0, 'a plain archer respects armour');
  assert.equal(towerStats('archer', 3, 'sniper').pierce, 1, 'a sniper aims for the gaps');
  assert.equal(towerStats('archer', 3, 'ranger').pierce, 0);
});

test('pierce never leaves the 0-1 band', () => {
  for (const [kind, paths] of Object.entries(BRANCHES)) {
    for (const id of Object.keys(paths)) {
      const p = towerStats(kind, 3, id).pierce;
      assert.ok(p >= 0 && p <= 1, `${kind}/${id} pierces ${p}`);
    }
  }
});
