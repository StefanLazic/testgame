// ---------------------------------------------------------------------------
// All balance data for Claw Defense lives here so it is easy to tweak.
//
// The board itself (size, lanes, theme) belongs to the *map* — see js/maps.js.
// The exports below are live bindings that `setBoard()` swaps when the player
// picks a different map, so every module that imports COLS/ROWS/PATHS sees the
// change without any wiring.
// ---------------------------------------------------------------------------

export const TILE = 2;

// Path through the kitchen, in [col, row] tile coordinates. Pests walk the
// centre of these tiles from the mouse hole to the milk bowl.
export const PATH = [
  [0, 1], [7, 1], [7, 4], [1, 4], [1, 7], [7, 7], [7, 10],
  [1, 10], [1, 13], [7, 13], [7, 16], [4, 16],
];

// Second lane. It starts at the top-right corner of the board and only opens
// from wave 11 — see SECOND_LANE_WAVE. It merges into the main path on the last
// row so both streams finish at the milk bowl.
export const PATH2 = [
  [8, 0], [8, 3], [6, 3], [6, 6], [8, 6], [8, 9], [6, 9], [6, 12], [8, 12], [8, 16], [4, 16],
];

// The kitchen is the default board; js/maps.js owns the full list.
export let COLS = 9;
export let ROWS = 19;
export let PATHS = [PATH, PATH2];
export let SECOND_LANE_WAVE = 11;
export let THEME = {
  floor: 0x3a2360, tileLight: 0x53377f, tileDark: 0x472e6f, path: 0x8f6a3e,
  wall: 0x2a1a46, fog: 0x140a24, arrow: 0xffd9a0, decor: null,
};

// Swap the board. Called by js/maps.js; everything else just reads the exports.
export function setBoard(map) {
  COLS = map.cols;
  ROWS = map.rows;
  PATHS = map.paths;
  SECOND_LANE_WAVE = map.secondLaneWave;
  THEME = map.theme;
}

export const START_LIVES = 9;
export const START_GOLD = 260;

// Killing a main boss (the wave 10 / 20 / 30 / 40 / 50 beats) hands a life back,
// never above START_LIVES. Lives used to be a one-way trip, which meant a single
// bad wave quietly doomed a run that then played on for another half hour.
export const BOSS_LIFE_REWARD = 1;
export const PREP_TIME = 18;      // seconds between waves
export const FIRST_PREP = 26;     // a little longer before wave 1

// --------------------------------------------------------------- towers ---
export const TOWERS = {
  archer: {
    name: 'Archer', icon: '🏹', cost: 70, color: 0x7dd87d, accent: 0x3f7a3f,
    damage: 14, range: 5.6, rate: 1.15, air: true, bullet: 'arrow', speed: 26,
    blurb: 'Reliable single-target shots. Hits air.',
  },
  wizard: {
    name: 'Wizard', icon: '🔮', cost: 115, color: 0x9a7bff, accent: 0x4a26b8,
    damage: 27, range: 5.2, rate: 0.62, air: true, bullet: 'orb', speed: 14, splash: 2.3,
    blurb: 'Arcane orbs that explode on impact. Hits air.',
  },
  frost: {
    name: 'Frost', icon: '❄️', cost: 85, color: 0x8fd8ff, accent: 0x2e7fb8,
    damage: 13, range: 4.8, rate: 1.0, air: true, bullet: 'shard', speed: 20,
    slow: 0.45, slowTime: 2.0,
    blurb: 'Single-target chill that slows one pest. Hits air.',
  },
  ninja: {
    name: 'Ninja', icon: '🥷', cost: 160, color: 0x4a4a63, accent: 0xff5b7f,
    damage: 10, range: 4.2, rate: 3.3, air: false, bullet: 'star', speed: 34, crit: 0.16,
    blurb: 'Blinding fast shuriken, ground only. Crits hurt.',
  },
  sleepy: {
    name: 'Sleepy', icon: '😴', cost: 195, color: 0xb9c6ff, accent: 0x5b53b8,
    damage: 62, range: 6.4, rate: 0.34, air: false, bullet: 'pillow', speed: 11, splash: 3.4, lob: true,
    blurb: 'Yawns, then lobs a pillow. Huge splash, very slow, ground only.',
  },
  witch: {
    name: 'Witch', icon: '🧙', cost: 300, color: 0x8a5bd6, accent: 0x2b1750,
    damage: 0, range: 6.2, rate: 0, air: true, ability: 'curse', cooldown: 34,
    curseRadius: 2.6,
    blurb: 'Hexes everything in reach so it takes more damage, then curses a whole knot of pests at once.',
  },
  ema: {
    name: 'Ema', icon: '🎀', cost: 190, color: 0xffc7e6, accent: 0xff4f9a,
    damage: 0, range: 5.0, rate: 0, air: true, ability: 'aura', support: 'buff',
    blurb: 'Cheers on every cat around her: more damage, faster paws.',
  },
  sofija: {
    name: 'Sofija', icon: '💰', cost: 200, color: 0xffe08a, accent: 0xb8860b,
    damage: 0, range: 4.6, rate: 0, air: true, ability: 'gold', support: 'gold',
    blurb: 'Finds fish on her own, and shakes extra out of pests that fall nearby.',
  },
  simba: {
    name: 'Simba-kun', icon: '🗡️', cost: 250, color: 0xf2b96b, accent: 0x8b1f2e,
    damage: 33, range: 4.2, rate: 1.05, air: false, bullet: 'slash', speed: 40,
    splash: 1.9, crit: 0.18,
    bushido: { cooldown: 14, damage: 2.6, stun: 1.2 },
    blurb: 'Samurai. His katana cleaves everything it touches, and every 14 s he unsheathes it.',
  },
  queen: {
    name: 'Mimi-chan', icon: '👑', cost: 0, color: 0xffd9ef, accent: 0xd41f6b,
    damage: 0, range: 0, rate: 0, air: true, ability: 'bow', cooldown: 10, stun: 1,
    global: true, maxLevel: 1, limit: 1,
    blurb: 'Her Majesty. Every 10 s every pest on the board stops to bow.',
  },
};
// The queen costs ten times the priciest ordinary cat.
TOWERS.queen.cost = 10 * Math.max(...Object.entries(TOWERS)
  .filter(([k]) => k !== 'queen').map(([, t]) => t.cost));

