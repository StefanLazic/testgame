// Emilija is the wave-30 boss and the only enemy that edits the board itself,
// so her three tricks are driven live in a real browser: shuffle, sleep, split.
import test from 'node:test';
import assert from 'node:assert/strict';
import { startServer } from '../helpers/server.mjs';
import { launchBrowser } from '../helpers/cdp.mjs';

// Drop `n` free cats on buildable tiles next to the lane.
const PLACE = (n) => `(() => {
  const g = window.game;
  let placed = 0;
  for (let r = 0; r < 40 && placed < ${n}; r++) {
    for (let c = 0; c < 40 && placed < ${n}; c++) {
      const key = c + ',' + r;
      if (g.pathTiles.has(key) || g.occupied.has(key)) continue;
      g.gold = 99999;
      g.placeTower('archer', { col: c, row: r, key });
      placed++;
    }
  }
  return g.towers.length;
})()`;

test('Emilija the butterfly boss', { concurrency: 1 }, async (t) => {
  const server = await startServer();
  const browser = await launchBrowser({ width: 390, height: 780 });
  const page = await browser.newPage();
  t.after(async () => { await browser.close(); await server.close(); });

  await page.goto(server.origin);
  await page.waitFor(() => !!window.game);
  await page.tapSelector('#btn-play');
  await page.waitFor(() => window.game.phase === 'prep');

  await t.test('she spawns, flies, and gets her own cinematic', async () => {
    const res = await page.eval(`(() => {
      const g = window.game;
      const e = g._spawn('emilija');
      window.__emilija = e;
      return {
        meshes: e.group.children.length,
        flying: e.flying,
        boss: e.def.boss,
        intro: e.intro,
        cine: !document.getElementById('cinematic').classList.contains('hidden'),
        icon: document.querySelector('#cinematic .cine-dragon').textContent,
        bossBar: !document.getElementById('boss-bar').classList.contains('hidden'),
      };
    })()`);
    assert.ok(res.meshes > 6, 'the butterfly needs a body, wings and antennae');
    assert.equal(res.flying, true);
    assert.equal(res.boss, 'main');
    assert.equal(res.intro, 0, 'she arrives with an entrance to play');
    assert.equal(res.cine, true, 'the cinematic overlay should be showing');
    assert.equal(res.icon, '🦋');
    assert.equal(res.bossBar, true);
  });

  await t.test('the entrance finishes and she starts flying the lane', async () => {
    await page.eval('window.game.setSpeed(2), window.game.startWaveNow()');
    await page.waitFor('window.__emilija.intro === null', 40000);
  });

  await t.test('trick 1: she shuffles every cat onto a different tile', async () => {
    const towers = await page.eval(PLACE(6));
    assert.ok(towers >= 6, 'need a few cats to shuffle');
    const res = await page.eval(`(() => {
      const g = window.game;
      const before = g.towers.map((tw) => tw.tile);
      g._emilijaShuffle(window.__emilija);
      const after = g.towers.map((tw) => tw.tile);
      const occupied = after.every((key) => g.occupied.get(key) === g.towers[after.indexOf(key)]);
      const parked = g.towers.every((tw) => {
        const [c, r] = tw.tile.split(',').map(Number);
        return !g.pathTiles.has(tw.tile) && Number.isFinite(c) && Number.isFinite(r);
      });
      return { before, after, occupied, parked, count: g.towers.length };
    })()`);
    assert.equal(res.after.length, res.before.length, 'nobody may vanish in the shuffle');
    assert.deepEqual([...res.after].sort(), [...res.before].sort(), 'the same tiles must be reused');
    assert.ok(res.after.some((tile, i) => tile !== res.before[i]), 'somebody has to move');
    assert.equal(res.occupied, true, 'the occupancy map must follow the cats');
    assert.equal(res.parked, true, 'no cat may end up on the path');
  });

  await t.test('trick 2: a third of the cats fall asleep and stop shooting', async () => {
    const res = await page.eval(`(() => {
      const g = window.game;
      for (const tw of g.towers) { tw.asleep = false; tw.disabledT = 0; }
      g._emilijaSleep(window.__emilija);
      return {
        total: g.towers.length,
        asleep: g.towers.filter((tw) => tw.asleep).length,
        disabled: g.towers.filter((tw) => tw.disabledT > 0).length,
      };
    })()`);
    assert.ok(res.asleep > 0 && res.asleep < res.total, 'some, but never all, of the army naps');
    assert.equal(res.asleep, Math.ceil(res.total / 3));
    assert.equal(res.disabled, res.asleep, 'sleeping cats must be switched off');
  });

  await t.test('the next trick wakes everybody up again', async () => {
    const awake = await page.eval(`(() => {
      const g = window.game;
      window.__emilija.trickT = 999;
      g._emilijaBrain(window.__emilija, 0.016);
      return g.towers.filter((tw) => tw.asleep).length;
    })()`);
    assert.equal(awake, 0, 'no cat may still be asleep after the next trick');
  });

  await t.test('trick 3: three smaller, weaker butterflies split off', async () => {
    const res = await page.eval(`(() => {
      const g = window.game;
      const before = g.enemies.filter((e) => e.kind === 'flutterling').length;
      g._emilijaSpawn(window.__emilija);
      const kids = g.enemies.filter((e) => e.kind === 'flutterling');
      return {
        added: kids.length - before,
        weaker: kids.every((k) => k.maxHp < window.__emilija.maxHp),
        smaller: kids.every((k) => k.def.scale < window.__emilija.def.scale),
        flying: kids.every((k) => k.flying),
      };
    })()`);
    assert.equal(res.added, 3);
    assert.equal(res.weaker, true);
    assert.equal(res.smaller, true);
    assert.equal(res.flying, true);
  });

  await t.test('her tricks fire on a timer and never repeat back to back', async () => {
    const seen = await page.eval(`(() => {
      const g = window.game;
      const e = window.__emilija;
      const out = [];
      e.lastTrick = null;
      for (let i = 0; i < 12; i++) {
        e.trickT = 999;
        g._emilijaBrain(e, 0.016);
        out.push(e.lastTrick);
      }
      return out;
    })()`);
    assert.equal(seen.length, 12);
    assert.ok(seen.every((trick) => ['shuffle', 'sleep', 'spawn'].includes(trick)));
    assert.ok(seen.every((trick, i) => i === 0 || trick !== seen[i - 1]), 'no trick twice in a row');
  });

  await t.test('she can be killed and pays out', async () => {
    const gold = await page.eval('window.game.gold');
    await page.eval('window.game.damage(window.__emilija, 999999)');
    assert.equal(await page.eval('window.__emilija.alive'), false);
    assert.ok(await page.eval('window.game.gold') > gold, 'a boss bounty should land');
    await page.eval("window.game.enemies.forEach((e) => { e.alive = false; })");
  });

  await t.test('no console errors', async () => {
    assert.deepEqual(page.consoleErrors, []);
  });
});
