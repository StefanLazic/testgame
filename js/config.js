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
export const PREP_TIME = 18;      // seconds between waves
export const FIRST_PREP = 26;     // a little longer before wave 1

// --------------------------------------------------------------- towers ---
export const TOWERS = {
  archer: {
    name: 'Archer', icon: '🏹', cost: 70, color: 0x7dd87d, accent: 0x3f7a3f,
    damage: 13, range: 6.4, rate: 1.15, air: true, bullet: 'arrow', speed: 26,
    blurb: 'Reliable single-target shots. Hits air.',
  },
  wizard: {
    name: 'Wizard', icon: '🔮', cost: 120, color: 0x9a7bff, accent: 0x4a26b8,
    damage: 24, range: 6.0, rate: 0.62, air: true, bullet: 'orb', speed: 14, splash: 2.3,
    blurb: 'Arcane orbs that explode on impact. Hits air.',
  },
  frost: {
    name: 'Frost', icon: '❄️', cost: 95, color: 0x8fd8ff, accent: 0x2e7fb8,
    damage: 9, range: 5.4, rate: 1.0, air: true, bullet: 'shard', speed: 20,
    slow: 0.45, slowTime: 2.0,
    blurb: 'Single-target chill that slows one pest. Hits air.',
  },
  ninja: {
    name: 'Ninja', icon: '🥷', cost: 150, color: 0x4a4a63, accent: 0xff5b7f,
    damage: 10, range: 4.4, rate: 3.6, air: false, bullet: 'star', speed: 34, crit: 0.22,
    blurb: 'Blinding fast shuriken, ground only. Crits hurt.',
  },
  sleepy: {
    name: 'Sleepy', icon: '😴', cost: 210, color: 0xb9c6ff, accent: 0x5b53b8,
    damage: 58, range: 7.2, rate: 0.34, air: false, bullet: 'pillow', speed: 11, splash: 3.4, lob: true,
    blurb: 'Yawns, then lobs a pillow. Huge splash, very slow, ground only.',
  },
  witch: {
    name: 'Witch', icon: '🧙', cost: 300, color: 0x8a5bd6, accent: 0x2b1750,
    damage: 0, range: 7.0, rate: 0, air: true, ability: 'curse', cooldown: 60,
    blurb: 'Curses one pest every 60 s. Bosses are immune.',
  },
  queen: {
    name: 'Mimi-chan', icon: '👑', cost: 0, color: 0xffd9ef, accent: 0xd41f6b,
    damage: 0, range: 0, rate: 0, air: true, ability: 'bow', cooldown: 10, stun: 1,
    global: true, maxLevel: 1,
    blurb: 'Her Majesty. Every 10 s every pest on the board stops to bow.',
  },
};
// The queen costs ten times the priciest ordinary cat.
TOWERS.queen.cost = 10 * Math.max(...Object.entries(TOWERS)
  .filter(([k]) => k !== 'queen').map(([, t]) => t.cost));

export const TOWER_ORDER = ['archer', 'wizard', 'frost', 'ninja', 'sleepy', 'witch', 'queen'];

export const MAX_LEVEL = 3;
export function maxLevel(kind) { return TOWERS[kind].maxLevel || MAX_LEVEL; }
export function upgradeCost(kind, level) {
  return Math.round(TOWERS[kind].cost * (0.75 + 0.45 * level));
}
// Multipliers applied at level 1 / 2 / 3.
export function towerStats(kind, level) {
  const b = TOWERS[kind];
  const l = level - 1;
  return {
    ...b,
    damage: b.damage * (1 + 0.62 * l),
    range: b.range * (1 + 0.13 * l),
    rate: b.rate * (1 + 0.18 * l),
    splash: b.splash ? b.splash * (1 + 0.12 * l) : 0,
    slowTime: b.slowTime ? b.slowTime * (1 + 0.2 * l) : 0,
  };
}

