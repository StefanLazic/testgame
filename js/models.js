import * as THREE from 'three';
import { TILE, COLS, ROWS, THEME } from './config.js';

// ---------------------------------------------------------------------------
// Procedural low-poly models. No external assets — every mesh is built from
// primitives so the game stays a handful of static files.
// ---------------------------------------------------------------------------

const mat = (color, opts = {}) => new THREE.MeshLambertMaterial({ color, ...opts });

const BOX = new THREE.BoxGeometry(1, 1, 1);
const SPHERE = new THREE.SphereGeometry(0.5, 12, 10);
const CONE = new THREE.ConeGeometry(0.5, 1, 10);
const CIRCLE = new THREE.CircleGeometry(0.5, 14);

function part(geo, material, { pos = [0, 0, 0], scale = [1, 1, 1], rot = [0, 0, 0] } = {}) {
  const m = new THREE.Mesh(geo, material);
  m.position.set(...pos);
  m.scale.set(...scale);
  m.rotation.set(...rot);
  return m;
}

// ------------------------------------------------------------- cat towers --
// A sitting cat. `head` is returned so towers can look at their target and
// `arm` so they can wave whatever weapon they hold.
export function makeCatTower(kind, palette) {
  const g = new THREE.Group();
  const furM = mat(palette.color);
  const accM = mat(palette.accent);
  const bellyM = mat(0xfff2dd);
  const darkM = mat(0x241730);
  const pinkM = mat(0xff9ec4);

  const body = part(SPHERE, furM, { pos: [0, 0.44, 0], scale: [0.78, 0.9, 0.72] });
  g.add(body);
  g.add(part(SPHERE, bellyM, { pos: [0, 0.4, 0.24], scale: [0.46, 0.6, 0.4] }));
  // front paws
  for (const s of [-1, 1]) g.add(part(SPHERE, furM, { pos: [0.22 * s, 0.1, 0.3], scale: [0.22, 0.16, 0.3] }));

  const head = new THREE.Group();
  head.position.set(0, 0.94, 0.04);
  head.add(part(SPHERE, furM, { scale: [0.66, 0.6, 0.6] }));
  head.add(part(SPHERE, bellyM, { pos: [0, -0.1, 0.24], scale: [0.36, 0.26, 0.2] }));
  head.add(part(CONE, pinkM, { pos: [0, -0.06, 0.33], scale: [0.08, 0.08, 0.08], rot: [Math.PI / 2, 0, 0] }));
  for (const s of [-1, 1]) {
    head.add(part(CONE, furM, { pos: [0.23 * s, 0.3, -0.02], scale: [0.26, 0.36, 0.26], rot: [0, 0, -0.24 * s] }));
    head.add(part(CONE, pinkM, { pos: [0.23 * s, 0.29, 0.04], scale: [0.14, 0.24, 0.14], rot: [0, 0, -0.24 * s] }));
    head.add(part(SPHERE, mat(0x9cff6b, { emissive: 0x2f6b12 }), { pos: [0.17 * s, 0.05, 0.26], scale: [0.15, 0.18, 0.1] }));
    head.add(part(SPHERE, darkM, { pos: [0.17 * s, 0.05, 0.3], scale: [0.05, 0.13, 0.07] }));
  }
  const whiskerM = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 });
  for (const s of [-1, 1]) {
    for (let i = 0; i < 2; i++) {
      const geo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0.09 * s, -0.05, 0.26),
        new THREE.Vector3(0.44 * s, 0.02 + i * 0.08, 0.28),
      ]);
      head.add(new THREE.Line(geo, whiskerM));
    }
  }
  g.add(head);

  // curled tail
  const tail = new THREE.Group();
  tail.position.set(0.3, 0.16, -0.34);
  for (let i = 0; i < 6; i++) {
    const a = i * 0.55;
    tail.add(part(SPHERE, i === 5 ? bellyM : furM, {
      pos: [Math.sin(a) * 0.34, i * 0.07, -Math.cos(a) * 0.2 + 0.2],
      scale: [0.19 - i * 0.012, 0.19 - i * 0.012, 0.19 - i * 0.012],
    }));
  }
  g.add(tail);

  // Weapon arm: gets a per-kind prop bolted on.
  const arm = new THREE.Group();
  arm.position.set(0, 0.62, 0.28);
  g.add(arm);

  if (kind === 'archer') {
    const bow = new THREE.Mesh(
      new THREE.TorusGeometry(0.32, 0.05, 6, 12, Math.PI * 1.25),
      mat(0x8a5a2b)
    );
    bow.rotation.set(0, Math.PI / 2, Math.PI / 2);
    bow.position.set(0.18, 0.05, 0.16);
    arm.add(bow);
    arm.add(part(BOX, mat(0x5c3d1d), { pos: [-0.2, 0.24, -0.2], scale: [0.14, 0.4, 0.14], rot: [0.3, 0, 0.4] }));
    head.add(part(new THREE.TorusGeometry(0.3, 0.06, 6, 14), mat(0x3f7a3f), { pos: [0, 0.26, 0], rot: [Math.PI / 2, 0, 0], scale: [1, 1, 0.6] }));
    head.add(part(CONE, mat(0xff5b5b), { pos: [0.24, 0.4, 0], scale: [0.1, 0.3, 0.1], rot: [0, 0, -0.5] }));
  } else if (kind === 'wizard') {
    const hat = new THREE.Group();
    hat.position.set(0, 0.42, -0.02);
    hat.add(part(CONE, accM, { pos: [0, 0.36, 0], scale: [0.52, 0.95, 0.52] }));
    hat.add(part(new THREE.CylinderGeometry(0.44, 0.44, 0.05, 12), mat(0x351a80)));
    hat.add(part(SPHERE, mat(0xffd166, { emissive: 0x8a6b00 }), { pos: [0, 0.8, 0], scale: [0.15, 0.15, 0.15] }));
    hat.rotation.z = 0.1;
    head.add(hat);
    const staff = part(new THREE.CylinderGeometry(0.045, 0.045, 1.1, 6), mat(0x6b4a2a), { pos: [0.3, 0.16, 0.06], rot: [0.12, 0, -0.2] });
    arm.add(staff);
    const orb = part(SPHERE, new THREE.MeshBasicMaterial({ color: 0xd0b3ff }), { pos: [0.4, 0.72, 0.06], scale: [0.24, 0.24, 0.24] });
    arm.add(orb);
    g.userData.glow = orb;
  } else if (kind === 'frost') {
    head.add(part(CONE, mat(0xdff4ff, { emissive: 0x2e7fb8 }), { pos: [0, 0.46, 0], scale: [0.4, 0.4, 0.4] }));
    for (const s of [-1, 1]) head.add(part(CONE, mat(0xdff4ff, { emissive: 0x2e7fb8 }), { pos: [0.2 * s, 0.38, 0], scale: [0.22, 0.26, 0.22], rot: [0, 0, -0.3 * s] }));
    g.add(part(new THREE.TorusGeometry(0.36, 0.09, 6, 14), mat(0x2e7fb8), { pos: [0, 0.72, 0.02], rot: [1.35, 0, 0] }));
    const flake = part(SPHERE, new THREE.MeshBasicMaterial({ color: 0xbdeaff }), { pos: [0, 0.35, 0.34], scale: [0.16, 0.16, 0.16] });
    arm.add(flake);
    g.userData.glow = flake;
  } else if (kind === 'ninja') {
    head.add(part(BOX, mat(0x2a2a3c), { pos: [0, 0.0, 0.02], scale: [0.68, 0.2, 0.62] }));
    head.add(part(BOX, accM, { pos: [0, 0.14, -0.02], scale: [0.7, 0.14, 0.66] }));
    head.add(part(BOX, accM, { pos: [-0.34, 0.14, -0.3], scale: [0.1, 0.1, 0.5], rot: [0.3, 0, 0] }));
    const star = part(new THREE.CylinderGeometry(0.2, 0.2, 0.04, 4), mat(0xd8dcf0, { emissive: 0x333844 }), { pos: [0.26, 0.16, 0.14], rot: [Math.PI / 2, 0, 0] });
    arm.add(star);
    g.userData.spin = star;
  } else if (kind === 'sleepy') {
    // Nightcap, closed eyes and a pillow permanently under one paw.
    const cap = new THREE.Group();
    cap.position.set(0, 0.34, -0.04);
    cap.add(part(CONE, accM, { pos: [0, 0.34, -0.1], scale: [0.6, 0.9, 0.6], rot: [-0.5, 0, 0] }));
    cap.add(part(new THREE.TorusGeometry(0.32, 0.08, 6, 14), mat(0xfff2dd), { pos: [0, 0.04, 0], rot: [Math.PI / 2, 0, 0] }));
    cap.add(part(SPHERE, mat(0xfff2dd), { pos: [0, 0.5, -0.62], scale: [0.24, 0.24, 0.24] }));
    head.add(cap);
    // sleepy eyelids
    for (const s of [-1, 1]) head.add(part(BOX, furM, { pos: [0.17 * s, 0.08, 0.28], scale: [0.2, 0.13, 0.06] }));
    const pillow = makePillow(0.5);
    pillow.position.set(0.3, 0.18, 0.16);
    pillow.rotation.set(0.2, 0.3, -0.25);
    arm.add(pillow);
    const zzz = part(BOX, new THREE.MeshBasicMaterial({ color: 0xdff0ff, transparent: true, opacity: 0.85 }), {
      pos: [0.34, 1.7, 0], scale: [0.16, 0.16, 0.03], rot: [0, 0, 0.4],
    });
    g.add(zzz);
    g.userData.glow = zzz;
  } else if (kind === 'witch') {
    const hat = new THREE.Group();
    hat.position.set(0, 0.4, -0.02);
    hat.add(part(CONE, mat(0x241038), { pos: [0, 0.42, 0], scale: [0.56, 1.15, 0.56], rot: [0, 0, 0.14] }));
    hat.add(part(new THREE.CylinderGeometry(0.52, 0.52, 0.05, 14), mat(0x1a0b2a)));
    hat.add(part(new THREE.TorusGeometry(0.26, 0.05, 6, 12), mat(0x8dff5a, { emissive: 0x2a6b10 }), { pos: [0, 0.1, 0], rot: [Math.PI / 2, 0, 0] }));
    head.add(hat);
    const broom = part(new THREE.CylinderGeometry(0.04, 0.04, 1.2, 6), mat(0x6b4a2a), { pos: [-0.34, 0.2, 0.02], rot: [0.1, 0, 0.18] });
    arm.add(broom);
    arm.add(part(CONE, mat(0xc79a4a), { pos: [-0.46, -0.34, 0.02], scale: [0.26, 0.36, 0.26], rot: [Math.PI, 0, 0.18] }));
    const wisp = part(SPHERE, new THREE.MeshBasicMaterial({ color: 0xc07bff }), { pos: [0.36, 0.4, 0.16], scale: [0.22, 0.22, 0.22] });
    arm.add(wisp);
    g.userData.glow = wisp;
  } else if (kind === 'ema') {
    // A big bow, pompoms and a floating heart: pure encouragement.
    const bow = new THREE.Group();
    bow.position.set(0, 0.4, 0.06);
    for (const sx of [-1, 1]) {
      bow.add(part(SPHERE, accM, { pos: [0.26 * sx, 0.06, 0], scale: [0.26, 0.2, 0.14], rot: [0, 0, 0.5 * sx] }));
    }
    bow.add(part(SPHERE, mat(0xfff2dd), { scale: [0.13, 0.13, 0.13] }));
    head.add(bow);
    for (const sx of [-1, 1]) {
      const pom = part(SPHERE, accM, { pos: [0.34 * sx, 0.34, 0.16], scale: [0.24, 0.24, 0.24] });
      arm.add(pom);
    }
    const heart = part(SPHERE, new THREE.MeshBasicMaterial({ color: 0xff6fae }), { pos: [0, 1.85, 0.1], scale: [0.2, 0.2, 0.2] });
    g.add(heart);
    g.userData.glow = heart;
  } else if (kind === 'sofija') {
    // Merchant's visor, a coin purse and a fish coin she keeps flipping.
    head.add(part(new THREE.CylinderGeometry(0.34, 0.34, 0.06, 12), mat(0x8a6b1f), { pos: [0, 0.3, 0] }));
    head.add(part(new THREE.CircleGeometry(0.3, 12, 0, Math.PI), mat(0x3fd0a0, { side: THREE.DoubleSide }), { pos: [0, 0.28, 0.18], rot: [-1.1, 0, 0] }));
    const purse = part(SPHERE, accM, { pos: [-0.34, 0.12, 0.1], scale: [0.26, 0.28, 0.24] });
    g.add(purse);
    g.add(part(new THREE.TorusGeometry(0.12, 0.03, 6, 10), mat(0x6b4a2a), { pos: [-0.34, 0.32, 0.1], rot: [Math.PI / 2, 0, 0] }));
    const coin = part(new THREE.CylinderGeometry(0.19, 0.19, 0.05, 12), mat(0xffd166, { emissive: 0x6b5200 }), { pos: [0.3, 0.36, 0.16], rot: [Math.PI / 2, 0, 0] });
    arm.add(coin);
    g.userData.spin = coin;
    g.userData.glow = coin;
  } else if (kind === 'simba') {
    // Simba-kun: topknot, headband, shoulder armour and a katana he keeps
    // half-drawn, because he expects trouble.
    head.add(part(BOX, mat(0xd8203c), { pos: [0, 0.22, 0.02], scale: [0.72, 0.12, 0.66] }));
    head.add(part(BOX, mat(0xd8203c), { pos: [-0.36, 0.2, -0.3], scale: [0.08, 0.1, 0.6], rot: [0.4, 0, 0] }));
    head.add(part(SPHERE, mat(0x3a2a1c), { pos: [0, 0.4, -0.06], scale: [0.16, 0.24, 0.16] }));
    for (const s of [-1, 1]) {
      g.add(part(SPHERE, accM, { pos: [0.42 * s, 0.66, 0.02], scale: [0.3, 0.16, 0.3] }));
    }
    g.add(part(new THREE.CylinderGeometry(0.06, 0.05, 1.1, 6), mat(0x241730), {
      pos: [-0.34, 0.42, -0.16], rot: [0.2, 0, -0.5],
    }));
    const blade = part(BOX, mat(0xeef3ff, { emissive: 0x66708c }), {
      pos: [0.34, 0.36, 0.18], scale: [0.06, 0.06, 1.15], rot: [0.35, 0.2, 0],
    });
    arm.add(blade);
    arm.add(part(BOX, mat(0x2a1a2e), { pos: [0.34, 0.16, -0.28], scale: [0.09, 0.09, 0.34], rot: [0.35, 0.2, 0] }));
    arm.add(part(new THREE.TorusGeometry(0.12, 0.03, 6, 10), mat(0xffd166, { emissive: 0x6b5200 }), {
      pos: [0.34, 0.24, -0.06], rot: [1.2, 0, 0],
    }));
    g.userData.blade = blade;
    const spark = part(SPHERE, new THREE.MeshBasicMaterial({ color: 0xfff0c0 }), { pos: [0.34, 0.7, 0.6], scale: [0.14, 0.14, 0.14] });
    g.add(spark);
    g.userData.glow = spark;
  } else if (kind === 'queen') {
    // Mimi-chan: crown, cape, pearls, and an expression of total authority.
    const crown = new THREE.Group();
    crown.position.set(0, 0.46, 0);
    crown.add(part(new THREE.CylinderGeometry(0.3, 0.34, 0.16, 10), mat(0xffd166, { emissive: 0x6b5200 })));
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      crown.add(part(CONE, mat(0xffd166, { emissive: 0x6b5200 }), { pos: [Math.cos(a) * 0.28, 0.16, Math.sin(a) * 0.28], scale: [0.12, 0.24, 0.12] }));
      crown.add(part(SPHERE, mat(0xff5b9f, { emissive: 0x7a0033 }), { pos: [Math.cos(a) * 0.28, 0.3, Math.sin(a) * 0.28], scale: [0.09, 0.09, 0.09] }));
    }
    head.add(crown);
    const cape = part(CONE, mat(0xd41f6b), { pos: [0, 0.5, -0.34], scale: [1.15, 1.25, 0.7], rot: [Math.PI + 0.16, 0, 0] });
    g.add(cape);
    g.add(part(new THREE.TorusGeometry(0.34, 0.06, 6, 16), mat(0xfff6fb, { emissive: 0x776070 }), { pos: [0, 0.68, 0.06], rot: [1.35, 0, 0] }));
    const fan = part(new THREE.CircleGeometry(0.36, 12, 0, Math.PI), mat(0xfff0f8, { side: THREE.DoubleSide }), { pos: [0.32, 0.3, 0.12], rot: [0, 0.5, -0.4] });
    fan.material.side = THREE.DoubleSide;
    arm.add(fan);
    const sparkle = part(SPHERE, new THREE.MeshBasicMaterial({ color: 0xffe9b0 }), { pos: [0, 1.85, 0], scale: [0.2, 0.2, 0.2] });
    g.add(sparkle);
    g.userData.glow = sparkle;
  }

  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return { group: g, head, arm, body, tail };
}

