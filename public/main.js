// Интерфейс: экраны, меню, клавиатура, настройки, рекорды. Связывает движок (game.js) и сервер (api.js).
(() => {
  const $ = s => document.querySelector(s);
  const fmt = t => String(Math.floor(t / 60)).padStart(2, '0') + ':' + String(Math.floor(t % 60)).padStart(2, '0');

  // ---------- Настройки (хранятся в браузере между запусками)
  let settings = { sound: 50, music: 30 };
  try { Object.assign(settings, JSON.parse(localStorage.getItem('strazh-settings'))); } catch (e) { /* первый запуск */ }
  const applySettings = () => Sound.setVolumes(settings.sound, settings.music);
  applySettings();

  function renderSettings() {
    document.querySelectorAll('.sl').forEach(el => {
      const v = settings[el.dataset.key];
      el.querySelector('.val').textContent = v + ' %';
      el.querySelector('i').style.width = v + '%';
      el.querySelector('u').style.left = v + '%';
    });
  }

  // ---------- Экраны
  let current = 'menu', sel = 0, settingsFrom = 'menu', pending = null, entryActive = false;
  const HUD_SCREENS = ['game', 'pause', 'gameover'];

  const items = () => { const s = $('#screen-' + current); return s ? [...s.querySelectorAll('.item')] : []; };
  function renderSel() { items().forEach((el, i) => el.classList.toggle('sel', i === sel)); }

  function show(name) {
    document.querySelectorAll('.screen').forEach(s => { s.hidden = true; });
    const el = $('#screen-' + name);
    if (el) el.hidden = false;
    $('#hud').hidden = !HUD_SCREENS.includes(name);
    current = name; sel = 0; renderSel();
  }

  // ---------- Действия кнопок
  function startGame() { Game.start(); show('game'); updateHud(0, 0, 200, 800); }
  function resumeGame() { Game.resume(); show('game'); }
  function openPause() { if (Game.state === 'over' || Game.state === 'idle') return; Game.pause(); show('pause'); }
  function toMenu() { Game.stop(); show('menu'); }
  function openSettings() { settingsFrom = current; show('settings'); renderSettings(); }

  async function openRecords() {
    show('records');
    renderRecords([]);
    $('#rec-msg').textContent = 'Загрузка…';
    try { renderRecords(await fetchScores()); $('#rec-msg').textContent = ''; }
    catch (e) { $('#rec-msg').textContent = e.message; }
  }

  function renderRecords(list) {
    const box = $('#rec-list'); box.textContent = '';
    for (let i = 0; i < 10; i++) {
      const r = list[i], row = document.createElement('div');
      row.className = 'rw' + (r ? (i === 0 ? ' g' : '') : ' e');
      [(i + 1) + '.', r ? r.name : '..............', r ? r.score : '......'].forEach(t => {
        const s = document.createElement('span'); s.textContent = t; row.appendChild(s);   // textContent: имена игроков не выполняются как HTML
      });
      box.appendChild(row);
    }
  }

  const actions = {
    start: startGame, restart: startGame, resume: resumeGame, records: openRecords,
    settings: openSettings, menu: toMenu, back: () => back(),
    exit: () => { window.close(); show('exit'); }
  };

  function back() {
    if (current === 'records' || current === 'exit') toMenu();
    else if (current === 'settings') { show(settingsFrom); }
    else if (current === 'pause') resumeGame();
  }

  // ---------- Конец игры и ввод имени
  async function onOver(score, time) {
    Sound.hit();
    pending = { score, time }; entryActive = false;
    $('#go-time').textContent = fmt(time); $('#go-score').textContent = score;
    $('#go-msg').textContent = ''; $('#go-entry').hidden = true;
    show('gameover');
    try {
      const list = await fetchScores();
      const inTop = list.length < 10 || score > Number(list[list.length - 1].score);   // попал ли в десятку лучших
      if (inTop && current === 'gameover') {
        entryActive = true; sel = -1; renderSel();
        $('#go-entry').hidden = false; $('#go-name').value = ''; $('#go-name').focus();
      }
    } catch (e) { $('#go-msg').textContent = e.message + ': результат не сохранён'; }
  }

  function finishEntry(msg) {
    entryActive = false; $('#go-entry').hidden = true; $('#go-name').blur();
    $('#go-msg').textContent = msg || ''; sel = 0; renderSel();
  }

  async function submitName() {
    const name = $('#go-name').value.trim();
    if (!name || !pending) return;
    try { await sendScore(name, pending.score, pending.time); finishEntry('Результат сохранён'); }
    catch (e) { $('#go-msg').textContent = e.message; }
  }

  // ---------- Клавиатура (по физическим клавишам, работает и в русской раскладке)
  const SHIELD_KEYS = { KeyW: 0, KeyD: 1, KeyS: 2, KeyA: 3 };

  function changeSlider(dir) {
    const el = items()[sel];
    if (!el || !el.dataset.key) return;
    const k = el.dataset.key;
    settings[k] = Math.max(0, Math.min(100, settings[k] + dir * 10));
    localStorage.setItem('strazh-settings', JSON.stringify(settings));
    applySettings(); renderSettings(); if (k === 'sound') Sound.block();
  }

  document.addEventListener('keydown', e => {
    Sound.init();
    const k = e.code;
    if (e.target.id === 'go-name') {                       // ввод имени: Enter — сохранить, Esc — пропустить
      if (k === 'Enter') submitName(); else if (k === 'Escape') finishEntry('');
      return;
    }
    if (current === 'game') {
      if (k in SHIELD_KEYS) Game.setShield(SHIELD_KEYS[k]); else if (k === 'Escape') openPause();
      return;
    }
    const n = items().length;
    if (k === 'KeyW' && n && !entryActive) { sel = (sel - 1 + n) % n; renderSel(); }
    else if (k === 'KeyS' && n && !entryActive) { sel = (sel + 1) % n; renderSel(); }
    else if (k === 'KeyA' && current === 'settings') changeSlider(-1);
    else if (k === 'KeyD' && current === 'settings') changeSlider(1);
    else if (k === 'Enter') {
      const el = items()[sel];
      if (el && el.dataset.action) actions[el.dataset.action]();
      else if (current === 'records' || current === 'exit') back();
    }
    else if (k === 'Escape') back();
  });

  // Мышь тоже работает: клик по кнопке
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-action]');
    if (el) actions[el.dataset.action]();
  });

  // ---------- Информационная панель
  function updateHud(score, time, v, vmax) {
    $('#hud-score').textContent = score;
    $('#hud-time').textContent = fmt(time);
    $('#hud-speed').textContent = Math.round(v);
    $('#hud-bar').style.width = Math.round(v / vmax * 100) + '%';
  }

  Game.init($('#field'), { onHud: updateHud, onOver, onBlock: () => Sound.block() });
  renderSettings();
  show('menu');
})();
