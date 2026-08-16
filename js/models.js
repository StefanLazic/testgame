import * as THREE from 'three';

// ---------------------------------------------------------------------------
// Procedural, low-poly models. No external assets: everything is built from
// primitives so the whole game stays a handful of static files.
// ---------------------------------------------------------------------------

const mat = (color, opts = {}) => new THREE.MeshLambertMaterial({ color, ...opts });

const BOX = new THREE.BoxGeometry(1, 1, 1);
const SPHERE = new THREE.SphereGeometry(0.5, 12, 10);
const CONE = new THREE.ConeGeometry(0.5, 1, 10);

function part(geo, material, { pos = [0, 0, 0], scale = [1, 1, 1], rot = [0, 0, 0] } = {}) {
  const m = new THREE.Mesh(geo, material);
  m.position.set(...pos);
  m.scale.set(...scale);
  m.rotation.set(...rot);
  return m;
}

export function makeCat({ fur = 0xf9a03f, belly = 0xfff0d8 } = {}) {
  const g = new THREE.Group();
  const furM = mat(fur);
  const bellyM = mat(belly);
  const darkM = mat(0x2b1a2e);
  const pinkM = mat(0xff9ec4);

  const body = part(SPHERE, furM, { pos: [0, 0.62, 0], scale: [0.95, 0.86, 1.25] });
  body.castShadow = true;
  g.add(body);
  g.add(part(SPHERE, bellyM, { pos: [0, 0.5, 0.22], scale: [0.6, 0.62, 0.85] }));

  const head = new THREE.Group();
  head.position.set(0, 1.12, 0.42);
  head.add(part(SPHERE, furM, { scale: [0.78, 0.72, 0.72] }));
  head.add(part(SPHERE, bellyM, { pos: [0, -0.12, 0.3], scale: [0.42, 0.3, 0.24] }));
  head.add(part(CONE, pinkM, { pos: [0, -0.09, 0.42], scale: [0.09, 0.09, 0.09], rot: [Math.PI / 2, 0, 0] }));
  // ears
  for (const s of [-1, 1]) {
    head.add(part(CONE, furM, { pos: [0.26 * s, 0.36, -0.02], scale: [0.3, 0.42, 0.3], rot: [0, 0, -0.25 * s] }));
    head.add(part(CONE, pinkM, { pos: [0.26 * s, 0.34, 0.05], scale: [0.16, 0.28, 0.16], rot: [0, 0, -0.25 * s] }));
  }
  // eyes
  const eyes = [];
  for (const s of [-1, 1]) {
    const eye = part(SPHERE, mat(0x9cff6b, { emissive: 0x2f6b12 }), { pos: [0.19 * s, 0.06, 0.3], scale: [0.17, 0.2, 0.12] });
    head.add(eye);
    eyes.push(eye);
    head.add(part(SPHERE, darkM, { pos: [0.19 * s, 0.06, 0.35], scale: [0.06, 0.15, 0.08] }));
  }
  // whiskers
  const whiskerM = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.75 });
  for (const s of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const geo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0.1 * s, -0.06, 0.3),
        new THREE.Vector3(0.55 * s, 0.02 + i * 0.07 - 0.07, 0.34 - i * 0.05),
      ]);
      head.add(new THREE.Line(geo, whiskerM));
    }
  }
  g.add(head);

  // legs
  const legs = [];
  for (const [x, z] of [[-0.42, 0.5], [0.42, 0.5], [-0.42, -0.42], [0.42, -0.42]]) {
    const leg = part(BOX, furM, { pos: [x, 0.18, z], scale: [0.26, 0.36, 0.26] });
    g.add(leg);
    legs.push(leg);
  }

  // tail: chain of small spheres, animated as a wave
  const tail = [];
  const tailRoot = new THREE.Group();
  tailRoot.position.set(0, 0.75, -0.62);
  for (let i = 0; i < 7; i++) {
    const seg = part(SPHERE, i === 6 ? bellyM : furM, { scale: [0.22 - i * 0.012, 0.22 - i * 0.012, 0.22 - i * 0.012] });
    tailRoot.add(seg);
    tail.push(seg);
  }
  g.add(tailRoot);

  // little wizard hat, because magic
  const hat = new THREE.Group();
  hat.position.set(0, 0.5, -0.05);
  hat.add(part(CONE, mat(0x6a3ff0), { pos: [0, 0.34, 0], scale: [0.55, 0.85, 0.55] }));
  hat.add(part(new THREE.CylinderGeometry(0.45, 0.45, 0.05, 12), mat(0x4a26b8), { pos: [0, 0, 0] }));
  hat.add(part(SPHERE, mat(0xffd166, { emissive: 0x8a6b00 }), { pos: [0, 0.76, 0], scale: [0.16, 0.16, 0.16] }));
  hat.rotation.z = 0.12;
  head.add(hat);

  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return { group: g, head, legs, tail, tailRoot, eyes, body, hat };
}

