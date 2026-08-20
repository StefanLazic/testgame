// Mimi-chan is the most expensive cat in the kitchen, so losing her to a boss
// felt terrible. She now earns collars like everybody else, and her two paths
// both buy the one thing a fortune should buy: safety.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TOWERS, QUEEN, BRANCHES, MAX_LEVEL, maxLevel, towerStats, upgradeCost, branchCost,
} from '../../js/config.js';
import {
  branchesFor, branchStats, immuneToDestroy, immuneToDisable,
  destructible, destroyTargets, wardFor,
} from '../../js/rules.js';

const at = (kind, x, z, extra = {}) => ({ kind, level: maxLevel(kind), branch: null, x, z, ...extra });

test('Mimi-chan earns collars like every other cat', () => {
  assert.equal(maxLevel('queen'), MAX_LEVEL);
  assert.equal(QUEEN.stun.length, MAX_LEVEL);
  assert.equal(QUEEN.cooldown.length, MAX_LEVEL);
  const one = towerStats('queen', 1);
  const three = towerStats('queen', 3);
  assert.ok(three.stun > one.stun, 'the bow gets deeper');
  assert.ok(three.cooldown < one.cooldown, 'and comes round sooner');
});

test('her collars and her path cost a royal premium', () => {
  assert.ok(TOWERS.queen.premium > 1);
  const plain = Math.round(TOWERS.queen.cost * (0.75 + 0.45 * 1));
  assert.ok(upgradeCost('queen', 1) > plain, 'a queen collar costs more than the usual formula');
  assert.ok(branchCost('queen') > Math.round(TOWERS.queen.cost * 1.9));
  // Ordinary cats are untouched by the premium.
  assert.equal(upgradeCost('archer', 1), Math.round(TOWERS.archer.cost * 1.2));
  assert.equal(branchCost('archer'), Math.round(TOWERS.archer.cost * 1.9));
});

test('both royal paths make her untouchable, and only at the top collar', () => {
  assert.deepEqual(Object.keys(BRANCHES.queen).sort(), ['empress', 'regent']);
  assert.deepEqual(branchesFor('queen', 2), [], 'no path before the last collar');
  assert.equal(branchesFor('queen', 3).length, 2);
  for (const id of ['regent', 'empress']) {
    assert.ok(towerStats('queen', 3, id).immuneDestroy, `${id} must be safe from destruction`);
    assert.ok(branchStats('queen', id).immuneDestroy, 'the path card says so');
  }
});

test('a plain queen is not immune to anything — only a path buys that', () => {
  for (let lvl = 1; lvl <= MAX_LEVEL; lvl++) {
    const st = towerStats('queen', lvl);
    assert.ok(!st.immuneDestroy, `level ${lvl} is still destructible`);
    assert.ok(!st.immuneDisable, `level ${lvl} can still be napped`);
    assert.ok(!st.ward, `level ${lvl} wards nobody`);
  }
  assert.equal(immuneToDestroy({ kind: 'queen', level: 3, branch: null }), false);
});

test('Regent guards the court, Empress guards only herself', () => {
  const regent = towerStats('queen', 3, 'regent');
  const empress = towerStats('queen', 3, 'empress');
  assert.ok(regent.ward, 'the Regent hands out a ward');
  assert.ok(!regent.immuneDisable, 'the Regent can still be napped');
  assert.ok(!empress.ward, 'the Empress wards nobody but herself');
  assert.ok(empress.immuneDisable, 'nothing naps or shuffles an Empress');
  assert.ok(empress.stun > regent.stun && empress.cooldown < regent.cooldown,
    'the Empress keeps the better bow');
  assert.equal(immuneToDisable({ kind: 'queen', level: 3, branch: 'empress' }), true);
  assert.equal(immuneToDisable({ kind: 'queen', level: 3, branch: 'regent' }), false);
});

test('nothing on the board may pick a specialised queen', () => {
  const towers = [at('archer', 0, 0), at('queen', 1, 0, { branch: 'empress' }), at('ninja', 2, 0)];
  assert.deepEqual(destructible(towers).map((tw) => tw.kind), ['archer', 'ninja']);
  // Father flattening *everything* still leaves Her Majesty standing.
  const doomed = destroyTargets(towers, 1);
  assert.equal(doomed.length, 2);
  assert.ok(!doomed.some((tw) => tw.kind === 'queen'));
});

test('an unspecialised queen is still fair game', () => {
  const towers = [at('queen', 0, 0), at('archer', 8, 8)];
  assert.deepEqual(destructible(towers).map((tw) => tw.kind), ['queen', 'archer']);
});

test('the royal ward covers every cat in its radius, once per recharge', () => {
  const queen = at('queen', 0, 0, { branch: 'regent', wardT: 0 });
  const near = at('archer', QUEEN.ward.radius - 0.5, 0);
  const alsoNear = at('ninja', 0, QUEEN.ward.radius - 1);
  const far = at('wizard', QUEEN.ward.radius + 2, 0);
  const towers = [queen, near, alsoNear, far];
  assert.equal(wardFor(near, towers), queen);
  assert.equal(wardFor(alsoNear, towers), queen, 'every cat in reach is covered');
  assert.equal(wardFor(far, towers), null);
  // Spent wards protect nobody until they charge back up.
  queen.wardT = QUEEN.ward.recharge;
  assert.equal(wardFor(near, towers), null);
  queen.wardT = 0;
  assert.equal(wardFor(near, towers), queen);
});

test('an Empress hands out no wards at all', () => {
  const queen = at('queen', 0, 0, { branch: 'empress' });
  const friend = at('archer', 1, 0);
  assert.equal(wardFor(friend, [queen, friend]), null);
  assert.ok(QUEEN.ward.radius > 0 && QUEEN.ward.recharge > 0);
});
