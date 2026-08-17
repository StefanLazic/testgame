// ---------------------------------------------------------------------------
// Localisation. Every string the player can read lives here, in English and in
// Serbian (Latin script). Use t('some.key') everywhere instead of a literal.
//
// Keys with {placeholders} are filled from the params object:
//   t('toast.sold', { gold: 42 })
// ---------------------------------------------------------------------------

export const LANGS = ['sr', 'en'];
const STORE_KEY = 'cd-lang';

const STRINGS = {
  en: {
    'lang.name': 'English',
    'lang.switch': 'Srpski',

    'meta.title': 'Claw Defense — Cat Tower Defense',
    'meta.description': 'A 3D mobile tower defense game: place cat towers — archer, wizard, frost, ninja, sleepy, witch and Queen Mimi-chan — to stop waves of mice, dogs, snakes and birds.',

    'title.tagline': 'Seven cats. Ten waves. One bowl of milk to protect.',
    'title.play': 'Play',
    'title.help': 'How to play',
    'title.hint': 'Built for phones — tap a cat, tap the floor, watch the mice regret everything.',

    'help.heading': 'How to play',
    'help.place': '<b>Place cats:</b> tap a cat in the shop, then tap any free floor tile.',
    'help.fish': '<b>Earn fish 🐟:</b> from every pest you stop and a bonus after each wave. Start a wave early for extra fish.',
    'help.upgrade': '<b>Upgrade:</b> tap a placed cat to upgrade or sell it (sell refunds 70%).',
    'help.milk': '<b>Protect the milk 🥛:</b> every pest that reaches it costs a life. Nine lives, no more.',
    'help.sky': '<b>Watch the sky:</b> 🐦 birds fly straight over your maze — only some cats can hit them.',
    'help.curses': '<b>Curses:</b> 🧙 the Witch hexes one pest a minute — frog, then stone, then dust. Bosses shrug it off.',
    'help.queen': '<b>Her Majesty:</b> 👑 Mimi-chan costs a fortune, but every 10 s the whole board stops to bow.',
    'help.bosses': '<b>Wave 5 &amp; 10:</b> a mini-boss and then something much, much worse.',
    'help.back': 'Got it',

    'hud.speed': 'Game speed',
    'hud.boss': 'BOSS',
    'hud.upgrade': 'Upgrade',
    'hud.sell': 'Sell',
    'hud.close': 'Close panel',
    'hud.startWave': 'Start wave',
    'hud.startWaveIn': 'Start wave {sec}s',
    'hud.waveRunning': 'Wave in progress',
    'hud.wave': '{n} / {total}',
    'hud.level': 'Lv {n}',
    'hud.max': 'MAX',
    'hud.catSuffix': '{name} Cat',
    'hud.stats': '⚔️ {damage} dmg · 🎯 {range} range · ⏱ {rate}/s',

    'loading.text': 'Waking the cats…',
    'error.webgl.title': 'WebGL unavailable',
    'error.webgl.text': 'This game needs WebGL. Try another browser.',
    'error.noscript': 'This game needs JavaScript and WebGL.',

    'over.wonTitle': '👑 Kitchen defended!',
    'over.wonSub': 'The Rat King has abdicated. The cats nap in triumph.',
    'over.lostTitle': 'The milk is gone',
    'over.wavesHeld': 'waves held',
    'over.pestsStopped': 'pests stopped',
    'over.bestWave': 'best wave',
    'over.again': 'Again!',
    'over.taunt.close': 'So close. The Rat King smiles.',
    'over.taunt.0': 'The pests have taken the kitchen.',
    'over.taunt.1': 'Somewhere, a dog is drinking your milk.',
    'over.taunt.2': 'The mice left a thank-you note.',
    'over.taunt.3': 'Your cats are pretending this never happened.',
    'over.taunt.4': 'A snake is now living in the cutlery drawer.',

    'toast.poor': 'Not enough fish',
    'toast.blocked': 'Can’t build on the path',
    'toast.build': 'Build your defense!',
    'toast.sold': 'Sold for 🐟 {gold}',
    'toast.early': 'Early bird: +🐟 {gold}',
    'toast.waveClear': 'Wave cleared! +🐟 {gold}',
    'toast.warnMini': '⚠️ Wave 5: a mini-boss is coming',
    'toast.warnFinal': '⚠️ Wave 10: THE RAT KING approaches',
    'toast.bossDown': '{name} defeated! +🐟 {gold}',
    'toast.golden': 'Golden mouse! +🐟 {gold}',
    'toast.goldenGone': 'The golden mouse got away!',
    'toast.catnipDrop': '🌿 Catnip! Tap it!',
    'toast.catnipFrenzy': '🌿 CATNIP FRENZY — double speed claws!',
    'toast.enraged': '👑 The Rat King is ENRAGED!',
    'toast.howl': '🐶 Sir Barksalot howls — the pack speeds up!',
    'toast.curseFrog': '🐸 Cursed! It is a frog now.',
    'toast.curseStone': '🗿 Petrified for {sec}s!',
    'toast.curseDoom': '💀 The witch says no.',
    'toast.bow': '👑 Mimi-chan demands a bow!',

    'banner.wave': 'Wave {n}',
    'banner.finalBoss': '👑 THE RAT KING',
    'banner.miniBoss': '🐶 MINI BOSS',

    'ability.curse': '{icon} Curse: {text} · every {cooldown}s · {left}s left',
    'ability.bow': '🙇 Bow: every pest stops for {stun}s · every {cooldown}s',

    'tower.archer.name': 'Archer',
    'tower.archer.blurb': 'Reliable single-target shots. Hits air.',
    'tower.wizard.name': 'Wizard',
    'tower.wizard.blurb': 'Arcane orbs that explode on impact. Hits air.',
    'tower.frost.name': 'Frost',
    'tower.frost.blurb': 'Single-target chill that slows one pest. Hits air.',
    'tower.ninja.name': 'Ninja',
    'tower.ninja.blurb': 'Blinding fast shuriken, ground only. Crits hurt.',
    'tower.sleepy.name': 'Sleepy',
    'tower.sleepy.blurb': 'Yawns, then lobs a pillow. Huge splash, very slow, ground only.',
    'tower.witch.name': 'Witch',
    'tower.witch.blurb': 'Curses one pest every 60 s. Bosses are immune.',
    'tower.queen.name': 'Mimi-chan',
    'tower.queen.blurb': 'Her Majesty. Every 10 s every pest on the board stops to bow.',

    'curse.1.label': 'Frog',
    'curse.1.text': 'turns a pest into a harmless frog',
    'curse.2.label': 'Stone',
    'curse.2.text': 'petrifies a pest for 10 s',
    'curse.3.label': 'Doom',
    'curse.3.text': 'destroys a pest instantly',

    'enemy.frog.name': 'Frog',
    'enemy.mouse.name': 'Mouse',
    'enemy.snake.name': 'Snake',
    'enemy.dog.name': 'Dog',
    'enemy.bird.name': 'Bird',
    'enemy.golden.name': 'Golden Mouse',
    'enemy.baron.name': 'Sir Barksalot',
    'enemy.ratking.name': 'The Rat King',

    'wave.1.name': 'Squeaky Beginnings',
    'wave.2.name': 'Snakes in the Pantry',
    'wave.3.name': 'Bad Dog',
    'wave.4.name': 'First Flight',
    'wave.5.name': 'MINI BOSS: Sir Barksalot',
    'wave.6.name': 'The Kennel Opens',
    'wave.7.name': 'Feathers and Fangs',
    'wave.8.name': 'Stampede',
    'wave.9.name': 'Everything At Once',
    'wave.10.name': 'FINAL BOSS: The Rat King',
  },

  sr: {
    'lang.name': 'Srpski',
    'lang.switch': 'English',

    'meta.title': 'Claw Defense — Mačja odbrana kule',
    'meta.description': '3D mobilna igra odbrane kule: postavljaj mačke — strelca, čarobnjaka, ledenu, nindžu, pospanu, vešticu i kraljicu Mimi-čan — da zaustaviš talase miševa, pasa, zmija i ptica.',

    'title.tagline': 'Sedam mačaka. Deset talasa. Jedna činija mleka koju treba odbraniti.',
    'title.play': 'Igraj',
    'title.help': 'Kako se igra',
    'title.hint': 'Pravljeno za telefone — dodirni mačku, dodirni pod i gledaj kako se miševi kaju.',

    'help.heading': 'Kako se igra',
    'help.place': '<b>Postavi mačke:</b> dodirni mačku u prodavnici, pa dodirni slobodno polje na podu.',
    'help.fish': '<b>Zaradi ribe 🐟:</b> od svake zaustavljene štetočine i kao bonus posle svakog talasa. Pokreni talas ranije za dodatne ribe.',
    'help.upgrade': '<b>Unapredi:</b> dodirni postavljenu mačku da je unaprediš ili prodaš (prodaja vraća 70%).',
    'help.milk': '<b>Čuvaj mleko 🥛:</b> svaka štetočina koja stigne do njega uzima jedan život. Devet života, ni jedan više.',
    'help.sky': '<b>Pazi na nebo:</b> 🐦 ptice lete pravo preko lavirinta — samo neke mačke mogu da ih pogode.',
    'help.curses': '<b>Kletve:</b> 🧙 veštica ureče jednu štetočinu u minutu — prvo žaba, pa kamen, pa prah. Bosovi su imuni.',
    'help.queen': '<b>Njeno visočanstvo:</b> 👑 Mimi-čan košta bogatstvo, ali na svakih 10 s cela tabla staje da se pokloni.',
    'help.bosses': '<b>Talas 5 i 10:</b> mini-bos, a zatim nešto mnogo, mnogo gore.',
    'help.back': 'Jasno mi je',

    'hud.speed': 'Brzina igre',
    'hud.boss': 'BOS',
    'hud.upgrade': 'Unapredi',
    'hud.sell': 'Prodaj',
    'hud.close': 'Zatvori panel',
    'hud.startWave': 'Pokreni talas',
    'hud.startWaveIn': 'Pokreni talas {sec}s',
    'hud.waveRunning': 'Talas u toku',
    'hud.wave': '{n} / {total}',
    'hud.level': 'Niv {n}',
    'hud.max': 'MAKS',
    'hud.catSuffix': '{name} 🐱',
    'hud.stats': '⚔️ {damage} štete · 🎯 {range} domet · ⏱ {rate}/s',

    'loading.text': 'Budimo mačke…',
    'error.webgl.title': 'WebGL nije dostupan',
    'error.webgl.text': 'Ovoj igri treba WebGL. Probaj drugi pregledač.',
    'error.noscript': 'Ovoj igri trebaju JavaScript i WebGL.',

    'over.wonTitle': '👑 Kuhinja je odbranjena!',
    'over.wonSub': 'Pacovski kralj je abdicirao. Mačke dremaju u slavlju.',
    'over.lostTitle': 'Mleka više nema',
    'over.wavesHeld': 'odbranjenih talasa',
    'over.pestsStopped': 'zaustavljenih štetočina',
    'over.bestWave': 'najbolji talas',
    'over.again': 'Ponovo!',
    'over.taunt.close': 'Tako blizu. Pacovski kralj se smeška.',
    'over.taunt.0': 'Štetočine su zauzele kuhinju.',
    'over.taunt.1': 'Negde upravo sada pas pije tvoje mleko.',
    'over.taunt.2': 'Miševi su ostavili poruku sa zahvalnicom.',
    'over.taunt.3': 'Tvoje mačke se prave da se ovo nikada nije desilo.',
    'over.taunt.4': 'U fioci sa priborom sada živi zmija.',

    'toast.poor': 'Nemaš dovoljno riba',
    'toast.blocked': 'Ne može da se gradi na stazi',
    'toast.build': 'Napravi odbranu!',
    'toast.sold': 'Prodato za 🐟 {gold}',
    'toast.early': 'Ranoranilac: +🐟 {gold}',
    'toast.waveClear': 'Talas očišćen! +🐟 {gold}',
    'toast.warnMini': '⚠️ Talas 5: stiže mini-bos',
    'toast.warnFinal': '⚠️ Talas 10: PACOVSKI KRALJ se približava',
    'toast.bossDown': '{name} je poražen! +🐟 {gold}',
    'toast.golden': 'Zlatni miš! +🐟 {gold}',
    'toast.goldenGone': 'Zlatni miš je pobegao!',
    'toast.catnipDrop': '🌿 Mačja trava! Dodirni je!',
    'toast.catnipFrenzy': '🌿 LUDILO OD MAČJE TRAVE — duplo brže šape!',
    'toast.enraged': '👑 Pacovski kralj je POBESNEO!',
    'toast.howl': '🐶 Ser Lajavko zavija — čopor ubrzava!',
    'toast.curseFrog': '🐸 Ureknuto! Sada je žaba.',
    'toast.curseStone': '🗿 Skamenjeno na {sec}s!',
    'toast.curseDoom': '💀 Veštica kaže ne.',
    'toast.bow': '👑 Mimi-čan traži naklon!',

    'banner.wave': 'Talas {n}',
    'banner.finalBoss': '👑 PACOVSKI KRALJ',
    'banner.miniBoss': '🐶 MINI-BOS',

    'ability.curse': '{icon} Kletva: {text} · na svakih {cooldown}s · još {left}s',
    'ability.bow': '🙇 Naklon: svaka štetočina staje {stun}s · na svakih {cooldown}s',

    'tower.archer.name': 'Strelac',
    'tower.archer.blurb': 'Pouzdani pojedinačni pogoci. Gađa i vazduh.',
    'tower.wizard.name': 'Čarobnjak',
    'tower.wizard.blurb': 'Magične kugle koje eksplodiraju pri udaru. Gađa i vazduh.',
    'tower.frost.name': 'Ledena',
    'tower.frost.blurb': 'Hladnoća koja usporava jednu štetočinu. Gađa i vazduh.',
    'tower.ninja.name': 'Nindža',
    'tower.ninja.blurb': 'Munjevite zvezdice, samo po zemlji. Kritični pogoci bole.',
    'tower.sleepy.name': 'Pospana',
    'tower.sleepy.blurb': 'Zevne, pa baci jastuk. Ogroman domet eksplozije, vrlo sporo, samo zemlja.',
    'tower.witch.name': 'Veštica',
    'tower.witch.blurb': 'Ureče jednu štetočinu na svakih 60 s. Bosovi su imuni.',
    'tower.queen.name': 'Mimi-čan',
    'tower.queen.blurb': 'Njeno visočanstvo. Na svakih 10 s se cela tabla klanja.',

    'curse.1.label': 'Žaba',
    'curse.1.text': 'pretvara štetočinu u bezopasnu žabu',
    'curse.2.label': 'Kamen',
    'curse.2.text': 'kameni štetočinu na 10 s',
    'curse.3.label': 'Propast',
    'curse.3.text': 'trenutno uništava štetočinu',

    'enemy.frog.name': 'Žaba',
    'enemy.mouse.name': 'Miš',
    'enemy.snake.name': 'Zmija',
    'enemy.dog.name': 'Pas',
    'enemy.bird.name': 'Ptica',
    'enemy.golden.name': 'Zlatni miš',
    'enemy.baron.name': 'Ser Lajavko',
    'enemy.ratking.name': 'Pacovski kralj',

    'wave.1.name': 'Cijukavi počeci',
    'wave.2.name': 'Zmije u ostavi',
    'wave.3.name': 'Zli pas',
    'wave.4.name': 'Prvi let',
    'wave.5.name': 'MINI-BOS: Ser Lajavko',
    'wave.6.name': 'Odškrinuta štenara',
    'wave.7.name': 'Perje i očnjaci',
    'wave.8.name': 'Stampedo',
    'wave.9.name': 'Sve odjednom',
    'wave.10.name': 'FINALNI BOS: Pacovski kralj',
  },
};

