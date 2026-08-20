// Mimi-chan is the single biggest purchase in the game, so the whole royal
// loop is checked in a real browser: collars, the two paths, and the promise
// they sell — a specialised queen is never destroyed, and a Regent's ward saves
// the cats standing around her.
import test from 'node:test';
import assert from 'node:assert/strict';
import { startServer } from '../helpers/server.mjs';
import { launchBrowser } from '../helpers/cdp.mjs';

// Drop a cat on a free tile near the lane, `skip` tiles along, for free.
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
      g.gold = 99999;
      g.placeTower(${JSON.stringify(kind)}, { col: c, row: r, key });
      return key;
    }
  }
  return null;
})()`;

test('Mimi-chan upgrades and royal protection', { concurrency: 1 }, async (t) => {
  const server = await startServer();
  const browser = await launchBrowser({ width: 390, height: 780 });
  const page = await browser.newPage();
  t.after(async () => { await browser.close(); await server.close(); });

  await page.goto(server.origin);
  await page.waitFor(() => !!window.game);
  await page.tapSelector('#btn-play');
  await page.waitFor(() => window.game.phase === 'prep');

  await t.test('the queen can be built and upgraded to the last collar', async () => {
    await page.eval(PLACE('queen'));
    await page.eval('window.game.selectTower(window.game.towers[0])');
    const bow = await page.eval('window.game._stats(window.game.towers[0])');
    assert.equal(await page.eval('window.game.towers[0].kind'), 'queen');
    await page.eval('(window.game.gold = 99999, window.game.upgradeSelected(), window.game.upgradeSelected())');
    assert.equal(await page.eval('window.game.towers[0].level'), 3);
    const top = await page.eval('window.game._stats(window.game.towers[0])');
    assert.ok(top.stun > bow.stun, 'a collar deepens the bow');
    assert.ok(top.cooldown < bow.cooldown, 'and shortens the wait');
  });

  await t.test('the last collar offers the two royal paths', async () => {
    await page.waitFor("document.getElementById('tp-branches').classList.contains('hidden') === false");
    const ids = await page.eval("[...document.querySelectorAll('#tp-branch-row .branch-btn')].map((b) => b.dataset.branch)");
    assert.deepEqual(ids, ['regent', 'empress']);
  });

  await t.test('an unspecialised queen is still fair game for Father', async () => {
    assert.equal(await page.eval('window.game._tryDestroy(window.game.towers[0])'), true);
    assert.equal(await page.eval('window.game.towers.length'), 0);
  });

  await t.test('a Regent wards every cat around her, once per recharge', async () => {
    await page.eval(PLACE('queen'));
    await page.eval(`(() => {
      const q = window.game.towers[0];
      q.level = 3; q.branch = 'regent'; q.wardT = 0;
      window.game._refreshSupports();
    })()`);
    // A friend right next to her, well inside the ward radius.
    await page.eval(`(() => {
      const g = window.game, q = g.towers[0];
      g.gold = 99999;
      const [c, r] = q.tile.split(',').map(Number);
      for (const [dc, dr] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1]]) {
        const key = (c+dc) + ',' + (r+dr);
        if (g.pathTiles.has(key) || g.occupied.has(key)) continue;
        g.placeTower('archer', { col: c+dc, row: r+dr, key });
        return key;
      }
      return null;
    })()`);
    assert.equal(await page.eval('window.game.towers.length'), 2);
    // The first blow is turned away, the second one lands.
    assert.equal(await page.eval('window.game._tryDestroy(window.game.towers[1])'), false);
    assert.equal(await page.eval('window.game.towers.length'), 2, 'the ward saved the archer');
    assert.ok(await page.eval('window.game.towers[0].wardT') > 0, 'the ward is recharging');
    assert.equal(await page.eval('window.game._tryDestroy(window.game.towers[1])'), true);
    assert.equal(await page.eval('window.game.towers.length'), 1);
  });

  await t.test('nothing destroys a specialised queen, not even Father at full strength', async () => {
    assert.equal(await page.eval('window.game._tryDestroy(window.game.towers[0])'), false);
    await page.eval('window.game._fatherCrush(1)');
    assert.equal(await page.eval('window.game.towers.length'), 1, 'Her Majesty is still standing');
    assert.equal(await page.eval('window.game.towers[0].kind'), 'queen');
  });

  await t.test('an Empress never naps and never shuffles', async () => {
    await page.eval("(window.game.towers[0].branch = 'empress', window.game._refreshSupports())");
    await page.eval(PLACE('archer', 3));
    await page.eval(PLACE('archer', 5));
    await page.eval('window.game._emilijaSleep({})');
    assert.equal(await page.eval('window.game.towers[0].asleep === true'), false);
    const before = await page.eval('window.game.towers[0].tile');
    await page.eval('window.game._emilijaShuffle({})');
    assert.equal(await page.eval('window.game.towers[0].tile'), before);
  });

  await t.test('no console errors', async () => {
    assert.deepEqual(page.consoleErrors, []);
  });
});