export const TOWER_ORDER = ['archer', 'wizard', 'frost', 'ninja', 'sleepy', 'ema', 'sofija', 'witch', 'simba', 'queen'];

// Support cats, per collar (level 1 / 2 / 3).
//   ema    — how much extra damage / fire rate her ribbon gives nearby cats.
//   sofija — how often she finds a fish, how big it is, and how much more
//            every pest that dies inside her purse is worth.
//   witch  — how much more damage everything caught in her hex field takes.
export const SUPPORT = {
  ema: {
    damage: [0.18, 0.27, 0.38],
    rate: [0.12, 0.19, 0.28],
  },
  sofija: {
    interval: [8, 6.5, 5],
    coin: [12, 19, 28],
    bounty: [0.25, 0.4, 0.6],
  },
  witch: {
    hex: [0.12, 0.18, 0.25],
  },
};

// ------------------------------------------------------------- synergies ---
// Two different cats standing close together egg each other on. Bonuses are
// small on their own but they stack across different pairings, which rewards
// building little squads instead of one long row of archers.
export const SYNERGY_RANGE = 4.6;   // world units — about two tiles
export const SYNERGIES = [
  { id: 'shatter', a: 'frost', b: 'ninja', icon: '🧊', damage: 0.25 },
  { id: 'blizzard', a: 'frost', b: 'wizard', icon: '🌩️', damage: 0.15, rate: 0.15 },
  { id: 'lullaby', a: 'sleepy', b: 'wizard', icon: '💤', damage: 0.2 },
  { id: 'hunt', a: 'archer', b: 'ninja', icon: '🎯', rate: 0.25 },
  { id: 'coven', a: 'witch', b: 'wizard', icon: '🔮', range: 0.2, damage: 0.1 },
  { id: 'charm', a: 'ema', b: 'sofija', icon: '💞', range: 0.25 },
  { id: 'court', a: 'queen', b: 'ema', icon: '👑', rate: 0.2, damage: 0.1 },
  { id: 'dojo', a: 'simba', b: 'ninja', icon: '🎋', damage: 0.2, rate: 0.15 },
  { id: 'honour', a: 'simba', b: 'queen', icon: '🗡️', damage: 0.18 },
  { id: 'kata', a: 'simba', b: 'frost', icon: '🌸', range: 0.2, damage: 0.12 },
];

// ------------------------------------------------ hybrid (branch) upgrades --
// At the last collar a cat can specialise once, permanently, down one of two
// paths. Every value is a multiplier on the level-3 stats.
//
// A multiplier can only scale something a cat already has: 0 × anything is
// still 0. Paths that hand a cat a brand new trick therefore list it under
// `grants` as an absolute value (Hailstorm's splash, Dreamer's slow) and under
// `air` when the trick is simply "can now shoot upwards".
export const BRANCHES = {
  archer: {
    // A sniper aims for the gaps in the armour, so her arrows ignore it
    // completely. Archer has no base pierce, so it has to be granted.
    sniper: { icon: '🎯', damage: 1.75, range: 1.5, rate: 0.6, grants: { pierce: 1 } },
    ranger: { icon: '🏹', damage: 0.85, rate: 1.8, range: 0.92 },
  },
  wizard: {
    inferno: { icon: '🔥', damage: 1.55, rate: 0.9, splash: 1.15 },
    nova: { icon: '💫', damage: 0.85, splash: 1.85, rate: 1.15 },
  },
  frost: {
    glacier: { icon: '🧊', slow: 1.45, slowTime: 1.6, damage: 1.1, rate: 0.85 },
    hail: { icon: '🌨️', damage: 1.5, slowTime: 0.7, grants: { splash: 2.2 } },
  },
  ninja: {
    assassin: { icon: '🗡️', crit: 2.2, damage: 1.35, rate: 0.85 },
    shadow: { icon: '🌫️', rate: 1.45, range: 1.35, air: true },
  },
  sleepy: {
    dreamer: { icon: '🌙', splash: 1.6, damage: 0.9, grants: { slow: 0.45, slowTime: 2.4 } },
    boulder: { icon: '🪨', damage: 1.85, rate: 0.75, range: 1.12 },
  },
  ema: {
    anthem: { icon: '📣', range: 1.75 },
    duet: { icon: '🎶', buff: 1.55 },
  },
  sofija: {
    banker: { icon: '🏦', coin: 1.7, interval: 0.85 },
    pirate: { icon: '🏴‍☠️', bounty: 1.9, range: 1.2 },
  },
  simba: {
    ronin: { icon: '🌪️', damage: 1.55, range: 1.25, rate: 0.85, bushidoDamage: 1.3 },
    // The sensei's slash leaves the blade as an arc of moonlight, so it finally
    // reaches the sky — softer strokes are the price of that reach.
    sensei: {
      icon: '🎋', rate: 1.35, splash: 1.5, damage: 0.72, bushidoCooldown: 0.6, air: true,
    },
  },
  witch: {
    // The crowd path: she curses far more often, and over a much wider knot.
    hex: { icon: '🪄', cooldown: 0.55, curseRadius: 1.6 },
    // The boss path: she reaches further and her hex field bites much harder.
    doom: { icon: '💀', range: 1.6, cooldown: 0.85, hex: 1.5 },
  },
};

