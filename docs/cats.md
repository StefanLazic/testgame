# 🐱 Cats

The cats are the towers you place around the kitchen. All of their balance data
lives in [`js/config.js`](../js/config.js) (`TOWERS`, `TOWER_ORDER`,
`upgradeCost`, `towerStats`).

> Keep this file in sync with `TOWERS` whenever a cat is added, removed or
> rebalanced — see [`docs/AGENTS.md`](AGENTS.md).

## The five cats

| Cat | Cost 🐟 | Damage | Range | Rate (shots/s) | Targets | Special |
| --- | --- | --- | --- | --- | --- | --- |
| 🏹 Archer | 70 | 13 | 6.4 | 1.15 | ground + air | — |
| 🔮 Wizard | 120 | 24 | 6.0 | 0.62 | ground + air | splash 2.3 |
| ❄️ Frost | 95 | 7 | 5.4 | 1.0 | ground + air | splash 1.8, slows 45% for 2.0 s |
| 🥷 Ninja | 150 | 10 | 4.4 | 3.6 | ground only | 22% chance of a 3× crit |
| 🍳 Chef | 210 | 52 | 7.2 | 0.42 | ground only | lobbed shot, splash 3.2 |

### 🏹 Archer
Cheap, reliable single-target damage that hits flying pests. Fires an arrow at
speed 26. The default opener and the answer to early birds.

### 🔮 Wizard
Slow-moving arcane orbs (speed 14) that explode on impact for 2.3 splash
radius. Hits air. Good against clumped groups.

### ❄️ Frost
Low damage, but every shard chills a 1.8 radius area and slows everything hit
by 45% for 2 seconds. Hits air. A support cat — pair it with Chef or Ninja.

### 🥷 Ninja
3.6 shuriken per second at short range (4.4). Ground only. Each shot has a 22%
chance to crit for triple damage. The highest sustained single-target DPS in
the game once upgraded.

### 🍳 Chef
Lobs a hot frying pan in an arc for 52 damage with a 3.2 splash radius. Ground
only, and the slowest fire rate in the game. Expensive, but devastating against
crowds.

## Upgrades

Each cat can be upgraded to level 3 (`MAX_LEVEL`). The upgrade cost scales with
the cat's base cost: `cost × (0.75 + 0.45 × level)`, and every level adds a
golden collar to the model.

Per level above 1 (`l = level - 1`):

| Stat | Growth |
| --- | --- |
| Damage | `× (1 + 0.62 · l)` |
| Range | `× (1 + 0.13 · l)` |
| Fire rate | `× (1 + 0.18 · l)` |
| Splash radius | `× (1 + 0.12 · l)` |
| Slow duration | `× (1 + 0.20 · l)` |

Tap a placed cat to inspect, upgrade or sell it.

## Shared mechanics

- **Air targeting** — only cats with `air: true` (Archer, Wizard, Frost) can
  shoot flying enemies. Ninja and Chef ignore birds completely.
- **Armour** — enemy armour is subtracted from every hit, but a hit always
  deals at least 25% of its raw damage.
- **Catnip frenzy** — picking up a catnip drop makes every cat fire at double
  speed for 9 seconds.
- **Placement** — cats can only be placed on free floor tiles, never on the
  pest path.
