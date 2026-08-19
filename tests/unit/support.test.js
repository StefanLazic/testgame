// Support cats never fire a shot, so their whole value is in this maths.
import test from 'node:test';
import assert from 'node:assert/strict';
import { auraBonus, auraMultipliers, goldIncome, bountyMultiplier } from '../../js/rules.js';
import { TOWERS, SUPPORT, towerStats } from '../../js/config.js';

const at = (kind, level, x, z) => ({ kind, level, x, z, range: towerStats(kind, level).range });

test('Ema and Sofija exist as buildable support cats', () => {
  assert.equal(TOWERS.ema.support, 'buff');
  assert.equal(TOWERS.sofija.support, 'gold');
  for (const kind of ['ema', 'sofija']) {
    assert.equal(TOWERS[kind].damage, 0, `${kind} must not deal damage`);
    assert.ok(TOWERS[kind].range > 0, `${kind} needs an aura radius`);
    assert.ok(TOWERS[kind].cost > 0);
  }
});

test('auraBonus grows with Emas collar and is clamped to the table', () => {
  const one = auraBonus('ema', 1);
  const three = auraBonus('ema', 3);
  assert.ok(three.damage > one.damage);
  assert.ok(three.rate > one.rate);
  assert.deepEqual(auraBonus('ema', 9), three, 'levels beyond the table clamp');
  assert.deepEqual(auraBonus('ema', 0), one, 'level 0 clamps up');
  assert.equal(auraBonus('archer', 1), null, 'ordinary cats have no aura');
});

test('a cat inside Emas ribbon shoots harder and faster', () => {
  const ema = at('ema', 1, 0, 0);
  const inside = auraMultipliers({ x: 1, z: 1 }, [ema]);
  assert.ok(inside.damage > 1);
  assert.ok(inside.rate > 1);
  assert.equal(inside.buffed, true);
});

test('a cat outside the ribbon is untouched', () => {
  const ema = at('ema', 1, 0, 0);
  const outside = auraMultipliers({ x: 40, z: 0 }, [ema]);
  assert.deepEqual(outside, { damage: 1, rate: 1, buffed: false });
});

test('two Emas do not stack — only the strongest ribbon counts', () => {
  const weak = at('ema', 1, 0, 0);
  const strong = at('ema', 3, 1, 0);
  const both = auraMultipliers({ x: 0.5, z: 0 }, [weak, strong]);
  const only = auraMultipliers({ x: 0.5, z: 0 }, [strong]);
  assert.deepEqual(both, only);
});

test('a support cat does not buff itself', () => {
  const ema = at('ema', 2, 0, 0);
  assert.deepEqual(auraMultipliers(ema, [ema]), { damage: 1, rate: 1, buffed: false });
});

test('Sofija pays out faster and richer with every collar', () => {
  const one = goldIncome(1);
  const three = goldIncome(3);
  assert.ok(three.coin > one.coin);
  assert.ok(three.interval < one.interval);
  assert.ok(one.interval > 0 && one.coin > 0);
  assert.deepEqual(goldIncome(12), three);
});

test('pests dying near Sofija drop extra fish', () => {
  const sofija = at('sofija', 1, 0, 0);
  assert.ok(bountyMultiplier({ x: 1, z: 0 }, [sofija]) > 1);
  assert.equal(bountyMultiplier({ x: 60, z: 0 }, [sofija]), 1);
  assert.equal(bountyMultiplier({ x: 1, z: 0 }, []), 1);
});

test('two Sofijas share the loot rather than doubling it', () => {
  const a = at('sofija', 1, 0, 0);
  const b = at('sofija', 3, 0.5, 0);
  const both = bountyMultiplier({ x: 0.5, z: 0 }, [a, b]);
  assert.equal(both, bountyMultiplier({ x: 0.5, z: 0 }, [b]));
});

test('the support tables cover every level up to MAX', () => {
  for (const table of Object.values(SUPPORT)) {
    for (const values of Object.values(table)) {
      assert.ok(Array.isArray(values) && values.length >= 3, 'need one entry per collar');
    }
  }
});
