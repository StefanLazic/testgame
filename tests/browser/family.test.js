// The late game: one-of-a-kind Mimi-chan, Simba-kun's katana, and the family
// bosses of waves 40 and 50. All of it is driven live in a real browser.
import test from 'node:test';
import assert from 'node:assert/strict';
import { startServer } from '../helpers/server.mjs';
import { launchBrowser } from '../helpers/cdp.mjs';

// Drop `n` free cats of a kind on buildable tiles next to the lane.
const PLACE = (kind, n) => `(() => {
  const g = window.game;
  let placed = 0;
  for (let r = 0; r < 40 && placed < ${n}; r++) {
    for (let c = 0; c < 40 && placed < ${n}; c++) {
      const key = c + ',' + r;
      if (g.pathTiles.has(key) || g.occupied.has(key)) continue;
      g.gold = 999999;
      g.placeTower('${kind}', { col: c, row: r, key });
      placed++;
    }
  }
  return g.towers.length;
})()`;

test('the family and the samurai', { concurrency: 1 }, async (t) => {
  const server = await startServer();
  const browser = await launchBrowser({ width: 390, height: 780 });
  const page = await browser.newPage();
  t.after(async () => { await browser.close(); await server.close(); });

  await page.goto(server.origin);
  await page.waitFor(() => !!window.game);
  await page.tapSelector('#btn-play');
  await page.waitFor(() => window.game.phase === 'prep');

  await t.test('there can only ever be one Mimi-chan on the table', async () => {
    const res = await page.eval(`(() => {
      const g = window.game;
      g.towers.slice().forEach((tw) => g._destroyTower(tw));
      g.gold = 999999;
      const spots = [];
      for (let r = 0; r < 40 && spots.length < 2; r++) {
        for (let c = 0; c < 40 && spots.length < 2; c++) {
          const key = c + ',' + r;
          if (g.pathTiles.has(key) || g.occupied.has(key)) continue;
          spots.push({ col: c, row: r, key });
        }
      }
      g.placeTower('queen', spots[0]);
      const afterFirst = g.towers.filter((tw) => tw.kind === 'queen').length;
      g.placeTower('queen', spots[1]);
      const afterSecond = g.towers.filter((tw) => tw.kind === 'queen').length;
      g.ui.refreshShop();
      const locked = document.querySelector('[data-kind="queen"]').classList.contains('locked');
      g.towers.slice().forEach((tw) => g._destroyTower(tw));
      g.ui.refreshShop();
      const unlocked = !document.querySelector('[data-kind="queen"]').classList.contains('locked');
      return { afterFirst, afterSecond, locked, unlocked };
    })()`);
    assert.equal(res.afterFirst, 1);
    assert.equal(res.afterSecond, 1, 'a second Mimi-chan must be refused');
    assert.equal(res.locked, true, 'the shop button locks once she is placed');
    assert.equal(res.unlocked, true, 'and unlocks again if she is lost');
  });

  await t.test('Simba-kun stands on the table with a katana', async () => {
    const res = await page.eval(`(() => {
      const g = window.game;
      g.towers.slice().forEach((tw) => g._destroyTower(tw));
      g.gold = 999999;
      let spot = null;
      for (let r = 0; r < 40 && !spot; r++) {
        for (let c = 0; c < 40 && !spot; c++) {
          const key = c + ',' + r;
          if (!g.pathTiles.has(key) && !g.occupied.has(key)) spot = { col: c, row: r, key };
        }
      }
      g.placeTower('simba', spot);
      const tw = g.towers[g.towers.length - 1];
      window.__simba = tw;
      return {
        kind: tw.kind,
        meshes: tw.group.children.length,
        blade: !!tw.group.userData.blade,
        bushidoT: tw.bushidoT,
      };
    })()`);
    assert.equal(res.kind, 'simba');
    assert.ok(res.meshes > 5, 'the samurai needs a body, armour and a sword');
    assert.equal(res.blade, true, 'his katana must be part of the model');
    assert.ok(res.bushidoT > 0, 'his strike starts on cooldown');
  });

  await t.test('bushido cuts and stuns every pest around him', async () => {
    const res = await page.eval(`(() => {
      const g = window.game;
      const tw = window.__simba;
      const st = g._stats(tw);
      const pests = [];
      for (let i = 0; i < 3; i++) {
        const e = g._spawn('mouse');
        e.group.position.copy(tw.pos);
        e.pos.set(tw.pos.x, 0, tw.pos.z);
        e.stunT = 0;
        e.hp = e.maxHp = 100000;
        pests.push(e);
      }
      tw.bushidoT = 0;
      g._updateBushido(tw, st, 0.016, 1);
      const out = {
        hurt: pests.every((e) => e.hp < e.maxHp),
        stunned: pests.every((e) => e.stunT > 0),
        reset: tw.bushidoT,
      };
      pests.forEach((e) => { e.alive = false; });
      g.enemies.forEach((e) => { e.alive = false; });
      return out;
    })()`);
    assert.equal(res.hurt, true, 'everything in reach should be cut');
    assert.equal(res.stunned, true, 'and staggered');
    assert.ok(res.reset > 1, 'the strike goes back on cooldown');
  });

  await t.test('Simona arrives with a cinematic and copies herself', async () => {
    const res = await page.eval(`(() => {
      const g = window.game;
      g.enemies.slice().forEach((e) => { e.alive = false; });
      const e = g._spawn('simona');
      window.__simona = e;
      e.intro = null;
      e.cloneT = 999;
      g._simonaClone(e);
      const clones = g.enemies.filter((c) => c.kind === 'simonaclone' && c.alive);
      return {
        boss: e.def.boss,
        icon: document.querySelector('#cinematic .cine-dragon').textContent,
        clones: clones.length,
        share: clones[0] ? clones[0].maxHp / e.maxHp : 0,
        full: clones[0] ? clones[0].hp / clones[0].maxHp : 0,
      };
    })()`);
    assert.equal(res.boss, 'main');
    assert.equal(res.icon, '🤸');
    assert.equal(res.clones, 1);
    assert.ok(res.share > 0 && res.share < 1, 'a copy is a little smaller');
    assert.ok(Math.abs(res.full - 1) < 0.01, 'a healthy Simona makes a healthy copy');
  });

  await t.test('a wounded Simona only makes wounded copies', async () => {
    const share = await page.eval(`(() => {
      const g = window.game;
      const e = window.__simona;
      g.enemies.filter((c) => c.kind === 'simonaclone').forEach((c) => { c.alive = false; });
      e.hp = e.maxHp * 0.4;
      g._simonaClone(e);
      const clone = g.enemies.filter((c) => c.kind === 'simonaclone' && c.alive).pop();
      return clone.hp / clone.maxHp;
    })()`);
    assert.ok(Math.abs(share - 0.4) < 0.02, 'a copy keeps the same health fraction');
  });

  await t.test('her handstand soaks 90% of the damage', async () => {
    const res = await page.eval(`(() => {
      const g = window.game;
      const e = window.__simona;
      e.hp = e.maxHp;
      e.guardT = 0;
      g.damage(e, 10000);
      const open = e.maxHp - e.hp;
      e.hp = e.maxHp;
      g._simonaHandstand(e);
      g.damage(e, 10000);
      const guarded = e.maxHp - e.hp;
      return { open, guarded, guarding: e.guardT > 0 };
    })()`);
    assert.equal(res.guarding, true);
    assert.ok(res.guarded < res.open * 0.2, 'upside down she barely feels it');
  });

  await t.test('her star jump throws her forward but never into the bowl', async () => {
    const res = await page.eval(`(() => {
      const g = window.game;
      const e = window.__simona;
      e.guardT = 0;
      const before = e.progress;
      g._simonaStar(e);
      const gained = e.progress - before;
      let total = 0;
      for (let i = 1; i < e.route.length; i++) total += e.route[i].distanceTo(e.route[i - 1]);
      e.progress = total;
      g._simonaStar(e);
      return { gained, capped: e.progress <= total + 0.001, seg: e.seg };
    })()`);
    assert.ok(res.gained > 0, 'the cartwheel has to cover ground');
    assert.equal(res.capped, true, 'a star jump can never finish the lane');
  });

  await t.test('killing Simona brings Stefo onto the court', async () => {
    const res = await page.eval(`(() => {
      const g = window.game;
      g.phase = 'running';
      g.damage(window.__simona, 9e9);
      const stefo = g.enemies.filter((e) => e.kind === 'stefo' && e.alive).pop();
      window.__stefo = stefo;
      return { spawned: !!stefo, stationary: !!(stefo && stefo.def.stationary) };
    })()`);
    assert.equal(res.spawned, true, 'her brother checks in when she goes down');
    assert.equal(res.stationary, true, 'he does not walk to the bowl');
  });

  await t.test('Stefo teleports to a new spot every time', async () => {
    const res = await page.eval(`(() => {
      const g = window.game;
      const e = window.__stefo;
      e.intro = null;
      const seen = [];
      for (let i = 0; i < 6; i++) { g._stefoTeleport(e); seen.push(e.spotKey); }
      return { seen, repeats: seen.filter((k, i) => i > 0 && k === seen[i - 1]).length };
    })()`);
    assert.equal(res.seen.length, 6);
    assert.equal(res.repeats, 0, 'he never blinks onto the tile he is already on');
  });

  await t.test('every basket he sinks costs a life', async () => {
    const res = await page.eval(`(() => {
      const g = window.game;
      const e = window.__stefo;
      const lives = g.lives;
      g._stefoShoot(e);
      const shot = g.hazards[g.hazards.length - 1];
      shot.t = shot.dur;
      g._updateHazards(0.016);
      return { lost: lives - g.lives, gone: !g.hazards.includes(shot) };
    })()`);
    assert.equal(res.lost, 1, 'a basket costs exactly one life');
    assert.equal(res.gone, true, 'the ball is cleaned up after it lands');
  });

  await t.test('Father flattens half the table on arrival', async () => {
    await page.eval(PLACE('archer', 8));
    const res = await page.eval(`(() => {
      const g = window.game;
      g.enemies.slice().forEach((e) => { e.alive = false; });
      const before = g.towers.length;
      const e = g._spawn('father');
      window.__father = e;
      e.intro = e.introDur;
      g._fatherEntrance(e, 0.016);
      return { before, after: g.towers.length, icon: document.querySelector('#cinematic .cine-dragon').textContent };
    })()`);
    assert.equal(res.icon, '💥');
    assert.equal(res.after, res.before - Math.round(res.before * 0.5), 'half the cats are gone');
  });

  await t.test('"I AM THE BOSS" heals him and takes more cats with it', async () => {
    await page.eval(PLACE('archer', 8));
    const res = await page.eval(`(() => {
      const g = window.game;
      const e = window.__father;
      const before = g.towers.length;
      g.damage(e, 9e9);
      return {
        alive: e.alive,
        hp: e.hp / e.maxHp,
        revives: e.revivesLeft,
        before,
        after: g.towers.length,
      };
    })()`);
    assert.equal(res.alive, true, 'he refuses to fall the first time');
    assert.equal(res.hp, 1, 'and heals all the way back up');
    assert.equal(res.revives, 0);
    assert.ok(res.after < res.before, 'the revive costs you more cats');
  });

  await t.test('the second time, he stays down', async () => {
    const alive = await page.eval(`(() => {
      const g = window.game;
      g.damage(window.__father, 9e9);
      return window.__father.alive;
    })()`);
    assert.equal(alive, false);
  });

  await t.test('no console errors', async () => {
    assert.deepEqual(page.consoleErrors, []);
  });
});
