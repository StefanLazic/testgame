// Squads and hybrid paths change how a cat fights, so check the whole loop in
// a real browser: build two partners, see the badge, buy a path, keep it.
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
      g.gold = 9999;
      g.placeTower(${JSON.stringify(kind)}, { col: c, row: r, key });
      return key;
    }
  }
  return null;
})()`;

test('synergies and hybrid upgrades', { concurrency: 1 }, async (t) => {
  const server = await startServer();
  const browser = await launchBrowser({ width: 390, height: 780 });
  const page = await browser.newPage();
  t.after(async () => { await browser.close(); await server.close(); });

  await page.goto(server.origin);
  await page.waitFor(() => !!window.game);
  await page.tapSelector('#btn-play');
  await page.waitFor(() => window.game.phase === 'prep');

  await t.test('a lone cat has no squad bonus', async () => {
    await page.eval(PLACE('archer'));
    const syn = await page.eval('window.game.towers[0].syn');
    assert.deepEqual(syn.ids, []);
    assert.equal(syn.damage, 1);
  });

  await t.test('a ninja next to the archer starts the hunt', async () => {
    await page.eval(PLACE('ninja', 1));
    const syn = await page.eval('({ a: window.game.towers[0].syn, b: window.game.towers[1].syn })');
    assert.ok(syn.a.ids.includes('hunt'), `archer synergies: ${syn.a.ids}`);
    assert.ok(syn.b.ids.includes('hunt'));
    assert.ok(syn.a.rate > 1, 'the hunt should speed both cats up');
  });

  await t.test('the panel shows the squad badge', async () => {
    await page.eval('window.game.selectTower(window.game.towers[0])');
    const html = await page.eval("document.getElementById('tp-stats').innerHTML");
    assert.match(html, /class="syn"/);
  });

  await t.test('selling the partner ends the synergy', async () => {
    await page.eval('window.game.selectTower(window.game.towers[1]), window.game.sellSelected()');
    assert.deepEqual(await page.eval('window.game.towers[0].syn.ids'), []);
  });

  await t.test('no paths are offered before the last collar', async () => {
    await page.eval('window.game.selectTower(window.game.towers[0])');
    assert.equal(await page.eval("document.getElementById('tp-branches').classList.contains('hidden')"), true);
  });

  await t.test('the last collar offers two permanent paths', async () => {
    await page.eval('(window.game.gold = 9999, window.game.upgradeSelected(), window.game.upgradeSelected())');
    assert.equal(await page.eval('window.game.towers[0].level'), 3);
    await page.waitFor("document.getElementById('tp-branches').classList.contains('hidden') === false");
    const ids = await page.eval("[...document.querySelectorAll('#tp-branch-row .branch-btn')].map((b) => b.dataset.branch)");
    assert.deepEqual(ids, ['sniper', 'ranger']);
  });

  await t.test('buying a path changes the cat for good', async () => {
    const before = await page.eval('window.game._stats(window.game.towers[0]).range');
    await page.tapSelector('#tp-branch-row .branch-btn[data-branch="sniper"]');
    await page.waitFor('window.game.towers[0].branch === "sniper"');
    const after = await page.eval('({ range: window.game._stats(window.game.towers[0]).range, gold: window.game.gold })');
    assert.ok(after.range > before, 'the sniper path should reach further');
    // The offer is gone and the panel names the path.
    assert.equal(await page.eval("document.getElementById('tp-branches').classList.contains('hidden')"), true);
    assert.match(await page.eval("document.getElementById('tp-stats').textContent"), /✧/);
  });

  await t.test('a specialised cat still fights', async () => {
    await page.eval('window.game.setSpeed(2), window.game.startWaveNow()');
    await page.waitFor(() => window.game.enemies.length > 0, 40000);
    await page.waitFor(() => window.game.kills > 0, 60000);
    assert.ok(await page.eval('window.game.kills') > 0);
  });

  await t.test('no console errors', async () => {
    assert.deepEqual(page.consoleErrors, []);
  });
});