// A little rounded pillow with a tassel in each corner.
function makePillow(size = 0.6) {
  const g = new THREE.Group();
  const cloth = mat(0xdfe6ff);
  g.add(part(SPHERE, cloth, { scale: [size, size * 0.42, size * 0.78] }));
  g.add(part(SPHERE, mat(0xb9c6ff), { pos: [0, 0, -size * 0.36], scale: [size * 0.9, size * 0.34, size * 0.24] }));
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      g.add(part(SPHERE, mat(0xfff2dd), { pos: [sx * size * 0.44, 0, sz * size * 0.34], scale: [size * 0.16, size * 0.16, size * 0.16] }));
    }
  }
  return g;
}

// ---------------------------------------------------------------- enemies --
// Some enemies reuse another enemy's body and just add regalia on top.
const ENEMY_BASE = {
  golden: 'mouse', baron: 'dog', ratking: 'mouse', chick: 'chicken', monkeyking: 'monkey',
  nurse: 'mouse', beetle: 'turtle', mole: 'mouse', flutterling: 'emilija',
  gymrat: 'mouse', granny: 'mouse', simonaclone: 'simona',
};

export function makeEnemy(kind) {
  const g = new THREE.Group();
  const legs = [];
  let head = null;

  const build = {
    mouse: () => {
      const furM = mat(0x9aa4b2);
      g.add(part(SPHERE, furM, { pos: [0, 0.3, 0], scale: [0.5, 0.44, 0.68] }));
      head = part(SPHERE, furM, { pos: [0, 0.34, 0.32], scale: [0.36, 0.34, 0.36] });
      g.add(head);
      g.add(part(CONE, mat(0xffd0e0), { pos: [0, 0.3, 0.52], scale: [0.14, 0.18, 0.14], rot: [Math.PI / 2, 0, 0] }));
      for (const s of [-1, 1]) {
        g.add(part(CIRCLE, mat(0xffc0d0), { pos: [0.2 * s, 0.55, 0.26], scale: [0.7, 0.7, 0.7], rot: [0, 0.5 * s, 0] }));
        g.add(part(SPHERE, mat(0x120c18), { pos: [0.13 * s, 0.38, 0.55], scale: [0.09, 0.09, 0.06] }));
      }
      g.add(part(new THREE.CylinderGeometry(0.03, 0.015, 0.7, 5), mat(0xffbfd0), { pos: [0, 0.3, -0.5], rot: [1.2, 0, 0] }));
    },
    snake: () => {
      const skinM = mat(0x66d17a);
      for (let i = 0; i < 6; i++) {
        const seg = part(SPHERE, i % 2 ? skinM : mat(0x4aa85e), {
          pos: [0, 0.22, -i * 0.3], scale: [0.36 - i * 0.03, 0.32 - i * 0.03, 0.4 - i * 0.03],
        });
        g.add(seg);
        legs.push(seg); // reused for the slither wiggle
      }
      head = part(SPHERE, skinM, { pos: [0, 0.3, 0.36], scale: [0.4, 0.34, 0.5] });
      g.add(head);
      for (const s of [-1, 1]) head.add(part(SPHERE, mat(0xffe066, { emissive: 0x6b5200 }), { pos: [0.2 * s, 0.25, 0.4], scale: [0.22, 0.22, 0.18] }));
      const tongue = part(BOX, mat(0xff3b6b), { pos: [0, 0.24, 0.66], scale: [0.05, 0.03, 0.3] });
      g.add(tongue);
      g.userData.tongue = tongue;
    },
    dog: () => {
      const furM = mat(0xc08552);
      g.add(part(BOX, furM, { pos: [0, 0.56, 0], scale: [0.66, 0.56, 1.1] }));
      head = part(BOX, furM, { pos: [0, 0.86, 0.6], scale: [0.56, 0.5, 0.56] });
      g.add(head);
      head.add(part(BOX, mat(0x8a5a34), { pos: [0, -0.2, 0.5], scale: [0.6, 0.5, 0.6] }));
      head.add(part(SPHERE, mat(0x120c18), { pos: [0, -0.16, 0.85], scale: [0.3, 0.26, 0.2] }));
      for (const s of [-1, 1]) {
        head.add(part(BOX, mat(0x8a5a34), { pos: [0.5 * s, 0.3, -0.1], scale: [0.24, 0.7, 0.5], rot: [0, 0, 0.3 * s] }));
        head.add(part(SPHERE, mat(0xfff0d8), { pos: [0.28 * s, 0.2, 0.5], scale: [0.2, 0.22, 0.14] }));
        head.add(part(SPHERE, mat(0x120c18), { pos: [0.28 * s, 0.2, 0.58], scale: [0.1, 0.12, 0.1] }));
      }
      for (const [x, z] of [[-0.28, 0.4], [0.28, 0.4], [-0.28, -0.4], [0.28, -0.4]]) {
        const leg = part(BOX, mat(0xa9713f), { pos: [x, 0.16, z], scale: [0.22, 0.4, 0.24] });
        g.add(leg); legs.push(leg);
      }
      const tail = part(BOX, furM, { pos: [0, 0.78, -0.62], scale: [0.14, 0.14, 0.5], rot: [-0.6, 0, 0] });
      g.add(tail);
      g.userData.tail = tail;
    },
    frog: () => {
      const skinM = mat(0x6bd85a);
      g.add(part(SPHERE, skinM, { pos: [0, 0.32, 0], scale: [0.62, 0.5, 0.66] }));
      g.add(part(SPHERE, mat(0xdcf7c0), { pos: [0, 0.22, 0.2], scale: [0.42, 0.3, 0.42] }));
      head = part(SPHERE, skinM, { pos: [0, 0.46, 0.2], scale: [0.5, 0.4, 0.44] });
      g.add(head);
      for (const s of [-1, 1]) {
        head.add(part(SPHERE, mat(0xfff3c4), { pos: [0.24 * s, 0.42, 0.06], scale: [0.28, 0.3, 0.28] }));
        head.add(part(SPHERE, mat(0x120c18), { pos: [0.24 * s, 0.46, 0.2], scale: [0.14, 0.16, 0.1] }));
        const leg = part(SPHERE, mat(0x54c247), { pos: [0.36 * s, 0.16, -0.16], scale: [0.2, 0.2, 0.4], rot: [0, 0.4 * s, 0] });
        g.add(leg); legs.push(leg);
        const front = part(SPHERE, mat(0x54c247), { pos: [0.26 * s, 0.12, 0.34], scale: [0.16, 0.14, 0.26] });
        g.add(front); legs.push(front);
      }
      g.add(part(BOX, mat(0x2e7a26), { pos: [0, 0.34, 0.42], scale: [0.34, 0.03, 0.06] }));
    },
    bird: () => {
      const featherM = mat(0x6bb8ff);
      g.add(part(SPHERE, featherM, { pos: [0, 0.5, 0], scale: [0.44, 0.42, 0.66] }));
      head = part(SPHERE, featherM, { pos: [0, 0.74, 0.3], scale: [0.34, 0.34, 0.34] });
      g.add(head);
      head.add(part(CONE, mat(0xffb347), { pos: [0, -0.04, 0.3], scale: [0.3, 0.5, 0.3], rot: [Math.PI / 2, 0, 0] }));
      for (const s of [-1, 1]) head.add(part(SPHERE, mat(0x120c18), { pos: [0.18 * s, 0.08, 0.2], scale: [0.1, 0.1, 0.08] }));
      for (const s of [-1, 1]) {
        const wing = part(BOX, mat(0x3f8ad8), { pos: [0.42 * s, 0.54, -0.02], scale: [0.62, 0.07, 0.42] });
        wing.geometry = wing.geometry; // shared box, offset via pivot below
        g.add(wing); legs.push(wing);
        wing.userData.side = s;
      }
      g.add(part(CONE, mat(0x3f8ad8), { pos: [0, 0.5, -0.5], scale: [0.36, 0.5, 0.2], rot: [-1.9, 0, 0] }));
    },
    pig: () => {
      const skinM = mat(0xffb0c8);
      g.add(part(SPHERE, skinM, { pos: [0, 0.6, 0], scale: [0.8, 0.7, 1.0] }));
      head = part(SPHERE, skinM, { pos: [0, 0.72, 0.5], scale: [0.5, 0.46, 0.44] });
      g.add(head);
      head.add(part(new THREE.CylinderGeometry(0.3, 0.3, 0.22, 10), mat(0xff8fb0), { pos: [0, -0.1, 0.5], rot: [Math.PI / 2, 0, 0] }));
      for (const s of [-1, 1]) {
        head.add(part(SPHERE, mat(0x120c18), { pos: [0.2 * s, 0.16, 0.36], scale: [0.11, 0.12, 0.08] }));
        head.add(part(CONE, mat(0xff8fb0), { pos: [0.3 * s, 0.42, 0], scale: [0.3, 0.36, 0.16], rot: [0.4, 0, -0.5 * s] }));
        // Little feathered wings — physics is not this pig's problem.
        const wing = part(BOX, mat(0xfff2f7), { pos: [0.62 * s, 0.72, -0.05], scale: [0.7, 0.09, 0.5] });
        g.add(wing); legs.push(wing);
        wing.userData.side = s;
      }
      for (const [x, z] of [[-0.3, 0.36], [0.3, 0.36], [-0.3, -0.36], [0.3, -0.36]]) {
        g.add(part(BOX, mat(0xe895b0), { pos: [x, 0.2, z], scale: [0.2, 0.34, 0.2] }));
      }
      g.add(part(new THREE.TorusGeometry(0.14, 0.05, 5, 10), mat(0xff8fb0), { pos: [0, 0.62, -0.6], rot: [0, 1.2, 0] }));
    },
    turtle: () => {
      const shellM = mat(0x3f8f5a);
      const skinM = mat(0xa8d86b);
      const shell = part(SPHERE, shellM, { pos: [0, 0.5, 0], scale: [1.0, 0.62, 1.15] });
      g.add(shell);
      // Hexagonal armour plates.
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2;
        const rr = i === 6 ? 0 : 0.45;
        g.add(part(new THREE.CylinderGeometry(0.2, 0.24, 0.1, 6), mat(0x2c6b42), {
          pos: [Math.cos(a) * rr, 0.82 - (rr ? 0.08 : 0), Math.sin(a) * rr * 1.1],
        }));
      }
      g.add(part(SPHERE, mat(0xf0e0a8), { pos: [0, 0.3, 0], scale: [0.86, 0.4, 1.0] }));
      head = part(SPHERE, skinM, { pos: [0, 0.5, 0.9], scale: [0.34, 0.32, 0.42] });
      g.add(head);
      for (const s of [-1, 1]) head.add(part(SPHERE, mat(0x120c18), { pos: [0.16 * s, 0.1, 0.3], scale: [0.1, 0.12, 0.08] }));
      for (const [x, z] of [[-0.5, 0.5], [0.5, 0.5], [-0.5, -0.5], [0.5, -0.5]]) {
        const leg = part(SPHERE, skinM, { pos: [x, 0.22, z], scale: [0.26, 0.2, 0.34] });
        g.add(leg); legs.push(leg);
      }
      g.add(part(CONE, skinM, { pos: [0, 0.42, -0.95], scale: [0.2, 0.4, 0.2], rot: [-1.6, 0, 0] }));
    },
    horse: () => {
      const coatM = mat(0x8a5a34);
      const maneM = mat(0x2e1c18);
      g.add(part(SPHERE, coatM, { pos: [0, 0.86, 0], scale: [0.6, 0.62, 1.24] }));
      g.add(part(new THREE.CylinderGeometry(0.2, 0.26, 0.7, 8), coatM, { pos: [0, 1.16, 0.5], rot: [0.5, 0, 0] }));
      head = part(BOX, coatM, { pos: [0, 1.5, 0.78], scale: [0.28, 0.32, 0.62] });
      g.add(head);
      head.add(part(BOX, mat(0x6b4326), { pos: [0, -0.15, 0.5], scale: [0.9, 0.6, 0.5] }));
      for (const s of [-1, 1]) {
        head.add(part(CONE, coatM, { pos: [0.3 * s, 0.7, -0.2], scale: [0.4, 0.6, 0.4] }));
        head.add(part(SPHERE, mat(0x120c18), { pos: [0.5 * s, 0.1, 0.16], scale: [0.28, 0.3, 0.2] }));
      }
      for (let i = 0; i < 5; i++) {
        g.add(part(SPHERE, maneM, { pos: [0, 1.2 + i * 0.09, 0.34 + i * 0.1], scale: [0.16, 0.2, 0.2] }));
      }
      for (const [x, z] of [[-0.28, 0.5], [0.28, 0.5], [-0.28, -0.5], [0.28, -0.5]]) {
        const leg = part(BOX, coatM, { pos: [x, 0.34, z], scale: [0.18, 0.72, 0.2] });
        g.add(leg); legs.push(leg);
        g.add(part(BOX, mat(0x241730), { pos: [x, 0.05, z], scale: [0.2, 0.12, 0.22] }));
      }
      const tail = part(CONE, maneM, { pos: [0, 1.0, -0.72], scale: [0.24, 0.8, 0.24], rot: [-2.5, 0, 0] });
      g.add(tail);
      g.userData.tail = tail;
    },
    chicken: () => {
      const featherM = mat(0xfff6e8);
      g.add(part(SPHERE, featherM, { pos: [0, 0.44, 0], scale: [0.44, 0.46, 0.52] }));
      head = part(SPHERE, featherM, { pos: [0, 0.8, 0.16], scale: [0.3, 0.3, 0.3] });
      g.add(head);
      head.add(part(CONE, mat(0xffb347), { pos: [0, -0.05, 0.28], scale: [0.26, 0.36, 0.26], rot: [Math.PI / 2, 0, 0] }));
      head.add(part(SPHERE, mat(0xff3b6b), { pos: [0, -0.3, 0.16], scale: [0.16, 0.3, 0.14] }));
      for (let i = 0; i < 3; i++) {
        head.add(part(SPHERE, mat(0xff3b6b), { pos: [0, 0.42 + i * 0.03, 0.14 - i * 0.16], scale: [0.12, 0.3, 0.2] }));
      }
      for (const s of [-1, 1]) {
        head.add(part(SPHERE, mat(0x120c18), { pos: [0.18 * s, 0.06, 0.2], scale: [0.1, 0.11, 0.08] }));
        g.add(part(SPHERE, featherM, { pos: [0.4 * s, 0.44, 0], scale: [0.12, 0.3, 0.4] }));
        const leg = part(BOX, mat(0xffb347), { pos: [0.15 * s, 0.12, 0.02], scale: [0.08, 0.3, 0.08] });
        g.add(leg); legs.push(leg);
      }
      for (let i = 0; i < 3; i++) {
        g.add(part(SPHERE, mat(0xf0e2cc), { pos: [(i - 1) * 0.12, 0.62, -0.5], scale: [0.14, 0.3, 0.3], rot: [0.5, 0, (i - 1) * 0.3] }));
      }
    },
    monkey: () => {
      const furM = mat(0x8a6244);
      const faceM = mat(0xf2c9a0);
      g.add(part(SPHERE, furM, { pos: [0, 0.52, 0], scale: [0.52, 0.6, 0.46] }));
      g.add(part(SPHERE, faceM, { pos: [0, 0.46, 0.2], scale: [0.32, 0.4, 0.24] }));
      head = part(SPHERE, furM, { pos: [0, 1.0, 0.06], scale: [0.44, 0.42, 0.42] });
      g.add(head);
      head.add(part(SPHERE, faceM, { pos: [0, -0.1, 0.28], scale: [0.6, 0.6, 0.4] }));
      for (const s of [-1, 1]) {
        head.add(part(SPHERE, faceM, { pos: [0.5 * s, 0.06, 0], scale: [0.24, 0.3, 0.16] }));
        head.add(part(SPHERE, mat(0x120c18), { pos: [0.2 * s, 0.04, 0.4], scale: [0.14, 0.16, 0.1] }));
        const arm = part(SPHERE, furM, { pos: [0.42 * s, 0.56, 0.06], scale: [0.16, 0.4, 0.18], rot: [0, 0, 0.3 * s] });
        g.add(arm); legs.push(arm);
        const leg = part(SPHERE, furM, { pos: [0.22 * s, 0.16, 0], scale: [0.18, 0.24, 0.2] });
        g.add(leg); legs.push(leg);
      }
      const banana = part(new THREE.TorusGeometry(0.16, 0.06, 5, 8, Math.PI), mat(0xffe066, { emissive: 0x6b5200 }), {
        pos: [0.44, 0.86, 0.2], rot: [0.4, 0, 1.6],
      });
      g.add(banana);
      g.userData.banana = banana;
      const tail = part(new THREE.TorusGeometry(0.3, 0.05, 5, 10, Math.PI * 1.2), furM, { pos: [0, 0.6, -0.4], rot: [0, 1.6, 0.6] });
      g.add(tail);
      g.userData.tail = tail;
    },
    dragon: () => {
      const scaleM = mat(0xd8324f);
      const bellyM = mat(0xffd9a0);
      const hornM = mat(0xfff0d8);
      g.add(part(SPHERE, scaleM, { pos: [0, 0.9, 0], scale: [0.9, 0.86, 1.5] }));
      g.add(part(SPHERE, bellyM, { pos: [0, 0.72, 0.2], scale: [0.6, 0.5, 1.1] }));
      // long neck
      for (let i = 0; i < 4; i++) {
        g.add(part(SPHERE, scaleM, { pos: [0, 1.2 + i * 0.28, 0.9 + i * 0.22], scale: [0.4 - i * 0.03, 0.4 - i * 0.03, 0.44] }));
      }
      head = part(SPHERE, scaleM, { pos: [0, 2.3, 1.9], scale: [0.44, 0.4, 0.62] });
      g.add(head);
      head.add(part(SPHERE, scaleM, { pos: [0, -0.24, 0.7], scale: [0.7, 0.5, 0.7] }));
      head.add(part(SPHERE, mat(0x2a0a12), { pos: [0, -0.4, 0.8], scale: [0.5, 0.3, 0.5] }));
      for (const s of [-1, 1]) {
        head.add(part(SPHERE, mat(0xffe066, { emissive: 0x8a5a00 }), { pos: [0.5 * s, 0.3, 0.2], scale: [0.3, 0.34, 0.26] }));
        head.add(part(SPHERE, mat(0x120c18), { pos: [0.6 * s, 0.3, 0.36], scale: [0.14, 0.24, 0.14] }));
        head.add(part(CONE, hornM, { pos: [0.4 * s, 0.8, -0.4], scale: [0.22, 0.9, 0.22], rot: [-0.6, 0, 0.3 * s] }));
        // Huge bat wings.
        const wing = new THREE.Group();
        wing.position.set(0.55 * s, 1.5, -0.1);
        const membrane = part(CONE, mat(0x8a1330, { side: THREE.DoubleSide }), {
          pos: [1.7 * s, 0.1, -0.2], scale: [2.6, 1.0, 2.2], rot: [Math.PI / 2, 0, Math.PI / 2 * s],
        });
        wing.add(membrane);
        wing.add(part(BOX, scaleM, { pos: [1.4 * s, 0.35, -0.1], scale: [2.8, 0.14, 0.16], rot: [0, 0, -0.16 * s] }));
        g.add(wing); legs.push(wing);
        wing.userData.side = s;
        const leg = part(SPHERE, scaleM, { pos: [0.6 * s, 0.36, 0.3], scale: [0.26, 0.4, 0.3] });
        g.add(leg);
      }
      // spiked tail
      for (let i = 0; i < 6; i++) {
        g.add(part(SPHERE, scaleM, { pos: [0, 0.9 - i * 0.05, -1.4 - i * 0.42], scale: [0.32 - i * 0.04, 0.32 - i * 0.04, 0.36] }));
        g.add(part(CONE, hornM, { pos: [0, 1.2 - i * 0.06, -1.4 - i * 0.42], scale: [0.12, 0.3, 0.12] }));
      }
      g.add(part(CONE, hornM, { pos: [0, 0.6, -4.0], scale: [0.4, 0.8, 0.4], rot: [-Math.PI / 2, 0, 0] }));
    },
    // Emilija: an enormous, unreasonably pretty butterfly.
    emilija: () => {
      const bodyM = mat(0x7a4fb0, { emissive: 0x2a1046 });
      const glowM = mat(0xffb0e8, { emissive: 0x8a2a6b });
      const wingM = mat(0xd89bff, { emissive: 0x6a2ab0, side: THREE.DoubleSide });
      const wingM2 = mat(0xffa8e0, { emissive: 0xa0286b, side: THREE.DoubleSide });
      const dotM = mat(0xfff0a0, { emissive: 0xb08a00, side: THREE.DoubleSide });
      // Segmented abdomen.
      for (let i = 0; i < 5; i++) {
        g.add(part(SPHERE, i % 2 ? bodyM : glowM, {
          pos: [0, 1.1, -i * 0.42], scale: [0.44 - i * 0.05, 0.44 - i * 0.05, 0.5 - i * 0.04],
        }));
      }
      g.add(part(SPHERE, bodyM, { pos: [0, 1.15, 0.45], scale: [0.56, 0.56, 0.7] }));
      head = part(SPHERE, bodyM, { pos: [0, 1.3, 1.0], scale: [0.46, 0.44, 0.46] });
      g.add(head);
      // Big shiny eyes, a smile, and two curling antennae.
      for (const s of [-1, 1]) {
        head.add(part(SPHERE, mat(0xfff0ff, { emissive: 0x5a2a6b }), { pos: [0.42 * s, 0.16, 0.34], scale: [0.44, 0.5, 0.36] }));
        head.add(part(SPHERE, mat(0x1b0a24), { pos: [0.44 * s, 0.14, 0.54], scale: [0.24, 0.3, 0.18] }));
        head.add(part(new THREE.CylinderGeometry(0.03, 0.02, 1.1, 5), bodyM, {
          pos: [0.3 * s, 1.0, 0.1], rot: [0.3, 0, 0.5 * s],
        }));
        head.add(part(SPHERE, glowM, { pos: [0.78 * s, 1.5, 0.24], scale: [0.2, 0.2, 0.2] }));
        // Two wings a side: a broad upper wing and a smaller lower one.
        const wing = new THREE.Group();
        wing.position.set(0.3 * s, 1.2, 0.1);
        wing.userData.side = s;
        // Wings lie flat, like a butterfly seen from above, and flap by
        // tilting around the body — the camera looks down, so this reads.
        const flat = [-Math.PI / 2, 0, 0];
        const upper = part(CIRCLE, wingM, { pos: [2.0 * s, 0.02, 0.9], scale: [4.2, 3.4, 1], rot: flat });
        const lower = part(CIRCLE, wingM2, { pos: [1.5 * s, 0, -1.5], scale: [3.0, 2.6, 1], rot: flat });
        wing.add(upper, lower);
        for (const [x, z, r] of [[2.4, 1.6, 0.55], [1.6, 0.4, 0.4], [1.5, -1.9, 0.36]]) {
          wing.add(part(CIRCLE, dotM, {
            pos: [x * s, 0.06, z], scale: [r, r, 1], rot: flat,
          }));
        }
        g.add(wing); legs.push(wing);
        // Dainty little legs.
        g.add(part(new THREE.CylinderGeometry(0.04, 0.02, 0.6, 5), bodyM, {
          pos: [0.28 * s, 0.85, 0.4], rot: [0.2, 0, 0.5 * s],
        }));
      }
    },
    // ------------------------------------------------------- the family --
    // Simona, her brother Stefo and their father are people, not pests, and
    // they are built from the same handful of spheres.
    simona: () => {
      const skinM = mat(0xffd9b8);
      const suitM = mat(0xff2e88, { emissive: 0x5c0033 });
      const hairM = mat(0x3a2418);
      g.add(part(SPHERE, suitM, { pos: [0, 1.1, 0], scale: [0.5, 0.8, 0.38] }));
      g.add(part(SPHERE, suitM, { pos: [0, 0.72, 0], scale: [0.46, 0.4, 0.36] }));
      head = part(SPHERE, skinM, { pos: [0, 1.72, 0.02], scale: [0.36, 0.42, 0.36] });
      g.add(head);
      head.add(part(SPHERE, hairM, { pos: [0, 0.3, -0.1], scale: [1.05, 0.7, 1.05] }));
      head.add(part(SPHERE, hairM, { pos: [0, 0.24, -1.0], scale: [0.5, 0.5, 0.9] }));
      for (const s of [-1, 1]) {
        head.add(part(SPHERE, mat(0x1b0a24), { pos: [0.4 * s, 0.05, 0.72], scale: [0.16, 0.2, 0.1] }));
        const arm = part(SPHERE, skinM, { pos: [0.44 * s, 1.24, 0], scale: [0.14, 0.5, 0.16] });
        g.add(arm); legs.push(arm);
        const leg = part(SPHERE, skinM, { pos: [0.2 * s, 0.34, 0], scale: [0.16, 0.44, 0.18] });
        g.add(leg); legs.push(leg);
        g.add(part(SPHERE, mat(0xfff0f8), { pos: [0.2 * s, 0.06, 0.06], scale: [0.17, 0.1, 0.24] }));
      }
      g.add(part(new THREE.TorusGeometry(0.34, 0.05, 6, 14), mat(0xffd166, { emissive: 0x6b5200 }), {
        pos: [0, 1.06, 0], rot: [Math.PI / 2, 0, 0],
      }));
      const ribbon = part(new THREE.TorusGeometry(0.5, 0.05, 6, 16), mat(0xffe066, { emissive: 0x8a6b00 }), {
        pos: [0.7, 1.5, 0], rot: [0.4, 0.4, 0],
      });
      g.add(ribbon);
      g.userData.ribbon = ribbon;
    },
    stefo: () => {
      const skinM = mat(0xffd9b8);
      const jerseyM = mat(0xff8a1f, { emissive: 0x5c2a00 });
      g.add(part(SPHERE, jerseyM, { pos: [0, 1.25, 0], scale: [0.6, 0.86, 0.44] }));
      g.add(part(BOX, mat(0x241730), { pos: [0, 0.78, 0], scale: [0.9, 0.42, 0.76] }));
      head = part(SPHERE, skinM, { pos: [0, 1.98, 0.02], scale: [0.38, 0.44, 0.38] });
      g.add(head);
      head.add(part(SPHERE, mat(0x241a12), { pos: [0, 0.28, -0.04], scale: [1.04, 0.66, 1.04] }));
      for (const s of [-1, 1]) {
        head.add(part(SPHERE, mat(0x1b0a24), { pos: [0.4 * s, 0.04, 0.7], scale: [0.16, 0.2, 0.1] }));
        const arm = part(SPHERE, skinM, { pos: [0.58 * s, 1.36, 0.06], scale: [0.16, 0.56, 0.18], rot: [0, 0, 0.2 * s] });
        g.add(arm); legs.push(arm);
        const leg = part(SPHERE, skinM, { pos: [0.24 * s, 0.34, 0], scale: [0.19, 0.46, 0.2] });
        g.add(leg); legs.push(leg);
        g.add(part(SPHERE, mat(0xfff0f8), { pos: [0.24 * s, 0.07, 0.08], scale: [0.2, 0.11, 0.26] }));
      }
      g.add(part(BOX, mat(0xfff6e8), { pos: [0, 1.36, 0.42], scale: [0.09, 0.34, 0.02] }));
      const ball = makeBasketball();
      ball.position.set(0.74, 1.5, 0.26);
      g.add(ball);
      g.userData.ball = ball;
    },
    father: () => {
      const skinM = mat(0xf0c49a);
      const shirtM = mat(0x2f6bd8, { emissive: 0x0a1f4a });
      const hairM = mat(0x2a1c14);
      g.add(part(SPHERE, shirtM, { pos: [0, 1.5, 0], scale: [1.1, 1.05, 0.82] }));
      g.add(part(BOX, mat(0x241730), { pos: [0, 0.86, 0], scale: [1.5, 0.5, 1.2] }));
      g.add(part(new THREE.TorusGeometry(0.28, 0.09, 6, 12), mat(0xffd166, { emissive: 0x6b5200 }), {
        pos: [0, 0.88, 0.62], rot: [Math.PI / 2, 0, 0],
      }));
      head = part(SPHERE, skinM, { pos: [0, 2.42, 0.04], scale: [0.5, 0.54, 0.5] });
      g.add(head);
      head.add(part(SPHERE, hairM, { pos: [0, 0.3, -0.16], scale: [1.02, 0.6, 1.0] }));
      head.add(part(BOX, hairM, { pos: [0, -0.34, 0.62], scale: [0.7, 0.16, 0.2] }));   // moustache
      for (const s of [-1, 1]) {
        head.add(part(SPHERE, mat(0x1b0a24), { pos: [0.4 * s, 0.06, 0.7], scale: [0.16, 0.18, 0.1] }));
        head.add(part(BOX, hairM, { pos: [0.4 * s, 0.4, 0.6], scale: [0.34, 0.1, 0.14], rot: [0, 0, -0.2 * s] }));
        const arm = part(SPHERE, skinM, { pos: [1.05 * s, 1.6, 0.06], scale: [0.28, 0.62, 0.3], rot: [0, 0, 0.3 * s] });
        g.add(arm); legs.push(arm);
        g.add(part(SPHERE, skinM, { pos: [1.3 * s, 1.02, 0.1], scale: [0.3, 0.3, 0.34] }));
        const leg = part(SPHERE, mat(0x1c2740), { pos: [0.4 * s, 0.4, 0], scale: [0.32, 0.5, 0.34] });
        g.add(leg); legs.push(leg);
        g.add(part(BOX, mat(0x120c18), { pos: [0.4 * s, 0.09, 0.12], scale: [0.4, 0.18, 0.6] }));
      }
    },
  };

  const kindDef = ENEMY_BASE[kind] || kind;
  build[kindDef]();

  if (kind === 'golden') {
    g.traverse((o) => {
      if (o.isMesh && o.material.color) {
        o.material = mat(0xffd166, { emissive: 0x7a5a00 });
      }
    });
  }
  if (kind === 'baron') {
    // Spiked collar + a very serious expression.
    const collar = part(new THREE.TorusGeometry(0.34, 0.09, 6, 12), mat(0x8b0f2e), { pos: [0, 0.8, 0.3], rot: [1.4, 0, 0] });
    g.add(collar);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      g.add(part(CONE, mat(0xdfe3ef), { pos: [Math.cos(a) * 0.36, 0.8 + Math.sin(a) * 0.36, 0.3], scale: [0.12, 0.2, 0.12], rot: [0, 0, -a + Math.PI / 2] }));
    }
    g.traverse((o) => { if (o.isMesh && o.material.color && o.material.color.getHex() === 0xc08552) o.material = mat(0x5c4436); });
  }
  if (kind === 'ratking') {
    const crown = new THREE.Group();
    crown.position.set(0, 0.66, 0.3);
    crown.add(part(new THREE.CylinderGeometry(0.24, 0.28, 0.18, 8), mat(0xffd166, { emissive: 0x6b5200 })));
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      crown.add(part(CONE, mat(0xffd166, { emissive: 0x6b5200 }), { pos: [Math.cos(a) * 0.22, 0.16, Math.sin(a) * 0.22], scale: [0.11, 0.18, 0.11] }));
    }
    g.add(crown);
    const cape = part(CONE, mat(0x8b1f4a), { pos: [0, 0.42, -0.42], scale: [0.9, 0.9, 0.6], rot: [Math.PI, 0, 0] });
    g.add(cape);
    g.traverse((o) => { if (o.isMesh && o.material.color && o.material.color.getHex() === 0x9aa4b2) o.material = mat(0x63527f); });
  }

  if (kind === 'nurse') {
    // A field medic: white coat, red cross cap, little satchel.
    g.traverse((o) => {
      if (o.isMesh && o.material.color && o.material.color.getHex() === 0x9aa4b2) o.material = mat(0xf6f6fa);
    });
    const cap = part(new THREE.CylinderGeometry(0.26, 0.26, 0.1, 10), mat(0xffffff), { pos: [0, 0.62, 0.3] });
    g.add(cap);
    for (const rot of [0, Math.PI / 2]) {
      g.add(part(BOX, mat(0xff3b5b, { emissive: 0x6b0010 }), { pos: [0, 0.68, 0.3], scale: [0.22, 0.07, 0.07], rot: [0, 0, rot] }));
    }
    const bag = part(BOX, mat(0xffffff), { pos: [0.34, 0.28, -0.05], scale: [0.22, 0.2, 0.26] });
    g.add(bag);
    g.add(part(BOX, mat(0xff3b5b), { pos: [0.46, 0.28, -0.05], scale: [0.02, 0.12, 0.04] }));
  }
  if (kind === 'beetle') {
    // Chitin instead of shell, and a hovering hexagonal barrier.
    g.traverse((o) => {
      if (!o.isMesh || !o.material.color) return;
      const hex = o.material.color.getHex();
      if (hex === 0x3f8f5a) o.material = mat(0x2f3f7a);
      else if (hex === 0x2c6b42) o.material = mat(0x1d2a5c);
      else if (hex === 0xa8d86b) o.material = mat(0x8fa6ff);
    });
    for (const s of [-1, 1]) {
      g.add(part(CONE, mat(0x6bd8ff, { emissive: 0x1b5b78 }), { pos: [0.22 * s, 0.9, 0.6], scale: [0.1, 0.34, 0.1], rot: [-0.5, 0, 0.3 * s] }));
    }
    const bubble = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.15, 1),
      new THREE.MeshBasicMaterial({ color: 0x6bd8ff, transparent: true, opacity: 0.24, wireframe: true })
    );
    bubble.position.set(0, 0.55, 0);
    g.add(bubble);
    g.userData.shield = bubble;
  }
  if (kind === 'mole') {
    // Velvet fur, huge digging claws, tiny sunglasses.
    g.traverse((o) => {
      if (o.isMesh && o.material.color && o.material.color.getHex() === 0x9aa4b2) o.material = mat(0x4a3d55);
    });
    for (const s of [-1, 1]) {
      const claw = part(SPHERE, mat(0xf0e0c0), { pos: [0.3 * s, 0.18, 0.34], scale: [0.16, 0.14, 0.26] });
      g.add(claw);
      for (let i = -1; i <= 1; i++) {
        claw.add(part(CONE, mat(0xfff6e0), { pos: [i * 0.4, -0.1, 0.9], scale: [0.22, 0.5, 0.22], rot: [1.4, 0, 0] }));
      }
    }
    g.add(part(BOX, mat(0x120c18), { pos: [0, 0.4, 0.52], scale: [0.34, 0.1, 0.06] }));
  }
  if (kind === 'chick') {
    // Fluffy yellow baby version of the chicken.
    g.traverse((o) => {
      if (o.isMesh && o.material.color && o.material.color.getHex() === 0xfff6e8) {
        o.material = mat(0xffe066);
      }
    });
  }
  if (kind === 'flutterling') {
    // Emilija's children: paler, greener wings so they read as "not the boss".
    g.traverse((o) => {
      if (!o.isMesh || !o.material.color) return;
      const hex = o.material.color.getHex();
      if (hex === 0xd89bff) o.material = mat(0x8fe6ff, { emissive: 0x0a3a5c, side: THREE.DoubleSide });
      else if (hex === 0xffa8e0) o.material = mat(0xa8ffd8, { emissive: 0x0a5c3a, side: THREE.DoubleSide });
      else if (hex === 0x7a4fb0) o.material = mat(0x4a6f9b, { emissive: 0x0a2036 });
    });
  }
  if (kind === 'monkeyking') {
    // A crown of bananas and a very smug posture.
    const crown = new THREE.Group();
    crown.position.set(0, 1.32, 0.06);
    crown.add(part(new THREE.CylinderGeometry(0.3, 0.34, 0.14, 10), mat(0xffd166, { emissive: 0x6b5200 })));
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      crown.add(part(new THREE.TorusGeometry(0.16, 0.06, 5, 8, Math.PI), mat(0xffe066, { emissive: 0x6b5200 }), {
        pos: [Math.cos(a) * 0.28, 0.18, Math.sin(a) * 0.28], rot: [0, -a, 1.6],
      }));
    }
    g.add(crown);
    const cape = part(CONE, mat(0x2f7a3f), { pos: [0, 0.6, -0.42], scale: [0.9, 1.0, 0.6], rot: [Math.PI, 0, 0] });
    g.add(cape);
    g.traverse((o) => { if (o.isMesh && o.material.color && o.material.color.getHex() === 0x8a6244) o.material = mat(0x5f3f2a); });
  }

  if (kind === 'gymrat') {
    // A mouse who never skips leg day: red fur, a sweatband and dumbbells.
    g.traverse((o) => {
      if (o.isMesh && o.material.color && o.material.color.getHex() === 0x9aa4b2) o.material = mat(0xb85c4a);
    });
    g.add(part(BOX, mat(0xff3b6b), { pos: [0, 0.52, 0.3], scale: [0.44, 0.1, 0.4] }));
    for (const s of [-1, 1]) {
      const bar = part(new THREE.CylinderGeometry(0.04, 0.04, 0.5, 6), mat(0x9aa4b2), { pos: [0.42 * s, 0.16, 0.24], rot: [0, 0, Math.PI / 2] });
      g.add(bar);
      for (const e of [-1, 1]) {
        g.add(part(new THREE.CylinderGeometry(0.14, 0.14, 0.12, 8), mat(0x2a2a3c), { pos: [0.42 * s + e * 0.22, 0.16, 0.24], rot: [0, 0, Math.PI / 2] }));
      }
    }
  }
  if (kind === 'granny') {
    // Grandma Vera: lilac perm, shawl, spectacles and an endless ball of wool.
    g.traverse((o) => {
      if (o.isMesh && o.material.color && o.material.color.getHex() === 0x9aa4b2) o.material = mat(0xcfc3d8);
    });
    g.add(part(SPHERE, mat(0xb07bd6), { pos: [0, 0.5, 0.34], scale: [0.4, 0.34, 0.36] }));
    g.add(part(CONE, mat(0x7a4fb0), { pos: [0, 0.4, -0.2], scale: [1.0, 0.7, 1.1], rot: [Math.PI, 0, 0] }));
    for (const s of [-1, 1]) {
      g.add(part(new THREE.TorusGeometry(0.12, 0.02, 6, 12), mat(0xfff6e8), { pos: [0.13 * s, 0.38, 0.56] }));
    }
    const wool = part(SPHERE, mat(0xff8ad8, { emissive: 0x6b1a4a }), { pos: [0.42, 0.24, 0.1], scale: [0.3, 0.3, 0.3] });
    g.add(wool);
    g.userData.wool = wool;
    for (const s of [-1, 1]) {
      g.add(part(new THREE.CylinderGeometry(0.03, 0.03, 0.7, 5), mat(0xdcc39a), { pos: [0.2 * s, 0.45, 0.3], rot: [0.4, 0, 0.3 * s] }));
    }
  }
  if (kind === 'simonaclone') {
    // A copy: paler leotard, ghostly glow, so nobody shoots the wrong sister.
    g.traverse((o) => {
      if (!o.isMesh || !o.material.color) return;
      const hex = o.material.color.getHex();
      if (hex === 0xff2e88) o.material = mat(0x8fe6ff, { emissive: 0x0a3a5c, transparent: true, opacity: 0.9 });
      else if (hex === 0xffd9b8) o.material = mat(0xdff2ff, { transparent: true, opacity: 0.9 });
    });
  }

  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return { group: g, head, legs };
}

