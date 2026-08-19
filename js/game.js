import * as THREE from 'three';
import {
  TILE, COLS, ROWS, PATHS, SECOND_LANE_WAVE, THEME, START_LIVES, START_GOLD, PREP_TIME, FIRST_PREP,
  TOWERS, maxLevel, upgradeCost, towerStats, CURSES, STONE_TIME, branchCost, BRANCHES,
  ENEMIES, hpScale, WAVES, waveBonus, BANANA_STUN, DRAGON, EMILIJA, SIMONA, STEFO, FATHER,
} from './config.js';
import {
  makeCatTower, makeEnemy, makeMap, makeMouseHole, makeMilkBowl, makeRangeRing,
  makeGhostTile, makeBullet, makeCatnipDrop, makeStars, tileToWorld, makePathArrows,
  makeStoneShell, makePortal, makeBanana, makeEgg, makeBasketball,
} from './models.js';
import { Effects } from './fx.js';
import { settings } from './settings.js';
import { useMap, currentMap } from './maps.js';
import {
  previewStats, previewTile, auraMultipliers, bountyMultiplier, goldIncome, auraBonus,
  synergyMultipliers, branchesFor, branchStats,
  healTargets, shieldAbsorb, shieldRegen, burrowedAt,
  shufflePlan, sleepPicks, nextTrick,
  canPlaceTower, towerLimit, cloneStats, guardedDamage, starLeap, destroyPicks,
  reviveFraction, nextTeleportSpot,
} from './rules.js';
import { t } from './i18n.js';

