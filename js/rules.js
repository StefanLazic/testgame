// ---------------------------------------------------------------------------
// Pure gameplay rules. Everything in here is plain maths over plain data — no
// three.js, no DOM — so the engine stays thin and the rules stay testable.
// ---------------------------------------------------------------------------

import { TOWERS, towerStats } from './config.js';

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