// Specialising costs a little more than a normal collar — it is the last thing
// you will ever buy for that cat.
export function branchCost(kind) {
  return Math.round(TOWERS[kind].cost * 1.9);
}

export const MAX_LEVEL = 3;
export function maxLevel(kind) { return TOWERS[kind].maxLevel || MAX_LEVEL; }
export function upgradeCost(kind, level) {
  return Math.round(TOWERS[kind].cost * (0.75 + 0.45 * level));
}
// Multipliers applied at level 1 / 2 / 3, then the chosen hybrid path on top.
export function towerStats(kind, level, branch = null) {
  const b = TOWERS[kind];
  const l = level - 1;
  const st = {
    ...b,
    damage: b.damage * (1 + 0.62 * l),
    range: b.range * (1 + 0.13 * l),
    rate: b.rate * (1 + 0.18 * l),
    splash: b.splash ? b.splash * (1 + 0.12 * l) : 0,
    slowTime: b.slowTime ? b.slowTime * (1 + 0.2 * l) : 0,
    pierce: b.pierce || 0,
    curseRadius: b.curseRadius ? b.curseRadius * (1 + 0.15 * l) : 0,
    branch: null,
  };
  // Simba-kun's unsheathing strike hits harder with every collar.
  if (b.bushido) {
    st.bushido = {
      ...b.bushido,
      damage: b.bushido.damage * (1 + 0.25 * l),
      stun: b.bushido.stun * (1 + 0.15 * l),
    };
  }
  const mods = branch && BRANCHES[kind] && BRANCHES[kind][branch];
  if (!mods) return st;
  st.branch = branch;
  // A path can hand a cat something it never had — that is an absolute value,
  // and it lands before the multipliers so a path can grant *and* scale.
  for (const [key, value] of Object.entries(mods.grants || {})) {
    if (!st[key]) st[key] = value;
  }
  if (mods.air) st.air = true;
  for (const key of ['damage', 'range', 'rate', 'splash', 'slowTime', 'crit', 'cooldown', 'pierce', 'curseRadius']) {
    if (mods[key] != null) st[key] = (st[key] || 0) * mods[key];
  }
  // Armour piercing is a fraction: none of it, all of it, or somewhere between.
  st.pierce = Math.min(1, Math.max(0, st.pierce || 0));
  // Frost's glacier path deepens a chill it already has.
  if (mods.slow != null) st.slow = (st.slow || 0) * mods.slow;
  // A slow with no duration would never wear off, so it is not a slow at all.
  if (!st.slowTime) st.slow = 0;
  if (st.slow) st.slow = Math.min(0.8, st.slow);
  if (st.bushido) {
    st.bushido = {
      ...st.bushido,
      cooldown: st.bushido.cooldown * (mods.bushidoCooldown || 1),
      damage: st.bushido.damage * (mods.bushidoDamage || 1),
    };
  }
  return st;
}

// The witch's curse gets nastier with every collar she earns.
export const CURSES = {
  1: { id: 'frog', label: 'Frog', icon: '🐸', text: 'turns a pest into a harmless frog' },
  2: { id: 'stone', label: 'Stone', icon: '🗿', text: 'petrifies a pest for 10 s' },
  3: { id: 'doom', label: 'Doom', icon: '💀', text: 'destroys a pest instantly' },
};
export const STONE_TIME = 10;

// Bosses shrug off every curse, but they do not shrug off the witch herself:
// a cast that finds nothing to hex instead brands the scariest thing in reach.
// A branded pest takes even more damage than her passive field gives, and
// stumbles while the mark burns.
export const HEX = {
  markTime: 8,      // seconds a boss carries the brand
  markBonus: 0.35,  // extra damage taken on top of the field, while marked
  markSlow: 0.3,    // and it trips over its own feet a little
};

