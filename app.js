(() => {
  'use strict';

  const DAY_SECONDS = 86400;
  const MORNING_START = 5.5 * 3600;   // 05:30
  const DAY_START = 10 * 3600;        // 10:00
  const EVENING_START = 18 * 3600;    // 18:00
  const NIGHT_START = 21.5 * 3600;    // 21:30
  const DAY_RATE = (16 * 3600) / (42 * 60);
  const NIGHT_RATE = (8 * 3600) / (18 * 60);
  const SLEEP_GAME_SECONDS = 8 * 3600;
  const STORAGE_KEY = 'stalker2-zone-clock-v1';
  const THEME_KEY = 'stalker2-zone-clock-theme';

  const $ = (id) => document.getElementById(id);

  const els = {
    clock: $('clock'), gameDay: $('gameDay'), runState: $('runState'),
    daypart: $('daypart'), boundary: $('boundary'), boundaryLabel: $('boundaryLabel'),
    syncForm: $('syncForm'), dayInput: $('dayInput'), timeInput: $('timeInput'),
    profileInput: $('profileInput'), customWrap: $('customWrap'), customMinutes: $('customMinutes'),
    pauseBtn: $('pauseBtn'), resumeBtn: $('resumeBtn'), sleepBtn: $('sleepBtn'), installBtn: $('installBtn'),
    emissionTime: $('emissionTime'), emissionDay: $('emissionDay'),
    markEmissionBtn: $('markEmissionBtn'),
    riskWrap: $('riskWrap'), riskLabel: $('riskLabel'), riskBadge: $('riskBadge'),
    riskProgress: $('riskProgress'), riskDetail: $('riskDetail'), riskNext: $('riskNext'),
    riskPercent: $('riskPercent'),
    dayMinusBtn: $('dayMinusBtn'), dayPlusBtn: $('dayPlusBtn'),
    resetBtn: $('resetBtn'), message: $('message'), saveState: $('saveState'),
    darkThemeBtn: $('darkThemeBtn'), lightThemeBtn: $('lightThemeBtn'),
    themeColorMeta: $('themeColorMeta'),
    settingsBtn: $('settingsBtn'), closeSettingsBtn: $('closeSettingsBtn'),
    settingsDialog: $('settingsDialog')
  };

  let gameSeconds = 12 * 3600;
  let gameDay = 1;
  let absoluteGameSeconds = gameDay * DAY_SECONDS + gameSeconds;
  let running = true;
  let lastRealMs = Date.now();
  let emission = null;
  let deferredInstallPrompt = null;
  let lastSavedAt = 0;

  function currentTheme() {
    return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
  }

  function applyTheme(theme, persist = true) {
    const next = theme === 'light' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;

    if (els.darkThemeBtn) {
      els.darkThemeBtn.setAttribute('aria-pressed', String(next === 'dark'));
    }
    if (els.lightThemeBtn) {
      els.lightThemeBtn.setAttribute('aria-pressed', String(next === 'light'));
    }
    if (els.themeColorMeta) {
      els.themeColorMeta.setAttribute('content', next === 'light' ? '#f1f3ed' : '#111612');
    }

    if (persist) {
      try { localStorage.setItem(THEME_KEY, next); } catch (_) {}
    }
  }

  function wrap(v) {
    v %= DAY_SECONDS;
    return v < 0 ? v + DAY_SECONDS : v;
  }

  function parseTime(value) {
    const p = String(value || '').split(':').map(Number);
    if (p.length < 2 || p.some(n => !Number.isFinite(n))) return null;
    const h = Math.min(23, Math.max(0, p[0]));
    const m = Math.min(59, Math.max(0, p[1]));
    const s = Math.min(59, Math.max(0, p[2] || 0));
    return h * 3600 + m * 60 + s;
  }

  function parseDay(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return null;
    return Math.min(99999, Math.max(0, Math.floor(n)));
  }

  function formatClock(value) {
    const v = Math.floor(wrap(value));
    const h = Math.floor(v / 3600);
    const m = Math.floor((v % 3600) / 60);
    const s = v % 60;
    return [h, m, s].map(n => String(n).padStart(2, '0')).join(':');
  }

  function ruPlural(n, one, few, many) {
    const mod10 = Math.abs(n) % 10;
    const mod100 = Math.abs(n) % 100;
    if (mod10 === 1 && mod100 !== 11) return one;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
    return many;
  }

  function formatDaysHoursAgo(sec) {
    sec = Math.max(0, Math.floor(sec));
    const days = Math.floor(sec / DAY_SECONDS);
    const hours = Math.floor((sec % DAY_SECONDS) / 3600);

    if (days === 0) {
      if (hours === 0) return 'менее часа назад';
      return `${hours} ${ruPlural(hours, 'час', 'часа', 'часов')} назад`;
    }

    const dayText = `${days} ${ruPlural(days, 'день', 'дня', 'дней')}`;

    if (hours === 0) {
      return `${dayText} назад`;
    }

    const hourText = `${hours} ${ruPlural(hours, 'час', 'часа', 'часов')}`;
    return `${dayText} ${hourText} назад`;
  }

  function formatDuration(sec) {
    sec = Math.max(0, Math.floor(sec));
    const d = Math.floor(sec / DAY_SECONDS);
    const h = Math.floor((sec % DAY_SECONDS) / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    if (d > 0) return `${d} д ${h} ч ${m} мин`;
    if (h > 0) return `${h} ч ${m} мин`;
    if (m > 0) return `${m} мин ${s} с`;
    return `${s} с`;
  }

  function isDay(value) {
    const v = wrap(value);
    return v >= MORNING_START && v < NIGHT_START;
  }

  function dayPartAt(value) {
    const v = wrap(value);
    if (v >= MORNING_START && v < DAY_START) return 'УТРО';
    if (v >= DAY_START && v < EVENING_START) return 'ДЕНЬ';
    if (v >= EVENING_START && v < NIGHT_START) return 'ВЕЧЕР';
    return 'НОЧЬ';
  }

  function customMinutesValue() {
    const raw = Number(els.customMinutes.value);
    if (!Number.isFinite(raw)) return 60;
    return Math.min(1440, Math.max(10, raw));
  }

  function rateAt(value) {
    if (els.profileInput.value === 'uniform24') return 24;
    if (els.profileInput.value === 'custom') return DAY_SECONDS / (customMinutesValue() * 60);
    return isDay(value) ? DAY_RATE : NIGHT_RATE;
  }

  function addGameDelta(delta) {
    absoluteGameSeconds = Math.max(0, absoluteGameSeconds + delta);
    gameDay = Math.floor(absoluteGameSeconds / DAY_SECONDS);
    gameSeconds = wrap(absoluteGameSeconds);
  }

  function advance(realSeconds) {
    if (!(realSeconds > 0)) return;

    if (els.profileInput.value !== 'vanilla') {
      addGameDelta(realSeconds * rateAt(gameSeconds));
      return;
    }

    let left = Math.min(realSeconds, DAY_SECONDS);
    let guard = 0;

    while (left > 0.0001 && guard++ < 30) {
      const v = wrap(gameSeconds);
      const day = isDay(v);
      const rate = day ? DAY_RATE : NIGHT_RATE;
      let gameToBoundary;

      if (day) gameToBoundary = NIGHT_START - v;
      else if (v < DAY_START) gameToBoundary = DAY_START - v;
      else gameToBoundary = (DAY_SECONDS - v) + DAY_START;

      const realToBoundary = gameToBoundary / rate;
      const usedReal = Math.min(left, realToBoundary);
      addGameDelta(usedReal * rate);
      left -= usedReal;

      if (usedReal >= realToBoundary && left > 0) addGameDelta(0.001);
    }
  }

  function nextDayPartBoundary(value) {
    const v = wrap(value);
    if (v < MORNING_START) return { at: MORNING_START, label: 'До утра' };
    if (v < DAY_START) return { at: DAY_START, label: 'До дня' };
    if (v < EVENING_START) return { at: EVENING_START, label: 'До вечера' };
    if (v < NIGHT_START) return { at: NIGHT_START, label: 'До ночи' };
    return { at: DAY_SECONDS + MORNING_START, label: 'До утра' };
  }

  function realUntilBoundary() {
    const v = wrap(gameSeconds);
    const next = nextDayPartBoundary(v);
    const gameDelta = next.at - v;

    if (els.profileInput.value !== 'vanilla') {
      return gameDelta / rateAt(v);
    }

    // All daylight sub-periods use the current vanilla daylight coefficient.
    // Night uses the current vanilla night coefficient.
    return gameDelta / rateAt(v);
  }

  function emissionRisk(elapsed) {
    const days = elapsed / DAY_SECONDS;
    if (days < 1) return {
      badge: 'ОЧЕНЬ НИЗКИЙ', label: 'Очень низкая вероятность',
      progress: Math.max(4, days / 3 * 100), color: 'var(--success)',
      detail: 'После последнего выброса прошло меньше одного игрового дня.',
      nextAt: DAY_SECONDS, nextText: 'До следующей зоны риска'
    };
    if (days < 2) return {
      badge: 'НИЗКИЙ', label: 'Низкая вероятность',
      progress: days / 3 * 100, color: 'var(--success)',
      detail: 'Интервал пока короче типичного окна следующего случайного выброса.',
      nextAt: 2 * DAY_SECONDS, nextText: 'До повышенного риска'
    };
    if (days < 3) return {
      badge: 'ПОВЫШЕННЫЙ', label: 'Выброс уже возможен',
      progress: days / 3 * 100, color: 'var(--warning)',
      detail: 'Вы вошли в ориентировочное окно 2–3 игровых дня после предыдущего выброса.',
      nextAt: 3 * DAY_SECONDS, nextText: 'До высокого риска'
    };
    return {
      badge: 'ВЫСОКИЙ', label: 'Высокая вероятность выброса',
      progress: 100, color: 'var(--danger)',
      detail: 'Прошло 3 или больше игровых дней. Следующий случайный выброс стоит ожидать в ближайшее время.',
      nextAt: null, nextText: ''
    };
  }

  function updateEmissionDanger(gameElapsed) {
    const days = Math.max(0, gameElapsed / DAY_SECONDS);

    if (days < 2) {
      document.documentElement.style.setProperty('--emission-danger-level', '0');
      document.documentElement.style.setProperty('--emission-danger-pulse', '0');
      document.body.classList.remove('emission-danger-active', 'emission-danger-high');
      return;
    }

    if (days < 3) {
      const t = Math.min(1, Math.max(0, days - 2));
      const level = 0.10 + (0.28 * t);
      const pulse = 0.04 + (0.10 * t);

      document.documentElement.style.setProperty('--emission-danger-level', level.toFixed(3));
      document.documentElement.style.setProperty('--emission-danger-pulse', pulse.toFixed(3));
      document.body.classList.add('emission-danger-active');
      document.body.classList.remove('emission-danger-high');
      return;
    }

    document.documentElement.style.setProperty('--emission-danger-level', '0.42');
    document.documentElement.style.setProperty('--emission-danger-pulse', '0.16');
    document.body.classList.add('emission-danger-active', 'emission-danger-high');
  }

  function renderRisk(gameElapsed) {
    const r = emissionRisk(gameElapsed);
    updateEmissionDanger(gameElapsed);
    els.riskWrap.classList.remove('hidden');
    els.riskLabel.textContent = r.label;
    els.riskBadge.textContent = r.badge;
    const pct = Math.min(100, Math.max(0, r.progress));
    els.riskProgress.style.width = `${pct}%`;
    if (els.riskPercent) els.riskPercent.textContent = `${Math.round(pct)}%`;
    els.riskProgress.style.background = r.color;
    els.riskBadge.style.color = r.color;
    if (els.riskPercent) els.riskPercent.style.color = r.color;
    els.riskDetail.textContent = r.detail;

    if (r.nextAt !== null) {
      els.riskNext.textContent = `${r.nextText}: ${formatDuration(Math.max(0, r.nextAt - gameElapsed))}`;
    } else {
      els.riskNext.textContent = 'Точного момента выброса заранее определить нельзя.';
    }
  }

  function renderEmission() {
    if (!emission) {
      els.emissionTime.textContent = 'Не отмечен';
      els.emissionDay.textContent = '';
      els.riskWrap.classList.add('hidden');
      document.documentElement.style.setProperty('--emission-danger-level', '0');
      document.documentElement.style.setProperty('--emission-danger-pulse', '0');
      document.body.classList.remove('emission-danger-active', 'emission-danger-high');
      return;
    }

    const gameElapsed = Math.max(0, absoluteGameSeconds - emission.absoluteGameSeconds);

    els.emissionTime.textContent = formatDaysHoursAgo(gameElapsed);
    els.emissionDay.textContent = '';

    renderRisk(gameElapsed);
  }

  function render() {
    els.clock.textContent = formatClock(gameSeconds);
    els.gameDay.textContent = String(gameDay);

    const part = dayPartAt(gameSeconds);
    const nextPart = nextDayPartBoundary(gameSeconds);
    els.daypart.textContent = part;
    els.boundaryLabel.textContent = nextPart.label;
    els.boundary.textContent = formatDuration(realUntilBoundary());
    els.runState.textContent = running ? 'Часы идут вместе с реальным временем' : 'Часы на паузе';

    els.pauseBtn.disabled = !running;
    els.resumeBtn.disabled = running;
    renderEmission();
  }

  function stateObject() {
    return {
      version: 1,
      absoluteGameSeconds,
      gameDay,
      gameSeconds,
      running,
      lastRealMs,
      profile: els.profileInput.value,
      customMinutes: customMinutesValue(),
      theme: currentTheme(),
      emission
    };
  }

  function saveState(force = false) {
    const now = Date.now();
    if (!force && now - lastSavedAt < 1000) return;
    lastSavedAt = now;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateObject()));
    els.saveState.textContent = 'Сохранено автоматически.';
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const s = JSON.parse(raw);
      if (!s || s.version !== 1) return false;

      absoluteGameSeconds = Math.max(0, Number(s.absoluteGameSeconds) || 0);
      gameDay = Math.floor(absoluteGameSeconds / DAY_SECONDS);
      gameSeconds = wrap(absoluteGameSeconds);
      running = Boolean(s.running);
      lastRealMs = Number(s.lastRealMs) || Date.now();
      emission = s.emission || null;

      let storedTheme = null;
      try { storedTheme = localStorage.getItem(THEME_KEY); } catch (_) {}
      applyTheme(
        storedTheme === 'light' || storedTheme === 'dark'
          ? storedTheme
          : (s.theme === 'light' ? 'light' : 'dark'),
        false
      );

      const allowed = new Set(['vanilla', 'uniform24', 'custom']);
      els.profileInput.value = allowed.has(s.profile) ? s.profile : 'vanilla';
      els.customMinutes.value = String(Math.min(1440, Math.max(10, Number(s.customMinutes) || 60)));
      els.customWrap.classList.toggle('hidden', els.profileInput.value !== 'custom');

      if (running) {
        const elapsed = Math.max(0, Math.min(7 * 24 * 3600, (Date.now() - lastRealMs) / 1000));
        advance(elapsed);
      }

      lastRealMs = Date.now();
      return true;
    } catch {
      return false;
    }
  }

  function updateNow() {
    const now = Date.now();
    if (running) {
      const delta = Math.max(0, Math.min(7 * 24 * 3600, (now - lastRealMs) / 1000));
      advance(delta);
    }
    lastRealMs = now;
    render();
    saveState();
  }

  els.syncForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const parsedTime = parseTime(els.timeInput.value);
    const parsedDay = parseDay(els.dayInput.value);

    if (parsedTime === null || parsedDay === null) {
      els.message.textContent = 'Введите корректный игровой день и время.';
      return;
    }

    if (els.profileInput.value === 'custom') {
      const raw = Number(els.customMinutes.value);
      if (!Number.isFinite(raw) || raw < 10 || raw > 1440) {
        els.message.textContent = 'Длительность суток должна быть от 10 до 1440 реальных минут.';
        return;
      }
    }

    gameDay = parsedDay;
    gameSeconds = parsedTime;
    absoluteGameSeconds = gameDay * DAY_SECONDS + gameSeconds;
    running = true;
    lastRealMs = Date.now();
    els.message.textContent = `Синхронизировано: день ${gameDay}, ${formatClock(gameSeconds)}.`;
    saveState(true);
    render();
  });

  els.profileInput.addEventListener('change', () => {
    updateNow();
    els.customWrap.classList.toggle('hidden', els.profileInput.value !== 'custom');
    saveState(true);
    render();
  });

  els.customMinutes.addEventListener('change', () => {
    els.customMinutes.value = String(customMinutesValue());
    saveState(true);
    render();
  });

  els.pauseBtn.addEventListener('click', () => {
    updateNow();
    running = false;
    els.message.textContent = 'Часы остановлены.';
    saveState(true);
    render();
  });

  els.resumeBtn.addEventListener('click', () => {
    running = true;
    lastRealMs = Date.now();
    els.message.textContent = 'Ход времени продолжен.';
    saveState(true);
    render();
  });

  let sleepButtonBusy = false;

  els.sleepBtn.addEventListener('click', () => {
    if (sleepButtonBusy) return;
    sleepButtonBusy = true;

    updateNow();

    const sleepLabel = els.sleepBtn.querySelector('.sleep-label');
    els.sleepBtn.disabled = true;
    els.sleepBtn.classList.add('sleep-activating');
    if (sleepLabel) sleepLabel.textContent = 'СОН...';

    window.setTimeout(() => {
      addGameDelta(SLEEP_GAME_SECONDS);
      lastRealMs = Date.now();
      saveState(true);
      render();

      els.sleepBtn.classList.remove('sleep-activating');
      els.sleepBtn.classList.add('sleep-confirmed');
      if (sleepLabel) sleepLabel.textContent = 'ГОТОВО';

      els.message.textContent = `Сон: +8 игровых часов. Сейчас день ${gameDay}, ${formatClock(gameSeconds)}.`;

      window.setTimeout(() => {
        els.sleepBtn.classList.remove('sleep-confirmed');
        els.sleepBtn.disabled = false;
        if (sleepLabel) sleepLabel.textContent = 'СОН';
        sleepButtonBusy = false;
      }, 650);
    }, 700);
  });

  els.markEmissionBtn.addEventListener('click', () => {
    updateNow();
    emission = {
      gameClock: gameSeconds,
      gameDay,
      absoluteGameSeconds,
      realMs: Date.now()
    };
    els.message.textContent = `Выброс отмечен: день ${gameDay}, ${formatClock(gameSeconds)}.`;
    saveState(true);
    render();
  });

  document.querySelectorAll('[data-shift]').forEach(btn => {
    btn.addEventListener('click', () => {
      updateNow();
      addGameDelta(Number(btn.dataset.shift));
      lastRealMs = Date.now();
      els.message.textContent = 'Игровое время скорректировано.';
      saveState(true);
      render();
    });
  });

  els.dayMinusBtn.addEventListener('click', () => {
    updateNow();
    addGameDelta(-DAY_SECONDS);
    lastRealMs = Date.now();
    els.message.textContent = 'Игровой день уменьшен на 1.';
    saveState(true);
    render();
  });

  els.dayPlusBtn.addEventListener('click', () => {
    updateNow();
    addGameDelta(DAY_SECONDS);
    lastRealMs = Date.now();
    els.message.textContent = 'Игровой день увеличен на 1.';
    saveState(true);
    render();
  });

  els.resetBtn.addEventListener('click', () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(THEME_KEY);
    gameSeconds = 12 * 3600;
    gameDay = 1;
    absoluteGameSeconds = gameDay * DAY_SECONDS + gameSeconds;
    running = true;
    lastRealMs = Date.now();
    emission = null;
    els.profileInput.value = 'vanilla';
    els.customMinutes.value = '60';
    els.customWrap.classList.add('hidden');
    applyTheme('dark');
    els.dayInput.value = '1';
    els.timeInput.value = '12:00:00';
    els.message.textContent = 'Все сохранённые данные сброшены.';
    render();
    saveState(true);
  });

  function openSettings() {
    if (!els.settingsDialog) return;
    if (typeof els.settingsDialog.showModal === 'function') {
      if (!els.settingsDialog.open) els.settingsDialog.showModal();
    } else {
      els.settingsDialog.setAttribute('open', '');
    }
  }

  function closeSettings() {
    if (!els.settingsDialog) return;
    if (typeof els.settingsDialog.close === 'function' && els.settingsDialog.open) {
      els.settingsDialog.close();
    } else {
      els.settingsDialog.removeAttribute('open');
    }
  }

  els.settingsBtn?.addEventListener('click', openSettings);
  els.closeSettingsBtn?.addEventListener('click', closeSettings);

  els.settingsDialog?.addEventListener('click', (event) => {
    if (event.target === els.settingsDialog) closeSettings();
  });

  document.querySelectorAll('[data-theme-choice]').forEach(btn => {
    btn.addEventListener('click', () => {
      applyTheme(btn.dataset.themeChoice);
      els.message.textContent = btn.dataset.themeChoice === 'light'
        ? 'Включена светлая тема.'
        : 'Включена тёмная тема.';
      saveState(true);
    });
  });

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    els.installBtn.classList.remove('hidden');
  });

  els.installBtn.addEventListener('click', async () => {
    if (!deferredInstallPrompt) {
      els.message.textContent = 'Установка доступна через меню браузера: «Установить приложение».';
      return;
    }
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    els.installBtn.classList.add('hidden');
  });

  window.addEventListener('appinstalled', () => {
    els.installBtn.classList.add('hidden');
    els.message.textContent = 'Приложение установлено.';
  });

  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      saveState(true);
    } else {
      updateNow();
      saveState(true);
    }
  });

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./service-worker.js').catch(() => {
        els.message.textContent = 'Офлайн-режим недоступен. Запустите приложение через HTTPS или localhost.';
      });
    });
  }

  applyTheme(currentTheme(), false);

  const restored = loadState();
  if (restored) els.message.textContent = 'Состояние восстановлено.';
  render();
  saveState(true);
  setInterval(updateNow, 250);
})();
