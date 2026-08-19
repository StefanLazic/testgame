// Ema and Sofija never fire, so the browser test checks the things you can
// actually see: buffed neighbours, fish appearing on their own, richer kills.
import test from 'node:test';
import assert from 'node:assert/strict';
import { startServer } from '../helpers/server.mjs';
import { launchBrowser } from '../helpers/cdp.mjs';

// Place a cat on the first free tile next to the lane, ignoring the price.
const PLACE = (kind, skip = 0) => `(() => {
  const g = window.game;
  let seen = 0;
  for (let r = 0; r < 40; r++) {
    for (let c = 0; c < 40; c++) {
      const key = c + ',' + r;
      if (g.pathTiles.has(key) || g.occupied.has(key)) continue;
      let adj = 0;
      for (const [dc, dr] of [[1,0],[-1,0],[0,1],[0,-1]]) if (g.pathTiles.has((c+dc) + ',' + (r+dr))) adj++;
      if (!adj) continue;
      if (seen++ < ${skip}) continue;
      g.gold = 9999;
      g.placeTower(${JSON.stringify(kind)}, { col: c, row: r, key });
      return key;
    }
  }
  return null;
})()`;

test('support cats', { concurrency: 1 }, async (t) => {
  const server = await startServer();
  const browser = await launchBrowser({ width: 390, height: 780 });
  const page = await browser.newPage();
  t.after(async () => { await browser.close(); await server.close(); });

  await page.goto(server.origin);
  await page.waitFor(() => !!window.game);
  await page.tapSelector('#btn-play');
  await page.waitFor(() => window.game.phase === 'prep');

  await t.test('both support cats are in the shop', async () => {
    const kinds = await page.eval("[...document.querySelectorAll('#shop-row .tower-btn')].map((b) => b.dataset.kind)");
    assert.ok(kinds.includes('ema'), 'Ema should be buyable');
    assert.ok(kinds.includes('sofija'), 'Sofija should be buyable');
    assert.ok(kinds.indexOf('ema') < kinds.indexOf('witch'), 'support cats sit before the witch');
  });

  await t.test('a cat next to Ema is cheered on', async () => {
    const archer = await page.eval(PLACE('archer'));
    assert.ok(archer);
    assert.equal(await page.eval("window.game.towers[0].buff.buffed"), false);
    await page.eval(PLACE('ema', 1));
    const buffed = await page.eval('({ dmg: window.game.towers[0].buff.damage, rate: window.game.towers[0].buff.rate, on: window.game.towers[0].buff.buffed })');
    assert.equal(buffed.on, true);
    assert.ok(buffed.dmg > 1 && buffed.rate > 1);
    // …and Ema does not cheer for herself.
    assert.equal(await page.eval('window.game.towers[1].buff.buffed'), false);
  });

  await t.test('the tower panel says who is cheering', async () => {
    await page.eval('window.game.selectTower(window.game.towers[0])');
    const html = await page.eval("document.getElementById('tp-stats').innerHTML");
    assert.match(html, /buffed/);
    await page.eval('window.game.selectTower(window.game.towers[1])');
    assert.match(await page.eval("document.getElementById('tp-stats').textContent"), /🎀/);
    await page.eval('window.game.selectTower(null)');
  });

  await t.test('selling Ema takes the cheer away', async () => {
    await page.eval('window.game.selectTower(window.game.towers[1]), window.game.sellSelected()');
    assert.equal(await page.eval('window.game.towers[0].buff.buffed'), false);
  });

  await t.test('Sofija digs up fish all on her own', async () => {
    await page.eval(PLACE('sofija', 1));
    const before = await page.eval('(window.game.gold = 0, window.game.towers[1].incomeT = 0.05, window.game.gold)');
    assert.equal(before, 0);
    await page.eval('window.game.setSpeed(2)');
    await page.waitFor('window.game.gold > 0', 20000);
    assert.ok(await page.eval('window.game.gold') > 0);
    assert.match(await page.eval("document.getElementById('gold-text').textContent"), /\d/);
  });

  await t.test('pests dying inside her purse are worth more', async () => {
    const richer = await page.eval(`(() => {
      const g = window.game;
      const sofija = g.towers.find((tw) => tw.kind === 'sofija');
      const near = g._spawn('mouse');
      near.group.position.set(sofija.pos.x, 0, sofija.pos.z);
      g.gold = 0; g._kill(near);
      const nearGold = g.gold;
      const far = g._spawn('mouse');
      far.group.position.set(sofija.pos.x + 40, 0, sofija.pos.z);
      g.gold = 0; g._kill(far);
      return { nearGold, farGold: g.gold };
    })()`);
    assert.ok(richer.nearGold > richer.farGold, `${richer.nearGold} should beat ${richer.farGold}`);
  });

  await t.test('no console errors', async () => {
    assert.deepEqual(page.consoleErrors, []);
  });
});
