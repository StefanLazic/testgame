// The anti-air budget. Only Archer, Wizard, Frost — and a Shadow Ninja or a
// Sensei Simba-kun — can touch a flying pest, so a wave with no air at all
// makes that investment idle, and a wave that is nearly all air is a wall for
// anyone who skipped it. Both used to happen: fourteen waves had zero flyers
// while wave 27 was 60% air.
import test from 'node:test';
import assert from 'node:assert/strict';
import { WAVES, ENEMIES, hpScale } from '../../js/config.js';

// Flying share of a wave's health, ignoring bosses — a flying boss is a whole
// fight on its own, not a chunk of the anti-air budget.
function airShare(wave) {
  const scale = hpScale(wave);
  let ground = 0;
  let air = 0;
  for (const [kind, count] of WAVES[wave - 1].groups) {
    const def = ENEMIES[kind];
    if (def.boss) continue;
    const hp = def.hp * scale * count;
    if (def.flying) air += hp; else ground += hp;
  }
  return air + ground > 0 ? air / (air + ground) : 0;
}

test('waves 1-3 are ground only, so the first birds land as a surprise', () => {
  for (const wave of [1, 2, 3]) assert.equal(airShare(wave), 0);
});

test('every wave from 4 on asks for anti-air, and none is only anti-air', () => {
  for (let wave = 4; wave <= WAVES.length; wave++) {
    const share = airShare(wave);
    assert.ok(share >= 0.15, `wave ${wave} is only ${(share * 100).toFixed(0)}% air — anti-air cats idle`);
    assert.ok(share <= 0.40, `wave ${wave} is ${(share * 100).toFixed(0)}% air — a wall without anti-air`);
  }
});

test('every wave spawns pests that actually exist', () => {
  for (const [i, wave] of WAVES.entries()) {
    for (const [kind, count, gap, delay, lane = 0] of wave.groups) {
      assert.ok(ENEMIES[kind], `wave ${i + 1} spawns unknown pest ${kind}`);
      assert.ok(count > 0 && gap > 0 && delay >= 0, `wave ${i + 1} has a broken ${kind} group`);
      assert.ok(lane === 0 || lane === 1, `wave ${i + 1} uses lane ${lane}`);
    }
  }
});