// A basketball. Stefo brings his own.
export function makeBasketball(r = 0.34) {
  const g = new THREE.Group();
  g.add(part(SPHERE, mat(0xff8a1f, { emissive: 0x4a2000 }), { scale: [r * 2, r * 2, r * 2] }));
  for (const rot of [[0, 0, 0], [Math.PI / 2, 0, 0], [0, 0, Math.PI / 2]]) {
    g.add(part(new THREE.TorusGeometry(r * 1.01, r * 0.06, 4, 14), mat(0x1b0a12), { rot }));
  }
  return g;
}

// A banana thrown by a monkey — the same shape as the one they carry.
export function makeBanana() {
  const g = new THREE.Group();
  g.add(part(new THREE.TorusGeometry(0.22, 0.08, 6, 10, Math.PI), mat(0xffe066, { emissive: 0x6b5200 }), { rot: [0, 0, 1.6] }));
  g.add(part(SPHERE, mat(0x6b5200), { pos: [0, 0.24, 0], scale: [0.09, 0.12, 0.09] }));
  return g;
}

// A chicken egg, warm and about to become a problem.
export function makeEgg() {
  const g = new THREE.Group();
  g.add(part(SPHERE, mat(0xfff6e8, { emissive: 0x554d44 }), { pos: [0, 0.28, 0], scale: [0.34, 0.46, 0.34] }));
  g.add(part(new THREE.CircleGeometry(0.4, 12), mat(0x2a1a46, { transparent: true, opacity: 0.4 }), { pos: [0, 0.02, 0], rot: [-Math.PI / 2, 0, 0] }));
  return g;
}

