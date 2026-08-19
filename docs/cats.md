# 🐱 Cats

The cats are the towers you place around the kitchen. All of their balance data
lives in [`js/config.js`](../js/config.js) (`TOWERS`, `TOWER_ORDER`,
`upgradeCost`, `towerStats`).

> Keep this file in sync with `TOWERS` whenever a cat is added, removed or
> rebalanced — see [`docs/AGENTS.md`](AGENTS.md).

## The nine cats

| Cat | Cost 🐟 | Damage | Range | Rate (shots/s) | Targets | Special |
| --- | --- | --- | --- | --- | --- | --- |
| 🏹 Archer | 70 | 13 | 6.4 | 1.15 | ground + air | — |
| 🔮 Wizard | 120 | 24 | 6.0 | 0.62 | ground + air | splash 2.3 |
| ❄️ Frost | 95 | 9 | 5.4 | 1.0 | ground + air | single target, slows 45% for 2.0 s |
| 🥷 Ninja | 150 | 10 | 4.4 | 3.6 | ground only | 22% chance of a 3× crit |
| 😴 Sleepy | 210 | 58 | 7.2 | 0.34 | ground only | lobbed pillow, splash 3.4 |
| 🎀 Ema | 190 | — | 5.6 | — | support | ribbon aura: +18/27/38% damage, +12/19/28% fire rate |
| 💰 Sofija | 200 | — | 5.2 | — | support | purse: 🐟 12/19/28 every 8/6.5/5 s, +25/40/60% bounty nearby |
| 🧙 Witch | 300 | — | 7.0 | — | ground + air | curse, once every 60 s |
| 👑 Mimi-chan | 3000 | — | whole board | — | ground + air | royal bow, once every 10 s |

### 🏹 Archer
Cheap, reliable single-target damage that hits flying pests. Fires an arrow at
speed 26. The default opener and the answer to early birds.

### 🔮 Wizard
Slow-moving arcane orbs (speed 14) that explode on impact for 2.3 splash
radius. Hits air. Good against clumped groups.

### ❄️ Frost
Low damage, but every shard chills the pest it hits and slows it by 45% for 2
seconds. Hits air. **No splash** — the chill lands on a single target, so Frost
is a support cat you pair with Sleepy or Ninja rather than a crowd answer.

### 🥷 Ninja
3.6 shuriken per second at short range (4.4). Ground only. Each shot has a 22%
chance to crit for triple damage. The highest sustained single-target DPS in
the game once upgraded.

### 😴 Sleepy
Lobs a fluffy pillow in a lazy arc for 58 damage with a 3.4 splash radius.
Ground only, and by far the slowest fire rate in the game (0.34 shots/s — about
one pillow every three seconds). Expensive, but devastating against crowds; the
pests never see it coming because neither does she.

### 🎀 Ema
A support cat. She never attacks; instead every cat inside her 5.6 radius fires
harder and faster (+18% damage / +12% rate at level 1, up to +38% / +28% at
level 3). **Ribbons do not stack** — only the strongest Ema in reach counts —
and she does not cheer for herself, so two Emas side by side are a waste. The
tower panel of a cheered cat says so.

### 💰 Sofija
The other support cat. She digs up 🐟 12 every 8 seconds all on her own
(🐟 28 every 5 s at level 3) and every pest that dies inside her 5.2 radius is
worth 25% more (60% at level 3). Purses do not stack either. During the queen's
frenzy she counts down at double speed.

### 🧙 Witch
Does no damage at all. Every **60 seconds** she hexes the highest-HP pest in
range (ground or air). What the hex does depends on her level:

| Level | Curse | Effect |
| --- | --- | --- |
| 1 | 🐸 Frog | the pest becomes a Frog — the same stats as a Mouse |
| 2 | 🗿 Stone | the pest is petrified: it cannot move for 10 seconds |
| 3 | 💀 Doom | the pest is destroyed instantly (you still collect its bounty) |

