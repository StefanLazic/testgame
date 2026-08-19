// The gold economy and the life counter. Both used to run away from the player
// in opposite directions — gold inflated past every possible sink while lives
// could only ever go down — so the rules below are pinned here.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ENEMIES, WAVES, START_LIVES, START_GOLD, BOUNTY_WAVE, BONUS_CAP_WAVE,
  BOSS_LIFE_REWARD, bountyScale, waveBonus,
} from '../../js/config.js';
import { bountyFor, livesAfterKill } from '../../js/rules.js';

test('the bounty ramp is gentle enough that late waves do not print money', () => {
  assert.equal(BOUNTY_WAVE, 0.012);
  assert.equal(bountyScale(1), 1 + 0.012);
  assert.equal(bountyScale(50), 1 + 0.012 * 50);
  for (let w = 2; w <= WAVES.length; w++) {
    assert.ok(bountyScale(w) > bountyScale(w - 1), `bountyScale wave ${w}`);
  }
  // The old ramp handed out 2x base by wave 50; the new one stops well short.
  assert.ok(bountyScale(WAVES.length) < 1.7);
});

test('bountyFor pays the pest bounty through the wave ramp and the purse', () => {
  const mouse = ENEMIES.mouse.bounty;
  assert.equal(bountyFor(ENEMIES.mouse, 1), Math.round(mouse * bountyScale(1)));
  assert.equal(bountyFor(ENEMIES.mouse, 20, 2), Math.round(mouse * bountyScale(20) * 2));
  assert.equal(bountyFor(ENEMIES.mouse, 20, 1), bountyFor(ENEMIES.mouse, 20));
  assert.ok(bountyFor(ENEMIES.ratking, 10) > bountyFor(ENEMIES.mouse, 10));
});

test('the wave-clear bonus stops growing once the board is saturated', () => {
  assert.equal(BONUS_CAP_WAVE, 25);
  for (let w = 2; w <= BONUS_CAP_WAVE; w++) {
    assert.ok(waveBonus(w) > waveBonus(w - 1), `waveBonus should rise at wave ${w}`);
  }
  for (let w = BONUS_CAP_WAVE + 1; w <= WAVES.length; w++) {
    assert.equal(waveBonus(w), waveBonus(BONUS_CAP_WAVE), `waveBonus flat at wave ${w}`);
  }
  assert.ok(waveBonus(1) > 0);
});

test('the whole run earns far less than it used to', () => {
  const earned = (bountyRamp, bonus) => {
    let gold = START_GOLD;
    for (let i = 0; i < WAVES.length; i++) {
      const w = i + 1;
      for (const [kind, count] of WAVES[i].groups) {
        gold += Math.round(ENEMIES[kind].bounty * bountyRamp(w)) * count;
      }
      gold += bonus(w);
    }
    return gold;
  };
  const before = earned((w) => 1 + 0.02 * w, (w) => 45 + w * 18);
  const after = earned(bountyScale, waveBonus);
  assert.ok(after < before * 0.95, `expected a real cut, got ${after} vs ${before}`);
});

test('killing a main boss hands a life back, up to the nine you started with', () => {
  assert.equal(BOSS_LIFE_REWARD, 1);
  assert.equal(livesAfterKill(4, ENEMIES.ratking), 5);
  assert.equal(livesAfterKill(4, ENEMIES.dragon), 5);
  assert.equal(livesAfterKill(4, ENEMIES.father), 5);
  // Mini-bosses and ordinary pests give nothing back.
  assert.equal(livesAfterKill(4, ENEMIES.baron), 4);
  assert.equal(livesAfterKill(4, ENEMIES.monkeyking), 4);
  assert.equal(livesAfterKill(4, ENEMIES.mouse), 4);
  assert.equal(livesAfterKill(4, ENEMIES.golden), 4);
});

test('the life reward never pushes past START_LIVES and never revives a dead run', () => {
  assert.equal(livesAfterKill(START_LIVES, ENEMIES.ratking), START_LIVES);
  assert.equal(livesAfterKill(START_LIVES - 1, ENEMIES.ratking), START_LIVES);
  assert.equal(livesAfterKill(0, ENEMIES.ratking), 0);
  assert.equal(livesAfterKill(0, ENEMIES.mouse), 0);
});

test('every main boss is a life back, so the wave-10/20/30/40/50 beats all pay', () => {
  const mains = Object.entries(ENEMIES).filter(([, d]) => d.boss === 'main').map(([k]) => k);
  assert.ok(mains.length >= 5, 'expected the main boss roster');
  for (const kind of mains) {
    assert.equal(livesAfterKill(1, ENEMIES[kind]), 1 + BOSS_LIFE_REWARD, `${kind} pays a life`);
  }
});
