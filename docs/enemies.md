# 🐭 Enemies

The pests walk from an entrance to the milk bowl. There are two lanes: `PATH`
(the mouse hole, top-left) is open from wave 1, and `PATH2` (the rift in the
top-right corner) tears open at wave 11 (`SECOND_LANE_WAVE`). All of their
balance data lives in [`js/config.js`](../js/config.js) (`ENEMIES`, `WAVES`,
`PATHS`, `hpScale`, `BANANA_STUN`, `DRAGON`, `EMILIJA`).

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
| 🌟 Golden Mouse | 40 | 6.4 | 45 | — | 0 | no |
| 🐖 Flying Pig | 320 | 2.2 | 48 | 3 | 1 | **yes** |
| 🐢 Turtle | 460 | 1.15 | 34 | 16 | 2 | no |
| 🐎 Horse | 150 | 5.6 | 30 | 5 | 1 | no |
| 🐔 Chicken | 80 | 5.2 | 12 | — | 1 | no |
| 🐣 Chick | 26 | 4.6 | 4 | — | 1 | no |
| 🐒 Monkey | 170 | 3.4 | 24 | 3 | 2 | no |
| 💉 Nurse Hazel | 150 | 3.2 | 26 | — | 1 | no |
| 🛡️ Shield Beetle | 190 (+260 shield) | 2.5 | 30 | 4 | 2 | no |
| 🕳️ Mole | 200 | 3.1 | 28 | — | 1 | no |
| 👑 Sir Barksalot (mini boss, wave 5) | 1200 | 1.7 | 110 | 8 | 3 | no |
| 👑 The Rat King (boss, wave 10) | 6000 | 1.5 | 300 | 10 | 9 | no |
| 🍌 Baron Bananas (mini boss, wave 15) | 5200 | 2.2 | 260 | 12 | 4 | no |
| 🐉 Sophie (final boss, wave 20) | 24000 | 0.6 | 1000 | 18 | 9 | **yes** |
| 🦋 Flutterling | 620 | 3.4 | 42 | 4 | 1 | **yes** |
| 🦋 Emilija (final boss, wave 30) | 52000 | 0.55 | 1600 | 22 | 9 | **yes** |
| 💪 Gym Rat | 900 | 3.6 | 46 | 10 | 2 | no |
| 🧶 Grandma Vera (mini boss, waves 35 & 45) | 14000 | 1.9 | 450 | 14 | 4 | no |
| 🤸 Simona the Gymnast (boss, wave 40) | 96000 | 2.0 | 2100 | 20 | 9 | no |
| 🤸 Simona (clone) | 40000 | 2.2 | 320 | 12 | 3 | no |
| 🏀 Stefo the Baller (boss, wave 40) | 120000 | — (never walks) | 3000 | 24 | 9 | no |
| 💥 Father (final boss, wave 50) | 260000 | 1.1 | 6000 | 30 | 9 | no |

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
The first flying enemy, and the cheap one. It ignores the walking path entirely
and flies straight over your maze, so only cats with air targeting — Archer,
Wizard, Frost, or a Ninja on the **Shadow Step** path — can touch it. It arrives
on wave 4 and every wave after that carries *some* air, so an anti-air cat is
never a wasted purchase.

### 🌟 Golden Mouse
A bonus enemy: from wave 2 onwards there is a 75% chance one sneaks in at a
random point in the wave. It is the fastest thing in the game (speed 6.4) and
pays out 45 🐟, but it costs **no lives** if it escapes — it just gets away.

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
but it is far slower (2.2) and *far* tougher — 320 HP and 3 armour. The pig is
the middle rung of the air ladder (🐦 bird → 🐖 pig → 🦋 flutterling): birds
stop being scary long before the barnyard opens, so from wave 11 on the pig is
what actually tests whether you bought anti-air.

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

### 💉 Nurse Hazel
A medic in a little white coat. Every 3.4 s she heals **every other pest within
5.2 tiles for 30 HP** (never herself, never above their maximum), which quietly
undoes chip damage across a whole group. *Counter:* kill her first — she is soft
— or bring burst damage (Wizard, Ninja) that outruns the heal. A Witch curse
turns her into a harmless Frog.

