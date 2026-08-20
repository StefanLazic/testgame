// The gold economy and the life counter. Both used to run away from the player
// in opposite directions — gold inflated past every possible sink while lives
// could only ever go down — so the rules below are pinned here.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ENEMIES, TOWERS, WAVES, START_LIVES, START_GOLD, BOUNTY_FULL_WAVE, BOUNTY_DECAY,
  BOUNTY_FLOOR, BOSS_BOUNTY_CUT, WAVE_BONUS, BOSS_LIFE_REWARD, bountyScale, waveBonus,
} from '../../js/config.js';
import { bountyFor, livesAfterKill } from '../../js/rules.js';

test('the bounty ramp decays instead of growing, so late waves never print money', () => {
  assert.equal(BOUNTY_FULL_WAVE, 5);
  assert.equal(BOUNTY_DECAY, 0.008);
  assert.equal(BOUNTY_FLOOR, 0.6);
  // The first few waves pay full price: the opening is already tight.
  for (let w = 1; w <= BOUNTY_FULL_WAVE; w++) assert.equal(bountyScale(w), 1, `wave ${w} pays full`);
  // After that every pest is worth a shade less than the one before it, because
  // late waves send five to ten times as many of them.
  for (let w = BOUNTY_FULL_WAVE + 2; w <= WAVES.length; w++) {
    assert.ok(bountyScale(w) < bountyScale(w - 1), `bountyScale should fall at wave ${w}`);
  }
  const last = bountyScale(WAVES.length);
  assert.ok(last >= 0.6 && last <= 0.7, `expected a mild decay by the last wave, got ${last}`);
  // It is a decay, not a collapse: the floor holds however long the run gets.
  assert.equal(bountyScale(500), BOUNTY_FLOOR);
});

test('bountyFor pays the pest bounty through the wave ramp and the purse', () => {
  const mouse = ENEMIES.mouse.bounty;
  assert.equal(bountyFor(ENEMIES.mouse, 1), Math.round(mouse * bountyScale(1)));
  assert.equal(bountyFor(ENEMIES.mouse, 20, 2), Math.round(mouse * bountyScale(20) * 2));
  assert.equal(bountyFor(ENEMIES.mouse, 20, 1), bountyFor(ENEMIES.mouse, 20));
  assert.ok(bountyFor(ENEMIES.ratking, 10) > bountyFor(ENEMIES.mouse, 10));
  // The same pest is worth less the later it dies.
  assert.ok(bountyFor(ENEMIES.mouse, 40) < bountyFor(ENEMIES.mouse, 5));
});

test('the wave-clear bonus is a flat stipend, not a second income curve', () => {
  assert.ok(WAVE_BONUS > 0);
  for (let w = 1; w <= WAVES.length; w++) {
    assert.equal(waveBonus(w), WAVE_BONUS, `waveBonus flat at wave ${w}`);
  }
  // Across a whole run the stipend must stay pocket change next to one cat.
  assert.ok(WAVE_BONUS * WAVES.length < 10 * Math.max(...Object.values(TOWERS).map((t) => t.cost)));
});

test('boss and golden-mouse payouts were cut proportionally', () => {
  assert.equal(BOSS_BOUNTY_CUT, 0.5);
  // The three biggest spikes in the old curve.
  assert.equal(ENEMIES.ratking.bounty, 300);
  assert.equal(ENEMIES.father.bounty, 6000);
  assert.equal(ENEMIES.golden.bounty, 45);
  // Ordinary pests are untouched: the early game should feel the same.
  assert.equal(ENEMIES.mouse.bounty, 8);
  assert.equal(ENEMIES.chicken.bounty, 12);
  // Bosses still pay more than the pests they arrive with.
  for (const [kind, def] of Object.entries(ENEMIES)) {
    if (!def.boss) continue;
    assert.ok(def.bounty > ENEMIES.mouse.bounty, `${kind} still pays like a boss`);
  }
});

test('a whole run pays a fraction of what the old economy paid', () => {
  const runTotal = (scale, bonus, cut) => {
    let gold = START_GOLD;
    for (let i = 0; i < WAVES.length; i++) {
      const w = i + 1;
      for (const [kind, count] of WAVES[i].groups) {
        const def = ENEMIES[kind];
        const base = def.boss || def.golden ? def.bounty / BOSS_BOUNTY_CUT * cut : def.bounty;
        gold += Math.round(base * scale(w)) * count;
      }
      gold += bonus(w);
    }
    return gold;
  };
  // The old economy: a rising per-pest ramp, a bonus that climbed to 495, and
  // uncut boss payouts.
  const before = runTotal((w) => 1 + 0.012 * w, (w) => 45 + Math.min(w, 25) * 18, 1);
  const after = runTotal(bountyScale, waveBonus, BOSS_BOUNTY_CUT);
  assert.ok(after < before * 0.5, `expected less than half the old income, got ${after} vs ${before}`);
  // But a run must still pay for a full board several times over, or the late
  // waves become unwinnable rather than tight.
  const board = Object.values(TOWERS).reduce((s, t) => s + t.cost, 0);
  assert.ok(after > board * 3, `a full run pays ${after}, too poor to fill the board`);
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