// ------------------------------------------------------------------- map --
export function tileToWorld(col, row) {
  return new THREE.Vector3((col - (COLS - 1) / 2) * TILE, 0, (row - (ROWS - 1) / 2) * TILE);
}

export function makeMap(pathTiles, theme = THEME) {
  const g = new THREE.Group();
  const w = COLS * TILE;
  const h = ROWS * TILE;

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(w + TILE * 2, h + TILE * 2), mat(theme.floor));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  g.add(floor);

  // Checkerboard floor (kitchen tiles, garden turf, …).
  const tileGeo = new THREE.PlaneGeometry(TILE * 0.96, TILE * 0.96);
  const lightM = mat(theme.tileLight);
  const darkM = mat(theme.tileDark);
  const pathM = mat(theme.path);
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const onPath = pathTiles.has(`${c},${r}`);
      const m = new THREE.Mesh(tileGeo, onPath ? pathM : ((c + r) % 2 ? lightM : darkM));
      m.rotation.x = -Math.PI / 2;
      const p = tileToWorld(c, r);
      m.position.set(p.x, onPath ? 0.03 : 0.02, p.z);
      m.receiveShadow = true;
      g.add(m);
    }
  }

  // Skirting board / garden fence around the room
  const wallM = mat(theme.wall);
  for (const [sx, sz, px, pz] of [
    [w + TILE * 2, 0.6, 0, -h / 2 - TILE * 0.6],
    [w + TILE * 2, 0.6, 0, h / 2 + TILE * 0.6],
    [0.6, h + TILE * 2, -w / 2 - TILE * 0.6, 0],
    [0.6, h + TILE * 2, w / 2 + TILE * 0.6, 0],
  ]) {
    const wall = part(BOX, wallM, { pos: [px, 0.45, pz], scale: [sx, 0.9, sz] });
    wall.receiveShadow = true;
    g.add(wall);
  }

  if (theme.decor === 'flowers') g.add(makeFlowers(pathTiles));

  return g;
}

