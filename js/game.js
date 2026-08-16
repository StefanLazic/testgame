import * as THREE from 'three';
import { makeCat, makeMouse, makeArena, makeStars, makeCatnip } from './models.js';
import { Effects } from './fx.js';
import { Input } from './input.js';
import { initAudio, sfx } from './audio.js';

const UP = new THREE.Vector3(0, 1, 0);
const tmp = new THREE.Vector3();

const CONFIG = {
  arena: 18,
  cat: { speed: 8, hp: 9, mana: 100, manaRegen: 7, radius: 0.8 },
  claw: { cd: 0.4, range: 3.2, arc: Math.PI * 0.7, dmg: 3, knock: 6 },
  hairball: { cd: 1.1, cost: 20, speed: 19, dmg: 7, splash: 3.4, life: 1.6 },
  thunder: { cd: 6.5, cost: 45, dmg: 12, radius: 7.5, stun: 1.6 },
  frenzy: { time: 9 },
};

const ENEMY_TYPES = {
  grunt: { hp: 4, speed: 2.7, dmg: 1, scale: 1, score: 1, radius: 0.6 },
  fast: { hp: 3, speed: 5.0, dmg: 1, scale: 0.85, score: 2, radius: 0.5 },
  tank: { hp: 15, speed: 1.9, dmg: 2, scale: 1.5, score: 3, radius: 0.95 },
  king: { hp: 70, speed: 2.6, dmg: 3, scale: 3.2, score: 25, radius: 2.0 },
};

