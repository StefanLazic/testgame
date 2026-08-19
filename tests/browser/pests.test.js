// The three counterplay pests each change one rule of the fight, so each one
// is driven live: healing, shield absorption and burrowing.
import test from 'node:test';
import assert from 'node:assert/strict';
import { startServer } from '../helpers/server.mjs';
import { launchBrowser } from '../helpers/cdp.mjs';

test('counterplay pests', { concurrency: 1 }, async (t) => {
  const server = await startServer();
  const browser = await launchBrowser({ width: 390, height: 780 });
  const page = await browser.newPage();
  t.after(async () => { await browser.close(); await server.close(); });

  await page.goto(server.origin);
  await page.waitFor(() => !!window.game);
  await page.tapSelector('#btn-play');
  await page.waitFor(() => window.game.phase === 'prep');

  await t.test('all three can be spawned and modelled', async () => {
    const built = await page.eval(`(() => {
      const g = window.game;
      const out = {};
      for (const kind of ['nurse', 'beetle', 'mole']) {
        const e = g._spawn(kind);
        out[kind] = { alive: e.alive, meshes: e.group.children.length, shield: e.shield };
        e.alive = false;
      }
      return out;
    })()`);
    assert.ok(built.nurse.meshes > 3);
    assert.ok(built.beetle.shield > 0, 'the beetle spawns with its barrier up');
    assert.ok(built.mole.meshes > 3);
  });

  await t.test('the beetle soaks damage into its shield first', async () => {
    const res = await page.eval(`(() => {
      const g = window.game;
      const e = g._spawn('beetle');
      const hp = e.hp;
      const shield = e.shield;
      g.damage(e, 50);
      const mid = { hp: e.hp, shield: e.shield };
      g.damage(e, 100000);
      const after = { hp: e.hp, shield: e.shield, alive: e.alive };
      e.alive = false;
      return { hp, shield, mid, after };
    })()`);
    assert.equal(res.mid.hp, res.hp, 'health should be untouched while the shield holds');
    assert.ok(res.mid.shield < res.shield, 'the shield should have taken the hit');
    assert.equal(res.after.shield, 0);
    assert.equal(res.after.alive, false, 'overkill still kills it');
  });

  await t.test('the shield grows back after a quiet spell', async () => {
    const regrown = await page.eval(`(() => {
      const g = window.game;
      const e = g._spawn('beetle');
      e.shield = 0;
      e.sinceHit = 99;
      window.__beetle = e;
      return e.shield;
    })()`);
    assert.equal(regrown, 0);
    await page.eval('window.game.startWaveNow()');
    await page.waitFor('window.__beetle.shield > 0', 20000);
    assert.ok(await page.eval('window.__beetle.shield') > 0);
    await page.eval('window.__beetle.alive = false');
  });

  await t.test('the nurse heals a hurt friend', async () => {
    const healed = await page.eval(`(() => {
      const g = window.game;
      const nurse = g._spawn('nurse');
      const patient = g._spawn('mouse');
      patient.hp = 1;
      patient.group.position.copy(nurse.group.position);
      window.__patient = patient;
      window.__nurse = nurse;
      nurse.healT = nurse.def.heals.interval;
      return patient.hp;
    })()`);
    assert.equal(healed, 1);
    await page.waitFor('window.__patient.hp > 1', 20000);
    const capped = await page.eval('window.__patient.hp <= window.__patient.maxHp');
    assert.equal(capped, true, 'healing must never overfill');
    await page.eval('window.__patient.alive = false, window.__nurse.alive = false');
  });

  await t.test('a burrowed mole cannot be shot', async () => {
    const res = await page.eval(`(() => {
      const g = window.game;
      const mole = g._spawn('mole');
      mole.burrowed = true;
      const hp = mole.hp;
      g.damage(mole, 5000);
      const untouched = mole.hp === hp;
      mole.burrowed = false;
      g.damage(mole, 5);
      const hittable = mole.hp < hp;
      mole.alive = false;
      return { untouched, hittable };
    })()`);
    assert.equal(res.untouched, true, 'underground means untouchable');
    assert.equal(res.hittable, true, 'above ground it takes damage again');
  });

  await t.test('a mole really does dive and resurface over time', async () => {
    await page.eval("window.__mole = window.game._spawn('mole'), window.__mole.burrowT = 0, window.game.setSpeed(2)");
    await page.waitFor('window.__mole.burrowed === true', 30000);
    await page.waitFor('window.__mole.burrowed === false', 30000);
    await page.eval('window.__mole.alive = false');
  });

  await t.test('no console errors', async () => {
    assert.deepEqual(page.consoleErrors, []);
  });
});
