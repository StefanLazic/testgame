import * as THREE from 'three';
import {
  TILE, COLS, ROWS, PATH, START_LIVES, START_GOLD, PREP_TIME, FIRST_PREP,
  TOWERS, MAX_LEVEL, upgradeCost, towerStats, ENEMIES, hpScale, WAVES, waveBonus,
} from './config.js';
import {
  makeCatTower, makeEnemy, makeMap, makeMouseHole, makeMilkBowl, makeRangeRing,
  makeGhostTile, makeBullet, makeCatnipDrop, makeStars, tileToWorld,
} from './models.js';
import { Effects } from './fx.js';
import { sfx } from './audio.js';

const UP = new THREE.Vector3(0, 1, 0);
const GROUND = new THREE.Plane(UP, 0);
const FLY_Y = 3.6;
const TOWER_SCALE = 1.25;   // cats are bigger than a floor tile is wide

export class Game {
  constructor(canvas, ui) {
    this.canvas = canvas;
    this.ui = ui;

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setClearColor(0x140a24, 1);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0x140a24, 46, 96);
    this.camera = new THREE.PerspectiveCamera(52, 1, 0.1, 300);

    this._buildWorld();

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.effects = new Effects(this.scene);

    this.towers = [];
    this.enemies = [];
    this.bullets = [];
    this.drops = [];
    this.enemyPool = {};

    this.placing = null;       // tower kind selected in the shop
    this.selected = null;      // placed tower currently inspected
    this.speed = 1;
    this.phase = 'idle';
    this.frenzy = 0;

    this._bindPointer();
    window.addEventListener('resize', () => this.resize());
    this.resize();

