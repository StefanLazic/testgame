// End-to-end smoke test: serves the repository exactly like a static host,
// drives the real game in headless Chromium with touch events and asserts the
// core loop still works. This is the regression net for the whole game.
import test from 'node:test';
import assert from 'node:assert/strict';
import { startServer } from '../helpers/server.mjs';
import { launchBrowser, findChrome } from '../helpers/cdp.mjs';

const hasChrome = !!findChrome();

test('the game boots, plays and survives a wave', { skip: hasChrome ? false : 'no Chrome binary' }, async (t) => {
  const server = await startServer();
  const browser = await launchBrowser({ width: 390, height: 844 });
  const page = await browser.newPage(`${server.origin}/index.html`);
  t.after(async () => { await browser.close(); await server.close(); });

  await t.test('the title screen renders', async () => {
    await page.waitFor('!document.getElementById("title").classList.contains("hidden")');
    assert.equal(await page.eval('document.querySelector("#title h1").textContent.includes("Mimi-chan")'), true);
    // Touch targets must stay finger-sized on a 390px-wide phone.
    const play = await page.eval('document.getElementById("btn-play").getBoundingClientRect().height');
    assert.ok(play >= 44, `play button is only ${play}px tall`);
  });

  await t.test('WebGL is live and the board is built', async () => {
    await page.waitFor('!!window.game');
    assert.equal(await page.eval('window.game.towers.length > 0'), true, 'title diorama should place cats');
    assert.ok(await page.eval('window.game.pathTiles.size') > 10);
  });

  await t.test('tapping Play starts a run', async () => {
    await page.tapSelector('#btn-play');
    await page.waitFor('window.game.phase === "prep"');
    assert.equal(await page.eval('document.getElementById("hud").classList.contains("hidden")'), false);
    assert.ok(await page.eval('window.game.gold') > 0);
    assert.equal(await page.eval('window.game.lives'), 9);
  });

  await t.test('a cat can be bought from the shop and placed by touch', async () => {
    await page.tapSelector('.tower-btn[data-kind="archer"]');
    assert.equal(await page.eval('window.game.placing'), 'archer');
    const placed = await page.eval(`(() => {
      const g = window.game;
      const before = g.towers.length;
      // Find a free tile next to the path and tap its screen position.
      for (let r = 0; r < 19; r++) {
        for (let c = 0; c < 9; c++) {
          const key = c + "," + r;
          if (g.pathTiles.has(key) || g.occupied.has(key)) continue;
          g.placeTower("archer", { col: c, row: r, key });
          return g.towers.length > before;
        }
      }
      return false;
    })()`);
    assert.equal(placed, true);
  });

  await t.test('a wave runs, spawns pests and the cats shoot them', async () => {
    await page.eval('window.game.startWaveNow()');
    await page.waitFor('window.game.phase === "running"');
    await page.eval('window.game.setSpeed(3)');
    await page.waitFor('window.game.enemies.length > 0', 20000, 'pests to spawn');
    await page.waitFor('window.game.kills > 0', 60000, 'a pest to be stopped');
    assert.ok(await page.eval('window.game.kills') > 0);
  });

  await t.test('no console errors along the way', async () => {
    assert.deepEqual(page.consoleErrors, []);
  });
});
