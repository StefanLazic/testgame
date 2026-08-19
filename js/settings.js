// ---------------------------------------------------------------------------
// Player settings (sound, screen shake, …). Kept in one tiny store so the game
// never talks to localStorage directly — a blocked or corrupt storage must not
// stop anyone playing.
// ---------------------------------------------------------------------------

const STORE_KEY = 'cd-settings';

export const DEFAULTS = Object.freeze({
  sound: true,      // WebAudio sound effects
  shake: true,      // camera kicks — off is gentler on motion sickness
  map: 'kitchen',   // the board picked on the title screen
});

export function createSettings(storage = globalThis.localStorage) {
  const values = { ...DEFAULTS };
  const listeners = new Set();

  try {
    const raw = storage && storage.getItem(STORE_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      for (const key of Object.keys(DEFAULTS)) {
        if (key in saved) values[key] = saved[key];
      }
    }
  } catch { /* no storage, or someone edited it by hand — defaults are fine */ }

  const persist = () => {
    try { storage && storage.setItem(STORE_KEY, JSON.stringify(values)); } catch { /* private mode */ }
  };

  return {
    get(key) { return values[key]; },
    all() { return { ...values }; },
    set(key, value) {
      if (!(key in DEFAULTS) || values[key] === value) return values[key];
      values[key] = value;
      persist();
      for (const fn of listeners) fn(key, value);
      return value;
    },
    toggle(key) { return this.set(key, !values[key]); },
    onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); },
  };
}

// The one the game uses.
export const settings = createSettings();
