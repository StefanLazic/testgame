// Balance-data invariants. These run in plain node because js/config.js is
// pure data with no three.js import.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TOWERS, TOWER_ORDER, ENEMIES, WAVES, MAX_LEVEL, maxLevel, upgradeCost, towerStats,
  hpScale, waveBonus, CURSES,
} from '../../js/config.js';

test('every tower in TOWER_ORDER exists and vice versa', () => {
  assert.deepEqual([...TOWER_ORDER].sort(), Object.keys(TOWERS).sort());
});

test('towers have the fields the engine and shop need', () => {
  for (const kind of TOWER_ORDER) {
    const tw = TOWERS[kind];
    assert.ok(tw.icon, `${kind} needs an icon`);
    assert.ok(Number.isFinite(tw.cost) && tw.cost > 0, `${kind} needs a positive cost`);
    assert.ok(Number.isFinite(tw.range), `${kind} needs a range`);
    assert.ok(tw.ability || tw.damage > 0, `${kind} must either shoot or have an ability`);
  }
});

test('the queen is priced at ten times the priciest ordinary cat', () => {
  const others = TOWER_ORDER.filter((k) => k !== 'queen').map((k) => TOWERS[k].cost);
  assert.equal(TOWERS.queen.cost, 10 * Math.max(...others));
});

test('upgrade costs rise with level and levels cap at maxLevel', () => {
  for (const kind of TOWER_ORDER) {
    for (let lvl = 1; lvl < maxLevel(kind); lvl++) {
      assert.ok(upgradeCost(kind, lvl + 1) > upgradeCost(kind, lvl), `${kind} lvl ${lvl}`);
    }
    assert.ok(maxLevel(kind) <= MAX_LEVEL);
  }
});

test('towerStats improves damage, range and rate with every level', () => {
  for (const kind of TOWER_ORDER) {
    if (!TOWERS[kind].damage) continue;
    const a = towerStats(kind, 1);
    const b = towerStats(kind, maxLevel(kind));
    assert.ok(b.damage >= a.damage);
    assert.ok(b.range >= a.range);
    assert.ok(b.rate >= a.rate);
  }
});

test('the witch has a curse for every level she can reach', () => {
  for (let lvl = 1; lvl <= maxLevel('witch'); lvl++) assert.ok(CURSES[lvl], `curse ${lvl}`);
});

test('enemies are well formed', () => {
  for (const [kind, def] of Object.entries(ENEMIES)) {
    assert.ok(def.hp > 0, `${kind} hp`);
    assert.ok(def.speed > 0, `${kind} speed`);
    assert.ok(def.bounty >= 0, `${kind} bounty`);
    assert.ok(def.scale > 0, `${kind} scale`);
    assert.ok(Number.isFinite(def.leak), `${kind} leak`);
    if (def.base) assert.ok(ENEMIES[def.base], `${kind} base ${def.base} must exist`);
  }
});

test('every wave references real enemies and sane timings', () => {
  assert.ok(WAVES.length >= 20);
  WAVES.forEach((wave, i) => {
    assert.ok(wave.name, `wave ${i + 1} name`);
    assert.ok(wave.groups.length, `wave ${i + 1} groups`);
    for (const [kind, count, gap, delay, lane = 0] of wave.groups) {
      assert.ok(ENEMIES[kind], `wave ${i + 1} spawns unknown enemy ${kind}`);
      assert.ok(count > 0 && gap > 0 && delay >= 0, `wave ${i + 1} timings`);
      assert.ok(lane === 0 || lane === 1, `wave ${i + 1} lane`);
    }
  });
});

test('waves 5, 10, 15 and 20 are boss waves', () => {
  for (const n of [5, 10, 15, 20]) {
    const kinds = WAVES[n - 1].groups.map(([k]) => k);
    assert.ok(kinds.some((k) => ENEMIES[k].boss), `wave ${n} needs a boss`);
  }
});

test('difficulty ramps never go backwards', () => {
  for (let w = 2; w <= WAVES.length; w++) {
    assert.ok(hpScale(w) >= hpScale(w - 1), `hpScale wave ${w}`);
    assert.ok(waveBonus(w) > waveBonus(w - 1), `waveBonus wave ${w}`);
  }
  assert.equal(hpScale(1), 1);
});
