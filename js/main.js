import { Game } from './game.js';
import { initAudio } from './audio.js';
import { TOWERS, TOWER_ORDER, WAVES } from './config.js';
import { t, toggleLang, onLangChange, applyStatic } from './i18n.js';

applyStatic();

const $ = (id) => document.getElementById(id);
const escapeHtml = (t) => String(t).replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
));

// --------------------------------------------------------------- shop row --
const shopRow = $('shop-row');
const shopButtons = {};
for (const kind of TOWER_ORDER) {
  const tw = TOWERS[kind];
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'tower-btn';
  btn.dataset.kind = kind;
  const label = () => {
    btn.innerHTML = `<span class="ic">${tw.icon}</span><span class="nm">${escapeHtml(t(`tower.${kind}.name`))}</span><span class="pr">🐟 ${tw.cost}</span>`;
  };
  label();
  onLangChange(label);
  btn.addEventListener('click', () => {
    game.setPlacing(game.placing === kind ? null : kind);
  });
  shopRow.appendChild(btn);
  shopButtons[kind] = btn;
}

// Hint that the shop scrolls when the seven cats don't all fit on screen.
const updateShopFade = () => {
  const overflow = shopRow.scrollWidth - shopRow.clientWidth;
  shopRow.classList.toggle('more', overflow > 4 && shopRow.scrollLeft < overflow - 4);
};
shopRow.addEventListener('scroll', updateShopFade, { passive: true });
window.addEventListener('resize', updateShopFade);
setTimeout(updateShopFade, 0);

// --------------------------------------------------------------------- ui --
const ui = {
  gold: 0,
  setGold(v, flash = false) {
    this.gold = v;
    $('gold-text').textContent = String(Math.round(v));
    if (flash) {
      const chip = $('gold-text').parentElement;
      chip.classList.remove('flash');
      void chip.offsetWidth;
      chip.classList.add('flash');
    }
    this.refreshShop();
  },
  setLives(v) { $('lives-text').textContent = String(v); },
  setWave(n) { $('wave-text').textContent = t('hud.wave', { n, total: WAVES.length }); },
  setSpeed(mult) { $('speed-text').textContent = `${mult}×`; },
  setPhase(phase, timeLeft) {
    const btn = $('btn-next');
    if (phase === 'prep') {
      btn.classList.remove('running');
      btn.firstChild.nodeValue = `${t('hud.startWaveIn', { sec: Math.max(0, Math.ceil(timeLeft)) })} `;
      $('next-bonus').textContent = `+🐟 ${Math.floor(Math.max(0, timeLeft) * 3)}`;
    } else {
      btn.classList.add('running');
      btn.firstChild.nodeValue = `${t('hud.waveRunning')} `;
      $('next-bonus').textContent = '';
    }
  },
  setPlacing(kind) {
    for (const k of TOWER_ORDER) shopButtons[k].classList.toggle('sel', k === kind);
  },
  refreshShop() {
    for (const k of TOWER_ORDER) shopButtons[k].classList.toggle('poor', this.gold < TOWERS[k].cost);
    if (this.towerInfo && game && game.selected) this.showTower(game._towerInfo(game.selected));
  },
  showTower(info) {
    this.towerInfo = info;
    const panel = $('tower-panel');
    panel.classList.toggle('hidden', !info);
    if (!info) return;
    $('tp-icon').textContent = info.icon;
    $('tp-name').textContent = info.global ? info.name : t('hud.catSuffix', { name: info.name });
    $('tp-level').textContent = info.maxed ? t('hud.max') : t('hud.level', { n: info.level });
    const stats = info.ability
      ? info.ability
      : t('hud.stats', { damage: info.damage, range: info.range, rate: info.rate });
    $('tp-stats').innerHTML = `${escapeHtml(stats)}<br><i>${escapeHtml(info.blurb)}</i>`;
    const up = $('btn-upgrade');
    up.classList.toggle('maxed', info.maxed);
    up.classList.toggle('poor', !info.canAfford);
    $('tp-upcost').textContent = info.maxed ? '' : `🐟 ${info.upCost}`;
    $('tp-sell').textContent = `🐟 ${info.sellValue}`;
  },
  toast(text) {
    const el = $('toast');
    el.textContent = text;
    el.classList.remove('show');
    void el.offsetWidth;
    el.classList.add('show');
  },
  banner(big, sub) {
    const el = $('wave-banner');
    el.innerHTML = `${escapeHtml(big)}<div style="font-size:0.45em;opacity:0.85;letter-spacing:1px">${escapeHtml(sub || '')}</div>`;
    el.classList.remove('hidden');
    void el.offsetWidth;
    el.style.animation = 'none';
    void el.offsetWidth;
    el.style.animation = '';
  },
  boss(ratio, name) {
    $('boss-bar').classList.toggle('hidden', ratio == null);
    if (ratio == null) return;
    if (name) $('boss-name').textContent = name;
    $('boss-fill').style.width = `${Math.max(0, ratio) * 100}%`;
  },
  hitFlash() {
    document.body.classList.remove('hit');
    void document.body.offsetWidth;
    document.body.classList.add('hit');
    setTimeout(() => document.body.classList.remove('hit'), 340);
  },
  gameOver(won, wave, kills) {
    const best = Math.max(wave, Number(localStorage.getItem('cd-best') || 0));
    localStorage.setItem('cd-best', String(best));
    $('go-wave').textContent = String(wave);
    $('go-kills').textContent = String(kills);
    $('go-best').textContent = String(best);
    $('go-title').textContent = won ? t('over.wonTitle') : t('over.lostTitle');
    $('go-sub').textContent = won ? t('over.wonSub') : pickTaunt(wave);
    setTimeout(() => show('gameover'), won ? 1400 : 900);
  },
};

const TAUNT_COUNT = 5;
const pickTaunt = (wave) => (wave >= 8
  ? t('over.taunt.close')
  : t(`over.taunt.${Math.floor(Math.random() * TAUNT_COUNT)}`));

// ---------------------------------------------------------------- screens --
const screens = ['title', 'help', 'gameover', 'loading'];
function show(name) {
  for (const s of screens) $(s).classList.toggle('hidden', s !== name);
  const playing = name === null;
  $('hud').classList.toggle('hidden', !playing);
}

let game;
try {
  game = new Game($('scene'), ui);
} catch (err) {
  $('loading').innerHTML = `<div class="panel"><h2>${escapeHtml(t('error.webgl.title'))}</h2><p class="tag">${escapeHtml(t('error.webgl.text'))}</p></div>`;
  throw err;
}

show('title');
window.game = game;

function startGame() {
  initAudio();
  show(null);
  game.start();
}

$('btn-lang').addEventListener('click', toggleLang);
$('btn-play').addEventListener('click', startGame);
$('btn-again').addEventListener('click', startGame);
$('btn-help').addEventListener('click', () => show('help'));
$('btn-help-back').addEventListener('click', () => show('title'));
$('btn-next').addEventListener('click', () => game.startWaveNow());
$('btn-upgrade').addEventListener('click', () => game.upgradeSelected());
$('btn-sell').addEventListener('click', () => game.sellSelected());
$('btn-close-panel').addEventListener('click', () => game.selectTower(null));
$('btn-speed').addEventListener('click', () => {
  const next = { 1: 2, 2: 3, 3: 1 }[game.speed] || 1;
  game.setSpeed(next);
});

// Block accidental page zoom / scroll on iOS while playing.
document.addEventListener('gesturestart', (e) => e.preventDefault());
document.addEventListener('dblclick', (e) => e.preventDefault(), { passive: false });