### 🛡️ Shield Beetle
Wears a shimmering blue barrier worth **260 points of damage on top of its 190
HP and 4 armour**. Damage eats the shield before it touches health, and if the
beetle goes **4 seconds without being hit the shield regenerates at 45/s** —
the bubble visibly fades back in as it recharges. *Counter:* sustained fire.
Anything that keeps hitting it stops the regeneration; slow single-shot setups
will never break through.

### 🕳️ Mole
Dives underground every 3.6 s for 2.2 s. While burrowed it is **completely
untargetable and immune to damage, curses and splashes**, and it moves at speed
2.1 instead of 3.1 — a little slower, but unstoppable. *Counter:* depth. Because
you cannot burst it in one spot, spread your damage along the lane so it is shot
every time it surfaces, and use Frost to keep it in range longer.

### 🐉 Sophie — final boss (wave 20)
A dragon with 24000 HP and 18 armour who **flies** straight for the bowl, so
ground-only cats cannot touch her. She arrives in a cinematic entrance —
*"SOPHIE HAS DESCENDED"* — swooping out of the night sky trailing fire before
she levels out above the kitchen. She has three abilities (`DRAGON` in
`config.js`):

- **Fire breath, every 10 s** — she burns one random cat to ash. The tower is
  destroyed, no refund. 👑 Mimi-chan is the one exception: even a dragon knows
  better than to aim at the queen. Cats covered by a 🛡️ Regent's ward survive
  the first breath aimed at them, and any cat that has walked a royal path
  cannot be burned at all.
- **Swarm, every 20 s** — she summons two chicks, a chicken, two mice and a
  snake next to herself.
- **Old friends** — at **75%** HP she calls back 🐶 Sir Barksalot, at **50%**
  👑 The Rat King and at **25%** 🍌 Baron Bananas, each at 45% of their usual
  health. Summons keep all of their own abilities but never steal her boss bar.

Summoned pests are dropped onto the nearest point of their lane, clamped to the
first 55% of the route, so Sophie can never teleport a boss next to the bowl.

### 🦋 Flutterling
A small butterfly, and the only hint that something is coming: a handful scout
the kitchen in waves 27 and 29 before their mother arrives. 620 HP, 4 armour and
**flying**, so ground-only cats never touch them. Emilija also splits three off
her own wings during the wave-30 fight.

### 🦋 Emilija — final boss (wave 30)
An enormous butterfly with 52000 HP and 22 armour who **flies** straight for the
bowl. She arrives in her own cinematic — *"EMILIJA UNFOLDS"* — gliding down a
spiral of glitter. She never damages a cat. Instead, **every 13 seconds**
(`EMILIJA.ability`) she plays one of three tricks, chosen at random but never
the same one twice in a row:

- **🌪️ Shuffle** — every cat swaps tiles with another cat. Nobody keeps their
  own tile, nothing is sold, nothing is lost — but squads, Ema's ribbon and
  Sofija's purse are all recalculated around the new layout. 👑 Mimi-chan works
  on the whole board, so she is never moved.
- **💤 Sleep** — a third of your cats (rounded up, never the whole army) fall
  asleep and stop shooting **until her next trick**, i.e. 13 seconds. Sleeping
  cats snore blue Zs; the two disruptive tricks can never stack. A 👑 Empress
  never sleeps.
- **🦋 Children** — three 🦋 Flutterlings peel off her wings next to her and fly
  for the milk.

*Counter:* build redundancy instead of one perfect corner. A single stacked kill
zone is worthless the moment it is shuffled somewhere else, and 👑 Mimi-chan
works on the whole board no matter where she wakes up — and on the 👑 Empress
path she does not even nap.

### 💪 Gym Rat
A mouse that never skipped leg day: 900 HP, 10 armour and speed 3.6, and it
costs **2 lives** if it gets through. It shows up from wave 31 onwards in
growing packs and is the workhorse pest of the last twenty waves.

