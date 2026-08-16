# 🐭 Enemies

The pests walk the `PATH` from the mouse hole to the milk bowl. All of their
balance data lives in [`js/config.js`](../js/config.js) (`ENEMIES`, `WAVES`,
`hpScale`).

> Keep this file in sync with `ENEMIES` and `WAVES` whenever an enemy is added,
> removed or rebalanced — see [`docs/AGENTS.md`](AGENTS.md).

## Roster

| Enemy | HP | Speed | Bounty 🐟 | Armour | Lives lost on leak | Flying |
| --- | --- | --- | --- | --- | --- | --- |
| 🐭 Mouse | 34 | 3.0 | 8 | — | 1 | no |
| 🐍 Snake | 30 | 4.8 | 11 | — | 1 | no |
| 🐶 Dog | 120 | 2.1 | 20 | 4 | 2 | no |
| 🐦 Bird | 46 | 4.2 | 14 | — | 1 | **yes** |
| 🌟 Golden Mouse | 40 | 6.4 | 90 | — | 0 | no |
| 👑 Sir Barksalot (mini boss) | 1200 | 1.7 | 220 | 8 | 3 | no |
| 👑 The Rat King (final boss) | 6000 | 1.5 | 600 | 10 | 9 | no |

### 🐭 Mouse
The basic pest. Cheap, plentiful and slow enough that almost anything kills it.
Shows up in every wave and in ever-larger swarms.

### 🐍 Snake
Fragile but fast (speed 4.8). Slips past low-DPS setups; Frost slows help a lot.

### 🐶 Dog
A tanky brute with 4 armour and 120 HP, so chip damage is heavily reduced (each
hit still deals at least 25% of its raw damage). Costs **2 lives** if it reaches
the milk bowl.

### 🐦 Bird
The only flying enemy. It ignores the walking path entirely and flies straight
over your maze, so only cats with air targeting (Archer, Wizard, Frost) can
touch it.

### 🌟 Golden Mouse
A bonus enemy: from wave 2 onwards there is a 75% chance one sneaks in at a
random point in the wave. It is the fastest thing in the game (speed 6.4) and
pays out 90 🐟, but it costs **no lives** if it escapes — it just gets away.

### 👑 Sir Barksalot — mini boss (wave 5)
An oversized dog with 1200 HP and 8 armour. Every 6 seconds he **howls**:
nearby pests have their slows cleared and are rallied to 1.45× speed for 3
seconds. Leaks 3 lives. Always drops catnip when killed.

### 👑 The Rat King — final boss (wave 10)
A giant mouse with 6000 HP and 10 armour. He **spawns 3 extra mice every 3.5
seconds** at his own position (each 1.2× faster than normal), and **enrages**
at 45% HP for a permanent 1.5× speed boost. Leaking him costs all 9 lives.
Always drops catnip when killed.

## Shared mechanics

- **Wave HP scaling** — every enemy's HP is multiplied by
  `1 + 0.17 × (wave - 1)`, so basic pests stay relevant late.
- **Bounty scaling** — the payout is `bounty × (1 + 0.02 × wave)`.
- **Armour** — armour is subtracted from every hit, with a floor of 25% of the
  raw damage.
- **Slows** — Frost applies a temporary speed reduction; Sir Barksalot's howl
  clears it from nearby pests.
- **Catnip drops** — bosses always drop catnip; other enemies drop it with a
  3.5% chance.

## Waves

| # | Name | Contents |
| --- | --- | --- |
| 1 | Squeaky Beginnings | mice |
| 2 | Snakes in the Pantry | mice, snakes |
| 3 | Bad Dog | mice, dogs |
| 4 | First Flight | birds, mice, snakes |
| 5 | MINI BOSS: Sir Barksalot | Sir Barksalot, mice, snakes |
| 6 | The Kennel Opens | dogs, snakes, birds |
| 7 | Feathers and Fangs | birds, snakes, dogs |
| 8 | Stampede | mice, dogs, birds |
| 9 | Everything At Once | dogs, birds, snakes, mice |
| 10 | FINAL BOSS: The Rat King | The Rat King, dogs, birds, snakes |

You start with 9 lives (`START_LIVES`) and 260 🐟 (`START_GOLD`).