// -------------------------------------------------------------- enemies ---
export const ENEMIES = {
  frog: { name: 'Frog', hp: 34, speed: 3.0, bounty: 8, scale: 1.25, flying: false, leak: 1, cursed: true },
  mouse: { name: 'Mouse', hp: 34, speed: 3.0, bounty: 8, scale: 1.25, flying: false, leak: 1 },
  snake: { name: 'Snake', hp: 30, speed: 4.8, bounty: 11, scale: 1.25, flying: false, leak: 1 },
  dog: { name: 'Dog', hp: 120, speed: 2.1, bounty: 20, scale: 1.3, flying: false, armor: 4, leak: 2 },
  bird: { name: 'Bird', hp: 46, speed: 4.2, bounty: 14, scale: 1.25, flying: true, leak: 1 },
  golden: { name: 'Golden Mouse', hp: 40, speed: 6.4, bounty: 90, scale: 1.2, flying: false, leak: 0, golden: true },
  baron: {
    name: 'Sir Barksalot', hp: 1200, speed: 1.7, bounty: 220, scale: 2.8, flying: false,
    armor: 8, leak: 3, boss: 'mini', base: 'dog', howl: true,
  },
  ratking: {
    name: 'The Rat King', hp: 6000, speed: 1.5, bounty: 600, scale: 3.6, flying: false,
    armor: 10, leak: 9, boss: 'main', base: 'mouse', spawner: true, enrage: true,
  },

  // ------------------------------------------------- the barnyard (wave 11+)
  pig: {
    name: 'Flying Pig', hp: 320, speed: 2.2, bounty: 48, scale: 1.4, flying: true, leak: 1, armor: 3,
  },
  turtle: {
    name: 'Turtle', hp: 460, speed: 1.15, bounty: 34, scale: 1.3, flying: false, armor: 16, leak: 2,
  },
  horse: {
    name: 'Horse', hp: 150, speed: 5.6, bounty: 30, scale: 1.45, flying: false, armor: 5, leak: 1,
  },
  chicken: {
    name: 'Chicken', hp: 80, speed: 5.2, bounty: 12, scale: 1.15, flying: false, leak: 1, lays: true,
  },
  chick: {
    name: 'Chick', hp: 26, speed: 4.6, bounty: 4, scale: 0.8, flying: false, leak: 1, base: 'chicken',
  },
  monkey: {
    name: 'Monkey', hp: 170, speed: 3.4, bounty: 24, scale: 1.25, flying: false, armor: 3, leak: 2,
    banana: 6.5,
  },
  monkeyking: {
    name: 'Baron Bananas', hp: 5200, speed: 2.2, bounty: 520, scale: 3.0, flying: false,
    armor: 12, leak: 4, boss: 'mini', base: 'monkey', banana: 4.0, bananaVolley: 3,
  },
  // ------------------------------------------- counterplay pests (wave 11+)
  nurse: {
    name: 'Nurse Hazel', hp: 150, speed: 3.2, bounty: 26, scale: 1.3, flying: false, leak: 1,
    base: 'mouse', heals: { radius: 5.2, amount: 30, interval: 3.4 },
  },
  beetle: {
    name: 'Shield Beetle', hp: 190, speed: 2.5, bounty: 30, scale: 1.35, flying: false, leak: 2,
    armor: 4, shield: 260, shieldRegen: 45, shieldDelay: 4,
  },
  mole: {
    name: 'Mole', hp: 200, speed: 3.1, bounty: 28, scale: 1.3, flying: false, leak: 1,
    burrow: { interval: 3.6, duration: 2.2, speed: 2.1 },
  },
  dragon: {
    name: 'Sophie', hp: 24000, speed: 0.6, bounty: 2000, scale: 4.4, flying: true,
    armor: 18, leak: 9, boss: 'main', dragon: true,
  },

  // ------------------------------------------------ the last ten waves (21+)
  emilija: {
    name: 'Emilija', hp: 52000, speed: 0.55, bounty: 3200, scale: 4.0, flying: true,
    armor: 22, leak: 9, boss: 'main', butterfly: true,
  },
  flutterling: {
    name: 'Flutterling', hp: 620, speed: 3.4, bounty: 42, scale: 1.3, flying: true, leak: 1,
    base: 'emilija', armor: 4,
  },

  // ------------------------------------------------- the family (waves 31+)
  gymrat: {
    name: 'Gym Rat', hp: 900, speed: 3.6, bounty: 46, scale: 1.5, flying: false, leak: 2,
    base: 'mouse', armor: 10,
  },
  granny: {
    name: 'Grandma Vera', hp: 14000, speed: 1.9, bounty: 900, scale: 2.6, flying: false,
    armor: 14, leak: 4, boss: 'mini', base: 'mouse', knits: true,
    banana: 5.0, bananaVolley: 2,
    heals: { radius: 6.4, amount: 260, interval: 3.6 },
  },
  simona: {
    name: 'Simona the Gymnast', hp: 96000, speed: 2.0, bounty: 4200, scale: 1.7, flying: false,
    armor: 20, leak: 9, boss: 'main', gymnast: true, successor: 'stefo',
  },
  simonaclone: {
    name: 'Simona (clone)', hp: 40000, speed: 2.2, bounty: 320, scale: 1.35, flying: false,
    armor: 12, leak: 3, base: 'simona', gymnast: true, clone: true,
  },
  stefo: {
    name: 'Stefo the Baller', hp: 120000, speed: 2.0, bounty: 6000, scale: 1.8, flying: false,
    armor: 24, leak: 9, boss: 'main', baller: true, stationary: true,
  },
  father: {
    name: 'Father', hp: 260000, speed: 1.1, bounty: 12000, scale: 2.4, flying: false,
    armor: 30, leak: 9, boss: 'main', father: true,
  },
};

// How long a cat is knocked out by a banana to the head.
export const BANANA_STUN = 3;

// Sophie's script. She is the only enemy that fights back against the cats.
export const DRAGON = {
  intro: 5.2,          // seconds of cinematic entrance
  smashEvery: 10,      // destroys one random cat this often
  swarmEvery: 20,      // summons a pile of critters this often
  swarm: ['chick', 'chick', 'chicken', 'mouse', 'mouse', 'snake'],
  // Old friends return as her health drops.
  summons: [
    { at: 0.75, kind: 'baron' },
    { at: 0.50, kind: 'ratking' },
    { at: 0.25, kind: 'monkeyking' },
  ],
  summonHp: 0.45,      // summoned bosses come back at 45% of their usual health
};