// Little sprouts of colour on the free tiles of the garden. Deterministic-ish
// scatter so the board reads as "planted" rather than noisy.
function makeFlowers(pathTiles) {
  const g = new THREE.Group();
  const stemGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.5, 5);
  const headGeo = new THREE.SphereGeometry(0.22, 8, 6);
  const stemM = mat(0x3f7a37);
  const heads = [0xffd24a, 0xff7fbf, 0xfff0a0, 0xc07bff].map((c) => mat(c, { emissive: c, emissiveIntensity: 0.25 }));
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (pathTiles.has(`${c},${r}`)) continue;
      if ((c * 7 + r * 5) % 6 !== 0) continue;
      const p = tileToWorld(c, r);
      const jx = ((c * 13 + r * 29) % 7) / 14 - 0.25;
      const jz = ((c * 31 + r * 17) % 7) / 14 - 0.25;
      const flower = new THREE.Group();
      flower.add(part(stemGeo, stemM, { pos: [0, 0.25, 0] }));
      const head = part(headGeo, heads[(c + r) % heads.length], { pos: [0, 0.56, 0], scale: [1, 0.7, 1] });
      head.castShadow = true;
      flower.add(head);
      flower.position.set(p.x + jx * TILE, 0, p.z + jz * TILE);
      flower.scale.setScalar(0.8);
      g.add(flower);
    }
  }
  return g;
}

