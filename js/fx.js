import * as THREE from 'three';

// Cheap pooled particle + ring effects. Everything is additive-blended so it
// reads well against the dark arena without needing post-processing.

const SPRITE_TEX = (() => {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const ctx = c.getContext('2d');
  const grd = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.35, 'rgba(255,255,255,0.65)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c);
  return tex;
})();

export class Effects {
  constructor(scene) {
    this.scene = scene;
    this.particles = [];
    this.pool = [];
    this.rings = [];
    this.shake = 0;
  }

  _sprite() {
    const s = this.pool.pop();
    if (s) { s.visible = true; return s; }
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({
      map: SPRITE_TEX, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    }));
    this.scene.add(sp);
    return sp;
  }

  burst(pos, { count = 12, color = 0xffd166, speed = 4, size = 0.5, life = 0.6, gravity = -6, spread = 1 } = {}) {
    for (let i = 0; i < count; i++) {
      const sp = this._sprite();
      sp.material.color.setHex(color);
      sp.material.opacity = 1;
      sp.position.copy(pos);
      sp.scale.setScalar(size * (0.6 + Math.random() * 0.8));
      const a = Math.random() * Math.PI * 2;
      const up = Math.random() * spread;
      this.particles.push({
        sp,
        vel: new THREE.Vector3(Math.cos(a) * speed * Math.random(), up * speed * 0.7 + 1, Math.sin(a) * speed * Math.random()),
        life, max: life, gravity, size: sp.scale.x,
      });
    }
  }

  trail(pos, color = 0xff8a3d, size = 0.45) {
    const sp = this._sprite();
    sp.material.color.setHex(color);
    sp.material.opacity = 0.9;
    sp.position.copy(pos);
    sp.scale.setScalar(size);
    this.particles.push({ sp, vel: new THREE.Vector3(0, 0.6, 0), life: 0.35, max: 0.35, gravity: 0, size });
  }

  ring(pos, { color = 0x74e0ff, from = 0.4, to = 6, life = 0.5, y = 0.08 } = {}) {
    const mesh = new THREE.Mesh(
      new THREE.RingGeometry(0.86, 1, 40),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.95, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(pos.x, y, pos.z);
    mesh.scale.setScalar(from);
    this.scene.add(mesh);
    this.rings.push({ mesh, life, max: life, from, to });
  }

  bolt(from, to, color = 0xbff0ff) {
    const pts = [];
    const steps = 8;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const p = from.clone().lerp(to, t);
      if (i > 0 && i < steps) {
        p.x += (Math.random() - 0.5) * 0.9;
        p.y += (Math.random() - 0.5) * 0.9;
        p.z += (Math.random() - 0.5) * 0.9;
      }
      pts.push(p);
    }
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(pts),
      new THREE.LineBasicMaterial({ color, transparent: true, opacity: 1, blending: THREE.AdditiveBlending })
    );
    this.scene.add(line);
    this.rings.push({ mesh: line, life: 0.22, max: 0.22, from: 1, to: 1, isLine: true });
  }

  kick(amount = 0.4) { this.shake = Math.min(1.4, this.shake + amount); }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        p.sp.visible = false;
        this.pool.push(p.sp);
        this.particles.splice(i, 1);
        continue;
      }
      p.vel.y += p.gravity * dt;
      p.sp.position.addScaledVector(p.vel, dt);
      const t = p.life / p.max;
      p.sp.material.opacity = t;
      p.sp.scale.setScalar(p.size * (0.4 + t * 0.9));
    }
    for (let i = this.rings.length - 1; i >= 0; i--) {
      const r = this.rings[i];
      r.life -= dt;
      const t = Math.max(0, r.life / r.max);
      if (r.life <= 0) {
        r.mesh.geometry.dispose();
        r.mesh.material.dispose();
        this.scene.remove(r.mesh);
        this.rings.splice(i, 1);
        continue;
      }
      r.mesh.material.opacity = t;
      if (!r.isLine) r.mesh.scale.setScalar(r.from + (r.to - r.from) * (1 - t));
    }
    this.shake = Math.max(0, this.shake - dt * 2.2);
  }
}