export function makeMouse(kind = 'grunt') {
  const g = new THREE.Group();
  const palette = {
    grunt: { fur: 0x9aa4b2, ear: 0xffc0d0 },
    fast: { fur: 0xf2e06b, ear: 0xffd5a8 },
    tank: { fur: 0x6b5b8f, ear: 0xc9a7ff },
    king: { fur: 0x4a3a63, ear: 0xffb3d9 },
  }[kind];
  const furM = mat(palette.fur);
  const earM = mat(palette.ear);

  const body = part(SPHERE, furM, { pos: [0, 0.3, 0], scale: [0.5, 0.44, 0.68] });
  g.add(body);
  const head = part(SPHERE, furM, { pos: [0, 0.34, 0.32], scale: [0.36, 0.34, 0.36] });
  g.add(head);
  g.add(part(CONE, mat(0xffd0e0), { pos: [0, 0.3, 0.52], scale: [0.14, 0.18, 0.14], rot: [Math.PI / 2, 0, 0] }));
  for (const s of [-1, 1]) {
    g.add(part(new THREE.CircleGeometry(0.5, 12), earM, { pos: [0.2 * s, 0.55, 0.26], scale: [0.34, 0.34, 0.34], rot: [0, 0.5 * s, 0] }));
    g.add(part(SPHERE, mat(0x120c18), { pos: [0.13 * s, 0.38, 0.55], scale: [0.09, 0.09, 0.06] }));
  }
  // tail
  const tailGeo = new THREE.CylinderGeometry(0.03, 0.015, 0.7, 5);
  g.add(part(tailGeo, mat(0xffbfd0), { pos: [0, 0.3, -0.5], rot: [1.2, 0, 0] }));

  if (kind === 'king') {
    const crown = new THREE.Group();
    crown.position.set(0, 0.66, 0.3);
    crown.add(part(new THREE.CylinderGeometry(0.22, 0.26, 0.16, 8), mat(0xffd166, { emissive: 0x6b5200 })));
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      crown.add(part(CONE, mat(0xffd166, { emissive: 0x6b5200 }), {
        pos: [Math.cos(a) * 0.2, 0.14, Math.sin(a) * 0.2], scale: [0.1, 0.16, 0.1],
      }));
    }
    g.add(crown);
  }
  if (kind === 'tank') {
    g.add(part(SPHERE, mat(0x3c3350), { pos: [0, 0.52, -0.02], scale: [0.55, 0.3, 0.6] }));
  }

  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return { group: g, body, head };
}

export function makeCatnip() {
  const g = new THREE.Group();
  const leafM = mat(0x8dff5a, { emissive: 0x1e5c10 });
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    g.add(part(SPHERE, leafM, {
      pos: [Math.cos(a) * 0.22, 0.1, Math.sin(a) * 0.22],
      scale: [0.3, 0.08, 0.16], rot: [0, -a, 0.3],
    }));
  }
  g.add(part(SPHERE, mat(0xd8ffb0, { emissive: 0x557a2a }), { pos: [0, 0.16, 0], scale: [0.2, 0.2, 0.2] }));
  return g;
}

export function makeArena(radius = 18) {
  const g = new THREE.Group();

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(radius, 48),
    new THREE.MeshLambertMaterial({ color: 0x4b3186 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  g.add(floor);

  // Rug rings for depth and a sense of speed while moving
  for (let i = 1; i <= 3; i++) {
    const r = (radius / 4) * i;
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(r - 0.14, r, 64),
      new THREE.MeshBasicMaterial({ color: 0xa77dff, transparent: true, opacity: 0.4, side: THREE.DoubleSide })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.02;
    g.add(ring);
  }

  // Glowing boundary
  const wall = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, 1.6, 64, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xff7ac4, transparent: true, opacity: 0.22, side: THREE.BackSide })
  );
  wall.position.y = 0.8;
  g.add(wall);

  // Furniture-ish pillars: yarn balls on stools
  const pillars = [];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.4;
    const r = radius * 0.66;
    const p = new THREE.Group();
    p.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
    const stool = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.7, 1.1, 10), mat(0x503080));
    stool.position.y = 0.55;
    stool.castShadow = true;
    p.add(stool);
    const yarn = new THREE.Mesh(SPHERE, mat([0xff6b8a, 0x6bd0ff, 0xffd166][i % 3]));
    yarn.position.y = 1.5;
    yarn.scale.setScalar(0.9);
    yarn.castShadow = true;
    p.add(yarn);
    p.userData.yarn = yarn;
    g.add(p);
    pillars.push(p);
  }

  return { group: g, radius, pillars };
}

export function makeStars(count = 260, radius = 60) {
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const y = Math.random() * 40 + 3;
    const r = radius * (0.7 + Math.random() * 0.6);
    pos[i * 3] = Math.cos(a) * r;
    pos[i * 3 + 1] = y;
    pos[i * 3 + 2] = Math.sin(a) * r;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  return new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffe6ff, size: 0.5, sizeAttenuation: true, transparent: true, opacity: 0.8 }));
}
