// ---------------------------------------------------------------------------
// Pure gameplay rules. Everything in here is plain maths over plain data — no
// three.js, no DOM — so the engine stays thin and the rules stay testable.
// ---------------------------------------------------------------------------

import { TOWERS, towerStats, SUPPORT } from './config.js';

// What the shop shows before you spend a single fish.
export function previewStats(kind, level = 1) {
  const base = TOWERS[kind];
  if (!base) return null;
  const st = towerStats(kind, level);
  return {
    kind,
    icon: base.icon,
    cost: base.cost,
    level,
    damage: Math.round(st.damage),
    range: st.range,
    rate: st.rate,
    air: !!base.air,
    ability: base.ability || null,
    global: !!base.global,
  };
}

const NEIGHBOURS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// Where to park the range preview before the player has touched the board: the
// free tile next to the lane closest to the middle of the map, which is where
// most people build anyway.
export function previewTile({ cols, rows, pathTiles, occupied }) {
  const taken = (key) => (occupied.has ? occupied.has(key) : !!occupied[key]);
  const midC = (cols - 1) / 2;
  const midR = (rows - 1) / 2;
  let best = null;
  let fallback = null;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const key = `${col},${row}`;
      if (pathTiles.has(key) || taken(key)) continue;
      const d = Math.hypot(col - midC, row - midR);
      if (!fallback || d < fallback.d) fallback = { col, row, key, d };
      const adj = NEIGHBOURS.some(([dc, dr]) => pathTiles.has(`${col + dc},${row + dr}`));
      if (!adj) continue;
      if (!best || d < best.d) best = { col, row, key, d };
    }
  }
  const pick = best || fallback;
  return pick ? { col: pick.col, row: pick.row, key: pick.key } : null;
}

// ------------------------------------------------------------- support cats
// Ema cheers the cats around her; Sofija sniffs out fish. Neither ever fires,
// so all of their value is in these two little tables.

const clampLevel = (level, table) => Math.min(Math.max(Math.round(level) || 1, 1), table.length) - 1;

// What Ema's ribbon is worth at a given collar. `null` for anyone else.
export function auraBonus(kind, level) {
  if (kind !== 'ema') return null;
  const { damage, rate } = SUPPORT.ema;
  const i = clampLevel(level, damage);
  return { damage: damage[i], rate: rate[i] };
}

const covers = (support, pos) => {
  if (support === pos) return false;                       // nobody buffs themselves
  const dx = support.x - pos.x;
  const dz = support.z - pos.z;
  return Math.hypot(dx, dz) <= (support.range || 0) + 1e-6;
};

// The multipliers a cat standing at `pos` shoots with. Ribbons never stack —
// the strongest one wins — so a wall of Emas is never the answer.
export function auraMultipliers(pos, supports = []) {
  let best = null;
  for (const s of supports) {
    if (s.kind !== 'ema' || !covers(s, pos)) continue;
    const bonus = auraBonus(s.kind, s.level);
    if (!best || bonus.damage > best.damage) best = bonus;
  }
  return best
    ? { damage: 1 + best.damage, rate: 1 + best.rate, buffed: true }
    : { damage: 1, rate: 1, buffed: false };
}

// How often Sofija finds a fish, and how big it is.
export function goldIncome(level) {
  const { interval, coin } = SUPPORT.sofija;
  const i = clampLevel(level, coin);
  return { interval: interval[i], coin: coin[i] };
}

// Pests that fall inside Sofija's purse are worth more. Like ribbons, purses
// do not stack.
export function bountyMultiplier(pos, supports = []) {
  let best = 0;
  for (const s of supports) {
    if (s.kind !== 'sofija' || !covers(s, pos)) continue;
    const i = clampLevel(s.level, SUPPORT.sofija.bounty);
    best = Math.max(best, SUPPORT.sofija.bounty[i]);
  }
  return 1 + best;
}