// Emilija's script. She never touches the cats directly — she rearranges the
// board underneath them, which is far ruder. Every ABILITY seconds she picks
// one of three tricks at random (never the same one twice in a row).
export const EMILIJA = {
  intro: 5.2,          // seconds of cinematic entrance
  ability: 13,         // seconds between tricks
  firstAbility: 6,     // grace period after she lands
  sleepFraction: 1 / 3, // how much of your army naps until the next trick
  spawnCount: 3,       // smaller butterflies per summon
  spawn: 'flutterling',
  tricks: ['shuffle', 'sleep', 'spawn'],
};

// Simona's script. She cartwheels down the lane, copies herself, and stands on
// her hands whenever the cats start to win. Every clone plays by the same rules
// — including making clones of its own, up to `maxClones` at a time.
export const SIMONA = {
  intro: 4.6,            // seconds of cinematic entrance
  clone: 'simonaclone',
  cloneEvery: 14,        // C: seconds between copies
  cloneHp: 0.55,         // a copy is a little smaller than the original…
  maxClones: 4,          // …and there are never more than this many at once
  starEvery: 9,          // seconds between cartwheels
  starTiles: 3,          // Y: tiles she flips forward
  handstandEvery: 12,    // seconds between handstands
  handstandTime: 3.2,    // how long she stands there
  handstandResist: 0.9,  // 90% less damage while upside down
};

// Stefo's script. He never walks: he teleports around the kitchen and lobs
// three-pointers at the milk bowl, and every basket costs a life.
export const STEFO = {
  intro: 3.4,
  teleportEvery: 6.5,    // seconds between teleports
  shootEvery: 4.5,       // seconds between shots
  shotSpeed: 13,         // world units per second
  livesPerBasket: 1,     // lives lost per basket scored
};

// Father's script. He arrives by flattening half of your army and refuses to
// die the first time you drop him.
export const FATHER = {
  intro: 5.6,
  destroyOnArrival: 0.5, // half of every cat on the board, gone
  revives: 1,            // "I AM THE BOSS", exactly once
  reviveExtra: 0.5,      // and he takes 50% more cats with him when he does
  stompEvery: 12,        // he keeps swatting a cat now and then
};

// HP grows with the wave so late basic pests stay relevant.
export function hpScale(wave) {
  // Waves 1-10 keep the original ramp; the barnyard waves bring their own bulk,
  // so the multiplier grows more gently after the second door opens. From wave
  // 31 the family arrives and the ramp steepens again.
  if (wave <= 10) return 1 + 0.17 * (wave - 1);
  if (wave <= 30) return 1 + 0.17 * 9 + 0.09 * (wave - 10);
  return 1 + 0.17 * 9 + 0.09 * 20 + 0.14 * (wave - 30);
}

