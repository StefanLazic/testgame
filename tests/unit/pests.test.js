// The wave-11+ pests exist to punish one-note defences, so their rules get
// pinned down here: healing, shields and burrowing.
import test from 'node:test';
import assert from 'node:assert/strict';
import { healTargets, shieldAbsorb, shieldRegen, burrowedAt } from '../../js/rules.js';
import { ENEMIES, WAVES } from '../../js/config.js';

test('the three counterplay pests exist and are honest about it', () => {
  assert.ok(ENEMIES.nurse.heals, 'nurse must heal');
  assert.ok(ENEMIES.beetle.shield > 0, 'beetle must have a shield');
  assert.ok(ENEMIES.mole.burrow, 'mole must burrow');
  for (const kind of ['nurse', 'beetle', 'mole']) {
    const def = ENEMIES[kind];
    assert.ok(def.hp > 0 && def.speed > 0 && def.bounty > 0, `${kind} stats`);
    assert.ok(def.leak >= 1, `${kind} must cost a life`);
  }
});

test('waves 1-10 are untouched — only wave 11+ sees the new pests', () => {
  const newcomers = new Set(['nurse', 'beetle', 'mole']);
  for (let i = 0; i < 10; i++) {
    for (const [kind] of WAVES[i].groups) {
      assert.ok(!newcomers.has(kind), `wave ${i + 1} must not contain ${kind}`);
    }
  }
  const later = WAVES.slice(10).flatMap((w) => w.groups.map(([kind]) => kind));
  for (const kind of newcomers) {
    assert.ok(later.includes(kind), `${kind} never actually shows up`);
  }
});

// ------------------------------------------------------------------ healing
const pest = (hp, maxHp, x = 0, z = 0) => ({ hp, maxHp, x, z, alive: true });

test('a healer only tops up damaged friends in reach', () => {
  const healer = { x: 0, z: 0, alive: true };
  const hurtNear = pest(10, 100, 1, 0);
  const fullNear = pest(100, 100, 1, 1);
  const hurtFar = pest(10, 100, 50, 0);
  const targets = healTargets(healer, [healer, hurtNear, fullNear, hurtFar], 5);
  assert.deepEqual(targets, [hurtNear]);
});

test('a healer never heals itself or the dead', () => {
  const healer = { x: 0, z: 0, alive: true, hp: 10, maxHp: 100 };
  const dead = { ...pest(10, 100, 1, 0), alive: false };
  assert.deepEqual(healTargets(healer, [healer, dead], 5), []);
});

// ------------------------------------------------------------------ shields
test('a shield eats damage before health does', () => {
  const after = shieldAbsorb({ hp: 100, shield: 40 }, 25);
  assert.deepEqual(after, { hp: 100, shield: 15, absorbed: 25, broke: false });
});

test('overkill spills through a breaking shield', () => {
  const after = shieldAbsorb({ hp: 100, shield: 40 }, 60);
  assert.equal(after.shield, 0);
  assert.equal(after.hp, 80);
  assert.equal(after.broke, true);
});

test('with no shield left the damage lands as normal', () => {
  const after = shieldAbsorb({ hp: 100, shield: 0 }, 30);
  assert.deepEqual(after, { hp: 70, shield: 0, absorbed: 0, broke: false });
});

test('a shield grows back only after a quiet spell, never past full', () => {
  const def = { shield: 100, shieldRegen: 2, shieldDelay: 3 };
  assert.equal(shieldRegen({ shield: 0, sinceHit: 1 }, def, 1), 0, 'still under fire');
  const growing = shieldRegen({ shield: 0, sinceHit: 4 }, def, 1);
  assert.ok(growing > 0 && growing < def.shield);
  assert.equal(shieldRegen({ shield: 99, sinceHit: 9 }, def, 100), def.shield, 'caps at full');
});

// ---------------------------------------------------------------- burrowing
test('a burrower alternates between above and below ground', () => {
  const def = { interval: 4, duration: 2 };
  assert.equal(burrowedAt(0, def), false);
  assert.equal(burrowedAt(3.9, def), false);
  assert.equal(burrowedAt(4.1, def), true);
  assert.equal(burrowedAt(5.9, def), true);
  assert.equal(burrowedAt(6.1, def), false, 'it must come back up');
  assert.equal(burrowedAt(10.1, def), true, 'and the cycle repeats');
});

test('a pest with no burrow definition is always targetable', () => {
  assert.equal(burrowedAt(99, null), false);
});
