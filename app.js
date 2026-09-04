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
  const DAYLIGHT_TEST_STORAGE_KEY = 'stalker2-zone-clock-daylight-test-v1';
  const MAP_SCALE_STORAGE_KEY = 'stalker2-zone-clock-map-scale-v1';
  const NOTIFICATION_KEY = 'stalker2-zone-clock-notifications-v1';
  const NOTIFICATION_NEXT_KEY = 'stalker2-zone-clock-next-message-v1';
  const NOTIFICATION_INTERVAL_KEY = 'stalker2-zone-clock-message-interval-v1';

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
    updateAppBtn: $('updateAppBtn'), updateAppStatus: $('updateAppStatus'),
    enableNotificationsBtn: $('enableNotificationsBtn'),
    notificationStatus: $('notificationStatus'),
    notificationIntervalSelect: $('notificationIntervalSelect'),
    zoneToast: $('zoneToast'),
    mapBtn: $('mapBtn'), closeMapBtn: $('closeMapBtn'), mapDialog: $('mapDialog'),
    mapViewport: $('mapViewport'), zoneMapTransform: $('zoneMapTransform'),
    zoneMapImage: $('zoneMapImage'), mapOverlay: $('mapOverlay'),
    mapMeasureLine: $('mapMeasureLine'), mapMeasurePoints: $('mapMeasurePoints'),
    mapMeasureBtn: $('mapMeasureBtn'), mapUndoBtn: $('mapUndoBtn'),
    mapClearBtn: $('mapClearBtn'), mapZoomOutBtn: $('mapZoomOutBtn'),
    mapZoomInBtn: $('mapZoomInBtn'), mapFitBtn: $('mapFitBtn'),
    mapDistance: $('mapDistance'), mapPointCount: $('mapPointCount'),