function detect() {
  try {
    const saved = localStorage.getItem(STORE_KEY);
    if (saved && LANGS.includes(saved)) return saved;
  } catch { /* private mode */ }
  return 'sr';
}

let lang = detect();
const listeners = new Set();

export function getLang() { return lang; }

export function setLang(next) {
  if (!LANGS.includes(next) || next === lang) return;
  lang = next;
  try { localStorage.setItem(STORE_KEY, lang); } catch { /* private mode */ }
  applyStatic();
  for (const fn of listeners) fn(lang);
}

export function toggleLang() { setLang(lang === 'sr' ? 'en' : 'sr'); }

export function onLangChange(fn) { listeners.add(fn); }

export function t(key, params) {
  const s = STRINGS[lang][key] ?? STRINGS.en[key] ?? key;
  if (!params) return s;
  return s.replace(/\{(\w+)\}/g, (m, k) => (k in params ? String(params[k]) : m));
}

// Translate everything marked up in index.html:
//   data-i18n       -> textContent
//   data-i18n-html  -> innerHTML (only for our own strings, never user input)
//   data-i18n-aria  -> aria-label
export function applyStatic(root = document) {
  document.documentElement.lang = lang === 'sr' ? 'sr-Latn' : 'en';
  document.title = t('meta.title');
  const desc = document.querySelector('meta[name="description"]');
  if (desc) desc.setAttribute('content', t('meta.description'));
  for (const el of root.querySelectorAll('[data-i18n]')) el.textContent = t(el.dataset.i18n);
  for (const el of root.querySelectorAll('[data-i18n-html]')) el.innerHTML = t(el.dataset.i18nHtml);
  for (const el of root.querySelectorAll('[data-i18n-aria]')) el.setAttribute('aria-label', t(el.dataset.i18nAria));
}
