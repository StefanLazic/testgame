// The economy and the life counter, driven live: a fallen main boss must top
// the milk bowl back up, and bounties must follow the gentle new wave ramp.
import test from 'node:test';
import assert from 'node:assert/strict';
import { startServer } from '../helpers/server.mjs';
import { launchBrowser } from '../helpers/cdp.mjs';
import { START_LIVES, ENEMIES, bountyScale } from '../../js/config.js';

test('gold and lives', { concurrency: 1 }, async (t) => {
  const server = await startServer();
  const browser = await launchBrowser({ width: 390, height: 780 });
  const page = await browser.newPage();
  t.after(async () => { await browser.close(); await server.close(); });

  await page.goto(server.origin);
  await page.waitFor(() => !!window.game);
  await page.tapSelector('#btn-play');
  await page.waitFor(() => window.game.phase === 'prep');

  await t.test('a leaked pest still costs the milk', async () => {
    const res = await page.eval(`(() => {
      const g = window.game;
      g.lives = ${START_LIVES};
      const e = g._spawn('dog');
      g._leak(e, g.enemies.indexOf(e));
      return { lives: g.lives, hud: document.getElementById('lives-text').textContent };
    })()`);
    assert.equal(res.lives, START_LIVES - ENEMIES.dog.leak);
    assert.equal(res.hud, String(res.lives));
  });

  await t.test('dropping a main boss hands one life back', async () => {
    const res = await page.eval(`(() => {
      const g = window.game;
      g.lives = 3;
      const e = g._spawn('ratking');
      g._kill(e);
      return { lives: g.lives, hud: document.getElementById('lives-text').textContent };
    })()`);
    assert.equal(res.lives, 4);
    assert.equal(res.hud, '4');
  });

  await t.test('mini-bosses and ordinary pests give nothing back', async () => {
    const res = await page.eval(`(() => {
      const g = window.game;
      g.lives = 3;
      [g._spawn('baron'), g._spawn('mouse'), g._spawn('golden')].forEach((e) => g._kill(e));
      return g.lives;
    })()`);
    assert.equal(res, 3);
  });

  await t.test('the reward is capped at the nine lives you started with', async () => {
    const res = await page.eval(`(() => {
      const g = window.game;
      g.lives = ${START_LIVES};
      g._kill(g._spawn('dragon'));
      const full = g.lives;
      g.lives = 0;
      g._kill(g._spawn('emilija'));
      return { full, dead: g.lives };
    })()`);
    assert.equal(res.full, START_LIVES);
    assert.equal(res.dead, 0, 'a lost run must stay lost');
  });

  await t.test('a boss kill pays the softened bounty', async () => {
    const wave = 20;
    const res = await page.eval(`(() => {
      const g = window.game;
      g.wave = ${wave};
      g.gold = 0;
      g.lives = 5;
      g._kill(g._spawn('ratking'));
      return g.gold;
    })()`);
    assert.equal(res, Math.round(ENEMIES.ratking.bounty * bountyScale(wave)));
  });

  await t.test('the life chip and its toast fit a phone screen', async () => {
    const box = await page.eval(`(() => {
      const r = document.getElementById('lives-text').parentElement.getBoundingClientRect();
      return { top: r.top, left: r.left, right: r.right, bottom: r.bottom };
    })()`);
    assert.ok(box.top >= 0 && box.left >= 0, 'the chip must be on screen');
    assert.ok(box.right <= 390 && box.bottom <= 780, 'the chip must not overflow a phone');
  });

  await t.test('no console errors', () => {
    assert.deepEqual(page.consoleErrors, []);
  });
});