export class Game {
  constructor(canvas, ui) {
    this.ui = ui;
    this.canvas = canvas;

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: window.devicePixelRatio < 2 });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x150c24);
    this.scene.fog = new THREE.Fog(0x150c24, 26, 62);

    this.camera = new THREE.PerspectiveCamera(58, 1, 0.1, 200);
    this.camOffset = new THREE.Vector3(0, 13.5, 12.5);
    this.camLook = new THREE.Vector3();

    this.scene.add(new THREE.HemisphereLight(0xd9c0ff, 0x3a1f5c, 1.5));
    const sun = new THREE.DirectionalLight(0xfff0d6, 1.35);
    sun.position.set(9, 18, 7);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    const s = 24;
    sun.shadow.camera.left = -s; sun.shadow.camera.right = s;
    sun.shadow.camera.top = s; sun.shadow.camera.bottom = -s;
    sun.shadow.camera.far = 60;
    this.scene.add(sun);
    this.sun = sun;

    this.arena = makeArena(CONFIG.arena);
    this.scene.add(this.arena.group);
    this.scene.add(makeStars());

    this.catLight = new THREE.PointLight(0xff9ad8, 1.4, 14, 2);
    this.scene.add(this.catLight);

    this.cat = makeCat();
    this.scene.add(this.cat.group);

    // Decorative mice that circle the cat on the title screen.
    this.menuMice = [];
    for (let i = 0; i < 6; i++) {
      const m = makeMouse(i === 0 ? 'king' : (i % 3 === 0 ? 'fast' : 'grunt'));
      m.group.scale.setScalar(i === 0 ? 1.6 : 1);
      this.scene.add(m.group);
      this.menuMice.push({ g: m.group, a: (i / 6) * Math.PI * 2, r: 4.2 + (i % 3) * 0.9, s: 0.5 + i * 0.06 });
    }

    this.fx = new Effects(this.scene);
    this.input = new Input();

    this.enemies = [];
    this.projectiles = [];
    this.pickups = [];
    this.enemyPool = { grunt: [], fast: [], tank: [], king: [] };

    this.state = 'menu';
    this.time = 0;
    this._resize();
    window.addEventListener('resize', () => this._resize());
    window.addEventListener('orientationchange', () => setTimeout(() => this._resize(), 250));

    this.reset(true);
    this._last = performance.now();
    this._loop = this._loop.bind(this);
    requestAnimationFrame(this._loop);
  }

  // -------------------------------------------------------------- lifecycle
  reset(menu = false) {
    for (const e of this.enemies) this._despawn(e);
    this.enemies.length = 0;
    for (const p of this.projectiles) this.scene.remove(p.mesh);
    this.projectiles.length = 0;
    for (const p of this.pickups) this.scene.remove(p.mesh);
    this.pickups.length = 0;

    this.pos = new THREE.Vector3(0, 0, 0);
    this.vel = new THREE.Vector3();
    this.facing = new THREE.Vector3(0, 0, 1);
    this.hp = CONFIG.cat.hp;
    this.mana = CONFIG.cat.mana;
    this.score = 0;
    this.wave = 0;
    this.waveKills = 0;
    this.waveTarget = 0;
    this.spawnQueue = [];
    this.spawnTimer = 0;
    this.intermission = 1.6;
    this.frenzy = 0;
    this.cd = { claw: 0, hairball: 0, thunder: 0 };
    this.invuln = 0;
    this.cat.group.position.set(0, 0, 0);
    this.cat.group.scale.setScalar(1);
    this.cat.group.rotation.y = 0;
    this.camera.position.copy(this.camOffset);
    this.camLook.set(0, 0, 0);
    this.state = menu ? 'menu' : 'playing';
    this.ui.setHP(this.hp, CONFIG.cat.hp);
    this.ui.setMana(this.mana, CONFIG.cat.mana);
    this.ui.setScore(0);
    this.ui.setWave(1);
    this.ui.frenzy(false);
    this.ui.boss(null);
  }

  start() {
    this.reset();
    this.input.reset();
    for (const m of this.menuMice) m.g.visible = false;
    this.state = 'playing';
    this.ui.toast('Wave 1');
    sfx.wave();
  }

  gameOver() {
    this.state = 'over';
    sfx.gameover();
    this.ui.gameOver(this.score, this.wave);
  }

  _resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.camera.aspect = w / h;
    // Pull the camera back on tall/narrow phone screens so the arena still fits.
    const portrait = h > w;
    this.camOffset.set(0, portrait ? 15.5 : 12.5, portrait ? 13.5 : 12);
    this.camera.fov = portrait ? 62 : 55;
    this.camera.updateProjectionMatrix();
  }

  // ----------------------------------------------------------------- waves
  _startWave(n) {
    this.wave = n;
    this.waveKills = 0;
    this.ui.setWave(n);
    const queue = [];
    const grunts = 4 + Math.floor(n * 1.7);
    for (let i = 0; i < grunts; i++) queue.push('grunt');
    for (let i = 0; i < Math.floor(n * 0.9); i++) queue.push('fast');
    for (let i = 0; i < Math.floor((n - 1) / 2); i++) queue.push('tank');
    if (n % 5 === 0) queue.push('king');
    // shuffle for variety
    for (let i = queue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [queue[i], queue[j]] = [queue[j], queue[i]];
    }
    this.spawnQueue = queue;
    this.waveTarget = queue.length;
    this.spawnTimer = 0;
    if (n % 5 === 0) this.ui.toast(`Wave ${n} — MOUSE KING!`);
    else this.ui.toast(`Wave ${n}`);
    sfx.wave();
  }

  _spawn(kind) {
    const def = ENEMY_TYPES[kind];
    let e = this.enemyPool[kind].pop();
    if (!e) {
      const model = makeMouse(kind);
      e = { kind, model, group: model.group };
      this.scene.add(model.group);
    }
    e.group.visible = true;
    const a = Math.random() * Math.PI * 2;
    const r = CONFIG.arena * (0.82 + Math.random() * 0.15);
    e.pos = new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r);
    e.hp = def.hp + (kind === 'king' ? this.wave * 8 : Math.floor(this.wave * 0.6));
    e.maxHp = e.hp;
    e.speed = def.speed * (0.9 + Math.random() * 0.25);
    e.dmg = def.dmg;
    e.radius = def.radius;
    e.score = def.score;
    e.stun = 0;
    e.flash = 0;
    e.hitCd = 0;
    e.wobble = Math.random() * 10;
    e.charge = 0;
    e.chargeCd = 3;
    e.dead = false;
    e.group.scale.setScalar(def.scale);
    e.group.position.copy(e.pos);
    e.group.position.y = 6 + Math.random() * 3; // drop in from above: mice fall from the ceiling
    e.dropping = true;
    this.enemies.push(e);
    return e;
  }

  _despawn(e) {
    e.group.visible = false;
    this.enemyPool[e.kind].push(e);
  }

  _kill(e, silent = false) {
    e.dead = true;
    const idx = this.enemies.indexOf(e);
    if (idx >= 0) this.enemies.splice(idx, 1);
    this._despawn(e);
    if (silent) return;
    this.score += e.score;
    this.waveKills++;
    this.ui.setScore(this.score);
    this.fx.burst(e.group.position.clone().setY(0.5), {
      count: e.kind === 'king' ? 40 : 12,
      color: e.kind === 'king' ? 0xffd166 : 0xff9ec4,
      speed: e.kind === 'king' ? 9 : 5,
      size: e.kind === 'king' ? 1 : 0.5,
    });
    sfx.squeak();
    if (e.kind === 'king') {
      this.fx.ring(e.group.position, { color: 0xffd166, to: 10, life: 0.8 });
      this.fx.kick(0.9);
      this.ui.toast('The King has fallen!');
      this._dropPickup(e.group.position, true);
    } else if (Math.random() < 0.075) {
      this._dropPickup(e.group.position);
    }
  }

  _dropPickup(pos, forced = false) {
    const mesh = makeCatnip();
    mesh.position.set(pos.x, 0.4, pos.z);
    this.scene.add(mesh);
    this.pickups.push({ mesh, t: 0, life: forced ? 20 : 12 });
  }

  // ------------------------------------------------------------- abilities
  _aim() {
    // Aim at the nearest enemy in front, otherwise keep the facing direction.
    let best = null;
    let bestD = Infinity;
    for (const e of this.enemies) {
      const d = e.group.position.distanceTo(this.pos);
      if (d < bestD) { bestD = d; best = e; }
    }
    if (best && bestD < 16) {
      return tmp.copy(best.group.position).sub(this.pos).setY(0).normalize().clone();
    }
    return this.facing.clone();
  }

  _claw() {
    if (this.cd.claw > 0) return;
    this.cd.claw = this.frenzy > 0 ? CONFIG.claw.cd * 0.5 : CONFIG.claw.cd;
    const dir = this._aim();
    this.facing.copy(dir);
    const range = CONFIG.claw.range * (this.frenzy > 0 ? 1.5 : 1);
    const dmg = CONFIG.claw.dmg * (this.frenzy > 0 ? 2.5 : 1);
    sfx.claw();

    const center = this.pos.clone().addScaledVector(dir, range * 0.55).setY(0.6);
    this.fx.burst(center, { count: 8, color: 0xffffff, speed: 3, size: 0.35, life: 0.3, gravity: 0 });
    this.fx.ring(this.pos.clone().addScaledVector(dir, range * 0.4), {
      color: this.frenzy > 0 ? 0xb6ff6b : 0xffffff, from: 0.6, to: range * 0.9, life: 0.22, y: 0.5,
    });
    this._swing = 0.22;

    for (const e of [...this.enemies]) {
      const to = tmp.copy(e.group.position).sub(this.pos).setY(0);
      const d = to.length();
      if (d > range + e.radius) continue;
      if (d > 0.001 && to.normalize().dot(dir) < Math.cos(CONFIG.claw.arc / 2)) continue;
      this._damage(e, dmg, dir, CONFIG.claw.knock);
    }
  }

  _hairball() {
    if (this.cd.hairball > 0 || this.mana < CONFIG.hairball.cost) return;
    this.cd.hairball = CONFIG.hairball.cd;
    this.mana -= CONFIG.hairball.cost;
    const dir = this._aim();
    this.facing.copy(dir);
    const mesh = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.42, 1),
      new THREE.MeshLambertMaterial({ color: 0xff8a3d, emissive: 0x883000 })
    );
    mesh.position.copy(this.pos).setY(0.9).addScaledVector(dir, 0.9);
    this.scene.add(mesh);
    this.projectiles.push({ mesh, dir: dir.clone(), life: CONFIG.hairball.life, spin: Math.random() * 6 });
    sfx.hairball();
  }

  _thunder() {
    if (this.cd.thunder > 0 || this.mana < CONFIG.thunder.cost) return;
    this.cd.thunder = CONFIG.thunder.cd;
    this.mana -= CONFIG.thunder.cost;
    sfx.thunder();
    this.fx.ring(this.pos, { color: 0xbff0ff, from: 0.6, to: CONFIG.thunder.radius * 2, life: 0.55 });
    this.fx.ring(this.pos, { color: 0xffffff, from: 0.4, to: CONFIG.thunder.radius * 1.4, life: 0.35, y: 0.6 });
    this.fx.kick(0.8);
    this.flashLight = 0.25;

    const head = this.pos.clone().setY(2.2);
    for (const e of [...this.enemies]) {
      const d = e.group.position.distanceTo(this.pos);
      if (d > CONFIG.thunder.radius) continue;
      this.fx.bolt(head, e.group.position.clone().setY(0.6));
      e.stun = CONFIG.thunder.stun;
      const dir = tmp.copy(e.group.position).sub(this.pos).setY(0).normalize().clone();
      this._damage(e, CONFIG.thunder.dmg, dir, 5);
    }
  }

  _damage(e, dmg, dir, knock = 0) {
    if (e.dead) return;
    e.hp -= dmg;
    e.flash = 0.12;
    if (knock && dir) e.pos.addScaledVector(dir, knock * 0.12);
    this.fx.burst(e.group.position.clone().setY(0.6), { count: 5, color: 0xffe0f0, speed: 3, size: 0.3, life: 0.3 });
    if (e.hp <= 0) this._kill(e);
  }

  _explode(pos) {
    sfx.boom();
    this.fx.burst(pos, { count: 26, color: 0xffb347, speed: 8, size: 0.8, life: 0.6 });
    this.fx.ring(pos, { color: 0xff8a3d, from: 0.5, to: CONFIG.hairball.splash * 2, life: 0.4 });
    this.fx.kick(0.5);
    for (const e of [...this.enemies]) {
      const d = e.group.position.distanceTo(pos);
      if (d > CONFIG.hairball.splash + e.radius) continue;
      const dir = tmp.copy(e.group.position).sub(pos).setY(0).normalize().clone();
      const falloff = 1 - Math.min(1, d / (CONFIG.hairball.splash * 1.6));
      this._damage(e, CONFIG.hairball.dmg * (0.5 + falloff), dir, 7);
    }
  }

  _hurt(amount) {
    if (this.invuln > 0 || this.state !== 'playing') return;
    this.hp -= amount;
    this.invuln = 1.0;
    this.ui.setHP(Math.max(0, this.hp), CONFIG.cat.hp);
    this.ui.hitFlash();
    this.fx.kick(0.6);
    sfx.hurt();
    if (this.hp <= 0) this.gameOver();
  }

  _startFrenzy() {
    this.frenzy = CONFIG.frenzy.time;
    this.ui.frenzy(true);
    this.ui.toast('CATNIP FRENZY!');
    this.fx.ring(this.pos, { color: 0xb6ff6b, from: 0.5, to: 12, life: 0.7 });
    sfx.pickup();
    sfx.purr();
  }

  // ------------------------------------------------------------------ loop
  _loop(now) {
    requestAnimationFrame(this._loop);
    const dt = Math.min(0.05, (now - this._last) / 1000);
    this._last = now;
    this.time += dt;

    if (this.state === 'playing') this._update(dt);
    else if (this.state === 'menu') this._idle(dt);

    this.fx.update(dt);
    this._updateCamera(dt);
    this.renderer.render(this.scene, this.camera);
  }

  _idle(dt) {
    // Slow orbit + tail wag for the title screen backdrop, with a ring of mice
    // circling the cat like sharks.
    const t = this.time * 0.25;
    this.camera.position.set(Math.cos(t) * 14, 6.5, Math.sin(t) * 14);
    this.camera.lookAt(0, -0.6, 0);
    this.cat.group.rotation.y += dt * 0.35;
    this._animateCat(dt, 0);
    this._animateArena(dt);
    this.catLight.position.copy(this.cat.group.position).setY(2.2);
    for (const m of this.menuMice) {
      m.a += dt * m.s;
      m.g.visible = true;
      m.g.position.set(Math.cos(m.a) * m.r, Math.abs(Math.sin(this.time * 8 + m.a)) * 0.12, Math.sin(m.a) * m.r);
      m.g.rotation.y = -m.a + Math.PI / 2;
    }
  }

  _update(dt) {
    const inp = this.input;
    if (inp.consume('claw')) this._claw();
    if (inp.consume('hairball')) this._hairball();
    if (inp.consume('thunder')) this._thunder();

    for (const k of Object.keys(this.cd)) this.cd[k] = Math.max(0, this.cd[k] - dt);
    this.invuln = Math.max(0, this.invuln - dt);
    if (this._swing) this._swing = Math.max(0, this._swing - dt);

    const frenzied = this.frenzy > 0;
    if (frenzied) {
      this.frenzy -= dt;
      if (this.frenzy <= 0) { this.ui.frenzy(false); this.cat.group.scale.setScalar(1); }
      else {
        const p = 1 + Math.sin(this.time * 18) * 0.06;
        this.cat.group.scale.setScalar(1.35 * p);
        this.fx.trail(this.pos.clone().setY(0.7), new THREE.Color().setHSL((this.time * 0.7) % 1, 1, 0.6).getHex(), 0.7);
      }
    }

    this.mana = Math.min(CONFIG.cat.mana, this.mana + CONFIG.cat.manaRegen * (frenzied ? 3 : 1) * dt);
    this.ui.setMana(this.mana, CONFIG.cat.mana);
    this.ui.setCooldowns(this.cd, this.mana, CONFIG);

    // --- movement
    const dir = inp.direction();
    const speed = CONFIG.cat.speed * (frenzied ? 1.5 : 1);
    const want = tmp.set(dir.x, 0, dir.y).multiplyScalar(speed);
    this.vel.lerp(want, 1 - Math.pow(0.0015, dt));
    this.pos.addScaledVector(this.vel, dt);

    const limit = CONFIG.arena - 1;
    const distFromCenter = Math.hypot(this.pos.x, this.pos.z);
    if (distFromCenter > limit) {
      this.pos.multiplyScalar(limit / distFromCenter);
      this.vel.multiplyScalar(0.4);
    }
    if (dir.len > 0.05) this.facing.set(dir.x, 0, dir.y).normalize();

    this.cat.group.position.copy(this.pos);
    const targetYaw = Math.atan2(this.facing.x, this.facing.z);
    this.cat.group.rotation.y += shortestAngle(this.cat.group.rotation.y, targetYaw) * Math.min(1, dt * 14);
    this._animateCat(dt, this.vel.length());
    this.cat.group.visible = !(this.invuln > 0 && Math.floor(this.time * 18) % 2 === 0);

    this.catLight.position.copy(this.pos).setY(2.4);
    this.catLight.color.setHex(frenzied ? 0xb6ff6b : 0xff9ad8);
    this.catLight.intensity = 1.4 + (this.flashLight > 0 ? 6 : 0);
    if (this.flashLight > 0) this.flashLight -= dt;

    this._updateWaves(dt);
    this._updateEnemies(dt, frenzied);
    this._updateProjectiles(dt);
    this._updatePickups(dt);
    this._animateArena(dt);

    const king = this.enemies.find((e) => e.kind === 'king');
    this.ui.boss(king ? king.hp / king.maxHp : null);
  }

  _updateWaves(dt) {
    if (this.spawnQueue.length > 0) {
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0) {
        this._spawn(this.spawnQueue.pop());
        this.spawnTimer = Math.max(0.16, 0.7 - this.wave * 0.03);
      }
    } else if (this.enemies.length === 0) {
      this.intermission -= dt;
      if (this.intermission <= 0) {
        this.intermission = 3.2;
        this._startWave(this.wave + 1);
        // Reward for clearing: a bit of healing every few waves.
        if (this.wave > 1 && this.wave % 3 === 1 && this.hp < CONFIG.cat.hp) {
          this.hp = Math.min(CONFIG.cat.hp, this.hp + 2);
          this.ui.setHP(this.hp, CONFIG.cat.hp);
          this.ui.toast('+2 lives');
        }
      }
    }
  }

  _updateEnemies(dt, frenzied) {
    // Snapshot: damage can kill (splice) and the king can spawn reinforcements.
    for (const e of [...this.enemies]) {
      if (e.dead) continue;
      const g = e.group;
      if (e.dropping) {
        g.position.y -= dt * 16;
        if (g.position.y <= 0) {
          g.position.y = 0;
          e.dropping = false;
          this.fx.burst(g.position.clone().setY(0.2), { count: 6, color: 0x9a7ad0, speed: 2.5, size: 0.4, life: 0.35 });
        }
        g.rotation.x += dt * 8;
        continue;
      }
      g.rotation.x = 0;

      if (e.flash > 0) {
        e.flash -= dt;
        g.scale.setScalar(ENEMY_TYPES[e.kind].scale * (1 + e.flash * 1.6));
      }

      if (e.stun > 0) {
        e.stun -= dt;
        g.rotation.z = Math.sin(this.time * 30) * 0.25;
        if (Math.random() < dt * 8) this.fx.trail(g.position.clone().setY(0.8), 0xbff0ff, 0.3);
        continue;
      }
      g.rotation.z = 0;

      const to = tmp.copy(this.pos).sub(e.pos).setY(0);
      const d = to.length();
      to.normalize();

      let speed = e.speed;
      if (e.kind === 'fast') {
        // Weaving approach so they're harder to claw.
        e.wobble += dt * 5;
        const side = new THREE.Vector3().crossVectors(to, UP).multiplyScalar(Math.sin(e.wobble) * 0.6);
        to.add(side).normalize();
      }
      if (e.kind === 'king') {
        e.chargeCd -= dt;
        if (e.charge > 0) {
          e.charge -= dt;
          speed = e.speed * 3.4;
          this.fx.trail(e.pos.clone().setY(0.6), 0xff6bd0, 0.6);
        } else if (e.chargeCd <= 0 && d < 14) {
          e.charge = 1.1;
          e.chargeCd = 4.5 + Math.random() * 2;
          this.fx.ring(e.pos, { color: 0xff6bd0, from: 0.5, to: 4, life: 0.3 });
          // The king yells for backup.
          if (this.enemies.length < 28) {
            for (let i = 0; i < 2; i++) this._spawn('grunt');
          }
        }
      }

      e.pos.addScaledVector(to, speed * dt);

      // Separation so the swarm doesn't collapse into one point.
      for (const o of this.enemies) {
        if (o === e || o.dropping) continue;
        const dx = e.pos.x - o.pos.x;
        const dz = e.pos.z - o.pos.z;
        const dd = Math.hypot(dx, dz);
        const min = e.radius + o.radius;
        if (dd > 0.0001 && dd < min) {
          const push = (min - dd) * 0.5;
          e.pos.x += (dx / dd) * push;
          e.pos.z += (dz / dd) * push;
        }
      }

      g.position.set(e.pos.x, Math.abs(Math.sin(this.time * 9 + e.wobble)) * 0.14, e.pos.z);
      g.rotation.y = Math.atan2(to.x, to.z);

      // Contact damage
      e.hitCd = Math.max(0, e.hitCd - dt);
      if (d < CONFIG.cat.radius + e.radius) {
        if (frenzied) {
          this._damage(e, 6, to.clone().negate(), 9);
        } else if (e.hitCd <= 0) {
          e.hitCd = 1.1;
          this._hurt(e.dmg);
          e.pos.addScaledVector(to, -1.2);
        }
      }
    }
  }

  _updateProjectiles(dt) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.life -= dt;
      p.mesh.position.addScaledVector(p.dir, CONFIG.hairball.speed * dt);
      p.mesh.rotation.x += dt * 9;
      p.mesh.rotation.y += dt * 7 * p.spin * 0.2;
      this.fx.trail(p.mesh.position.clone(), 0xff8a3d, 0.5);

      let hit = p.life <= 0;
      if (!hit) {
        for (const e of this.enemies) {
          if (e.dropping) continue;
          if (e.group.position.distanceTo(p.mesh.position) < e.radius + 0.5) { hit = true; break; }
        }
      }
      if (!hit && Math.hypot(p.mesh.position.x, p.mesh.position.z) > CONFIG.arena) hit = true;

      if (hit) {
        this._explode(p.mesh.position.clone().setY(0.6));
        this.scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        p.mesh.material.dispose();
        this.projectiles.splice(i, 1);
      }
    }
  }

  _updatePickups(dt) {
    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const p = this.pickups[i];
      p.t += dt;
      p.life -= dt;
      p.mesh.rotation.y += dt * 2;
      p.mesh.position.y = 0.45 + Math.sin(p.t * 3) * 0.15;
      if (Math.random() < dt * 4) this.fx.trail(p.mesh.position.clone(), 0x8dff5a, 0.3);
      const d = p.mesh.position.distanceTo(this.pos);
      if (d < 4) p.mesh.position.lerp(this.pos.clone().setY(0.5), Math.min(1, dt * 3)); // magnetised
      if (d < 1.2 || p.life <= 0) {
        if (d < 1.2) this._startFrenzy();
        this.scene.remove(p.mesh);
        this.pickups.splice(i, 1);
      }
    }
  }

  _animateCat(dt, speed) {
    const t = this.time;
    const run = Math.min(1, speed / CONFIG.cat.speed);
    for (let i = 0; i < this.cat.legs.length; i++) {
      const phase = t * 13 + i * Math.PI * 0.5;
      this.cat.legs[i].position.y = 0.18 + Math.max(0, Math.sin(phase)) * 0.16 * run;
    }
    this.cat.head.position.y = 1.12 + Math.sin(t * 3) * 0.03 + (this._swing ? this._swing * 0.5 : 0);
    this.cat.head.rotation.x = this._swing ? -this._swing * 2.2 : Math.sin(t * 1.7) * 0.05;
    this.cat.body.rotation.z = Math.sin(t * 13) * 0.04 * run;
    for (let i = 0; i < this.cat.tail.length; i++) {
      const seg = this.cat.tail[i];
      const k = i / this.cat.tail.length;
      seg.position.set(
        Math.sin(t * 4 + i * 0.6) * 0.28 * k,
        k * 0.55 + Math.sin(t * 5 + i * 0.5) * 0.06,
        -i * 0.18
      );
    }
  }

  _animateArena(dt) {
    for (let i = 0; i < this.arena.pillars.length; i++) {
      const y = this.arena.pillars[i].userData.yarn;
      y.rotation.y += dt * (0.6 + i * 0.1);
      y.position.y = 1.5 + Math.sin(this.time * 1.6 + i) * 0.12;
    }
  }

  _updateCamera(dt) {
    if (this.state === 'menu') return;
    const look = this.pos.clone().addScaledVector(this.facing, 1.6);
    this.camLook.lerp(look, Math.min(1, dt * 4));
    const want = this.pos.clone().add(this.camOffset);
    this.camera.position.lerp(want, Math.min(1, dt * 5));
    if (this.fx.shake > 0) {
      const s = this.fx.shake * 0.5;
      this.camera.position.x += (Math.random() - 0.5) * s;
      this.camera.position.y += (Math.random() - 0.5) * s;
      this.camera.position.z += (Math.random() - 0.5) * s;
    }
    this.camera.lookAt(this.camLook.x, 0.8, this.camLook.z);
    this.sun.position.set(this.pos.x + 9, 18, this.pos.z + 7);
    this.sun.target.position.copy(this.pos);
    this.sun.target.updateMatrixWorld();
  }
}

function shortestAngle(from, to) {
  let d = (to - from) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export { CONFIG, initAudio };
