// The witch used to be 300 fish of nothing: one target, once a minute, and
// completely idle on the boss waves she was bought for. She is now a control
// cat with an always-on hex field and a curse that catches a whole knot, so
// the maths behind both is pinned down here.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TOWERS, BRANCHES, SUPPORT, HEX, towerStats, maxLevel,
} from '../../js/config.js';
import { hexBonus, hexMultiplier, branchStats } from '../../js/rules.js';

const witch = (level, branch = null, x = 0, z = 0) => ({
  kind: 'witch', level, branch, x, z,
  range: towerStats('witch', level, branch).range,
});

test('the hex field grows with every collar', () => {
  assert.ok(hexBonus(1) > 0, 'even a fresh witch weakens what she watches');
  assert.ok(hexBonus(2) > hexBonus(1));
  assert.ok(hexBonus(3) > hexBonus(2));
  assert.equal(SUPPORT.witch.hex.length, maxLevel('witch'), 'one entry per collar');
});

test('a pest inside the field takes more damage, one outside takes none extra', () => {
  const w = [witch(3)];
  assert.ok(hexMultiplier({ x: 1, z: 1 }, w) > 1, 'in reach');
  assert.equal(hexMultiplier({ x: 99, z: 99 }, w), 1, 'out of reach');
  assert.equal(hexMultiplier({ x: 0, z: 0 }, []), 1, 'no witch, no hex');
});

test('hex fields do not stack — only the strongest witch counts', () => {
  const one = hexMultiplier({ x: 1, z: 0 }, [witch(3)]);
  const two = hexMultiplier({ x: 1, z: 0 }, [witch(3), witch(3, null, 1, 1)]);
  assert.equal(two, one, 'a wall of witches is never the answer');
  const mixed = hexMultiplier({ x: 1, z: 0 }, [witch(1), witch(3, null, 0.5, 0.5)]);
  assert.equal(mixed, one, 'the strongest field wins');
});

test('she curses far more often than she used to, and over an area', () => {
  assert.ok(TOWERS.witch.cooldown <= 40, 'a minute was longer than most waves');
  const st = towerStats('witch', maxLevel('witch'));
  assert.ok(st.curseRadius > 0, 'a curse catches a knot, not a single pest');
  assert.ok(st.curseRadius < st.range, 'but never as far as she can see');
});

test('the curse radius and the field both grow with her collar', () => {
  assert.ok(towerStats('witch', 3).curseRadius > towerStats('witch', 1).curseRadius);
  assert.ok(hexBonus(3) > hexBonus(1));
});

test('Hexer is the crowd path, Doomsayer is the boss path', () => {
  const top = maxLevel('witch');
  const hex = towerStats('witch', top, 'hex');
  const doom = towerStats('witch', top, 'doom');
  assert.ok(hex.cooldown < doom.cooldown, 'the hexer casts more often');
  assert.ok(hex.curseRadius > doom.curseRadius, 'and over a wider knot');
  assert.ok(doom.range > hex.range, 'the doomsayer sees further');
  assert.ok(hexBonus(top, 'doom') > hexBonus(top, 'hex'), 'and hexes harder');
});

test('both paths only ever scale stats she actually has', () => {
  for (const [id, mods] of Object.entries(BRANCHES.witch)) {
    const before = towerStats('witch', maxLevel('witch'));
    for (const key of ['cooldown', 'range', 'curseRadius']) {
      if (mods[key] == null) continue;
      assert.ok(before[key] > 0, `witch/${id} scales ${key}, which she does not have`);
    }
    if (mods.hex != null) assert.ok(SUPPORT.witch.hex[0] > 0, `witch/${id} scales a field she has`);
  }
});

test('a branded boss is worse off than an unbranded one', () => {
  assert.ok(HEX.markTime > 0, 'the brand has to wear off');
  assert.ok(HEX.markBonus > 0, 'and it has to be worth casting');
  assert.ok(HEX.markSlow > 0 && HEX.markSlow < 1, 'a slow, not a stop');
});

test('the path cards can show what changes', () => {
  const hex = branchStats('witch', 'hex');
  const doom = branchStats('witch', 'doom');
  assert.ok(doom.range > hex.range);
  assert.equal(branchStats('archer', 'sniper').pierce, 1, 'the sniper card advertises true damage');
  assert.equal(branchStats('archer', 'ranger').pierce, 0);
});
