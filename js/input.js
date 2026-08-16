// Touch-first input: a dynamic virtual stick on the left half of the screen,
// tap buttons on the right, plus a keyboard fallback for desktop testing.

export class Input {
  constructor() {
    this.move = { x: 0, y: 0 };
    this.pressed = { claw: false, hairball: false, thunder: false };
    this.keys = new Set();
    this._touchId = null;
    this._origin = { x: 0, y: 0 };
    this.maxRadius = 58;

    this.zone = document.getElementById('stick-zone');
    this.base = document.getElementById('stick-base');
    this.knob = document.getElementById('stick-knob');

    this.zone.addEventListener('pointerdown', this._down, { passive: false });
    window.addEventListener('pointermove', this._moveEvt, { passive: false });
    window.addEventListener('pointerup', this._up);
    window.addEventListener('pointercancel', this._up);

    for (const [id, name] of [['btn-claw', 'claw'], ['btn-hairball', 'hairball'], ['btn-thunder', 'thunder']]) {
      const el = document.getElementById(id);
      el.addEventListener('pointerdown', (e) => { e.preventDefault(); this.pressed[name] = true; });
      el.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    window.addEventListener('keydown', (e) => {
      this.keys.add(e.code);
      if (e.code === 'Space' || e.code === 'KeyJ') this.pressed.claw = true;
      if (e.code === 'KeyK') this.pressed.hairball = true;
      if (e.code === 'KeyL') this.pressed.thunder = true;
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
  }

  _down = (e) => {
    if (this._touchId !== null) return;
    e.preventDefault();
    this._touchId = e.pointerId;
    this._origin = { x: e.clientX, y: e.clientY };
    this.base.style.left = `${e.clientX}px`;
    this.base.style.top = `${e.clientY}px`;
    this.base.classList.add('active');
    this._apply(e.clientX, e.clientY);
  };

  _moveEvt = (e) => {
    if (e.pointerId !== this._touchId) return;
    e.preventDefault();
    this._apply(e.clientX, e.clientY);
  };

  _up = (e) => {
    if (e.pointerId !== this._touchId) return;
    this._touchId = null;
    this.move.x = this.move.y = 0;
    this.base.classList.remove('active');
    this.knob.style.transform = '';
  };

  _apply(x, y) {
    let dx = x - this._origin.x;
    let dy = y - this._origin.y;
    const len = Math.hypot(dx, dy);
    const clamped = Math.min(len, this.maxRadius);
    if (len > 0.001) { dx = (dx / len) * clamped; dy = (dy / len) * clamped; }
    this.knob.style.transform = `translate(${dx}px, ${dy}px)`;
    const norm = clamped / this.maxRadius;
    if (len > 0.001) {
      this.move.x = (dx / clamped || 0) * norm;
      this.move.y = (dy / clamped || 0) * norm;
    }
  }

  // Combined analogue + keyboard direction, magnitude clamped to 1.
  direction() {
    let x = this.move.x;
    let y = this.move.y;
    const k = this.keys;
    if (k.has('KeyA') || k.has('ArrowLeft')) x -= 1;
    if (k.has('KeyD') || k.has('ArrowRight')) x += 1;
    if (k.has('KeyW') || k.has('ArrowUp')) y -= 1;
    if (k.has('KeyS') || k.has('ArrowDown')) y += 1;
    const len = Math.hypot(x, y);
    if (len > 1) { x /= len; y /= len; }
    return { x, y, len: Math.min(1, len) };
  }

  consume(name) {
    if (!this.pressed[name]) return false;
    this.pressed[name] = false;
    return true;
  }

  reset() {
    this.pressed.claw = this.pressed.hairball = this.pressed.thunder = false;
    this.move.x = this.move.y = 0;
    this._touchId = null;
    this.base.classList.remove('active');
  }
}
