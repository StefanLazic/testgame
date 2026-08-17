# 🐭 Enemies

The pests walk from an entrance to the milk bowl. There are two lanes: `PATH`
(the mouse hole, top-left) is open from wave 1, and `PATH2` (the rift in the
top-right corner) tears open at wave 11 (`SECOND_LANE_WAVE`). All of their
balance data lives in [`js/config.js`](../js/config.js) (`ENEMIES`, `WAVES`,
`PATHS`, `hpScale`, `BANANA_STUN`, `DRAGON`).

> Keep this file in sync with `ENEMIES` and `WAVES` whenever an enemy is added,
> removed or rebalanced — see [`docs/AGENTS.md`](AGENTS.md).

## Roster

| Enemy | HP | Speed | Bounty 🐟 | Armour | Lives lost on leak | Flying |
| --- | --- | --- | --- | --- | --- | --- |
| 🐭 Mouse | 34 | 3.0 | 8 | — | 1 | no |
| 🐸 Frog | 34 | 3.0 | 8 | — | 1 | no |
| 🐍 Snake | 30 | 4.8 | 11 | — | 1 | no |
| 🐶 Dog | 120 | 2.1 | 20 | 4 | 2 | no |
| 🐦 Bird | 46 | 4.2 | 14 | — | 1 | **yes** |
| 🌟 Golden Mouse | 40 | 6.4 | 90 | — | 0 | no |
| 🐖 Flying Pig | 170 | 2.4 | 26 | — | 1 | **yes** |
| 🐢 Turtle | 460 | 1.15 | 34 | 16 | 2 | no |
| 🐎 Horse | 150 | 5.6 | 30 | 5 | 1 | no |
| 🐔 Chicken | 80 | 5.2 | 12 | — | 1 | no |
| 🐣 Chick | 26 | 4.6 | 4 | — | 1 | no |
| 🐒 Monkey | 170 | 3.4 | 24 | 3 | 2 | no |
| 👑 Sir Barksalot (mini boss, wave 5) | 1200 | 1.7 | 220 | 8 | 3 | no |
| 👑 The Rat King (boss, wave 10) | 6000 | 1.5 | 600 | 10 | 9 | no |
| 🍌 Baron Bananas (mini boss, wave 15) | 5200 | 2.2 | 520 | 12 | 4 | no |
| 🐉 Sophie (final boss, wave 20) | 24000 | 0.6 | 2000 | 18 | 9 | **yes** |

### 🐭 Mouse
The basic pest. Cheap, plentiful and slow enough that almost anything kills it.
Shows up in every wave and in ever-larger swarms.

### 🐸 Frog
Never spawned by a wave: a frog only exists because the 🧙 Witch cursed
something into one (see [`docs/cats.md`](cats.md)). It has exactly the same
stats as a Mouse — 34 HP, speed 3.0, 8 🐟, 1 life on leak — which makes it a
brutal downgrade for a dog or a snake. Frogs are flagged `cursed: true` so the
Witch will not waste a second hex on them, and a cursed flyer lands and walks
the path like everyone else.

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

### 🐖 Flying Pig
Physics is not this pig's problem. It flies straight over the maze like a bird,
but it is far slower (2.4) and far tougher (170 HP), so air-capable cats have to
grind it down while everything else watches.

### 🐢 Turtle
A walking wall: 460 HP and **16 armour**, the highest in the game, so small fast
shots are reduced to the 25% damage floor. Very slow (1.15) — splash damage and
big single hits (😴 Sleepy, 🔮 Wizard) are the answer.

### 🐎 Horse
Charges at speed 5.6 with 150 HP and 5 armour: the fastest armoured pest. It runs
past thin defences before they can chew through the armour; slows help enormously.

### 🐔 Chicken
Fast (5.2) and flimsy, but **every 7 seconds a chicken lays an egg** on the path.
The egg wobbles for 4.5 seconds and then hatches into a 🐣 Chick that continues
from that exact spot. At most 12 eggs exist at once, and chicks never lay.

### 🐣 Chick
Only ever hatched from an egg. Tiny, quick and cheap, but a wave of chickens
left alone becomes a wave of chickens *and* chicks.

### 🐒 Monkey
Throws a banana at a random cat within 9 units every 6.5 seconds. A hit knocks
that cat out for **3 seconds** (`BANANA_STUN`) — it stops shooting, stops
charging abilities and sits there wobbling. Ignoring monkeys quietly turns your
best cats off.

### 🍌 Baron Bananas — mini boss (wave 15)
The monkey king: 5200 HP, 12 armour, and a **volley of 3 bananas every 4
seconds**, so he can black out a third of your board at once. Enters through the
second door. Leaks 4 lives, always drops catnip.

