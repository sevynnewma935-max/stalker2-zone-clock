(() => {
  'use strict';

  const DAY_SECONDS = 86400;
  const MORNING_START = 5.5 * 3600;   // 05:30
  const DAY_START = 10 * 3600;         // 10:00
  const EVENING_START = 18 * 3600;     // 18:00
  const NIGHT_START = 21.5 * 3600;     // 21:30

  // Patch 2.0 — empirical calibration from a complete 24-hour test.
  // 96 rate values, one for each 15-minute interval of Zone time.
  const RATE_SLOT_SECONDS = 15 * 60;
  const PATCH20_RATE_TABLE = [
    21.560471, 21.560471, 21.560471, 21.560471, 21.560471, 21.560471, 21.560471, 21.560471,
    21.560471, 21.560471, 21.560471, 21.560471, 21.560471, 21.560471, 21.560471, 21.560471,
    21.560471, 21.560471, 21.560471, 20.123106, 18.865412, 16.769255, 11.017841, 9.740000,
    9.740000, 9.740000, 11.238462, 11.238462, 12.175000, 12.629777, 13.824885, 13.824885,
    13.824885, 13.824885, 13.824885, 13.824885, 13.824885, 13.824885, 13.824885, 13.824885,
    13.824885, 13.824885, 13.824885, 13.824885, 13.824885, 13.824885, 13.824885, 13.824885,
    13.824885, 13.824885, 13.824885, 13.824885, 12.960830, 13.824885, 13.824885, 13.824885,
    13.824885, 13.824885, 13.824885, 13.824885, 13.824885, 13.824885, 13.824885, 13.824885,
    13.824885, 13.824885, 13.824885, 13.824885, 13.824885, 13.824885, 13.824885, 13.824885,
    13.598247, 13.824885, 13.824885, 13.824885, 12.761432, 11.849901, 10.368664, 9.758742,
    9.758742, 10.368664, 11.059908, 12.761432, 20.737327, 20.737327, 20.371936, 23.041724,
    21.560471, 21.560471, 21.560471, 21.560471, 21.560471, 21.560471, 21.560471, 21.560471,
  ];
  const SLEEP_GAME_SECONDS = 8 * 3600;
  const STORAGE_KEY = 'stalker2-zone-clock-v1';
  const THEME_KEY = 'stalker2-zone-clock-theme';
  const TEST_STORAGE_KEY = 'stalker2-zone-clock-test-v1';
  const NOTIFICATION_KEY = 'stalker2-zone-clock-notifications-v1';

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
    correctionCurrentTime: $('correctionCurrentTime'), dayMinusBtn: $('dayMinusBtn'), dayPlusBtn: $('dayPlusBtn'),
    resetBtn: $('resetBtn'), message: $('message'), saveState: $('saveState'),
    darkThemeBtn: $('darkThemeBtn'), lightThemeBtn: $('lightThemeBtn'),
    themeColorMeta: $('themeColorMeta'),
    settingsBtn: $('settingsBtn'), closeSettingsBtn: $('closeSettingsBtn'),
    settingsDialog: $('settingsDialog'),
    enableNotificationsBtn: $('enableNotificationsBtn'),
    notificationStatus: $('notificationStatus'),
    zoneToast: $('zoneToast'),
    testBtn: $('testBtn'), closeTestBtn: $('closeTestBtn'), testDialog: $('testDialog'),
    testCurrentTime: $('testCurrentTime'), testTableBody: $('testTableBody'),
    exportTestBtn: $('exportTestBtn'), clearTestBtn: $('clearTestBtn'),
    testMessage: $('testMessage')
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
    return [h, m].map(n => String(n).padStart(2, '0')).join(':');
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
    const totalHours = Math.floor(sec / 3600);

    if (totalHours < 24) {
      if (totalHours === 0) return 'менее часа назад';
      return `${totalHours} ${ruPlural(totalHours, 'час', 'часа', 'часов')} назад`;
    }

    const days = Math.floor(totalHours / 24);
    const hours = totalHours % 24;
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

    if (d > 0) return `${d} д ${h} ч ${m} мин`;
    if (h > 0) return `${h} ч ${m} мин`;
    if (m > 0) return `${m} мин`;
    return 'менее 1 мин';
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

    const v = wrap(value);
    const slot = Math.min(
      PATCH20_RATE_TABLE.length - 1,
      Math.floor(v / RATE_SLOT_SECONDS)
    );
    return PATCH20_RATE_TABLE[slot];
  }

  function addGameDelta(delta) {
    absoluteGameSeconds = Math.max(0, absoluteGameSeconds + delta);
    gameDay = Math.floor(absoluteGameSeconds / DAY_SECONDS);
    gameSeconds = wrap(absoluteGameSeconds);
  }

  // Patch 2.0 calibrated from the full 00:00–24:00 CSV test.
  // The clock changes rate every 15 minutes according to PATCH20_RATE_TABLE.
  function advance(realSeconds) {
    if (!(realSeconds > 0)) return;

    const notificationStartAbsolute = absoluteGameSeconds;

    if (els.profileInput.value !== 'vanilla') {
      addGameDelta(realSeconds * rateAt(gameSeconds));
      checkHourlyZoneNotification(notificationStartAbsolute, absoluteGameSeconds);
      return;
    }

    let left = Math.min(realSeconds, DAY_SECONDS);
    let guard = 0;

    while (left > 0.0001 && guard++ < 4000) {
      const v = wrap(gameSeconds);
      const rate = rateAt(v);
      const slot = Math.floor(v / RATE_SLOT_SECONDS);
      const nextBoundary = Math.min(
        DAY_SECONDS,
        (slot + 1) * RATE_SLOT_SECONDS
      );
      const gameToBoundary = Math.max(0.001, nextBoundary - v);

      const realToBoundary = gameToBoundary / rate;
      const usedReal = Math.min(left, realToBoundary);

      addGameDelta(usedReal * rate);
      left -= usedReal;

      if (usedReal >= realToBoundary && left > 0) {
        addGameDelta(0.001);
      }
    }

    checkHourlyZoneNotification(notificationStartAbsolute, absoluteGameSeconds);
  }

  function nextDayPartBoundary(value) {
    const v = wrap(value);
    if (v < MORNING_START) return { at: MORNING_START, label: 'Рассвет через' };
    if (v < DAY_START) return { at: DAY_START, label: 'До дня' };
    if (v < EVENING_START) return { at: EVENING_START, label: 'Закат через' };
    if (v < NIGHT_START) return { at: NIGHT_START, label: 'До ночи' };
    return { at: DAY_SECONDS + MORNING_START, label: 'Рассвет через' };
  }

  // All durations shown on the main screen use Zone/game time.
  // Real time is used only internally to advance the clock between renders.
  function gameUntilBoundary() {
    const v = wrap(gameSeconds);
    const next = nextDayPartBoundary(v);
    return Math.max(0, next.at - v);
  }

  function emissionRisk(elapsed) {
    const days = elapsed / DAY_SECONDS;
    if (days < 1) return {
      badge: 'ОЧЕНЬ НИЗКИЙ', label: 'Очень низкая вероятность',
      progress: Math.max(4, days / 3 * 100), color: 'var(--success)',
      detail: 'После последнего выброса прошло меньше одного дня.',
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
      detail: 'Вы вошли в ориентировочное окно 2–3 дня после предыдущего выброса.',
      nextAt: 3 * DAY_SECONDS, nextText: 'До высокого риска'
    };
    return {
      badge: 'ВЫСОКИЙ', label: 'Высокая вероятность выброса',
      progress: 100, color: 'var(--danger)',
      detail: 'Прошло 3 или больше дней. Следующий случайный выброс стоит ожидать в ближайшее время.',
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
    if (els.testCurrentTime) els.testCurrentTime.textContent = formatClock(gameSeconds);
    if (els.correctionCurrentTime) els.correctionCurrentTime.textContent = formatClock(gameSeconds);
    els.gameDay.textContent = String(gameDay);

    const part = dayPartAt(gameSeconds);
    const nextPart = nextDayPartBoundary(gameSeconds);
    els.daypart.textContent = part;
    els.boundaryLabel.textContent = nextPart.label;
    els.boundary.textContent = formatDuration(gameUntilBoundary());
    els.runState.textContent = running ? 'Часы идут' : 'Часы на паузе';

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
      els.message.textContent = 'Введите корректный день и время.';
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

      els.message.textContent = `Сон: +8 часов. Сейчас день ${gameDay}, ${formatClock(gameSeconds)}.`;
      syncNotificationHourMarker();

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
      els.message.textContent = 'Время скорректировано.';
    syncNotificationHourMarker();
      saveState(true);
      render();
    });
  });

  els.dayMinusBtn.addEventListener('click', () => {
    updateNow();
    addGameDelta(-DAY_SECONDS);
    lastRealMs = Date.now();
    els.message.textContent = 'День уменьшен на 1.';
    syncNotificationHourMarker();
    saveState(true);
    render();
  });

  els.dayPlusBtn.addEventListener('click', () => {
    updateNow();
    addGameDelta(DAY_SECONDS);
    lastRealMs = Date.now();
    els.message.textContent = 'День увеличен на 1.';
    syncNotificationHourMarker();
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
    els.timeInput.value = '12:00';
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



  const ZONE_MESSAGES = [
    'Совет: перед закатом проверь аптечки, патроны и ближайшее укрытие.',
    'Байка Зоны: один сталкер три часа искал тайник, а потом понял, что сидел на нём.',
    'В Зоне тишина редко означает безопасность. Иногда она просто означает, что тебя уже заметили.',
    'Совет: если дорога кажется слишком спокойной, посмотри под ноги и ещё раз на детектор.',
    'Костровая мудрость: лучший хабар — тот, с которым ты успел вернуться.',
    'Сталкерский анекдот: «Почему ты идёшь первым?» — «Потому что сзади контролёр».',
    'Не экономь последнюю аптечку ради красивой статистики. Зона статистику не читает.',
    'Байка: новичок спросил, где безопасная дорога. Ветеран ответил: «Та, по которой уже вернулись».',
    'Совет: перед входом в тёмное помещение посмотри, откуда будешь выходить.',
    'Если мутанты внезапно побежали в одну сторону — не спеши радоваться. Лучше беги вместе с ними.',
    'Короткая история: сталкер нашёл идеальный тайник. Через минуту выяснилось, что это чужая засада.',
    'Совет: хороший болт дешевле плохого шага.',
    'Костровая мудрость: в Зоне жадность весит больше любого рюкзака.',
    'Анекдот: «У тебя детектор пищит». — «Знаю». — «Почему не идёшь?» — «Он пищит в обе стороны».',
    'Перед дальней дорогой запомни ориентир. Туман любит переставлять знакомые места.',
    'Байка: один сталкер не верил в приметы. Теперь в приметы верят его товарищи.',
    'Совет: слышишь выстрелы впереди — сначала выясни, кто в кого стреляет.',
    'В Зоне самое опасное слово — «быстро». Особенно в фразе «я быстро сбегаю».',
    'Костровая мудрость: чужой костёр виден далеко. Чужая оптика — ещё дальше.',
    'Анекдот: «Что лучше — броня или скорость?» — «Зависит от того, кто за тобой бежит».',
    'Совет: артефакт не станет дешевле, если ты потеряешь здоровье по дороге к нему.',
    'Байка: ветеран всегда носил два фонаря. Один для темноты, второй — когда первый начинал мигать.',
    'Если радио замолчало одновременно у всех — это уже не проблема радио.',
    'Короткая история: двое спорили, чей маршрут короче. Вернулся тот, кто выбрал длиннее.',
    'Совет: перед выбросом спорить с небом бессмысленно. Ищи крышу.',
    'Костровая мудрость: в Зоне план нужен хотя бы затем, чтобы знать, когда всё пошло не по плану.',
    'Анекдот: «Почему ты не стреляешь?» — «Экономлю патроны». — «А мутант?» — «Тоже экономит».',
    'Совет: проверь оружие после грязи, дождя и особенно после фразы «да оно и так нормально».',
    'Байка: сталкер нашёл карту без единой ошибки. Потом заметил дату — до появления Зоны.',
    'Не стой долго на открытом месте. Даже если пейзаж очень красивый.',
    'Костровая мудрость: один лишний магазин весит меньше, чем одна плохая встреча.',
    'Анекдот: «Есть безопасный способ пройти аномалию?» — «Есть. Обойти».',
    'Совет: если товарищ внезапно замолчал, не кричи его имя на всю локацию.',
    'Байка: новичок спросил цену опыта. Ветеран показал шрамы и сказал: «Оплата уже прошла».',
    'Зона не любит расписаний, но любит тех, кто следит за временем.',
    'Совет: вечером заранее выбери путь к укрытию. В темноте знакомые кусты становятся чужими.',
    'Короткая история: сталкер услышал шаги позади. Обернулся — никого. Не обернулся второй раз.',
    'Анекдот: «Ты видел артефакт?» — «Нет». — «А почему бежишь?» — «Потому что увидел то, что его охраняет».',
    'Костровая мудрость: хороший проводник знает дорогу. Отличный — знает, когда по ней не идти.',
    'Совет: после боя сначала слушай, потом собирай хабар.',
    'Байка: один сталкер всегда бросал болт дважды. Говорил, первый раз Зона может пошутить.',
    'Не забывай: самый громкий звук в лесу иногда — это тишина после него.',
    'Анекдот: «Ты суеверный?» — «Нет. Но это место обойду с другой стороны».',
    'Совет: если не уверен, что дверь безопасна, не стой прямо перед ней.',
    'Костровая мудрость: Зона редко предупреждает дважды одинаково.',
    'Байка: у костра все истории правдивые. Просто не все происходили с рассказчиком.',
    'Совет: держи запас воды и не доверяй коротким маршрутам через болото.',
    'Анекдот: «Как понять, что сталкер опытный?» — «Он не говорит, что здесь безопасно».'
  ];

  let lastNotifiedHourKey = null;
  let toastTimer = null;

  function notificationsEnabled() {
    return localStorage.getItem(NOTIFICATION_KEY) === '1';
  }

  function updateNotificationSettingsUi() {
    if (!els.notificationStatus || !els.enableNotificationsBtn) return;

    if (!('Notification' in window)) {
      els.notificationStatus.textContent = 'Не поддерживаются этим браузером';
      els.enableNotificationsBtn.disabled = true;
      return;
    }

    if (Notification.permission === 'granted' && notificationsEnabled()) {
      els.notificationStatus.textContent = 'Включены';
      els.enableNotificationsBtn.textContent = 'ВКЛЮЧЕНЫ';
      els.enableNotificationsBtn.disabled = true;
    } else if (Notification.permission === 'denied') {
      els.notificationStatus.textContent = 'Запрещены в браузере';
      els.enableNotificationsBtn.textContent = 'ЗАПРЕЩЕНЫ';
      els.enableNotificationsBtn.disabled = true;
    } else {
      els.notificationStatus.textContent = 'Не включены';
      els.enableNotificationsBtn.textContent = 'ВКЛЮЧИТЬ';
      els.enableNotificationsBtn.disabled = false;
    }
  }

  function pickZoneMessage(hourKey) {
    const index = Math.abs(hourKey) % ZONE_MESSAGES.length;
    return ZONE_MESSAGES[index];
  }

  function showZoneToast(timeText, message) {
    if (!els.zoneToast) return;

    const timeEl = els.zoneToast.querySelector('.zone-toast-time');
    const textEl = els.zoneToast.querySelector('.zone-toast-text');

    if (timeEl) timeEl.textContent = timeText;
    if (textEl) textEl.textContent = message;

    els.zoneToast.classList.remove('hidden', 'show');
    requestAnimationFrame(() => els.zoneToast.classList.add('show'));

    if (toastTimer) window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      els.zoneToast.classList.remove('show');
      window.setTimeout(() => els.zoneToast.classList.add('hidden'), 260);
    }, 7000);
  }

  function sendHourlyZoneNotification(hourKey) {
    const hour = ((hourKey % 24) + 24) % 24;
    const timeText = `${String(hour).padStart(2, '0')}:00`;
    const message = pickZoneMessage(hourKey);

    showZoneToast(timeText, message);

    if (
      notificationsEnabled() &&
      'Notification' in window &&
      Notification.permission === 'granted' &&
      'serviceWorker' in navigator
    ) {
      navigator.serviceWorker.ready
        .then(registration => registration.showNotification(
          `ZONE CLOCK — ${timeText}`,
          {
            body: message,
            icon: './icons/icon-192.png',
            badge: './icons/icon-192.png',
            tag: `zone-hour-${hourKey}`,
            renotify: true,
            requireInteraction: true,
            silent: false,
            timestamp: Date.now(),
            data: {
              url: './',
              zoneTime: timeText,
              hourKey
            }
          }
        ))
        .catch(() => {});
    }
  }

  function syncNotificationHourMarker() {
    lastNotifiedHourKey = Math.floor(absoluteGameSeconds / 3600);
  }

  function checkHourlyZoneNotification(previousAbsolute, currentAbsolute) {
    if (!(currentAbsolute > previousAbsolute)) {
      syncNotificationHourMarker();
      return;
    }

    const previousHour = Math.floor(previousAbsolute / 3600);
    const currentHour = Math.floor(currentAbsolute / 3600);

    if (lastNotifiedHourKey === null) {
      lastNotifiedHourKey = previousHour;
    }

    if (currentHour > previousHour && currentHour > lastNotifiedHourKey) {
      // If a large jump happened, show only the most recent crossed hour.
      sendHourlyZoneNotification(currentHour);
      lastNotifiedHourKey = currentHour;
    }
  }

  if (els.enableNotificationsBtn) {
    els.enableNotificationsBtn.addEventListener('click', async () => {
      if (!('Notification' in window)) {
        updateNotificationSettingsUi();
        return;
      }

      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          localStorage.setItem(NOTIFICATION_KEY, '1');
          showZoneToast(formatClock(gameSeconds), 'Уведомления Zone Clock включены.');
        }
      } catch (_) {}

      updateNotificationSettingsUi();
    });
  }

  function buildTestRows() {
    if (!els.testTableBody || els.testTableBody.children.length) return;

    let saved = {};
    try {
      saved = JSON.parse(localStorage.getItem(TEST_STORAGE_KEY) || '{}') || {};
    } catch (_) {
      saved = {};
    }

    const fragment = document.createDocumentFragment();

    for (let totalMinutes = 0; totalMinutes <= 24 * 60; totalMinutes += 15) {
      const h = Math.floor(totalMinutes / 60);
      const m = totalMinutes % 60;
      const label = totalMinutes === 24 * 60
        ? '24:00'
        : `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

      const tr = document.createElement('tr');

      const gameCell = document.createElement('td');
      gameCell.className = 'test-game-time';
      gameCell.textContent = label;

      const zoneCell = document.createElement('td');

      const zoneControls = document.createElement('div');
      zoneControls.className = 'test-zone-controls';

      const input = document.createElement('input');
      input.className = 'test-zone-input';
      input.type = 'text';
      input.inputMode = 'numeric';
      input.autocomplete = 'off';
      input.placeholder = 'HH:MM';
      input.maxLength = 5;
      input.dataset.gameTime = label;
      const savedValue = typeof saved[label] === 'string' ? saved[label].trim() : '';
      input.value = savedValue || label;

      input.addEventListener('input', () => {
        let value = input.value.replace(/[^\d:]/g, '').slice(0, 5);

        if (/^\d{3,4}$/.test(value) && !value.includes(':')) {
          value = value.length === 3
            ? `${value.slice(0, 1)}:${value.slice(1)}`
            : `${value.slice(0, 2)}:${value.slice(2)}`;
        }

        input.value = value;
        saveTestTable();
      });

      const nowBtn = document.createElement('button');
      nowBtn.type = 'button';
      nowBtn.className = 'test-now-btn';
      nowBtn.textContent = 'СЕЙЧАС';
      nowBtn.title = 'Записать текущее время ZONE CLOCK';
      nowBtn.setAttribute('aria-label', `Записать текущее время ZONE CLOCK для ${label}`);

      nowBtn.addEventListener('click', () => {
        updateNow();
        const current = formatClock(gameSeconds);
        input.value = current;
        saveTestTable();

        nowBtn.classList.add('captured');
        nowBtn.textContent = 'ГОТОВО';
        if (els.testCurrentTime) els.testCurrentTime.textContent = current;
        if (els.testMessage) {
          els.testMessage.textContent = `${label}: записано время ZONE CLOCK ${current}.`;
        }

        window.setTimeout(() => {
          nowBtn.classList.remove('captured');
          nowBtn.textContent = 'СЕЙЧАС';
        }, 650);
      });

      zoneControls.append(input, nowBtn);
      zoneCell.appendChild(zoneControls);
      tr.append(gameCell, zoneCell);
      fragment.appendChild(tr);
    }

    els.testTableBody.appendChild(fragment);
  }

  function getTestData() {
    const result = {};
    if (!els.testTableBody) return result;

    els.testTableBody.querySelectorAll('.test-zone-input').forEach(input => {
      result[input.dataset.gameTime] = input.value.trim();
    });

    return result;
  }

  function saveTestTable() {
    try {
      localStorage.setItem(TEST_STORAGE_KEY, JSON.stringify(getTestData()));
      if (els.testMessage) els.testMessage.textContent = 'Значения сохранены.';
    } catch (_) {
      if (els.testMessage) els.testMessage.textContent = 'Не удалось сохранить значения.';
    }
  }

  function csvEscape(value) {
    const text = String(value ?? '');
    return `"${text.replace(/"/g, '""')}"`;
  }

  function exportTestCsv() {
    const data = getTestData();
    const rows = [
      ['Игра', 'ZONE CLOCK'],
    ];

    for (let totalMinutes = 0; totalMinutes <= 24 * 60; totalMinutes += 15) {
      const h = Math.floor(totalMinutes / 60);
      const m = totalMinutes % 60;
      const label = totalMinutes === 24 * 60
        ? '24:00'
        : `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      rows.push([label, data[label] || '']);
    }

    const csv = '\uFEFF' + rows
      .map(row => row.map(csvEscape).join(';'))
      .join('\r\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'zone-clock-test-v43.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();

    window.setTimeout(() => URL.revokeObjectURL(url), 1000);

    if (els.testMessage) {
      els.testMessage.textContent = 'CSV экспортирован. Этот файл можно загрузить в ChatGPT.';
    }
  }

  function clearTestTable() {
    if (!window.confirm('Очистить все введённые значения теста?')) return;

    if (els.testTableBody) {
      els.testTableBody.querySelectorAll('.test-zone-input').forEach(input => {
        input.value = '';
      });
    }

    localStorage.removeItem(TEST_STORAGE_KEY);
    if (els.testMessage) els.testMessage.textContent = 'Таблица очищена.';
  }

  if (els.testBtn) {
    els.testBtn.addEventListener('click', () => {
      if (els.testCurrentTime) els.testCurrentTime.textContent = formatClock(gameSeconds);
      buildTestRows();
      if (typeof els.testDialog.showModal === 'function') {
        els.testDialog.showModal();
      } else {
        els.testDialog.setAttribute('open', '');
      }
    });
  }

  if (els.closeTestBtn) {
    els.closeTestBtn.addEventListener('click', () => {
      if (typeof els.testDialog.close === 'function') els.testDialog.close();
      else els.testDialog.removeAttribute('open');
    });
  }

  if (els.testDialog) {
    els.testDialog.addEventListener('click', (event) => {
      if (event.target === els.testDialog) {
        if (typeof els.testDialog.close === 'function') els.testDialog.close();
        else els.testDialog.removeAttribute('open');
      }
    });
  }

  if (els.exportTestBtn) els.exportTestBtn.addEventListener('click', exportTestCsv);
  if (els.clearTestBtn) els.clearTestBtn.addEventListener('click', clearTestTable);

  syncNotificationHourMarker();
  updateNotificationSettingsUi();

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