// The witch's curse gets nastier with every collar she earns.
export const CURSES = {
  1: { id: 'frog', label: 'Frog', icon: '🐸', text: 'turns a pest into a harmless frog' },
  2: { id: 'stone', label: 'Stone', icon: '🗿', text: 'petrifies a pest for 10 s' },
  3: { id: 'doom', label: 'Doom', icon: '💀', text: 'destroys a pest instantly' },
};
export const STONE_TIME = 10;

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
    name: 'Flying Pig', hp: 110, speed: 2.4, bounty: 26, scale: 1.4, flying: true, leak: 1,
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
  dragon: {
    name: 'Sophie', hp: 24000, speed: 0.6, bounty: 2000, scale: 4.4, flying: true,
    armor: 18, leak: 9, boss: 'main', dragon: true,
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

// HP grows with the wave so late basic pests stay relevant.
export function hpScale(wave) {
  // Waves 1-10 keep the original ramp; the barnyard waves bring their own bulk,
  // so the multiplier grows more gently after the second door opens.
  if (wave <= 10) return 1 + 0.17 * (wave - 1);
  return 1 + 0.17 * 9 + 0.09 * (wave - 10);
}

// ---------------------------------------------------------------- waves ---
// groups: [kind, count, gap seconds, delay before group starts, lane]
// lane defaults to 0 (the mouse hole); lane 1 is the top-right portal and is
// only used from wave SECOND_LANE_WAVE onwards.
export const WAVES = [
  { name: 'Squeaky Beginnings', groups: [['mouse', 8, 0.9, 0]] },
  { name: 'Snakes in the Pantry', groups: [['mouse', 8, 0.8, 0], ['snake', 4, 1.0, 3]] },
  { name: 'Bad Dog', groups: [['mouse', 10, 0.6, 0], ['dog', 3, 1.6, 4]] },
  { name: 'First Flight', groups: [['bird', 6, 1.0, 0], ['mouse', 10, 0.5, 2], ['snake', 6, 0.7, 5]] },
  { name: 'MINI BOSS: Sir Barksalot', groups: [['baron', 1, 1, 0], ['mouse', 10, 0.5, 3], ['snake', 5, 0.8, 6]] },
  { name: 'The Kennel Opens', groups: [['dog', 6, 1.1, 0], ['snake', 10, 0.5, 2], ['bird', 6, 0.9, 6]] },
  { name: 'Feathers and Fangs', groups: [['bird', 12, 0.6, 0], ['snake', 12, 0.45, 3], ['dog', 5, 1.3, 7]] },
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
      ['chicken', 8, 0.7, 0, 1], ['pig', 5, 1.3, 3, 1],
      ['mouse', 14, 0.4, 2], ['snake', 10, 0.5, 6],
    ],
  },
  {
    name: 'Shell Wall',
    groups: [
      ['turtle', 6, 1.6, 0, 1], ['turtle', 4, 1.8, 4],
      ['bird', 10, 0.6, 6], ['chicken', 8, 0.6, 9, 1],
    ],
  },
  {
    name: 'Hoofbeats',
    groups: [
      ['horse', 8, 1.0, 0, 1], ['horse', 6, 1.2, 4],
      ['dog', 8, 0.9, 7], ['pig', 6, 1.1, 10, 1],
    ],
  },
  {
    name: 'Monkey Business',
    groups: [
      ['monkey', 7, 1.2, 0, 1], ['monkey', 5, 1.4, 4],
      ['chicken', 10, 0.5, 6, 1], ['turtle', 5, 1.7, 9],
    ],
  },
  {
    name: 'MINI BOSS: Baron Bananas',
    groups: [
      ['monkeyking', 1, 1, 0, 1], ['monkey', 8, 1.1, 6],
      ['chicken', 12, 0.5, 9, 1], ['horse', 6, 1.2, 13],
    ],
  },
  {
    name: 'Barnyard Riot',
    groups: [
      ['chicken', 16, 0.4, 0, 1], ['horse', 8, 1.0, 3],
      ['pig', 6, 1.0, 6, 1], ['monkey', 8, 1.1, 10],
    ],
  },
  {
    name: 'Armoured Parade',
    groups: [
      ['turtle', 10, 1.2, 0], ['turtle', 8, 1.3, 2, 1],
      ['dog', 10, 0.8, 6, 1], ['horse', 10, 0.9, 9],
    ],
  },
  {
    name: 'Sky Bacon',
    groups: [
      ['pig', 10, 0.9, 0, 1], ['bird', 18, 0.45, 2],
      ['monkey', 8, 1.0, 8, 1], ['chicken', 14, 0.4, 11],
    ],
  },
  {
    name: 'Everything, Twice',
    groups: [
      ['horse', 12, 0.8, 0, 1], ['turtle', 8, 1.2, 2],
      ['pig', 8, 0.9, 5, 1], ['monkey', 10, 0.9, 8],
      ['chicken', 16, 0.35, 11, 1], ['dog', 12, 0.7, 13],
    ],
  },
  {
    name: 'FINAL BOSS: Sophie the Dragon',
    groups: [
      ['dragon', 1, 1, 0], ['chicken', 14, 0.5, 14, 1], ['horse', 10, 0.9, 20],
      ['pig', 8, 1.0, 26, 1], ['turtle', 8, 1.2, 32], ['monkey', 10, 1.0, 38, 1],
    ],
  },
];

export function waveBonus(wave) { return 45 + wave * 18; }
