// ---------------------------------------------------------------------------
// Pure gameplay rules. Everything in here is plain maths over plain data — no
// three.js, no DOM — so the engine stays thin and the rules stay testable.
// ---------------------------------------------------------------------------

import {
  TOWERS, towerStats, SUPPORT, SYNERGIES, SYNERGY_RANGE, BRANCHES, branchCost, maxLevel,
} from './config.js';

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
export function auraBonus(kind, level, branch = null) {
  if (kind !== 'ema') return null;
  const { damage, rate } = SUPPORT.ema;
  const i = clampLevel(level, damage);
  const mult = (BRANCHES.ema[branch] && BRANCHES.ema[branch].buff) || 1;
  return { damage: damage[i] * mult, rate: rate[i] * mult };
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
    const bonus = auraBonus(s.kind, s.level, s.branch);
    if (!best || bonus.damage > best.damage) best = bonus;
  }
  return best
    ? { damage: 1 + best.damage, rate: 1 + best.rate, buffed: true }
    : { damage: 1, rate: 1, buffed: false };
}

// How often Sofija finds a fish, and how big it is.
export function goldIncome(level, branch = null) {
  const { interval, coin } = SUPPORT.sofija;
  const i = clampLevel(level, coin);
  const mods = BRANCHES.sofija[branch] || {};
  return {
    interval: Number((interval[i] * (mods.interval || 1)).toFixed(2)),
    coin: Math.round(coin[i] * (mods.coin || 1)),
  };
}

// Pests that fall inside Sofija's purse are worth more. Like ribbons, purses
// do not stack.
export function bountyMultiplier(pos, supports = []) {
  let best = 0;
  for (const s of supports) {
    if (s.kind !== 'sofija' || !covers(s, pos)) continue;
    const i = clampLevel(s.level, SUPPORT.sofija.bounty);
    const mods = BRANCHES.sofija[s.branch] || {};
    best = Math.max(best, SUPPORT.sofija.bounty[i] * (mods.bounty || 1));
  }
  return 1 + best;
}

// --------------------------------------------------------------- synergies
// Cats that work well together. A pairing counts once no matter how many
// partners are in reach, but different pairings stack.
export { SYNERGIES, SYNERGY_RANGE };

const near = (a, b) => Math.hypot(a.x - b.x, a.z - b.z) <= SYNERGY_RANGE + 1e-6;

export function activeSynergies(tower, towers = []) {
  const out = [];
  for (const syn of SYNERGIES) {
    const other = syn.a === tower.kind ? syn.b : syn.b === tower.kind ? syn.a : null;
    if (!other) continue;
    if (!towers.some((tw) => tw !== tower && tw.kind === other && near(tw, tower))) continue;
    out.push(syn);
  }
  return out;
}

export function synergyMultipliers(tower, towers = []) {
  const ids = [];
  let damage = 1; let rate = 1; let range = 1;
  for (const syn of activeSynergies(tower, towers)) {
    ids.push(syn.id);
    damage += syn.damage || 0;
    rate += syn.rate || 0;
    range += syn.range || 0;
  }
  return { damage, rate, range, ids };
}

// ------------------------------------------------------- hybrid upgrades --
// The two paths a cat can take once it has earned every collar.
export function branchesFor(kind, level) {
  const table = BRANCHES[kind];
  if (!table || level < maxLevel(kind)) return [];
  return Object.entries(table).map(([id, mods]) => ({
    id, kind, icon: mods.icon, cost: branchCost(kind), mods,
  }));
}

// What a cat looks like once it walks down a path — used by the upgrade sheet.
export function branchStats(kind, branch) {
  const st = towerStats(kind, maxLevel(kind), branch);
  return {
    damage: Math.round(st.damage), range: Number(st.range.toFixed(1)),
    rate: Number(st.rate.toFixed(2)), splash: Number((st.splash || 0).toFixed(1)),
    branch: st.branch,
  };
}