mapMeasureHint: $('mapMeasureHint'),
    mapKnownDistanceKm: $('mapKnownDistanceKm'),
    mapApplyCalibrationBtn: $('mapApplyCalibrationBtn'),
    mapResetCalibrationBtn: $('mapResetCalibrationBtn'),
    mapCalibrationMessage: $('mapCalibrationMessage'),
    settingsTestBtn: $('settingsTestBtn'), closeTestBtn: $('closeTestBtn'), testDialog: $('testDialog'),
    testCurrentTime: $('testCurrentTime'), testTableBody: $('testTableBody'),
    dayCalibrationDetails: $('dayCalibrationDetails'),
    daylightMarksList: $('daylightMarksList'),
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
      checkZoneNotifications(notificationStartAbsolute, absoluteGameSeconds);
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

    checkZoneNotifications(notificationStartAbsolute, absoluteGameSeconds);
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
      syncNotificationSchedule();

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
    syncNotificationSchedule();
      saveState(true);
      render();
    });
  });

  els.dayMinusBtn.addEventListener('click', () => {
    updateNow();
    addGameDelta(-DAY_SECONDS);
    lastRealMs = Date.now();
    els.message.textContent = 'День уменьшен на 1.';
    syncNotificationSchedule();
    saveState(true);
    render();
  });

  els.dayPlusBtn.addEventListener('click', () => {
    updateNow();
    addGameDelta(DAY_SECONDS);
    lastRealMs = Date.now();
    els.message.textContent = 'День увеличен на 1.';
    syncNotificationSchedule();
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
    "Перегруз снижает выносливость. Если рюкзак забит под завязку, далеко не убежишь.",
    "Техники в лагерях могут улучшить оружие, броню и снаряжение. Иногда хороший ремонт важнее новой пушки.",
    "Фильтры карты помогают скрывать лишние метки и быстрее находить нужное в PDA.",
    "Радиацию лучше снимать сразу. Чем дольше ждёшь, тем дороже обходится ошибка.",
    "Антирадиационные препараты надёжнее импровизированных средств, но в Зоне используют всё, что работает.",
    "Чем тяжелее рюкзак, тем быстрее заканчивается выносливость.",
    "Не заходи в аномальное поле без болтов. Один бросок дешевле одного неверного шага.",
    "Если детектор начинает пищать чаще, опасность уже совсем рядом.",
    "Воздух дрожит, искрит или странно мерцает — сначала брось болт, потом иди.",
    "Некоторые аномалии на короткое время разряжаются после срабатывания. Этого окна едва хватает, чтобы проскочить.",
    "Артефакт может быть ценным, но путь к нему часто опаснее самой находки.",
    "Перед походом проверь аптечки, бинты, еду, патроны и средства от радиации.",
    "Быстрые слоты нужны не для красоты. Назначь туда то, что может понадобиться за секунду.",
    "Кровотечение лучше остановить сразу, даже если бой ещё не закончился.",
    "При высокой радиации сначала уходи от источника, а уже потом разбирайся с последствиями.",
    "Красная зона на индикаторе — не повод экономить лекарства.",
    "Тайники часто содержат полезные припасы. В тёмных местах фонарь экономит много времени.",
    "Лишний хлам лучше продать, выбросить или оставить в личном тайнике.",
    "Общий тайник в хабах позволяет забрать оставленные вещи в другом безопасном месте.",
    "Не тащи всё найденное. Свободный вес иногда важнее ещё одной дешёвой винтовки.",
    "Выброс не пережидают под деревом. Ищи закрытое помещение, подвал, пещеру или другое надёжное укрытие.",
    "Если пришло предупреждение о выбросе, прекращай поиски хабара и двигайся к укрытию.",
    "Во время выброса не выходи наружу раньше времени, даже если кажется, что всё уже закончилось.",
    "PDA показывает ближайшие укрытия и важные метки. Поглядывай на карту до того, как станет поздно.",
    "Компас помогает ориентироваться без постоянного открытия карты.",
    "Метки на карте полезнее, если расставлять их заранее: опасность, аномалия, хабар, радиация.",
    "Серые отметки на компасе могут указывать на тела с ещё не собранными вещами.",
    "Красный индикатор боя означает, что рядом всё ещё есть угроза.",
    "Мутанты опасны, но их логова иногда скрывают полезные вещи.",
    "Не каждый встречный сталкер враг. Репутация и принадлежность к группировке имеют значение.",
    "Некоторые противники атакуют без предупреждения. Не подходи к незнакомой группе с опущенным вниманием.",
    "Аномалии можно использовать против мутантов, если суметь заманить их в опасную область.",
    "Пистолет и дробовик решают разные задачи. Подбирай оружие под дистанцию и цель.",
    "Бронебойные боеприпасы особенно полезны против хорошо защищённых людей.",
    "Обычные патроны разумнее тратить на незащищённых целей и мутантов, если ситуация позволяет.",
    "Хорошее состояние оружия уменьшает риск осечки в самый неподходящий момент.",
    "После тяжёлого боя проверь состояние брони и оружия до следующей встречи.",
    "Не забывай ремонтироваться у техников, пока поломка ещё не стала критической.",
    "Детекторы высокого класса точнее показывают расположение опасностей и артефактов.",
    "Если детектор вдруг молчит, это не всегда означает безопасность. Осмотрись внимательно.",
    "В Зоне полезно читать записи PDA: там могут быть сведения о заданиях, тайниках и опасных местах.",
    "Перед дальним переходом сохранись и проверь маршрут.",
    "Короткий путь через аномалии редко остаётся коротким после первой ошибки.",
    "Если слышишь счётчик Гейгера, не стой на месте, пытаясь понять источник.",
    "Защитный костюм с хорошей радиационной защитой заметно облегчает жизнь в заражённых местах.",
    "Некоторые артефакты помогают бороться с радиацией, но могут иметь собственные побочные эффекты.",
    "Еда восстанавливает силы, но не заменяет лечение серьёзных ран.",
    "Энергетики помогают с выносливостью, но не делают перегруженный рюкзак легче.",
    "Если выносливость постоянно на нуле, сначала посмотри на вес снаряжения.",
    "В темноте фонарь помогает искать проходы и тайники, но свет также может выдать твою позицию.",
    "Перед штурмом укрытия проверь гранаты. Они полезны против противников за стенами и препятствиями.",
    "Не бросай гранату слишком близко к себе и союзникам.",
    "Используй укрытия. Даже хорошая броня не делает открытое поле безопасным.",
    "Перезаряжайся до боя, а не после того, как услышал щелчок пустого магазина.",
    "Проверяй количество патронов перед выходом из лагеря.",
    "Не все боеприпасы подходят к каждому варианту оружия. Смотри маркировку и калибр.",
    "Ночью ориентиры хуже видны, поэтому заранее запомни путь к безопасному месту.",
    "На рассвете видимость меняется быстро. Не рассчитывай, что тени останутся прежними.",
    "Перед закатом лучше закончить длинный переход или заранее выбрать безопасный маршрут.",
    "Вода, болота и низины могут скрывать радиацию и аномалии.",
    "Слишком тихое место не обязательно безопасно. Иногда это значит, что местная живность уже разбежалась.",
    "Если мутанты внезапно покидают район, стоит задуматься, от чего они бегут.",
    "Шум боя привлекает внимание. После перестрелки не стой долго на одном месте.",
    "Сначала убедись, что бой действительно закончился, и только потом собирай трофеи.",
    "Не подходи к телу по прямой, если не уверен, что рядом нет второго стрелка.",
    "Хабар ничего не стоит, если ты не донёс его до торговца.",
    "У торговцев цены различаются. Иногда выгоднее донести редкую вещь до другого лагеря.",
    "Задания могут привести в опасные места. Подготовка перед выходом часто важнее награды.",
    "Проводники позволяют быстро добраться до знакомых мест, если не хочется снова идти пешком.",
    "Сохраняй запас бинтов. Кровотечение может быть опаснее самого попадания.",
    "Аптечка лечит повреждения, но не всегда решает проблему радиации или кровотечения.",
    "Сон позволяет переждать время, но перед отдыхом лучше убедиться, что место действительно безопасно.",
    "При выборе укрытия от выброса стены и крыша важнее красивого вида.",
    "Некоторые помещения выглядят безопасными, но не считаются полноценным укрытием.",
    "Следи за предупреждениями в PDA. В Зоне полезная информация часто появляется раньше самой опасности.",
    "Если путь кажется подозрительно свободным, проверь его болтом.",
    "Аномалии могут находиться совсем рядом друг с другом. Первый безопасный шаг ничего не гарантирует.",
    "При исследовании аномального поля двигайся медленно и оставляй себе путь назад.",
    "Не гонись за артефактом, если начинается выброс.",
    "Снаряжение с высокой защитой тяжелее. Баланс между бронёй и мобильностью часто важнее максимальных цифр.",
    "Оружие ближнего боя удобно в тесных помещениях, но требует подпустить угрозу слишком близко.",
    "Дальнобойное оружие даёт преимущество только там, где есть обзор.",
    "Перед входом в здание прислушайся. Шаги и голоса часто предупреждают раньше интерфейса.",
    "Не стреляй по всему, что движется. Нейтральный сталкер может стать врагом после одной ошибки.",
    "Отношения с группировками влияют на то, как тебя встречают в разных местах.",
    "Если союзники начали стрелять, сначала пойми направление угрозы.",
    "Сохраняй редкие расходники для ситуаций, где обычные средства уже не справляются.",
    "Не продавай всё незнакомое сразу. Некоторые предметы могут понадобиться для заданий или улучшений.",
    "Перед модернизацией оружия реши, чего тебе не хватает: точности, надёжности, отдачи или веса.",
    "Улучшения брони могут менять не только защиту, но и удобство переноски снаряжения.",
    "Проверяй PDA после разговоров: новые сведения и метки могут появиться без отдельного предупреждения.",
    "Не игнорируй побочные задания. Они часто открывают полезные маршруты, знакомства и тайники.",
    "Зона награждает любопытство, но наказывает спешку.",
    "Хороший сталкер смотрит не только вперёд, но и туда, откуда пришёл.",
    "Если сомневаешься между ещё одним артефактом и свободным весом — вспомни, что до базы ещё нужно дойти.",
    "Перед новым районом лучше иметь запас денег на ремонт и лечение.",
    "Самая дорогая экипировка бесполезна, если она сломана.",
    "В незнакомой местности чаще сверяйся с картой и ориентирами.",
    "Изучай привычки мутантов. Понимание поведения экономит боеприпасы.",
    "Некоторые опасности проще обойти, чем победить.",
    "Зона не обязана быть честной. Проверяй даже знакомые маршруты.",
  ];

  let toastTimer = null;
  let nextRegularNotificationAt = null;
  let lastZoneMessageIndex = -1;

  const ZONE_DAY_EVENTS = [
    {
      second: MORNING_START,
      name: 'рассвет',
      message: 'Наступил рассвет. Зона просыпается — проверь маршрут, снаряжение и то, что осталось за спиной.'
    },
    {
      second: DAY_START,
      name: 'день',
      message: 'Наступил день. Видимость лучше, но открытые места от этого безопаснее не становятся.'
    },
    {
      second: EVENING_START,
      name: 'закат',
      message: 'Наступил закат. Свет быстро уходит — самое время вспомнить, где ближайшее укрытие.'
    },
    {
      second: NIGHT_START,
      name: 'ночь',
      message: 'Наступила ночь. Фонарь помогает видеть дорогу, но заодно помогает другим увидеть тебя.'
    }
  ];

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

  function selectedNotificationInterval() {
    const allowed = new Set(['random', '1', '2', '4', '8', '12', '24']);
    const stored = localStorage.getItem(NOTIFICATION_INTERVAL_KEY) || 'random';
    return allowed.has(stored) ? stored : 'random';
  }

  function regularIntervalSeconds() {
    const mode = selectedNotificationInterval();

    if (mode === 'random') {
      // Random cadence without exact whole-hour hits:
      // choose 1–6 nominal hours, where each hour is 54–68 Zone minutes.
      const hours = 1 + Math.floor(Math.random() * 6);
      let totalMinutes = 0;

      for (let i = 0; i < hours; i++) {
        totalMinutes += 54 + Math.floor(Math.random() * 15);
      }

      return totalMinutes * 60;
    }

    return Number(mode) * 3600;
  }

  function postQuietOffsetSeconds() {
    // Fixed modes resume immediately after a protected window.
    // Random mode chooses a fresh 1–6 interval with 54–68 min per nominal hour.
    if (selectedNotificationInterval() === 'random') {
      return regularIntervalSeconds();
    }

    return 1;
  }

  function pickZoneMessage() {
    if (!ZONE_MESSAGES.length) return '';

    let index = Math.floor(Math.random() * ZONE_MESSAGES.length);
    if (ZONE_MESSAGES.length > 1 && index === lastZoneMessageIndex) {
      index = (index + 1 + Math.floor(Math.random() * (ZONE_MESSAGES.length - 1))) % ZONE_MESSAGES.length;
    }

    lastZoneMessageIndex = index;
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

  function sendZoneNotification(timeText, message, tag) {
    showZoneToast(timeText, message);

    if (
      notificationsEnabled() &&
      'Notification' in window &&
      Notification.permission === 'granted' &&
      'serviceWorker' in navigator
    ) {
      navigator.serviceWorker.ready
        .then(registration => registration.showNotification(
          timeText,
          {
            body: message,
            icon: './icons/icon-192.png',
            badge: './icons/icon-192.png',
            tag,
            renotify: true,
            requireInteraction: true,
            silent: false,
            timestamp: Date.now(),
            data: {
              url: './',
              zoneTime: timeText
            }
          }
        ))
        .catch(() => {});
    }
  }

  function formatAbsoluteZoneTime(absoluteSeconds) {
    const wrapped = ((absoluteSeconds % DAY_SECONDS) + DAY_SECONDS) % DAY_SECONDS;
    return formatClock(wrapped);
  }

  function quietWindowAt(absoluteSeconds) {
    const dayStart = Math.floor(absoluteSeconds / DAY_SECONDS) * DAY_SECONDS;

    for (const eventInfo of ZONE_DAY_EVENTS) {
      const eventAbsolute = dayStart + eventInfo.second;
      const start = eventAbsolute - 3600;
      const end = eventAbsolute + 3600;

      if (absoluteSeconds >= start && absoluteSeconds <= end) {
        return { start, end, eventAbsolute, eventInfo };
      }
    }

    return null;
  }

  function nextAllowedRegularTime(absoluteSeconds) {
    let candidate = absoluteSeconds;
    let guard = 0;

    while (guard++ < 10) {
      const quiet = quietWindowAt(candidate);
      if (!quiet) return candidate;

      candidate = quiet.end + postQuietOffsetSeconds();
    }

    return candidate;
  }

  function saveNextRegularNotification() {
    if (Number.isFinite(nextRegularNotificationAt)) {
      localStorage.setItem(
        NOTIFICATION_NEXT_KEY,
        String(Math.round(nextRegularNotificationAt))
      );
    }
  }

  function scheduleNextRegularNotification(fromAbsolute = absoluteGameSeconds) {
    const candidate = fromAbsolute + regularIntervalSeconds();
    nextRegularNotificationAt = nextAllowedRegularTime(candidate);
    saveNextRegularNotification();
  }

  function restoreNotificationSchedule() {
    const stored = Number(localStorage.getItem(NOTIFICATION_NEXT_KEY));

    if (Number.isFinite(stored) && stored > absoluteGameSeconds) {
      nextRegularNotificationAt = nextAllowedRegularTime(stored);
      saveNextRegularNotification();
      return;
    }

    scheduleNextRegularNotification(absoluteGameSeconds);
  }

  function syncNotificationSchedule() {
    scheduleNextRegularNotification(absoluteGameSeconds);
  }

  function crossedDayEvents(previousAbsolute, currentAbsolute) {
    const crossed = [];
    const firstDay = Math.floor(previousAbsolute / DAY_SECONDS);
    const lastDay = Math.floor(currentAbsolute / DAY_SECONDS);

    for (let day = firstDay; day <= lastDay; day++) {
      const base = day * DAY_SECONDS;

      for (const eventInfo of ZONE_DAY_EVENTS) {
        const at = base + eventInfo.second;
        if (at > previousAbsolute && at <= currentAbsolute) {
          crossed.push({ at, eventInfo });
        }
      }
    }

    return crossed;
  }

  function checkZoneNotifications(previousAbsolute, currentAbsolute) {
    if (!(currentAbsolute > previousAbsolute)) {
      syncNotificationSchedule();
      return;
    }

    // Day-part events have priority over ordinary random messages.
    const events = crossedDayEvents(previousAbsolute, currentAbsolute);

    if (events.length) {
      // Avoid a burst after a large catch-up: report the most recent event only.
      const latest = events[events.length - 1];
      const timeText = formatAbsoluteZoneTime(latest.at);

      sendZoneNotification(
        timeText,
        latest.eventInfo.message,
        `zone-event-${latest.eventInfo.name}-${Math.floor(latest.at)}`
      );

      // No ordinary messages until at least one hour after this event.
      const quietEnd = latest.at + 3600;

      if (
        !Number.isFinite(nextRegularNotificationAt) ||
        nextRegularNotificationAt <= currentAbsolute
      ) {
        scheduleNextRegularNotification(currentAbsolute);
      } else if (nextRegularNotificationAt <= quietEnd) {
        nextRegularNotificationAt = nextAllowedRegularTime(
          quietEnd + postQuietOffsetSeconds()
        );
        saveNextRegularNotification();
      }
      return;
    }

    if (!Number.isFinite(nextRegularNotificationAt)) {
      restoreNotificationSchedule();
    }

    if (currentAbsolute >= nextRegularNotificationAt) {
      const quiet = quietWindowAt(currentAbsolute);

      if (quiet) {
        nextRegularNotificationAt = nextAllowedRegularTime(
          quiet.end + postQuietOffsetSeconds()
        );
        saveNextRegularNotification();
        return;
      }

      const timeText = formatAbsoluteZoneTime(currentAbsolute);
      const message = pickZoneMessage();

      sendZoneNotification(
        timeText,
        message,
        `zone-message-${Math.floor(currentAbsolute)}`
      );

      scheduleNextRegularNotification(currentAbsolute);
    }
  }

  if (els.notificationIntervalSelect) {
    els.notificationIntervalSelect.value = selectedNotificationInterval();

    els.notificationIntervalSelect.addEventListener('change', () => {
      const value = els.notificationIntervalSelect.value;
      const allowed = new Set(['random', '1', '2', '4', '8', '12', '24']);

      if (!allowed.has(value)) {
        els.notificationIntervalSelect.value = 'random';
        localStorage.setItem(NOTIFICATION_INTERVAL_KEY, 'random');
      } else {
        localStorage.setItem(NOTIFICATION_INTERVAL_KEY, value);
      }

      syncNotificationSchedule();

      const selectedLabel =
        els.notificationIntervalSelect.options[
          els.notificationIntervalSelect.selectedIndex
        ]?.textContent || 'Рандомный';

      showZoneToast(
        formatClock(gameSeconds),
        `Интервал сообщений: ${selectedLabel}.`
      );
    });
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
          syncNotificationSchedule();
          showZoneToast(formatClock(gameSeconds), 'Уведомления Zone Clock включены.');
        }
      } catch (_) {}

      updateNotificationSettingsUi();
    });
  }



  const MAP_IMAGE_SIZE = 2048;
  const DEFAULT_MAP_METERS_PER_PIXEL = 6.5;

  let mapMetersPerPixel = (() => {
    const stored = Number(localStorage.getItem(MAP_SCALE_STORAGE_KEY));
    return Number.isFinite(stored) && stored > 0.1 && stored < 50
      ? stored
      : DEFAULT_MAP_METERS_PER_PIXEL;
  })();

  let mapZoom = 1;
  let mapPanX = 0;
  let mapPanY = 0;
  let mapFitZoom = 1;
  let mapMeasureMode = false;
  let mapMeasurePoints = [];
  let mapPointerState = null;
  const mapActivePointers = new Map();
  let mapPinchState = null;
  let mapLastTapAt = 0;
  let mapLastTapX = 0;
  let mapLastTapY = 0;
  let mapHdLoaded = true;

  function formatMapNumber(value, digits = 2) {
    return Number(value).toLocaleString('ru-RU', {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits
    });
  }

  function formatMapDistance(meters) {
    if (!(meters > 0)) return '—';

    if (meters < 1000) {
      return `${Math.round(meters)} м`;
    }

    return `${formatMapNumber(meters / 1000, 2)} км`;
  }

  function mapRoutePixelLength() {
    let total = 0;

    for (let i = 1; i < mapMeasurePoints.length; i++) {
      const a = mapMeasurePoints[i - 1];
      const b = mapMeasurePoints[i];
      total += Math.hypot(b.x - a.x, b.y - a.y);
    }

    return total;
  }

  function mapRouteMeters() {
    return mapRoutePixelLength() * mapMetersPerPixel;
  }

  function updateMapInfo() {
    if (els.mapDistance) els.mapDistance.textContent = formatMapDistance(mapRouteMeters());
    if (els.mapPointCount) els.mapPointCount.textContent = String(mapMeasurePoints.length);

    if (els.mapMeasureBtn) {
      els.mapMeasureBtn.classList.toggle('active', mapMeasureMode);
      els.mapMeasureBtn.textContent = mapMeasureMode ? 'ИЗМЕРЕНИЕ: ВКЛ' : 'ИЗМЕРИТЬ';
    }

    if (els.mapMeasureHint) {
      if (mapMeasureMode) {
        els.mapMeasureHint.textContent =
          'Нажимайте на карту для добавления точек. Перетаскивание двигает карту.';
      } else if (mapMeasurePoints.length >= 2) {
        els.mapMeasureHint.textContent =
          `Маршрут: ${formatMapDistance(mapRouteMeters())}.`;
      } else {
        els.mapMeasureHint.textContent =
          'Увеличение: два пальца, кнопки +/− или колёсико. Для маршрута включите «ИЗМЕРИТЬ».';
      }
    }
  }

  function renderMapMeasurement() {
    if (!els.mapMeasureLine || !els.mapMeasurePoints) return;

    els.mapMeasureLine.setAttribute(
      'points',
      mapMeasurePoints.map(point => `${point.x},${point.y}`).join(' ')
    );

    els.mapMeasurePoints.innerHTML = '';

    mapMeasurePoints.forEach((point, index) => {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', point.x);
      circle.setAttribute('cy', point.y);
      circle.setAttribute('r', Math.max(7, 14 / Math.max(mapZoom, .2)));
      circle.setAttribute('class', 'map-measure-point');
      els.mapMeasurePoints.appendChild(circle);

      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', point.x + 15 / Math.max(mapZoom, .2));
      text.setAttribute('y', point.y - 15 / Math.max(mapZoom, .2));
      text.setAttribute('class', 'map-measure-point-label');
      text.setAttribute('font-size', Math.max(18, 28 / Math.max(mapZoom, .2)));
      text.textContent = String(index + 1);
      els.mapMeasurePoints.appendChild(text);
    });

    updateMapInfo();
  }


  function ensureHdZoneMap() {
    // v63: используется одна цельная карта 8192×8192.
  }

  function maybeLoadHdZoneMap() {
    // Дополнительные HD-слои и тайлы не используются.
  }





  function applyMapTransform() {
    if (!els.zoneMapTransform) return;

    els.zoneMapTransform.style.transform =
      `translate(${mapPanX}px, ${mapPanY}px) scale(${mapZoom})`;

    maybeLoadHdZoneMap();
    renderMapMeasurement();
  }

  function fitZoneMap() {
    if (!els.mapViewport) return;

    const rect = els.mapViewport.getBoundingClientRect();
    if (!(rect.width > 20 && rect.height > 20)) return;

    mapFitZoom = Math.min(
      rect.width / MAP_IMAGE_SIZE,
      rect.height / MAP_IMAGE_SIZE
    );

    mapZoom = mapFitZoom;
    mapPanX = (rect.width - MAP_IMAGE_SIZE * mapZoom) / 2;
    mapPanY = (rect.height - MAP_IMAGE_SIZE * mapZoom) / 2;

    applyMapTransform();
  }

  function zoomZoneMap(factor, clientX = null, clientY = null) {
    if (!els.mapViewport) return;

    const rect = els.mapViewport.getBoundingClientRect();
    const anchorX = clientX == null ? rect.left + rect.width / 2 : clientX;
    const anchorY = clientY == null ? rect.top + rect.height / 2 : clientY;

    const localX = anchorX - rect.left;
    const localY = anchorY - rect.top;

    const imageX = (localX - mapPanX) / mapZoom;
    const imageY = (localY - mapPanY) / mapZoom;

    const minZoom = Math.max(.08, mapFitZoom * .75);
    const maxZoom = 8;
    const nextZoom = Math.min(maxZoom, Math.max(minZoom, mapZoom * factor));

    mapPanX = localX - imageX * nextZoom;
    mapPanY = localY - imageY * nextZoom;
    mapZoom = nextZoom;

    applyMapTransform();
  }

  function clientToMapPoint(clientX, clientY) {
    const rect = els.mapViewport.getBoundingClientRect();

    const x = (clientX - rect.left - mapPanX) / mapZoom;
    const y = (clientY - rect.top - mapPanY) / mapZoom;

    if (x < 0 || y < 0 || x > MAP_IMAGE_SIZE || y > MAP_IMAGE_SIZE) {
      return null;
    }

    return {
      x: Math.max(0, Math.min(MAP_IMAGE_SIZE, x)),
      y: Math.max(0, Math.min(MAP_IMAGE_SIZE, y))
    };
  }


  function pointerDistance(a, b) {
    return Math.hypot(b.x - a.x, b.y - a.y);
  }

  function pointerMidpoint(a, b) {
    return {
      x: (a.x + b.x) / 2,
      y: (a.y + b.y) / 2
    };
  }

  function beginMapPinch() {
    if (mapActivePointers.size < 2 || !els.mapViewport) {
      mapPinchState = null;
      return;
    }

    const points = Array.from(mapActivePointers.values()).slice(0, 2);
    const midpoint = pointerMidpoint(points[0], points[1]);
    const distance = pointerDistance(points[0], points[1]);

    if (!(distance > 0)) return;

    const rect = els.mapViewport.getBoundingClientRect();
    const localX = midpoint.x - rect.left;
    const localY = midpoint.y - rect.top;

    mapPinchState = {
      startDistance: distance,
      startZoom: mapZoom,
      imageX: (localX - mapPanX) / mapZoom,
      imageY: (localY - mapPanY) / mapZoom
    };
  }

  function updateMapPinch() {
    if (!mapPinchState || mapActivePointers.size < 2 || !els.mapViewport) return;

    const points = Array.from(mapActivePointers.values()).slice(0, 2);
    const midpoint = pointerMidpoint(points[0], points[1]);
    const distance = pointerDistance(points[0], points[1]);

    if (!(distance > 0)) return;

    const rect = els.mapViewport.getBoundingClientRect();
    const localX = midpoint.x - rect.left;
    const localY = midpoint.y - rect.top;

    const minZoom = Math.max(.08, mapFitZoom * .75);
    const maxZoom = 8;
    const scaleFactor = distance / mapPinchState.startDistance;
    const nextZoom = Math.min(
      maxZoom,
      Math.max(minZoom, mapPinchState.startZoom * scaleFactor)
    );

    mapPanX = localX - mapPinchState.imageX * nextZoom;
    mapPanY = localY - mapPinchState.imageY * nextZoom;
    mapZoom = nextZoom;

    applyMapTransform();
  }

  function addMapMeasurePoint(clientX, clientY) {
    const point = clientToMapPoint(clientX, clientY);
    if (!point) return;

    mapMeasurePoints.push(point);
    renderMapMeasurement();
  }

  function clearMapMeasurement() {
    mapMeasurePoints = [];
    renderMapMeasurement();
  }

  if (els.mapBtn) {
    els.mapBtn.addEventListener('click', () => {
      if (typeof els.mapDialog.showModal === 'function') {
        els.mapDialog.showModal();
      } else {
        els.mapDialog.setAttribute('open', '');
      }

      window.requestAnimationFrame(() => {
        fitZoneMap();
        updateMapInfo();

        // В v57 карта уже состоит из тайлов исходного PNG,
        // поэтому дополнительная подгрузка HD-слоя не требуется.
      });
    });
  }

  if (els.closeMapBtn) {
    els.closeMapBtn.addEventListener('click', () => {
      if (typeof els.mapDialog.close === 'function') els.mapDialog.close();
      else els.mapDialog.removeAttribute('open');
    });
  }

  if (els.mapDialog) {
    els.mapDialog.addEventListener('click', event => {
      if (event.target === els.mapDialog) {
        if (typeof els.mapDialog.close === 'function') els.mapDialog.close();
        else els.mapDialog.removeAttribute('open');
      }
    });
  }

  if (els.mapMeasureBtn) {
    els.mapMeasureBtn.addEventListener('click', () => {
      mapMeasureMode = !mapMeasureMode;
      updateMapInfo();
    });
  }

  if (els.mapUndoBtn) {
    els.mapUndoBtn.addEventListener('click', () => {
      mapMeasurePoints.pop();
      renderMapMeasurement();
    });
  }

  if (els.mapClearBtn) {
    els.mapClearBtn.addEventListener('click', clearMapMeasurement);
  }

  if (els.mapZoomInBtn) {
    els.mapZoomInBtn.addEventListener('click', () => zoomZoneMap(1.35));
  }

  if (els.mapZoomOutBtn) {
    els.mapZoomOutBtn.addEventListener('click', () => zoomZoneMap(1 / 1.35));
  }

  if (els.mapFitBtn) {
    els.mapFitBtn.addEventListener('click', fitZoneMap);
  }

  if (els.mapViewport) {
    els.mapViewport.addEventListener('wheel', event => {
      event.preventDefault();
      zoomZoneMap(event.deltaY < 0 ? 1.18 : 1 / 1.18, event.clientX, event.clientY);
    }, { passive: false });

    els.mapViewport.addEventListener('pointerdown', event => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;

      mapActivePointers.set(event.pointerId, {
        x: event.clientX,
        y: event.clientY
      });

      els.mapViewport.setPointerCapture?.(event.pointerId);

      if (mapActivePointers.size >= 2) {
        mapPointerState = null;
        beginMapPinch();
        return;
      }

      mapPointerState = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        lastX: event.clientX,
        lastY: event.clientY,
        panX: mapPanX,
        panY: mapPanY,
        moved: false
      };
    });

    els.mapViewport.addEventListener('pointermove', event => {
      if (mapActivePointers.has(event.pointerId)) {
        mapActivePointers.set(event.pointerId, {
          x: event.clientX,
          y: event.clientY
        });
      }

      if (mapActivePointers.size >= 2) {
        if (!mapPinchState) beginMapPinch();
        updateMapPinch();
        return;
      }

      if (!mapPointerState || mapPointerState.pointerId !== event.pointerId) return;

      const dx = event.clientX - mapPointerState.startX;
      const dy = event.clientY - mapPointerState.startY;

      if (Math.hypot(dx, dy) > 6) {
        mapPointerState.moved = true;
      }

      if (mapPointerState.moved) {
        mapPanX = mapPointerState.panX + dx;
        mapPanY = mapPointerState.panY + dy;
        applyMapTransform();
      }

      mapPointerState.lastX = event.clientX;
      mapPointerState.lastY = event.clientY;
    });

    els.mapViewport.addEventListener('pointerup', event => {
      const currentPointer = mapPointerState &&
        mapPointerState.pointerId === event.pointerId
        ? mapPointerState
        : null;

      mapActivePointers.delete(event.pointerId);

      if (mapActivePointers.size < 2) {
        mapPinchState = null;
      }

      if (!currentPointer) {
        mapPointerState = null;
        return;
      }

      const wasMoved = currentPointer.moved;
      mapPointerState = null;

      if (!wasMoved) {
        const now = performance.now();
        const nearPreviousTap =
          now - mapLastTapAt < 320 &&
          Math.hypot(
            event.clientX - mapLastTapX,
            event.clientY - mapLastTapY
          ) < 28;

        if (nearPreviousTap) {
          zoomZoneMap(1.7, event.clientX, event.clientY);
          mapLastTapAt = 0;
          return;
        }

        mapLastTapAt = now;
        mapLastTapX = event.clientX;
        mapLastTapY = event.clientY;

        if (mapMeasureMode) {
          addMapMeasurePoint(event.clientX, event.clientY);
        }
      }
    });

    els.mapViewport.addEventListener('pointercancel', event => {
      mapActivePointers.delete(event.pointerId);
      mapPointerState = null;

      if (mapActivePointers.size < 2) {
        mapPinchState = null;
      }
    });
  }


  if (els.mapApplyCalibrationBtn) {
    els.mapApplyCalibrationBtn.addEventListener('click', () => {
      const knownKm = Number(els.mapKnownDistanceKm?.value);
      const pixelLength = mapRoutePixelLength();

      if (!(knownKm > 0) || pixelLength < 10) {
        if (els.mapCalibrationMessage) {
          els.mapCalibrationMessage.textContent =
            'Сначала постройте маршрут минимум из двух точек и укажите известное расстояние.';
        }
        return;
      }

      const calculated = knownKm * 1000 / pixelLength;

      if (!(calculated > 0.1 && calculated < 50)) {
        if (els.mapCalibrationMessage) {
          els.mapCalibrationMessage.textContent =
            'Получился необычный масштаб. Проверьте маршрут и известное расстояние.';
        }
        return;
      }

      mapMetersPerPixel = calculated;
      localStorage.setItem(MAP_SCALE_STORAGE_KEY, String(mapMetersPerPixel));
      renderMapMeasurement();

      if (els.mapCalibrationMessage) {
        els.mapCalibrationMessage.textContent =
          `Калибровка сохранена по маршруту ${formatMapNumber(knownKm, 2)} км.`;
      }
    });
  }

  if (els.mapResetCalibrationBtn) {
    els.mapResetCalibrationBtn.addEventListener('click', () => {
      mapMetersPerPixel = DEFAULT_MAP_METERS_PER_PIXEL;
      localStorage.setItem(MAP_SCALE_STORAGE_KEY, String(mapMetersPerPixel));
      renderMapMeasurement();

      if (els.mapCalibrationMessage) {
        els.mapCalibrationMessage.textContent =
          'Калибровка сброшена к исходной.';
      }
    });
  }

  const DAYLIGHT_EVENT_LABELS = {
    dawn_start: 'Начался рассвет',
    daylight: 'Стало светло',
    sunset_start: 'Начался закат',
    dark: 'Стало темно'
  };

  function loadDaylightMarks() {
    try {
      const data = JSON.parse(localStorage.getItem(DAYLIGHT_TEST_STORAGE_KEY) || '[]');
      return Array.isArray(data) ? data : [];
    } catch (_) {
      return [];
    }
  }

  function saveDaylightMarks(marks) {
    localStorage.setItem(DAYLIGHT_TEST_STORAGE_KEY, JSON.stringify(marks));
  }

  function renderDaylightMarks() {
    if (!els.daylightMarksList) return;

    const marks = loadDaylightMarks();

    if (!marks.length) {
      els.daylightMarksList.textContent = 'Отметок пока нет.';
      return;
    }

    els.daylightMarksList.innerHTML = '';

    const recent = marks.slice(-12).reverse();
    recent.forEach(mark => {
      const row = document.createElement('div');
      row.className = 'daylight-mark-row';

      const label = document.createElement('span');
      label.className = 'daylight-mark-label';
      label.textContent = DAYLIGHT_EVENT_LABELS[mark.type] || mark.type;

      const value = document.createElement('span');
      value.className = 'daylight-mark-value';
      value.textContent = `День ${mark.day} · ${mark.time}`;

      row.append(label, value);
      els.daylightMarksList.appendChild(row);
    });

    if (marks.length > 12) {
      const more = document.createElement('div');
      more.className = 'daylight-mark-more';
      more.textContent = `Ещё ${marks.length - 12} отметок сохранено`;
      els.daylightMarksList.appendChild(more);
    }
  }

  function addDaylightMark(type) {
    updateNow();

    const marks = loadDaylightMarks();
    const time = formatClock(gameSeconds);
    const day = gameDay;

    marks.push({
      type,
      label: DAYLIGHT_EVENT_LABELS[type] || type,
      day,
      time,
      absoluteGameSeconds: Math.round(absoluteGameSeconds),
      capturedAt: new Date().toISOString()
    });

    saveDaylightMarks(marks);
    renderDaylightMarks();

    if (els.testCurrentTime) {
      els.testCurrentTime.textContent = time;
    }

    if (els.testMessage) {
      els.testMessage.textContent =
        `${DAYLIGHT_EVENT_LABELS[type]}: День ${day}, ${time}.`;
    }
  }

  document.querySelectorAll('[data-daylight-event]').forEach(button => {
    button.addEventListener('click', () => {
      addDaylightMark(button.dataset.daylightEvent);

      button.classList.add('captured');
      const original = button.textContent;
      button.textContent = 'ЗАПИСАНО';

      window.setTimeout(() => {
        button.classList.remove('captured');
        button.textContent = original;
      }, 650);
    });
  });


  function animateButtonPress(button) {
    if (!button || button.disabled) return;

    button.classList.remove('zone-button-press');
    // Restart the keyframe animation even on rapid repeated taps.
    void button.offsetWidth;
    button.classList.add('zone-button-press');

    window.setTimeout(() => {
      button.classList.remove('zone-button-press');
    }, 240);
  }

  document.addEventListener('pointerdown', event => {
    const button = event.target.closest('button');
    if (button) animateButtonPress(button);
  }, { passive: true });

  document.addEventListener('keydown', event => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const button = event.target.closest && event.target.closest('button');
    if (button) animateButtonPress(button);
  });

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

    const daylightMarks = loadDaylightMarks();
    rows.push([]);
    rows.push(['СОБЫТИЯ ОСВЕЩЕНИЯ']);
    rows.push(['Событие', 'День', 'Время Зоны', 'Абсолютное время, сек', 'Дата записи']);

    daylightMarks.forEach(mark => {
      rows.push([
        DAYLIGHT_EVENT_LABELS[mark.type] || mark.type,
        mark.day,
        mark.time,
        mark.absoluteGameSeconds,
        mark.capturedAt || ''
      ]);
    });

    const csv = '\uFEFF' + rows
      .map(row => row.map(csvEscape).join(';'))
      .join('\r\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'zone-clock-test-v63.csv';
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
    localStorage.removeItem(DAYLIGHT_TEST_STORAGE_KEY);
    renderDaylightMarks();
    if (els.testMessage) els.testMessage.textContent = 'Таблица и отметки освещения очищены.';
  }

  if (els.settingsTestBtn) {
    els.settingsTestBtn.addEventListener('click', () => {
      if (els.settingsDialog && els.settingsDialog.open) {
        if (typeof els.settingsDialog.close === 'function') {
          els.settingsDialog.close();
        } else {
          els.settingsDialog.removeAttribute('open');
        }
      }

      if (els.testCurrentTime) {
        els.testCurrentTime.textContent = formatClock(gameSeconds);
      }

      if (els.dayCalibrationDetails) {
        els.dayCalibrationDetails.open = false;
      }

      buildTestRows();
      renderDaylightMarks();

      window.requestAnimationFrame(() => {
        if (typeof els.testDialog.showModal === 'function') {
          els.testDialog.showModal();
        } else {
          els.testDialog.setAttribute('open', '');
        }
      });
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

  restoreNotificationSchedule();
  updateNotificationSettingsUi();


  let appUpdateReloading = false;

  function setUpdateAppStatus(text) {
    if (els.updateAppStatus) {
      els.updateAppStatus.textContent = text;
    }
  }

  function finishAppUpdateReload() {
    if (appUpdateReloading) return;
    appUpdateReloading = true;

    setUpdateAppStatus('Обновление установлено. Перезапускаю…');

    window.setTimeout(() => {
      const url = new URL(window.location.href);
      url.searchParams.set('_zc_update', Date.now().toString());
      window.location.replace(url.toString());
    }, 450);
  }

  function watchUpdateWorker(worker) {
    if (!worker) return;

    const updateStatusFromWorker = () => {
      if (worker.state === 'installing') {
        setUpdateAppStatus('Скачиваю обновление…');
      } else if (worker.state === 'installed') {
        setUpdateAppStatus('Обновление загружено. Активирую…');
        worker.postMessage({ type: 'SKIP_WAITING' });
      } else if (worker.state === 'activating') {
        setUpdateAppStatus('Активирую новую версию…');
      } else if (worker.state === 'activated') {
        finishAppUpdateReload();
      } else if (worker.state === 'redundant') {
        setUpdateAppStatus('Не удалось применить обновление.');
      }
    };

    updateStatusFromWorker();
    worker.addEventListener('statechange', updateStatusFromWorker);
  }

  async function updateApplicationNow() {
    if (!els.updateAppBtn) return;

    els.updateAppBtn.disabled = true;
    setUpdateAppStatus('Проверяю обновления…');

    try {
      if (!('serviceWorker' in navigator)) {
        setUpdateAppStatus('Service worker не поддерживается. Перезагружаю страницу…');
        window.setTimeout(() => window.location.reload(), 500);
        return;
      }

      let registration = await navigator.serviceWorker.getRegistration();

      if (!registration) {
        registration = await navigator.serviceWorker.register('./service-worker.js');
      }

      let updateFound = false;

      const onUpdateFound = () => {
        updateFound = true;
        setUpdateAppStatus('Найдена новая версия…');
        watchUpdateWorker(registration.installing);
      };

      registration.addEventListener('updatefound', onUpdateFound, { once: true });

      navigator.serviceWorker.addEventListener(
        'controllerchange',
        finishAppUpdateReload,
        { once: true }
      );

      if (registration.waiting) {
        updateFound = true;
        setUpdateAppStatus('Обновление уже загружено. Активирую…');
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      } else {
        await registration.update();

        if (registration.installing) {
          updateFound = true;
          watchUpdateWorker(registration.installing);
        } else if (registration.waiting) {
          updateFound = true;
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
      }

      if (!updateFound && !appUpdateReloading) {
        setUpdateAppStatus('Уже установлена последняя версия.');
        els.updateAppBtn.disabled = false;
      }
    } catch (error) {
      console.error('Zone Clock update error:', error);
      setUpdateAppStatus('Не удалось проверить обновление. Проверьте интернет.');
      els.updateAppBtn.disabled = false;
    }
  }

  if (els.updateAppBtn) {
    els.updateAppBtn.addEventListener('click', updateApplicationNow);
  }

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
