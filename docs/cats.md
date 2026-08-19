# 🐱 Cats

The cats are the towers you place around the kitchen. All of their balance data
lives in [`js/config.js`](../js/config.js) (`TOWERS`, `TOWER_ORDER`,
`upgradeCost`, `towerStats`).

> Keep this file in sync with `TOWERS` whenever a cat is added, removed or
> rebalanced — see [`docs/AGENTS.md`](AGENTS.md).

## The ten cats

| Cat | Cost 🐟 | Damage | Range | Rate (shots/s) | Targets | Special |
| --- | --- | --- | --- | --- | --- | --- |
| 🏹 Archer | 70 | 14 | 5.6 | 1.15 | ground + air | — |
| 🔮 Wizard | 115 | 27 | 5.2 | 0.62 | ground + air | splash 2.3 |
| ❄️ Frost | 85 | 13 | 4.8 | 1.0 | ground + air | single target, slows 45% for 2.0 s |
| 🥷 Ninja | 160 | 10 | 4.2 | 3.3 | ground only | 16% chance of a 3× crit |
| 😴 Sleepy | 195 | 62 | 6.4 | 0.34 | ground only | lobbed pillow, splash 3.4 |
| 🎀 Ema | 190 | — | 5.0 | — | support | ribbon aura: +18/27/38% damage, +12/19/28% fire rate |
| 💰 Sofija | 200 | — | 4.6 | — | support | purse: 🐟 12/19/28 every 8/6.5/5 s, +25/40/60% bounty nearby |
| 🗡️ Simba-kun | 250 | 33 | 4.2 | 1.05 | ground only | cleaving katana (splash 1.9, 18% × 3 crit) + *bushido* every 14 s |
| 🧙 Witch | 300 | — | 6.2 | — | ground + air | hex field (+12/18/25% damage taken), area curse every 34 s |
| 👑 Mimi-chan | 3000 | — | whole board | — | ground + air | royal bow, once every 10 s |

### 🏹 Archer
Cheap, reliable single-target damage that hits flying pests. Fires an arrow at
speed 26. The default opener and the answer to early birds. Her 🎯 Sniper path
is the only source of **true damage** in the game — see *Armour* below.

### 🔮 Wizard
Slow-moving arcane orbs (speed 14) that explode on impact for 2.3 splash
radius. Hits air. Good against clumped groups.

### ❄️ Frost
Modest damage, but every shard chills the pest it hits and slows it by 45% for
2 seconds. Hits air. **No splash** — the chill lands on a single target, so
Frost is a support cat you pair with Sleepy or Ninja rather than a crowd answer.
Her 🌨️ Hailstorm path is the one way she ever splashes.

### 🥷 Ninja
3.3 shuriken per second at the shortest range in the game (4.2). Ground only,
unless he walks the 🌫️ Shadow path — that is the only way a ground cat ever
learns to hit the sky. Each shot has a 16% chance to crit for triple damage,
and he still has the highest sustained single-target DPS in the game.

### 😴 Sleepy
Lobs a fluffy pillow in a lazy arc for 62 damage with a 3.4 splash radius.
Ground only, and by far the slowest fire rate in the game (0.34 shots/s — about
one pillow every three seconds). Expensive, but devastating against crowds; the
pests never see it coming because neither does she.

### 🎀 Ema
A support cat. She never attacks; instead every cat inside her 5.0 radius fires
harder and faster (+18% damage / +12% rate at level 1, up to +38% / +28% at
level 3). **Ribbons do not stack** — only the strongest Ema in reach counts —
and she does not cheer for herself, so two Emas side by side are a waste. The
tower panel of a cheered cat says so.

### 💰 Sofija
The other support cat. She digs up 🐟 12 every 8 seconds all on her own
(🐟 28 every 5 s at level 3) and every pest that dies inside her 4.6 radius is
worth 25% more (60% at level 3). Purses do not stack either. During the queen's
frenzy she counts down at double speed.

