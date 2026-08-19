// The gymnast, her brother and their father — waves 40 and 50. Every rule they
// fight by is a pure function in js/rules.js, so it can be checked here without
// a browser.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  towerLimit, canPlaceTower, cloneStats, guardedDamage, starLeap,
  destroyPicks, reviveFraction, nextTeleportSpot,
} from '../../js/rules.js';
import { TOWERS, ENEMIES, WAVES, SIMONA, STEFO, FATHER } from '../../js/config.js';

// A tiny deterministic PRNG so the random picks can be asserted.
const seeded = (seed) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};

// ------------------------------------------------------------ tower limits
test('only one Mimi-chan is allowed on the table', () => {
  assert.equal(TOWERS.queen.limit, 1);
  assert.equal(towerLimit('queen'), 1);
  assert.equal(canPlaceTower('queen', []), true);
  assert.equal(canPlaceTower('queen', [{ kind: 'queen' }]), false);
  assert.equal(canPlaceTower('queen', [{ kind: 'archer' }]), true);
});

test('ordinary cats have no limit at all', () => {
  for (const kind of Object.keys(TOWERS)) {
    if (kind === 'queen') continue;
    assert.equal(towerLimit(kind), Infinity, `${kind} should be unlimited`);
    const many = Array.from({ length: 20 }, () => ({ kind }));
    assert.equal(canPlaceTower(kind, many), true, `${kind} should still be placeable`);
  }
});

// ------------------------------------------------------------------ Simona
test('Simona is the wave 40 boss and her clone is a copy of her', () => {
  const finals = WAVES[39].groups.map(([k]) => k).filter((k) => ENEMIES[k].boss === 'main');
  assert.deepEqual(finals, ['simona']);
  assert.equal(ENEMIES.simona.gymnast, true);
  const clone = ENEMIES[SIMONA.clone];
  assert.ok(clone, 'the clone kind must exist');
  assert.equal(clone.base, 'simona');
  assert.equal(clone.gymnast, true);
  assert.ok(!clone.boss, 'clones are not bosses of their own');
  assert.ok(SIMONA.cloneEvery > 0 && SIMONA.maxClones > 0);
  assert.ok(SIMONA.starTiles > 0 && SIMONA.starEvery > 0);
  assert.ok(SIMONA.handstandTime > 0 && SIMONA.handstandResist === 0.9);
});

test('a clone starts with exactly the same share of health as the original', () => {
  const orig = { hp: 900, maxHp: 1000 };
  const clone = cloneStats(orig, 0.6);
  assert.equal(clone.maxHp, 600);
  assert.equal(clone.hp, 540);                 // 90% of health, like the original
  assert.equal(clone.hp / clone.maxHp, orig.hp / orig.maxHp);
  // A full-health original makes a full-health clone.
  const fresh = cloneStats({ hp: 500, maxHp: 500 }, 1);
  assert.deepEqual(fresh, { hp: 500, maxHp: 500 });
});

test('standing on her hands soaks 90% of the damage', () => {
  assert.ok(Math.abs(guardedDamage(100, 0.9) - 10) < 1e-9);
  assert.equal(guardedDamage(100, 0), 100);
  assert.equal(guardedDamage(0, 0.9), 0);
});

test('the star jump throws her forward but never past the milk', () => {
  assert.equal(starLeap(10, 6, 100), 16);
  assert.equal(starLeap(96, 6, 100), 100);
  assert.equal(starLeap(0, 0, 100), 0);
});

// ------------------------------------------------------------------- Stefo
test('Stefo appears after Simona, stands still and shoots at the milk', () => {
  const stefo = ENEMIES.stefo;
  assert.ok(stefo, 'Stefo must exist');
  assert.equal(stefo.boss, 'main');
  assert.equal(stefo.baller, true);
  assert.equal(stefo.stationary, true);
  assert.equal(ENEMIES.simona.successor, 'stefo');
  assert.ok(STEFO.teleportEvery > 0 && STEFO.shootEvery > 0);
  assert.ok(STEFO.livesPerBasket >= 1);
});

test('Stefo never teleports onto the spot he is already standing on', () => {
  const spots = ['0,0', '1,1', '2,2', '3,3'];
  const rand = seeded(7);
  for (let i = 0; i < 20; i++) {
    assert.notEqual(nextTeleportSpot(spots, '2,2', rand), '2,2');
  }
  // With nowhere else to go he stays put instead of crashing.
  assert.equal(nextTeleportSpot(['2,2'], '2,2', rand), '2,2');
  assert.equal(nextTeleportSpot([], '2,2', rand), null);
});

// ------------------------------------------------------------------ Father
test('Father closes the game on wave 50 and eats half your army on arrival', () => {
  assert.equal(WAVES.length, 50);
  const finals = WAVES[49].groups.map(([k]) => k).filter((k) => ENEMIES[k].boss === 'main');
  assert.deepEqual(finals, ['father']);
  assert.equal(ENEMIES.father.father, true);
  assert.equal(FATHER.destroyOnArrival, 0.5);
  assert.equal(reviveFraction(FATHER.destroyOnArrival), 0.75); // 50% more towers
  assert.equal(FATHER.revives, 1);
});

test('destroyPicks takes the right share of the army, without repeats', () => {
  const rand = seeded(3);
  const picks = destroyPicks(8, 0.5, rand);
  assert.equal(picks.length, 4);
  assert.equal(new Set(picks).size, 4);
  for (const i of picks) assert.ok(i >= 0 && i < 8);
  // Rounds up, never more than there are cats, and copes with an empty board.
  assert.equal(destroyPicks(5, 0.5, rand).length, 3);
  assert.equal(destroyPicks(3, 0.75, rand).length, 3);
  assert.deepEqual(destroyPicks(0, 0.5, rand), []);
});