    this.clock = new THREE.Clock();
    this.renderer.setAnimationLoop(() => this._frame());
    this.startDemo();
  }

  // ------------------------------------------------------------------ world
  _buildWorld() {
    const scene = this.scene;

    scene.add(new THREE.HemisphereLight(0xffd9f5, 0x2a1a46, 1.15));
    const key = new THREE.DirectionalLight(0xfff0e0, 1.5);
    key.position.set(14, 26, 12);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    const d = 26;
    key.shadow.camera.left = -d; key.shadow.camera.right = d;
    key.shadow.camera.top = d; key.shadow.camera.bottom = -d;
    key.shadow.camera.far = 80;
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x9a7bff, 0.7);
    rim.position.set(-16, 12, -14);
    scene.add(rim);

    // Path tiles + world-space waypoints
    this.pathTiles = new Set();
    this.waypoints = [];
    for (let i = 0; i < PATH.length; i++) {
      const [c, r] = PATH[i];
      this.waypoints.push(tileToWorld(c, r));
      if (i === 0) { this.pathTiles.add(`${c},${r}`); continue; }
      const [pc, pr] = PATH[i - 1];
      const dc = Math.sign(c - pc);
      const dr = Math.sign(r - pr);
      let cc = pc, rr = pr;
      while (cc !== c || rr !== r) {
        cc += dc; rr += dr;
        this.pathTiles.add(`${cc},${rr}`);
      }
    }

    scene.add(makeMap(this.pathTiles));
    scene.add(makeStars());

    const startP = this.waypoints[0];
    const hole = makeMouseHole();
    hole.position.set(startP.x - TILE * 0.6, 0, startP.z);
    hole.rotation.y = -Math.PI / 2;
    scene.add(hole);

    this.goal = this.waypoints[this.waypoints.length - 1].clone();
    this.bowl = makeMilkBowl();
    this.bowl.position.copy(this.goal);
    scene.add(this.bowl);

    this.ghost = makeGhostTile();
    this.ghost.visible = false;
    scene.add(this.ghost);
    this.ghostRing = makeRangeRing(1);
    this.ghostRing.visible = false;
    scene.add(this.ghostRing);
    this.selRing = makeRangeRing(1);
    this.selRing.visible = false;
    scene.add(this.selRing);

    this.occupied = new Map(); // "c,r" -> tower
  }

  resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this._fitCamera(w, h);
  }

  // Frame the whole board for any screen shape by projecting its corners and
  // binary-searching the camera distance, then panning so the margins match
  // (HUD chips at the top, shop bar at the bottom).
  _fitCamera(w, h) {
    const portrait = h >= w;
    const halfW = ((COLS + 1.6) * TILE) / 2;
    const halfD = ((ROWS + 1.6) * TILE) / 2;
    const corners = [];
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        corners.push(new THREE.Vector3(sx * halfW, 0, sz * halfD));
        corners.push(new THREE.Vector3(sx * halfW, FLY_Y, sz * halfD));
      }
    }
    const topPx = 58;
    const botPx = portrait ? 132 : 96;
    const topLimit = 1 - (topPx / h) * 2;
    const botLimit = -1 + (botPx / h) * 2;
    const pitch = portrait ? 1.14 : 0.72;
    const dir = new THREE.Vector3(0, Math.sin(pitch), Math.cos(pitch));

    let tz = 0;
    let dist = 60;
    const place = (d, targetZ) => {
      this.camera.position.copy(dir).multiplyScalar(d).add(new THREE.Vector3(0, 0, targetZ));
      this.camera.lookAt(0, 0, targetZ);
      this.camera.updateMatrixWorld();
    };
    const extents = () => {
      let minY = Infinity, maxY = -Infinity, maxX = 0;
      for (const c of corners) {
        const p = c.clone().project(this.camera);
        minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
        maxX = Math.max(maxX, Math.abs(p.x));
      }
      return { minY, maxY, maxX };
    };

    for (let iter = 0; iter < 8; iter++) {
      let lo = 12, hi = 220;
      for (let i = 0; i < 26; i++) {
        const mid = (lo + hi) / 2;
        place(mid, tz);
        const e = extents();
        const fits = e.maxX <= 0.985 && e.maxY <= topLimit && e.minY >= botLimit;
        if (fits) hi = mid; else lo = mid;
      }
      dist = hi;
      place(dist, tz);
      const e = extents();
      // Re-centre vertically inside the free area.
      const drift = ((topLimit - e.maxY) - (e.minY - botLimit)) / 2;
      if (Math.abs(drift) < 0.004) break;
      tz += drift * 12;
    }

    place(dist, tz);
    this.camBase = this.camera.position.clone();
    this.camTarget = new THREE.Vector3(0, 0, tz);
  }

  // ---------------------------------------------------------------- pointer
  _bindPointer() {
    const c = this.canvas;
    let downXY = null;
    const toNDC = (e) => {
      this.pointer.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
    };
    c.addEventListener('pointerdown', (e) => {
      downXY = { x: e.clientX, y: e.clientY };
      toNDC(e);
      if (this.placing) this._updateGhost();
    });
    c.addEventListener('pointermove', (e) => {
      if (!this.placing) return;
      if (e.pointerType === 'mouse' || downXY) { toNDC(e); this._updateGhost(); }
    });
    c.addEventListener('pointerup', (e) => {
      const moved = downXY ? Math.hypot(e.clientX - downXY.x, e.clientY - downXY.y) : 0;
      downXY = null;
      if (moved > 24) { this.ghost.visible = false; this.ghostRing.visible = false; return; }
      toNDC(e);
      this._tap();
    });
    c.addEventListener('pointercancel', () => { downXY = null; });
  }

  _groundPoint() {
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hit = new THREE.Vector3();
    return this.raycaster.ray.intersectPlane(GROUND, hit) ? hit : null;
  }

  _tileAt(p) {
    if (!p) return null;
    const col = Math.round(p.x / TILE + (COLS - 1) / 2);
    const row = Math.round(p.z / TILE + (ROWS - 1) / 2);
    if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return null;
    return { col, row, key: `${col},${row}` };
  }

  _buildable(tile) {
    return !!tile && !this.pathTiles.has(tile.key) && !this.occupied.has(tile.key);
  }

  _updateGhost() {
    const tile = this._tileAt(this._groundPoint());
    const ok = this._buildable(tile) && this.gold >= TOWERS[this.placing].cost;
    this.ghost.visible = !!tile;
    this.ghostRing.visible = !!tile;
    if (!tile) return;
    const p = tileToWorld(tile.col, tile.row);
    this.ghost.position.set(p.x, 0.08, p.z);
    this.ghostRing.position.set(p.x, 0.09, p.z);
    this.ghostRing.scale.setScalar(TOWERS[this.placing].range);
    const color = ok ? 0x9dffd8 : 0xff6b6b;
    this.ghost.material.color.setHex(color);
    this.ghostRing.material.color.setHex(color);
  }

  _tap() {
    const p = this._groundPoint();
    const tile = this._tileAt(p);

    if (this.placing) {
      if (this._buildable(tile)) this.placeTower(this.placing, tile);
      else { sfx.deny(); this.ui.toast('Can’t build there'); }
      return;
    }

    // Catnip pickup beats tower selection.
    if (p) {
      for (const drop of this.drops) {
        if (drop.group.position.distanceTo(p) < 2.2) { this._takeCatnip(drop); return; }
      }
    }

    const tower = tile && this.occupied.get(tile.key);
    if (tower) this.selectTower(tower);
    else this.selectTower(null);
  }

  // ------------------------------------------------------------------ flow
  // A little self-playing diorama behind the title screen: a few cats already
  // on duty, an endless trickle of mice, nothing at stake.
  startDemo() {
    this.lives = START_LIVES;
    this.gold = 0;
    this.wave = 1;
    this.kills = 0;
    this.phase = 'demo';
    this.demoTimer = 0;
    const spots = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const key = `${c},${r}`;
        if (this.pathTiles.has(key)) continue;
        let adj = 0;
        for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (this.pathTiles.has(`${c + dc},${r + dr}`)) adj++;
        if (adj) spots.push({ col: c, row: r, key });
      }
    }
    const kinds = ['archer', 'wizard', 'frost', 'ninja', 'chef'];
    for (const kind of kinds) {
      const spot = spots.splice(Math.floor(Math.random() * spots.length), 1)[0];
      if (!spot) break;
      this.gold = TOWERS[kind].cost;
      this.placeTower(kind, spot);
    }
    this.gold = 0;
  }

  start() {
    // Reset everything for a fresh run.
    for (const t of this.towers) this.scene.remove(t.group);
    for (const e of this.enemies) this.scene.remove(e.group);
    for (const b of this.bullets) this.scene.remove(b.mesh);
    for (const d of this.drops) this.scene.remove(d.group);
    this.towers = []; this.enemies = []; this.bullets = []; this.drops = [];
    this.occupied.clear();

    this.lives = START_LIVES;
    this.gold = START_GOLD;
    this.wave = 0;
    this.kills = 0;
    this.frenzy = 0;
    this.spawnQueue = [];
    this.waveTimer = FIRST_PREP;
    this.phase = 'prep';
    this.selectTower(null);
    this.setPlacing(null);
    this.speed = 1;
    this.boss = null;

    this.ui.setGold(this.gold);
    this.ui.setLives(this.lives);
    this.ui.setWave(1);
    this.ui.setSpeed(1);
    this.ui.boss(null);
    this.ui.setPhase('prep', this.waveTimer);
    this.ui.toast('Build your defense!');
  }

  setSpeed(mult) {
    this.speed = mult;
    this.ui.setSpeed(mult);
  }

  setPlacing(kind) {
    this.placing = kind;
    this.ghost.visible = false;
    this.ghostRing.visible = false;
    if (kind) this.selectTower(null);
    this.ui.setPlacing(kind);
  }

  selectTower(tower) {
    this.selected = tower;
    if (!tower) {
      this.selRing.visible = false;
      this.ui.showTower(null);
      return;
    }
    const st = towerStats(tower.kind, tower.level);
    this.selRing.visible = true;
    this.selRing.position.set(tower.group.position.x, 0.1, tower.group.position.z);
    this.selRing.scale.setScalar(st.range);
    this.ui.showTower(this._towerInfo(tower));
  }

  _towerInfo(tower) {
    const base = TOWERS[tower.kind];
    const st = towerStats(tower.kind, tower.level);
    const maxed = tower.level >= MAX_LEVEL;
    return {
      kind: tower.kind, icon: base.icon, name: base.name, level: tower.level, maxed,
      damage: Math.round(st.damage), range: st.range.toFixed(1), rate: st.rate.toFixed(2),
      blurb: base.blurb,
      upCost: maxed ? 0 : upgradeCost(tower.kind, tower.level),
      sellValue: Math.floor(tower.spent * 0.7),
      canAfford: !maxed && this.gold >= upgradeCost(tower.kind, tower.level),
    };
  }

  placeTower(kind, tile) {
    const cost = TOWERS[kind].cost;
    if (this.gold < cost) { sfx.deny(); this.ui.toast('Not enough fish'); return; }
    this.gold -= cost;
    this.ui.setGold(this.gold);

    const model = makeCatTower(kind, TOWERS[kind]);
    const p = tileToWorld(tile.col, tile.row);
    model.group.position.set(p.x, 0.06, p.z);
    model.group.rotation.y = Math.atan2(this.goal.x - p.x, this.goal.z - p.z);
    this.scene.add(model.group);

    const tower = {
      kind, level: 1, spent: cost, tile: tile.key,
      group: model.group, head: model.head, arm: model.arm, body: model.body,
      cool: 0, recoil: 0, pos: new THREE.Vector3(p.x, 0.9, p.z), pop: 0,
    };
    this.towers.push(tower);
    this.occupied.set(tile.key, tower);
    this.effects.ring(p, { color: 0x9dffd8, from: 0.3, to: 2.4, life: 0.4 });
    this.effects.burst(new THREE.Vector3(p.x, 0.6, p.z), { count: 10, color: 0xfff0d8, speed: 3, size: 0.35 });
    sfx.place();

    this.ghost.visible = false;
    this.ghostRing.visible = false;
    if (this.gold < cost) this.setPlacing(null);
    this.ui.setGold(this.gold);
  }

  upgradeSelected() {
    const t = this.selected;
    if (!t || t.level >= MAX_LEVEL) return;
    const cost = upgradeCost(t.kind, t.level);
    if (this.gold < cost) { sfx.deny(); this.ui.toast('Not enough fish'); return; }
    this.gold -= cost;
    t.spent += cost;
    t.level++;
    t.pop = 0.4;
    t.group.scale.setScalar(TOWER_SCALE + (t.level - 1) * 0.1);
    // Visible upgrade: a golden collar per level.
    const collar = new THREE.Mesh(
      new THREE.TorusGeometry(0.3, 0.055, 6, 14),
      new THREE.MeshLambertMaterial({ color: 0xffd166, emissive: 0x6b5200 })
    );
    collar.position.set(0, 0.7 + (t.level - 2) * 0.08, 0.06);
    collar.rotation.x = Math.PI / 2.1;
    t.group.add(collar);
    this.effects.ring(t.group.position, { color: 0xffd166, from: 0.3, to: 2.6, life: 0.45 });
    this.effects.burst(t.pos, { count: 14, color: 0xffd166, speed: 4, size: 0.4 });
    sfx.upgrade();
    this.ui.setGold(this.gold);
    this.selectTower(t);
  }

  sellSelected() {
    const t = this.selected;
    if (!t) return;
    const refund = Math.floor(t.spent * 0.7);
    this.gold += refund;
    this.occupied.delete(t.tile);
    this.towers.splice(this.towers.indexOf(t), 1);
    this.scene.remove(t.group);
    this.effects.burst(t.pos, { count: 12, color: 0xff9ec4, speed: 3.4, size: 0.4 });
    sfx.sell();
    this.ui.setGold(this.gold);
    this.ui.toast(`Sold for 🐟 ${refund}`);
    this.selectTower(null);
  }

  startWaveNow() {
    if (this.phase !== 'prep') return;
    const bonus = Math.floor(Math.max(0, this.waveTimer) * 3);
    if (bonus > 0) {
      this.gold += bonus;
      this.ui.setGold(this.gold);
      this.ui.toast(`Early bird: +🐟 ${bonus}`);
    }
    this._beginWave();
  }

  _beginWave() {
    this.wave++;
    const def = WAVES[this.wave - 1];
    this.phase = 'running';
    this.spawnQueue = [];
    for (const [kind, count, gap, delay] of def.groups) {
      for (let i = 0; i < count; i++) this.spawnQueue.push({ kind, time: delay + i * gap });
    }
    // Surprise: a golden mouse sneaks in with most waves. Big bounty, very fast.
    if (this.wave >= 2 && Math.random() < 0.75) {
      const last = this.spawnQueue[this.spawnQueue.length - 1].time;
      this.spawnQueue.push({ kind: 'golden', time: Math.random() * last * 0.8 + 1 });
    }
    this.spawnQueue.sort((a, b) => a.time - b.time);
    this.waveClock = 0;
    this.ui.setWave(this.wave);
    this.ui.setPhase('running');
    this.ui.banner(`Wave ${this.wave}`, def.name);
    sfx.wave();
  }

  _endWave() {
    const bonus = waveBonus(this.wave);
    this.gold += bonus;
    this.ui.setGold(this.gold);
    this.ui.toast(`Wave cleared! +🐟 ${bonus}`);
    sfx.waveClear();
    this.boss = null;
    this.ui.boss(null);

    if (this.wave >= WAVES.length) {
      this.phase = 'over';
      this.ui.gameOver(true, this.wave, this.kills);
      sfx.victory();
      return;
    }
    this.phase = 'prep';
    this.waveTimer = PREP_TIME;
    this.ui.setPhase('prep', this.waveTimer);
    const next = this.wave + 1;
    if (next === 5) setTimeout(() => this.ui.toast('⚠️ Wave 5: a mini-boss is coming'), 1800);
    if (next === 10) setTimeout(() => this.ui.toast('⚠️ Wave 10: THE RAT KING approaches'), 1800);
  }

  // --------------------------------------------------------------- spawning
  _spawn(kind) {
    const def = ENEMIES[kind];
    const pooled = (this.enemyPool[kind] || []).pop();
    const model = pooled || makeEnemy(kind);
    const g = model.group;
    g.visible = true;
    g.scale.setScalar(def.scale);
    this.scene.add(g);

    const start = this.waypoints[0].clone();
    start.x -= TILE * 0.4;
    const hp = def.hp * (def.boss ? 1 : hpScale(this.wave));
    const e = {
      kind, def, model, group: g,
      hp, maxHp: hp,
      speed: def.speed * (def.boss ? 1 : 1 + 0.012 * this.wave),
      flying: !!def.flying,
      seg: 1, progress: 0, alive: true,
      slowT: 0, slowF: 0, hurt: 0, wobble: Math.random() * 6,
      spawnT: 0, spawnTimer: 3.5, enraged: false,
    };
    e.pos = start;
    if (e.flying) {
      e.route = [start.clone(), this.goal.clone()];
      g.position.set(start.x, FLY_Y, start.z);
    } else {
      e.route = this.waypoints;
      g.position.copy(start);
    }
    e.bar = this._makeBar();
    g.add(e.bar.group);
    e.bar.group.position.y = (e.flying ? 1.5 : 1.5) * (def.boss ? 1.2 : 1);
    this.enemies.push(e);

    if (def.boss) {
      this.boss = e;
      this.ui.boss(1, def.name.toUpperCase());
      this.ui.banner(def.boss === 'main' ? '👑 THE RAT KING' : '🐶 MINI BOSS', def.name);
      this.effects.kick(0.9);
      sfx.boss();
    }
    return e;
  }

  _makeBar() {
    const group = new THREE.Group();
    const bg = new THREE.Sprite(new THREE.SpriteMaterial({ color: 0x2a0f1c, depthTest: false, transparent: true, opacity: 0.85 }));
    bg.scale.set(1.1, 0.16, 1);
    const fg = new THREE.Sprite(new THREE.SpriteMaterial({ color: 0x6bff9a, depthTest: false, transparent: true }));
    fg.center.set(0, 0.5);
    fg.position.set(-0.53, 0, 0.01);
    fg.scale.set(1.06, 0.12, 1);
    group.add(bg, fg);
    group.visible = false;
    group.renderOrder = 20;
    return { group, fg };
  }

  _despawn(e, index) {
    e.alive = false;
    this.scene.remove(e.group);
    e.group.remove(e.bar.group);
    (this.enemyPool[e.kind] ||= []).push(e.model);
    this.enemies.splice(index, 1);
    if (this.boss === e) { this.boss = null; this.ui.boss(null); }
  }

  // ---------------------------------------------------------------- combat
  damage(e, amount, { crit = false } = {}) {
    if (!e.alive) return;
    const armor = e.def.armor || 0;
    const dealt = Math.max(amount * 0.25, amount - armor);
    e.hp -= dealt;
    e.hurt = 0.12;
    if (crit) this.effects.burst(e.group.position.clone().setY(e.group.position.y + 0.6), { count: 6, color: 0xffe066, speed: 4, size: 0.3, life: 0.4 });
    if (e.hp <= 0) this._kill(e);
  }

  _kill(e) {
    if (!e.alive) return;
    e.alive = false; // removed in the update sweep
    if (this.phase === 'demo') {
      this.effects.burst(e.group.position.clone().setY(0.6), { count: 10, color: 0xff8ab0, speed: 4, size: 0.35 });
      sfx.pop();
      return;
    }
    const bounty = Math.round(e.def.bounty * (1 + 0.02 * this.wave));
    this.gold += bounty;
    this.kills++;
    this.ui.setGold(this.gold, true);
    const p = e.group.position.clone();
    this.effects.burst(p.clone().setY(p.y + 0.5), {
      count: e.def.boss ? 40 : 12, color: e.def.golden ? 0xffd166 : 0xff8ab0,
      speed: e.def.boss ? 9 : 4.5, size: e.def.boss ? 0.7 : 0.4,
    });
    if (e.def.boss) {
      this.effects.ring(p, { color: 0xffd166, from: 0.5, to: 14, life: 0.9 });
      this.effects.kick(1.2);
      sfx.bossDown();
      this.ui.toast(`${e.def.name} defeated! +🐟 ${bounty}`);
    } else {
      sfx.pop();
    }
    if (e.def.golden) { this.ui.toast(`Golden mouse! +🐟 ${bounty}`); sfx.coin(); }
    // Catnip drops: guaranteed from bosses, rare otherwise.
    if (e.def.boss || Math.random() < 0.035) this._dropCatnip(p);
  }

  _dropCatnip(pos) {
    const group = makeCatnipDrop();
    group.position.copy(pos).setY(0);
    this.scene.add(group);
    this.drops.push({ group, life: 14, t: 0 });
    this.ui.toast('🌿 Catnip! Tap it!');
  }

  _takeCatnip(drop) {
    this.scene.remove(drop.group);
    this.drops.splice(this.drops.indexOf(drop), 1);
    this.frenzy = 9;
    this.ui.toast('🌿 CATNIP FRENZY — double speed claws!');
    this.effects.ring(drop.group.position, { color: 0x8dff5a, from: 0.4, to: 18, life: 0.8 });
    sfx.catnip();
  }

  _fire(tower, target) {
    const st = towerStats(tower.kind, tower.level);
    const from = tower.pos.clone().setY(1.15);
    const mesh = makeBullet(st.bullet);
    mesh.position.copy(from);
    this.scene.add(mesh);
    const crit = st.crit ? Math.random() < st.crit : false;
    const b = {
      mesh, from, target, speed: st.speed, lob: !!st.lob,
      damage: st.damage * (crit ? 3 : 1), crit,
      splash: st.splash || 0, slow: st.slow || 0, slowTime: st.slowTime || 0,
      color: st.bullet === 'shard' ? 0xbdeaff : st.bullet === 'orb' ? 0xc9a7ff : 0xffd166,
      t: 0, life: 3, type: st.bullet,
      to: target.group.position.clone().setY(target.flying ? FLY_Y : 0.5),
    };
    if (b.lob) b.dur = Math.max(0.35, from.distanceTo(b.to) / st.speed);
    this.bullets.push(b);
    tower.recoil = 1;
    sfx.shoot(tower.kind);
  }

  _impact(b, at) {
    this.effects.burst(at, {
      count: b.splash ? 14 : 6, color: b.color, speed: b.splash ? 6 : 3,
      size: b.splash ? 0.55 : 0.3, life: 0.4, gravity: -3,
    });
    if (b.splash) {
      this.effects.ring(at, { color: b.color, from: 0.3, to: b.splash * 2, life: 0.35, y: at.y });
      if (b.type === 'pan') { this.effects.kick(0.2); sfx.boom(); }
      for (const e of this.enemies) {
        if (!e.alive) continue;
        if (e.group.position.distanceTo(at) > b.splash) continue;
        this.damage(e, b.damage * 0.8);
        this._applySlow(e, b);
      }
    } else if (b.target && b.target.alive && b.target.group.position.distanceTo(at) < 1.4) {
      this.damage(b.target, b.damage, { crit: b.crit });
      this._applySlow(b.target, b);
    }
  }

  _applySlow(e, b) {
    if (!b.slow || !e.alive) return;
    e.slowF = Math.max(e.slowF, b.slow);
    e.slowT = Math.max(e.slowT, b.slowTime);
  }

  // ----------------------------------------------------------------- frame
  _frame() {
    const raw = Math.min(this.clock.getDelta(), 0.05);
    if (this.phase === 'prep' || this.phase === 'running' || this.phase === 'demo') {
      const dt = raw * (this.phase === 'demo' ? 1 : this.speed);
      this.update(dt, raw);
    } else {
      this.effects.update(raw);
    }
    this._shakeCamera(raw);
    this.renderer.render(this.scene, this.camera);
  }

  _shakeCamera(dt) {
    const s = this.effects.shake;
    if (s > 0.001) {
      this.camera.position.set(
        this.camBase.x + (Math.random() - 0.5) * s,
        this.camBase.y + (Math.random() - 0.5) * s,
        this.camBase.z + (Math.random() - 0.5) * s
      );
    } else if (!this.camera.position.equals(this.camBase)) {
      this.camera.position.copy(this.camBase);
    }
  }

  update(dt, raw) {
    this.time = (this.time || 0) + dt;
    if (this.frenzy > 0) this.frenzy = Math.max(0, this.frenzy - dt);

    if (this.phase === 'demo') {
      this.demoTimer -= dt;
      if (this.demoTimer <= 0 && this.enemies.length < 8) {
        this.demoTimer = 0.9 + Math.random();
        this._spawn(['mouse', 'mouse', 'snake', 'bird'][Math.floor(Math.random() * 4)]);
      }
    } else if (this.phase === 'prep') {
      this.waveTimer -= dt;
      this.ui.setPhase('prep', this.waveTimer);
      if (this.waveTimer <= 0) this._beginWave();
    } else if (this.phase === 'running') {
      this.waveClock += dt;
      while (this.spawnQueue.length && this.spawnQueue[0].time <= this.waveClock) {
        this._spawn(this.spawnQueue.shift().kind);
      }
    }

    this._updateEnemies(dt);
    this._updateTowers(dt);
    this._updateBullets(dt);
    this._updateDrops(dt);
    this._animateScenery(dt);
    this.effects.update(raw);

    if (this.phase === 'running' && !this.spawnQueue.length && !this.enemies.length) this._endWave();
  }

  _updateEnemies(dt) {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      if (!e.alive) { this._despawn(e, i); continue; }

      if (e.slowT > 0) { e.slowT -= dt; if (e.slowT <= 0) e.slowF = 0; }
      let speed = e.speed * (1 - e.slowF);

      // Boss behaviours
      if (e.def.enrage && !e.enraged && e.hp < e.maxHp * 0.45) {
        e.enraged = true;
        e.speed *= 1.5;
        this.ui.toast('👑 The Rat King is ENRAGED!');
        this.effects.kick(1);
        sfx.boss();
      }
      if (e.def.howl) {
        e.spawnT += dt;
        if (e.spawnT > 6) {
          e.spawnT = 0;
          this.effects.ring(e.group.position, { color: 0xffb347, from: 0.5, to: 9, life: 0.6 });
          this.effects.kick(0.35);
          sfx.howl();
          this.ui.toast('🐶 Sir Barksalot howls — the pack speeds up!');
          for (const other of this.enemies) {
            if (other === e || !other.alive) continue;
            if (other.group.position.distanceTo(e.group.position) > 9) continue;
            other.slowF = 0; other.slowT = 0;
            other.rally = 3;
          }
        }
      }
      if (e.rally > 0) { e.rally -= dt; speed *= 1.45; }
      if (e.def.spawner) {
        e.spawnT += dt;
        if (e.spawnT > e.spawnTimer) {
          e.spawnT = 0;
          for (let k = 0; k < 3; k++) {
            const minion = this._spawn('mouse');
            minion.seg = e.seg;
            minion.progress = e.progress;
            minion.pos.copy(e.pos);
            minion.group.position.copy(e.group.position).setY(0);
            minion.speed *= 1.2;
          }
          this.effects.ring(e.group.position, { color: 0xff5b7f, from: 0.4, to: 5, life: 0.5 });
          sfx.squeak();
        }
      }

      // Move along the route
      const route = e.route;
      let step = speed * dt;
      while (step > 0 && e.seg < route.length) {
        const target = route[e.seg];
        const flat = new THREE.Vector3(target.x - e.pos.x, 0, target.z - e.pos.z);
        const dist = flat.length();
        if (dist <= step) {
          e.pos.set(target.x, 0, target.z);
          e.progress += dist;
          step -= dist;
          e.seg++;
        } else {
          flat.normalize();
          e.pos.addScaledVector(flat, step);
          e.progress += step;
          e.facing = Math.atan2(flat.x, flat.z);
          step = 0;
        }
      }
      if (e.seg >= route.length) { this._leak(e, i); continue; }

      const bob = Math.sin(this.time * 9 + e.wobble);
      e.group.position.set(e.pos.x, e.flying ? FLY_Y + Math.sin(this.time * 2.2 + e.wobble) * 0.35 : Math.abs(bob) * 0.09, e.pos.z);
      if (e.facing != null) {
        const cur = e.group.rotation.y;
        let diff = e.facing - cur;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        e.group.rotation.y = cur + diff * Math.min(1, dt * 10);
      }

      // Per-kind wiggle
      const legs = e.model.legs;
      if (e.kind === 'bird') {
        for (const wing of legs) wing.rotation.z = wing.userData.side * (0.5 + Math.sin(this.time * 14 + e.wobble) * 0.6);
      } else if (e.kind === 'snake') {
        legs.forEach((seg, k) => { seg.position.x = Math.sin(this.time * 8 + k * 0.9) * 0.16; });
      } else if (legs.length) {
        legs.forEach((leg, k) => { leg.position.y = 0.16 + Math.abs(Math.sin(this.time * 8 + k * 1.6)) * 0.06; });
      } else {
        e.group.position.y += Math.abs(bob) * 0.05;
      }
      if (e.model.head) e.model.head.rotation.z = Math.sin(this.time * 7 + e.wobble) * 0.08;

      // Health bar + hurt flash
      const ratio = Math.max(0, e.hp / e.maxHp);
      e.bar.group.visible = ratio < 0.999;
      e.bar.fg.scale.x = 1.06 * ratio;
      e.bar.fg.material.color.setHex(ratio > 0.55 ? 0x6bff9a : ratio > 0.25 ? 0xffd166 : 0xff5b5b);
      if (e.hurt > 0) {
        e.hurt -= dt;
        e.group.scale.setScalar(e.def.scale * (1 + e.hurt * 0.6));
      } else {
        e.group.scale.setScalar(e.def.scale * (e.slowF ? 0.94 : 1));
      }
      if (e.slowF && Math.random() < dt * 6) {
        this.effects.trail(e.group.position.clone().setY(e.group.position.y + 0.4), 0xbdeaff, 0.28);
      }
      if (this.boss === e) this.ui.boss(ratio, e.def.name.toUpperCase());
    }
  }

  _leak(e, i) {
    const cost = e.def.leak;
    this._despawn(e, i);
    if (this.phase === 'demo') return;
    if (cost <= 0) { this.ui.toast('The golden mouse got away!'); return; }
    this.lives = Math.max(0, this.lives - cost);
    this.ui.setLives(this.lives);
    this.ui.hitFlash();
    this.effects.ring(this.goal, { color: 0xff3b6b, from: 0.5, to: 5, life: 0.5 });
    this.effects.kick(0.5);
    sfx.leak();
    if (this.lives <= 0 && this.phase !== 'over') {
      this.phase = 'over';
      this.ui.boss(null);
      this.ui.gameOver(false, this.wave, this.kills);
      sfx.gameover();
    }
  }

  _updateTowers(dt) {
    const frenzy = this.frenzy > 0 ? 2 : 1;
    for (const t of this.towers) {
      const st = towerStats(t.kind, t.level);
      t.cool -= dt * st.rate * frenzy;
      const target = this._pickTarget(t, st);

      if (target) {
        const dir = Math.atan2(target.group.position.x - t.pos.x, target.group.position.z - t.pos.z);
        const cur = t.group.rotation.y;
        let diff = dir - cur;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        t.group.rotation.y = cur + diff * Math.min(1, dt * 8);
        if (t.cool <= 0) { t.cool = 1; this._fire(t, target); }
      } else {
        t.group.rotation.y += dt * 0.25;
      }
      t.cool = Math.max(t.cool, -1);

      // Idle life: breathing, recoil, spinning shuriken, glowing orbs.
      if (t.recoil > 0) t.recoil = Math.max(0, t.recoil - dt * 5);
      if (t.pop > 0) t.pop = Math.max(0, t.pop - dt);
      const breathe = 1 + Math.sin(this.time * 2.4 + t.pos.x) * 0.02;
      const s = (TOWER_SCALE + (t.level - 1) * 0.1) * breathe * (1 + t.pop * 0.5) * (this.frenzy > 0 ? 1.08 : 1);
      t.group.scale.set(s, s * (1 - t.recoil * 0.08), s);
      if (t.arm) t.arm.position.z = 0.28 - t.recoil * 0.18;
      const spin = t.group.userData.spin;
      if (spin) spin.rotation.y += dt * 14;
      const glow = t.group.userData.glow;
      if (glow) glow.scale.setScalar(0.2 + Math.sin(this.time * 4 + t.pos.z) * 0.03 + (this.frenzy > 0 ? 0.06 : 0));
    }
  }

  _pickTarget(t, st) {
    let best = null;
    let bestProgress = -1;
    for (const e of this.enemies) {
      if (!e.alive) continue;
      if (e.flying && !st.air) continue;
      const dx = e.group.position.x - t.pos.x;
      const dz = e.group.position.z - t.pos.z;
      if (dx * dx + dz * dz > st.range * st.range) continue;
      if (e.progress > bestProgress) { bestProgress = e.progress; best = e; }
    }
    return best;
  }

  _updateBullets(dt) {
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.t += dt;
      b.life -= dt;
      let done = false;

      if (b.lob) {
        const k = Math.min(1, b.t / b.dur);
        const p = b.from.clone().lerp(b.to, k);
        p.y += Math.sin(k * Math.PI) * 5;
        b.mesh.position.copy(p);
        b.mesh.rotation.x += dt * 9;
        b.mesh.rotation.z += dt * 6;
        if (k >= 1) done = true;
      } else {
        if (b.target && b.target.alive) b.to.copy(b.target.group.position).setY(b.target.flying ? FLY_Y : 0.5);
        const dir = b.to.clone().sub(b.mesh.position);
        const dist = dir.length();
        const step = b.speed * dt;
        if (dist <= step) { b.mesh.position.copy(b.to); done = true; }
        else {
          dir.normalize();
          b.mesh.position.addScaledVector(dir, step);
          if (b.type === 'arrow') b.mesh.lookAt(b.to);
          else if (b.type === 'star') b.mesh.rotation.y += dt * 30;
          else b.mesh.rotation.x += dt * 6;
          if (b.type !== 'arrow' && Math.random() < dt * 30) this.effects.trail(b.mesh.position.clone(), b.color, 0.22);
        }
      }

      if (done || b.life <= 0) {
        if (done) this._impact(b, b.mesh.position.clone());
        this.scene.remove(b.mesh);
        this.bullets.splice(i, 1);
      }
    }
  }

  _updateDrops(dt) {
    for (let i = this.drops.length - 1; i >= 0; i--) {
      const d = this.drops[i];
      d.t += dt;
      d.life -= dt;
      d.group.rotation.y += dt * 1.6;
      d.group.position.y = Math.sin(d.t * 3) * 0.18;
      d.group.visible = d.life > 3 || Math.sin(d.life * 14) > 0;
      if (Math.random() < dt * 4) this.effects.trail(d.group.position.clone().setY(0.7), 0x8dff5a, 0.24);
      if (d.life <= 0) { this.scene.remove(d.group); this.drops.splice(i, 1); }
    }
  }

  _animateScenery(dt) {
    const milk = this.bowl.userData.milk;
    if (milk) milk.position.y = 0.52 + Math.sin(this.time * 2) * 0.015;
    this.bowl.rotation.y += dt * 0.2;
    if (this.selected) {
      this.selRing.material.opacity = 0.5 + Math.sin(this.time * 5) * 0.25;
    }
    if (this.frenzy > 0) {
      this.ghostRing.material.color.setHSL((this.time * 0.5) % 1, 1, 0.7);
    }
  }
}
