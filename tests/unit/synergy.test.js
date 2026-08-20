// Synergies and hybrid upgrades are pure multipliers over the tower table, so
// they can be pinned down completely without a browser.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SYNERGIES, SYNERGY_RANGE, activeSynergies, synergyMultipliers,
  branchesFor, branchStats,
} from '../../js/rules.js';
import { TOWERS, BRANCHES, branchCost, towerStats, maxLevel } from '../../js/config.js';

const at = (kind, x, z, extra = {}) => ({ kind, level: 1, x, z, ...extra });

test('every synergy joins two different cats that both exist', () => {
  const seen = new Set();
  for (const syn of SYNERGIES) {
    assert.ok(TOWERS[syn.a] && TOWERS[syn.b], `${syn.id} names unknown cats`);
    assert.notEqual(syn.a, syn.b, `${syn.id} pairs a cat with itself`);
    assert.ok(!seen.has(syn.id), `duplicate synergy id ${syn.id}`);
    seen.add(syn.id);
    const bonus = (syn.damage || 0) + (syn.rate || 0) + (syn.range || 0);
    assert.ok(bonus > 0, `${syn.id} does nothing`);
  }
});

test('two partner cats standing close light each other up', () => {
  const syn = SYNERGIES[0];
  const a = at(syn.a, 0, 0);
  const b = at(syn.b, 2, 0);
  assert.deepEqual(activeSynergies(a, [a, b]).map((s) => s.id), [syn.id]);
  assert.deepEqual(activeSynergies(b, [a, b]).map((s) => s.id), [syn.id]);
});

test('partners out of reach do nothing', () => {
  const syn = SYNERGIES[0];
  const a = at(syn.a, 0, 0);
  const b = at(syn.b, SYNERGY_RANGE + 2, 0);
  assert.deepEqual(activeSynergies(a, [a, b]), []);
  assert.deepEqual(synergyMultipliers(a, [a, b]), { damage: 1, rate: 1, range: 1, ids: [] });
});

test('a cat on its own has no synergy', () => {
  const a = at(SYNERGIES[0].a, 0, 0);
  assert.deepEqual(activeSynergies(a, [a]), []);
});

test('the same pairing only counts once, different pairings add up', () => {
  const syn = SYNERGIES[0];
  const a = at(syn.a, 0, 0);
  const b1 = at(syn.b, 1, 0);
  const b2 = at(syn.b, 1, 1);
  assert.equal(activeSynergies(a, [a, b1, b2]).length, 1, 'twin partners are still one synergy');

  const other = SYNERGIES.find((s) => s.id !== syn.id && (s.a === syn.a || s.b === syn.a));
  if (other) {
    const partner = at(other.a === syn.a ? other.b : other.a, 0, 1);
    const ids = activeSynergies(a, [a, b1, partner]).map((s) => s.id);
    assert.equal(new Set(ids).size, ids.length);
    assert.ok(ids.length >= 2, 'two different pairings should both fire');
  }
});

test('synergy multipliers are never below 1', () => {
  const syn = SYNERGIES[0];
  const a = at(syn.a, 0, 0);
  const b = at(syn.b, 1, 0);
  const m = synergyMultipliers(a, [a, b]);
  assert.ok(m.damage >= 1 && m.rate >= 1 && m.range >= 1);
  assert.ok(m.damage > 1 || m.rate > 1 || m.range > 1);
  assert.deepEqual(m.ids, [syn.id]);
});

test('branches only unlock at the top collar and cost real fish', () => {
  for (const [kind, branches] of Object.entries(BRANCHES)) {
    assert.equal(Object.keys(branches).length, 2, `${kind} needs exactly two paths`);
    assert.ok(branchCost(kind) > 0);
    assert.deepEqual(branchesFor(kind, maxLevel(kind) - 1), [], 'no branches before the last collar');
    const offered = branchesFor(kind, maxLevel(kind));
    assert.equal(offered.length, 2);
    for (const b of offered) {
      assert.ok(b.id && b.icon, `${kind} branch needs an id and icon`);
      assert.equal(b.cost, branchCost(kind));
    }
  }
});

test('the two paths of a cat really pull in different directions', () => {
  for (const kind of Object.keys(BRANCHES)) {
    const top = maxLevel(kind);
    const plain = towerStats(kind, top);
    const [a, b] = branchesFor(kind, top);
    const sa = towerStats(kind, top, a.id);
    const sb = towerStats(kind, top, b.id);
    assert.notDeepEqual(sa, sb, `${kind} branches are identical`);
    for (const st of [sa, sb]) {
      // Mimi-chan works on the whole board, so she is the one cat with no
      // range at all — her paths sell safety instead of reach.
      const reach = TOWERS[kind].global ? st.range >= 0 : st.range > 0;
      assert.ok(st.damage >= 0 && reach, `${kind} branch has broken stats`);
    }
    // Each path must actually change something — either the combat stats or,
    // for the support cats, their aura/purse numbers.
    for (const branch of [a, b]) {
      const keys = Object.keys(branch.mods).filter((k) => k !== 'icon');
      assert.ok(keys.length > 0, `${kind}/${branch.id} does nothing`);
    }
    assert.ok(plain.damage >= 0);
  }
});

test('an unknown branch is ignored rather than breaking a cat', () => {
  const plain = towerStats('archer', 3);
  const bogus = towerStats('archer', 3, 'nope');
  assert.equal(bogus.damage, plain.damage);
  assert.equal(bogus.range, plain.range);
});

test('branchStats describes what a path does before you buy it', () => {
  const info = branchStats('archer', Object.keys(BRANCHES.archer)[0]);
  assert.equal(typeof info.damage, 'number');
  assert.equal(typeof info.range, 'number');
  assert.equal(typeof info.rate, 'number');
});