**Bosses and mini-bosses are immune** to every curse, as are pests that are
already frogs or already made of stone. The curse timer keeps ticking while she
has no legal target, so she fires the moment one walks in.

### 👑 Mimi-chan — the queen
Costs **ten times the priciest ordinary cat** (`10 × 300 = 3000 🐟`) and is
computed that way in `js/config.js`, so she rescales automatically if the other
cats do. She has exactly one ability and it covers the **entire board**, no
range ring required: every **10 seconds** every pest in the kitchen stops to
**bow** for **1 second**. Bosses bow too. She cannot be upgraded (`maxLevel: 1`)
— Her Majesty is already perfect.

## Upgrades

Each cat can be upgraded to level 3 (`MAX_LEVEL`), except Mimi-chan, who is
capped at level 1 (`maxLevel: 1`, read through the `maxLevel(kind)` helper). The
upgrade cost scales with the cat's base cost: `cost × (0.75 + 0.45 × level)`,
and every level adds a golden collar to the model.

Per level above 1 (`l = level - 1`):

| Stat | Growth |
| --- | --- |
| Damage | `× (1 + 0.62 · l)` |
| Range | `× (1 + 0.13 · l)` |
| Fire rate | `× (1 + 0.18 · l)` |
| Splash radius | `× (1 + 0.12 · l)` |
| Slow duration | `× (1 + 0.20 · l)` |

Ability cats ignore the damage/rate growth: the Witch's cooldown stays at 60
seconds and her level only decides which curse she casts, and Mimi-chan's bow
stays at 1 second every 10 seconds.

Tap a placed cat to inspect, upgrade or sell it.

## Shared mechanics

- **Air targeting** — only cats with `air: true` (Archer, Wizard, Frost, Witch,
  Mimi-chan) reach flying enemies. Ninja and Sleepy ignore 🐦 birds, 🐖 flying
  pigs and 🐉 Sophie completely.
- **Ability cats** — cats with an `ability` (Witch, Mimi-chan) never fire a
  projectile. They charge a cooldown (visible in the tower panel) and then do
  something to the board. Catnip frenzy halves those cooldowns too.
- **Stuns** — petrified and bowing pests do not move at all, but they can still
  be shot, and armour still applies.
- **Armour** — enemy armour is subtracted from every hit, but a hit always
  deals at least 25% of its raw damage.
- **Catnip frenzy** — picking up a catnip drop makes every cat fire at double
  speed for 9 seconds.
- **Placement** — cats can only be placed on free floor tiles, never on either
  pest lane (both lanes are reserved from the start, even though the second door
  only opens at wave 11).
- **Cats can be hurt** — from wave 11 the pests fight back:
  - 🐒 **Monkeys and 🍌 Baron Bananas** knock a cat out with a banana for 3
    seconds (`BANANA_STUN`). A knocked-out cat stops shooting, stops charging
    its ability and wobbles in place; nothing else changes.
  - 🐉 **Sophie** burns one random cat to ash every 10 seconds on wave 20. The
    cat is destroyed with no refund. **👑 Mimi-chan is immune** — Sophie will
    not aim at the queen — which makes the most expensive cat the only one
    guaranteed to survive the final wave.

## Serbian names

Display names come from [`js/i18n.js`](../js/i18n.js) (`tower.<kind>.name`);
`TOWERS[kind].name` in `config.js` is only an English fallback. Add both
languages when a cat is added or renamed.

| Key | English | Srpski |
| --- | --- | --- |
| `archer` | Archer | Strelac |
| `wizard` | Wizard | Čarobnjak |
| `frost` | Frost | Ledena |
| `ninja` | Ninja | Nindža |
| `sleepy` | Sleepy | Pospana |
| `ema` | Ema | Ema |
| `sofija` | Sofija | Sofija |
| `witch` | Witch | Veštica |
| `queen` | Mimi-chan | Mimi-čan |
