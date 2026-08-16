import { Game } from './game.js';
import { initAudio } from './audio.js';

const $ = (id) => document.getElementById(id);

const ui = {
  hpFill: $('hp-fill'), hpText: $('hp-text'),
  manaFill: $('mana-fill'), manaText: $('mana-text'),
  waveText: $('wave-text'), scoreText: $('score-text'),
  toastEl: $('toast'), frenzyEl: $('frenzy-banner'),
  bossBar: $('boss-bar'), bossFill: $('boss-fill'),
  buttons: {
    claw: $('btn-claw'),
    hairball: $('btn-hairball'),
    thunder: $('btn-thunder'),
  },

  setHP(hp, max) {
    this.hpFill.style.width = `${Math.max(0, (hp / max) * 100)}%`;
    this.hpText.textContent = `${Math.max(0, Math.round(hp))} / ${max}`;
  },
  setMana(m, max) {
    this.manaFill.style.width = `${(m / max) * 100}%`;
    this.manaText.textContent = String(Math.round(m));
  },
  setWave(n) { this.waveText.textContent = `Wave ${n}`; },
  setScore(n) { this.scoreText.textContent = `${n} 🐭`; },
  setCooldowns(cd, mana, CONFIG) {
    for (const [name, key] of [['claw', 'claw'], ['hairball', 'hairball'], ['thunder', 'thunder']]) {
      const btn = this.buttons[name];
      const total = CONFIG[key].cd;
      const pct = Math.max(0, cd[key] / total) * 100;
      btn.querySelector('.cd').style.height = `${pct}%`;
      const cost = CONFIG[key].cost || 0;
      btn.classList.toggle('dim', mana < cost);
    }
  },
  toast(text) {
    this.toastEl.textContent = text;
    this.toastEl.classList.remove('show');
    void this.toastEl.offsetWidth;
    this.toastEl.classList.add('show');
  },
  frenzy(on) { this.frenzyEl.classList.toggle('hidden', !on); },
  boss(ratio) {
    this.bossBar.classList.toggle('hidden', ratio == null);
    if (ratio != null) this.bossFill.style.width = `${Math.max(0, ratio) * 100}%`;
  },
  hitFlash() {
    document.body.classList.remove('hit');
    void document.body.offsetWidth;
    document.body.classList.add('hit');
    setTimeout(() => document.body.classList.remove('hit'), 320);
  },
  gameOver(score, wave) {
    const best = Math.max(score, Number(localStorage.getItem('ww-best') || 0));
    localStorage.setItem('ww-best', String(best));
    $('go-score').textContent = String(score);
    $('go-wave').textContent = String(wave);
    $('go-best').textContent = String(best);
    $('go-title').textContent = wave >= 10 ? 'Legendary cat' : 'Out of lives';
    $('go-sub').textContent = pickTaunt(wave);
    show('gameover');
  },
};

const TAUNTS = [
  'The mice have claimed the rug.',
  'They took your favourite sunbeam.',
  'Somewhere, a mouse is wearing your collar.',
  'Nine lives spent. Worth it.',
  'You knocked things off tables. It was not enough.',
];
function pickTaunt(wave) {
  if (wave >= 10) return 'Songs will be squeaked about this day.';
  return TAUNTS[Math.floor(Math.random() * TAUNTS.length)];
}

const screens = ['title', 'help', 'gameover', 'loading'];
function show(name) {
  for (const s of screens) $(s).classList.toggle('hidden', s !== name);
  const playing = name === null;
  $('hud').classList.toggle('hidden', !playing);
  $('controls').classList.toggle('hidden', !playing);
}

let game;
try {
  game = new Game($('scene'), ui);
} catch (err) {
  $('loading').innerHTML = '<div class="panel"><h2>WebGL unavailable</h2><p class="tag">This game needs WebGL. Try another browser.</p></div>';
  throw err;
}

show('title');
// Handy for debugging in the browser console.
window.game = game;

function startGame() {
  initAudio();
  show(null);
  game.start();
}

$('btn-play').addEventListener('click', startGame);
$('btn-again').addEventListener('click', startGame);
$('btn-help').addEventListener('click', () => show('help'));
$('btn-help-back').addEventListener('click', () => show('title'));

document.addEventListener('visibilitychange', () => {
  if (document.hidden && game) game.input.reset();
});
// Block accidental page zoom / scroll on iOS while playing.
document.addEventListener('gesturestart', (e) => e.preventDefault());
document.addEventListener('dblclick', (e) => e.preventDefault(), { passive: false });