// Enemy display names live in i18n; ENEMIES keeps the English fallback name.
const enemyName = (kind) => t(`enemy.${kind}.name`);
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

    this._buildLights();
    this._buildWorld();

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.effects = new Effects(this.scene);

    this.towers = [];
    this.enemies = [];
    this.bullets = [];
    this.drops = [];
    this.eggs = [];
    this.hazards = [];
    this.supports = [];
    this.enemyPool = {};

    this.placing = null;       // tower kind selected in the shop
    this.selected = null;      // placed tower currently inspected
    this.speed = 1;
    this.phase = 'idle';
    this.frenzy = 0;
    this.paused = false;

    this._bindPointer();
    window.addEventListener('resize', () => this.resize());
    this.resize();

    this.clock = new THREE.Clock();
    this.renderer.setAnimationLoop(() => this._frame());
    this.startDemo();
  }

  // ------------------------------------------------------------------ world
  // Lights never change; they live straight on the scene so swapping maps only
  // has to throw away `this.world`.
  _buildLights() {
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
  }

  _buildWorld() {
    const scene = this.world = new THREE.Group();
    this.scene.add(scene);
    this.scene.fog = new THREE.Fog(THEME.fog, 46, 96);
    this.renderer.setClearColor(THEME.fog, 1);

    // Path tiles + world-space waypoints, one lane per entrance.
    this.pathTiles = new Set();
    this.lanes = [];
    for (const path of PATHS) {
      const waypoints = [];
      for (let i = 0; i < path.length; i++) {
        const [c, r] = path[i];
        waypoints.push(tileToWorld(c, r));
        if (i === 0) { this.pathTiles.add(`${c},${r}`); continue; }
        const [pc, pr] = path[i - 1];
        const dc = Math.sign(c - pc);
        const dr = Math.sign(r - pr);
        let cc = pc, rr = pr;
        while (cc !== c || rr !== r) {
          cc += dc; rr += dr;
          this.pathTiles.add(`${cc},${rr}`);
        }
      }
      this.lanes.push({ waypoints, open: this.lanes.length === 0 });
    }
    this.waypoints = this.lanes[0].waypoints;

    scene.add(makeMap(this.pathTiles, THEME));
    scene.add(makeStars());
    for (const lane of this.lanes) {
      lane.arrows = makePathArrows(lane.waypoints);
      lane.arrows.visible = lane.open;
      scene.add(lane.arrows);
    }
    this.arrows = this.lanes[0].arrows;

    const startP = this.waypoints[0];
    const hole = makeMouseHole();
    hole.position.set(startP.x - TILE * 0.6, 0, startP.z);
    hole.rotation.y = -Math.PI / 2;
    scene.add(hole);

    // The second door, boarded up until wave 11.
    const start2 = this.lanes[1].waypoints[0];
    this.portal = makePortal();
    this.portal.position.set(start2.x, 0, start2.z - TILE * 0.55);
    scene.add(this.portal);
    this.setLaneOpen(1, false);

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

  // Opening the second door is a moment: the planks blow off, the rift lights
  // up and its arrows start glowing.
  setLaneOpen(index, open, dramatic = false) {
    const lane = this.lanes[index];
    if (!lane) return;
    lane.open = open;
    lane.arrows.visible = open;
    if (this.portal) {
      this.portal.userData.boards.visible = !open;
      this.portal.userData.glow.material.opacity = open ? 0.9 : 0.25;
    }
    if (!open || !dramatic) return;
    const p = this.portal.position;
    this.effects.ring(p, { color: 0xc07bff, from: 0.5, to: 16, life: 0.9 });
    this.effects.burst(p.clone().setY(0.8), { count: 26, color: 0xc07bff, speed: 7, size: 0.6 });
    this.effects.kick(0.8);
    sfx.portal();
    this.ui.toast(t('toast.portalOpen'));
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
      if (moved > 24) { if (this.placing) this._previewGhost(this.placing); return; }
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

  // Some cats are one of a kind: there is only ever one Mimi-chan.
  _allowed(kind) {
    return canPlaceTower(kind, this.towers);
  }

  _updateGhost() {
    const tile = this._tileAt(this._groundPoint());
    const def = TOWERS[this.placing];
    const ok = this._buildable(tile) && this.gold >= def.cost;
    this.ghost.visible = !!tile;
    this.ghostRing.visible = !!tile && !def.global;
    if (!tile) return;
    const p = tileToWorld(tile.col, tile.row);
    this.ghost.position.set(p.x, 0.08, p.z);
    this.ghostRing.position.set(p.x, 0.09, p.z);
    this.ghostRing.scale.setScalar(def.range || 1);
    const color = ok ? 0x9dffd8 : 0xff6b6b;
    this.ghost.material.color.setHex(color);
    this.ghostRing.material.color.setHex(color);
  }

  _tap() {
    const p = this._groundPoint();
    const tile = this._tileAt(p);

    if (this.placing) {
      if (!this._allowed(this.placing)) {
        sfx.deny();
        this.ui.toast(t('toast.limit', { name: t(`tower.${this.placing}.name`) }));
        this.setPlacing(null);
        return;
      }
      if (this._buildable(tile)) { this.placeTower(this.placing, tile); return; }
      // Tapping a cat you already own inspects it instead of nagging you.
      const existing = tile && this.occupied.get(tile.key);
      if (existing) { this.setPlacing(null); this.selectTower(existing); return; }
      sfx.deny();
      this.ui.toast(this.gold < TOWERS[this.placing].cost ? t('toast.poor') : t('toast.blocked'));
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
    const kinds = ['archer', 'wizard', 'frost', 'ninja', 'sleepy', 'ema', 'sofija', 'witch', 'queen'];
    for (const kind of kinds) {
      const spot = spots.splice(Math.floor(Math.random() * spots.length), 1)[0];
      if (!spot) break;
      this.gold = TOWERS[kind].cost;
      this.placeTower(kind, spot);
    }
    this.gold = 0;
  }

  // ------------------------------------------------------------- support cats
  // Ema's ribbon and Sofija's purse only change when a cat is built, upgraded
  // or sold, so the maths is done then and cached on every tower.
  _refreshSupports() {
    // Pass 1: who is standing next to whom. Synergies depend only on kinds and
    // positions, so they can be resolved before any aura maths.
    const nodes = this.towers.map((tw) => ({ kind: tw.kind, x: tw.pos.x, z: tw.pos.z, tower: tw }));
    for (const node of nodes) {
      node.tower.syn = synergyMultipliers(node, nodes);
    }

    // Pass 2: the support cats, with their reach already widened by synergy.
    this.supports = this.towers
      .filter((tw) => TOWERS[tw.kind].support)
      .map((tw) => ({
        kind: tw.kind, level: tw.level, branch: tw.branch, tower: tw,
        x: tw.pos.x, z: tw.pos.z,
        range: towerStats(tw.kind, tw.level, tw.branch).range * tw.syn.range,
      }));

    // Pass 3: everyone's final multipliers.
    for (const tw of this.towers) {
      const self = this.supports.find((s) => s.tower === tw);
      const buff = auraMultipliers(self || { x: tw.pos.x, z: tw.pos.z }, this.supports);
      const was = tw.buff && tw.buff.buffed;
      tw.buff = buff;
      tw.mult = {
        damage: buff.damage * tw.syn.damage,
        rate: buff.rate * tw.syn.rate,
        range: tw.syn.range,
      };
      if (buff.buffed && !was && this.phase !== 'demo') {
        this.effects.ring(tw.pos.clone().setY(0.1), { color: 0xff6fae, from: 0.3, to: 2.2, life: 0.45 });
      }
    }
  }

  // The stats a cat actually fights with: its collar, its chosen path, Ema's
  // ribbon and whatever squad it stands in.
  _stats(tw) {
    const st = towerStats(tw.kind, tw.level, tw.branch);
    const m = tw.mult || { damage: 1, rate: 1, range: 1 };
    return {
      ...st,
      damage: st.damage * m.damage,
      rate: st.rate * m.rate,
      range: st.range * m.range,
    };
  }

  // Everything that lives on the board, swept off it.
  _clearEntities() {
    for (const t of this.towers) this.scene.remove(t.group);
    for (const e of this.enemies) this.scene.remove(e.group);
    for (const b of this.bullets) this.scene.remove(b.mesh);
    for (const d of this.drops) this.scene.remove(d.group);
    for (const egg of this.eggs) this.scene.remove(egg.group);
    for (const h of this.hazards) this.scene.remove(h.mesh);
    this.towers = []; this.enemies = []; this.bullets = []; this.drops = [];
    this.eggs = []; this.hazards = [];
    this.occupied.clear();
    this.supports = [];
  }

  // Pick another board. Only makes sense from the title screen: the diorama is
  // rebuilt straight away so the choice is its own preview.
  setMap(id) {
    if (currentMap().id === id) return currentMap();
    const map = useMap(id);
    this._clearEntities();
    this.selectTower(null);
    this.setPlacing(null);
    this.scene.remove(this.world);
    this._buildWorld();
    this.resize();
    this.startDemo();
    return map;
  }

  start() {
    // Reset everything for a fresh run.
    this._clearEntities();
    this.setLaneOpen(1, false);

    this.paused = false;
    if (this.ui.setPaused) this.ui.setPaused(false);
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
    this.ui.toast(t('toast.build'));
  }

  setSpeed(mult) {
    this.speed = mult;
    this.ui.setSpeed(mult);
  }

  // Pausing freezes the simulation but keeps rendering, so the board stays on
  // screen behind the settings sheet. Only a live run can be paused.
  setPaused(on) {
    const canPause = this.phase === 'prep' || this.phase === 'running';
    const next = !!on && canPause;
    if (next === this.paused) return this.paused;
    this.paused = next;
    // Dropping the accumulated clock stops the game lurching forward on resume.
    this.clock.getDelta();
    if (this.ui.setPaused) this.ui.setPaused(this.paused);
    return this.paused;
  }

  togglePause() { return this.setPaused(!this.paused); }

  setPlacing(kind) {
    this.placing = kind;
    this.ghost.visible = false;
    this.ghostRing.visible = false;
    if (kind) this.selectTower(null);
    this.ui.setPlacing(kind);
    // Show the reach of the cat you are shopping for *before* you spend on it:
    // the ghost tile and its range ring park themselves on a sensible tile and
    // then follow your finger.
    if (kind) {
      const info = previewStats(kind);
      this.ui.showPreview({ ...info, name: t(`tower.${kind}.name`), blurb: t(`tower.${kind}.blurb`), afford: this.gold >= info.cost });
      this._previewGhost(kind);
    } else {
      this.ui.showPreview(null);
    }
  }

  _previewGhost(kind) {
    const tile = previewTile({
      cols: COLS, rows: ROWS, pathTiles: this.pathTiles, occupied: this.occupied,
    });
    if (!tile) return;
    const def = TOWERS[kind];
    const p = tileToWorld(tile.col, tile.row);
    this.ghost.position.set(p.x, 0.08, p.z);
    this.ghostRing.position.set(p.x, 0.09, p.z);
    this.ghostRing.scale.setScalar(def.range || 1);
    const color = this.gold >= def.cost ? 0x9dffd8 : 0xff6b6b;
    this.ghost.material.color.setHex(color);
    this.ghostRing.material.color.setHex(color);
    this.ghost.visible = true;
    this.ghostRing.visible = !def.global;
  }

  selectTower(tower) {
    this.selected = tower;
    if (!tower) {
      this.selRing.visible = false;
      this.ui.showTower(null);
      return;
    }
    const st = this._stats(tower);
    this.selRing.visible = !TOWERS[tower.kind].global;
    this.selRing.position.set(tower.group.position.x, 0.1, tower.group.position.z);
    this.selRing.scale.setScalar(st.range);
    this.ui.showTower(this._towerInfo(tower));
  }

  _towerInfo(tower) {
    const base = TOWERS[tower.kind];
    const st = this._stats(tower);
    const maxed = tower.level >= maxLevel(tower.kind);
    let ability = null;
    if (base.ability === 'curse') {
      const c = CURSES[tower.level];
      ability = t('ability.curse', {
        icon: c.icon, text: t(`curse.${tower.level}.text`), cooldown: base.cooldown,
        left: Math.max(0, tower.abilityCool || 0).toFixed(0),
      });
    } else if (base.ability === 'bow') {
      ability = t('ability.bow', { stun: base.stun, cooldown: base.cooldown });
    } else if (base.ability === 'aura') {
      const bonus = auraBonus('ema', tower.level, tower.branch);
      ability = t('ability.aura', {
        damage: Math.round(bonus.damage * 100), rate: Math.round(bonus.rate * 100),
        range: st.range.toFixed(1),
      });
    } else if (base.bushido) {
      ability = t('ability.bushido', {
        damage: Math.round(st.damage * st.bushido.damage),
        stun: st.bushido.stun.toFixed(1), cooldown: Math.round(st.bushido.cooldown),
      });
    } else if (base.ability === 'gold') {
      const income = goldIncome(tower.level, tower.branch);
      const purse = Math.round((bountyMultiplier({ x: 0, z: 0 }, [{
        kind: 'sofija', level: tower.level, branch: tower.branch, x: 0, z: 0, range: 1,
      }]) - 1) * 100);
      ability = t('ability.gold', {
        coin: income.coin, interval: income.interval, bounty: purse, range: st.range.toFixed(1),
      });
    }
    return {
      kind: tower.kind, icon: base.icon, name: t(`tower.${tower.kind}.name`), level: tower.level, maxed, ability,
      damage: Math.round(st.damage), range: st.range.toFixed(1), rate: st.rate.toFixed(2),
      blurb: t(`tower.${tower.kind}.blurb`),
      upCost: maxed ? 0 : upgradeCost(tower.kind, tower.level),
      sellValue: Math.floor(tower.spent * 0.7),
      canAfford: !maxed && this.gold >= upgradeCost(tower.kind, tower.level),
      global: !!base.global,
      buffed: !!(tower.buff && tower.buff.buffed),
      synergies: (tower.syn ? tower.syn.ids : []).map((id) => ({ id, name: t(`synergy.${id}.name`) })),
      branch: tower.branch,
      branchName: tower.branch ? t(`branch.${tower.kind}.${tower.branch}.name`) : null,
      branches: tower.branch ? [] : branchesFor(tower.kind, tower.level).map((b) => ({
        id: b.id, icon: b.icon, cost: b.cost,
        name: t(`branch.${tower.kind}.${b.id}.name`),
        blurb: t(`branch.${tower.kind}.${b.id}.blurb`),
        afford: this.gold >= b.cost,
        stats: branchStats(tower.kind, b.id),
      })),
    };
  }

  // Walking a cat down one of its two hybrid paths. One-way, on purpose.
  chooseBranch(id) {
    const tw = this.selected;
    if (!tw || tw.branch || tw.level < maxLevel(tw.kind)) return;
    const mods = BRANCHES[tw.kind] && BRANCHES[tw.kind][id];
    if (!mods) return;
    const cost = branchCost(tw.kind);
    if (this.gold < cost) { sfx.deny(); this.ui.toast(t('toast.poor')); return; }
    this.gold -= cost;
    tw.spent += cost;
    tw.branch = id;
    tw.pop = 0.6;

    // A visible badge so a specialised cat reads at a glance: a glowing gem
    // above its head in the colour of the path.
    const gem = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.24),
      new THREE.MeshLambertMaterial({ color: 0xfff0a0, emissive: 0x6b5200 })
    );
    gem.position.set(0, 1.95, 0);
    tw.group.add(gem);
    tw.group.userData.badge = gem;

    this.effects.ring(tw.pos.clone().setY(0.1), { color: 0xfff0a0, from: 0.3, to: 4.2, life: 0.7 });
    this.effects.burst(tw.pos.clone().setY(1.6), { count: 22, color: 0xfff0a0, speed: 6, size: 0.5 });
    this.effects.kick(0.4);
    sfx.upgrade();
    this._refreshSupports();
    this.ui.setGold(this.gold);
    this.ui.toast(t('toast.branch', { name: t(`branch.${tw.kind}.${id}.name`) }));
    this.selectTower(tw);
  }

  placeTower(kind, tile) {
    const cost = TOWERS[kind].cost;
    if (!this._allowed(kind)) {
      sfx.deny();
      this.ui.toast(t('toast.limit', { name: t(`tower.${kind}.name`) }));
      return;
    }
    if (this.gold < cost) { sfx.deny(); this.ui.toast(t('toast.poor')); return; }
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
      cool: 0, recoil: 0, pos: new THREE.Vector3(p.x, 0.9, p.z), pop: 0, disabledT: 0, asleep: false,
      abilityCool: TOWERS[kind].ability ? TOWERS[kind].cooldown : 0,
      bushidoT: TOWERS[kind].bushido ? TOWERS[kind].bushido.cooldown : 0,
      branch: null,
      buff: { damage: 1, rate: 1, buffed: false },
      syn: { damage: 1, rate: 1, range: 1, ids: [] },
      mult: { damage: 1, rate: 1, range: 1 },
      incomeT: TOWERS[kind].support === 'gold' ? goldIncome(1).interval : 0,
    };
    this.towers.push(tower);
    this.occupied.set(tile.key, tower);
    this._refreshSupports();
    this.effects.ring(p, { color: 0x9dffd8, from: 0.3, to: 2.4, life: 0.4 });
    this.effects.burst(new THREE.Vector3(p.x, 0.6, p.z), { count: 10, color: 0xfff0d8, speed: 3, size: 0.35 });
    sfx.place();

    this.ghost.visible = false;
    this.ghostRing.visible = false;
    if (this.gold < cost || !this._allowed(kind)) this.setPlacing(null);
    else this._previewGhost(kind);
    this.ui.setGold(this.gold);
  }

  upgradeSelected() {
    const tw = this.selected;
    if (!tw || tw.level >= maxLevel(tw.kind)) return;
    const cost = upgradeCost(tw.kind, tw.level);
    if (this.gold < cost) { sfx.deny(); this.ui.toast(t('toast.poor')); return; }
    this.gold -= cost;
    tw.spent += cost;
    tw.level++;
    tw.pop = 0.4;
    tw.group.scale.setScalar(TOWER_SCALE + (tw.level - 1) * 0.1);
    // Visible upgrade: a golden collar per level.
    const collar = new THREE.Mesh(
      new THREE.TorusGeometry(0.3, 0.055, 6, 14),
      new THREE.MeshLambertMaterial({ color: 0xffd166, emissive: 0x6b5200 })
    );
    collar.position.set(0, 0.7 + (tw.level - 2) * 0.08, 0.06);
    collar.rotation.x = Math.PI / 2.1;
    tw.group.add(collar);
    this.effects.ring(tw.group.position, { color: 0xffd166, from: 0.3, to: 2.6, life: 0.45 });
    this.effects.burst(tw.pos, { count: 14, color: 0xffd166, speed: 4, size: 0.4 });
    sfx.upgrade();
    this._refreshSupports();
    this.ui.setGold(this.gold);
    this.selectTower(tw);
  }

  sellSelected() {
    const tw = this.selected;
    if (!tw) return;
    const refund = Math.floor(tw.spent * 0.7);
    this.gold += refund;
    this.occupied.delete(tw.tile);
    this.towers.splice(this.towers.indexOf(tw), 1);
    this.scene.remove(tw.group);
    this._refreshSupports();
    this.effects.burst(tw.pos, { count: 12, color: 0xff9ec4, speed: 3.4, size: 0.4 });
    sfx.sell();
    this.ui.setGold(this.gold);
    this.ui.toast(t('toast.sold', { gold: refund }));
    this.selectTower(null);
  }

  startWaveNow() {
    if (this.phase !== 'prep') return;
    const bonus = Math.floor(Math.max(0, this.waveTimer) * 3);
    if (bonus > 0) {
      this.gold += bonus;
      this.ui.setGold(this.gold);
      this.ui.toast(t('toast.early', { gold: bonus }));
    }
    this._beginWave();
  }

  _beginWave() {
    this.wave++;
    const def = WAVES[this.wave - 1];
    this.phase = 'running';
    if (this.wave >= SECOND_LANE_WAVE && !this.lanes[1].open) this.setLaneOpen(1, true, true);
    this.spawnQueue = [];
    for (const [kind, count, gap, delay, lane = 0] of def.groups) {
      const use = this.lanes[lane] && this.lanes[lane].open ? lane : 0;
      for (let i = 0; i < count; i++) this.spawnQueue.push({ kind, time: delay + i * gap, lane: use });
    }
    // Surprise: a golden mouse sneaks in with most waves. Big bounty, very fast.
    if (this.wave >= 2 && Math.random() < 0.75) {
      const last = this.spawnQueue[this.spawnQueue.length - 1].time;
      const lane = this.lanes[1].open && Math.random() < 0.5 ? 1 : 0;
      this.spawnQueue.push({ kind: 'golden', time: Math.random() * last * 0.8 + 1, lane });
    }
    this.spawnQueue.sort((a, b) => a.time - b.time);
    this.waveClock = 0;
    this.ui.setWave(this.wave);
    this.ui.setPhase('running');
    this.ui.banner(t('banner.wave', { n: this.wave }), t(`wave.${this.wave}.name`));
    sfx.wave();
  }

  _endWave() {
    const bonus = waveBonus(this.wave);
    this.gold += bonus;
    this.ui.setGold(this.gold);
    this.ui.toast(t('toast.waveClear', { gold: bonus }));
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
    const warn = {
      5: 'toast.warnMini', 10: 'toast.warnFinal', 11: 'toast.warnPortal',
      15: 'toast.warnMini2', 20: 'toast.warnDragon',
      25: 'toast.warnMini3', 27: 'toast.warnFlutter', 30: 'toast.warnEmilija',
      35: 'toast.warnGranny', 40: 'toast.warnSimona',
      45: 'toast.warnFamily', 50: 'toast.warnFather',
    }[next];
    if (warn) setTimeout(() => this.ui.toast(t(warn)), 1800);
  }

  // --------------------------------------------------------------- spawning
  // Sophie is far too big to skim the floor like a pigeon.
  _flyY(e) {
    if (!e.def) return FLY_Y;
    if (e.def.dragon) return FLY_Y + 3.4;
    if (e.def.butterfly) return FLY_Y + (e.def.boss ? 3.0 : 0.8);
    return FLY_Y;
  }

  _spawn(kind, lane = 0, opts = {}) {
    const def = ENEMIES[kind];
    const pooled = (this.enemyPool[kind] || []).pop();
    const model = pooled || makeEnemy(kind);
    const g = model.group;
    g.visible = true;
    g.scale.setScalar(def.scale);
    this.scene.add(g);

    const laneIndex = this.lanes[lane] ? lane : 0;
    const laneDef = this.lanes[laneIndex];
    const start = laneDef.waypoints[0].clone();
    if (laneIndex === 0) start.x -= TILE * 0.4;
    else start.z -= TILE * 0.4;
    const hp = def.hp * (def.boss ? 1 : hpScale(this.wave)) * (opts.hpMult || 1);
    const e = {
      kind, def, model, group: g, lane: laneIndex,
      hp, maxHp: hp,
      speed: def.speed * (def.boss ? 1 : 1 + 0.012 * this.wave),
      flying: !!def.flying,
      seg: 1, progress: 0, alive: true,
      slowT: 0, slowF: 0, hurt: 0, wobble: Math.random() * 6,
      spawnT: 0, spawnTimer: 3.5, enraged: false,
      stunT: 0, bowT: 0, stone: null,
      layT: Math.random() * 2, bananaT: Math.random(), summonIdx: 0, smashT: 0, swarmT: 0,
      healT: 0, shield: def.shield || 0, sinceHit: 99, burrowT: Math.random() * 2, burrowed: false,
    };
    e.pos = start;
    if (e.flying) {
      e.route = [start.clone(), this.goal.clone()];
      g.position.set(start.x, this._flyY(e), start.z);
    } else {
      e.route = laneDef.waypoints;
      g.position.copy(start);
    }
    if (def.dragon) { e.intro = 0; e.introDur = DRAGON.intro; }
    // The family. Simona's copies skip the entrance — they are already here.
    if (def.gymnast) {
      if (def.boss) { e.intro = 0; e.introDur = SIMONA.intro; }
      e.cloneT = 0; e.starT = SIMONA.starEvery * 0.5; e.handT = 0; e.guardT = 0;
    }
    if (def.baller) {
      e.intro = 0; e.introDur = STEFO.intro;
      e.tpT = 0; e.shootT = -STEFO.shootEvery * 0.5; e.spot = null;
    }
    if (def.father) {
      e.intro = 0; e.introDur = FATHER.intro;
      e.revivesLeft = FATHER.revives; e.stompT = 0;
    }
    if (def.butterfly && def.boss) {
      e.intro = 0;
      e.introDur = EMILIJA.intro;
      e.trickT = EMILIJA.ability - EMILIJA.firstAbility;  // short grace period
      e.lastTrick = null;
    }
    e.bar = this._makeBar();
    g.add(e.bar.group);
    e.bar.group.position.y = (e.flying ? 1.5 : 1.5) * (def.boss ? 1.2 : 1);
    this.enemies.push(e);

    if (def.boss && !opts.summoned) {
      this.boss = e;
      this.ui.boss(1, enemyName(e.kind).toUpperCase());
      if (def.dragon) {
        this.ui.cinematic(t('banner.dragon'), t('banner.dragonSub'), '🐉');
        sfx.dragonRoar();
      } else if (def.butterfly) {
        this.ui.cinematic(t('banner.emilija'), t('banner.emilijaSub'), '🦋');
        sfx.emilijaChime();
      } else if (def.gymnast) {
        this.ui.cinematic(t('banner.simona'), t('banner.simonaSub'), '🤸');
        sfx.whistle();
      } else if (def.baller) {
        this.ui.cinematic(t('banner.stefo'), t('banner.stefoSub'), '🏀');
        sfx.whistle();
      } else if (def.father) {
        this.ui.cinematic(t('banner.father'), t('banner.fatherSub'), '💥');
        sfx.roar();
      } else {
        this.ui.banner(def.boss === 'main' ? t('banner.finalBoss') : t('banner.miniBoss'), enemyName(e.kind));
        sfx.boss();
      }
      this.effects.kick(0.9);
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
    if (e.stone) { e.group.remove(e.stone); e.stone = null; }
    e.group.rotation.x = 0;
    this.scene.remove(e.group);
    e.group.remove(e.bar.group);
    (this.enemyPool[e.kind] ||= []).push(e.model);
    this.enemies.splice(index, 1);
    if (this.boss === e) { this.boss = null; this.ui.boss(null); }
  }

  // ---------------------------------------------------------------- combat
  damage(e, amount, { crit = false } = {}) {
    if (!e.alive) return;
    if (e.burrowed) return;          // nothing can touch it underground
    const armor = e.def.armor || 0;
    let dealt = Math.max(amount * 0.25, amount - armor);
    // Upside down, Simona barely feels it.
    if (e.guardT > 0) dealt = guardedDamage(dealt, SIMONA.handstandResist);
    e.sinceHit = 0;
    if (e.shield > 0) {
      const after = shieldAbsorb({ hp: e.hp, shield: e.shield }, dealt);
      e.hp = after.hp;
      e.shield = after.shield;
      if (after.absorbed > 0) {
        this.effects.trail(e.group.position.clone().setY(e.group.position.y + 0.8), 0x6bd8ff, 0.3);
      }
      if (after.broke) {
        this.effects.ring(e.group.position, { color: 0x6bd8ff, from: 0.4, to: 3.4, life: 0.45 });
        this.effects.burst(e.group.position.clone().setY(0.7), { count: 16, color: 0x6bd8ff, speed: 5, size: 0.4 });
        sfx.pop();
      }
    } else {
      e.hp -= dealt;
    }
    e.hurt = 0.12;
    if (crit) this.effects.burst(e.group.position.clone().setY(e.group.position.y + 0.6), { count: 6, color: 0xffe066, speed: 4, size: 0.3, life: 0.4 });
    if (e.hp <= 0) {
      if (e.def.father && e.revivesLeft > 0) { this._fatherRevive(e); return; }
      this._kill(e);
    }
  }

  _kill(e) {
    if (!e.alive) return;
    e.alive = false; // removed in the update sweep
    if (this.phase === 'demo') {
      this.effects.burst(e.group.position.clone().setY(0.6), { count: 10, color: 0xff8ab0, speed: 4, size: 0.35 });
      sfx.pop();
      return;
    }
    const purse = bountyMultiplier(e.group.position, this.supports);
    const bounty = Math.round(e.def.bounty * (1 + 0.02 * this.wave) * purse);
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
      this.ui.toast(t('toast.bossDown', { name: enemyName(e.kind), gold: bounty }));
    } else {
      sfx.pop();
    }
    if (e.def.golden) { this.ui.toast(t('toast.golden', { gold: bounty })); sfx.coin(); }
    // Catnip drops: guaranteed from bosses, rare otherwise.
    if (e.def.boss || Math.random() < 0.035) this._dropCatnip(p);
    // Simona goes down and her brother checks in off the bench.
    if (e.def.successor && e.def.boss && this.phase === 'running') {
      const next = this._spawn(e.def.successor, e.lane);
      next.pos.copy(e.pos);
      next.seg = e.seg;
      next.progress = e.progress;
      this.ui.toast(t('toast.stefoArrives'));
    }
  }

  _dropCatnip(pos) {
    const group = makeCatnipDrop();
    group.position.copy(pos).setY(0);
    this.scene.add(group);
    this.drops.push({ group, life: 14, t: 0 });
    this.ui.toast(t('toast.catnipDrop'));
  }

  _takeCatnip(drop) {
    this.scene.remove(drop.group);
    this.drops.splice(this.drops.indexOf(drop), 1);
    this.frenzy = 9;
    this.ui.toast(t('toast.catnipFrenzy'));
    this.effects.ring(drop.group.position, { color: 0x8dff5a, from: 0.4, to: 18, life: 0.8 });
    sfx.catnip();
  }

  _fire(tower, target) {
    const st = this._stats(tower);
    const from = tower.pos.clone().setY(1.15);
    const mesh = makeBullet(st.bullet);
    mesh.position.copy(from);
    this.scene.add(mesh);
    const crit = st.crit ? Math.random() < st.crit : false;
    const b = {
      mesh, from, target, speed: st.speed, lob: !!st.lob,
      damage: st.damage * (crit ? 3 : 1), crit,
      splash: st.splash || 0, slow: st.slow || 0, slowTime: st.slowTime || 0,
      color: st.bullet === 'shard' ? 0xbdeaff : st.bullet === 'orb' ? 0xc9a7ff
        : st.bullet === 'pillow' ? 0xdfe6ff : 0xffd166,
      t: 0, life: 3, type: st.bullet,
      to: target.group.position.clone().setY(target.flying ? this._flyY(target) : 0.5),
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
      if (b.type === 'pillow') { this.effects.kick(0.15); sfx.boom(); }
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
    if (this.paused) { this.renderer.render(this.scene, this.camera); return; }
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
    const s = settings.get('shake') ? this.effects.shake : 0;
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
        const next = this.spawnQueue.shift();
      this._spawn(next.kind, next.lane || 0);
      }
    }

    this._updateEnemies(dt);
    this._updateTowers(dt);
    this._updateBullets(dt);
    this._updateHazards(dt);
    this._updateEggs(dt);
    this._updateDrops(dt);
    this._animateScenery(dt);
    this.effects.update(raw);

    if (this.phase === 'running' && !this.spawnQueue.length && !this.enemies.length) this._endWave();
  }

  _updateEnemies(dt) {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      if (!e.alive) { this._despawn(e, i); continue; }
      if (e.intro != null) {
        if (e.def.butterfly) this._emilijaEntrance(e, dt);
        else if (e.def.gymnast) this._simonaEntrance(e, dt);
        else if (e.def.baller) this._stefoEntrance(e, dt);
        else if (e.def.father) this._fatherEntrance(e, dt);
        else this._dragonEntrance(e, dt);
        continue;
      }

      if (e.slowT > 0) { e.slowT -= dt; if (e.slowT <= 0) e.slowF = 0; }
      let speed = e.speed * (1 - e.slowF);
      if (e.stunT > 0) {
        e.stunT -= dt;
        speed = 0;
        if (e.stone) {
          if (e.stunT <= 0) {
            e.group.remove(e.stone);
            e.stone = null;
            this.effects.burst(e.group.position.clone().setY(0.7), { count: 14, color: 0xb0b0c0, speed: 4, size: 0.4 });
            sfx.pop();
          } else if (e.stunT < 1.4) {
            e.stone.rotation.z = Math.sin(this.time * 40) * 0.05;
          }
        }
      }
      // The royal bow: a quick, deep, involuntary nod.
      if (e.bowT > 0) {
        e.bowT -= dt;
        e.group.rotation.x = Math.sin(Math.max(0, e.bowT) * Math.PI) * 0.9;
        if (e.bowT <= 0) e.group.rotation.x = 0;
      }

      // Boss behaviours
      if (e.def.enrage && !e.enraged && e.hp < e.maxHp * 0.45) {
        e.enraged = true;
        e.speed *= 1.5;
        this.ui.toast(t('toast.enraged'));
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
          this.ui.toast(t('toast.howl'));
          for (const other of this.enemies) {
            if (other === e || !other.alive) continue;
            if (other.group.position.distanceTo(e.group.position) > 9) continue;
            other.slowF = 0; other.slowT = 0;
            other.rally = 3;
          }
        }
      }
      if (e.rally > 0) { e.rally -= dt; speed *= 1.45; }
      // Chickens lay eggs, which hatch into more chickens. Yes, really.
      if (e.def.lays && this.phase === 'running') {
        e.layT += dt;
        if (e.layT > 7 && this.eggs.length < 12) { e.layT = 0; this._layEgg(e); }
      }
      // Monkeys lob bananas at the cats.
      if (e.def.banana && e.stunT <= 0) {
        e.bananaT += dt;
        if (e.bananaT >= e.def.banana) { e.bananaT = 0; this._throwBanana(e); }
      }
      if (e.def.dragon) this._dragonBrain(e, dt);
      if (e.def.butterfly && e.def.boss) this._emilijaBrain(e, dt);
      if (e.def.gymnast) this._simonaBrain(e, dt);
      if (e.def.baller) this._stefoBrain(e, dt);
      if (e.def.father) this._fatherBrain(e, dt);
      // A handstand goes nowhere, and Stefo never walks anywhere at all.
      if (e.guardT > 0 || e.def.stationary) speed = 0;
      if (e.def.spawner) {
        e.spawnT += dt;
        if (e.spawnT > e.spawnTimer) {
          e.spawnT = 0;
          for (let k = 0; k < 3; k++) {
            const minion = this._spawn('mouse', e.lane);
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

      // Nurse Hazel patches up whoever is worst off around her.
      if (e.def.heals && !e.burrowed) {
        e.healT += dt;
        if (e.healT >= e.def.heals.interval) {
          e.healT = 0;
          const here = { x: e.group.position.x, z: e.group.position.z };
          const friends = this.enemies.map((o) => ({
            ref: o, alive: o.alive && !o.burrowed, hp: o.hp, maxHp: o.maxHp,
            x: o.group.position.x, z: o.group.position.z,
          }));
          const me = friends[this.enemies.indexOf(e)];
          const targets = healTargets(me || here, friends, e.def.heals.radius);
          if (targets.length) {
            this.effects.ring(e.group.position, { color: 0x6bff9a, from: 0.4, to: e.def.heals.radius * 2, life: 0.5 });
            for (const target of targets) {
              const o = target.ref;
              o.hp = Math.min(o.maxHp, o.hp + e.def.heals.amount);
              this.effects.trail(o.group.position.clone().setY(o.group.position.y + 0.8), 0x6bff9a, 0.35);
            }
          }
        }
      }

      // Shield beetles rebuild their barrier if you let them breathe.
      if (e.def.shield) {
        e.sinceHit += dt;
        const before = e.shield;
        e.shield = shieldRegen({ shield: e.shield, sinceHit: e.sinceHit }, e.def, dt);
        const bubble = e.model.group.userData.shield;
        if (bubble) {
          const frac = e.shield / e.def.shield;
          bubble.visible = frac > 0.02;
          bubble.material.opacity = 0.1 + frac * 0.22;
          bubble.rotation.y += dt * 0.8;
          bubble.scale.setScalar(0.9 + frac * 0.2);
        }
        if (before === 0 && e.shield > 0) sfx.pop();
      }

      // Moles dive under the floor, where nothing can reach them, then pop up
      // again somewhere further along.
      if (e.def.burrow) {
        e.burrowT += dt;
        const under = burrowedAt(e.burrowT, e.def.burrow);
        if (under !== e.burrowed) {
          e.burrowed = under;
          this.effects.burst(e.group.position.clone().setY(0.3), { count: 14, color: 0x8a6b4a, speed: 4, size: 0.45 });
          this.effects.ring(e.group.position, { color: 0x8a6b4a, from: 0.3, to: 2.4, life: 0.4 });
          sfx.pop();
        }
        e.model.group.visible = !under;
        e.bar.group.visible = !under;
        if (under) speed *= e.def.burrow.speed;
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
      e.group.position.set(e.pos.x, e.flying ? this._flyY(e) + Math.sin(this.time * 2.2 + e.wobble) * 0.35 : Math.abs(bob) * 0.09, e.pos.z);
      if (e.facing != null) {
        const cur = e.group.rotation.y;
        let diff = e.facing - cur;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        e.group.rotation.y = cur + diff * Math.min(1, dt * 10);
      }

      // Per-kind wiggle
      const legs = e.model.legs;
      if (e.kind === 'bird' || e.kind === 'pig' || e.def.dragon || e.def.butterfly) {
        const rate = e.def.dragon ? 3.4 : e.def.butterfly ? (e.def.boss ? 2.6 : 7) : e.kind === 'pig' ? 9 : 14;
        for (const wing of legs) {
          if (wing.userData.side == null) continue;
          wing.rotation.z = wing.userData.side * (0.35 + Math.sin(this.time * rate + e.wobble) * 0.5);
        }
      } else if (e.kind === 'frog') {
        const hop = Math.abs(Math.sin(this.time * 5 + e.wobble));
        e.group.position.y += hop * 0.35;
        legs.forEach((leg, k) => { leg.position.y = 0.16 - hop * 0.08 + k * 0.001; });
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
      e.bar.group.visible = ratio < 0.999 && !e.burrowed;
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
      if (this.boss === e) this.ui.boss(ratio, enemyName(e.kind).toUpperCase());
    }
  }

  _leak(e, i) {
    const cost = e.def.leak;
    this._despawn(e, i);
    if (this.phase === 'demo') return;
    if (cost <= 0) { this.ui.toast(t('toast.goldenGone')); return; }
    this.effects.ring(this.goal, { color: 0xff3b6b, from: 0.5, to: 5, life: 0.5 });
    this.effects.kick(0.5);
    sfx.leak();
    this._loseLives(cost);
  }

  // Every way the milk can be lost funnels through here.
  _loseLives(cost) {
    if (cost <= 0) return;
    this.lives = Math.max(0, this.lives - cost);
    this.ui.setLives(this.lives);
    this.ui.hitFlash();
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
      const st = this._stats(t);
      // Banana'd: the cat sits there seeing stars and does nothing at all.
      if (t.disabledT > 0) {
        t.disabledT -= dt;
        // Banana'd cats see stars; Emilija's cats snore little blue Zs.
        t.group.rotation.z = t.asleep
          ? 0.22 + Math.sin(this.time * 2.2) * 0.05
          : Math.sin(this.time * 18) * 0.14;
        if (Math.random() < dt * (t.asleep ? 3 : 5)) {
          this.effects.trail(t.pos.clone().setY(1.9), t.asleep ? 0xb9c6ff : 0xffe066, t.asleep ? 0.5 : 0.24);
        }
        if (t.disabledT <= 0) { t.disabledT = 0; t.asleep = false; t.group.rotation.z = 0; }
        continue;
      }
      const buff = t.buff || { damage: 1, rate: 1, buffed: false };
      if (TOWERS[t.kind].support) { this._updateSupport(t, st, dt, frenzy); continue; }
      if (st.ability) { this._updateAbility(t, st, dt, frenzy); continue; }
      if (st.bushido) this._updateBushido(t, st, dt, frenzy);
      t.cool -= dt * st.rate * buff.rate * frenzy;
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
      const badge = t.group.userData.badge;
      if (badge) { badge.rotation.y += dt * 2.2; badge.position.y = 1.95 + Math.sin(this.time * 3) * 0.06; }
      const glow = t.group.userData.glow;
      if (glow) glow.scale.setScalar(0.2 + Math.sin(this.time * 4 + t.pos.z) * 0.03 + (this.frenzy > 0 ? 0.06 : 0));
    }
  }


  // Simba-kun keeps his katana half-drawn. Every cooldown, if anything at all
  // is in reach, he unsheathes it: a ring of moonlight that cuts and staggers
  // every pest around him.
  _updateBushido(tower, st, dt, frenzy) {
    tower.bushidoT -= dt * frenzy;
    if (tower.bushidoT > 0) return;
    const reach = st.range * 1.15;
    const caught = this.enemies.filter((e) => e.alive && e.intro == null && !e.burrowed
      && !e.flying && e.group.position.distanceTo(tower.pos) <= reach);
    if (!caught.length) { tower.bushidoT = 0.4; return; }
    tower.bushidoT = st.bushido.cooldown;
    tower.pop = 0.5;
    this.effects.ring(tower.pos.clone().setY(0.12), { color: 0xeef3ff, from: 0.4, to: reach * 2, life: 0.5 });
    this.effects.burst(tower.pos.clone().setY(1.2), { count: 20, color: 0xfff0c0, speed: 7, size: 0.5 });
    this.effects.kick(0.35);
    sfx.bushido();
    for (const e of caught) {
      this.damage(e, st.damage * st.bushido.damage);
      if (e.alive) {
        e.stunT = Math.max(e.stunT, st.bushido.stun);
        this.effects.trail(e.group.position.clone().setY(e.group.position.y + 0.6), 0xeef3ff, 0.3);
      }
    }
  }

  // Support cats never shoot. Ema pulses her ribbon over the cats she is
  // helping; Sofija counts down to the next fish she digs up.
  _updateSupport(tower, st, dt, frenzy) {
    if (tower.pop > 0) tower.pop = Math.max(0, tower.pop - dt);
    const breathe = 1 + Math.sin(this.time * 3.2 + tower.pos.x) * 0.03;
    const s = (TOWER_SCALE + (tower.level - 1) * 0.1) * breathe * (1 + tower.pop * 0.5);
    tower.group.scale.setScalar(s);
    tower.group.rotation.y += dt * 0.6;
    const spin = tower.group.userData.spin;
    if (spin) spin.rotation.y += dt * 6;

    if (tower.kind === 'ema') {
      const glow = tower.group.userData.glow;
      const pulse = 0.5 + Math.sin(this.time * 3) * 0.5;
      if (glow) glow.scale.setScalar(0.18 + pulse * 0.08);
      if (Math.random() < dt * 3) {
        const a = Math.random() * Math.PI * 2;
        const r = Math.random() * st.range;
        this.effects.trail(
          new THREE.Vector3(tower.pos.x + Math.cos(a) * r, 0.4 + Math.random() * 1.2, tower.pos.z + Math.sin(a) * r),
          0xff6fae, 0.3
        );
      }
      return;
    }

    // Sofija: a fish every few seconds, faster while the queen has the board
    // in a frenzy.
    const income = goldIncome(tower.level, tower.branch);
    tower.incomeT -= dt * frenzy;
    if (tower.incomeT > 0) return;
    tower.incomeT = income.interval;
    tower.pop = 0.4;
    if (this.phase === 'demo') return;
    this.gold += income.coin;
    this.ui.setGold(this.gold, true);
    this.effects.ring(tower.pos.clone().setY(0.1), { color: 0xffd166, from: 0.3, to: 2.4, life: 0.5 });
    this.effects.burst(tower.pos.clone().setY(1.4), { count: 10, color: 0xffd166, speed: 3.4, size: 0.4 });
    sfx.coin();
  }

  // Ability cats (witch, queen) don't shoot — they charge a timer and then do
  // something dramatic to the whole board.
  _updateAbility(t, st, dt, frenzy) {
    t.abilityCool -= dt * frenzy;
    if (t.abilityCool <= 0) {
      if (st.ability === 'curse') {
        const victim = this._pickCurseTarget(t, st);
        if (victim) { this._castCurse(t, victim); t.abilityCool = st.cooldown; }
        else t.abilityCool = 0.5;      // nothing to hex — try again shortly
      } else if (st.ability === 'bow') {
        this._royalBow(t, st);
        t.abilityCool = st.cooldown;
      }
    }
    // Charging glow + a slow regal spin.
    t.group.rotation.y += dt * (st.ability === 'bow' ? 0.5 : 0.35);
    if (t.pop > 0) t.pop = Math.max(0, t.pop - dt);
    const charge = st.cooldown ? 1 - Math.max(0, t.abilityCool) / st.cooldown : 1;
    const breathe = 1 + Math.sin(this.time * 2.4 + t.pos.x) * 0.02;
    const s = (TOWER_SCALE + (t.level - 1) * 0.1) * breathe * (1 + t.pop * 0.5);
    t.group.scale.setScalar(s);
    const glow = t.group.userData.glow;
    if (glow) {
      glow.scale.setScalar(0.12 + charge * 0.22 + Math.sin(this.time * 6) * 0.02);
      glow.material.opacity = 1;
    }
    if (charge > 0.85 && Math.random() < dt * 8) {
      this.effects.trail(
        t.pos.clone().setY(1.5 + Math.random() * 0.5),
        st.ability === 'bow' ? 0xffd166 : 0xc07bff, 0.3
      );
    }
  }

  _cursable(e) {
    return e.alive && !e.def.boss && !e.def.cursed && !e.stone && !e.burrowed;
  }

  _pickCurseTarget(t, st) {
    let best = null;
    let bestHp = -1;
    for (const e of this.enemies) {
      if (!this._cursable(e)) continue;
      const dx = e.group.position.x - t.pos.x;
      const dz = e.group.position.z - t.pos.z;
      if (dx * dx + dz * dz > st.range * st.range) continue;
      // Hex the scariest thing in reach.
      if (e.hp > bestHp) { bestHp = e.hp; best = e; }
    }
    return best;
  }

  _castCurse(tower, e) {
    const curse = CURSES[tower.level] || CURSES[1];
    const from = tower.pos.clone().setY(1.5);
    const to = e.group.position.clone().setY(e.flying ? this._flyY(e) : 0.6);
    this.effects.bolt(from, to, 0xc07bff);
    this.effects.ring(to, { color: 0xc07bff, from: 0.3, to: 3.4, life: 0.5, y: 0.1 });
    this.effects.burst(to, { count: 16, color: 0xc07bff, speed: 4, size: 0.4 });
    tower.pop = 0.4;
    sfx.curse();

    if (curse.id === 'frog') {
      this._transform(e, 'frog');
      this.ui.toast(t('toast.curseFrog'));
      sfx.frog();
    } else if (curse.id === 'stone') {
      this._petrify(e);
      this.ui.toast(t('toast.curseStone', { sec: STONE_TIME }));
      sfx.stone();
    } else {
      this.ui.toast(t('toast.curseDoom'));
      this.effects.kick(0.3);
      sfx.doom();
      this._kill(e);
    }
  }

  // Swap an enemy for another kind, keeping its place in the queue.
  _transform(e, kind) {
    const fresh = this._spawn(kind);
    fresh.seg = e.seg;
    fresh.progress = e.progress;
    fresh.pos.copy(e.pos);
    fresh.flying = false;
    fresh.route = this.lanes[e.lane] ? this.lanes[e.lane].waypoints : this.waypoints;
    fresh.group.position.copy(e.pos);
    e.alive = false;     // removed silently by the update sweep — no bounty
    return fresh;
  }

  _petrify(e) {
    e.stunT = Math.max(e.stunT, STONE_TIME);
    if (!e.stone) {
      e.stone = makeStoneShell();
      e.stone.scale.setScalar(1 / (e.def.scale || 1));
      e.group.add(e.stone);
    }
  }

  // Mimi-chan demands respect: every pest on the board stops to bow.
  _royalBow(tower, st) {
    tower.pop = 0.5;
    this.effects.ring(tower.pos, { color: 0xffd166, from: 0.5, to: 26, life: 0.7, y: 0.12 });
    this.effects.burst(tower.pos.clone().setY(1.6), { count: 18, color: 0xffe9b0, speed: 5, size: 0.45 });
    let bowed = 0;
    for (const e of this.enemies) {
      if (!e.alive) continue;
      e.stunT = Math.max(e.stunT, st.stun);
      e.bowT = st.stun;
      bowed++;
      this.effects.trail(e.group.position.clone().setY(e.group.position.y + 0.8), 0xffd166, 0.3);
    }
    if (bowed) { sfx.bow(); this.ui.toast(t('toast.bow')); }
  }

  _pickTarget(t, st) {
    let best = null;
    let bestProgress = -1;
    for (const e of this.enemies) {
      if (!e.alive || e.intro != null || e.burrowed) continue;
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
        if (b.target && b.target.alive) b.to.copy(b.target.group.position).setY(b.target.flying ? this._flyY(b.target) : 0.5);
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

  // ------------------------------------------------------------ chicken eggs
  _layEgg(e) {
    const group = makeEgg();
    group.position.copy(e.pos).setY(0);
    this.scene.add(group);
    this.eggs.push({ group, pos: e.pos.clone(), seg: e.seg, progress: e.progress, lane: e.lane, t: 0, hatch: 4.5 });
    this.effects.trail(e.pos.clone().setY(0.4), 0xfff6e8, 0.3);
    sfx.egg();
  }

  _updateEggs(dt) {
    for (let i = this.eggs.length - 1; i >= 0; i--) {
      const egg = this.eggs[i];
      egg.t += dt;
      const wobble = Math.min(1, egg.t / egg.hatch);
      egg.group.rotation.z = Math.sin(egg.t * (4 + wobble * 22)) * 0.12 * wobble;
      egg.group.scale.setScalar(1 + Math.sin(egg.t * 8) * 0.03 * wobble);
      if (egg.t < egg.hatch) continue;

      this.scene.remove(egg.group);
      this.eggs.splice(i, 1);
      if (this.phase !== 'running') continue;
      const chick = this._spawn('chick', egg.lane);
      chick.seg = egg.seg;
      chick.progress = egg.progress;
      chick.pos.copy(egg.pos);
      chick.group.position.copy(egg.pos);
      this.effects.burst(egg.pos.clone().setY(0.4), { count: 10, color: 0xffe066, speed: 3.4, size: 0.32 });
      sfx.squeak();
    }
  }

  // ---------------------------------------------------------------- bananas
  _throwBanana(source) {
    const reach = 9;
    const here = source.group.position;
    const options = this.towers.filter((tw) => tw.disabledT <= 0 && tw.pos.distanceTo(here) < reach);
    if (!options.length) return;
    const volley = Math.min(source.def.bananaVolley || 1, options.length);
    for (let i = 0; i < volley; i++) {
      const tw = options.splice(Math.floor(Math.random() * options.length), 1)[0];
      const mesh = makeBanana();
      const from = here.clone().setY(here.y + 0.9);
      mesh.position.copy(from);
      this.scene.add(mesh);
      const to = tw.pos.clone().setY(1.15);
      this.hazards.push({ mesh, from, to, t: 0, dur: Math.max(0.4, from.distanceTo(to) / 9), tower: tw });
    }
    sfx.banana();
  }

  _updateHazards(dt) {
    for (let i = this.hazards.length - 1; i >= 0; i--) {
      const h = this.hazards[i];
      h.t += dt;
      const k = Math.min(1, h.t / h.dur);
      const p = h.from.clone().lerp(h.to, k);
      p.y += Math.sin(k * Math.PI) * (h.basket ? 6 : 3.2);
      h.mesh.position.copy(p);
      h.mesh.rotation.z += dt * 12;
      h.mesh.rotation.x += dt * 6;
      if (k < 1) continue;

      this.scene.remove(h.mesh);
      this.hazards.splice(i, 1);
      // Nothing but net: a basket costs a life.
      if (h.basket) {
        this.effects.ring(this.goal, { color: 0xff8a1f, from: 0.4, to: 7, life: 0.6 });
        this.effects.burst(h.to.clone(), { count: 20, color: 0xff8a1f, speed: 6, size: 0.5 });
        this.effects.kick(0.6);
        sfx.swish();
        this.ui.toast(t('toast.stefoBasket', { lives: STEFO.livesPerBasket }));
        this._loseLives(STEFO.livesPerBasket);
        continue;
      }
      if (!this.towers.includes(h.tower)) continue;
      h.tower.disabledT = BANANA_STUN;
      this.effects.burst(h.to.clone(), { count: 12, color: 0xffe066, speed: 4, size: 0.4 });
      this.effects.ring(h.tower.group.position, { color: 0xffe066, from: 0.3, to: 2.6, life: 0.4 });
      sfx.bonk();
      this.ui.toast(t('toast.banana', { name: t(`tower.${h.tower.kind}.name`), sec: BANANA_STUN }));
    }
  }

  // ------------------------------------------------------------------ Sophie
  // The entrance: she drops out of the night sky trailing fire, and lands.
  _dragonEntrance(e, dt) {
    e.intro += dt;
    const k = Math.min(1, e.intro / e.introDur);
    const ease = k * k * (3 - 2 * k);
    const land = e.route[0];
    e.group.position.set(
      land.x + (1 - ease) * 24,
      this._flyY(e) + (1 - ease) * 44,
      land.z - (1 - ease) * 42
    );
    e.group.rotation.y = (1 - ease) * -0.9;
    e.group.rotation.x = (1 - ease) * 0.4;
    for (const wing of e.model.legs) {
      if (wing.userData.side == null) continue;
      wing.rotation.z = wing.userData.side * (0.4 + Math.sin(this.time * 16) * 0.65);
    }
    if (Math.random() < dt * 40) {
      this.effects.trail(e.group.position.clone().setY(e.group.position.y - 1.4), 0xff8a3d, 0.9);
    }
    this.effects.shake = Math.max(this.effects.shake, 0.2 + ease * 0.35);
    if (k < 1) return;

    e.intro = null;
    e.group.rotation.x = 0;
    this.effects.ring(e.group.position.clone().setY(0), { color: 0xff5b3d, from: 1, to: 28, life: 1.1 });
    this.effects.burst(e.group.position.clone(), { count: 44, color: 0xff8a3d, speed: 11, size: 0.9 });
    this.effects.kick(1.4);
    sfx.dragonFire();
    this.ui.toast(t('toast.dragonLanded'));
  }

  _dragonBrain(e, dt) {
    e.smashT += dt;
    e.swarmT += dt;
    if (e.smashT >= DRAGON.smashEvery) { e.smashT = 0; this._dragonSmash(e); }
    if (e.swarmT >= DRAGON.swarmEvery) { e.swarmT = 0; this._dragonSwarm(e); }
    const ratio = e.hp / e.maxHp;
    while (e.summonIdx < DRAGON.summons.length && ratio <= DRAGON.summons[e.summonIdx].at) {
      this._dragonSummon(e, DRAGON.summons[e.summonIdx].kind);
      e.summonIdx++;
    }
  }

  // Every 10 s she picks a cat and breathes fire on it. Mimi-chan is royalty:
  // even a dragon knows better than to aim at the queen.
  _dragonSmash(e) {
    const targets = this.towers.filter((tw) => tw.kind !== 'queen');
    if (!targets.length) { e.smashT = DRAGON.smashEvery - 2; return; }
    const tw = targets[Math.floor(Math.random() * targets.length)];
    this.effects.bolt(e.group.position.clone(), tw.pos.clone().setY(1), 0xff8a3d);
    this.effects.burst(tw.pos.clone().setY(0.8), { count: 26, color: 0xff8a3d, speed: 7, size: 0.7 });
    this.effects.ring(tw.group.position, { color: 0xff5b3d, from: 0.4, to: 6, life: 0.6 });
    this.effects.kick(0.7);
    sfx.dragonFire();
    this.ui.toast(t('toast.dragonSmash', { name: t(`tower.${tw.kind}.name`) }));
    this._destroyTower(tw);
  }

  _destroyTower(tw) {
    const idx = this.towers.indexOf(tw);
    if (idx < 0) return;
    this.towers.splice(idx, 1);
    this.occupied.delete(tw.tile);
    this.scene.remove(tw.group);
    if (this.selected === tw) this.selectTower(null);
  }

  _dragonSwarm(e) {
    for (const kind of DRAGON.swarm) {
      const minion = this._spawn(kind, e.lane);
      this._placeOnRoute(minion, e.group.position);
    }
    this.effects.ring(e.group.position.clone().setY(0), { color: 0xc07bff, from: 0.5, to: 12, life: 0.7 });
    sfx.squeak();
    this.ui.toast(t('toast.dragonSwarm'));
  }

  _dragonSummon(e, kind) {
    const minion = this._spawn(kind, e.lane, { summoned: true, hpMult: DRAGON.summonHp });
    this._placeOnRoute(minion, e.group.position);
    this.effects.ring(minion.group.position, { color: 0xff5b7f, from: 0.5, to: 10, life: 0.7 });
    this.effects.kick(0.6);
    sfx.boss();
    this.ui.banner(t('banner.dragonSummon'), enemyName(kind));
    this.ui.toast(t('toast.dragonSummon', { name: enemyName(kind) }));
  }

  // ---------------------------------------------------------------- Emilija
  // She glides in on a slow spiral of glitter instead of crashing down.
  _emilijaEntrance(e, dt) {
    e.intro += dt;
    const k = Math.min(1, e.intro / e.introDur);
    const ease = k * k * (3 - 2 * k);
    const land = e.route[0];
    const spin = (1 - ease) * Math.PI * 1.5;
    e.group.position.set(
      land.x + Math.sin(spin) * 20 * (1 - ease),
      this._flyY(e) + (1 - ease) * 26,
      land.z + Math.cos(spin) * 20 * (1 - ease)
    );
    e.group.rotation.y = spin;
    e.group.rotation.z = Math.sin(this.time * 3) * 0.12 * (1 - ease);
    for (const wing of e.model.legs) {
      if (wing.userData.side == null) continue;
      wing.rotation.z = wing.userData.side * (0.3 + Math.sin(this.time * 5) * 0.55);
    }
    if (Math.random() < dt * 40) {
      this.effects.trail(
        e.group.position.clone().setY(e.group.position.y - 1.2),
        [0xff8ad8, 0xc46bff, 0xffe066][Math.floor(Math.random() * 3)], 1.0
      );
    }
    if (k < 1) return;

    e.intro = null;
    e.group.rotation.z = 0;
    this.effects.ring(e.group.position.clone().setY(0), { color: 0xc46bff, from: 1, to: 30, life: 1.2 });
    this.effects.burst(e.group.position.clone(), { count: 48, color: 0xff8ad8, speed: 9, size: 0.8 });
    this.effects.kick(0.9);
    sfx.emilijaChime();
    this.ui.toast(t('toast.emilijaLanded'));
  }

  // Every EMILIJA.ability seconds she pulls one of three tricks — never the
  // same one twice in a row, so you always get a little surprise.
  _emilijaBrain(e, dt) {
    e.trickT += dt;
    if (e.trickT < EMILIJA.ability) return;
    e.trickT = 0;
    // Sleeping cats wake up the moment the next trick lands.
    for (const tw of this.towers) if (tw.asleep) { tw.asleep = false; tw.disabledT = 0; tw.group.rotation.z = 0; }
    const trick = nextTrick(EMILIJA.tricks, e.lastTrick);
    e.lastTrick = trick;
    this.effects.ring(e.group.position.clone().setY(0), { color: 0xff8ad8, from: 0.6, to: 22, life: 0.8 });
    if (trick === 'shuffle') this._emilijaShuffle(e);
    else if (trick === 'sleep') this._emilijaSleep(e);
    else this._emilijaSpawn(e);
  }

  // Trick 1: every cat keeps its collar — and loses its spot.
  _emilijaShuffle(e) {
    const cats = this.towers.filter((tw) => !TOWERS[tw.kind].global);
    if (cats.length < 2) { this._emilijaSpawn(e); return; }
    const tiles = cats.map((tw) => tw.tile);
    const plan = shufflePlan(tiles);
    for (const tw of cats) this.occupied.delete(tw.tile);
    cats.forEach((tw, i) => {
      const [col, row] = plan[i].split(',').map(Number);
      const p = tileToWorld(col, row);
      tw.tile = plan[i];
      tw.pos.set(p.x, 0.9, p.z);
      tw.group.position.set(p.x, 0.06, p.z);
      tw.group.rotation.y = Math.atan2(this.goal.x - p.x, this.goal.z - p.z);
      tw.pop = 0.4;
      this.occupied.set(tw.tile, tw);
      this.effects.trail(new THREE.Vector3(p.x, 1.4, p.z), 0xc46bff, 0.5);
      this.effects.ring(new THREE.Vector3(p.x, 0.05, p.z), { color: 0xff8ad8, from: 0.2, to: 2.2, life: 0.4 });
    });
    this._refreshSupports();
    if (this.selected) this.selectTower(this.selected);
    sfx.emilijaChime();
    this.ui.banner(t('banner.emilijaTrick'), t('trick.shuffle'));
    this.ui.toast(t('toast.emilijaShuffle'));
  }

  // Trick 2: a third of the army curls up until her next trick.
  _emilijaSleep(e) {
    const awake = this.towers.filter((tw) => tw.disabledT <= 0);
    if (!awake.length) { this._emilijaSpawn(e); return; }
    const picks = sleepPicks(awake.length, EMILIJA.sleepFraction);
    for (const i of picks) {
      const tw = awake[i];
      tw.asleep = true;
      tw.disabledT = EMILIJA.ability;
      this.effects.trail(tw.pos.clone().setY(1.9), 0xb9c6ff, 0.6);
      this.effects.ring(tw.group.position, { color: 0xb9c6ff, from: 0.3, to: 2.6, life: 0.45 });
    }
    sfx.emilijaSleep();
    this.ui.banner(t('banner.emilijaTrick'), t('trick.sleep'));
    this.ui.toast(t('toast.emilijaSleep', { count: picks.length }));
  }

  // Trick 3: three smaller, weaker copies of herself peel off her wings.
  _emilijaSpawn(e) {
    for (let i = 0; i < EMILIJA.spawnCount; i++) {
      const minion = this._spawn(EMILIJA.spawn, e.lane, { summoned: true });
      minion.seg = e.seg;
      minion.progress = e.progress;
      minion.pos.copy(e.pos);
      minion.group.position.copy(e.group.position);
      minion.group.position.x += (i - 1) * 2.2;
      minion.wobble = Math.random() * 6;
    }
    this.effects.burst(e.group.position.clone(), { count: 26, color: 0x8fe6ff, speed: 7, size: 0.5 });
    sfx.emilijaChime();
    this.ui.banner(t('banner.emilijaTrick'), t('trick.spawn'));
    this.ui.toast(t('toast.emilijaSpawn', { count: EMILIJA.spawnCount }));
  }

  // ----------------------------------------------------------- the family
  // Simona cartwheels in from the wings like the floor is hers.
  _simonaEntrance(e, dt) {
    e.intro += dt;
    const k = Math.min(1, e.intro / e.introDur);
    const ease = k * k * (3 - 2 * k);
    const land = e.route[0];
    e.group.position.set(
      land.x - (1 - ease) * 18,
      Math.abs(Math.sin(k * Math.PI * 3)) * 3.2 * (1 - ease * 0.6),
      land.z
    );
    e.group.rotation.z = (1 - ease) * Math.PI * 6;
    if (Math.random() < dt * 26) {
      this.effects.trail(e.group.position.clone().setY(e.group.position.y + 0.8), 0xffd166, 0.5);
    }
    if (k < 1) return;
    e.intro = null;
    e.group.rotation.z = 0;
    e.pos.copy(new THREE.Vector3(land.x, 0, land.z));
    e.group.position.copy(e.pos);
    this.effects.ring(e.pos.clone(), { color: 0xffd166, from: 1, to: 24, life: 1 });
    this.effects.burst(e.pos.clone().setY(1.4), { count: 40, color: 0xff8ad8, speed: 8, size: 0.7 });
    this.effects.kick(0.8);
    sfx.whistle();
    this.ui.toast(t('toast.simonaLanded'));
  }

  _simonaBrain(e, dt) {
    // Mid-handstand she is a statue: no tricks, no copies, almost no damage.
    if (e.guardT > 0) {
      e.guardT -= dt;
      e.group.rotation.z = Math.PI;
      e.group.position.y = 0.35;
      if (Math.random() < dt * 8) this.effects.trail(e.group.position.clone().setY(1.2), 0x8fe6ff, 0.4);
      if (e.guardT <= 0) { e.group.rotation.z = 0; e.group.position.y = 0; }
      return;
    }
    e.handT += dt;
    if (e.handT >= SIMONA.handstandEvery) { e.handT = 0; this._simonaHandstand(e); return; }
    e.starT += dt;
    if (e.starT >= SIMONA.starEvery) { e.starT = 0; this._simonaStar(e); }
    e.cloneT += dt;
    if (e.cloneT >= SIMONA.cloneEvery) { e.cloneT = 0; this._simonaClone(e); }
  }

  _simonaHandstand(e) {
    e.guardT = SIMONA.handstandTime;
    this.effects.ring(e.group.position.clone().setY(0.1), { color: 0x8fe6ff, from: 0.6, to: 8, life: 0.6 });
    sfx.whistle();
    if (this.boss === e) this.ui.toast(t('toast.simonaHands', { sec: SIMONA.handstandTime.toFixed(1) }));
  }

  // A running star jump flings her a few tiles further down the lane, but
  // never all the way into the bowl.
  _simonaStar(e) {
    const route = e.route;
    let total = 0;
    for (let i = 1; i < route.length; i++) total += route[i].distanceTo(route[i - 1]);
    const limit = Math.max(0, total - TILE * 1.2);
    const want = starLeap(e.progress, SIMONA.starTiles * TILE, limit);
    const gain = want - e.progress;
    if (gain <= 0.01) return;
    const before = e.group.position.clone();
    this._advanceAlong(e, gain);
    this.effects.trail(before.setY(1), 0xffd166, 0.6);
    this.effects.burst(e.group.position.clone().setY(1), { count: 16, color: 0xffd166, speed: 6, size: 0.5 });
    sfx.whistle();
    if (this.boss === e) this.ui.toast(t('toast.simonaStar', { tiles: SIMONA.starTiles }));
  }

  // Walk an enemy forward along its own lane without letting it finish.
  _advanceAlong(e, dist) {
    const route = e.route;
    let left = dist;
    while (left > 0 && e.seg < route.length) {
      const target = route[e.seg];
      const dx = target.x - e.pos.x;
      const dz = target.z - e.pos.z;
      const d = Math.hypot(dx, dz);
      if (d <= left) {
        e.pos.set(target.x, 0, target.z);
        e.progress += d;
        left -= d;
        e.seg++;
      } else {
        e.pos.set(e.pos.x + (dx / d) * left, 0, e.pos.z + (dz / d) * left);
        e.progress += left;
        e.facing = Math.atan2(dx, dz);
        left = 0;
      }
    }
    e.group.position.set(e.pos.x, e.group.position.y, e.pos.z);
  }

  // Every few seconds she splits off a copy that shares her exact condition.
  _simonaClone(e) {
    const alive = this.enemies.filter((o) => o.alive && o.kind === SIMONA.clone).length;
    if (alive >= SIMONA.maxClones) return;
    const clone = this._spawn(SIMONA.clone, e.lane, { summoned: true });
    const st = cloneStats(e, SIMONA.cloneHp);
    clone.maxHp = st.maxHp;
    clone.hp = st.hp;
    clone.seg = e.seg;
    clone.progress = e.progress;
    clone.pos.copy(e.pos);
    clone.group.position.copy(e.group.position);
    clone.group.position.y = 0;
    this.effects.ring(e.group.position.clone().setY(0.1), { color: 0xffa8e0, from: 0.5, to: 9, life: 0.6 });
    this.effects.burst(clone.group.position.clone().setY(1.2), { count: 18, color: 0xffa8e0, speed: 6, size: 0.5 });
    sfx.portal();
    if (this.boss === e) this.ui.toast(t('toast.simonaClone', { count: alive + 1 }));
  }

  // ------------------------------------------------------------------ Stefo
  _stefoEntrance(e, dt) {
    e.intro += dt;
    const k = Math.min(1, e.intro / e.introDur);
    const ease = k * k * (3 - 2 * k);
    const spot = e.spot || (e.spot = this._stefoSpot(e));
    e.group.position.set(spot.x, 8 * (1 - ease) + Math.abs(Math.sin(k * Math.PI * 4)) * 1.5, spot.z);
    e.group.rotation.y = (1 - ease) * Math.PI * 4;
    if (k < 1) return;
    e.intro = null;
    e.pos.set(spot.x, 0, spot.z);
    e.group.position.set(spot.x, 0, spot.z);
    e.group.rotation.y = Math.atan2(this.goal.x - spot.x, this.goal.z - spot.z);
    this.effects.ring(e.pos.clone(), { color: 0xff8a1f, from: 1, to: 20, life: 0.9 });
    this.effects.kick(0.8);
    sfx.bounce();
  }

  // A free tile anywhere on the board, never the one he is already on.
  _stefoSpot(e) {
    const spots = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const key = `${c},${r}`;
        if (this.pathTiles.has(key) || this.occupied.has(key)) continue;
        spots.push(key);
      }
    }
    if (!spots.length) return this.goal.clone();
    const key = nextTeleportSpot(spots, e.spotKey);
    e.spotKey = key;
    const [col, row] = key.split(',').map(Number);
    return tileToWorld(col, row);
  }

  // He never walks: he teleports around the kitchen and shoots at the milk.
  _stefoBrain(e, dt) {
    e.group.position.y = Math.abs(Math.sin(this.time * 4)) * 0.16;
    e.tpT += dt;
    e.shootT += dt;
    if (e.tpT >= STEFO.teleportEvery) { e.tpT = 0; this._stefoTeleport(e); }
    if (e.shootT >= STEFO.shootEvery) { e.shootT = 0; this._stefoShoot(e); }
  }

  _stefoTeleport(e) {
    this.effects.burst(e.group.position.clone().setY(1.2), { count: 20, color: 0xff8a1f, speed: 6, size: 0.5 });
    const spot = this._stefoSpot(e);
    e.pos.set(spot.x, 0, spot.z);
    e.group.position.set(spot.x, 0, spot.z);
    e.group.rotation.y = Math.atan2(this.goal.x - spot.x, this.goal.z - spot.z);
    e.spot = spot;
    if (this.boss === e) this.ui.toast(t('toast.stefoTeleport'));
    this.effects.ring(e.pos.clone(), { color: 0xff8a1f, from: 0.4, to: 10, life: 0.6 });
    this.effects.burst(e.group.position.clone().setY(1.2), { count: 20, color: 0xffd166, speed: 6, size: 0.5 });
    sfx.portal();
  }

  _stefoShoot(e) {
    const mesh = makeBasketball(0.42);
    const from = e.group.position.clone().setY(2.6);
    mesh.position.copy(from);
    this.scene.add(mesh);
    const to = this.goal.clone().setY(0.8);
    this.hazards.push({
      mesh, from, to, t: 0, basket: true,
      dur: Math.max(0.7, from.distanceTo(to) / STEFO.shotSpeed),
    });
    this.effects.trail(from.clone(), 0xff8a1f, 0.4);
    sfx.bounce();
  }

  // ----------------------------------------------------------------- Father
  _fatherEntrance(e, dt) {
    e.intro += dt;
    const k = Math.min(1, e.intro / e.introDur);
    const ease = k * k * (3 - 2 * k);
    const land = e.route[0];
    e.group.position.set(land.x, (1 - ease) * 40, land.z);
    e.group.rotation.y = (1 - ease) * Math.PI * 2;
    if (Math.random() < dt * 20) this.effects.trail(e.group.position.clone(), 0xff3b6b, 0.6);
    if (k < 1) return;
    e.intro = null;
    e.pos.set(land.x, 0, land.z);
    e.group.position.copy(e.pos);
    this.effects.ring(e.pos.clone(), { color: 0xff3b6b, from: 1, to: 40, life: 1.3 });
    this.effects.burst(e.pos.clone().setY(1.6), { count: 60, color: 0xff3b6b, speed: 11, size: 0.9 });
    this.effects.kick(1.2);
    sfx.stomp();
    sfx.roar();
    const gone = this._fatherCrush(FATHER.destroyOnArrival);
    this.ui.toast(t('toast.fatherArrives', { count: gone }));
  }

  // Flattens a share of the cats currently on the table.
  _fatherCrush(fraction) {
    const picks = destroyPicks(this.towers.length, fraction);
    const doomed = picks.map((i) => this.towers[i]).filter(Boolean);
    for (const tw of doomed) {
      this.effects.burst(tw.pos.clone().setY(0.8), { count: 20, color: 0xff3b6b, speed: 6, size: 0.6 });
      this._destroyTower(tw);
    }
    if (doomed.length) sfx.boom();
    this.ui.refreshShop();
    return doomed.length;
  }

  _fatherBrain(e, dt) {
    e.stompT += dt;
    if (e.stompT < FATHER.stompEvery) return;
    e.stompT = 0;
    if (!this.towers.length) return;
    const victim = this.towers[Math.floor(Math.random() * this.towers.length)];
    const name = t(`tower.${victim.kind}.name`);
    this.effects.burst(victim.pos.clone().setY(0.8), { count: 20, color: 0xff3b6b, speed: 6, size: 0.6 });
    this._destroyTower(victim);
    this.ui.refreshShop();
    this.effects.ring(e.group.position.clone().setY(0.05), { color: 0xff3b6b, from: 0.6, to: 14, life: 0.7 });
    this.effects.kick(0.7);
    sfx.stomp();
    this.ui.toast(t('toast.fatherStomp', { name }));
  }

  // "I AM THE BOSS": he refuses to go down the first time.
  _fatherRevive(e) {
    e.revivesLeft -= 1;
    e.hp = e.maxHp;
    this.ui.boss(1, enemyName(e.kind).toUpperCase());
    this.effects.ring(e.group.position.clone().setY(0.05), { color: 0xffd166, from: 1, to: 34, life: 1.2 });
    this.effects.burst(e.group.position.clone().setY(1.6), { count: 60, color: 0xffd166, speed: 10, size: 0.9 });
    this.effects.kick(1.1);
    sfx.roar();
    const gone = this._fatherCrush(reviveFraction(FATHER.destroyOnArrival));
    this.ui.banner(t('banner.fatherRevive'), t('toast.fatherRevive', { count: gone }));
    this.ui.toast(t('toast.fatherRevive', { count: gone }));
  }

  // Drop a freshly summoned pest onto the closest point of its own lane, so it
  // appears next to Sophie instead of trekking in from the door. Sophie flies
  // straight over the maze, so the drop is clamped to `maxFraction` of the lane
  // — she can't cheat her friends into the last corner next to the bowl.
  _placeOnRoute(minion, worldPos, maxFraction = 0.55) {
    if (minion.flying) return;
    const route = minion.route;
    const flat = new THREE.Vector3(worldPos.x, 0, worldPos.z);
    const lens = [];
    let total = 0;
    for (let i = 1; i < route.length; i++) {
      const len = route[i].distanceTo(route[i - 1]) || 1;
      lens.push(len);
      total += len;
    }
    let best = null;
    let travelled = 0;
    for (let i = 1; i < route.length; i++) {
      const a = route[i - 1];
      const ab = route[i].clone().sub(a);
      const len = lens[i - 1];
      const k = Math.max(0, Math.min(1, flat.clone().sub(a).dot(ab) / (len * len)));
      const d = a.clone().addScaledVector(ab, k).distanceTo(flat);
      if (!best || d < best.d) best = { progress: travelled + len * k, d };
      travelled += len;
    }
    if (!best) return;

    // Walk the clamped distance back out to a segment + world position.
    let want = Math.min(best.progress, total * maxFraction);
    let seg = 1;
    let along = 0;
    while (seg < route.length && want > lens[seg - 1]) { want -= lens[seg - 1]; seg++; }
    along = Math.min(want, lens[seg - 1]);
    const a = route[seg - 1];
    const dir = route[seg].clone().sub(a).normalize();
    minion.seg = seg;
    minion.progress = Math.min(best.progress, total * maxFraction);
    minion.pos.copy(a).addScaledVector(dir, along).setY(0);
    minion.group.position.copy(minion.pos);
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
    for (const lane of this.lanes) {
      if (!lane.arrows.visible) continue;
      for (const a of lane.arrows.userData.arrows) {
        a.position.y = 0.24 + Math.sin(this.time * 3 - a.userData.phase) * 0.07;
      }
      lane.arrows.userData.material.opacity = 0.3 + Math.sin(this.time * 3) * 0.12;
    }
    if (this.portal && this.lanes[1].open) {
      this.portal.userData.glow.material.opacity = 0.6 + Math.sin(this.time * 4) * 0.25;
      this.portal.rotation.y += dt * 0.4;
    }
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