// Glowing chevrons along the path so the route (and its direction) reads
// instantly on a small screen.
export function makePathArrows(waypoints) {
  const g = new THREE.Group();
  const geo = new THREE.ConeGeometry(0.3, 0.55, 4);
  const material = new THREE.MeshBasicMaterial({ color: THEME.arrow, transparent: true, opacity: 0.4 });
  const arrows = [];
  for (let i = 1; i < waypoints.length; i++) {
    const a = waypoints[i - 1];
    const b = waypoints[i];
    const dir = b.clone().sub(a);
    const len = dir.length();
    dir.normalize();
    for (let d = TILE * 0.75; d < len; d += TILE * 1.5) {
      const m = new THREE.Mesh(geo, material);
      const p = a.clone().addScaledVector(dir, d);
      m.position.set(p.x, 0.24, p.z);
      m.rotation.x = Math.PI / 2;
      m.rotation.y = Math.atan2(dir.x, dir.z) + Math.PI / 4;
      m.userData.phase = (d + i * 3) * 0.35;
      g.add(m);
      arrows.push(m);
    }
  }
  g.userData.arrows = arrows;
  g.userData.material = material;
  return g;
}

export function makeMouseHole() {
  const g = new THREE.Group();
  const arch = new THREE.Mesh(new THREE.CircleGeometry(0.7, 16, 0, Math.PI), mat(0x120a1e));
  arch.position.set(0, 0.02, 0);
  arch.rotation.x = -Math.PI / 2;
  g.add(arch);
  g.add(part(new THREE.TorusGeometry(0.72, 0.09, 6, 16, Math.PI), mat(0x2a1a46), { pos: [0, 0.05, 0], rot: [-Math.PI / 2, 0, 0] }));
  return g;
}

