// Pause sheet + settings, driven through the real UI with touch taps.
import test from 'node:test';
import assert from 'node:assert/strict';
import { startServer } from '../helpers/server.mjs';
import { launchBrowser, findChrome } from '../helpers/cdp.mjs';

const hasChrome = !!findChrome();

test('pause and settings', { skip: hasChrome ? false : 'no Chrome binary' }, async (t) => {
  const server = await startServer();
  const browser = await launchBrowser({ width: 390, height: 844 });
  const page = await browser.newPage(`${server.origin}/index.html`);
  t.after(async () => { await browser.close(); await server.close(); });

  await page.waitFor('!!window.game');
  await page.tapSelector('#btn-play');
  await page.waitFor('window.game.phase === "prep"');

  await t.test('the pause chip is a real touch target', async () => {
    const box = await page.eval('(() => { const r = document.getElementById("btn-pause").getBoundingClientRect(); return { w: r.width, h: r.height }; })()');
    assert.ok(box.w >= 40 && box.h >= 30, `pause chip is ${box.w}×${box.h}`);
  });

  await t.test('tapping pause freezes the simulation', async () => {
    await page.tapSelector('#btn-pause');
    assert.equal(await page.eval('window.game.paused'), true);
    assert.equal(await page.eval('document.getElementById("pause").classList.contains("hidden")'), false);
    const before = await page.eval('window.game.waveTimer');
    await new Promise((r) => setTimeout(r, 900));
    assert.equal(await page.eval('window.game.waveTimer'), before, 'the prep timer must not tick while paused');
  });

  await t.test('sound and shake toggles flip and persist', async () => {
    await page.tapSelector('#btn-sound');
    assert.equal(await page.eval('JSON.parse(localStorage.getItem("cd-settings")).sound'), false);
    assert.match(await page.eval('document.getElementById("sound-state").textContent'), /Isklj|Off/);
    await page.tapSelector('#btn-shake');
    assert.equal(await page.eval('JSON.parse(localStorage.getItem("cd-settings")).shake'), false);
    // Back on again, so the rest of the run is normal.
    await page.tapSelector('#btn-sound');
    await page.tapSelector('#btn-shake');
    assert.equal(await page.eval('JSON.parse(localStorage.getItem("cd-settings")).sound'), true);
  });

  await t.test('resume returns to the run without a time jump', async () => {
    await page.tapSelector('#btn-resume');
    assert.equal(await page.eval('window.game.paused'), false);
    assert.equal(await page.eval('document.getElementById("pause").classList.contains("hidden")'), true);
    const before = await page.eval('window.game.waveTimer');
    await new Promise((r) => setTimeout(r, 700));
    const after = await page.eval('window.game.waveTimer');
    assert.ok(after < before, 'the prep timer should tick again');
    assert.ok(before - after < 3, `resume jumped ${before - after}s forward`);
  });

  await t.test('hiding the tab pauses automatically', async () => {
    await page.send('Emulation.setPageVisibilityOverride', { visibility: 'hidden' }).catch(() => {});
    await page.eval('document.dispatchEvent(new Event("visibilitychange"))');
    // The override may be unavailable; the blur path must work regardless.
    await page.eval('window.dispatchEvent(new Event("blur"))');
    assert.equal(await page.eval('window.game.paused'), true);
    await page.send('Emulation.setPageVisibilityOverride', { visibility: 'visible' }).catch(() => {});
    await page.tapSelector('#btn-resume');
  });

  await t.test('quit to title returns to the diorama', async () => {
    await page.tapSelector('#btn-pause');
    await page.tapSelector('#btn-quit');
    assert.equal(await page.eval('window.game.phase'), 'demo');
    assert.equal(await page.eval('document.getElementById("title").classList.contains("hidden")'), false);
    assert.equal(await page.eval('document.getElementById("pause").classList.contains("hidden")'), true);
  });

  await t.test('restart from the pause sheet starts a fresh run', async () => {
    await page.tapSelector('#btn-play');
    await page.waitFor('window.game.phase === "prep"');
    await page.eval('window.game.gold = 12345');
    await page.tapSelector('#btn-pause');
    await page.tapSelector('#btn-restart');
    await page.waitFor('window.game.phase === "prep"');
    assert.notEqual(await page.eval('window.game.gold'), 12345);
    assert.equal(await page.eval('window.game.paused'), false);
  });

  await t.test('no console errors', () => {
    assert.deepEqual(page.consoleErrors, []);
  });
});