### 🧶 Grandma Vera — mini boss (waves 35 and 45)
14000 HP, 14 armour, and two jobs at once. Every **3.6 s** she heals every pest
within 6.4 units for 260 HP (never herself), and every **5 s** she throws
**two balls of wool** at two different cats, tangling each one for 3 seconds —
exactly like a monkey's banana, but pink. Leaks 4 lives, always drops catnip.

### 🤸 Simona the Gymnast — boss (wave 40)
96000 HP and 20 armour, and she cartwheels in for her own cinematic —
*"SIMONA TAKES THE FLOOR"*. Her script lives in `SIMONA` in `js/config.js`:

- **Clones (every 14 s)** — she splits off a copy of herself with 55% of her
  maximum health, and the copy starts at **exactly her current health
  fraction**: a Simona at 90% health makes a copy at 90% health. Copies do
  everything she does, including cloning themselves, up to **4 at a time**.
- **⭐ Star jump (every 9 s)** — she flips **3 tiles** further down her lane in
  an instant. It is clamped so a star jump can never carry her into the bowl.
- **🤾 Handstand (every 12 s)** — she stops dead for 3.2 s and takes **90% less
  damage** while she is upside down. Do not waste your burst on it.

*Counter:* kill the copies fast — the longer a healthy Simona lives, the
healthier the next generation is. Save Simba-kun's bushido and Sleepy's pillow
for the moment she comes down off her hands.

### 🏀 Stefo the Baller — boss (wave 40)
Simona's brother. He does not spawn from a door: he **checks in the moment
Simona dies** (`ENEMIES.simona.successor`). 120000 HP and 24 armour, and he
completely ignores the rules of the lane — he is `stationary: true` and never
walks anywhere:

- **Teleport (every 6.5 s)** — he blinks to a different free tile anywhere on
  the board, and never twice to the same one in a row.
- **🏀 Baskets (every 4.5 s)** — he lobs a basketball straight at the milk bowl.
  Every ball that lands costs **1 life**, no matter what your maze looks like.

*Counter:* he is a clock, not a race. Your cats must reach him wherever he lands,
so spread out coverage instead of one deep kill corner.

### 💥 Father — final boss (wave 50)
The head of the family: 260000 HP, 30 armour and speed 1.1. He crashes down out
of the sky, and **the landing destroys 50% of every cat on the board** — an
unspecialised queen included. From then on he flattens one more cat every
**12 seconds**.

**"I AM THE BOSS."** The first time his health hits zero he does not die: he
**heals back to full** and destroys **75% of the cats that are left**
(50% × 1.5, `reviveFraction`). The second time he goes down, he stays down —
and the game is over.

*Counter:* do not put your whole fortune on the board before he lands. Keep 🐟
in the bank, rebuild after the crash, and rebuild again after the revive. A
specialised 👑 Mimi-chan is the one thing he can never touch, and a 🛡️ Regent's
ward buys one free save for every cat standing around her (see
[`cats.md`](cats.md)).

## Shared mechanics

- **Wave HP scaling** — every enemy's HP is multiplied by `hpScale(wave)`:
  `1 + 0.17 × (wave - 1)` for waves 1–10 (unchanged), then a gentler
  `1 + 0.17 × 9 + 0.09 × (wave - 10)` for waves 11–30, because the barnyard
  pests already arrive with far more health and armour of their own, and a
  steeper `+0.16` per wave from wave 31 on, where the family's pests take over. Bosses
  ignore the scale entirely and use their flat HP.
- **Bounty scaling** — the payout is `bounty × bountyScale(wave)`. Waves 1–5
  pay face value (`BOUNTY_FULL_WAVE`), then every pest is worth `0.008` less per
  wave (`BOUNTY_DECAY`) down to a floor of `0.6` (`BOUNTY_FLOOR`) — roughly
  `0.64×` by wave 50. Late waves already pay far more simply by sending five to
  ten times as many pests, so the per-pest payout *decays* instead of ramping.