// ---------------------------------------------------------------- waves ---
// groups: [kind, count, gap seconds, delay before group starts, lane]
// lane defaults to 0 (the mouse hole); lane 1 is the top-right portal and is
// only used from wave SECOND_LANE_WAVE onwards.
export const WAVES = [
  { name: 'Squeaky Beginnings', groups: [['mouse', 8, 0.9, 0]] },
  { name: 'Snakes in the Pantry', groups: [['mouse', 8, 0.8, 0], ['snake', 4, 1.0, 3]] },
  { name: 'Bad Dog', groups: [['mouse', 10, 0.6, 0], ['dog', 3, 1.6, 4]] },
  { name: 'First Flight', groups: [['bird', 4, 1.0, 0], ['mouse', 10, 0.5, 2], ['snake', 6, 0.7, 5]] },
  { name: 'MINI BOSS: Sir Barksalot', groups: [['baron', 1, 1, 0], ['mouse', 10, 0.5, 3], ['snake', 5, 0.8, 6], ['bird', 4, 1.0, 5]] },
  { name: 'The Kennel Opens', groups: [['dog', 6, 1.1, 0], ['snake', 10, 0.5, 2], ['bird', 6, 0.9, 6]] },
  { name: 'Feathers and Fangs', groups: [['bird', 7, 0.6, 0], ['snake', 12, 0.45, 3], ['dog', 5, 1.3, 7]] },
  { name: 'Stampede', groups: [['mouse', 26, 0.28, 0], ['dog', 7, 1.0, 4], ['bird', 8, 0.7, 9]] },
  { name: 'Everything At Once', groups: [['dog', 10, 0.8, 0], ['bird', 14, 0.5, 2], ['snake', 18, 0.35, 4], ['mouse', 20, 0.3, 8]] },
  {
    name: 'FINAL BOSS: The Rat King',
    groups: [['ratking', 1, 1, 0], ['dog', 8, 1.1, 6], ['bird', 10, 0.7, 10], ['snake', 14, 0.5, 14]],
  },

  // ------------------------------------------------ the second portal opens
  {
    name: 'The Second Door',
    groups: [
      ['chicken', 10, 0.7, 0, 1], ['pig', 3, 1.3, 3, 1],
      ['mouse', 18, 0.4, 2], ['snake', 14, 0.5, 6],
    ],
  },
  {
    name: 'Shell Wall',
    groups: [
      ['turtle', 6, 1.6, 0, 1], ['turtle', 4, 1.8, 4],
      ['beetle', 4, 1.5, 3], ['bird', 16, 0.6, 6], ['chicken', 8, 0.6, 9, 1], ['pig', 3, 1.4, 8, 1],
    ],
  },
  {
    name: 'Hoofbeats',
    groups: [
      ['horse', 8, 1.0, 0, 1], ['horse', 6, 1.2, 4],
      ['mole', 5, 1.3, 2], ['dog', 8, 0.9, 7], ['pig', 6, 1.1, 10, 1],
    ],
  },
  {
    name: 'Monkey Business',
    groups: [
      ['monkey', 7, 1.2, 0, 1], ['monkey', 5, 1.4, 4],
      ['nurse', 4, 1.6, 3], ['chicken', 10, 0.5, 6, 1], ['turtle', 5, 1.7, 9], ['pig', 5, 1.2, 7, 1],
    ],
  },
  {
    name: 'MINI BOSS: Baron Bananas',
    groups: [
      ['monkeyking', 1, 1, 0, 1], ['nurse', 3, 2.0, 4], ['monkey', 8, 1.1, 6],
      ['chicken', 12, 0.5, 9, 1], ['horse', 6, 1.2, 13], ['pig', 4, 1.3, 8, 1],
    ],
  },
  {
    name: 'Barnyard Riot',
    groups: [
      ['chicken', 16, 0.4, 0, 1], ['horse', 8, 1.0, 3], ['mole', 6, 1.2, 5],
      ['pig', 6, 1.0, 6, 1], ['monkey', 8, 1.1, 10], ['nurse', 3, 1.8, 12],
    ],
  },
  {
    name: 'Armoured Parade',
    groups: [
      ['turtle', 10, 1.2, 0], ['turtle', 8, 1.3, 2, 1], ['beetle', 8, 1.1, 4],
      ['dog', 10, 0.8, 6, 1], ['horse', 10, 0.9, 9], ['nurse', 4, 1.6, 11], ['pig', 12, 0.8, 5, 1],
    ],
  },
  {
    name: 'Sky Bacon',
    groups: [
      ['pig', 8, 0.9, 0, 1], ['bird', 10, 0.45, 2], ['mole', 8, 1.0, 5],
      ['monkey', 8, 1.0, 8, 1], ['chicken', 14, 0.4, 11], ['beetle', 6, 1.3, 13],
    ],
  },
  {
    name: 'Everything, Twice',
    groups: [
      ['horse', 12, 0.8, 0, 1], ['turtle', 8, 1.2, 2],
      ['pig', 8, 0.9, 5, 1], ['monkey', 10, 0.9, 8],
      ['chicken', 16, 0.35, 11, 1], ['dog', 12, 0.7, 13],
      ['nurse', 5, 1.4, 9], ['beetle', 6, 1.2, 15], ['mole', 8, 1.0, 17],
    ],
  },
  {
    name: 'FINAL BOSS: Sophie the Dragon',
    groups: [
      ['dragon', 1, 1, 0], ['chicken', 14, 0.5, 14, 1], ['horse', 10, 0.9, 20],
      ['pig', 8, 1.0, 26, 1], ['turtle', 8, 1.2, 32], ['monkey', 10, 1.0, 38, 1],
      ['nurse', 6, 1.3, 30], ['beetle', 8, 1.1, 35], ['mole', 10, 0.9, 42],
    ],
  },

  // ---------------------------------------------- the last ten waves (21-30)
  {
    name: 'After the Ashes',
    groups: [
      ['mouse', 30, 0.25, 0], ['snake', 20, 0.35, 3, 1], ['dog', 12, 0.7, 6],
      ['bird', 20, 0.5, 9, 1], ['chicken', 14, 0.4, 12], ['pig', 4, 1.2, 14, 1],
    ],
  },
  {
    name: 'Iron Hooves',
    groups: [
      ['horse', 16, 0.7, 0, 1], ['horse', 12, 0.8, 3], ['turtle', 10, 1.1, 5],
      ['beetle', 8, 1.0, 8, 1], ['nurse', 6, 1.4, 11], ['pig', 10, 0.9, 6, 1],
    ],
  },
  {
    name: 'The Nursery',
    groups: [
      ['nurse', 10, 1.1, 0], ['nurse', 8, 1.2, 4, 1], ['beetle', 10, 1.0, 3],
      ['mole', 12, 0.8, 7, 1], ['monkey', 12, 0.8, 10], ['chicken', 16, 0.35, 13, 1], ['pig', 9, 1.0, 8, 1],
    ],
  },
  {
    name: 'Sky Full of Trouble',
    groups: [
      ['bird', 16, 0.35, 0], ['pig', 9, 0.7, 2, 1], ['bird', 12, 0.4, 6, 1],
      ['pig', 6, 0.8, 9], ['monkey', 20, 0.8, 12], ['horse', 22, 0.8, 15, 1], ['turtle', 8, 1.0, 8],
    ],
  },
  {
    name: 'MINI BOSSES: The Terrible Two',
    groups: [
      ['baron', 1, 1, 0], ['monkeyking', 1, 1, 3, 1],
      ['dog', 14, 0.6, 6], ['monkey', 12, 0.8, 8, 1], ['nurse', 6, 1.3, 10],
      ['horse', 12, 0.8, 13], ['chicken', 16, 0.35, 16, 1], ['pig', 7, 1.0, 11, 1],
    ],
  },
  {
    name: 'Shell Shock',
    groups: [
      ['turtle', 16, 0.9, 0], ['turtle', 12, 1.0, 3, 1], ['beetle', 14, 0.9, 5],
      ['mole', 12, 0.8, 8, 1], ['dog', 14, 0.6, 12], ['nurse', 8, 1.2, 14, 1], ['pig', 18, 0.6, 6, 1],
    ],
  },
  {
    name: 'First Flutter',
    groups: [
      ['flutterling', 4, 1.1, 0], ['flutterling', 3, 1.2, 5, 1],
      ['bird', 8, 0.4, 3], ['pig', 4, 0.8, 7, 1], ['horse', 20, 0.7, 10],
      ['monkey', 18, 0.8, 13, 1], ['beetle', 16, 1.0, 16],
    ],
  },
  {
    name: 'Barnyard Apocalypse',
    groups: [
      ['chicken', 24, 0.3, 0, 1], ['horse', 16, 0.6, 2], ['pig', 14, 0.7, 5, 1],
      ['monkey', 14, 0.7, 8], ['turtle', 12, 1.0, 11, 1], ['mole', 14, 0.7, 13],
      ['nurse', 8, 1.2, 15, 1], ['beetle', 12, 0.9, 17],
    ],
  },
  {
    name: 'The Calm Before Wings',
    groups: [
      ['flutterling', 6, 0.9, 0, 1], ['flutterling', 5, 1.0, 6],
      ['snake', 26, 0.3, 3], ['dog', 16, 0.6, 7, 1], ['bird', 14, 0.35, 10],
      ['horse', 18, 0.7, 13, 1], ['turtle', 16, 1.0, 16], ['nurse', 8, 1.2, 18, 1],
    ],
  },
  {
    name: 'FINAL BOSS: Emilija the Butterfly',
    groups: [
      ['emilija', 1, 1, 0],
      ['flutterling', 10, 0.8, 16, 1], ['bird', 20, 0.4, 22],
      ['horse', 14, 0.7, 28, 1], ['turtle', 12, 1.0, 34], ['beetle', 12, 0.9, 40, 1],
      ['nurse', 8, 1.2, 30], ['monkey', 14, 0.7, 38], ['mole', 14, 0.7, 46, 1],
    ],
  },

  // ------------------------------------------------ the family (waves 31-40)
  {
    name: 'Training Day',
    groups: [
      ['gymrat', 10, 0.7, 0], ['gymrat', 8, 0.8, 4, 1], ['horse', 14, 0.7, 3],
      ['bird', 20, 0.4, 7, 1], ['beetle', 10, 1.0, 10], ['pig', 14, 0.7, 6, 1],
    ],
  },
  {
    name: 'The Gym Opens',
    groups: [
      ['gymrat', 16, 0.5, 0, 1], ['turtle', 14, 0.9, 2], ['monkey', 14, 0.7, 5, 1],
      ['nurse', 8, 1.2, 8], ['mole', 14, 0.7, 11, 1], ['pig', 20, 0.6, 6, 1],
    ],
  },
  {
    name: 'Wool and Fangs',
    groups: [
      ['dog', 20, 0.5, 0], ['gymrat', 12, 0.6, 3, 1], ['flutterling', 4, 0.9, 6],
      ['pig', 8, 0.7, 9, 1], ['chicken', 22, 0.3, 12],
    ],
  },
  {
    name: 'Chalk Dust',
    groups: [
      ['horse', 18, 0.6, 0, 1], ['gymrat', 14, 0.6, 2], ['beetle', 14, 0.9, 5, 1],
      ['nurse', 10, 1.1, 8], ['bird', 24, 0.35, 11, 1], ['turtle', 12, 1.0, 14], ['pig', 18, 0.6, 7, 1],
    ],
  },
  {
    name: 'MINI BOSS: Grandma Vera',
    groups: [
      ['granny', 1, 1, 0], ['gymrat', 14, 0.6, 4, 1], ['nurse', 8, 1.2, 6],
      ['dog', 16, 0.6, 9, 1], ['monkey', 12, 0.8, 12], ['chicken', 20, 0.35, 15, 1], ['pig', 14, 0.7, 10, 1],
    ],
  },
  {
    name: 'Knitting Circle',
    groups: [
      ['nurse', 12, 1.0, 0], ['gymrat', 16, 0.5, 3, 1], ['beetle', 14, 0.9, 6],
      ['mole', 16, 0.6, 9, 1], ['turtle', 14, 0.9, 12], ['flutterling', 10, 0.9, 15, 1],
    ],
  },
  {
    name: 'Sprint Drills',
    groups: [
      ['horse', 22, 0.5, 0], ['snake', 30, 0.25, 2, 1], ['gymrat', 18, 0.45, 5],
      ['chicken', 24, 0.3, 8, 1], ['monkey', 14, 0.7, 12], ['pig', 10, 0.8, 7, 1], ['flutterling', 5, 1.1, 12, 1],
    ],
  },
  {
    name: 'Feathers in the Rafters',
    groups: [
      ['bird', 20, 0.3, 0, 1], ['pig', 10, 0.6, 3], ['flutterling', 8, 0.7, 6, 1],
      ['gymrat', 16, 0.5, 9], ['nurse', 10, 1.1, 12, 1], ['beetle', 14, 0.9, 15],
    ],
  },
  {
    name: 'The Bench Press',
    groups: [
      ['turtle', 20, 0.8, 0], ['beetle', 18, 0.8, 3, 1], ['gymrat', 20, 0.45, 6],
      ['dog', 20, 0.5, 9, 1], ['horse', 18, 0.6, 12], ['nurse', 10, 1.1, 15, 1], ['pig', 14, 0.7, 7, 1], ['flutterling', 7, 1.0, 14],
    ],
  },
  {
    name: 'FINAL BOSS: Simona the Gymnast',
    groups: [
      ['simona', 1, 1, 0],
      ['gymrat', 16, 0.5, 16, 1], ['horse', 16, 0.6, 22], ['flutterling', 12, 0.8, 28, 1],
      ['nurse', 10, 1.1, 26], ['beetle', 14, 0.9, 34], ['turtle', 14, 0.9, 40, 1],
      ['bird', 24, 0.35, 46], ['monkey', 14, 0.7, 52, 1],
    ],
  },

  // -------------------------------------------- the last ten waves (41-50)
  {
    name: 'Overtime',
    groups: [
      ['gymrat', 22, 0.4, 0], ['horse', 20, 0.5, 3, 1], ['dog', 22, 0.45, 6],
      ['bird', 26, 0.3, 9, 1], ['chicken', 26, 0.3, 12], ['nurse', 10, 1.1, 15, 1], ['pig', 20, 0.55, 8, 1],
    ],
  },
  {
    name: 'Full-Court Press',
    groups: [
      ['beetle', 20, 0.8, 0, 1], ['turtle', 18, 0.8, 3], ['gymrat', 20, 0.45, 6, 1],
      ['mole', 18, 0.6, 9], ['monkey', 16, 0.6, 12, 1], ['pig', 16, 0.6, 15], ['flutterling', 6, 1.0, 10],
    ],
  },
  {
    name: 'Family Reunion',
    groups: [
      ['flutterling', 16, 0.7, 0], ['gymrat', 20, 0.45, 3, 1], ['horse', 20, 0.5, 6],
      ['nurse', 12, 1.0, 9, 1], ['dog', 22, 0.45, 12], ['bird', 28, 0.3, 15, 1],
    ],
  },
  {
    name: 'The Long Bench',
    groups: [
      ['turtle', 22, 0.7, 0, 1], ['beetle', 20, 0.8, 3], ['gymrat', 22, 0.4, 6, 1],
      ['monkey', 18, 0.6, 9], ['mole', 20, 0.55, 12, 1], ['nurse', 12, 1.0, 15], ['pig', 16, 0.6, 6, 1], ['flutterling', 9, 0.9, 14],
    ],
  },
  {
    name: 'MINI BOSSES: The Family Gathers',
    groups: [
      ['granny', 1, 1, 0], ['baron', 1, 1, 4, 1], ['monkeyking', 1, 1, 8],
      ['gymrat', 20, 0.45, 6, 1], ['horse', 18, 0.6, 10], ['nurse', 12, 1.0, 13, 1],
      ['beetle', 16, 0.8, 16], ['chicken', 24, 0.3, 19, 1], ['pig', 12, 0.7, 12], ['flutterling', 6, 1.0, 20, 1],
    ],
  },
  {
    name: 'House Rules',
    groups: [
      ['gymrat', 24, 0.4, 0], ['dog', 24, 0.4, 3, 1], ['flutterling', 16, 0.7, 6],
      ['pig', 20, 0.55, 9, 1], ['turtle', 18, 0.8, 12], ['nurse', 12, 1.0, 15, 1],
    ],
  },
  {
    name: 'Whistle Drill',
    groups: [
      ['horse', 24, 0.45, 0, 1], ['snake', 34, 0.22, 3], ['gymrat', 24, 0.4, 6, 1],
      ['chicken', 28, 0.28, 9], ['bird', 30, 0.28, 12, 1], ['monkey', 18, 0.6, 15], ['pig', 22, 0.5, 8, 1],
    ],
  },
  {
    name: 'The Last Barnyard',
    groups: [
      ['chicken', 30, 0.25, 0, 1], ['pig', 20, 0.55, 3], ['monkey', 20, 0.55, 6, 1],
      ['turtle', 20, 0.8, 9], ['mole', 20, 0.55, 12, 1], ['beetle', 20, 0.8, 15],
      ['gymrat', 24, 0.4, 18, 1], ['flutterling', 8, 0.9, 12],
    ],
  },
  {
    name: 'Silence Before Father',
    groups: [
      ['flutterling', 20, 0.6, 0, 1], ['gymrat', 26, 0.35, 3], ['horse', 22, 0.5, 6, 1],
      ['dog', 24, 0.4, 9], ['nurse', 14, 0.9, 12, 1], ['beetle', 20, 0.8, 15],
      ['turtle', 20, 0.8, 18, 1], ['bird', 30, 0.28, 21],
    ],
  },
  {
    name: 'FINAL BOSS: Father',
    groups: [
      ['father', 1, 1, 0],
      ['gymrat', 20, 0.45, 18, 1], ['horse', 20, 0.5, 24], ['beetle', 18, 0.8, 30, 1],
      ['nurse', 14, 0.9, 28], ['turtle', 18, 0.8, 36], ['flutterling', 16, 0.7, 42, 1],
      ['monkey', 18, 0.6, 48], ['chicken', 26, 0.3, 54, 1], ['dog', 22, 0.45, 60],
    ],
  },
];

// ---------------------------------------------------------------- economy ---
// Every pest is worth a little more on later waves, but only a little: the
// board holds ~100 cats and there is nothing else to spend fish on, so a steep
// ramp just buries the player in gold they can never use. Late waves already
// pay more simply by sending far more pests.
export const BOUNTY_WAVE = 0.012;
export function bountyScale(wave) { return 1 + BOUNTY_WAVE * wave; }

// The wave-clear bonus climbs until the board can be filled, then holds. Past
// wave 25 the bonus is rounding error next to the bounties anyway.
export const BONUS_CAP_WAVE = 25;
export function waveBonus(wave) { return 45 + Math.min(wave, BONUS_CAP_WAVE) * 18; }