// The second door: a jagged purple rift in the skirting board. It stays boarded
// up until wave 11, then the planks blow off and it glows.
export function makePortal() {
  const g = new THREE.Group();
  const glow = new THREE.Mesh(
    new THREE.CircleGeometry(0.95, 18),
    new THREE.MeshBasicMaterial({ color: 0xc07bff, transparent: true, opacity: 0.9, side: THREE.DoubleSide })
  );
  glow.position.set(0, 0.02, 0);
  glow.rotation.x = -Math.PI / 2;
  g.add(glow);
  g.add(part(new THREE.TorusGeometry(0.98, 0.12, 6, 18), mat(0x4a26b8, { emissive: 0x2a1070 }), { pos: [0, 0.06, 0], rot: [-Math.PI / 2, 0, 0] }));

  const boards = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    boards.add(part(BOX, mat(0x8a5a2b), { pos: [0, 0.16, (i - 1) * 0.5], scale: [2.2, 0.16, 0.34], rot: [0, 0.12 * (i - 1), 0] }));
  }
  g.add(boards);
  g.userData.glow = glow;
  g.userData.boards = boards;
  return g;
}

export function makeMilkBowl() {
  const g = new THREE.Group();
  const bowl = part(new THREE.CylinderGeometry(0.95, 0.62, 0.55, 16), mat(0xff7ac4), { pos: [0, 0.28, 0] });
  bowl.castShadow = true;
  g.add(bowl);
  const milk = part(new THREE.CylinderGeometry(0.86, 0.86, 0.08, 16), mat(0xfffaf0, { emissive: 0x554d44 }), { pos: [0, 0.52, 0] });
  g.add(milk);
  g.add(part(new THREE.TorusGeometry(0.95, 0.08, 6, 18), mat(0xffd166), { pos: [0, 0.53, 0], rot: [Math.PI / 2, 0, 0] }));
  g.userData.milk = milk;
  return g;
}