- **Boss and golden payouts** — every boss, mini-boss and the 🪙 Golden Mouse has
  its listed bounty halved (`BOSS_BOUNTY_CUT`). They were the tallest spikes in
  the income curve. Ordinary pests are untouched.
- **Wave-clear bonus** — `waveBonus()` is a flat `70` (`WAVE_BONUS`). It used to
  climb to 495, which made it a second income curve on top of the bounties.
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
- **Healing** — Nurse Hazel restores HP to nearby pests (never herself, capped
  at their maximum).
- **Shields** — the Shield Beetle's barrier absorbs damage before health and
  regenerates after `shieldDelay` seconds without a hit.
- **Burrowing** — a burrowed Mole cannot be targeted, damaged or cursed.
- **Cats can be attacked** — bananas disable a cat for 3 seconds; Sophie's fire
  destroys one outright; Emilija shuffles cats around the board and puts a third
  of them to sleep for 13 seconds. These are the only ways the pests fight back.

## Waves

| # | Name | Contents |
| --- | --- | --- |
| 1 | Squeaky Beginnings | **mice** |
| 2 | Snakes in the Pantry | mice, **snakes** |
| 3 | Bad Dog | mice, **dogs** |
| 4 | First Flight | **birds**, mice, snakes |
| 5 | MINI BOSS: Sir Barksalot | **Sir Barksalot**, mice, snakes, birds |
| 6 | The Kennel Opens | dogs, snakes, birds |
| 7 | Feathers and Fangs | birds, snakes, dogs |
| 8 | Stampede | mice, dogs, birds |
| 9 | Everything At Once | dogs, birds, snakes, mice |
| 10 | FINAL BOSS: The Rat King | **The Rat King**, dogs, birds, snakes |
| 11 | The Second Door | **chickens**, **flying pigs**, mice, snakes |
| 12 | Shell Wall | **turtles**, **shield beetles**, birds, chickens, flying pigs |
| 13 | Hoofbeats | **horses**, **moles**, dogs, flying pigs |
| 14 | Monkey Business | **monkeys**, **nurses**, chickens, turtles, flying pigs |
| 15 | MINI BOSS: Baron Bananas | **Baron Bananas**, nurses, monkeys, chickens, horses, flying pigs |
| 16 | Barnyard Riot | chickens, horses, moles, flying pigs, monkeys, nurses |
| 17 | Armoured Parade | turtles, shield beetles, dogs, horses, nurses, flying pigs |
| 18 | Sky Bacon | flying pigs, birds, moles, monkeys, chickens, shield beetles |
| 19 | Everything, Twice | horses, turtles, flying pigs, monkeys, chickens, dogs, nurses, shield beetles, moles |
| 20 | FINAL BOSS: Sophie the Dragon | **Sophie**, chickens, horses, flying pigs, turtles, monkeys, nurses, shield beetles, moles |
| 21 | After the Ashes | mice, snakes, dogs, birds, chickens, flying pigs |
| 22 | Iron Hooves | horses, turtles, shield beetles, nurses, flying pigs |
| 23 | The Nursery | nurses, shield beetles, moles, monkeys, chickens, flying pigs |
| 24 | Sky Full of Trouble | birds, flying pigs, monkeys, horses, turtles |
| 25 | MINI BOSSES: The Terrible Two | **Sir Barksalot**, **Baron Bananas**, dogs, monkeys, nurses, horses, chickens, flying pigs |
| 26 | Shell Shock | turtles, shield beetles, moles, dogs, nurses, flying pigs |
| 27 | First Flutter | **flutterlings**, birds, flying pigs, horses, monkeys, shield beetles |
| 28 | Barnyard Apocalypse | chickens, horses, flying pigs, monkeys, turtles, moles, nurses, shield beetles |
| 29 | The Calm Before Wings | flutterlings, snakes, dogs, birds, horses, turtles, nurses |
| 30 | FINAL BOSS: Emilija the Butterfly | **Emilija**, flutterlings, birds, horses, turtles, shield beetles, nurses, monkeys, moles |
| 31 | Training Day | **gym rats**, horses, birds, shield beetles, flying pigs |
| 32 | The Gym Opens | gym rats, turtles, monkeys, nurses, moles, flying pigs |
| 33 | Wool and Fangs | dogs, gym rats, flutterlings, flying pigs, chickens |
| 34 | Chalk Dust | horses, gym rats, shield beetles, nurses, birds, turtles, flying pigs |
| 35 | MINI BOSS: Grandma Vera | **Grandma Vera**, gym rats, nurses, dogs, monkeys, chickens, flying pigs |
| 36 | Knitting Circle | nurses, gym rats, shield beetles, moles, turtles, flutterlings |
| 37 | Sprint Drills | horses, snakes, gym rats, chickens, monkeys, flying pigs, flutterlings |
| 38 | Feathers in the Rafters | birds, flying pigs, flutterlings, gym rats, nurses, shield beetles |
| 39 | The Bench Press | turtles, shield beetles, gym rats, dogs, horses, nurses, flying pigs, flutterlings |
| 40 | FINAL BOSS: Simona the Gymnast | **Simona the Gymnast**, gym rats, horses, flutterlings, nurses, shield beetles, turtles, birds, monkeys |
| 41 | Overtime | gym rats, horses, dogs, birds, chickens, nurses, flying pigs |
| 42 | Full-Court Press | shield beetles, turtles, gym rats, moles, monkeys, flying pigs, flutterlings |
| 43 | Family Reunion | flutterlings, gym rats, horses, nurses, dogs, birds |
| 44 | The Long Bench | turtles, shield beetles, gym rats, monkeys, moles, nurses, flying pigs, flutterlings |
| 45 | MINI BOSSES: The Family Gathers | **Grandma Vera**, **Sir Barksalot**, **Baron Bananas**, gym rats, horses, nurses, shield beetles, chickens, flying pigs, flutterlings |
| 46 | House Rules | gym rats, dogs, flutterlings, flying pigs, turtles, nurses |
| 47 | Whistle Drill | horses, snakes, gym rats, chickens, birds, monkeys, flying pigs |
| 48 | The Last Barnyard | chickens, flying pigs, monkeys, turtles, moles, shield beetles, gym rats, flutterlings |
| 49 | Silence Before Father | flutterlings, gym rats, horses, dogs, nurses, shield beetles, turtles, birds |
| 50 | FINAL BOSS: Father | **Father**, gym rats, horses, shield beetles, nurses, turtles, flutterlings, monkeys, chickens, dogs |

