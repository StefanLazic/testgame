// Simba-kun, the samurai cat: a cleaving katana plus a periodic spinning
// strike. His numbers live in js/config.js, so they can be checked here.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TOWERS, TOWER_ORDER, BRANCHES, SYNERGIES, towerStats, maxLevel,
} from '../../js/config.js';
import { previewStats, branchesFor } from '../../js/rules.js';

test('Simba-kun is in the shop, between the support cats and the queen', () => {
  assert.ok(TOWERS.simba, 'Simba-kun must exist');
  assert.ok(TOWER_ORDER.includes('simba'));
  assert.ok(TOWER_ORDER.indexOf('simba') < TOWER_ORDER.indexOf('queen'));
  assert.equal(TOWERS.simba.icon, '🗡️');
  assert.ok(TOWERS.simba.cost > 0);
  assert.equal(TOWERS.simba.air, false, 'a katana does not reach the sky');
});

test('his katana cleaves and his spinning strike is set up', () => {
  const st = towerStats('simba', 1);
  assert.ok(st.damage > 0 && st.splash > 0, 'the katana cleaves');
  assert.ok(st.crit > 0, 'a samurai lands a decisive blow now and then');
  const b = TOWERS.simba.bushido;
  assert.ok(b, 'Simba-kun needs his bushido strike');
  assert.ok(b.cooldown > 0 && b.damage > 1 && b.stun > 0);
});

test('bushido scales with the collar and with his chosen path', () => {
  const one = towerStats('simba', 1).bushido;
  const three = towerStats('simba', maxLevel('simba')).bushido;
  assert.ok(three.damage >= one.damage);
  const sensei = towerStats('simba', maxLevel('simba'), 'sensei').bushido;
  assert.ok(sensei.cooldown < three.cooldown, 'the sensei strikes more often');
  const ronin = towerStats('simba', maxLevel('simba'), 'ronin');
  assert.ok(ronin.damage > towerStats('simba', maxLevel('simba')).damage);
});

test('he has two hybrid paths and shows up in the shop preview', () => {
  assert.ok(BRANCHES.simba.ronin && BRANCHES.simba.sensei);
  assert.equal(branchesFor('simba', maxLevel('simba')).length, 2);
  const p = previewStats('simba');
  assert.equal(p.kind, 'simba');
  assert.equal(p.air, false);
  assert.ok(p.damage > 0);
});

test('he has squadmates to stand next to', () => {
  const pairs = SYNERGIES.filter((s) => s.a === 'simba' || s.b === 'simba');
  assert.ok(pairs.length >= 2, 'Simba-kun needs at least two synergies');
  for (const syn of pairs) {
    const other = syn.a === 'simba' ? syn.b : syn.a;
    assert.ok(TOWERS[other], `${other} must be a real cat`);
  }
});
