// ---------------------------------------------------------------------------
// Pure gameplay rules. Everything in here is plain maths over plain data — no
// three.js, no DOM — so the engine stays thin and the rules stay testable.
// ---------------------------------------------------------------------------

import {
  TOWERS, towerStats, SUPPORT, SYNERGIES, SYNERGY_RANGE, BRANCHES, branchCost, maxLevel,
  bountyScale, BOSS_LIFE_REWARD, START_LIVES, QUEEN,
} from './config.js';

// ------------------------------------------------------------- the economy
// What a fallen pest is worth: its base bounty, nudged up by the wave it died
// on, multiplied by any Sofija purse it fell inside.
export function bountyFor(def, wave, purse = 1) {
  if (!def) return 0;
  return Math.round((def.bounty || 0) * bountyScale(wave) * purse);
}

// --------------------------------------------------------------- the lives
// Main bosses are the only pests that give something back: drop one and the
// milk bowl is topped up by a life, never above the nine you started with. A
// run that is already over stays over.
export function lifeReward(def) {
  return def && def.boss === 'main' ? BOSS_LIFE_REWARD : 0;
}

export function livesAfterKill(lives, def, max = START_LIVES) {
  if (lives <= 0) return lives;
  return Math.min(max, lives + lifeReward(def));
}

// ------------------------------------------------------------ tower limits
// Some cats are one of a kind. There is exactly one Mimi-chan in the world, so
// there is exactly one of her on the table.
export function towerLimit(kind) {
  const def = TOWERS[kind];
  return def && def.limit ? def.limit : Infinity;
}

export function towerCount(kind, towers = []) {
  return towers.filter((tw) => tw.kind === kind).length;
}

export function canPlaceTower(kind, towers = []) {
  return towerCount(kind, towers) < towerLimit(kind);
}

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

// How much more damage everything inside a witch's hex field takes.
export function hexBonus(level, branch = null) {
  const { hex } = SUPPORT.witch;
  const i = clampLevel(level, hex);
  const mult = (BRANCHES.witch[branch] && BRANCHES.witch[branch].hex) || 1;
  return hex[i] * mult;
}

// Pests standing in a hex field are easier to hurt — every cat's shots, splash
// and spinning strikes all land harder. Like ribbons and purses, hex fields do
// not stack: only the strongest witch in reach counts.
export function hexMultiplier(pos, witches = []) {
  let best = 0;
  for (const w of witches) {
    if (w.kind !== 'witch' || !covers(w, pos)) continue;
    best = Math.max(best, hexBonus(w.level, w.branch));
  }
  return 1 + best;
}

// --------------------------------------------------------------- armour --
// What a hit is actually worth once the pest's armour has eaten its share.
// Armour is flat, but a hit never drops below a quarter of its raw damage, so
// even a shuriken tickles a turtle. `pierce` is the fraction of the armour a
// shot ignores outright: 0 is a normal hit, 1 is true damage.
export function armouredDamage(amount, armor = 0, pierce = 0) {
  const raw = Math.max(0, amount || 0);
  const p = Math.min(1, Math.max(0, pierce || 0));
  const left = Math.max(0, armor || 0) * (1 - p);
  return Math.max(raw * 0.25, raw - left);
}

// A chill only counts if it wears off. A slow with no duration would stick to
// a pest forever, so treat it as no slow at all.
export function slowFrom({ slow = 0, slowTime = 0 } = {}) {
  if (!slow || slowTime <= 0) return null;
  return { factor: Math.min(0.8, slow), time: slowTime };
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
    pierce: Number((st.pierce || 0).toFixed(2)),
    // The royal paths sell safety instead of numbers, so the sheet needs to
    // know about it: nothing else on a queen's card ever changes.
    immuneDestroy: !!st.immuneDestroy,
    immuneDisable: !!st.immuneDisable,
    ward: !!st.ward,
    branch: st.branch,
  };
}

// ------------------------------------------------------- royal protection --
// Mimi-chan costs a fortune, so once she specialises nothing on the board may
// destroy her — and the Regent path extends that safety to every cat around
// her. All of it is plain maths over plain tower data, so the engine only has
// to ask "may this cat be destroyed?" and "did a ward save it?".

// Towers carry a THREE.Vector3 `pos` in the engine and plain x/z in tests.
const xz = (tw) => (tw && tw.pos ? { x: tw.pos.x, z: tw.pos.z } : { x: tw.x || 0, z: tw.z || 0 });

export function towerProtection(tower) {
  if (!tower || !TOWERS[tower.kind]) return { destroy: false, disable: false, ward: false };
  const st = towerStats(tower.kind, tower.level || 1, tower.branch || null);
  return { destroy: !!st.immuneDestroy, disable: !!st.immuneDisable, ward: !!st.ward };
}

// A specialised queen cannot be burned, stomped or flattened.
export function immuneToDestroy(tower) { return towerProtection(tower).destroy; }

// The Empress also refuses to nap, to be shuffled, or to wear a banana.
export function immuneToDisable(tower) { return towerProtection(tower).disable; }

// The cats a boss may actually reach.
export function destructible(towers = []) {
  return towers.filter((tw) => !immuneToDestroy(tw));
}

// Which cats a "destroy a share of the army" ability takes, immunity included.
export function destroyTargets(towers = [], fraction = 0, rand = Math.random) {
  const pool = destructible(towers);
  return destroyPicks(pool.length, fraction, rand).map((i) => pool[i]);
}

