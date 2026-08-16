// ---------------------------------------------------------------------------
// All balance data for Claw Defense lives here so it is easy to tweak.
// ---------------------------------------------------------------------------

export const TILE = 2;
export const COLS = 9;
export const ROWS = 19;

// Path through the kitchen, in [col, row] tile coordinates. Pests walk the
// centre of these tiles from the mouse hole to the milk bowl.
export const PATH = [
  [0, 1], [7, 1], [7, 4], [1, 4], [1, 7], [7, 7], [7, 10],
  [1, 10], [1, 13], [7, 13], [7, 16], [4, 16],
];

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
    damage: 7, range: 5.4, rate: 1.0, air: true, bullet: 'shard', speed: 20,
    splash: 1.8, slow: 0.45, slowTime: 2.0,
    blurb: 'Chills a small area, slowing pests. Hits air.',
  },
  ninja: {
    name: 'Ninja', icon: '🥷', cost: 150, color: 0x4a4a63, accent: 0xff5b7f,
    damage: 10, range: 4.4, rate: 3.6, air: false, bullet: 'star', speed: 34, crit: 0.22,
    blurb: 'Blinding fast shuriken, ground only. Crits hurt.',
  },
  chef: {
    name: 'Chef', icon: '🍳', cost: 210, color: 0xffc36b, accent: 0xd8532e,
    damage: 52, range: 7.2, rate: 0.42, air: false, bullet: 'pan', speed: 12, splash: 3.2, lob: true,
    blurb: 'Lobs a hot frying pan. Huge splash, ground only.',
  },
};
export const TOWER_ORDER = ['archer', 'wizard', 'frost', 'ninja', 'chef'];

export const MAX_LEVEL = 3;
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

// -------------------------------------------------------------- enemies ---
export const ENEMIES = {
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
};

// HP grows with the wave so late basic pests stay relevant.
export function hpScale(wave) { return 1 + 0.17 * (wave - 1); }

// ---------------------------------------------------------------- waves ---
// groups: [kind, count, gap seconds, delay before group starts]
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
];

export function waveBonus(wave) { return 45 + wave * 18; }