Waves 1–20 are unchanged; every wave from 11 on uses both lanes. Wave 25 sends
two mini-bosses at once and wave 45 sends **three**. Wave 40 is the only wave
with two main bosses: Stefo only appears once Simona has fallen. Wave 50 is the
last wave in the game.

You start with 9 lives (`START_LIVES`) and 260 🐟 (`START_GOLD`).

**Lives come back.** Killing a **main boss** — the Rat King (10), Sophie (20),
Emilija (30), Simona and Stefo (40) and Father (50) — refills the milk bowl by
`BOSS_LIFE_REWARD` (1 life), never above the nine you started with. Mini-bosses
and ordinary pests give nothing back, and a run that has already hit zero stays
lost. This is the only way to regain a life, so a bad wave in the middle of a
run is a setback instead of a silent death sentence.

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
| `nurse` | Nurse Hazel | Sestra Lejla |
| `beetle` | Shield Beetle | Buba sa štitom |
| `mole` | Mole | Krtica |
| `dragon` | Sophie | Sofi |
| `emilija` | Emilija | Emilija |
| `flutterling` | Flutterling | Leptirić |
| `gymrat` | Gym Rat | Teretanski pacov |
| `granny` | Grandma Vera | Baka Vera |
| `simona` | Simona the Gymnast | Simona gimnastičarka |
| `simonaclone` | Simona (copy) | Simona (kopija) |
| `stefo` | Stefo the Baller | Stefo košarkaš |
| `father` | Father | Tata |
