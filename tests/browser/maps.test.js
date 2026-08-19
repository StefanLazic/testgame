// Switching maps rebuilds the whole board — the kind of thing that breaks
// silently, so drive it in a real browser.
import test from 'node:test';
import assert from 'node:assert/strict';
import { startServer } from '../helpers/server.mjs';
import { launchBrowser } from '../helpers/cdp.mjs';

test('map picker', { concurrency: 1 }, async (t) => {
  const server = await startServer();
  const browser = await launchBrowser({ width: 390, height: 780 });
  const page = await browser.newPage();
  t.after(async () => { await browser.close(); await server.close(); });

  await page.goto(server.origin);
  await page.waitFor(() => !!window.game && window.game.phase === 'demo');

  await t.test('starts on the kitchen with both maps offered', async () => {
    const ids = await page.eval("[...document.querySelectorAll('#map-picker .map-card')].map((b) => b.dataset.map)");
    assert.deepEqual(ids, ['kitchen', 'garden']);
    assert.equal(await page.eval("document.querySelector('#map-picker .map-card.on').dataset.map"), 'kitchen');
    assert.equal(await page.eval('window.game.pathTiles.size > 0'), true);
  });

  const kitchen = await page.eval('({ cols: window.game.occupied.size, tiles: window.game.pathTiles.size, goal: window.game.goal.z })');

  await t.test('tapping the garden rebuilds the board', async () => {
    await page.tapSelector('#map-picker .map-card[data-map="garden"]');
    await page.waitFor("document.querySelector('#map-picker .map-card.on').dataset.map === 'garden'");
    const after = await page.eval('({ tiles: window.game.pathTiles.size, goal: window.game.goal.z, lanes: window.game.lanes.length, demo: window.game.phase })');
    assert.notEqual(after.tiles, kitchen.tiles, 'the garden lane should differ from the kitchen');
    assert.equal(after.lanes, 2);
    assert.equal(after.demo, 'demo', 'the diorama keeps playing after a swap');
    // The second lane is closed again on the new board.
    assert.equal(await page.eval('window.game.lanes[1].open'), false);
  });

  await t.test('the choice is remembered across a reload', async () => {
    await page.goto(server.origin);
    await page.waitFor(() => !!window.game && window.game.phase === 'demo');
    assert.equal(await page.eval("document.querySelector('#map-picker .map-card.on').dataset.map"), 'garden');
    assert.equal(await page.eval('window.game.pathTiles.size'), await page.eval('window.game.pathTiles.size'));
  });

  await t.test('you can build and fight on the garden', async () => {
    await page.tapSelector('#btn-play');
    await page.waitFor(() => window.game.phase === 'prep');
    const placed = await page.eval(`(() => {
      const g = window.game;
      for (let r = 0; r < 30; r++) {
        for (let c = 0; c < 30; c++) {
          if (g.pathTiles.has(c + ',' + r) || g.occupied.has(c + ',' + r)) continue;
          let adj = 0;
          for (const [dc, dr] of [[1,0],[-1,0],[0,1],[0,-1]]) if (g.pathTiles.has((c+dc) + ',' + (r+dr))) adj++;
          if (!adj) continue;
          g.gold = 999;
          g.placeTower('archer', { col: c, row: r, key: c + ',' + r });
          return g.towers.length;
        }
      }
      return 0;
    })()`);
    assert.equal(placed, 1);
    await page.eval('window.game.startWaveNow()');
    await page.eval('window.game.setSpeed(2)');
    await page.waitFor(() => window.game.enemies.length > 0, 40000);
    await page.waitFor(() => window.game.kills > 0, 60000);
    assert.deepEqual(page.consoleErrors, []);
  });

  await t.test('switching back to the kitchen restores the original board', async () => {
    await page.eval("window.game.startDemo(), window.game.setMap('kitchen')");
    const tiles = await page.eval('window.game.pathTiles.size');
    assert.equal(tiles, kitchen.tiles);
    assert.equal(await page.eval('window.game.goal.z'), kitchen.goal);
  });
});