### 🗡️ Simba-kun
The samurai. His katana cuts everything in a 1.9 splash around whatever he hits,
with an 18% chance of a 3× crit — ground only, because a sword cannot reach a
bird. His 🎋 Sensei path is the exception: there the slash leaves the blade as an
arc of moonlight, so it finally reaches the sky. On top of the ordinary swings
he charges **bushido**: every **14 seconds**,
if anything at all is within 1.15× his range, he unsheathes for a ring of
moonlight that deals **2.6× his damage** to every ground pest around him and
**stuns them for 1.2 s**. The strike scales with his level and with his path.

### 🧙 Witch
She never deals a point of damage herself. Instead she does two things at once.

**The hex field (always on).** Every pest inside her range — ground, air, boss,
anything — takes **+12% / 18% / 25%** more damage from *every* source: shots,
splash, bushido, everything. The multiplier lands on the target rather than on
the cat, so it lifts your whole army at once and it never double-counts. Like
Ema's ribbon and Sofija's purse, **hex fields do not stack**: only the strongest
witch in reach counts, so a wall of witches is never the answer.

**The curse (every 34 seconds).** She hexes the highest-HP legal pest in range,
**and everything cursable within `curseRadius` of it** (2.6 → 3.4 as she levels).
What the curse does depends on her level:

| Level | Curse | Effect |
| --- | --- | --- |
| 1 | 🐸 Frog | every pest in the knot becomes a Frog — the same stats as a Mouse |
| 2 | 🗿 Stone | every pest in the knot is petrified: it cannot move for 10 seconds |
| 3 | 💀 Doom | the pest she pointed at is destroyed instantly (you still collect its bounty); the rest of the knot is petrified instead |

Doom stays a single-target execute on purpose — a mass instant kill would end
waves on its own.

**Bosses and mini-bosses are still immune** to every curse, as are pests that
are already frogs or already made of stone. But a cast no longer fizzles on a
boss wave: with nothing cursable in reach she **brands** the biggest thing she
can see instead, for **+35% damage taken and a 30% slow over 8 seconds**
(`HEX` in `js/config.js`). The brand stacks on top of her passive field.

### 👑 Mimi-chan — the queen
**One of a kind:** `TOWERS.queen.limit = 1`, so only one Mimi-chan may ever
stand on the table. The shop button greys out (✓) while she is placed, the
engine refuses a second one, and the button unlocks again if she is ever
destroyed. Every other cat has no limit.

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
| Curse radius | `× (1 + 0.15 · l)` |

Ability cats ignore the damage/rate growth: the Witch's cooldown stays at 34
seconds, and her level decides which curse she casts, how wide the knot is and
how deep her hex field bites. Mimi-chan's bow stays at 1 second every 10
seconds.

Tap a placed cat to inspect, upgrade or sell it.

## Shared mechanics

- **Air targeting** — only cats with `air: true` (Archer, Wizard, Frost, Witch,
  Mimi-chan) reach flying enemies. Ninja, Sleepy and Simba-kun ignore 🐦 birds,
  🐖 flying pigs and 🐉 Sophie completely — unless the Ninja walks the 🌫️ Shadow
  path or Simba-kun walks the 🎋 Sensei path, the only two ways a ground cat ever
  learns to hit the sky. An air-capable Simba-kun's *bushido* ring catches
  flyers too.
- **Ability cats** — cats with an `ability` (Witch, Mimi-chan) never fire a
  projectile. They charge a cooldown (visible in the tower panel) and then do
  something to the board. Catnip frenzy halves those cooldowns too. The Witch
  is the exception that also works *between* casts: her hex field is passive
  and always on.
- **Stuns** — petrified and bowing pests do not move at all, but they can still
  be shot, and armour still applies.