### 🐉 Sophie — final boss (wave 20)
A dragon with 24000 HP and 18 armour who **flies** straight for the bowl, so
ground-only cats cannot touch her. She arrives in a cinematic entrance —
*"SOPHIE HAS DESCENDED"* — swooping out of the night sky trailing fire before
she levels out above the kitchen. She has three abilities (`DRAGON` in
`config.js`):

- **Fire breath, every 10 s** — she burns one random cat to ash. The tower is
  destroyed, no refund. 👑 Mimi-chan is the one exception: even a dragon knows
  better than to aim at the queen.
- **Swarm, every 20 s** — she summons two chicks, a chicken, two mice and a
  snake next to herself.
- **Old friends** — at **75%** HP she calls back 🐶 Sir Barksalot, at **50%**
  👑 The Rat King and at **25%** 🍌 Baron Bananas, each at 45% of their usual
  health. Summons keep all of their own abilities but never steal her boss bar.

Summoned pests are dropped onto the nearest point of their lane, clamped to the
first 55% of the route, so Sophie can never teleport a boss next to the bowl.

## Shared mechanics

- **Wave HP scaling** — every enemy's HP is multiplied by `hpScale(wave)`:
  `1 + 0.17 × (wave - 1)` for waves 1–10 (unchanged), then a gentler
  `1 + 0.17 × 9 + 0.09 × (wave - 10)` for waves 11–20, because the barnyard
  pests already arrive with far more health and armour of their own.
- **Bounty scaling** — the payout is `bounty × (1 + 0.02 × wave)`.
- **Armour** — armour is subtracted from every hit, with a floor of 25% of the
  raw damage.
- **Slows** — Frost applies a temporary speed reduction to a single target; Sir
  Barksalot's howl clears it from nearby pests.
- **Curses** — the Witch turns a pest into a 🐸 Frog (level 1), petrifies it for
  10 seconds (level 2, `STONE_TIME`) or destroys it outright (level 3). **Bosses
  and mini-bosses are immune.** A transformed pest keeps its place on the path.
- **Stuns** — petrified pests and pests bowing to 👑 Mimi-chan have their speed
  set to zero for the duration; they can still be damaged, and howls do not
  clear a stun.
- **Catnip drops** — bosses always drop catnip; other enemies drop it with a
  3.5% chance.
- **Two lanes** — from wave 11 the second door is open and waves spawn from both
  entrances at once (each wave group names its lane in `WAVES`). The lanes merge
  on the bottom row, and both finish at the milk bowl.
- **Cats can be attacked** — bananas disable a cat for 3 seconds; Sophie's fire
  destroys one outright. These are the only two ways the pests fight back.

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
| 10 | BOSS: The Rat King | The Rat King, dogs, birds, snakes |
| 11 | The Second Door | chickens, flying pigs (new lane), mice, snakes |
| 12 | Shell Wall | turtles (both lanes), birds, chickens |
| 13 | Hoofbeats | horses (both lanes), dogs, flying pigs |
| 14 | Monkey Business | monkeys (both lanes), chickens, turtles |
| 15 | MINI BOSS: Baron Bananas | Baron Bananas, monkeys, chickens, horses |
| 16 | Barnyard Riot | chickens, horses, flying pigs, monkeys |
| 17 | Armoured Parade | turtles, dogs, horses |
| 18 | Sky Bacon | flying pigs, birds, monkeys, chickens |
| 19 | Everything, Twice | horses, turtles, pigs, monkeys, chickens, dogs |
| 20 | FINAL BOSS: Sophie the Dragon | Sophie, chickens, horses, pigs, turtles, monkeys |

Waves 1–10 are unchanged; waves 11–20 use both lanes.

You start with 9 lives (`START_LIVES`) and 260 🐟 (`START_GOLD`).

## Serbian names

Display names come from [`js/i18n.js`](../js/i18n.js) (`enemy.<kind>.name` and
`wave.<n>.name`); the names in `config.js` are only English fallbacks. Add both
languages when an enemy or wave is added or renamed.

| Key | English | Srpski |
| --- | --- | --- |
| `mouse` | Mouse | Miš |
| `frog` | Frog | Žaba |
| `snake` | Snake | Zmija |
| `dog` | Dog | Pas |
| `bird` | Bird | Ptica |
| `golden` | Golden Mouse | Zlatni miš |
| `baron` | Sir Barksalot | Ser Lajavko |
| `ratking` | The Rat King | Pacovski kralj |
| `pig` | Flying Pig | Leteća svinja |
| `turtle` | Turtle | Kornjača |
| `horse` | Horse | Konj |
| `chicken` | Chicken | Kokoška |
| `chick` | Chick | Pile |
| `monkey` | Monkey | Majmun |
| `monkeyking` | Baron Bananas | Baron Banana |
| `dragon` | Sophie | Sofi |