// The charged ward that would save `tower`, or null when nobody can help it.
// One ward covers every cat in its radius, but only for a single blow: the
// engine puts it on cooldown the moment it is spent.
export function wardFor(tower, towers = []) {
  if (!tower) return null;
  const here = xz(tower);
  for (const tw of towers) {
    if (tw === tower) continue;
    if (!towerProtection(tw).ward) continue;
    if ((tw.wardT || 0) > 0) continue;
    const p = xz(tw);
    if (Math.hypot(p.x - here.x, p.z - here.z) <= QUEEN.ward.radius + 1e-6) return tw;
  }
  return null;
}

// -------------------------------------------------------- pest counterplay
// Three pests that punish a one-note defence: one heals, one shields, one
// burrows. All three behaviours are plain maths so they can be tested.

// Damaged, living friends inside a healer's reach.
export function healTargets(healer, enemies = [], radius = 0) {
  return enemies.filter((e) => e !== healer && e.alive && e.hp < e.maxHp
    && Math.hypot(e.x - healer.x, e.z - healer.z) <= radius + 1e-6);
}

// A shield soaks damage first; anything left over spills into health.
export function shieldAbsorb({ hp, shield = 0 }, amount) {
  const absorbed = Math.min(shield, amount);
  const left = shield - absorbed;
  return {
    hp: hp - (amount - absorbed),
    shield: left,
    absorbed,
    broke: shield > 0 && left === 0,
  };
}

// Shields grow back, but only after a quiet spell.
export function shieldRegen({ shield = 0, sinceHit = 0 }, def, dt) {
  if (!def || !def.shield) return 0;
  if (sinceHit < (def.shieldDelay || 0)) return shield;
  return Math.min(def.shield, shield + (def.shieldRegen || 0) * dt);
}

// Burrowers spend `interval` seconds above ground, then `duration` below,
// where nothing can touch them.
export function burrowedAt(elapsed, def) {
  if (!def || !def.interval || !def.duration) return false;
  const cycle = def.interval + def.duration;
  return (elapsed % cycle) >= def.interval;
}

// ------------------------------------------------------------ Emilija's tricks
// The butterfly boss never attacks a cat. She rearranges your army instead, so
// all three of her tricks are pure list maths over the towers you have built.

// Shuffle the tiles your cats stand on. Returns the new tile order: entry i is
// the tile that tower i moves to. With two or more cats nobody keeps their own
// tile, so the trick always *feels* like something happened.
export function shufflePlan(tiles, rand = Math.random) {
  const out = tiles.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  if (out.length > 1) {
    // Rotate any cat that drew its own tile onto its neighbour's.
    for (let i = 0; i < out.length; i++) {
      if (out[i] !== tiles[i]) continue;
      const j = (i + 1) % out.length;
      [out[i], out[j]] = [out[j], out[i]];
    }
  }
  return out;
}

// Which cats fall asleep: a fraction of the army, rounded up, never everyone
// unless there is only one cat to pick from.
export function sleepPicks(count, fraction, rand = Math.random) {
  if (count <= 0) return [];
  const want = Math.max(1, Math.min(count, Math.ceil(count * fraction)));
  const pool = Array.from({ length: count }, (_, i) => i);
  const picked = [];
  while (picked.length < want && pool.length) {
    picked.push(pool.splice(Math.floor(rand() * pool.length), 1)[0]);
  }
  return picked.sort((a, b) => a - b);
}

// Pick the next trick, never the same one twice in a row.
export function nextTrick(tricks, last, rand = Math.random) {
  const pool = tricks.filter((x) => x !== last);
  const from = pool.length ? pool : tricks;
  return from[Math.floor(rand() * from.length)];
}

// ------------------------------------------------------- the family (31-50)
// Simona, her brother Stefo and their father all fight by plain maths, kept
// here so the engine only has to do the bookkeeping.

// A copy of Simona starts life with the same *share* of health she has: hurt
// her to 90% and the clone shows up at 90% too.
export function cloneStats({ hp, maxHp }, fraction = 1) {
  const share = maxHp > 0 ? hp / maxHp : 0;
  const cloneMax = maxHp * fraction;
  return { hp: cloneMax * share, maxHp: cloneMax };
}

// Standing on her hands: `resist` of the blow simply does not land.
export function guardedDamage(amount, resist = 0) {
  return amount * (1 - Math.min(Math.max(resist, 0), 1));
}

// The star jump: a cartwheel that throws her `distance` further down the lane,
// but never past the milk bowl.
export function starLeap(progress, distance, routeLength) {
  return Math.min(progress + distance, routeLength);
}

// Stefo blinks somewhere else — anywhere but where he is standing.
export function nextTeleportSpot(spots, current, rand = Math.random) {
  if (!spots.length) return null;
  const pool = spots.filter((s) => s !== current);
  const from = pool.length ? pool : spots;
  return from[Math.floor(rand() * from.length)];
}

// Father flattens a share of the army. Same shape as Emilija's nap, but these
// cats do not wake up.
export function destroyPicks(count, fraction, rand = Math.random) {
  return sleepPicks(count, fraction, rand);
}

// "I AM THE BOSS": when he gets back up he takes 50% more cats with him.
export function reviveFraction(base, extra = 0.5) {
  return Math.min(1, base * (1 + extra));
}