- **Armour** — enemy armour is subtracted from every hit, but a hit always
  deals at least 25% of its raw damage. A shot with `pierce` ignores that
  fraction of the armour first: 🎯 Sniper Archer has `pierce: 1`, so her arrows
  are **true damage** and the 25% floor never comes into play. Nothing else in
  the game pierces.
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
    guaranteed to survive that wave.
  - 💥 **Father** on wave 50 is the worst of them: he destroys **half of every
    cat on the board** the moment he lands, swats one more every 12 seconds, and
    when he first drops to 0 HP he heals to full and takes **75% of what is
    left** with him. He does not spare the queen.
  - 🦋 **Emilija** never damages a cat on wave 30, but every 13 seconds she
    either **shuffles every cat onto a different tile** (squads, Ema's ribbon
    and Sofija's purse are all recalculated around the new layout, and no cat is
    ever moved onto a lane) or **puts a third of your cats to sleep** until her
    next trick. A sleeping cat behaves exactly like a banana'd one — no shots,
    no ability charge — and wakes up the moment she plays her next trick.
    👑 Mimi-chan can be shuffled and can nap like anyone else, but she works on
    the whole board, so her position never matters.

## Squads (synergies)

Two **different** cats standing within 4.6 world units (about two tiles) of each
other egg each other on. A pairing counts once no matter how many partners are
in reach, but different pairings stack, so a small mixed squad beats a long row
of the same cat. Active squads are listed in the tower panel with a ✦.

| Squad | Pair | Bonus to both |
| --- | --- | --- |
| 🧊 Shatter | Frost + Ninja | +25% damage |
| 🌩️ Blizzard | Frost + Wizard | +15% damage, +15% fire rate |
| 💤 Lullaby | Sleepy + Wizard | +20% damage |
| 🎯 The Hunt | Archer + Ninja | +25% fire rate |
| 🔮 Coven | Witch + Wizard | +20% range, +10% damage |
| 💞 Charm | Ema + Sofija | +25% range (bigger ribbon and purse) |
| 👑 Royal Court | Mimi-chan + Ema | +20% fire rate, +10% damage |
| 🎋 Dojo | Simba-kun + Ninja | +20% damage, +15% fire rate |
| 🗡️ Honour | Simba-kun + Mimi-chan | +18% damage |
| 🌸 Kata | Simba-kun + Frost | +20% range, +12% damage |

## Hybrid upgrades (paths)

Once a cat wears every collar it may specialise **once, permanently**, for
`1.9 ×` its base price. The tower panel then offers two cards; the chosen path
is shown with a ✧ and a floating gem above the cat.

| Cat | Path | What changes |
| --- | --- | --- |
| 🏹 Archer | 🎯 Sniper / 🏹 Ranger | ×1.75 damage, ×1.5 range, ×0.6 rate **and true damage** / ×1.8 rate, ×0.85 damage |
| 🔮 Wizard | 🔥 Inferno / 💫 Nova | ×1.55 damage / ×1.85 splash, ×1.15 rate |
| ❄️ Frost | 🧊 Glacier / 🌨️ Hailstorm | deeper, longer chill / ×1.5 damage plus a granted 2.2 splash, shorter chill |
| 🥷 Ninja | 🗡️ Assassin / 🌫️ Shadow | ×2.2 crit chance, ×1.35 damage / ×1.45 rate, ×1.35 range **and hits air** |
| 😴 Sleepy | 🌙 Dreamer / 🪨 Boulder | ×1.6 splash plus a granted 45% slow for 2.4 s / ×1.85 damage, ×0.75 rate |
| 🎀 Ema | 📣 Anthem / 🎶 Duet | ×1.75 aura radius / ×1.55 aura strength |
| 💰 Sofija | 🏦 Banker / 🏴‍☠️ Pirate | ×1.7 coins, faster / ×1.9 bounty, ×1.2 radius |
| 🗡️ Simba-kun | 🌪️ Ronin / 🎋 Sensei | ×1.55 damage, ×1.25 range, ×0.85 rate and a ×1.3 bushido / ×1.35 rate, ×1.5 splash, ×0.72 damage, bushido every 8.4 s **and hits air** |
| 🧙 Witch | 🪄 Hexer / 💀 Doomsayer | ×0.55 cooldown, ×1.6 curse radius / ×1.6 range, ×1.5 hex field |

👑 Mimi-chan has no path — she is already at the top.

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
| `simba` | Simba-kun | Simba-kun |
| `witch` | Witch | Veštica |
| `queen` | Mimi-chan | Mimi-čan |
