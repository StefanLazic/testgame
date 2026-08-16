import * as THREE from 'three';
import { TILE, COLS, ROWS } from './config.js';

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
  } else if (kind === 'chef') {
    const hat = new THREE.Group();
    hat.position.set(0, 0.4, -0.02);
    hat.add(part(new THREE.CylinderGeometry(0.34, 0.3, 0.42, 12), mat(0xfffdf5)));
    hat.add(part(SPHERE, mat(0xfffdf5), { pos: [0, 0.34, 0], scale: [0.5, 0.36, 0.5] }));
    hat.add(part(new THREE.CylinderGeometry(0.36, 0.36, 0.1, 12), accM, { pos: [0, -0.2, 0] }));
    head.add(hat);
    const pan = new THREE.Group();
    pan.position.set(0.34, 0.2, 0.1);
    pan.add(part(new THREE.CylinderGeometry(0.3, 0.28, 0.09, 12), mat(0x33333f)));
    pan.add(part(BOX, mat(0x5a3b22), { pos: [-0.36, 0.02, 0], scale: [0.42, 0.07, 0.09] }));
    pan.rotation.z = -0.3;
    arm.add(pan);
  }

  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return { group: g, head, arm, body, tail };
}

// ---------------------------------------------------------------- enemies --
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
  };

  const kindDef = { golden: 'mouse', baron: 'dog', ratking: 'mouse' }[kind] || kind;
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

  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return { group: g, head, legs };
}

// ------------------------------------------------------------------- map --
export function tileToWorld(col, row) {
  return new THREE.Vector3((col - (COLS - 1) / 2) * TILE, 0, (row - (ROWS - 1) / 2) * TILE);
}

export function makeMap(pathTiles) {
  const g = new THREE.Group();
  const w = COLS * TILE;
  const h = ROWS * TILE;

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(w + TILE * 2, h + TILE * 2), mat(0x3a2360));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  g.add(floor);

  // Checkerboard kitchen tiles (merged into two instanced-ish groups of meshes).
  const tileGeo = new THREE.PlaneGeometry(TILE * 0.96, TILE * 0.96);
  const lightM = mat(0x53377f);
  const darkM = mat(0x472e6f);
  const pathM = mat(0x8f6a3e);
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

  // Skirting board around the room
  const wallM = mat(0x2a1a46);
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

  return g;
}

// Glowing chevrons along the path so the route (and its direction) reads
// instantly on a small screen.
export function makePathArrows(waypoints) {
  const g = new THREE.Group();
  const geo = new THREE.ConeGeometry(0.3, 0.55, 4);
  const material = new THREE.MeshBasicMaterial({ color: 0xffd9a0, transparent: true, opacity: 0.4 });
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
  if (type === 'star') {
    return new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.04, 4), mat(0xe8ecff, { emissive: 0x555c74 }));
  }
  // pan
  const g = new THREE.Group();
  g.add(part(new THREE.CylinderGeometry(0.34, 0.32, 0.1, 12), mat(0x33333f)));
  g.add(part(BOX, mat(0x5a3b22), { pos: [0.4, 0.02, 0], scale: [0.46, 0.08, 0.1] }));
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
