// The shop preview: picking a cat must show its reach and its numbers before
// any fish is spent.
import test from 'node:test';
import assert from 'node:assert/strict';
import { startServer } from '../helpers/server.mjs';
import { launchBrowser, findChrome } from '../helpers/cdp.mjs';

const hasChrome = !!findChrome();

test('range preview in the shop', { skip: hasChrome ? false : 'no Chrome binary' }, async (t) => {
  const server = await startServer();
  const browser = await launchBrowser({ width: 390, height: 844 });
  const page = await browser.newPage(`${server.origin}/index.html`);
  t.after(async () => { await browser.close(); await server.close(); });

  await page.waitFor('!!window.game');
  await page.tapSelector('#btn-play');
  await page.waitFor('window.game.phase === "prep"');

  await t.test('selecting a cat shows the ghost tile and its range ring', async () => {
    assert.equal(await page.eval('window.game.ghostRing.visible'), false);
    await page.tapSelector('.tower-btn[data-kind="archer"]');
    assert.equal(await page.eval('window.game.ghost.visible'), true);
    assert.equal(await page.eval('window.game.ghostRing.visible'), true);
    const ring = await page.eval('window.game.ghostRing.scale.x');
    assert.equal(ring, 6.4, 'the ring should be scaled to the archer range');
  });

  await t.test('the ring resizes for a longer-ranged cat', async () => {
    const archer = await page.eval('window.game.ghostRing.scale.x');
    await page.tapSelector('.tower-btn[data-kind="sleepy"]');
    const sleepy = await page.eval('window.game.ghostRing.scale.x');
    assert.ok(sleepy > archer, `sleepy (${sleepy}) should out-range archer (${archer})`);
  });

  await t.test('the preview card shows cost, stats and reach', async () => {
    await page.tapSelector('.tower-btn[data-kind="archer"]');
    assert.equal(await page.eval('document.getElementById("preview-card").classList.contains("hidden")'), false);
    assert.match(await page.eval('document.getElementById("pv-cost").textContent'), /70/);
    const stats = await page.eval('document.getElementById("pv-stats").textContent');
    assert.match(stats, /6\.4/, `range missing from "${stats}"`);
    const box = await page.eval('(() => { const r = document.getElementById("preview-card").getBoundingClientRect(); return { top: r.top, bottom: r.bottom, w: r.width }; })()');
    assert.ok(box.bottom <= 844, 'the card must stay on screen');
    assert.ok(box.w <= 390, 'the card must not overflow a phone');
  });

  await t.test('an ability cat is described instead of showing fake damage', async () => {
    await page.tapSelector('.tower-btn[data-kind="queen"]');
    assert.equal(await page.eval('window.game.ghostRing.visible'), false, 'the queen has no range ring');
    assert.match(await page.eval('document.getElementById("pv-hint").textContent'), /tabl|board/i);
  });

  await t.test('a cat you cannot afford is flagged red', async () => {
    assert.equal(await page.eval('document.getElementById("preview-card").classList.contains("poor")'), true);
    await page.tapSelector('.tower-btn[data-kind="archer"]');
    assert.equal(await page.eval('document.getElementById("preview-card").classList.contains("poor")'), false);
  });

  await t.test('deselecting hides the preview and the ring', async () => {
    await page.tapSelector('.tower-btn[data-kind="archer"]');
    assert.equal(await page.eval('window.game.placing'), null);
    assert.equal(await page.eval('window.game.ghostRing.visible'), false);
    assert.equal(await page.eval('document.getElementById("preview-card").classList.contains("hidden")'), true);
  });

  await t.test('no console errors', () => {
    assert.deepEqual(page.consoleErrors, []);
  });
});