export function makeRangeRing(radius) {
  const mesh = new THREE.Mesh(
    new THREE.RingGeometry(0.965, 1, 56),
    new THREE.MeshBasicMaterial({ color: 0x9dffd8, transparent: true, opacity: 0.75, side: THREE.DoubleSide, depthWrite: false })
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.scale.setScalar(radius);
  mesh.position.y = 0.09;
  return mesh;
}

export function makeGhostTile() {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(TILE * 0.9, 0.12, TILE * 0.9),
    new THREE.MeshBasicMaterial({ color: 0x9dffd8, transparent: true, opacity: 0.45 })
  );
  mesh.position.y = 0.08;
  return mesh;
}

export function makeBullet(type) {
  if (type === 'arrow') {
    const g = new THREE.Group();
    g.add(part(new THREE.CylinderGeometry(0.045, 0.045, 0.7, 5), mat(0xdcc39a), { rot: [Math.PI / 2, 0, 0] }));
    g.add(part(CONE, mat(0xdfe3ef), { pos: [0, 0, 0.42], scale: [0.13, 0.26, 0.13], rot: [Math.PI / 2, 0, 0] }));
    g.add(part(BOX, mat(0xff5b7f), { pos: [0, 0, -0.32], scale: [0.02, 0.18, 0.18] }));
    return g;
  }
  if (type === 'orb') {
    return new THREE.Mesh(new THREE.SphereGeometry(0.25, 10, 8), new THREE.MeshBasicMaterial({ color: 0xc9a7ff }));
  }
  if (type === 'shard') {
    return new THREE.Mesh(new THREE.OctahedronGeometry(0.26), new THREE.MeshBasicMaterial({ color: 0xbdeaff }));
  }
  if (type === 'pillow') {
    const g = makePillow(0.62);
    g.rotation.z = 0.3;
    return g;
  }
  if (type === 'star') {
    return new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.04, 4), mat(0xe8ecff, { emissive: 0x555c74 }));
  }
  if (type === 'slash') {
    // A crescent of moonlight — the arc the katana leaves behind.
    const g = new THREE.Group();
    g.add(part(new THREE.TorusGeometry(0.34, 0.06, 5, 12, Math.PI * 0.8), new THREE.MeshBasicMaterial({ color: 0xeef3ff }), { rot: [Math.PI / 2, 0, 0] }));
    g.add(part(new THREE.TorusGeometry(0.26, 0.03, 5, 10, Math.PI * 0.7), new THREE.MeshBasicMaterial({ color: 0xffd166 }), { rot: [Math.PI / 2, 0, 0.2] }));
    return g;
  }
  // pan
  const g = new THREE.Group();
  g.add(part(new THREE.CylinderGeometry(0.34, 0.32, 0.1, 12), mat(0x33333f)));
  g.add(part(BOX, mat(0x5a3b22), { pos: [0.4, 0.02, 0], scale: [0.46, 0.08, 0.1] }));
  return g;
}

// A rough grey shell dropped over a petrified pest.
export function makeStoneShell() {
  const g = new THREE.Group();
  const stoneM = mat(0x9a9aa8, { transparent: true, opacity: 0.95 });
  g.add(part(new THREE.DodecahedronGeometry(0.85, 0), stoneM, { pos: [0, 0.55, 0] }));
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    g.add(part(new THREE.DodecahedronGeometry(0.34, 0), mat(0x7d7d8c), {
      pos: [Math.cos(a) * 0.6, 0.25 + (i % 2) * 0.5, Math.sin(a) * 0.6], rot: [a, a, 0],
    }));
  }
  return g;
}

export function makeCatnipDrop() {
  const g = new THREE.Group();
  const leafM = mat(0x8dff5a, { emissive: 0x1e5c10 });
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    g.add(part(SPHERE, leafM, { pos: [Math.cos(a) * 0.24, 0.5, Math.sin(a) * 0.24], scale: [0.32, 0.09, 0.17], rot: [0, -a, 0.3] }));
  }
  g.add(part(SPHERE, mat(0xd8ffb0, { emissive: 0x557a2a }), { pos: [0, 0.56, 0], scale: [0.22, 0.22, 0.22] }));
  return g;
}

export function makeStars(count = 200, radius = 70) {
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    pos[i * 3] = Math.cos(a) * radius * (0.6 + Math.random() * 0.7);
    pos[i * 3 + 1] = Math.random() * 45 + 5;
    pos[i * 3 + 2] = Math.sin(a) * radius * (0.6 + Math.random() * 0.7);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  return new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffe6ff, size: 0.55, sizeAttenuation: true, transparent: true, opacity: 0.8 }));
}
