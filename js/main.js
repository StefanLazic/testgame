import { Game } from './game.js';
import { initAudio } from './audio.js';
import { settings } from './settings.js';
import { MAPS, currentMap } from './maps.js';
import { TOWERS, TOWER_ORDER, WAVES } from './config.js';
import { canPlaceTower } from './rules.js';
import { t, toggleLang, onLangChange, applyStatic } from './i18n.js';
import { VERSION } from './version.js';

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
    const towers = (typeof game !== 'undefined' && game && game.towers) || [];
    for (const k of TOWER_ORDER) {
      // A cat you cannot have any more of is locked, not just unaffordable.
      const maxed = !canPlaceTower(k, towers);
      shopButtons[k].classList.toggle('locked', maxed);
      shopButtons[k].classList.toggle('poor', maxed || this.gold < TOWERS[k].cost);
    }
    if (this.towerInfo && game && game.selected) this.showTower(game._towerInfo(game.selected));
    if (this.preview) $('preview-card').classList.toggle('poor', this.gold < this.preview.cost);
  },
  // The shop preview: what this cat costs, what it does and how far it reaches.
  showPreview(info) {
    this.preview = info;
    const card = $('preview-card');
    card.classList.toggle('hidden', !info);
    if (!info) return;
    $('pv-icon').textContent = info.icon;
    $('pv-name').textContent = info.global ? info.name : t('hud.catSuffix', { name: info.name });
    $('pv-cost').textContent = `🐟 ${info.cost}`;
    const line = info.ability || info.global
      ? escapeHtml(info.blurb)
      : `${escapeHtml(t('hud.stats', {
        damage: info.damage, range: info.range.toFixed(1), rate: info.rate.toFixed(2),
      }))} · ${escapeHtml(t(info.air ? 'hud.previewAir' : 'hud.previewGround'))}`;
    $('pv-stats').innerHTML = line;
    $('pv-hint').textContent = t(info.global ? 'hud.previewGlobal' : 'hud.previewHint');
    card.classList.toggle('poor', !info.afford);
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
    const cheer = info.buffed ? `<br><b class="buffed">${escapeHtml(t('hud.buffed'))}</b>` : '';
    const squad = info.synergies && info.synergies.length
      ? `<br>${info.synergies.map((s) => `<b class="syn">✦ ${escapeHtml(s.name)}</b>`).join(' ')}`
      : '';
    const path = info.branchName ? `<br><b class="path">✧ ${escapeHtml(info.branchName)}</b>` : '';
    $('tp-stats').innerHTML = `${escapeHtml(stats)}${path}${cheer}${squad}<br><i>${escapeHtml(info.blurb)}</i>`;
    this.showBranches(info);
    const up = $('btn-upgrade');
    up.classList.toggle('maxed', info.maxed);
    up.classList.toggle('poor', !info.canAfford);
    $('tp-upcost').textContent = info.maxed ? '' : `🐟 ${info.upCost}`;
    $('tp-sell').textContent = `🐟 ${info.sellValue}`;
  },
  // At the last collar a cat is offered two permanent paths.
  showBranches(info) {
    const box = $('tp-branches');
    const row = $('tp-branch-row');
    const list = info.branches || [];
    box.classList.toggle('hidden', list.length === 0);
    row.innerHTML = '';
    for (const b of list) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `branch-btn${b.afford ? '' : ' poor'}`;
      btn.dataset.branch = b.id;
      btn.innerHTML = `<span class="br-ic">${escapeHtml(b.icon)}</span>`
        + `<span class="br-name">${escapeHtml(b.name)}</span>`
        + `<span class="br-blurb">${escapeHtml(b.blurb)}</span>`
        + `<span class="br-cost">🐟 ${b.cost}</span>`;
      btn.addEventListener('click', () => game.chooseBranch(b.id));
      row.appendChild(btn);
    }
  },
  setPaused(on) {
    $('pause').classList.toggle('hidden', !on);
    $('btn-pause').textContent = on ? '▶' : '⏸';
    if (on) this.refreshSettings();
  },
  refreshSettings() {
    $('sound-state').textContent = t(settings.get('sound') ? 'pause.on' : 'pause.off');
    $('shake-state').textContent = t(settings.get('shake') ? 'pause.on' : 'pause.off');
    $('btn-sound').classList.toggle('off', !settings.get('sound'));
    $('btn-shake').classList.toggle('off', !settings.get('shake'));
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
  cinematic(title, sub, icon = '🐉') {
    const el = $('cinematic');
    el.querySelector('.cine-dragon').textContent = icon;
    $('cine-title').textContent = title;
    $('cine-sub').textContent = sub || '';
    el.classList.remove('hidden');
    // Restart the CSS animations even if a cinematic just played.
    for (const node of [el, ...el.children]) {
      node.style.animation = 'none';
      void node.offsetWidth;
      node.style.animation = '';
    }
    clearTimeout(this._cineTimer);
    this._cineTimer = setTimeout(() => el.classList.add('hidden'), 5200);
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
const screens = ['title', 'help', 'gameover', 'loading', 'pause'];
function show(name) {
  for (const s of screens) $(s).classList.toggle('hidden', s !== name);
  $('cinematic').classList.add('hidden');
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

// ------------------------------------------------------------ pause sheet --
function setPaused(on) {
  const paused = game.setPaused(on);
  ui.setPaused(paused);
}

// ------------------------------------------------------------ map picker --
// Two buttons on the title screen. Picking one rebuilds the diorama behind the
// panel straight away, so you can see the board you are choosing.
function buildMapPicker() {
  const host = $('map-picker');
  host.innerHTML = '';
  for (const map of MAPS) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'map-card';
    b.dataset.map = map.id;
    b.innerHTML = `<span class="map-icon">${escapeHtml(map.icon)}</span>`
      + `<span class="map-name"></span><span class="map-blurb"></span>`;
    b.addEventListener('click', () => {
      game.setMap(map.id);
      refreshMapPicker();
      sfxTapFeedback();
    });
    host.appendChild(b);
  }
  refreshMapPicker();
}

function refreshMapPicker() {
  const active = currentMap().id;
  for (const b of $('map-picker').children) {
    const id = b.dataset.map;
    b.classList.toggle('on', id === active);
    b.setAttribute('aria-pressed', id === active ? 'true' : 'false');
    b.querySelector('.map-name').textContent = t(`map.${id}.name`);
    b.querySelector('.map-blurb').textContent = t(`map.${id}.blurb`);
  }
}

// A tiny haptic nudge on phones that support it.
function sfxTapFeedback() {
  if (navigator.vibrate) navigator.vibrate(8);
}

buildMapPicker();

$('btn-lang').addEventListener('click', toggleLang);
$('btn-play').addEventListener('click', startGame);
$('btn-again').addEventListener('click', startGame);
$('btn-help').addEventListener('click', () => show('help'));
$('btn-help-back').addEventListener('click', () => show('title'));
$('btn-next').addEventListener('click', () => game.startWaveNow());
$('btn-upgrade').addEventListener('click', () => game.upgradeSelected());
$('btn-sell').addEventListener('click', () => game.sellSelected());
$('btn-close-panel').addEventListener('click', () => game.selectTower(null));
$('btn-pause').addEventListener('click', () => setPaused(!game.paused));
$('btn-resume').addEventListener('click', () => setPaused(false));
$('btn-sound').addEventListener('click', () => { settings.toggle('sound'); ui.refreshSettings(); });
$('btn-shake').addEventListener('click', () => { settings.toggle('shake'); ui.refreshSettings(); });
$('btn-restart').addEventListener('click', () => { setPaused(false); startGame(); });
$('btn-quit').addEventListener('click', () => {
  setPaused(false);
  game.startDemo();
  show('title');
});
// Version stamp on the title screen, so a player can tell us what they played.
const showVersion = () => { $('version').textContent = t('title.version', { version: VERSION }); };
showVersion();

onLangChange(() => { ui.refreshSettings(); refreshMapPicker(); showVersion(); });

// Escape pauses on a desktop keyboard; switching apps or tabs pauses on a
// phone, so nobody comes back to a lost run.
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') setPaused(!game.paused);
});
document.addEventListener('visibilitychange', () => { if (document.hidden) setPaused(true); });
window.addEventListener('blur', () => setPaused(true));

$('btn-speed').addEventListener('click', () => {
  const next = { 1: 2, 2: 3, 3: 1 }[game.speed] || 1;
  game.setSpeed(next);
});

// Block accidental page zoom / scroll on iOS while playing.
document.addEventListener('gesturestart', (e) => e.preventDefault());
document.addEventListener('dblclick', (e) => e.preventDefault(), { passive: false });
