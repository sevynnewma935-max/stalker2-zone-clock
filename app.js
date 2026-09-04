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
    zoneMapPreviewImage: $('zoneMapPreviewImage'),
    zoneMapImage: $('zoneMapImage'), mapOverlay: $('mapOverlay'),
    mapMeasureLine: $('mapMeasureLine'), mapMeasurePoints: $('mapMeasurePoints'),
    mapMeasureBtn: $('mapMeasureBtn'), mapUndoBtn: $('mapUndoBtn'),
    mapClearBtn: $('mapClearBtn'), mapZoomOutBtn: $('mapZoomOutBtn'),
    mapZoomInBtn: $('mapZoomInBtn'), mapFitBtn: $('mapFitBtn'),
    mapPresetRouteBtn: $('mapPresetRouteBtn'),
    mapRouteSelect: $('mapRouteSelect'),
    mapRouteStartWrap: $('mapRouteStartWrap'),
    mapRouteStartSelect: $('mapRouteStartSelect'),
    mapRoadRoutePath: $('mapRoadRoutePath'),
    mapPresetRouteLabel: $('mapPresetRouteLabel'),
    mapPresetRouteLayer: $('mapPresetRouteLayer'),
    mapPresetRouteMain: $('mapPresetRouteMain'),
    mapPresetRouteBranch: $('mapPresetRouteBranch'),
    mapPresetRoutePoints: $('mapPresetRoutePoints'),
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

  const MAP_PRESET_ROUTE_STORAGE_KEY =
    'stalker2-zone-clock-preset-route-visible-v2';
  const MAP_PRESET_ROUTE_SELECTED_KEY =
    'stalker2-zone-clock-preset-route-selected-v2';

  const MAP_PRESET_ROUTES = {
    garbage_cement_cooling: {
      key: 'garbage_cement_cooling',
      label: 'СВАЛКА → ЦЕМЕНТНЫЙ ЗАВОД → ГРАДИРНИ',
      roadPath: `M1263.0,879.5L1263.5,880.0M1263.5,880.0L1263.5,880.5M1263.5,880.5L1264.0,881.0M1264.0,881.0L1264.5,881.5M1264.5,881.5L1264.5,882.0M1264.5,882.0L1264.5,882.5M1264.5,882.5L1264.5,883.0M1264.5,883.0L1264.5,883.5M1264.5,883.5L1265.0,884.0M1265.0,884.0L1265.5,884.5M1265.5,884.5L1265.5,885.0M1265.5,885.0L1265.5,885.5M1265.5,885.5L1266.0,886.0M1266.0,886.0L1265.5,886.5M1266.0,886.0L1266.0,886.5M1266.0,886.0L1266.5,886.5M1265.5,886.5L1266.0,886.5M1265.5,886.5L1265.0,887.0M1266.0,886.5L1266.5,886.5M1266.5,886.5L1267.0,887.0M1265.0,887.0L1264.5,887.5M1267.0,887.0L1267.0,887.5M1264.0,887.5L1264.5,887.5M1267.0,887.5L1267.0,888.0M1269.5,887.5L1270.0,887.5M1269.5,887.5L1269.0,888.0M1267.0,888.0L1267.0,888.5M1267.0,888.0L1267.5,888.5M1268.5,888.0L1269.0,888.0M1268.5,888.0L1268.0,888.5M1267.0,888.5L1267.5,888.5M1267.0,888.5L1267.0,889.0M1267.5,888.5L1268.0,888.5M1267.5,888.5L1267.0,889.0M1267.0,889.0L1267.0,889.5M1267.0,889.5L1267.0,890.0M1267.0,890.0L1267.0,890.5M1267.0,890.5L1266.5,891.0M1266.5,891.0L1266.5,891.5M1266.5,891.5L1266.0,892.0M1266.0,892.0L1266.0,892.5M1266.0,892.5L1265.5,893.0M1265.5,893.0L1265.5,893.5M1265.5,893.5L1265.0,894.0M1265.0,894.0L1265.0,894.5M1265.0,894.5L1264.5,895.0M1264.5,895.0L1264.5,895.5M1264.5,895.5L1264.0,896.0M1264.0,896.0L1263.5,896.5M1263.5,896.5L1263.5,897.0M1263.5,897.0L1263.0,897.5M1263.0,897.5L1263.0,898.0M1263.0,898.0L1262.5,898.5M1262.5,898.5L1262.5,899.0M1262.5,899.0L1262.5,899.5M1262.5,899.5L1262.0,900.0M1262.0,900.0L1262.0,900.5M1262.0,900.5L1262.0,901.0M1262.0,901.0L1262.0,901.5M1262.0,901.5L1262.5,902.0M1262.5,902.0L1262.5,902.5M1262.5,902.5L1262.5,903.0M1262.5,903.0L1262.5,903.5M1262.5,903.5L1262.5,904.0M1262.5,904.0L1263.0,904.5M1263.0,904.5L1263.0,905.0M1263.0,905.0L1263.0,905.5M1263.0,905.5L1263.5,906.0M1263.5,906.0L1263.5,906.5M1263.5,906.5L1263.5,907.0M1263.5,907.0L1263.5,907.5M1263.5,907.5L1263.5,908.0M1263.5,908.0L1264.0,908.5M1264.0,908.5L1264.0,909.0M1264.0,909.0L1264.0,909.5M1264.0,909.5L1264.0,910.0M1264.0,910.0L1264.0,910.5M1264.0,910.5L1264.5,911.0M1264.5,911.0L1264.5,911.5M1264.5,911.5L1264.5,912.0M1264.5,912.0L1265.0,912.5M1265.0,912.5L1265.5,913.0M1265.5,913.0L1266.0,913.5M1266.0,913.5L1266.5,913.5M1266.5,913.5L1267.0,913.5M1267.0,913.5L1267.5,914.0M1267.5,914.0L1268.0,914.0M1268.0,914.0L1268.5,914.0M1268.5,914.0L1269.0,914.5M1269.0,914.5L1269.5,915.0M1270.5,914.5L1271.0,914.5M1270.5,914.5L1270.0,915.0M1269.5,915.0L1270.0,915.0M1269.5,915.0L1269.5,915.5M1270.0,915.0L1269.5,915.5M1269.5,915.5L1269.0,916.0M1269.0,916.0L1269.0,916.5M1269.0,916.5L1269.0,917.0M1269.0,917.0L1269.0,917.5M1269.0,917.5L1269.0,918.0M1269.0,918.0L1269.0,918.5M1269.0,918.5L1268.5,919.0M1224.5,919.0L1225.0,919.0M1224.5,919.0L1224.0,919.5M1225.0,919.0L1225.5,919.5M1268.5,919.0L1268.5,919.5M1223.5,919.5L1224.0,919.5M1223.5,919.5L1223.0,920.0M1225.5,919.5L1226.0,919.5M1226.0,919.5L1226.5,919.5M1226.5,919.5L1227.0,920.0M1268.5,919.5L1268.5,920.0M1223.0,920.0L1222.5,920.5M1227.0,920.0L1227.5,920.0M1227.5,920.0L1228.0,920.5M1268.5,920.0L1268.0,920.5M1222.5,920.5L1222.0,921.0M1228.0,920.5L1228.5,920.5M1228.5,920.5L1229.0,920.5M1229.0,920.5L1229.5,921.0M1268.0,920.5L1268.0,921.0M1222.0,921.0L1221.5,921.5M1229.5,921.0L1230.0,921.0M1230.0,921.0L1230.5,921.5M1268.0,921.0L1267.5,921.5M1221.5,921.5L1221.0,922.0M1230.5,921.5L1231.0,921.5M1231.0,921.5L1231.5,921.5M1231.5,921.5L1232.0,922.0M1267.5,921.5L1267.5,922.0M1221.0,922.0L1221.0,922.5M1232.0,922.0L1232.5,922.0M1232.5,922.0L1233.0,922.5M1267.5,922.0L1267.0,922.5M1221.0,922.5L1220.5,923.0M1233.0,922.5L1233.5,922.5M1233.5,922.5L1234.0,923.0M1267.0,922.5L1267.0,923.0M1220.5,923.0L1220.0,923.5M1234.0,923.0L1234.5,923.0M1234.5,923.0L1235.0,923.0M1235.0,923.0L1235.5,923.5M1267.0,923.0L1266.5,923.5M1220.0,923.5L1219.5,924.0M1235.5,923.5L1236.0,923.5M1236.0,923.5L1236.5,924.0M1266.5,923.5L1266.5,924.0M1219.5,924.0L1219.0,924.5M1236.5,924.0L1237.0,924.0M1237.0,924.0L1237.5,924.5M1266.5,924.0L1266.5,924.5M1219.0,924.5L1218.5,925.0M1237.5,924.5L1238.0,924.5M1238.0,924.5L1238.5,924.5M1238.5,924.5L1239.0,925.0M1266.5,924.5L1266.0,925.0M1218.5,925.0L1218.0,925.5M1239.0,925.0L1239.5,925.0M1239.5,925.0L1240.0,925.5M1266.0,925.0L1266.0,925.5M1218.0,925.5L1217.5,926.0M1240.0,925.5L1240.5,925.5M1240.5,925.5L1241.0,926.0M1266.0,925.5L1265.5,926.0M1217.5,926.0L1217.0,926.5M1241.0,926.0L1241.5,926.0M1241.5,926.0L1242.0,926.0M1242.0,926.0L1242.5,926.5M1265.5,926.0L1265.5,926.5M1217.0,926.5L1216.5,927.0M1242.5,926.5L1243.0,926.5M1243.0,926.5L1243.5,927.0M1265.5,926.5L1265.0,927.0M1216.5,927.0L1216.0,927.5M1243.5,927.0L1244.0,927.0M1244.0,927.0L1244.5,927.5M1265.0,927.0L1265.0,927.5M1216.0,927.5L1215.5,928.0M1244.5,927.5L1245.0,927.5M1245.0,927.5L1245.5,927.5M1245.5,927.5L1246.0,928.0M1265.0,927.5L1265.0,928.0M1214.5,928.0L1215.0,928.0M1214.5,928.0L1214.0,928.5M1215.0,928.0L1215.5,928.0M1246.0,928.0L1246.5,928.0M1246.5,928.0L1247.0,928.5M1265.0,928.0L1264.5,928.5M1211.5,928.5L1212.0,928.5M1211.5,928.5L1211.0,929.0M1212.0,928.5L1212.5,928.5M1212.5,928.5L1213.0,928.5M1213.0,928.5L1213.5,928.5M1213.5,928.5L1214.0,928.5M1247.0,928.5L1247.5,928.5M1247.5,928.5L1248.0,928.5M1248.0,928.5L1248.5,929.0M1264.5,928.5L1264.5,929.0M1208.5,929.0L1209.0,929.0M1208.5,929.0L1208.0,929.5M1209.0,929.0L1209.5,929.0M1209.5,929.0L1210.0,929.0M1210.0,929.0L1210.5,929.0M1210.5,929.0L1211.0,929.0M1248.5,929.0L1249.0,929.0M1249.0,929.0L1249.5,929.5M1264.5,929.0L1264.0,929.5M1204.0,929.5L1204.5,929.5M1204.0,929.5L1203.5,930.0M1204.5,929.5L1205.0,929.5M1205.0,929.5L1205.5,929.5M1205.5,929.5L1206.0,929.5M1206.0,929.5L1206.5,929.5M1206.5,929.5L1207.0,929.5M1207.0,929.5L1207.5,929.5M1207.5,929.5L1208.0,929.5M1249.5,929.5L1250.0,929.5M1250.0,929.5L1250.5,930.0M1264.0,929.5L1264.0,930.0M1203.5,930.0L1203.0,930.5M1250.5,930.0L1251.0,930.0M1251.0,930.0L1251.5,930.0M1251.5,930.0L1252.0,930.5M1264.0,930.0L1263.5,930.5M1203.0,930.5L1203.0,931.0M1252.0,930.5L1252.5,930.5M1252.5,930.5L1253.0,931.0M1263.5,930.5L1263.5,931.0M1203.0,931.0L1203.0,931.5M1253.0,931.0L1253.5,931.0M1253.5,931.0L1254.0,931.5M1263.5,931.0L1263.5,931.5M1203.0,931.5L1203.0,932.0M1254.0,931.5L1254.5,931.5M1254.5,931.5L1255.0,931.5M1255.0,931.5L1255.5,932.0M1263.5,931.5L1263.0,932.0M957.0,932.0L957.5,932.5M1203.0,932.0L1203.0,932.5M1255.5,932.0L1256.0,932.0M1256.0,932.0L1256.5,932.5M1263.0,932.0L1263.0,932.5M957.5,932.5L958.0,933.0M1203.0,932.5L1203.0,933.0M1256.5,932.5L1257.0,932.5M1257.0,932.5L1257.5,933.0M1263.0,932.5L1263.0,933.0M958.0,933.0L958.5,933.5M1203.0,933.0L1203.0,933.5M1257.5,933.0L1258.0,933.0M1258.0,933.0L1258.5,933.0M1258.5,933.0L1259.0,933.5M1263.0,933.0L1262.5,933.5M958.5,933.5L959.0,934.0M1203.0,933.5L1203.0,934.0M1259.0,933.5L1259.5,933.5M1259.5,933.5L1260.0,933.5M1260.0,933.5L1260.5,933.5M1260.5,933.5L1261.0,934.0M1262.5,933.5L1262.5,934.0M959.0,934.0L959.5,934.0M959.5,934.0L960.0,934.5M1203.0,934.0L1203.0,934.5M1261.0,934.0L1261.5,934.0M1261.5,934.0L1262.0,934.5M1262.5,934.0L1262.0,934.5M960.0,934.5L960.5,935.0M1203.0,934.5L1203.5,935.0M1262.0,934.5L1262.0,935.0M960.5,935.0L961.0,935.5M1203.5,935.0L1203.5,935.5M1262.0,935.0L1262.0,935.5M961.0,935.5L961.5,936.0M1203.5,935.5L1203.5,936.0M1262.0,935.5L1262.0,936.0M1262.0,935.5L1262.5,936.0M1274.0,935.5L1274.5,935.5M1274.0,935.5L1273.5,936.0M1274.5,935.5L1275.0,936.0M961.5,936.0L962.0,936.5M1203.5,936.0L1203.5,936.5M1262.0,936.0L1262.5,936.0M1262.0,936.0L1261.5,936.5M1262.5,936.0L1263.0,936.0M1263.0,936.0L1263.5,936.0M1263.5,936.0L1264.0,936.5M1273.5,936.0L1273.0,936.5M1275.0,936.0L1275.5,936.0M1275.5,936.0L1276.0,936.0M1276.0,936.0L1276.5,936.0M1276.5,936.0L1277.0,936.0M1277.0,936.0L1277.5,936.5M962.0,936.5L962.5,937.0M1203.5,936.5L1203.5,937.0M1261.5,936.5L1261.0,937.0M1264.0,936.5L1264.5,936.5M1264.5,936.5L1265.0,936.5M1265.0,936.5L1265.5,936.5M1265.5,936.5L1266.0,937.0M1273.0,936.5L1272.5,937.0M1277.5,936.5L1278.0,936.5M1278.0,936.5L1278.5,937.0M962.5,937.0L963.0,937.5M1203.5,937.0L1203.5,937.5M1261.0,937.0L1261.0,937.5M1266.0,937.0L1266.5,937.0M1266.5,937.0L1267.0,937.0M1267.0,937.0L1267.5,937.0M1267.5,937.0L1268.0,937.5M1272.5,937.0L1272.0,937.5M1278.5,937.0L1279.0,937.0M1279.0,937.0L1279.5,937.5M963.0,937.5L963.5,938.0M1203.5,937.5L1203.5,938.0M1261.0,937.5L1260.5,938.0M1268.0,937.5L1268.5,937.5M1268.5,937.5L1269.0,937.5M1269.0,937.5L1269.5,937.5M1269.5,937.5L1270.0,937.5M1270.0,937.5L1270.5,937.5M1270.5,937.5L1271.0,937.5M1271.0,937.5L1271.5,937.5M1271.0,937.5L1271.5,938.0M1271.5,937.5L1272.0,937.5M1271.5,937.5L1271.5,938.0M1272.0,937.5L1271.5,938.0M1279.5,937.5L1280.0,937.5M1280.0,937.5L1280.5,938.0M963.5,938.0L964.0,938.5M1203.5,938.0L1203.5,938.5M1260.5,938.0L1260.5,938.5M1271.5,938.0L1272.0,938.5M1280.5,938.0L1281.0,938.0M1281.0,938.0L1281.5,938.0M1281.5,938.0L1282.0,938.5M964.0,938.5L964.5,939.0M1203.5,938.5L1203.5,939.0M1260.5,938.5L1260.0,939.0M1282.0,938.5L1282.5,938.5M1282.5,938.5L1283.0,939.0M964.5,939.0L965.0,939.5M1203.5,939.0L1204.0,939.5M1260.0,939.0L1260.0,939.5M1283.0,939.0L1283.5,939.0M1283.5,939.0L1284.0,939.5M965.0,939.5L965.5,939.5M965.5,939.5L966.0,940.0M1204.0,939.5L1204.0,940.0M1260.0,939.5L1259.5,940.0M1284.0,939.5L1284.5,939.5M1284.5,939.5L1285.0,940.0M966.0,940.0L966.5,940.5M1204.0,940.0L1204.0,940.5M1259.5,940.0L1259.5,940.5M1285.0,940.0L1285.5,940.0M1285.5,940.0L1286.0,940.0M1286.0,940.0L1286.5,940.5M966.5,940.5L967.0,941.0M1204.0,940.5L1204.0,941.0M1259.5,940.5L1259.0,941.0M1286.5,940.5L1287.0,940.5M1287.0,940.5L1287.5,941.0M967.0,941.0L967.5,941.5M1204.0,941.0L1204.0,941.5M1259.0,941.0L1259.0,941.5M1287.5,941.0L1288.0,941.0M1288.0,941.0L1288.5,941.5M967.5,941.5L968.0,942.0M1204.0,941.5L1204.0,942.0M1259.0,941.5L1258.5,942.0M1288.5,941.5L1289.0,941.5M1289.0,941.5L1289.5,942.0M968.0,942.0L968.5,942.5M1204.0,942.0L1204.0,942.5M1258.5,942.0L1258.5,942.5M1289.5,942.0L1290.0,942.0M1290.0,942.0L1290.5,942.0M1290.5,942.0L1291.0,942.5M968.5,942.5L969.0,943.0M1204.0,942.5L1204.0,943.0M1258.5,942.5L1258.5,943.0M1291.0,942.5L1291.5,942.5M1291.5,942.5L1292.0,943.0M969.0,943.0L969.0,943.5M1204.0,943.0L1204.0,943.5M1258.5,943.0L1258.0,943.5M1292.0,943.0L1292.5,943.0M1292.5,943.0L1293.0,943.5M969.0,943.5L969.5,944.0M1204.0,943.5L1204.5,944.0M1258.0,943.5L1258.0,944.0M1293.0,943.5L1293.5,943.5M1293.5,943.5L1294.0,944.0M969.5,944.0L970.0,944.5M1204.5,944.0L1204.5,944.5M1258.0,944.0L1257.5,944.5M1294.0,944.0L1294.5,944.0M1294.5,944.0L1295.0,944.0M1295.0,944.0L1295.5,944.5M970.0,944.5L970.5,945.0M1204.5,944.5L1204.5,945.0M1257.5,944.5L1257.5,945.0M1295.5,944.5L1296.0,944.5M1296.0,944.5L1296.5,945.0M970.5,945.0L971.0,945.5M1204.5,945.0L1204.5,945.5M1257.5,945.0L1257.0,945.5M1296.5,945.0L1297.0,945.0M1297.0,945.0L1297.5,945.5M971.0,945.5L971.5,946.0M1204.5,945.5L1204.5,946.0M1257.0,945.5L1257.0,946.0M1297.5,945.5L1298.0,945.5M1298.0,945.5L1298.5,946.0M971.5,946.0L972.0,946.5M1204.5,946.0L1204.5,946.5M1257.0,946.0L1257.0,946.5M1298.5,946.0L1299.0,946.0M1299.0,946.0L1299.5,946.0M1299.5,946.0L1300.0,946.5M972.0,946.5L972.0,947.0M1204.5,946.5L1204.5,947.0M1257.0,946.5L1256.5,947.0M1300.0,946.5L1300.5,946.5M1300.5,946.5L1301.0,947.0M972.0,947.0L972.5,947.5M1204.5,947.0L1204.5,947.5M1256.5,947.0L1256.5,947.5M1301.0,947.0L1301.5,947.0M1301.5,947.0L1302.0,947.5M972.5,947.5L972.5,948.0M1204.5,947.5L1204.5,948.0M1256.5,947.5L1256.0,948.0M1302.0,947.5L1302.5,947.5M1302.5,947.5L1303.0,948.0M972.5,948.0L973.0,948.5M1204.5,948.0L1204.5,948.5M1256.0,948.0L1256.0,948.5M1303.0,948.0L1303.5,948.0M1303.5,948.0L1304.0,948.0M1304.0,948.0L1304.5,948.5M973.0,948.5L973.0,949.0M1204.5,948.5L1204.5,949.0M1256.0,948.5L1255.5,949.0M1304.5,948.5L1305.0,948.5M1305.0,948.5L1305.5,949.0M973.0,949.0L973.0,949.5M1204.5,949.0L1204.5,949.5M1255.5,949.0L1255.5,949.5M1305.5,949.0L1306.0,949.0M1306.0,949.0L1306.5,949.5M973.0,949.5L973.5,950.0M1204.5,949.5L1204.5,950.0M1255.5,949.5L1255.0,950.0M1306.5,949.5L1307.0,949.5M1307.0,949.5L1307.5,950.0M973.5,950.0L973.5,950.5M1204.5,950.0L1204.5,950.5M1255.0,950.0L1255.0,950.5M1307.5,950.0L1308.0,950.0M1308.0,950.0L1308.5,950.0M1308.5,950.0L1309.0,950.5M973.5,950.5L974.0,951.0M1204.5,950.5L1204.5,951.0M1255.0,950.5L1255.0,951.0M1309.0,950.5L1309.5,950.5M1309.5,950.5L1310.0,951.0M974.0,951.0L974.0,951.5M1204.5,951.0L1204.5,951.5M1255.0,951.0L1254.5,951.5M1310.0,951.0L1310.5,951.0M1310.5,951.0L1311.0,951.5M974.0,951.5L974.0,952.0M1204.5,951.5L1204.0,952.0M1254.5,951.5L1254.5,952.0M1311.0,951.5L1311.5,951.5M1311.5,951.5L1312.0,952.0M974.0,952.0L974.0,952.5M1204.0,952.0L1204.0,952.5M1254.5,952.0L1254.0,952.5M1312.0,952.0L1312.5,952.0M1312.5,952.0L1313.0,952.0M1313.0,952.0L1313.5,952.5M974.0,952.5L974.5,953.0M1204.0,952.5L1203.5,953.0M1254.0,952.5L1254.0,953.0M1313.5,952.5L1314.0,952.5M1314.0,952.5L1314.5,953.0M974.5,953.0L974.5,953.5M1203.5,953.0L1203.0,953.5M1254.0,953.0L1253.5,953.5M1314.5,953.0L1315.0,953.0M1315.0,953.0L1315.5,953.5M974.5,953.5L975.0,954.0M1203.0,953.5L1203.0,954.0M1253.5,953.5L1253.5,954.0M1315.5,953.5L1316.0,953.5M1316.0,953.5L1316.5,954.0M975.0,954.0L975.0,954.5M1203.0,954.0L1202.5,954.5M1316.5,954.0L1317.0,954.0M1317.0,954.0L1317.5,954.0M1317.5,954.0L1318.0,954.5M975.0,954.5L975.0,955.0M1202.5,954.5L1202.0,955.0M1318.0,954.5L1318.5,954.5M1318.5,954.5L1319.0,955.0M975.0,955.0L975.5,955.5M1202.0,955.0L1202.0,955.5M1319.0,955.0L1319.5,955.0M1319.5,955.0L1320.0,955.5M975.5,955.5L975.5,956.0M1202.0,955.5L1201.5,956.0M1320.0,955.5L1320.5,955.5M1320.5,955.5L1321.0,956.0M975.5,956.0L976.0,956.5M1201.5,956.0L1201.5,956.5M1321.0,956.0L1321.5,956.0M1321.5,956.0L1322.0,956.5M976.0,956.5L976.0,957.0M1201.5,956.5L1201.0,957.0M1322.0,956.5L1322.0,957.0M976.0,957.0L976.5,957.5M1201.0,957.0L1200.5,957.5M1322.0,957.0L1322.0,957.5M976.5,957.5L976.5,958.0M1200.5,957.5L1200.0,958.0M1322.0,957.5L1322.0,958.0M976.5,958.0L976.5,958.5M1200.0,958.0L1200.0,958.5M1322.0,958.0L1322.0,958.5M976.5,958.5L977.0,959.0M1200.0,958.5L1199.5,959.0M1322.0,958.5L1322.0,959.0M977.0,959.0L977.0,959.5M1199.5,959.0L1199.5,959.5M1322.0,959.0L1321.5,959.5M977.0,959.5L977.0,960.0M977.0,959.5L977.5,960.0M1199.5,959.5L1199.0,960.0M1321.5,959.5L1321.5,960.0M977.0,960.0L977.5,960.0M977.0,960.0L977.0,960.5M977.5,960.0L977.0,960.5M977.5,960.0L978.0,960.5M1199.0,960.0L1198.5,960.5M1321.5,960.0L1321.5,960.5M977.0,960.5L976.5,961.0M978.0,960.5L978.5,960.5M978.5,960.5L979.0,960.5M979.0,960.5L979.5,961.0M1198.5,960.5L1198.0,961.0M1321.5,960.5L1321.5,961.0M976.5,961.0L976.5,961.5M979.5,961.0L980.0,961.0M980.0,961.0L980.5,961.0M980.5,961.0L981.0,961.0M981.0,961.0L981.5,961.0M981.5,961.0L982.0,961.5M1198.0,961.0L1198.0,961.5M1321.5,961.0L1321.5,961.5M976.5,961.5L976.5,962.0M982.0,961.5L982.5,961.5M982.5,961.5L983.0,961.5M983.0,961.5L983.5,961.5M983.5,961.5L984.0,961.5M984.0,961.5L984.5,962.0M1198.0,961.5L1197.5,962.0M1321.5,961.5L1321.5,962.0M976.5,962.0L976.5,962.5M984.5,962.0L985.0,962.0M985.0,962.0L985.5,962.0M985.5,962.0L986.0,962.0M986.0,962.0L986.5,962.5M1197.5,962.0L1197.0,962.5M1321.5,962.0L1321.0,962.5M976.5,962.5L976.5,963.0M986.5,962.5L987.0,962.5M987.0,962.5L987.5,962.5M987.5,962.5L988.0,962.5M988.0,962.5L988.5,963.0M1197.0,962.5L1197.0,963.0M1321.0,962.5L1321.0,963.0M976.5,963.0L976.5,963.5M988.5,963.0L989.0,963.0M989.0,963.0L989.5,963.0M989.5,963.0L990.0,963.0M990.0,963.0L990.5,963.0M990.5,963.0L991.0,963.0M991.0,963.0L991.5,963.5M1197.0,963.0L1196.5,963.5M1321.0,963.0L1320.5,963.5M976.5,963.5L976.5,964.0M991.5,963.5L992.0,963.5M992.0,963.5L992.5,963.5M992.5,963.5L993.0,963.5M993.0,963.5L993.5,964.0M1196.5,963.5L1196.0,964.0M1320.5,963.5L1320.0,964.0M976.5,964.0L976.5,964.5M993.5,964.0L994.0,964.0M994.0,964.0L994.5,964.0M994.5,964.0L995.0,964.0M995.0,964.0L995.5,964.0M995.5,964.0L996.0,964.5M1196.0,964.0L1196.0,964.5M976.5,964.5L977.0,965.0M996.0,964.5L996.5,964.5M996.5,964.5L997.0,964.5M997.0,964.5L997.5,965.0M1196.0,964.5L1195.5,965.0M977.0,965.0L977.0,965.5M997.5,965.0L998.0,965.0M998.0,965.0L998.5,965.0M998.5,965.0L999.0,965.0M999.0,965.0L999.5,965.0M999.5,965.0L1000.0,965.5M1195.5,965.0L1195.0,965.5M977.0,965.5L977.0,966.0M1000.0,965.5L1000.5,965.5M1000.5,965.5L1001.0,965.5M1001.0,965.5L1001.5,965.5M1001.5,965.5L1002.0,965.5M1002.0,965.5L1002.5,965.5M1002.5,965.5L1003.0,966.0M1195.0,965.5L1195.0,966.0M977.0,966.0L977.0,966.5M1003.0,966.0L1003.5,966.0M1003.5,966.0L1004.0,966.0M1004.0,966.0L1004.5,966.5M1195.0,966.0L1194.5,966.5M977.0,966.5L977.0,967.0M1004.5,966.5L1005.0,966.5M1005.0,966.5L1005.5,966.5M1005.5,966.5L1006.0,966.5M1006.0,966.5L1006.5,967.0M1194.5,966.5L1194.0,967.0M977.0,967.0L977.0,967.5M1006.5,967.0L1007.0,967.0M1007.0,967.0L1007.5,967.0M1007.5,967.0L1008.0,967.0M1008.0,967.0L1008.5,967.0M1008.5,967.0L1009.0,967.5M1194.0,967.0L1194.0,967.5M977.0,967.5L977.0,968.0M1009.0,967.5L1009.5,967.5M1009.5,967.5L1010.0,967.5M1010.0,967.5L1010.5,967.5M1010.5,967.5L1011.0,968.0M1019.5,967.5L1019.5,968.0M1194.0,967.5L1193.5,968.0M977.0,968.0L977.0,968.5M1011.0,968.0L1011.5,968.0M1011.5,968.0L1012.0,968.0M1012.0,968.0L1012.5,968.5M1019.5,968.0L1019.5,968.5M1193.5,968.0L1193.0,968.5M977.0,968.5L977.0,969.0M1012.5,968.5L1013.0,968.5M1013.0,968.5L1013.5,968.5M1013.5,968.5L1014.0,968.5M1014.0,968.5L1014.5,969.0M1019.5,968.5L1019.5,969.0M1193.0,968.5L1193.0,969.0M977.0,969.0L977.0,969.5M1014.5,969.0L1015.0,969.0M1015.0,969.0L1015.5,969.0M1015.5,969.0L1016.0,969.0M1016.0,969.0L1016.5,969.0M1016.5,969.0L1017.0,969.5M1019.5,969.0L1019.0,969.5M1019.5,969.0L1019.5,969.5M1193.0,969.0L1192.5,969.5M977.0,969.5L977.0,970.0M1017.0,969.5L1017.5,969.5M1017.5,969.5L1018.0,969.5M1018.0,969.5L1018.5,969.5M1018.5,969.5L1019.0,969.5M1019.0,969.5L1019.5,969.5M1019.5,969.5L1020.0,970.0M1192.5,969.5L1192.5,970.0M977.0,970.0L977.0,970.5M1020.0,970.0L1020.5,970.0M1020.5,970.0L1021.0,970.5M1192.5,970.0L1192.0,970.5M977.0,970.5L977.0,971.0M1021.0,970.5L1021.5,970.5M1021.5,970.5L1022.0,970.5M1022.0,970.5L1022.5,971.0M1192.0,970.5L1191.5,971.0M977.0,971.0L977.5,971.5M1022.5,971.0L1023.0,971.0M1023.0,971.0L1023.5,971.0M1023.5,971.0L1024.0,971.0M1024.0,971.0L1024.5,971.5M1191.5,971.0L1191.5,971.5M977.5,971.5L977.5,972.0M1024.5,971.5L1025.0,971.5M1025.0,971.5L1025.5,971.5M1025.5,971.5L1026.0,971.5M1026.0,971.5L1026.5,971.5M1026.5,971.5L1027.0,972.0M1191.5,971.5L1191.0,972.0M977.5,972.0L977.5,972.5M1027.0,972.0L1027.5,972.0M1027.5,972.0L1028.0,972.0M1028.0,972.0L1028.5,972.0M1028.5,972.0L1029.0,972.5M1191.0,972.0L1190.5,972.5M977.5,972.5L977.5,973.0M1029.0,972.5L1029.5,972.5M1029.5,972.5L1030.0,972.5M1030.0,972.5L1030.5,972.5M1030.5,972.5L1031.0,973.0M1190.5,972.5L1190.5,973.0M977.5,973.0L977.5,973.5M1031.0,973.0L1031.5,973.0M1031.5,973.0L1032.0,973.0M1032.0,973.0L1032.5,973.0M1032.5,973.0L1033.0,973.0M1033.0,973.0L1033.5,973.0M1033.5,973.0L1034.0,973.5M1190.5,973.0L1190.0,973.5M977.5,973.5L977.5,974.0M1034.0,973.5L1034.5,973.5M1034.5,973.5L1035.0,973.5M1035.0,973.5L1035.5,973.5M1035.5,973.5L1036.0,973.5M1036.0,973.5L1036.5,973.5M1036.0,973.5L1036.5,974.0M1036.5,973.5L1037.0,973.5M1036.5,973.5L1036.5,974.0M1037.0,973.5L1036.5,974.0M1037.0,973.5L1037.5,974.0M1190.0,973.5L1189.5,974.0M977.5,974.0L977.5,974.5M1036.5,974.0L1036.5,974.5M1037.5,974.0L1038.0,974.0M1038.0,974.0L1038.5,974.0M1038.5,974.0L1039.0,974.0M1039.0,974.0L1039.5,974.0M1039.5,974.0L1040.0,974.0M1040.0,974.0L1040.5,974.0M1040.5,974.0L1041.0,974.0M1041.0,974.0L1041.5,974.0M1041.5,974.0L1042.0,974.0M1042.0,974.0L1042.5,974.0M1042.5,974.0L1043.0,974.5M1189.5,974.0L1189.0,974.5M977.5,974.5L977.5,975.0M1036.5,974.5L1036.5,975.0M1043.0,974.5L1043.5,974.5M1043.5,974.5L1044.0,974.5M1044.0,974.5L1044.5,974.5M1044.5,974.5L1045.0,974.5M1045.0,974.5L1045.5,974.5M1045.5,974.5L1046.0,974.5M1046.0,974.5L1046.5,974.5M1046.5,974.5L1047.0,975.0M1189.0,974.5L1189.0,975.0M977.5,975.0L977.5,975.5M1047.0,975.0L1047.5,975.0M1047.5,975.0L1048.0,975.0M1048.0,975.0L1048.5,975.0M1048.5,975.0L1049.0,975.0M1049.0,975.0L1049.5,975.0M1049.5,975.0L1050.0,975.0M1050.0,975.0L1050.5,975.0M1050.5,975.0L1051.0,975.0M1051.0,975.0L1051.5,975.0M1051.5,975.0L1052.0,975.5M1189.0,975.0L1188.5,975.5M977.5,975.5L977.5,976.0M1052.0,975.5L1052.5,975.5M1052.5,975.5L1053.0,975.5M1053.0,975.5L1053.5,975.5M1053.5,975.5L1054.0,975.5M1054.0,975.5L1054.5,975.5M1054.5,975.5L1055.0,975.5M1055.0,975.5L1055.5,976.0M1188.5,975.5L1188.0,976.0M977.5,976.0L977.5,976.5M1055.5,976.0L1056.0,976.0M1056.0,976.0L1056.5,976.0M1056.5,976.0L1057.0,976.0M1057.0,976.0L1057.5,976.0M1057.5,976.0L1058.0,976.5M1188.0,976.0L1188.0,976.5M977.5,976.5L977.5,977.0M1058.0,976.5L1058.5,976.5M1058.5,976.5L1059.0,976.5M1059.0,976.5L1059.5,976.5M1059.5,976.5L1060.0,976.5M1060.0,976.5L1060.5,977.0M1188.0,976.5L1187.5,977.0M977.5,977.0L977.5,977.5M1060.5,977.0L1061.0,977.0M1061.0,977.0L1061.5,977.0M1061.5,977.0L1062.0,977.0M1062.0,977.0L1062.5,977.0M1062.5,977.0L1063.0,977.0M1063.0,977.0L1063.5,977.0M1063.5,977.0L1064.0,977.0M1064.0,977.0L1064.5,977.5M1187.5,977.0L1187.0,977.5M977.5,977.5L978.0,978.0M1064.5,977.5L1065.0,977.5M1065.0,977.5L1065.5,977.5M1065.5,977.5L1066.0,977.5M1066.0,977.5L1066.5,977.5M1066.5,977.5L1067.0,977.5M1067.0,977.5L1067.5,978.0M1187.0,977.5L1187.0,978.0M978.0,978.0L978.0,978.5M1067.5,978.0L1068.0,978.0M1068.0,978.0L1068.5,978.0M1068.5,978.0L1069.0,978.0M1069.0,978.0L1069.5,978.0M1069.5,978.0L1070.0,978.5M1078.0,978.0L1078.5,978.0M1078.0,978.0L1077.5,978.5M1078.5,978.0L1079.0,978.0M1079.0,978.0L1079.5,978.0M1079.5,978.0L1080.0,978.0M1080.0,978.0L1080.5,978.0M1080.5,978.0L1081.0,978.5M1187.0,978.0L1186.5,978.5M978.0,978.5L978.0,979.0M1070.0,978.5L1070.5,978.5M1070.5,978.5L1071.0,978.5M1071.0,978.5L1071.5,978.5M1071.5,978.5L1072.0,978.5M1072.0,978.5L1072.5,978.5M1072.5,978.5L1073.0,978.5M1073.0,978.5L1073.5,978.5M1073.5,978.5L1074.0,978.5M1074.0,978.5L1074.5,978.5M1074.5,978.5L1075.0,979.0M1077.0,978.5L1077.5,978.5M1077.0,978.5L1076.5,979.0M1081.0,978.5L1081.5,978.5M1081.5,978.5L1082.0,978.5M1082.0,978.5L1082.5,978.5M1082.5,978.5L1083.0,978.5M1083.0,978.5L1083.5,978.5M1083.5,978.5L1084.0,978.5M1084.0,978.5L1084.5,979.0M1186.5,978.5L1186.0,979.0M978.0,979.0L978.0,979.5M1075.0,979.0L1075.5,979.0M1075.5,979.0L1076.0,979.0M1076.0,979.0L1076.5,979.0M1084.5,979.0L1085.0,979.0M1085.0,979.0L1085.5,979.0M1085.5,979.0L1086.0,979.0M1086.0,979.0L1086.5,979.0M1086.5,979.0L1087.0,979.0M1087.0,979.0L1087.5,979.5M1186.0,979.0L1186.0,979.5M978.0,979.5L978.0,980.0M1087.5,979.5L1088.0,979.5M1088.0,979.5L1088.5,979.5M1088.5,979.5L1089.0,979.5M1089.0,979.5L1089.5,980.0M1186.0,979.5L1185.5,980.0M978.0,980.0L978.0,980.5M1089.5,980.0L1090.0,980.0M1090.0,980.0L1090.5,980.5M1185.5,980.0L1185.0,980.5M978.0,980.5L978.0,981.0M1090.5,980.5L1091.0,981.0M1185.0,980.5L1185.0,981.0M978.0,981.0L978.0,981.5M1091.0,981.0L1091.5,981.5M1185.0,981.0L1184.5,981.5M978.0,981.5L978.0,982.0M1091.5,981.5L1092.0,981.5M1092.0,981.5L1092.5,982.0M1184.5,981.5L1184.5,982.0M978.0,982.0L978.0,982.5M1092.5,982.0L1093.0,982.5M1184.5,982.0L1184.0,982.5M978.0,982.5L978.0,983.0M1093.0,982.5L1093.5,982.5M1093.5,982.5L1094.0,983.0M1184.0,982.5L1183.5,983.0M978.0,983.0L978.0,983.5M1094.0,983.0L1094.5,983.5M1183.5,983.0L1183.0,983.5M978.0,983.5L978.0,984.0M1094.5,983.5L1095.0,983.5M1095.0,983.5L1095.5,984.0M1183.0,983.5L1183.0,984.0M978.0,984.0L978.0,984.5M1095.5,984.0L1096.0,984.5M1183.0,984.0L1182.5,984.5M978.0,984.5L978.0,985.0M1096.0,984.5L1096.5,985.0M1182.5,984.5L1182.0,985.0M978.0,985.0L978.0,985.5M1096.5,985.0L1097.0,985.0M1097.0,985.0L1097.5,985.5M1182.0,985.0L1182.0,985.5M978.0,985.5L978.0,986.0M1097.5,985.5L1098.0,985.5M1098.0,985.5L1098.5,986.0M1182.0,985.5L1181.5,986.0M978.0,986.0L978.0,986.5M1098.5,986.0L1099.0,986.0M1099.0,986.0L1099.5,986.0M1099.5,986.0L1100.0,986.5M1181.5,986.0L1181.0,986.5M978.0,986.5L978.0,987.0M1100.0,986.5L1100.5,986.5M1100.5,986.5L1101.0,986.5M1101.0,986.5L1101.5,986.5M1101.5,986.5L1102.0,986.5M1102.0,986.5L1102.5,986.5M1102.5,986.5L1103.0,986.5M1103.0,986.5L1103.5,986.5M1103.5,986.5L1104.0,986.5M1104.0,986.5L1104.5,986.5M1104.5,986.5L1105.0,986.5M1105.0,986.5L1105.5,986.5M1105.5,986.5L1106.0,986.5M1106.0,986.5L1106.5,986.5M1106.5,986.5L1107.0,986.5M1107.0,986.5L1107.5,987.0M1181.0,986.5L1180.5,987.0M978.0,987.0L977.5,987.5M1107.5,987.0L1108.0,987.0M1108.0,987.0L1108.5,987.0M1108.5,987.0L1109.0,987.0M1109.0,987.0L1109.5,987.0M1109.5,987.0L1110.0,987.0M1110.0,987.0L1110.5,987.0M1110.5,987.0L1111.0,987.0M1111.0,987.0L1111.5,987.0M1111.5,987.0L1112.0,987.0M1112.0,987.0L1112.5,987.0M1112.5,987.0L1113.0,987.5M1180.5,987.0L1180.5,987.5M977.5,987.5L977.5,988.0M1113.0,987.5L1113.5,987.5M1113.5,987.5L1114.0,987.5M1114.0,987.5L1114.5,987.5M1114.5,987.5L1115.0,987.5M1115.0,987.5L1115.5,987.5M1115.5,987.5L1116.0,987.5M1116.0,987.5L1116.5,987.5M1116.5,987.5L1117.0,987.5M1117.0,987.5L1117.5,987.5M1117.5,987.5L1118.0,987.5M1118.0,987.5L1118.5,987.5M1118.5,987.5L1119.0,987.5M1119.0,987.5L1119.5,988.0M1180.5,987.5L1180.0,988.0M977.5,988.0L977.5,988.5M1119.5,988.0L1120.0,988.0M1120.0,988.0L1120.5,988.0M1120.5,988.0L1121.0,988.0M1121.0,988.0L1121.5,988.0M1121.5,988.0L1122.0,988.5M1180.0,988.0L1180.0,988.5M977.5,988.5L977.5,989.0M1122.0,988.5L1122.5,988.5M1122.5,988.5L1123.0,988.5M1123.0,988.5L1123.5,988.5M1123.5,988.5L1124.0,988.5M1124.0,988.5L1124.5,988.5M1124.5,988.5L1125.0,989.0M1180.0,988.5L1180.0,989.0M977.5,989.0L977.5,989.5M1125.0,989.0L1125.5,989.0M1125.5,989.0L1126.0,989.0M1126.0,989.0L1126.5,989.0M1126.5,989.0L1127.0,989.5M1180.0,989.0L1179.5,989.5M977.5,989.5L977.5,990.0M1127.0,989.5L1127.5,989.5M1127.5,989.5L1128.0,989.5M1128.0,989.5L1128.5,989.5M1128.5,989.5L1129.0,989.5M1129.0,989.5L1129.5,990.0M1179.5,989.5L1179.5,990.0M977.5,990.0L977.5,990.5M1129.5,990.0L1130.0,990.0M1130.0,990.0L1130.5,990.0M1130.5,990.0L1131.0,990.0M1131.0,990.0L1131.5,990.5M1179.5,990.0L1179.5,990.5M977.5,990.5L977.5,991.0M1131.5,990.5L1132.0,990.5M1132.0,990.5L1132.5,990.5M1132.5,990.5L1133.0,990.5M1133.0,990.5L1133.5,990.5M1133.5,990.5L1134.0,991.0M1179.5,990.5L1179.5,991.0M977.5,991.0L977.5,991.5M1134.0,991.0L1134.5,991.0M1134.5,991.0L1135.0,991.0M1135.0,991.0L1135.5,991.0M1135.5,991.0L1136.0,991.0M1136.0,991.0L1136.5,991.5M1179.5,991.0L1179.5,991.5M977.5,991.5L977.5,992.0M1136.5,991.5L1137.0,991.5M1137.0,991.5L1137.5,991.5M1137.5,991.5L1138.0,991.5M1138.0,991.5L1138.5,991.5M1138.5,991.5L1139.0,992.0M1179.5,991.5L1179.0,992.0M1179.5,991.5L1179.5,992.0M1179.5,991.5L1180.0,992.0M977.5,992.0L977.5,992.5M1139.0,992.0L1139.5,992.0M1139.5,992.0L1140.0,992.0M1140.0,992.0L1140.5,992.0M1140.5,992.0L1141.0,992.5M1155.0,992.0L1155.5,992.0M1155.0,992.0L1154.5,992.5M1155.5,992.0L1156.0,992.0M1156.0,992.0L1156.5,992.0M1156.5,992.0L1157.0,992.0M1157.0,992.0L1157.5,992.0M1157.5,992.0L1158.0,992.0M1158.0,992.0L1158.5,992.0M1158.5,992.0L1159.0,992.0M1159.0,992.0L1159.5,992.0M1159.5,992.0L1160.0,992.0M1160.0,992.0L1160.5,992.0M1160.5,992.0L1161.0,992.0M1161.0,992.0L1161.5,992.0M1161.5,992.0L1162.0,992.0M1162.0,992.0L1162.5,992.0M1162.5,992.0L1163.0,992.0M1163.0,992.0L1163.5,992.0M1163.5,992.0L1164.0,992.0M1164.0,992.0L1164.5,992.0M1164.5,992.0L1165.0,992.0M1165.0,992.0L1165.5,992.0M1165.5,992.0L1166.0,992.0M1166.0,992.0L1166.5,992.0M1166.5,992.0L1167.0,992.0M1167.0,992.0L1167.5,992.0M1167.5,992.0L1168.0,992.0M1168.0,992.0L1168.5,992.0M1168.5,992.0L1169.0,992.0M1169.0,992.0L1169.5,992.0M1169.5,992.0L1170.0,992.0M1170.0,992.0L1170.5,992.0M1170.5,992.0L1171.0,992.0M1171.0,992.0L1171.5,992.0M1171.5,992.0L1172.0,992.0M1172.0,992.0L1172.5,992.0M1172.5,992.0L1173.0,992.0M1173.0,992.0L1173.5,992.0M1173.5,992.0L1174.0,992.0M1174.0,992.0L1174.5,992.0M1174.5,992.0L1175.0,992.0M1175.0,992.0L1175.5,992.0M1175.5,992.0L1176.0,992.0M1176.0,992.0L1176.5,992.0M1176.5,992.0L1177.0,992.0M1177.0,992.0L1177.5,992.0M1177.5,992.0L1178.0,992.0M1178.0,992.0L1178.5,992.0M1178.5,992.0L1179.0,992.0M1179.0,992.0L1179.5,992.0M1179.5,992.0L1180.0,992.0M1180.0,992.0L1180.5,992.5M977.5,992.5L977.0,993.0M1141.0,992.5L1141.5,992.5M1141.5,992.5L1142.0,992.5M1142.0,992.5L1142.5,992.5M1142.5,992.5L1143.0,992.5M1143.0,992.5L1143.5,992.5M1143.5,992.5L1144.0,992.5M1144.0,992.5L1144.5,992.5M1144.5,992.5L1145.0,992.5M1145.0,992.5L1145.5,992.5M1145.5,992.5L1146.0,992.5M1146.0,992.5L1146.5,992.5M1146.5,992.5L1147.0,992.5M1147.0,992.5L1147.5,992.5M1147.5,992.5L1148.0,992.5M1148.0,992.5L1148.5,992.5M1148.5,992.5L1149.0,992.5M1149.0,992.5L1149.5,992.5M1149.5,992.5L1150.0,992.5M1150.0,992.5L1150.5,992.5M1150.5,992.5L1151.0,992.5M1151.0,992.5L1151.5,992.5M1151.5,992.5L1152.0,992.5M1152.0,992.5L1152.5,992.5M1152.5,992.5L1153.0,992.5M1153.0,992.5L1153.5,992.5M1153.5,992.5L1154.0,992.5M1154.0,992.5L1154.5,992.5M1180.5,992.5L1181.0,993.0M1189.5,992.5L1190.0,992.5M1189.5,992.5L1189.0,993.0M1190.0,992.5L1190.5,992.5M1190.5,992.5L1191.0,992.5M1191.0,992.5L1191.5,992.5M1191.5,992.5L1192.0,992.5M1192.0,992.5L1192.5,992.5M1192.5,992.5L1193.0,992.5M1193.0,992.5L1193.5,992.5M1193.5,992.5L1194.0,992.5M1194.0,992.5L1194.5,992.5M1194.5,992.5L1195.0,992.5M1195.0,992.5L1195.5,992.5M1195.5,992.5L1196.0,992.5M1196.0,992.5L1196.5,992.5M1196.5,992.5L1197.0,992.5M1197.0,992.5L1197.5,992.5M1197.5,992.5L1198.0,993.0M977.0,993.0L977.0,993.5M1181.0,993.0L1181.5,993.0M1181.5,993.0L1182.0,993.0M1182.0,993.0L1182.5,993.0M1182.5,993.0L1183.0,993.5M1189.0,993.0L1188.5,993.5M1198.0,993.0L1198.5,993.5M977.0,993.5L977.0,994.0M1183.0,993.5L1183.5,993.5M1183.5,993.5L1184.0,993.5M1184.0,993.5L1184.5,993.5M1184.5,993.5L1185.0,993.5M1185.0,993.5L1185.5,993.5M1185.5,993.5L1186.0,993.5M1186.0,993.5L1186.5,994.0M1188.5,993.5L1188.0,994.0M1188.5,993.5L1188.5,994.0M1198.5,993.5L1199.0,994.0M977.0,994.0L977.0,994.5M1186.5,994.0L1187.0,994.0M1187.0,994.0L1187.5,994.0M1187.5,994.0L1188.0,994.0M1188.0,994.0L1188.5,994.0M1188.5,994.0L1189.0,994.5M1199.0,994.0L1199.0,994.5M977.0,994.5L977.0,995.0M1189.0,994.5L1189.0,995.0M1199.0,994.5L1199.0,995.0M977.0,995.0L977.0,995.5M1189.0,995.0L1189.5,995.5M1199.0,995.0L1199.5,995.5M977.0,995.5L976.5,996.0M1189.5,995.5L1190.0,996.0M1199.5,995.5L1199.5,996.0M976.5,996.0L976.5,996.5M1190.0,996.0L1190.5,996.0M1190.5,996.0L1191.0,996.0M1191.0,996.0L1191.5,996.0M1191.5,996.0L1192.0,996.0M1192.0,996.0L1192.5,996.0M1192.5,996.0L1193.0,996.0M1193.0,996.0L1193.5,996.5M1199.5,996.0L1199.5,996.5M976.5,996.5L976.0,997.0M1193.5,996.5L1194.0,996.5M1194.0,996.5L1194.5,996.5M1194.5,996.5L1195.0,996.5M1195.0,996.5L1195.5,996.5M1195.5,996.5L1196.0,996.5M1196.0,996.5L1196.5,996.5M1196.5,996.5L1197.0,996.5M1197.0,996.5L1197.5,997.0M1199.5,996.5L1199.0,997.0M1199.5,996.5L1200.0,997.0M976.0,997.0L975.5,997.5M1197.5,997.0L1198.0,997.0M1198.0,997.0L1198.5,997.0M1198.5,997.0L1199.0,997.0M1200.0,997.0L1200.5,997.0M1200.5,997.0L1201.0,997.5M975.5,997.5L975.5,998.0M1201.0,997.5L1201.5,997.5M1201.5,997.5L1202.0,998.0M975.5,998.0L975.0,998.5M1202.0,998.0L1202.5,998.0M1202.5,998.0L1203.0,998.5M975.0,998.5L975.0,999.0M1203.0,998.5L1203.5,999.0M975.0,999.0L974.5,999.5M1203.5,999.0L1203.5,999.5M974.5,999.5L974.5,1000.0M1203.5,999.5L1203.5,1000.0M1203.5,999.5L1204.0,1000.0M974.5,1000.0L974.0,1000.5M1203.5,1000.0L1204.0,1000.0M1203.5,1000.0L1203.5,1000.5M1204.0,1000.0L1204.5,1000.0M1204.0,1000.0L1203.5,1000.5M1204.5,1000.0L1205.0,1000.0M1205.0,1000.0L1205.5,1000.0M1205.5,1000.0L1206.0,1000.0M1206.0,1000.0L1206.5,1000.0M974.0,1000.5L974.0,1001.0M1203.5,1000.5L1203.5,1001.0M974.0,1001.0L973.5,1001.5M1203.5,1001.0L1203.5,1001.5M973.5,1001.5L973.0,1002.0M1203.5,1001.5L1203.5,1002.0M973.0,1002.0L973.0,1002.5M1203.5,1002.0L1203.5,1002.5M973.0,1002.5L972.5,1003.0M1203.5,1002.5L1203.5,1003.0M972.5,1003.0L972.0,1003.5M1203.5,1003.0L1203.5,1003.5M1206.0,1003.0L1206.5,1003.0M1206.0,1003.0L1205.5,1003.5M1206.5,1003.0L1207.0,1003.0M972.0,1003.5L972.0,1004.0M1203.5,1003.5L1203.5,1004.0M1203.5,1003.5L1204.0,1004.0M1205.0,1003.5L1205.5,1003.5M1205.0,1003.5L1204.5,1004.0M972.0,1004.0L971.5,1004.5M1203.5,1004.0L1204.0,1004.0M1203.5,1004.0L1203.0,1004.5M1204.0,1004.0L1204.5,1004.0M971.5,1004.5L971.5,1005.0M1203.0,1004.5L1202.5,1005.0M971.5,1005.0L971.0,1005.5M1202.0,1005.0L1202.5,1005.0M971.0,1005.5L971.0,1006.0M971.0,1006.0L970.5,1006.5M970.5,1006.5L970.5,1007.0M970.5,1007.0L970.0,1007.5M970.0,1007.5L970.0,1008.0M970.0,1008.0L970.0,1008.5M970.0,1008.5L970.0,1009.0M970.0,1009.0L969.5,1009.5M969.0,1009.5L969.5,1009.5M969.0,1009.5L968.5,1010.0M969.5,1009.5L970.0,1010.0M968.0,1010.0L968.5,1010.0M968.0,1010.0L967.5,1010.5M970.0,1010.0L970.5,1010.0M970.5,1010.0L971.0,1010.0M971.0,1010.0L971.5,1010.0M971.5,1010.0L972.0,1010.0M972.0,1010.0L972.5,1010.0M972.5,1010.0L973.0,1010.0M973.0,1010.0L973.5,1010.5M967.5,1010.5L967.0,1011.0M973.5,1010.5L973.5,1011.0M966.5,1011.0L967.0,1011.0M973.5,1011.0L973.5,1011.5M973.5,1011.5L973.5,1012.0M973.5,1012.0L973.5,1012.5M973.5,1012.5L973.5,1013.0M973.5,1013.0L973.5,1013.5M973.5,1013.5L973.5,1014.0M973.5,1014.0L973.5,1014.5M973.5,1014.5L973.5,1015.0M973.5,1015.0L974.0,1015.5M974.0,1015.5L974.0,1016.0M974.0,1016.0L974.0,1016.5M974.0,1016.5L974.0,1017.0M974.0,1017.0L974.0,1017.5M974.0,1017.5L974.0,1018.0M974.0,1018.0L974.0,1018.5M974.0,1018.5L974.0,1019.0M974.0,1019.0L974.0,1019.5M974.0,1019.5L974.0,1020.0M974.0,1020.0L974.0,1020.5M974.0,1020.5L974.0,1021.0M974.0,1021.0L974.0,1021.5M974.0,1021.5L974.0,1022.0M974.0,1022.0L974.0,1022.5M974.0,1022.5L974.0,1023.0M974.0,1023.0L974.0,1023.5M974.0,1023.5L974.0,1024.0M974.0,1024.0L974.0,1024.5M974.0,1024.5L974.0,1025.0M974.0,1025.0L974.0,1025.5M974.0,1025.5L974.0,1026.0M974.0,1025.5L974.5,1026.0M974.0,1026.0L974.5,1026.0M974.0,1026.0L974.0,1026.5M974.5,1026.0L975.0,1026.0M974.5,1026.0L974.0,1026.5M975.0,1026.0L975.5,1026.0M975.5,1026.0L976.0,1026.0M976.0,1026.0L976.5,1026.0M974.0,1026.5L974.0,1027.0M974.0,1027.0L974.0,1027.5M974.0,1027.5L974.0,1028.0M974.0,1028.0L973.5,1028.5M973.5,1028.5L973.5,1029.0M973.5,1029.0L973.5,1029.5M973.5,1029.5L973.5,1030.0M973.5,1030.0L973.5,1030.5M973.5,1030.5L973.5,1031.0M973.5,1031.0L973.5,1031.5M973.5,1031.5L973.5,1032.0M973.5,1032.0L973.5,1032.5M973.5,1032.5L973.5,1033.0M973.5,1033.0L973.5,1033.5M973.5,1033.5L973.5,1034.0M973.5,1034.0L973.0,1034.5M973.0,1034.5L973.0,1035.0M973.0,1035.0L973.0,1035.5M973.0,1035.5L973.0,1036.0M1054.5,1035.5L1054.0,1036.0M973.0,1036.0L973.0,1036.5M1054.0,1036.0L1054.0,1036.5M973.0,1036.5L973.0,1037.0M1054.0,1036.5L1054.0,1037.0M973.0,1037.0L973.0,1037.5M1054.0,1037.0L1053.5,1037.5M973.0,1037.5L973.0,1038.0M1048.5,1037.5L1049.0,1037.5M1049.0,1037.5L1049.5,1037.5M1049.5,1037.5L1050.0,1037.5M1050.0,1037.5L1050.5,1038.0M1053.5,1037.5L1053.0,1038.0M973.0,1038.0L973.0,1038.5M1050.5,1038.0L1051.0,1038.0M1050.5,1038.0L1050.0,1038.5M1051.0,1038.0L1051.5,1038.0M1051.5,1038.0L1052.0,1038.0M1052.0,1038.0L1052.5,1038.0M1052.5,1038.0L1053.0,1038.0M973.0,1038.5L972.5,1039.0M1050.0,1038.5L1050.0,1039.0M972.5,1039.0L972.5,1039.5M1050.0,1039.0L1050.0,1039.5M972.5,1039.5L972.5,1040.0M1050.0,1039.5L1050.0,1040.0M972.5,1040.0L972.5,1040.5M1050.0,1040.0L1049.5,1040.5M972.5,1040.5L972.0,1041.0M1049.5,1040.5L1049.5,1041.0M972.0,1041.0L972.0,1041.5M1049.5,1041.0L1049.0,1041.5M972.0,1041.5L972.0,1042.0M1049.0,1041.5L1049.0,1042.0M972.0,1042.0L971.5,1042.5M1049.0,1042.0L1049.0,1042.5M971.5,1042.5L971.5,1043.0M1049.0,1042.5L1049.0,1043.0M971.5,1043.0L971.5,1043.5M1049.0,1043.0L1049.0,1043.5M971.5,1043.5L971.5,1044.0M1049.0,1043.5L1048.5,1044.0M971.5,1044.0L971.0,1044.5M1048.5,1044.0L1048.5,1044.5M971.0,1044.5L971.0,1045.0M1048.5,1044.5L1048.5,1045.0M971.0,1045.0L971.0,1045.5M1048.5,1045.0L1048.5,1045.5M971.0,1045.5L970.5,1046.0M1048.5,1045.5L1048.5,1046.0M970.5,1046.0L970.5,1046.5M1048.5,1046.0L1048.5,1046.5M970.5,1046.5L970.5,1047.0M1048.5,1046.5L1048.5,1047.0M970.5,1047.0L970.5,1047.5M1048.5,1047.0L1048.5,1047.5M970.5,1047.5L970.0,1048.0M1048.5,1047.5L1048.5,1048.0M1051.5,1047.5L1051.5,1048.0M970.0,1048.0L970.0,1048.5M1048.5,1048.0L1048.5,1048.5M1051.5,1048.0L1051.0,1048.5M970.0,1048.5L970.0,1049.0M1048.5,1048.5L1049.0,1049.0M1051.0,1048.5L1050.5,1049.0M970.0,1049.0L970.0,1049.5M1049.0,1049.0L1049.5,1049.0M1049.5,1049.0L1050.0,1049.5M1050.5,1049.0L1050.0,1049.5M1050.5,1049.0L1050.5,1049.5M970.0,1049.5L969.5,1050.0M1050.0,1049.5L1050.5,1049.5M1050.0,1049.5L1050.5,1050.0M1050.5,1049.5L1050.5,1050.0M969.5,1050.0L969.5,1050.5M1050.5,1050.0L1050.5,1050.5M1050.5,1050.0L1051.0,1050.5M969.5,1050.5L969.5,1051.0M1050.5,1050.5L1051.0,1050.5M1050.5,1050.5L1050.5,1051.0M1051.0,1050.5L1051.5,1050.5M1051.0,1050.5L1050.5,1051.0M1051.5,1050.5L1052.0,1051.0M969.5,1051.0L969.0,1051.5M1050.5,1051.0L1050.5,1051.5M1052.0,1051.0L1052.5,1051.0M1052.5,1051.0L1053.0,1051.0M1053.0,1051.0L1053.5,1051.5M969.0,1051.5L969.0,1052.0M1050.5,1051.5L1050.5,1052.0M1053.5,1051.5L1054.0,1052.0M969.0,1052.0L969.0,1052.5M1050.5,1052.0L1050.5,1052.5M1054.0,1052.0L1054.5,1052.0M1054.5,1052.0L1055.0,1052.0M1055.0,1052.0L1055.5,1052.5M969.0,1052.5L969.0,1053.0M1050.5,1052.5L1050.5,1053.0M1055.5,1052.5L1056.0,1052.5M1056.0,1052.5L1056.5,1053.0M969.0,1053.0L969.0,1053.5M1050.5,1053.0L1050.5,1053.5M1056.5,1053.0L1057.0,1053.0M1057.0,1053.0L1057.5,1053.5M969.0,1053.5L968.5,1054.0M1050.5,1053.5L1050.5,1054.0M1057.5,1053.5L1058.0,1054.0M968.5,1054.0L968.5,1054.5M1058.0,1054.0L1058.5,1054.5M968.5,1054.5L968.5,1055.0M1058.5,1054.5L1059.0,1055.0M968.5,1055.0L968.5,1055.5M1059.0,1055.0L1059.5,1055.5M968.5,1055.5L968.5,1056.0M1059.5,1055.5L1059.5,1056.0M968.5,1056.0L968.5,1056.5M1059.5,1056.0L1059.5,1056.5M1059.5,1056.0L1060.0,1056.5M968.5,1056.5L968.0,1057.0M1059.5,1056.5L1060.0,1056.5M1059.5,1056.5L1059.0,1057.0M1060.0,1056.5L1060.5,1057.0M968.0,1057.0L968.0,1057.5M1059.0,1057.0L1058.5,1057.5M1060.5,1057.0L1061.0,1057.5M1117.5,1057.0L1118.0,1057.0M1117.5,1057.0L1117.0,1057.5M1118.0,1057.0L1118.5,1057.5M968.0,1057.5L968.0,1058.0M1058.5,1057.5L1058.5,1058.0M1061.0,1057.5L1061.5,1058.0M1115.5,1057.5L1116.0,1057.5M1115.5,1057.5L1115.0,1058.0M1116.0,1057.5L1116.5,1057.5M1116.5,1057.5L1117.0,1057.5M1118.5,1057.5L1118.5,1058.0M968.0,1058.0L968.0,1058.5M1058.5,1058.0L1058.5,1058.5M1061.5,1058.0L1062.0,1058.5M1113.5,1058.0L1114.0,1058.0M1113.5,1058.0L1113.0,1058.5M1114.0,1058.0L1114.5,1058.0M1114.5,1058.0L1115.0,1058.0M1118.5,1058.0L1119.0,1058.5M968.0,1058.5L968.0,1059.0M1058.5,1058.5L1058.5,1059.0M1062.0,1058.5L1062.5,1059.0M1112.0,1058.5L1112.5,1058.5M1112.0,1058.5L1111.5,1059.0M1112.5,1058.5L1113.0,1058.5M1119.0,1058.5L1119.0,1059.0M968.0,1059.0L967.5,1059.5M1062.5,1059.0L1063.0,1059.5M1110.0,1059.0L1110.5,1059.0M1110.0,1059.0L1109.5,1059.5M1110.5,1059.0L1111.0,1059.0M1111.0,1059.0L1111.5,1059.0M1119.0,1059.0L1119.5,1059.5M967.5,1059.5L967.5,1060.0M1063.0,1059.5L1063.5,1060.0M1108.0,1059.5L1108.5,1059.5M1108.0,1059.5L1107.5,1060.0M1108.5,1059.5L1109.0,1059.5M1109.0,1059.5L1109.5,1059.5M1119.5,1059.5L1119.5,1060.0M967.5,1060.0L967.5,1060.5M1063.5,1060.0L1064.0,1060.5M1106.0,1060.0L1106.5,1060.0M1106.0,1060.0L1105.5,1060.5M1106.5,1060.0L1107.0,1060.0M1107.0,1060.0L1107.5,1060.0M1119.5,1060.0L1120.0,1060.5M967.5,1060.5L967.5,1061.0M1064.0,1060.5L1064.5,1061.0M1104.5,1060.5L1105.0,1060.5M1104.5,1060.5L1104.0,1061.0M1105.0,1060.5L1105.5,1060.5M1120.0,1060.5L1120.0,1061.0M967.5,1061.0L967.5,1061.5M1064.5,1061.0L1065.0,1061.5M1102.0,1061.0L1102.5,1061.0M1102.0,1061.0L1101.5,1061.5M1102.5,1061.0L1103.0,1061.0M1103.0,1061.0L1103.5,1061.0M1103.5,1061.0L1104.0,1061.0M1120.0,1061.0L1120.5,1061.5M967.5,1061.5L967.5,1062.0M1065.0,1061.5L1065.5,1062.0M1099.5,1061.5L1100.0,1061.5M1099.5,1061.5L1099.0,1062.0M1100.0,1061.5L1100.5,1061.5M1100.5,1061.5L1101.0,1061.5M1101.0,1061.5L1101.5,1061.5M1120.5,1061.5L1120.5,1062.0M967.5,1062.0L967.0,1062.5M1065.5,1062.0L1066.0,1062.0M1066.0,1062.0L1066.5,1062.0M1066.5,1062.0L1067.0,1062.0M1067.0,1062.0L1067.5,1062.5M1096.5,1062.0L1097.0,1062.0M1096.5,1062.0L1096.0,1062.5M1097.0,1062.0L1097.5,1062.0M1097.5,1062.0L1098.0,1062.0M1098.0,1062.0L1098.5,1062.0M1098.5,1062.0L1099.0,1062.0M1120.5,1062.0L1121.0,1062.5M967.0,1062.5L967.0,1063.0M1067.5,1062.5L1068.0,1062.5M1068.0,1062.5L1068.5,1062.5M1068.5,1062.5L1069.0,1062.5M1069.0,1062.5L1069.5,1062.5M1069.5,1062.5L1070.0,1062.5M1070.0,1062.5L1070.5,1062.5M1070.5,1062.5L1071.0,1063.0M1093.5,1062.5L1094.0,1062.5M1093.5,1062.5L1093.0,1063.0M1094.0,1062.5L1094.5,1062.5M1094.5,1062.5L1095.0,1062.5M1095.0,1062.5L1095.5,1062.5M1095.5,1062.5L1096.0,1062.5M1121.0,1062.5L1121.0,1063.0M967.0,1063.0L967.0,1063.5M1071.0,1063.0L1071.5,1063.0M1071.5,1063.0L1072.0,1063.0M1072.0,1063.0L1072.5,1063.0M1072.5,1063.0L1073.0,1063.0M1073.0,1063.0L1073.5,1063.0M1073.5,1063.0L1074.0,1063.0M1074.0,1063.0L1074.5,1063.5M1090.5,1063.0L1091.0,1063.0M1090.5,1063.0L1090.0,1063.5M1091.0,1063.0L1091.5,1063.0M1091.5,1063.0L1092.0,1063.0M1092.0,1063.0L1092.5,1063.0M1092.5,1063.0L1093.0,1063.0M1121.0,1063.0L1121.5,1063.5M967.0,1063.5L967.0,1064.0M1074.5,1063.5L1075.0,1063.5M1075.0,1063.5L1075.5,1063.5M1075.5,1063.5L1076.0,1063.5M1076.0,1063.5L1076.5,1063.5M1076.5,1063.5L1077.0,1064.0M1088.5,1063.5L1089.0,1063.5M1088.5,1063.5L1088.0,1064.0M1089.0,1063.5L1089.5,1063.5M1089.5,1063.5L1090.0,1063.5M1121.5,1063.5L1121.5,1064.0M967.0,1064.0L967.0,1064.5M1077.0,1064.0L1077.5,1064.0M1077.5,1064.0L1078.0,1064.0M1078.0,1064.0L1078.5,1064.0M1078.5,1064.0L1079.0,1064.0M1079.0,1064.0L1079.5,1064.0M1079.5,1064.0L1080.0,1064.0M1080.0,1064.0L1080.5,1064.0M1080.5,1064.0L1081.0,1064.0M1081.0,1064.0L1081.5,1064.5M1085.0,1064.0L1085.5,1064.0M1085.0,1064.0L1084.5,1064.5M1085.5,1064.0L1086.0,1064.0M1086.0,1064.0L1086.5,1064.0M1086.5,1064.0L1087.0,1064.0M1087.0,1064.0L1087.5,1064.0M1087.5,1064.0L1088.0,1064.0M1121.5,1064.0L1122.0,1064.5M967.0,1064.5L966.5,1065.0M1081.5,1064.5L1082.0,1064.5M1082.0,1064.5L1082.5,1064.5M1082.5,1064.5L1083.0,1064.5M1083.0,1064.5L1083.5,1064.5M1083.5,1064.5L1084.0,1064.5M1084.0,1064.5L1084.5,1064.5M1122.0,1064.5L1122.0,1065.0M966.5,1065.0L966.5,1065.5M1122.0,1065.0L1122.5,1065.5M966.5,1065.5L966.5,1066.0M1122.5,1065.5L1122.5,1066.0M966.5,1066.0L966.5,1066.5M1122.5,1066.0L1123.0,1066.5M966.5,1066.5L966.5,1067.0M1123.0,1066.5L1123.0,1067.0M966.5,1067.0L966.5,1067.5M1123.0,1067.0L1123.5,1067.5M966.5,1067.5L966.0,1068.0M1123.5,1067.5L1123.5,1068.0M966.0,1068.0L966.0,1068.5M1123.5,1068.0L1124.0,1068.5M966.0,1068.5L966.0,1069.0M1124.0,1068.5L1124.0,1069.0M966.0,1069.0L966.0,1069.5M1124.0,1069.0L1124.5,1069.5M966.0,1069.5L966.0,1070.0M1124.5,1069.5L1124.5,1070.0M966.0,1070.0L965.5,1070.5M1124.5,1070.0L1124.5,1070.5M965.5,1070.5L965.5,1071.0M1124.5,1070.5L1125.0,1071.0M965.5,1071.0L965.5,1071.5M1125.0,1071.0L1125.0,1071.5M965.5,1071.5L965.5,1072.0M1125.0,1071.5L1125.5,1072.0M965.5,1072.0L965.0,1072.5M1125.5,1072.0L1125.5,1072.5M965.0,1072.5L965.0,1073.0M1125.5,1072.5L1126.0,1073.0M965.0,1073.0L965.0,1073.5M1126.0,1073.0L1126.0,1073.5M965.0,1073.5L965.0,1074.0M1126.0,1073.5L1126.5,1074.0M965.0,1074.0L965.0,1074.5M1126.5,1074.0L1126.5,1074.5M965.0,1074.5L965.0,1075.0M1126.5,1074.5L1127.0,1075.0M965.0,1075.0L964.6,1075.5M1127.0,1075.0L1127.0,1075.5M964.6,1075.5L964.6,1076.0M1127.0,1075.5L1127.5,1076.0M964.6,1076.0L964.6,1076.5M1127.5,1076.0L1127.5,1076.5M964.6,1076.5L964.6,1077.0M1127.5,1076.5L1127.5,1077.0M964.6,1077.0L964.6,1077.5M1127.5,1077.0L1128.0,1077.5M964.6,1077.5L964.1,1078.0M1128.0,1077.5L1128.0,1078.0M964.1,1078.0L964.1,1078.5M1128.0,1078.0L1128.0,1078.5M964.1,1078.5L964.1,1079.0M1128.0,1078.5L1128.5,1079.0M964.1,1079.0L964.1,1079.5M1128.5,1079.0L1128.5,1079.5M964.1,1079.5L964.1,1080.0M1128.5,1079.5L1128.5,1080.0M964.1,1080.0L963.6,1080.5M1128.5,1080.0L1128.5,1080.5M963.6,1080.5L963.6,1081.0M1128.5,1080.5L1129.0,1081.0M963.6,1081.0L963.6,1081.5M1129.0,1081.0L1129.0,1081.5M963.6,1081.5L963.6,1082.0M1129.0,1081.5L1129.0,1082.0M963.6,1082.0L963.6,1082.5M1129.0,1082.0L1129.0,1082.5M963.6,1082.5L963.6,1083.0M1129.0,1082.5L1129.5,1083.0M963.6,1083.0L963.1,1083.5M1129.5,1083.0L1129.5,1083.5M963.1,1083.5L963.1,1084.0M1129.5,1083.5L1129.5,1084.0M963.1,1084.0L963.1,1084.5M1129.5,1084.0L1130.0,1084.5M963.1,1084.5L963.1,1085.0M1130.0,1084.5L1130.0,1085.0M963.1,1085.0L963.1,1085.5M1130.0,1085.0L1130.0,1085.5M963.1,1085.5L962.6,1086.0M1130.0,1085.5L1130.0,1086.0M962.6,1086.0L962.6,1086.5M1130.0,1086.0L1130.5,1086.5M962.6,1086.5L962.6,1087.0M1130.5,1086.5L1130.5,1087.0M962.6,1087.0L962.6,1087.5M1130.5,1087.0L1130.5,1087.5M962.6,1087.5L962.6,1088.0M1130.5,1087.5L1130.5,1088.0M962.6,1088.0L962.1,1088.5M1130.5,1088.0L1130.5,1088.5M962.1,1088.5L962.1,1089.0M1130.5,1088.5L1130.5,1089.0M962.1,1089.0L962.1,1089.5M1130.5,1089.0L1130.5,1089.5M962.1,1089.5L962.1,1090.0M1130.5,1089.5L1130.0,1090.0M962.1,1090.0L962.1,1090.5M1130.0,1090.0L1130.0,1090.5M962.1,1090.5L961.6,1091.0M1130.0,1090.5L1130.0,1091.0M961.6,1091.0L961.6,1091.5M1130.0,1091.0L1130.0,1091.5M961.6,1091.5L961.6,1092.0M1130.0,1091.5L1130.0,1092.0M961.6,1092.0L961.6,1092.5M1130.0,1092.0L1130.0,1092.5M961.6,1092.5L961.6,1093.0M1130.0,1092.5L1130.0,1093.0M961.6,1093.0L961.6,1093.5M1130.0,1093.0L1130.0,1093.5M961.6,1093.5L961.1,1094.0M1130.0,1093.5L1130.0,1094.0M961.1,1094.0L961.1,1094.5M1130.0,1094.0L1130.0,1094.5M961.1,1094.5L961.1,1095.0M1130.0,1094.5L1130.0,1095.0M961.1,1095.0L961.1,1095.5M1130.0,1095.0L1130.0,1095.5M961.1,1095.5L961.1,1096.0M1130.0,1095.5L1130.0,1096.0M961.1,1096.0L961.1,1096.5M1130.0,1096.0L1130.0,1096.5M1210.5,1096.0L1211.0,1096.0M1210.5,1096.0L1210.0,1096.5M1211.0,1096.0L1211.5,1096.5M961.1,1096.5L961.1,1097.0M1130.0,1096.5L1130.0,1097.0M1208.5,1096.5L1209.0,1096.5M1208.5,1096.5L1208.0,1097.0M1209.0,1096.5L1209.5,1096.5M1209.5,1096.5L1210.0,1096.5M1211.5,1096.5L1212.0,1097.0M961.1,1097.0L961.1,1097.5M1130.0,1097.0L1130.0,1097.5M1207.5,1097.0L1208.0,1097.0M1207.5,1097.0L1207.0,1097.5M1212.0,1097.0L1212.5,1097.5M961.1,1097.5L960.6,1098.0M1130.0,1097.5L1130.0,1098.0M1207.0,1097.5L1206.5,1098.0M1212.5,1097.5L1213.0,1098.0M960.6,1098.0L960.6,1098.5M1130.0,1098.0L1129.5,1098.5M1206.5,1098.0L1206.5,1098.5M1213.0,1098.0L1213.5,1098.5M960.6,1098.5L960.6,1099.0M1129.5,1098.5L1129.5,1099.0M1206.5,1098.5L1206.0,1099.0M1213.5,1098.5L1214.0,1099.0M960.6,1099.0L960.6,1099.5M1129.5,1099.0L1129.5,1099.5M1206.0,1099.0L1206.0,1099.5M1214.0,1099.0L1214.5,1099.5M960.6,1099.5L960.6,1100.0M1129.5,1099.5L1129.5,1100.0M1206.0,1099.5L1206.0,1100.0M1214.5,1099.5L1214.5,1100.0M960.6,1100.0L960.6,1100.5M1129.5,1100.0L1129.5,1100.5M1206.0,1100.0L1206.0,1100.5M1214.5,1100.0L1215.0,1100.5M960.6,1100.5L960.6,1101.0M1129.5,1100.5L1129.5,1101.0M1206.0,1100.5L1205.5,1101.0M1206.0,1100.5L1206.0,1101.0M1215.0,1100.5L1215.5,1101.0M960.6,1101.0L960.6,1101.5M1129.5,1101.0L1129.5,1101.5M1205.0,1101.0L1205.5,1101.0M1205.0,1101.0L1204.5,1101.5M1205.5,1101.0L1206.0,1101.0M1206.0,1101.0L1206.5,1101.5M1215.5,1101.0L1215.5,1101.5M960.6,1101.5L960.1,1102.0M1129.5,1101.5L1129.5,1102.0M1204.0,1101.5L1204.5,1101.5M1204.0,1101.5L1203.5,1102.0M1206.5,1101.5L1207.0,1101.5M1207.0,1101.5L1207.5,1101.5M1207.5,1101.5L1208.0,1101.5M1208.0,1101.5L1208.5,1102.0M1215.5,1101.5L1216.0,1102.0M960.1,1102.0L960.1,1102.5M1129.5,1102.0L1129.5,1102.5M1203.5,1102.0L1203.0,1102.5M1208.5,1102.0L1209.0,1102.0M1209.0,1102.0L1209.5,1102.5M1216.0,1102.0L1216.0,1102.5M960.1,1102.5L960.1,1103.0M1129.5,1102.5L1129.5,1103.0M1203.0,1102.5L1202.5,1103.0M1209.5,1102.5L1210.0,1103.0M1216.0,1102.5L1216.5,1103.0M960.1,1103.0L960.1,1103.5M1129.5,1103.0L1129.5,1103.5M1202.5,1103.0L1202.0,1103.5M1210.0,1103.0L1210.5,1103.0M1210.5,1103.0L1211.0,1103.5M1216.5,1103.0L1216.5,1103.5M960.1,1103.5L960.1,1104.0M1117.0,1103.5L1117.5,1103.5M1117.0,1103.5L1116.5,1104.0M1117.5,1103.5L1118.0,1103.5M1118.0,1103.5L1118.5,1103.5M1118.5,1103.5L1119.0,1103.5M1119.0,1103.5L1119.5,1103.5M1119.5,1103.5L1120.0,1103.5M1120.0,1103.5L1120.5,1104.0M1121.0,1103.5L1121.5,1103.5M1121.0,1103.5L1120.5,1104.0M1121.5,1103.5L1122.0,1103.5M1122.0,1103.5L1122.5,1103.5M1122.5,1103.5L1123.0,1103.5M1123.0,1103.5L1123.5,1104.0M1129.5,1103.5L1129.5,1104.0M1202.0,1103.5L1201.5,1104.0M1211.0,1103.5L1211.5,1104.0M1216.5,1103.5L1216.5,1104.0M960.1,1104.0L960.1,1104.5M1116.0,1104.0L1116.5,1104.0M1116.0,1104.0L1115.5,1104.5M1123.5,1104.0L1124.0,1104.0M1124.0,1104.0L1124.5,1104.0M1124.5,1104.0L1125.0,1104.0M1125.0,1104.0L1125.5,1104.0M1125.5,1104.0L1126.0,1104.0M1126.0,1104.0L1126.5,1104.0M1126.5,1104.0L1127.0,1104.0M1127.0,1104.0L1127.5,1104.0M1127.5,1104.0L1128.0,1104.0M1128.0,1104.0L1128.5,1104.5M1129.5,1104.0L1129.0,1104.5M1201.0,1104.0L1201.5,1104.0M1201.0,1104.0L1200.5,1104.5M1211.5,1104.0L1212.0,1104.0M1212.0,1104.0L1212.5,1104.5M1216.5,1104.0L1216.5,1104.5M960.1,1104.5L960.1,1105.0M1115.5,1104.5L1115.5,1105.0M1128.5,1104.5L1129.0,1104.5M1200.5,1104.5L1200.0,1105.0M1212.5,1104.5L1213.0,1105.0M1216.5,1104.5L1217.0,1105.0M960.1,1105.0L960.1,1105.5M1115.5,1105.0L1115.0,1105.5M1200.0,1105.0L1199.5,1105.5M1213.0,1105.0L1213.5,1105.5M1217.0,1105.0L1217.0,1105.5M960.1,1105.5L960.1,1106.0M1115.0,1105.5L1114.5,1106.0M1199.5,1105.5L1199.0,1106.0M1213.5,1105.5L1214.0,1105.5M1214.0,1105.5L1214.5,1105.5M1214.5,1105.5L1215.0,1106.0M1217.0,1105.5L1216.5,1106.0M1217.0,1105.5L1217.0,1106.0M960.1,1106.0L960.1,1106.5M1114.5,1106.0L1114.0,1106.5M1199.0,1106.0L1198.5,1106.5M1215.0,1106.0L1215.5,1106.0M1215.5,1106.0L1216.0,1106.0M1216.0,1106.0L1216.5,1106.0M1216.5,1106.0L1217.0,1106.0M1216.5,1106.0L1217.0,1106.5M1217.0,1106.0L1217.0,1106.5M960.1,1106.5L960.1,1107.0M1114.0,1106.5L1113.5,1107.0M1198.0,1106.5L1198.5,1106.5M1198.0,1106.5L1197.5,1107.0M1217.0,1106.5L1217.5,1107.0M960.1,1107.0L959.6,1107.5M1113.5,1107.0L1113.0,1107.5M1197.5,1107.0L1197.0,1107.5M1217.5,1107.0L1217.5,1107.5M959.6,1107.5L959.6,1108.0M1113.0,1107.5L1112.5,1108.0M1197.0,1107.5L1196.5,1108.0M1217.5,1107.5L1218.0,1108.0M959.6,1108.0L959.6,1108.5M1112.5,1108.0L1112.0,1108.5M1196.5,1108.0L1196.0,1108.5M1218.0,1108.0L1218.5,1108.5M959.6,1108.5L959.6,1109.0M1112.0,1108.5L1111.5,1109.0M1196.0,1108.5L1195.5,1109.0M1218.5,1108.5L1218.5,1109.0M959.6,1109.0L959.1,1109.5M1111.5,1109.0L1111.5,1109.5M1194.5,1109.0L1195.0,1109.0M1194.5,1109.0L1194.0,1109.5M1195.0,1109.0L1195.5,1109.0M1195.0,1109.0L1195.5,1109.5M1195.5,1109.0L1195.5,1109.5M1218.5,1109.0L1219.0,1109.5M959.1,1109.5L959.1,1110.0M1111.5,1109.5L1111.0,1110.0M1193.0,1109.5L1193.5,1109.5M1193.0,1109.5L1192.5,1110.0M1193.5,1109.5L1194.0,1109.5M1195.5,1109.5L1195.5,1110.0M1219.0,1109.5L1219.5,1110.0M959.1,1110.0L959.1,1110.5M1111.0,1110.0L1110.5,1110.5M1192.0,1110.0L1192.5,1110.0M1192.0,1110.0L1191.5,1110.5M1195.5,1110.0L1195.5,1110.5M1219.5,1110.0L1220.0,1110.5M959.1,1110.5L958.6,1111.0M1110.5,1110.5L1110.0,1111.0M1191.5,1110.5L1191.0,1111.0M1195.5,1110.5L1196.0,1111.0M1220.0,1110.5L1220.5,1111.0M958.6,1111.0L958.6,1111.5M1110.0,1111.0L1109.5,1111.5M1191.0,1111.0L1190.5,1111.5M1196.0,1111.0L1196.0,1111.5M1220.5,1111.0L1220.5,1111.5M958.6,1111.5L958.6,1112.0M1109.5,1111.5L1109.5,1112.0M1190.5,1111.5L1190.0,1112.0M1196.0,1111.5L1196.0,1112.0M1220.5,1111.5L1220.5,1112.0M958.6,1112.0L958.1,1112.5M1109.5,1112.0L1109.5,1112.5M1190.0,1112.0L1189.5,1112.5M1196.0,1112.0L1196.5,1112.5M1220.5,1112.0L1221.0,1112.5M958.1,1112.5L958.1,1113.0M1109.5,1112.5L1109.5,1113.0M1189.5,1112.5L1189.0,1113.0M1196.5,1112.5L1196.5,1113.0M1221.0,1112.5L1221.0,1113.0M958.1,1113.0L958.1,1113.5M1109.5,1113.0L1109.5,1113.5M1189.0,1113.0L1188.5,1113.5M1196.5,1113.0L1197.0,1113.5M1221.0,1113.0L1221.0,1113.5M958.1,1113.5L958.1,1114.0M1109.5,1113.5L1109.5,1114.0M1188.5,1113.5L1188.0,1114.0M1197.0,1113.5L1197.5,1114.0M1221.0,1113.5L1221.0,1114.0M958.1,1114.0L957.6,1114.5M1109.5,1114.0L1109.5,1114.5M1188.0,1114.0L1187.5,1114.5M1197.5,1114.0L1198.0,1114.5M1221.0,1114.0L1221.0,1114.5M957.6,1114.5L957.6,1115.0M1109.5,1114.5L1109.5,1115.0M1187.5,1114.5L1187.0,1115.0M1198.0,1114.5L1198.0,1115.0M1221.0,1114.5L1220.5,1115.0M957.6,1115.0L957.6,1115.5M1109.5,1115.0L1109.5,1115.5M1187.0,1115.0L1186.5,1115.5M1198.0,1115.0L1198.5,1115.5M1220.5,1115.0L1220.0,1115.5M957.6,1115.5L957.1,1116.0M1109.5,1115.5L1109.0,1116.0M1109.5,1115.5L1109.5,1116.0M1109.5,1115.5L1110.0,1116.0M1124.0,1115.5L1124.5,1115.5M1124.0,1115.5L1123.5,1116.0M1124.5,1115.5L1125.0,1115.5M1125.0,1115.5L1125.5,1115.5M1125.5,1115.5L1126.0,1115.5M1126.0,1115.5L1126.5,1116.0M1186.5,1115.5L1186.0,1116.0M1198.5,1115.5L1199.0,1116.0M1220.0,1115.5L1220.0,1116.0M957.1,1116.0L957.1,1116.5M1108.0,1116.0L1108.5,1116.0M1108.5,1116.0L1109.0,1116.0M1109.0,1116.0L1109.5,1116.0M1109.5,1116.0L1110.0,1116.0M1110.0,1116.0L1110.5,1116.0M1110.5,1116.0L1111.0,1116.0M1111.0,1116.0L1111.5,1116.5M1120.5,1116.0L1121.0,1116.0M1120.5,1116.0L1120.0,1116.5M1121.0,1116.0L1121.5,1116.0M1121.5,1116.0L1122.0,1116.0M1122.0,1116.0L1122.5,1116.0M1122.5,1116.0L1123.0,1116.0M1123.0,1116.0L1123.5,1116.0M1126.5,1116.0L1127.0,1116.0M1127.0,1116.0L1127.5,1116.5M1186.0,1116.0L1185.5,1116.5M1199.0,1116.0L1199.5,1116.5M1220.0,1116.0L1220.0,1116.5M957.1,1116.5L957.1,1117.0M1111.5,1116.5L1112.0,1116.5M1112.0,1116.5L1112.5,1116.5M1112.5,1116.5L1113.0,1116.5M1113.0,1116.5L1113.5,1116.5M1113.5,1116.5L1114.0,1116.5M1114.0,1116.5L1114.5,1116.5M1114.5,1116.5L1115.0,1117.0M1116.0,1116.5L1116.5,1116.5M1116.0,1116.5L1115.5,1117.0M1116.5,1116.5L1117.0,1116.5M1117.0,1116.5L1117.5,1116.5M1117.5,1116.5L1118.0,1116.5M1118.0,1116.5L1118.5,1116.5M1118.5,1116.5L1119.0,1116.5M1119.0,1116.5L1119.5,1116.5M1119.5,1116.5L1120.0,1116.5M1127.5,1116.5L1128.0,1117.0M1185.5,1116.5L1185.0,1117.0M1199.5,1116.5L1200.0,1117.0M1220.0,1116.5L1219.5,1117.0M957.1,1117.0L956.6,1117.5M1115.0,1117.0L1115.5,1117.0M1128.0,1117.0L1128.5,1117.5M1185.0,1117.0L1184.5,1117.5M1200.0,1117.0L1200.5,1117.5M1219.5,1117.0L1219.5,1117.5M956.6,1117.5L956.6,1118.0M1128.5,1117.5L1129.0,1118.0M1184.0,1117.5L1184.5,1117.5M1184.0,1117.5L1183.5,1118.0M1200.5,1117.5L1200.5,1118.0M1219.5,1117.5L1219.0,1118.0M956.6,1118.0L956.6,1118.5M1129.0,1118.0L1129.5,1118.5M1183.5,1118.0L1183.0,1118.5M1200.5,1118.0L1201.0,1118.5M1219.0,1118.0L1218.5,1118.5M956.6,1118.5L956.1,1119.0M1129.5,1118.5L1129.5,1119.0M1182.5,1118.5L1183.0,1118.5M1182.5,1118.5L1182.0,1119.0M1201.0,1118.5L1201.0,1119.0M956.1,1119.0L956.1,1119.5M1129.5,1119.0L1129.5,1119.5M1181.5,1119.0L1182.0,1119.0M1181.5,1119.0L1181.0,1119.5M1201.0,1119.0L1201.5,1119.5M956.1,1119.5L955.6,1120.0M1129.5,1119.5L1129.5,1120.0M1180.5,1119.5L1181.0,1119.5M1180.5,1119.5L1180.0,1120.0M1201.5,1119.5L1201.5,1120.0M955.6,1120.0L955.1,1120.5M1129.5,1120.0L1129.5,1120.5M1179.5,1120.0L1180.0,1120.0M1179.5,1120.0L1179.0,1120.5M1201.5,1120.0L1201.5,1120.5M955.1,1120.5L954.6,1121.0M1129.5,1120.5L1129.5,1121.0M1178.0,1120.5L1178.5,1120.5M1178.0,1120.5L1177.5,1121.0M1178.5,1120.5L1179.0,1120.5M1201.5,1120.5L1201.5,1121.0M954.6,1121.0L954.1,1121.5M1129.5,1121.0L1129.5,1121.5M1177.0,1121.0L1177.5,1121.0M1177.0,1121.0L1176.5,1121.5M1201.5,1121.0L1202.0,1121.5M954.1,1121.5L953.6,1122.0M1129.5,1121.5L1129.5,1122.0M1176.0,1121.5L1176.5,1121.5M1176.0,1121.5L1175.5,1122.0M1202.0,1121.5L1202.0,1122.0M953.6,1122.0L953.1,1122.5M1129.5,1122.0L1129.0,1122.5M1175.0,1122.0L1175.5,1122.0M1175.0,1122.0L1174.5,1122.5M1202.0,1122.0L1202.0,1122.5M953.1,1122.5L952.6,1123.0M1129.0,1122.5L1129.0,1123.0M1173.5,1122.5L1174.0,1122.5M1173.5,1122.5L1173.0,1123.0M1174.0,1122.5L1174.5,1122.5M1202.0,1122.5L1202.0,1123.0M952.6,1123.0L952.1,1123.5M1129.0,1123.0L1129.0,1123.5M1172.5,1123.0L1173.0,1123.0M1172.5,1123.0L1172.0,1123.5M1202.0,1123.0L1202.5,1123.5M952.1,1123.5L951.6,1124.0M1129.0,1123.5L1129.0,1124.0M1171.5,1123.5L1172.0,1123.5M1171.5,1123.5L1171.0,1124.0M1202.5,1123.5L1202.5,1124.0M951.6,1124.0L951.1,1124.5M1129.0,1124.0L1129.0,1124.5M1170.5,1124.0L1171.0,1124.0M1170.5,1124.0L1170.0,1124.5M1202.5,1124.0L1202.5,1124.5M951.1,1124.5L950.6,1125.0M1129.0,1124.5L1129.0,1125.0M1169.0,1124.5L1169.5,1124.5M1169.0,1124.5L1168.5,1125.0M1169.5,1124.5L1170.0,1124.5M1202.5,1124.5L1202.5,1125.0M950.6,1125.0L950.1,1125.5M1129.0,1125.0L1129.0,1125.5M1168.0,1125.0L1168.5,1125.0M1168.0,1125.0L1167.5,1125.5M1202.5,1125.0L1202.5,1125.5M950.1,1125.5L949.6,1126.0M1129.0,1125.5L1129.0,1126.0M1167.0,1125.5L1167.5,1125.5M1167.0,1125.5L1166.5,1126.0M1202.5,1125.5L1202.5,1126.0M949.1,1126.0L949.6,1126.0M949.1,1126.0L948.6,1126.5M1129.0,1126.0L1129.0,1126.5M1166.0,1126.0L1166.5,1126.0M1166.0,1126.0L1165.5,1126.5M1202.5,1126.0L1203.0,1126.5M948.6,1126.5L948.1,1127.0M1129.0,1126.5L1129.0,1127.0M1164.5,1126.5L1165.0,1126.5M1164.5,1126.5L1164.0,1127.0M1165.0,1126.5L1165.5,1126.5M1203.0,1126.5L1203.0,1127.0M948.1,1127.0L947.6,1127.5M1129.0,1127.0L1129.0,1127.5M1162.5,1127.0L1163.0,1127.0M1162.5,1127.0L1162.0,1127.5M1163.0,1127.0L1163.5,1127.0M1163.5,1127.0L1164.0,1127.0M1203.0,1127.0L1203.0,1127.5M947.6,1127.5L947.1,1128.0M1129.0,1127.5L1129.0,1128.0M1160.5,1127.5L1161.0,1127.5M1160.5,1127.5L1160.0,1128.0M1161.0,1127.5L1161.5,1127.5M1161.5,1127.5L1162.0,1127.5M1203.0,1127.5L1203.0,1128.0M947.1,1128.0L946.6,1128.5M1129.0,1128.0L1129.0,1128.5M1158.5,1128.0L1159.0,1128.0M1158.5,1128.0L1158.0,1128.5M1159.0,1128.0L1159.5,1128.0M1159.5,1128.0L1160.0,1128.0M1203.0,1128.0L1203.0,1128.5M946.6,1128.5L946.1,1129.0M1129.0,1128.5L1129.0,1129.0M1155.5,1128.5L1156.0,1128.5M1155.5,1128.5L1155.0,1129.0M1156.0,1128.5L1156.5,1128.5M1156.5,1128.5L1157.0,1128.5M1157.0,1128.5L1157.5,1128.5M1157.5,1128.5L1158.0,1128.5M1203.0,1128.5L1203.0,1129.0M946.1,1129.0L945.6,1129.5M1129.0,1129.0L1129.0,1129.5M1153.5,1129.0L1154.0,1129.0M1153.5,1129.0L1153.0,1129.5M1154.0,1129.0L1154.5,1129.0M1154.5,1129.0L1155.0,1129.0M1203.0,1129.0L1203.5,1129.5M945.6,1129.5L945.1,1130.0M1129.0,1129.5L1129.0,1130.0M1151.5,1129.5L1152.0,1129.5M1151.5,1129.5L1151.0,1130.0M1152.0,1129.5L1152.5,1129.5M1152.5,1129.5L1153.0,1129.5M1203.5,1129.5L1203.5,1130.0M945.1,1130.0L944.6,1130.5M1129.0,1130.0L1129.5,1130.5M1146.5,1130.0L1147.0,1130.0M1146.5,1130.0L1146.0,1130.5M1147.0,1130.0L1147.5,1130.0M1147.5,1130.0L1148.0,1130.0M1148.0,1130.0L1148.5,1130.0M1148.5,1130.0L1149.0,1130.0M1149.0,1130.0L1149.5,1130.0M1149.5,1130.0L1150.0,1130.0M1150.0,1130.0L1150.5,1130.0M1150.5,1130.0L1151.0,1130.0M1203.5,1130.0L1203.5,1130.5M944.6,1130.5L944.1,1131.0M1129.5,1130.5L1130.0,1131.0M1131.5,1130.5L1132.0,1130.5M1131.5,1130.5L1131.0,1131.0M1132.0,1130.5L1132.5,1130.5M1132.5,1130.5L1133.0,1130.5M1133.0,1130.5L1133.5,1130.5M1133.5,1130.5L1134.0,1130.5M1134.0,1130.5L1134.5,1130.5M1134.5,1130.5L1135.0,1130.5M1135.0,1130.5L1135.5,1130.5M1135.5,1130.5L1136.0,1130.5M1136.0,1130.5L1136.5,1130.5M1136.5,1130.5L1137.0,1130.5M1137.0,1130.5L1137.5,1130.5M1137.5,1130.5L1138.0,1130.5M1138.0,1130.5L1138.5,1130.5M1138.5,1130.5L1139.0,1130.5M1139.0,1130.5L1139.5,1130.5M1139.5,1130.5L1140.0,1130.5M1140.0,1130.5L1140.5,1130.5M1140.5,1130.5L1141.0,1130.5M1141.0,1130.5L1141.5,1130.5M1141.5,1130.5L1142.0,1130.5M1142.0,1130.5L1142.5,1130.5M1142.5,1130.5L1143.0,1130.5M1143.0,1130.5L1143.5,1130.5M1143.5,1130.5L1144.0,1130.5M1144.0,1130.5L1144.5,1130.5M1144.5,1130.5L1145.0,1130.5M1145.0,1130.5L1145.5,1130.5M1145.5,1130.5L1146.0,1130.5M1203.5,1130.5L1203.5,1131.0M944.1,1131.0L943.6,1131.5M1130.0,1131.0L1130.5,1131.0M1130.5,1131.0L1131.0,1131.0M1130.5,1131.0L1131.0,1131.5M1131.0,1131.0L1131.0,1131.5M1203.5,1131.0L1203.5,1131.5M943.6,1131.5L943.1,1132.0M1131.0,1131.5L1131.0,1132.0M1203.5,1131.5L1203.5,1132.0M942.6,1132.0L943.1,1132.0M942.6,1132.0L942.1,1132.5M1131.0,1132.0L1131.0,1132.5M1203.5,1132.0L1204.0,1132.5M942.1,1132.5L941.6,1133.0M1131.0,1132.5L1131.0,1133.0M1204.0,1132.5L1204.0,1133.0M941.6,1133.0L941.1,1133.5M1131.0,1133.0L1131.0,1133.5M1204.0,1133.0L1204.0,1133.5M941.1,1133.5L940.6,1134.0M1204.0,1133.5L1204.0,1134.0M940.6,1134.0L940.6,1134.5M1204.0,1134.0L1204.0,1134.5M940.6,1134.5L940.1,1135.0M1204.0,1134.5L1204.5,1135.0M940.1,1135.0L940.1,1135.5M1204.5,1135.0L1204.5,1135.5M940.1,1135.5L940.1,1136.0M1204.5,1135.5L1204.5,1136.0M940.1,1136.0L940.1,1136.5M1204.5,1136.0L1204.5,1136.5M940.1,1136.5L940.6,1137.0M1204.5,1136.5L1204.5,1137.0M940.6,1137.0L940.6,1137.5M1204.5,1137.0L1204.5,1137.5M940.6,1137.5L940.6,1138.0M1204.5,1137.5L1204.5,1138.0M940.6,1138.0L941.1,1138.5M1204.5,1138.0L1205.0,1138.5M941.1,1138.5L941.1,1139.0M1205.0,1138.5L1205.0,1139.0M941.1,1139.0L941.6,1139.5M1205.0,1139.0L1205.0,1139.5M941.6,1139.5L942.1,1140.0M1205.0,1139.5L1205.0,1140.0M942.1,1140.0L942.1,1140.5M1205.0,1140.0L1205.0,1140.5M942.1,1140.5L942.6,1141.0M1205.0,1140.5L1205.0,1141.0M942.6,1141.0L942.6,1141.5M1205.0,1141.0L1205.5,1141.5M942.6,1141.5L943.1,1142.0M1205.5,1141.5L1205.5,1142.0M943.1,1142.0L943.1,1142.5M1205.5,1142.0L1206.0,1142.5M943.1,1142.5L943.1,1143.0M1206.0,1142.5L1206.0,1143.0M943.1,1143.0L943.6,1143.5M1206.0,1143.0L1206.0,1143.5M943.6,1143.5L943.6,1144.0M1206.0,1143.5L1206.5,1144.0M943.6,1144.0L943.6,1144.5M1206.5,1144.0L1206.5,1144.5M943.6,1144.5L943.6,1145.0M1206.5,1144.5L1207.0,1145.0M943.6,1145.0L943.6,1145.5M1207.0,1145.0L1207.5,1145.5M943.6,1145.5L944.1,1146.0M1207.5,1145.5L1207.5,1146.0M944.1,1146.0L944.1,1146.5M1207.5,1146.0L1208.0,1146.5M944.1,1146.5L944.1,1147.0M1208.0,1146.5L1208.0,1147.0M944.1,1147.0L944.1,1147.5M1208.0,1147.0L1208.5,1147.5M944.1,1147.5L944.6,1148.0M1208.5,1147.5L1209.0,1148.0M944.6,1148.0L944.6,1148.5M1209.0,1148.0L1209.0,1148.5M944.6,1148.5L944.6,1149.0M1209.0,1148.5L1209.5,1149.0M944.6,1149.0L944.6,1149.5M1209.5,1149.0L1209.5,1149.5M944.6,1149.5L945.1,1150.0M1209.5,1149.5L1210.0,1150.0M945.1,1150.0L945.6,1150.0M945.1,1150.0L945.1,1150.5M945.6,1150.0L946.1,1150.0M945.6,1150.0L945.1,1150.5M946.1,1150.0L946.6,1150.0M946.6,1150.0L947.1,1150.0M947.1,1150.0L947.6,1150.0M1210.0,1150.0L1210.0,1150.5M945.1,1150.5L945.1,1151.0M1210.0,1150.5L1210.5,1151.0M945.1,1151.0L945.1,1151.5M1210.5,1151.0L1210.5,1151.5M945.1,1151.5L945.1,1152.0M1210.5,1151.5L1211.0,1152.0M945.1,1152.0L945.1,1152.5M1211.0,1152.0L1211.0,1152.5M945.1,1152.5L945.1,1153.0M1211.0,1152.5L1211.5,1153.0M945.1,1153.0L945.6,1153.5M1211.5,1153.0L1212.0,1153.5M945.6,1153.5L945.6,1154.0M1212.0,1153.5L1212.0,1154.0M945.6,1154.0L945.6,1154.5M1212.0,1154.0L1212.5,1154.5M945.6,1154.5L945.6,1155.0M1212.5,1154.5L1212.5,1155.0M945.6,1155.0L945.6,1155.5M1212.5,1155.0L1213.0,1155.5M945.6,1155.5L945.6,1156.0M1213.0,1155.5L1213.5,1156.0M945.6,1156.0L945.6,1156.5M1213.5,1156.0L1214.0,1156.5M945.6,1156.5L945.6,1157.0M1214.0,1156.5L1214.5,1157.0M945.6,1157.0L945.6,1157.5M1214.5,1157.0L1215.0,1157.5M945.6,1157.5L945.6,1158.0M945.6,1157.5L946.1,1158.0M1215.0,1157.5L1215.5,1158.0M945.6,1158.0L946.1,1158.0M945.6,1158.0L945.6,1158.5M946.1,1158.0L946.6,1158.0M946.1,1158.0L945.6,1158.5M946.6,1158.0L947.1,1158.0M950.6,1158.0L950.6,1158.5M1215.5,1158.0L1216.0,1158.5M945.6,1158.5L945.1,1159.0M950.6,1158.5L950.1,1159.0M1216.0,1158.5L1216.5,1159.0M945.1,1159.0L944.6,1159.5M945.1,1159.0L945.1,1159.5M950.1,1159.0L949.6,1159.5M1216.5,1159.0L1217.0,1159.5M943.6,1159.5L944.1,1159.5M944.1,1159.5L944.6,1159.5M944.6,1159.5L945.1,1159.5M944.6,1159.5L945.1,1160.0M945.1,1159.5L945.1,1160.0M945.1,1159.5L945.6,1160.0M949.1,1159.5L949.6,1159.5M949.1,1159.5L948.6,1160.0M1217.0,1159.5L1217.5,1160.0M945.1,1160.0L945.6,1160.0M945.1,1160.0L945.1,1160.5M945.6,1160.0L946.1,1160.0M945.6,1160.0L945.1,1160.5M946.1,1160.0L946.6,1160.0M946.6,1160.0L947.1,1160.0M947.1,1160.0L947.6,1160.0M947.6,1160.0L948.1,1160.0M948.1,1160.0L948.6,1160.0M1217.5,1160.0L1218.0,1160.5M945.1,1160.5L945.1,1161.0M1218.0,1160.5L1218.5,1161.0M945.1,1161.0L945.1,1161.5M1218.5,1161.0L1219.0,1161.5M945.1,1161.5L945.1,1162.0M1219.0,1161.5L1219.5,1162.0M945.1,1162.0L945.1,1162.5M1219.5,1162.0L1220.0,1162.5M943.6,1162.5L944.1,1163.0M945.1,1162.5L944.6,1163.0M1220.0,1162.5L1220.5,1163.0M944.1,1163.0L944.6,1163.0M944.1,1163.0L944.1,1163.5M944.6,1163.0L944.1,1163.5M1220.5,1163.0L1221.0,1163.5M944.1,1163.5L944.1,1164.0M1221.0,1163.5L1221.5,1164.0M944.1,1164.0L944.1,1164.5M1221.5,1164.0L1222.0,1164.0M1222.0,1164.0L1222.5,1164.5M944.1,1164.5L944.1,1165.0M1222.5,1164.5L1223.0,1164.5M1223.0,1164.5L1223.5,1165.0M944.1,1165.0L944.1,1165.5M1223.5,1165.0L1224.0,1165.0M1224.0,1165.0L1224.5,1165.5M944.1,1165.5L943.6,1166.0M944.1,1165.5L944.6,1166.0M1224.5,1165.5L1225.0,1165.5M1225.0,1165.5L1225.5,1166.0M943.6,1166.0L943.1,1166.5M944.6,1166.0L945.1,1166.5M1225.5,1166.0L1226.0,1166.0M1226.0,1166.0L1226.5,1166.5M943.1,1166.5L943.1,1167.0M945.1,1166.5L945.6,1166.5M945.6,1166.5L946.1,1166.5M945.6,1166.5L946.1,1167.0M946.1,1166.5L946.6,1166.5M946.1,1166.5L946.1,1167.0M946.6,1166.5L947.1,1166.5M946.6,1166.5L946.1,1167.0M1226.5,1166.5L1227.0,1166.5M1227.0,1166.5L1227.5,1167.0M943.1,1167.0L943.1,1167.5M946.1,1167.0L946.1,1167.5M1131.5,1167.0L1131.5,1167.5M1227.5,1167.0L1228.0,1167.0M1228.0,1167.0L1228.5,1167.0M1228.5,1167.0L1229.0,1167.5M943.1,1167.5L943.1,1168.0M1131.5,1167.5L1131.5,1168.0M1201.5,1167.5L1202.0,1167.5M1201.5,1167.5L1201.0,1168.0M1202.0,1167.5L1202.5,1167.5M1202.5,1167.5L1203.0,1167.5M1203.0,1167.5L1203.5,1168.0M1229.0,1167.5L1229.5,1167.5M1229.5,1167.5L1230.0,1168.0M943.1,1168.0L942.6,1168.5M1131.5,1168.0L1131.5,1168.5M1131.5,1168.0L1132.0,1168.5M1196.0,1168.0L1196.5,1168.0M1196.0,1168.0L1195.5,1168.5M1196.5,1168.0L1197.0,1168.0M1197.0,1168.0L1197.5,1168.0M1197.5,1168.0L1198.0,1168.0M1198.0,1168.0L1198.5,1168.0M1198.5,1168.0L1199.0,1168.0M1199.0,1168.0L1199.5,1168.0M1199.5,1168.0L1200.0,1168.0M1200.0,1168.0L1200.5,1168.0M1200.5,1168.0L1201.0,1168.0M1203.5,1168.0L1204.0,1168.5M1230.0,1168.0L1230.5,1168.0M1230.5,1168.0L1231.0,1168.5M942.6,1168.5L942.6,1169.0M1131.5,1168.5L1132.0,1168.5M1131.5,1168.5L1131.0,1169.0M1132.0,1168.5L1132.5,1168.5M1132.5,1168.5L1133.0,1168.5M1133.0,1168.5L1133.5,1168.5M1133.5,1168.5L1134.0,1168.5M1134.0,1168.5L1134.5,1169.0M1191.0,1168.5L1191.5,1168.5M1191.0,1168.5L1190.5,1169.0M1191.5,1168.5L1192.0,1168.5M1192.0,1168.5L1192.5,1168.5M1192.5,1168.5L1193.0,1168.5M1193.0,1168.5L1193.5,1168.5M1193.5,1168.5L1194.0,1168.5M1194.0,1168.5L1194.5,1168.5M1194.5,1168.5L1195.0,1168.5M1195.0,1168.5L1195.5,1168.5M1204.0,1168.5L1204.5,1168.5M1204.5,1168.5L1205.0,1169.0M1231.0,1168.5L1231.5,1168.5M1231.5,1168.5L1232.0,1169.0M942.6,1169.0L942.1,1169.5M1131.0,1169.0L1131.0,1169.5M1134.5,1169.0L1135.0,1169.0M1135.0,1169.0L1135.5,1169.0M1135.5,1169.0L1136.0,1169.0M1136.0,1169.0L1136.5,1169.0M1136.5,1169.0L1137.0,1169.0M1137.0,1169.0L1137.5,1169.0M1137.5,1169.0L1138.0,1169.0M1138.0,1169.0L1138.5,1169.0M1138.5,1169.0L1139.0,1169.0M1139.0,1169.0L1139.5,1169.0M1139.5,1169.0L1140.0,1169.0M1140.0,1169.0L1140.5,1169.5M1186.5,1169.0L1187.0,1169.0M1186.5,1169.0L1186.0,1169.5M1187.0,1169.0L1187.5,1169.0M1187.5,1169.0L1188.0,1169.0M1188.0,1169.0L1188.5,1169.0M1188.5,1169.0L1189.0,1169.0M1189.0,1169.0L1189.5,1169.0M1189.5,1169.0L1190.0,1169.0M1190.0,1169.0L1190.5,1169.0M1205.0,1169.0L1205.5,1169.5M1232.0,1169.0L1232.5,1169.0M1232.5,1169.0L1233.0,1169.5M942.1,1169.5L942.1,1170.0M1131.0,1169.5L1131.0,1170.0M1140.5,1169.5L1141.0,1169.5M1141.0,1169.5L1141.5,1169.5M1141.5,1169.5L1142.0,1169.5M1142.0,1169.5L1142.5,1169.5M1142.5,1169.5L1143.0,1169.5M1143.0,1169.5L1143.5,1169.5M1143.5,1169.5L1144.0,1169.5M1144.0,1169.5L1144.5,1169.5M1144.5,1169.5L1145.0,1169.5M1145.0,1169.5L1145.5,1169.5M1145.5,1169.5L1146.0,1169.5M1146.0,1169.5L1146.5,1169.5M1146.5,1169.5L1147.0,1169.5M1147.0,1169.5L1147.5,1169.5M1147.5,1169.5L1148.0,1169.5M1148.0,1169.5L1148.5,1169.5M1148.5,1169.5L1149.0,1169.5M1149.0,1169.5L1149.5,1169.5M1149.5,1169.5L1150.0,1169.5M1150.0,1169.5L1150.5,1169.5M1150.5,1169.5L1151.0,1169.5M1151.0,1169.5L1151.5,1169.5M1151.5,1169.5L1152.0,1169.5M1152.0,1169.5L1152.5,1169.5M1152.5,1169.5L1153.0,1169.5M1153.0,1169.5L1153.5,1169.5M1153.5,1169.5L1154.0,1169.5M1154.0,1169.5L1154.5,1169.5M1154.5,1169.5L1155.0,1169.5M1155.0,1169.5L1155.5,1169.5M1155.5,1169.5L1156.0,1169.5M1156.0,1169.5L1156.5,1169.5M1156.5,1169.5L1157.0,1169.5M1157.0,1169.5L1157.5,1170.0M1181.5,1169.5L1182.0,1169.5M1181.5,1169.5L1181.0,1170.0M1182.0,1169.5L1182.5,1169.5M1182.5,1169.5L1183.0,1169.5M1183.0,1169.5L1183.5,1169.5M1183.5,1169.5L1184.0,1169.5M1184.0,1169.5L1184.5,1169.5M1184.5,1169.5L1185.0,1169.5M1185.0,1169.5L1185.5,1169.5M1185.5,1169.5L1186.0,1169.5M1205.5,1169.5L1206.0,1170.0M1233.0,1169.5L1233.5,1169.5M1233.5,1169.5L1234.0,1170.0M942.1,1170.0L941.6,1170.5M1131.0,1170.0L1130.5,1170.5M1157.5,1170.0L1158.0,1170.0M1158.0,1170.0L1158.5,1170.0M1158.5,1170.0L1159.0,1170.0M1159.0,1170.0L1159.5,1170.0M1159.5,1170.0L1160.0,1170.0M1160.0,1170.0L1160.5,1170.0M1160.5,1170.0L1161.0,1170.0M1161.0,1170.0L1161.5,1170.0M1161.5,1170.0L1162.0,1170.0M1162.0,1170.0L1162.5,1170.0M1162.5,1170.0L1163.0,1170.0M1163.0,1170.0L1163.5,1170.0M1163.5,1170.0L1164.0,1170.0M1164.0,1170.0L1164.5,1170.0M1164.5,1170.0L1165.0,1170.0M1165.0,1170.0L1165.5,1170.0M1165.5,1170.0L1166.0,1170.5M1177.0,1170.0L1177.5,1170.0M1177.0,1170.0L1176.5,1170.5M1177.5,1170.0L1178.0,1170.0M1178.0,1170.0L1178.5,1170.0M1178.5,1170.0L1179.0,1170.0M1179.0,1170.0L1179.5,1170.0M1179.5,1170.0L1180.0,1170.0M1180.0,1170.0L1180.5,1170.0M1180.5,1170.0L1181.0,1170.0M1206.0,1170.0L1206.5,1170.5M1234.0,1170.0L1234.5,1170.0M1234.5,1170.0L1235.0,1170.5M941.6,1170.5L941.6,1171.0M1130.5,1170.5L1130.5,1171.0M1166.0,1170.5L1166.5,1170.5M1166.5,1170.5L1167.0,1170.5M1167.0,1170.5L1167.5,1170.5M1167.5,1170.5L1168.0,1170.5M1168.0,1170.5L1168.5,1170.5M1168.5,1170.5L1169.0,1170.5M1169.0,1170.5L1169.5,1170.5M1169.5,1170.5L1170.0,1170.5M1170.0,1170.5L1170.5,1170.5M1170.5,1170.5L1171.0,1170.5M1171.0,1170.5L1171.5,1170.5M1171.5,1170.5L1172.0,1170.5M1172.0,1170.5L1172.5,1170.5M1172.5,1170.5L1173.0,1170.5M1173.0,1170.5L1173.5,1170.5M1173.5,1170.5L1174.0,1170.5M1174.0,1170.5L1174.5,1170.5M1174.5,1170.5L1175.0,1170.5M1175.0,1170.5L1175.5,1170.5M1175.5,1170.5L1176.0,1170.5M1176.0,1170.5L1176.5,1170.5M1206.5,1170.5L1207.0,1171.0M1235.0,1170.5L1235.5,1170.5M1235.5,1170.5L1236.0,1171.0M941.6,1171.0L941.6,1171.5M1130.5,1171.0L1130.5,1171.5M1207.0,1171.0L1207.5,1171.5M1236.0,1171.0L1236.5,1171.0M1236.5,1171.0L1237.0,1171.0M1237.0,1171.0L1237.5,1171.5M941.6,1171.5L941.1,1172.0M1130.5,1171.5L1130.5,1172.0M1207.5,1171.5L1208.0,1172.0M1237.5,1171.5L1238.0,1171.5M1238.0,1171.5L1238.5,1171.5M1238.5,1171.5L1239.0,1172.0M941.1,1172.0L941.1,1172.5M1130.5,1172.0L1130.0,1172.5M1208.0,1172.0L1208.5,1172.5M1239.0,1172.0L1239.5,1172.0M1239.5,1172.0L1240.0,1172.5M941.1,1172.5L940.6,1173.0M1130.0,1172.5L1130.0,1173.0M1208.5,1172.5L1209.0,1173.0M1240.0,1172.5L1240.5,1172.5M1240.5,1172.5L1241.0,1172.5M1241.0,1172.5L1241.5,1173.0M940.6,1173.0L940.1,1173.5M1130.0,1173.0L1130.0,1173.5M1209.0,1173.0L1209.5,1173.5M1241.5,1173.0L1242.0,1173.0M1242.0,1173.0L1242.5,1173.0M1242.5,1173.0L1243.0,1173.5M940.1,1173.5L939.6,1174.0M1130.0,1173.5L1130.0,1174.0M1209.5,1173.5L1210.0,1173.5M1210.0,1173.5L1210.5,1174.0M1243.0,1173.5L1243.5,1173.5M1243.5,1173.5L1244.0,1173.5M1244.0,1173.5L1244.5,1174.0M939.6,1174.0L939.1,1174.5M1130.0,1174.0L1130.0,1174.5M1210.5,1174.0L1211.0,1174.5M1244.5,1174.0L1245.0,1174.0M1245.0,1174.0L1245.5,1174.5M939.1,1174.5L938.6,1175.0M1130.0,1174.5L1130.0,1175.0M1211.0,1174.5L1211.5,1175.0M1245.5,1174.5L1246.0,1174.5M1246.0,1174.5L1246.5,1175.0M938.1,1175.0L938.6,1175.0M938.1,1175.0L937.6,1175.5M1130.0,1175.0L1129.5,1175.5M1211.5,1175.0L1212.0,1175.5M1246.5,1175.0L1247.0,1175.5M937.6,1175.5L937.1,1176.0M1129.5,1175.5L1129.5,1176.0M1212.0,1175.5L1212.5,1176.0M1247.0,1175.5L1247.5,1175.5M1247.5,1175.5L1248.0,1176.0M937.1,1176.0L936.6,1176.5M1129.5,1176.0L1129.5,1176.5M1212.5,1176.0L1213.0,1176.5M1248.0,1176.0L1248.5,1176.0M1248.5,1176.0L1249.0,1176.5M936.1,1176.5L936.6,1176.5M936.1,1176.5L935.6,1177.0M1129.5,1176.5L1129.5,1177.0M1213.0,1176.5L1213.5,1176.5M1213.5,1176.5L1214.0,1176.5M1214.0,1176.5L1214.5,1177.0M1249.0,1176.5L1249.5,1177.0M935.6,1177.0L935.1,1177.5M1129.5,1177.0L1129.0,1177.5M1214.5,1177.0L1215.0,1177.0M1215.0,1177.0L1215.5,1177.5M1249.5,1177.0L1250.0,1177.0M1250.0,1177.0L1250.5,1177.5M935.1,1177.5L934.6,1178.0M1129.0,1177.5L1129.0,1178.0M1215.5,1177.5L1216.0,1177.5M1216.0,1177.5L1216.5,1178.0M1250.5,1177.5L1251.0,1177.5M1251.0,1177.5L1251.5,1178.0M934.6,1178.0L934.1,1178.5M1129.0,1178.0L1129.0,1178.5M1216.5,1178.0L1217.0,1178.5M1251.5,1178.0L1252.0,1178.0M1252.0,1178.0L1252.5,1178.5M934.1,1178.5L933.6,1179.0M1129.0,1178.5L1129.0,1179.0M1217.0,1178.5L1217.5,1178.5M1217.5,1178.5L1218.0,1179.0M1252.5,1178.5L1253.0,1178.5M1253.0,1178.5L1253.5,1179.0M933.1,1179.0L933.6,1179.0M933.1,1179.0L932.6,1179.5M1129.0,1179.0L1129.0,1179.5M1218.0,1179.0L1218.5,1179.5M1253.5,1179.0L1254.0,1179.0M1254.0,1179.0L1254.5,1179.5M932.6,1179.5L932.1,1180.0M1129.0,1179.5L1129.0,1180.0M1218.5,1179.5L1219.0,1179.5M1219.0,1179.5L1219.5,1180.0M1254.5,1179.5L1255.0,1180.0M932.1,1180.0L931.6,1180.5M1129.0,1180.0L1129.0,1180.5M1129.0,1180.0L1129.5,1180.5M1219.5,1180.0L1220.0,1180.0M1220.0,1180.0L1220.5,1180.5M1255.0,1180.0L1255.5,1180.5M931.1,1180.5L931.6,1180.5M931.1,1180.5L930.6,1181.0M1129.0,1180.5L1129.5,1180.5M1129.0,1180.5L1129.0,1181.0M1129.5,1180.5L1130.0,1180.5M1129.5,1180.5L1129.0,1181.0M1130.0,1180.5L1130.5,1180.5M1130.5,1180.5L1131.0,1180.5M1131.0,1180.5L1131.5,1180.5M1131.5,1180.5L1132.0,1180.5M1220.5,1180.5L1221.0,1180.5M1221.0,1180.5L1221.5,1181.0M1255.5,1180.5L1255.5,1181.0M930.6,1181.0L930.1,1181.5M1129.0,1181.0L1129.0,1181.5M1221.5,1181.0L1222.0,1181.5M1255.5,1181.0L1255.5,1181.5M890.6,1181.5L890.6,1182.0M930.1,1181.5L929.6,1182.0M1129.0,1181.5L1129.0,1182.0M1222.0,1181.5L1222.5,1181.5M1222.5,1181.5L1223.0,1182.0M1255.5,1181.5L1255.5,1182.0M890.6,1182.0L890.6,1182.5M929.6,1182.0L929.1,1182.5M1129.0,1182.0L1129.0,1182.5M1223.0,1182.0L1223.5,1182.5M1255.5,1182.0L1255.5,1182.5M885.1,1182.5L885.1,1183.0M890.6,1182.5L890.1,1183.0M890.6,1182.5L890.6,1183.0M890.6,1182.5L891.1,1183.0M928.6,1182.5L929.1,1182.5M928.6,1182.5L928.1,1183.0M1129.0,1182.5L1129.0,1183.0M1223.5,1182.5L1224.0,1182.5M1224.0,1182.5L1224.5,1183.0M1255.5,1182.5L1255.5,1183.0M885.1,1183.0L884.6,1183.5M885.1,1183.0L885.1,1183.5M885.1,1183.0L885.6,1183.5M888.1,1183.0L888.6,1183.0M888.1,1183.0L887.6,1183.5M888.6,1183.0L889.1,1183.0M889.1,1183.0L889.6,1183.0M889.6,1183.0L890.1,1183.0M890.1,1183.0L890.6,1183.0M890.6,1183.0L891.1,1183.0M891.1,1183.0L891.6,1183.0M891.6,1183.0L892.1,1183.0M892.1,1183.0L892.6,1183.0M892.6,1183.0L893.1,1183.0M893.1,1183.0L893.6,1183.0M893.6,1183.0L894.1,1183.0M894.1,1183.0L894.6,1183.0M894.6,1183.0L895.1,1183.0M895.1,1183.0L895.6,1183.0M895.6,1183.0L896.1,1183.0M896.1,1183.0L896.6,1183.0M896.6,1183.0L897.1,1183.0M897.1,1183.0L897.6,1183.0M897.6,1183.0L898.1,1183.0M898.1,1183.0L898.6,1183.0M898.6,1183.0L899.1,1183.0M899.1,1183.0L899.6,1183.0M899.6,1183.0L900.1,1183.0M900.1,1183.0L900.6,1183.0M900.6,1183.0L901.1,1183.0M901.1,1183.0L901.6,1183.0M901.6,1183.0L902.1,1183.0M902.1,1183.0L902.6,1183.0M902.6,1183.0L903.1,1183.0M903.1,1183.0L903.6,1183.0M903.6,1183.0L904.1,1183.0M904.1,1183.0L904.6,1183.0M904.6,1183.0L905.1,1183.0M905.1,1183.0L905.6,1183.0M905.6,1183.0L906.1,1183.0M906.1,1183.0L906.6,1183.0M906.6,1183.0L907.1,1183.0M907.1,1183.0L907.6,1183.0M907.6,1183.0L908.1,1183.0M908.1,1183.0L908.6,1183.0M908.6,1183.0L909.1,1183.0M909.1,1183.0L909.6,1183.0M909.6,1183.0L910.1,1183.0M910.1,1183.0L910.6,1183.5M928.1,1183.0L927.6,1183.5M1129.0,1183.0L1129.0,1183.5M1224.5,1183.0L1225.0,1183.5M1255.5,1183.0L1255.5,1183.5M884.6,1183.5L885.1,1183.5M884.6,1183.5L884.1,1184.0M885.1,1183.5L885.6,1183.5M885.6,1183.5L886.1,1183.5M886.1,1183.5L886.6,1183.5M886.6,1183.5L887.1,1183.5M887.1,1183.5L887.6,1183.5M910.6,1183.5L911.1,1184.0M927.6,1183.5L927.1,1184.0M1129.0,1183.5L1129.5,1184.0M1225.0,1183.5L1225.5,1184.0M1255.5,1183.5L1255.5,1184.0M884.1,1184.0L883.6,1184.5M911.1,1184.0L911.6,1184.5M927.1,1184.0L927.1,1184.5M1129.5,1184.0L1129.5,1184.5M1225.5,1184.0L1226.0,1184.0M1226.0,1184.0L1226.5,1184.5M1255.5,1184.0L1255.5,1184.5M883.6,1184.5L883.1,1185.0M911.6,1184.5L912.1,1185.0M927.1,1184.5L927.1,1185.0M1129.5,1184.5L1129.5,1185.0M1226.5,1184.5L1227.0,1185.0M1255.5,1184.5L1255.5,1185.0M883.1,1185.0L882.6,1185.5M912.1,1185.0L912.6,1185.5M927.1,1185.0L926.6,1185.5M1129.5,1185.0L1129.5,1185.5M1227.0,1185.0L1227.5,1185.5M1255.5,1185.0L1255.5,1185.5M882.6,1185.5L882.1,1186.0M912.6,1185.5L913.1,1186.0M926.1,1185.5L926.6,1185.5M926.1,1185.5L925.6,1186.0M1129.5,1185.5L1129.5,1186.0M1227.5,1185.5L1228.0,1186.0M1255.5,1185.5L1255.5,1186.0M882.1,1186.0L881.6,1186.5M913.1,1186.0L913.6,1186.5M925.6,1186.0L925.1,1186.5M1129.5,1186.0L1129.5,1186.5M1228.0,1186.0L1228.5,1186.5M1255.5,1186.0L1255.5,1186.5M881.6,1186.5L881.1,1187.0M913.6,1186.5L914.1,1187.0M925.1,1186.5L924.6,1187.0M1129.5,1186.5L1129.5,1187.0M1228.5,1186.5L1229.0,1186.5M1229.0,1186.5L1229.5,1187.0M1255.5,1186.5L1255.0,1187.0M881.1,1187.0L880.6,1187.5M914.1,1187.0L914.6,1187.5M924.6,1187.0L924.1,1187.5M1129.5,1187.0L1129.0,1187.5M1229.5,1187.0L1230.0,1187.5M1253.0,1187.0L1253.5,1187.0M1253.0,1187.0L1252.5,1187.5M1253.5,1187.0L1254.0,1187.0M1254.0,1187.0L1254.5,1187.0M1254.5,1187.0L1255.0,1187.0M880.6,1187.5L880.1,1188.0M914.6,1187.5L915.1,1187.5M915.1,1187.5L915.6,1188.0M923.6,1187.5L924.1,1187.5M923.6,1187.5L923.1,1188.0M1129.0,1187.5L1129.0,1188.0M1230.0,1187.5L1230.5,1188.0M1251.0,1187.5L1251.5,1187.5M1251.0,1187.5L1250.5,1188.0M1251.5,1187.5L1252.0,1187.5M1252.0,1187.5L1252.5,1187.5M880.1,1188.0L879.6,1188.5M915.6,1188.0L916.1,1188.5M923.1,1188.0L922.6,1188.5M1129.0,1188.0L1129.0,1188.5M1230.5,1188.0L1231.0,1188.5M1250.0,1188.0L1250.5,1188.0M1250.0,1188.0L1249.5,1188.5M879.6,1188.5L879.1,1189.0M916.1,1188.5L916.6,1188.5M916.6,1188.5L917.1,1189.0M922.6,1188.5L922.1,1189.0M1129.0,1188.5L1129.0,1189.0M1231.0,1188.5L1231.5,1189.0M1249.5,1188.5L1249.0,1189.0M879.1,1189.0L878.6,1189.5M917.1,1189.0L917.6,1189.0M917.6,1189.0L918.1,1189.5M922.1,1189.0L921.6,1189.5M1129.0,1189.0L1129.0,1189.5M1231.5,1189.0L1232.0,1189.0M1232.0,1189.0L1232.5,1189.5M1249.0,1189.0L1248.5,1189.5M878.6,1189.5L878.1,1190.0M918.1,1189.5L918.6,1189.5M918.6,1189.5L919.1,1190.0M921.6,1189.5L921.1,1190.0M1129.0,1189.5L1129.0,1190.0M1232.5,1189.5L1233.0,1190.0M1248.5,1189.5L1248.0,1190.0M878.1,1190.0L877.6,1190.5M919.1,1190.0L919.6,1190.0M919.6,1190.0L920.1,1190.0M920.1,1190.0L920.6,1190.0M920.6,1190.0L921.1,1190.0M1129.0,1190.0L1128.5,1190.5M1233.0,1190.0L1233.5,1190.5M1248.0,1190.0L1248.0,1190.5M877.6,1190.5L877.1,1191.0M1128.5,1190.5L1128.5,1191.0M1233.5,1190.5L1234.0,1191.0M1248.0,1190.5L1247.5,1191.0M877.1,1191.0L876.6,1191.5M1128.5,1191.0L1128.5,1191.5M1234.0,1191.0L1234.5,1191.5M1247.5,1191.0L1247.0,1191.5M876.6,1191.5L876.1,1192.0M1128.5,1191.5L1128.0,1192.0M1234.5,1191.5L1235.0,1191.5M1235.0,1191.5L1235.5,1192.0M1247.0,1191.5L1247.0,1192.0M876.1,1192.0L875.6,1192.5M876.1,1192.0L876.1,1192.5M1128.0,1192.0L1128.0,1192.5M1235.5,1192.0L1236.0,1192.5M1247.0,1192.0L1246.5,1192.5M875.6,1192.5L876.1,1192.5M875.6,1192.5L875.1,1193.0M876.1,1192.5L876.6,1193.0M1128.0,1192.5L1128.0,1193.0M1236.0,1192.5L1236.5,1193.0M1246.5,1192.5L1246.0,1193.0M874.6,1193.0L875.1,1193.0M874.6,1193.0L874.1,1193.5M876.6,1193.0L876.6,1193.5M1128.0,1193.0L1127.5,1193.5M1236.5,1193.0L1237.0,1193.5M1246.0,1193.0L1246.0,1193.5M874.1,1193.5L873.6,1194.0M876.6,1193.5L876.6,1194.0M1127.5,1193.5L1127.5,1194.0M1237.0,1193.5L1237.5,1193.5M1237.5,1193.5L1238.0,1194.0M1246.0,1193.5L1245.5,1194.0M873.6,1194.0L873.1,1194.5M876.6,1194.0L876.6,1194.5M1127.5,1194.0L1127.0,1194.5M1238.0,1194.0L1238.5,1194.0M1238.5,1194.0L1239.0,1194.5M1245.5,1194.0L1245.0,1194.5M873.1,1194.5L872.6,1195.0M873.1,1194.5L873.1,1195.0M876.6,1194.5L876.6,1195.0M1127.0,1194.5L1127.0,1195.0M1239.0,1194.5L1239.5,1194.5M1239.5,1194.5L1240.0,1195.0M1245.0,1194.5L1244.5,1195.0M870.1,1195.0L870.6,1195.0M870.1,1195.0L869.6,1195.5M870.6,1195.0L871.1,1195.0M871.1,1195.0L871.6,1195.0M871.6,1195.0L872.1,1195.0M872.1,1195.0L872.6,1195.0M872.6,1195.0L873.1,1195.0M873.1,1195.0L873.6,1195.5M876.6,1195.0L876.6,1195.5M1127.0,1195.0L1127.0,1195.5M1240.0,1195.0L1240.5,1195.0M1240.5,1195.0L1241.0,1195.5M1244.5,1195.0L1244.0,1195.5M869.1,1195.5L869.6,1195.5M873.6,1195.5L874.1,1196.0M876.6,1195.5L876.1,1196.0M876.6,1195.5L876.6,1196.0M1127.0,1195.5L1126.5,1196.0M1241.0,1195.5L1241.5,1195.5M1241.5,1195.5L1242.0,1195.5M1242.0,1195.5L1242.5,1195.5M1242.5,1195.5L1243.0,1195.5M1243.0,1195.5L1243.5,1195.5M1243.5,1195.5L1244.0,1195.5M874.1,1196.0L874.6,1196.0M874.6,1196.0L875.1,1196.0M875.1,1196.0L875.6,1196.0M875.6,1196.0L876.1,1196.0M876.1,1196.0L876.6,1196.0M876.6,1196.0L877.1,1196.5M1126.5,1196.0L1126.5,1196.5M877.1,1196.5L877.6,1196.5M877.6,1196.5L878.1,1197.0M1126.5,1196.5L1126.0,1197.0M878.1,1197.0L878.6,1197.0M878.1,1197.0L878.1,1197.5M878.6,1197.0L879.1,1197.0M878.6,1197.0L878.1,1197.5M879.1,1197.0L879.6,1197.0M879.6,1197.0L880.1,1197.0M880.1,1197.0L880.6,1197.0M880.6,1197.0L881.1,1197.0M881.1,1197.0L881.6,1197.5M1126.0,1197.0L1125.5,1197.5M878.1,1197.5L878.1,1198.0M881.6,1197.5L881.6,1198.0M1125.5,1197.5L1125.0,1198.0M878.1,1198.0L878.1,1198.5M881.6,1198.0L881.6,1198.5M1125.0,1198.0L1125.0,1198.5M878.1,1198.5L878.1,1199.0M881.6,1198.5L881.6,1199.0M1125.0,1198.5L1124.5,1199.0M878.1,1199.0L878.1,1199.5M881.6,1199.0L881.6,1199.5M1124.5,1199.0L1124.0,1199.5M878.1,1199.5L878.1,1200.0M881.6,1199.5L881.6,1200.0M1124.0,1199.5L1123.5,1200.0M881.6,1200.0L881.6,1200.5M1123.5,1200.0L1123.5,1200.5M881.6,1200.5L881.6,1201.0M1123.5,1200.5L1123.0,1201.0M881.6,1201.0L881.6,1201.5M1123.0,1201.0L1122.5,1201.5M881.6,1201.5L881.6,1202.0M1122.5,1201.5L1122.5,1202.0M881.6,1202.0L881.6,1202.5M1122.5,1202.0L1122.0,1202.5M881.6,1202.5L881.6,1203.0M1122.0,1202.5L1121.5,1203.0M881.6,1203.0L881.6,1203.5M1121.5,1203.0L1121.0,1203.5M881.6,1203.5L881.6,1204.0M1121.0,1203.5L1121.0,1204.0M881.6,1204.0L881.6,1204.5M1121.0,1204.0L1120.5,1204.5M881.6,1204.5L881.6,1205.0M1120.5,1204.5L1120.0,1205.0M881.6,1205.0L881.6,1205.5M1120.0,1205.0L1119.5,1205.5M881.6,1205.5L881.6,1206.0M1119.5,1205.5L1119.0,1206.0M881.6,1206.0L881.6,1206.5M1119.0,1206.0L1118.5,1206.5M881.6,1206.5L881.6,1207.0M1118.5,1206.5L1118.5,1207.0M881.6,1207.0L881.6,1207.5M1118.5,1207.0L1118.0,1207.5M881.6,1207.5L881.6,1208.0M1118.0,1207.5L1117.5,1208.0M881.6,1208.0L881.6,1208.5M1117.5,1208.0L1117.0,1208.5M881.6,1208.5L881.6,1209.0M1117.0,1208.5L1117.0,1209.0M881.6,1209.0L881.6,1209.5M1117.0,1209.0L1116.5,1209.5M881.6,1209.5L882.1,1210.0M1116.5,1209.5L1116.0,1210.0M882.1,1210.0L882.6,1210.0M882.6,1210.0L883.1,1210.0M883.1,1210.0L883.6,1210.0M883.6,1210.0L884.1,1210.0M884.1,1210.0L884.6,1210.0M884.6,1210.0L885.1,1210.0M885.1,1210.0L885.6,1210.0M885.6,1210.0L886.1,1210.0M886.1,1210.0L886.6,1210.0M886.6,1210.0L887.1,1210.0M887.1,1210.0L887.6,1210.0M887.6,1210.0L888.1,1210.0M888.1,1210.0L888.6,1210.0M888.6,1210.0L889.1,1210.0M889.1,1210.0L889.6,1210.0M889.6,1210.0L890.1,1210.0M890.1,1210.0L890.6,1210.0M890.6,1210.0L891.1,1210.0M891.1,1210.0L891.6,1210.0M891.6,1210.0L892.1,1210.0M892.1,1210.0L892.6,1210.0M892.6,1210.0L893.1,1210.0M893.1,1210.0L893.6,1210.0M893.6,1210.0L894.1,1210.0M894.1,1210.0L894.6,1210.0M894.6,1210.0L895.1,1210.0M895.1,1210.0L895.6,1210.0M895.6,1210.0L896.1,1210.0M896.1,1210.0L896.6,1210.0M896.6,1210.0L897.1,1210.0M897.1,1210.0L897.6,1210.0M897.6,1210.0L898.1,1210.0M898.1,1210.0L898.6,1210.0M898.6,1210.0L899.1,1210.0M899.1,1210.0L899.6,1210.0M899.6,1210.0L900.1,1210.0M900.1,1210.0L900.6,1210.0M900.6,1210.0L901.1,1210.0M901.1,1210.0L901.6,1210.0M901.6,1210.0L902.1,1210.0M902.1,1210.0L902.6,1210.0M902.6,1210.0L903.1,1210.0M903.1,1210.0L903.6,1210.0M903.6,1210.0L904.1,1210.0M904.1,1210.0L904.6,1210.0M904.6,1210.0L905.1,1210.0M905.1,1210.0L905.6,1210.0M905.6,1210.0L906.1,1210.0M906.1,1210.0L906.6,1210.0M906.6,1210.0L907.1,1210.0M907.1,1210.0L907.6,1210.0M907.6,1210.0L908.1,1210.0M908.1,1210.0L908.6,1210.0M908.6,1210.0L909.1,1210.0M909.1,1210.0L909.6,1210.5M1116.0,1210.0L1116.0,1210.5M909.6,1210.5L910.1,1210.5M910.1,1210.5L910.6,1211.0M1116.0,1210.5L1115.5,1211.0M910.6,1211.0L911.1,1211.0M911.1,1211.0L911.6,1211.5M1115.5,1211.0L1115.0,1211.5M911.6,1211.5L912.1,1211.5M912.1,1211.5L912.6,1212.0M1115.0,1211.5L1114.5,1212.0M912.6,1212.0L913.1,1212.0M913.1,1212.0L913.6,1212.5M1114.5,1212.0L1114.0,1212.5M913.6,1212.5L914.1,1212.5M914.1,1212.5L914.6,1213.0M1114.0,1212.5L1113.5,1213.0M914.6,1213.0L915.1,1213.0M915.1,1213.0L915.6,1213.5M1113.5,1213.0L1113.5,1213.5M915.6,1213.5L916.1,1213.5M916.1,1213.5L916.6,1214.0M1113.5,1213.5L1113.0,1214.0M916.6,1214.0L917.1,1214.5M1113.0,1214.0L1112.5,1214.5M917.1,1214.5L917.6,1214.5M917.6,1214.5L918.1,1215.0M1112.5,1214.5L1112.5,1215.0M918.1,1215.0L918.6,1215.0M918.6,1215.0L919.1,1215.0M919.1,1215.0L919.6,1215.5M1112.5,1215.0L1112.5,1215.5M919.6,1215.5L920.1,1216.0M1112.5,1215.5L1112.0,1216.0M920.1,1216.0L920.6,1216.0M920.6,1216.0L921.1,1216.5M1112.0,1216.0L1112.0,1216.5M921.1,1216.5L921.6,1216.5M921.6,1216.5L922.1,1217.0M1112.0,1216.5L1111.5,1217.0M922.1,1217.0L922.6,1217.0M922.6,1217.0L923.1,1217.5M1111.5,1217.0L1111.5,1217.5M923.1,1217.5L923.6,1217.5M923.6,1217.5L924.1,1218.0M1111.5,1217.5L1111.0,1218.0M924.1,1218.0L924.6,1218.0M924.6,1218.0L925.1,1218.5M1111.0,1218.0L1111.0,1218.5M925.1,1218.5L925.6,1218.5M925.6,1218.5L926.1,1219.0M1111.0,1218.5L1111.0,1219.0M926.1,1219.0L926.6,1219.0M926.6,1219.0L927.1,1219.5M1111.0,1219.0L1110.5,1219.5M927.1,1219.5L927.6,1220.0M1110.5,1219.5L1110.5,1220.0M927.6,1220.0L927.6,1220.5M1110.5,1220.0L1110.0,1220.5M927.6,1220.5L928.1,1221.0M1110.0,1220.5L1110.0,1221.0M928.1,1221.0L928.1,1221.5M1110.0,1221.0L1109.5,1221.5M928.1,1221.5L928.6,1222.0M1109.5,1221.5L1109.5,1222.0M928.6,1222.0L928.6,1222.5M1109.5,1222.0L1109.0,1222.5M928.6,1222.5L929.1,1223.0M1109.0,1222.5L1109.0,1223.0M929.1,1223.0L929.1,1223.5M1109.0,1223.0L1108.5,1223.5M929.1,1223.5L929.6,1224.0M1108.5,1223.5L1108.5,1224.0M929.6,1224.0L929.6,1224.5M1108.5,1224.0L1108.5,1224.5M929.6,1224.5L930.1,1225.0M1108.5,1224.5L1108.0,1225.0M930.1,1225.0L930.1,1225.5M1108.0,1225.0L1108.0,1225.5M930.1,1225.5L930.6,1226.0M1108.0,1225.5L1107.5,1226.0M930.6,1226.0L931.1,1226.5M1107.5,1226.0L1107.5,1226.5M931.1,1226.5L931.1,1227.0M1107.5,1226.5L1107.5,1227.0M931.1,1227.0L931.1,1227.5M1107.5,1227.0L1107.5,1227.5M931.1,1227.5L931.1,1228.0M1107.5,1227.5L1107.5,1228.0M931.1,1228.0L931.6,1228.5M1107.5,1228.0L1107.5,1228.5M931.6,1228.5L931.6,1229.0M1107.5,1228.5L1108.0,1229.0M931.6,1229.0L931.1,1229.5M1108.0,1229.0L1107.5,1229.5M1108.0,1229.0L1108.0,1229.5M1108.0,1229.0L1108.5,1229.5M931.1,1229.5L931.1,1230.0M1107.5,1229.5L1108.0,1229.5M1107.5,1229.5L1107.0,1230.0M1108.0,1229.5L1108.5,1229.5M1108.5,1229.5L1109.0,1229.5M1109.0,1229.5L1109.5,1229.5M1109.5,1229.5L1110.0,1229.5M1110.0,1229.5L1110.5,1230.0M931.1,1230.0L931.1,1230.5M1107.0,1230.0L1106.5,1230.5M1110.5,1230.0L1111.0,1230.0M1111.0,1230.0L1111.5,1230.0M1111.5,1230.0L1112.0,1230.5M931.1,1230.5L930.6,1231.0M1106.5,1230.5L1106.0,1231.0M1112.0,1230.5L1112.5,1230.5M1112.5,1230.5L1113.0,1230.5M1113.0,1230.5L1113.5,1230.5M1113.5,1230.5L1114.0,1231.0M930.6,1231.0L930.6,1231.5M1106.0,1231.0L1106.0,1231.5M1114.0,1231.0L1114.5,1231.0M1114.5,1231.0L1115.0,1231.0M1115.0,1231.0L1115.5,1231.0M1115.5,1231.0L1116.0,1231.0M1116.0,1231.0L1116.5,1231.5M930.6,1231.5L930.1,1232.0M1106.0,1231.5L1106.0,1232.0M1116.5,1231.5L1117.0,1231.5M1117.0,1231.5L1117.5,1231.5M1117.5,1231.5L1118.0,1231.5M1118.0,1231.5L1118.5,1231.5M1118.5,1231.5L1119.0,1231.5M1119.0,1231.5L1119.5,1231.5M1119.5,1231.5L1120.0,1231.5M1120.0,1231.5L1120.5,1231.5M1120.5,1231.5L1121.0,1231.5M1121.0,1231.5L1121.5,1232.0M930.1,1232.0L930.1,1232.5M969.1,1232.0L968.6,1232.5M1106.0,1232.0L1105.5,1232.5M1121.5,1232.0L1122.0,1232.5M930.1,1232.5L929.6,1233.0M968.6,1232.5L968.1,1233.0M1105.5,1232.5L1105.5,1233.0M929.6,1233.0L929.6,1233.5M968.1,1233.0L968.1,1233.5M1105.5,1233.0L1105.5,1233.5M929.6,1233.5L929.1,1234.0M968.1,1233.5L968.1,1234.0M1105.5,1233.5L1105.0,1234.0M929.1,1234.0L929.1,1234.5M968.1,1234.0L968.1,1234.5M1105.0,1234.0L1105.0,1234.5M929.1,1234.5L928.6,1235.0M968.1,1234.5L967.6,1235.0M968.1,1234.5L968.1,1235.0M1105.0,1234.5L1104.5,1235.0M928.6,1235.0L928.6,1235.5M966.6,1235.0L967.1,1235.0M966.6,1235.0L966.1,1235.5M967.1,1235.0L967.6,1235.0M967.6,1235.0L968.1,1235.0M968.1,1235.0L968.6,1235.5M974.6,1235.0L974.1,1235.5M1104.5,1235.0L1104.5,1235.5M928.6,1235.5L928.1,1236.0M965.6,1235.5L966.1,1235.5M965.6,1235.5L965.1,1236.0M968.6,1235.5L969.1,1235.5M969.1,1235.5L969.6,1235.5M969.6,1235.5L970.1,1235.5M970.1,1235.5L970.6,1236.0M974.1,1235.5L973.6,1236.0M1104.5,1235.5L1104.0,1236.0M928.1,1236.0L928.1,1236.5M965.1,1236.0L964.6,1236.5M970.6,1236.0L971.1,1236.0M971.1,1236.0L971.6,1236.0M971.6,1236.0L972.1,1236.0M972.1,1236.0L972.6,1236.0M972.6,1236.0L973.1,1236.0M973.1,1236.0L973.6,1236.0M973.1,1236.0L973.6,1236.5M973.6,1236.0L973.6,1236.5M1104.0,1236.0L1104.0,1236.5M928.1,1236.5L927.6,1237.0M964.6,1236.5L964.6,1237.0M973.6,1236.5L974.1,1237.0M1104.0,1236.5L1104.0,1237.0M927.6,1237.0L927.1,1237.5M964.6,1237.0L964.1,1237.5M974.1,1237.0L974.6,1237.5M1104.0,1237.0L1103.5,1237.5M927.1,1237.5L927.1,1238.0M964.1,1237.5L964.1,1238.0M974.6,1237.5L975.1,1238.0M1103.5,1237.5L1103.5,1238.0M927.1,1238.0L926.6,1238.5M964.1,1238.0L963.6,1238.5M975.1,1238.0L975.6,1238.5M1103.5,1238.0L1103.0,1238.5M926.6,1238.5L926.1,1239.0M963.6,1238.5L963.1,1239.0M975.6,1238.5L976.1,1239.0M1103.0,1238.5L1103.0,1239.0M926.1,1239.0L925.6,1239.5M963.1,1239.0L963.1,1239.5M976.1,1239.0L976.6,1239.5M1103.0,1239.0L1103.0,1239.5M925.6,1239.5L925.1,1240.0M963.1,1239.5L962.6,1240.0M976.6,1239.5L977.1,1240.0M1103.0,1239.5L1102.5,1240.0M925.1,1240.0L924.6,1240.5M962.6,1240.0L962.1,1240.5M977.1,1240.0L977.6,1240.5M1102.5,1240.0L1102.5,1240.5M924.6,1240.5L924.6,1241.0M962.1,1240.5L962.1,1241.0M977.6,1240.5L978.1,1241.0M1102.5,1240.5L1102.5,1241.0M924.6,1241.0L924.1,1241.5M962.1,1241.0L962.1,1241.5M978.1,1241.0L978.6,1241.5M1102.5,1241.0L1102.0,1241.5M924.1,1241.5L923.6,1242.0M962.1,1241.5L961.6,1242.0M978.6,1241.5L979.1,1242.0M1102.0,1241.5L1102.0,1242.0M923.6,1242.0L923.1,1242.5M961.6,1242.0L961.1,1242.5M979.1,1242.0L979.6,1242.5M1102.0,1242.0L1101.5,1242.5M923.1,1242.5L922.6,1243.0M961.1,1242.5L960.6,1243.0M979.6,1242.5L979.6,1243.0M1101.5,1242.5L1101.5,1243.0M922.6,1243.0L922.6,1243.5M960.6,1243.0L960.6,1243.5M979.6,1243.0L979.6,1243.5M1101.5,1243.0L1101.5,1243.5M922.6,1243.5L922.1,1244.0M960.6,1243.5L960.1,1244.0M979.6,1243.5L980.1,1244.0M1101.5,1243.5L1101.0,1244.0M922.1,1244.0L921.6,1244.5M960.1,1244.0L959.6,1244.5M980.1,1244.0L980.6,1244.0M980.6,1244.0L981.1,1244.5M1101.0,1244.0L1101.0,1244.5M921.6,1244.5L921.1,1245.0M959.6,1244.5L959.6,1245.0M981.1,1244.5L981.6,1245.0M1101.0,1244.5L1100.5,1245.0M921.1,1245.0L920.6,1245.5M959.6,1245.0L959.1,1245.5M981.6,1245.0L981.6,1245.5M1100.5,1245.0L1100.5,1245.5M920.6,1245.5L920.1,1246.0M959.1,1245.5L958.6,1246.0M981.6,1245.5L982.1,1246.0M1100.5,1245.5L1100.0,1246.0M920.1,1246.0L920.1,1246.5M958.6,1246.0L958.6,1246.5M982.1,1246.0L982.6,1246.5M1100.0,1246.0L1100.0,1246.5M920.1,1246.5L919.6,1247.0M958.6,1246.5L958.1,1247.0M982.6,1246.5L983.1,1247.0M1100.0,1246.5L1100.0,1247.0M919.6,1247.0L919.1,1247.5M958.1,1247.0L957.6,1247.5M983.1,1247.0L983.6,1247.0M983.6,1247.0L984.1,1247.5M1100.0,1247.0L1099.5,1247.5M919.1,1247.5L919.1,1248.0M957.6,1247.5L957.1,1248.0M984.1,1247.5L984.6,1247.5M984.6,1247.5L985.1,1248.0M1099.5,1247.5L1099.0,1248.0M919.1,1248.0L918.6,1248.5M957.1,1248.0L956.6,1248.5M985.1,1248.0L985.6,1248.5M1099.0,1248.0L1098.5,1248.5M918.6,1248.5L918.6,1249.0M956.6,1248.5L956.1,1249.0M985.6,1248.5L986.1,1249.0M1098.5,1248.5L1098.0,1249.0M918.6,1249.0L918.1,1249.5M955.6,1249.0L956.1,1249.0M955.6,1249.0L955.1,1249.5M986.1,1249.0L986.6,1249.5M1097.5,1249.0L1098.0,1249.0M1097.5,1249.0L1097.0,1249.5M918.1,1249.5L918.1,1250.0M955.1,1249.5L954.6,1250.0M986.6,1249.5L986.6,1250.0M1097.0,1249.5L1096.5,1250.0M918.1,1250.0L917.6,1250.5M954.1,1250.0L954.6,1250.0M954.1,1250.0L953.6,1250.5M986.6,1250.0L987.1,1250.5M1096.0,1250.0L1096.5,1250.0M1096.0,1250.0L1095.5,1250.5M917.6,1250.5L917.6,1251.0M953.6,1250.5L953.1,1251.0M987.1,1250.5L987.6,1250.5M987.6,1250.5L988.1,1251.0M1095.0,1250.5L1095.5,1250.5M1095.0,1250.5L1094.5,1251.0M917.6,1251.0L917.1,1251.5M917.6,1251.0L917.6,1251.5M917.6,1251.0L918.1,1251.5M919.1,1251.0L919.6,1251.0M919.1,1251.0L918.6,1251.5M919.6,1251.0L920.1,1251.0M920.1,1251.0L920.6,1251.0M920.6,1251.0L921.1,1251.0M921.1,1251.0L921.6,1251.0M921.6,1251.0L922.1,1251.0M922.1,1251.0L922.6,1251.0M922.6,1251.0L923.1,1251.0M923.1,1251.0L923.6,1251.0M923.6,1251.0L924.1,1251.0M924.1,1251.0L924.6,1251.0M924.6,1251.0L925.1,1251.5M952.6,1251.0L953.1,1251.0M952.6,1251.0L952.1,1251.5M988.1,1251.0L988.6,1251.5M1094.5,1251.0L1094.0,1251.5M917.1,1251.5L917.6,1251.5M917.1,1251.5L916.6,1252.0M917.6,1251.5L918.1,1251.5M918.1,1251.5L918.6,1251.5M925.1,1251.5L925.6,1251.5M925.6,1251.5L926.1,1251.5M926.1,1251.5L926.6,1251.5M926.6,1251.5L927.1,1251.5M927.1,1251.5L927.6,1252.0M952.1,1251.5L951.6,1252.0M988.6,1251.5L989.1,1252.0M1093.5,1251.5L1094.0,1251.5M1093.5,1251.5L1093.0,1252.0M916.6,1252.0L916.6,1252.5M927.6,1252.0L928.1,1252.0M928.1,1252.0L928.6,1252.0M928.6,1252.0L929.1,1252.5M937.6,1252.0L938.1,1252.0M937.6,1252.0L937.1,1252.5M938.1,1252.0L938.6,1252.0M938.6,1252.0L939.1,1252.0M939.1,1252.0L939.6,1252.0M939.6,1252.0L940.1,1252.0M940.1,1252.0L940.6,1252.0M940.6,1252.0L941.1,1252.5M951.1,1252.0L951.6,1252.0M951.1,1252.0L950.6,1252.5M989.1,1252.0L989.5,1252.5M1092.5,1252.0L1093.0,1252.0M1092.5,1252.0L1092.0,1252.5M916.6,1252.5L917.1,1253.0M929.1,1252.5L929.6,1252.5M929.6,1252.5L930.1,1252.5M930.1,1252.5L930.6,1252.5M930.6,1252.5L931.1,1253.0M934.6,1252.5L935.1,1252.5M934.6,1252.5L934.1,1253.0M935.1,1252.5L935.6,1252.5M935.6,1252.5L936.1,1252.5M936.1,1252.5L936.6,1252.5M936.6,1252.5L937.1,1252.5M941.1,1252.5L941.6,1252.5M941.6,1252.5L942.1,1252.5M942.1,1252.5L942.6,1253.0M950.6,1252.5L950.1,1253.0M989.5,1252.5L990.0,1252.5M990.0,1252.5L990.5,1253.0M1091.5,1252.5L1092.0,1252.5M1091.5,1252.5L1091.0,1253.0M931.1,1253.0L931.6,1253.0M931.6,1253.0L932.1,1253.0M932.1,1253.0L932.6,1253.0M932.6,1253.0L933.1,1253.0M933.1,1253.0L933.6,1253.0M933.6,1253.0L934.1,1253.0M942.6,1253.0L943.1,1253.0M943.1,1253.0L943.6,1253.0M943.6,1253.0L944.1,1253.0M944.1,1253.0L944.6,1253.5M949.6,1253.0L950.1,1253.0M949.6,1253.0L949.1,1253.5M990.5,1253.0L991.0,1253.5M1090.5,1253.0L1091.0,1253.0M1090.5,1253.0L1090.0,1253.5M944.6,1253.5L945.1,1253.5M945.1,1253.5L945.6,1253.5M945.6,1253.5L946.1,1253.5M946.1,1253.5L946.6,1253.5M946.6,1253.5L947.1,1253.5M947.1,1253.5L947.6,1253.5M947.6,1253.5L948.1,1254.0M948.6,1253.5L949.1,1253.5M948.6,1253.5L948.1,1254.0M991.0,1253.5L991.5,1254.0M1089.5,1253.5L1090.0,1253.5M1089.5,1253.5L1089.0,1254.0M991.5,1254.0L992.0,1254.5M1088.5,1254.0L1089.0,1254.0M1088.5,1254.0L1088.0,1254.5M992.0,1254.5L992.5,1255.0M1086.5,1254.5L1087.0,1254.5M1086.5,1254.5L1086.0,1255.0M1087.0,1254.5L1087.5,1254.5M1087.5,1254.5L1088.0,1254.5M992.5,1255.0L993.0,1255.0M993.0,1255.0L993.5,1255.5M1085.0,1255.0L1085.5,1255.0M1085.0,1255.0L1084.5,1255.5M1085.5,1255.0L1086.0,1255.0M993.5,1255.5L994.0,1256.0M1083.5,1255.5L1084.0,1255.5M1083.5,1255.5L1083.0,1256.0M1084.0,1255.5L1084.5,1255.5M994.0,1256.0L994.5,1256.5M1082.5,1256.0L1083.0,1256.0M1082.5,1256.0L1082.0,1256.5M994.5,1256.5L995.0,1256.5M995.0,1256.5L995.5,1257.0M1080.5,1256.5L1081.0,1256.5M1080.5,1256.5L1080.0,1257.0M1081.0,1256.5L1081.5,1256.5M1081.5,1256.5L1082.0,1256.5M995.5,1257.0L996.0,1257.5M1079.0,1257.0L1079.5,1257.0M1079.0,1257.0L1078.5,1257.5M1079.5,1257.0L1080.0,1257.0M996.0,1257.5L996.5,1257.5M996.5,1257.5L997.0,1257.5M997.0,1257.5L997.5,1258.0M1077.5,1257.5L1078.0,1257.5M1077.5,1257.5L1077.0,1258.0M1078.0,1257.5L1078.5,1257.5M997.5,1258.0L998.0,1258.0M998.0,1258.0L998.5,1258.0M998.5,1258.0L999.0,1258.5M1075.5,1258.0L1076.0,1258.0M1075.5,1258.0L1075.0,1258.5M1076.0,1258.0L1076.5,1258.0M1076.5,1258.0L1077.0,1258.0M999.0,1258.5L999.5,1258.5M999.5,1258.5L1000.0,1259.0M1073.0,1258.5L1073.5,1258.5M1073.0,1258.5L1072.5,1259.0M1073.5,1258.5L1074.0,1258.5M1074.0,1258.5L1074.5,1258.5M1074.5,1258.5L1075.0,1258.5M1000.0,1259.0L1000.5,1259.0M1000.5,1259.0L1001.0,1259.0M1001.0,1259.0L1001.5,1259.5M1070.0,1259.0L1070.5,1259.0M1070.0,1259.0L1069.5,1259.5M1070.5,1259.0L1071.0,1259.0M1071.0,1259.0L1071.5,1259.0M1071.5,1259.0L1072.0,1259.0M1072.0,1259.0L1072.5,1259.0M1001.5,1259.5L1002.0,1259.5M1002.0,1259.5L1002.5,1259.5M1002.5,1259.5L1003.0,1260.0M1067.0,1259.5L1067.5,1259.5M1067.0,1259.5L1066.5,1260.0M1067.5,1259.5L1068.0,1259.5M1068.0,1259.5L1068.5,1259.5M1068.5,1259.5L1069.0,1259.5M1069.0,1259.5L1069.5,1259.5M1003.0,1260.0L1003.5,1260.0M1003.5,1260.0L1004.0,1260.0M1004.0,1260.0L1004.5,1260.5M1063.5,1260.0L1064.0,1260.0M1063.5,1260.0L1063.0,1260.5M1064.0,1260.0L1064.5,1260.0M1064.5,1260.0L1065.0,1260.0M1065.0,1260.0L1065.5,1260.0M1065.5,1260.0L1066.0,1260.0M1066.0,1260.0L1066.5,1260.0M1004.5,1260.5L1005.0,1260.5M1005.0,1260.5L1005.5,1260.5M1005.5,1260.5L1006.0,1261.0M1060.5,1260.5L1061.0,1260.5M1060.5,1260.5L1060.0,1261.0M1061.0,1260.5L1061.5,1260.5M1061.5,1260.5L1062.0,1260.5M1062.0,1260.5L1062.5,1260.5M1062.5,1260.5L1063.0,1260.5M1006.0,1261.0L1006.5,1261.0M1006.5,1261.0L1007.0,1261.5M1057.0,1261.0L1057.5,1261.0M1057.0,1261.0L1056.5,1261.5M1057.5,1261.0L1058.0,1261.0M1058.0,1261.0L1058.5,1261.0M1058.5,1261.0L1059.0,1261.0M1059.0,1261.0L1059.5,1261.0M1059.5,1261.0L1060.0,1261.0M1007.0,1261.5L1007.5,1261.5M1007.5,1261.5L1008.0,1261.5M1008.0,1261.5L1008.5,1262.0M1053.5,1261.5L1054.0,1261.5M1053.5,1261.5L1053.0,1262.0M1054.0,1261.5L1054.5,1261.5M1054.5,1261.5L1055.0,1261.5M1055.0,1261.5L1055.5,1261.5M1055.5,1261.5L1056.0,1261.5M1056.0,1261.5L1056.5,1261.5M1008.5,1262.0L1009.0,1262.0M1009.0,1262.0L1009.5,1262.5M1050.0,1262.0L1050.5,1262.0M1050.0,1262.0L1049.5,1262.5M1050.5,1262.0L1051.0,1262.0M1051.0,1262.0L1051.5,1262.0M1051.5,1262.0L1052.0,1262.0M1052.0,1262.0L1052.5,1262.0M1052.5,1262.0L1053.0,1262.0M1009.5,1262.5L1010.0,1262.5M1010.0,1262.5L1010.5,1262.5M1010.5,1262.5L1011.0,1263.0M1045.0,1262.5L1045.5,1262.5M1045.0,1262.5L1044.5,1263.0M1045.5,1262.5L1046.0,1262.5M1046.0,1262.5L1046.5,1262.5M1046.5,1262.5L1047.0,1262.5M1047.0,1262.5L1047.5,1262.5M1047.5,1262.5L1048.0,1262.5M1048.0,1262.5L1048.5,1262.5M1048.5,1262.5L1049.0,1262.5M1049.0,1262.5L1049.5,1262.5M1011.0,1263.0L1011.5,1263.0M1011.5,1263.0L1012.0,1263.0M1012.0,1263.0L1012.5,1263.5M1041.5,1263.0L1042.0,1263.0M1041.5,1263.0L1041.0,1263.5M1042.0,1263.0L1042.5,1263.0M1042.5,1263.0L1043.0,1263.0M1043.0,1263.0L1043.5,1263.0M1043.5,1263.0L1044.0,1263.0M1044.0,1263.0L1044.5,1263.0M1012.5,1263.5L1013.0,1263.5M1013.0,1263.5L1013.5,1264.0M1035.0,1263.5L1035.5,1263.5M1035.0,1263.5L1034.5,1264.0M1035.5,1263.5L1036.0,1263.5M1036.0,1263.5L1036.5,1263.5M1036.5,1263.5L1037.0,1263.5M1037.0,1263.5L1037.5,1263.5M1037.5,1263.5L1038.0,1263.5M1038.0,1263.5L1038.5,1263.5M1038.5,1263.5L1039.0,1263.5M1039.0,1263.5L1039.5,1263.5M1039.5,1263.5L1040.0,1263.5M1040.0,1263.5L1040.5,1263.5M1040.5,1263.5L1041.0,1263.5M1013.5,1264.0L1014.0,1264.0M1014.0,1264.0L1014.5,1264.5M1028.5,1264.0L1029.0,1264.0M1028.5,1264.0L1028.0,1264.5M1029.0,1264.0L1029.5,1264.0M1029.5,1264.0L1030.0,1264.0M1030.0,1264.0L1030.5,1264.0M1030.5,1264.0L1031.0,1264.0M1031.0,1264.0L1031.5,1264.0M1031.5,1264.0L1032.0,1264.0M1032.0,1264.0L1032.5,1264.0M1032.5,1264.0L1033.0,1264.0M1033.0,1264.0L1033.5,1264.0M1033.5,1264.0L1034.0,1264.0M1034.0,1264.0L1034.5,1264.0M1014.5,1264.5L1015.0,1264.5M1015.0,1264.5L1015.5,1264.5M1015.5,1264.5L1016.0,1265.0M1023.0,1264.5L1023.5,1264.5M1023.0,1264.5L1022.5,1265.0M1023.5,1264.5L1024.0,1264.5M1024.0,1264.5L1024.5,1264.5M1024.5,1264.5L1025.0,1264.5M1025.0,1264.5L1025.5,1264.5M1025.5,1264.5L1026.0,1264.5M1026.0,1264.5L1026.5,1264.5M1026.5,1264.5L1027.0,1264.5M1027.0,1264.5L1027.5,1264.5M1027.5,1264.5L1028.0,1264.5M1016.0,1265.0L1016.5,1265.0M1016.5,1265.0L1017.0,1265.0M1017.0,1265.0L1017.5,1265.0M1017.5,1265.0L1018.0,1265.0M1018.0,1265.0L1018.5,1265.0M1018.5,1265.0L1019.0,1265.0M1019.0,1265.0L1019.5,1265.0M1019.5,1265.0L1020.0,1265.0M1020.0,1265.0L1020.5,1265.0M1020.5,1265.0L1021.0,1265.0M1021.0,1265.0L1021.5,1265.0M1021.5,1265.0L1022.0,1265.0M1022.0,1265.0L1022.5,1265.0`,
      markers: [
        { x: 1263.1, y: 879.8, fromSvalka: 752.12, fromCement: 89.15 },
        { x: 1203.0, y: 930.1, fromSvalka: 615.51, fromCement: 93.51 },
        { x: 957.0, y: 932.2, fromSvalka: 363.50, fromCement: 419.25 },
        { x: 1253.4, y: 953.9, fromSvalka: 709.03, fromCement: 0.00 },
        { x: 1320.3, y: 964.0, fromSvalka: 765.70, fromCement: 100.02 },
        { x: 1076.0, y: 979.1, fromSvalka: 433.20, fromCement: 275.83 },
        { x: 1187.4, y: 993.9, fromSvalka: 552.15, fromCement: 174.53 },
        { x: 1203.2, y: 1004.5, fromSvalka: 576.64, fromCement: 199.02 },
        { x: 967.0, y: 1010.9, fromSvalka: 275.91, fromCement: 439.36 },
        { x: 1053.7, y: 1037.1, fromSvalka: 963.72, fromCement: 1661.38 },
        { x: 1110.6, y: 1110.5, fromSvalka: 792.84, fromCement: 1490.51 },
        { x: 1218.6, y: 1118.5, fromSvalka: 719.29, fromCement: 1416.95 },
        { x: 1255.4, y: 1180.1, fromSvalka: 571.59, fromCement: 1269.26 },
        { x: 869.4, y: 1195.9, fromSvalka: 0.00, fromCement: 709.03 },
        { x: 1122.5, y: 1232.6, fromSvalka: 366.57, fromCement: 1064.24 },
        { x: 916.7, y: 1252.0, fromSvalka: 115.43, fromCement: 813.10 }
      ],
      main: [],
      branch: []
    },
    rostok_redforest_yanov_jupiter_chemical: {
      key: 'rostok_redforest_yanov_jupiter_chemical',
      label: 'РОСТОК → РЫЖИЙ ЛЕС → ЯНОВ → ЮПИТЕР → ХИМЗАВОД',
      main: [
        { x: 660.0, y: 620.0 },
        { x: 760.0, y: 618.0 },
        { x: 880.0, y: 612.0 },
        { x: 980.0, y: 605.0 },
        { x: 1085.0, y: 595.0 },
        { x: 1078.0, y: 670.0 },
        { x: 1060.0, y: 730.0 },
        { x: 1035.0, y: 760.0 },
        { x: 1085.0, y: 790.0 },
        { x: 1160.0, y: 830.0 },
        { x: 1260.0, y: 880.0 },
        { x: 1350.0, y: 915.0 },
        { x: 1435.0, y: 920.0 },
        { x: 1420.0, y: 1010.0 },
        { x: 1405.0, y: 1075.0 },
        { x: 1380.0, y: 1120.0 },
        { x: 1320.0, y: 1140.0 },
        { x: 1260.0, y: 1170.0 },
        { x: 1220.0, y: 1190.0 },
        { x: 1185.0, y: 1210.0 },
        { x: 1145.0, y: 1270.0 },
        { x: 1110.0, y: 1330.0 },
        { x: 1070.0, y: 1380.0 },
        { x: 1030.0, y: 1320.0 },
        { x: 990.0, y: 1250.0 },
        { x: 950.0, y: 1190.0 },
        { x: 920.0, y: 1130.0 },
        { x: 900.0, y: 1080.0 },
        { x: 875.0, y: 1030.0 },
        { x: 850.0, y: 980.0 },
        { x: 860.0, y: 935.0 },
        { x: 875.0, y: 890.0 },
        { x: 890.0, y: 850.0 },
        { x: 810.0, y: 850.0 },
        { x: 730.0, y: 855.0 },
        { x: 640.0, y: 860.0 },
        { x: 640.0, y: 800.0 },
        { x: 645.0, y: 740.0 },
        { x: 650.0, y: 680.0 },
        { x: 660.0, y: 620.0 }
      ],
      branch: [
        { x: 660.0, y: 620.0 },
        { x: 660.0, y: 620.0 }
      ]
    }
  };

  function getPresetRoute(routeKey = mapSelectedRouteKey) {
    return (
      MAP_PRESET_ROUTES[routeKey] ||
      MAP_PRESET_ROUTES.garbage_cement_cooling
    );
  }

  function getPresetRouteNodes(route) {
    const safeRoute = route || getPresetRoute();
    const branch = (safeRoute.branch || []).slice(1).filter((point, idx) => {
      if (idx !== 0) return true;
      const lastMain = safeRoute.main[safeRoute.main.length - 1];
      return !(point.x === lastMain.x && point.y === lastMain.y);
    });
    return [...safeRoute.main, ...branch];
  }


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
  let mapTransformFrame = 0;
  let mapInteractionEndTimer = 0;
  let mapInteractionDepth = 0;
  let mapPresetRouteVisible =
    localStorage.getItem(MAP_PRESET_ROUTE_STORAGE_KEY) !== '0';
  let mapSelectedRouteKey =
    localStorage.getItem(MAP_PRESET_ROUTE_SELECTED_KEY) || 'garbage_cement_cooling';
  const MAP_PRESET_ROUTE_START_KEY =
    'stalker2-zone-clock-preset-route-start-v1';
  let mapPresetRouteStart =
    localStorage.getItem(MAP_PRESET_ROUTE_START_KEY) || 'svalka';

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


  function routePointToScreen(point) {
    return {
      x: mapPanX + point.x * mapZoom,
      y: mapPanY + point.y * mapZoom
    };
  }

  function updatePresetRouteUI() {
    const activeRoute = getPresetRoute();

    if (els.mapPresetRouteBtn) {
      els.mapPresetRouteBtn.textContent =
        mapPresetRouteVisible ? 'МАРШРУТ: ВКЛ' : 'МАРШРУТ: ВЫКЛ';
      els.mapPresetRouteBtn.classList.toggle('active', mapPresetRouteVisible);
    }

    if (els.mapRouteSelect) {
      els.mapRouteSelect.value = activeRoute.key;
    }

    if (els.mapRouteStartWrap) {
      els.mapRouteStartWrap.hidden =
        activeRoute.key !== 'garbage_cement_cooling';
    }

    if (els.mapRouteStartSelect) {
      els.mapRouteStartSelect.value = mapPresetRouteStart;
    }

    if (els.mapPresetRouteLabel) {
      els.mapPresetRouteLabel.hidden = !mapPresetRouteVisible;
      els.mapPresetRouteLabel.textContent = activeRoute.label;
    }
  }

  function updatePresetRouteScreenGeometry() {
    if (
      !els.mapPresetRouteMain ||
      !els.mapPresetRouteBranch ||
      !els.mapPresetRoutePoints
    ) return;

    const activeRoute = getPresetRoute();
    const isRoadRoute = Boolean(activeRoute.roadPath);

    if (els.mapPresetRouteLayer) {
      els.mapPresetRouteLayer.style.display =
        mapPresetRouteVisible ? '' : 'none';
    }

    if (els.mapRoadRoutePath) {
      els.mapRoadRoutePath.style.display =
        mapPresetRouteVisible && isRoadRoute ? '' : 'none';

      if (isRoadRoute) {
        els.mapRoadRoutePath.setAttribute('d', activeRoute.roadPath);
      }
    }

    if (!mapPresetRouteVisible) return;

    if (isRoadRoute) {
      els.mapPresetRouteMain.setAttribute('points', '');
      els.mapPresetRouteBranch.setAttribute('points', '');
    } else {
      const mainScreen = activeRoute.main.map(routePointToScreen);
      const branchScreen = activeRoute.branch.map(routePointToScreen);

      els.mapPresetRouteMain.setAttribute(
        'points',
        mainScreen.map(point => `${point.x},${point.y}`).join(' ')
      );

      els.mapPresetRouteBranch.setAttribute(
        'points',
        branchScreen.map(point => `${point.x},${point.y}`).join(' ')
      );
    }

    const markerDefs = isRoadRoute
      ? activeRoute.markers
      : getPresetRouteNodes(activeRoute);

    const circles = els.mapPresetRoutePoints.querySelectorAll(
      '.map-preset-route-point'
    );

    const labels = els.mapPresetRoutePoints.querySelectorAll(
      '.map-preset-route-distance'
    );

    markerDefs.forEach((point, index) => {
      const screen = routePointToScreen(point);
      const circle = circles[index];

      if (circle) {
        circle.setAttribute('cx', screen.x);
        circle.setAttribute('cy', screen.y);
      }

      const label = labels[index];

      if (label) {
        label.setAttribute('x', screen.x + 8);
        label.setAttribute('y', screen.y - 8);

        if (isRoadRoute) {
          const logicalDistance =
            mapPresetRouteStart === 'cement'
              ? point.fromCement
              : point.fromSvalka;

          label.textContent = formatMapDistance(
            logicalDistance * mapMetersPerPixel
          );
        }
      }
    });
  }

  function renderPresetRoute() {
    if (!els.mapPresetRoutePoints) return;

    const activeRoute = getPresetRoute();
    const isRoadRoute = Boolean(activeRoute.roadPath);
    const markerDefs = isRoadRoute
      ? activeRoute.markers
      : getPresetRouteNodes(activeRoute);

    els.mapPresetRoutePoints.innerHTML = '';

    markerDefs.forEach(() => {
      const circle = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'circle'
      );

      circle.setAttribute('r', isRoadRoute ? '5.2' : '4.5');
      circle.setAttribute('class', 'map-preset-route-point');
      els.mapPresetRoutePoints.appendChild(circle);

      if (isRoadRoute) {
        const text = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'text'
        );

        text.setAttribute(
          'class',
          'map-preset-route-distance'
        );

        text.setAttribute('font-size', '10.5');
        els.mapPresetRoutePoints.appendChild(text);
      }
    });

    updatePresetRouteUI();
    updatePresetRouteScreenGeometry();
  }

  function togglePresetRoute() {
    mapPresetRouteVisible = !mapPresetRouteVisible;

    localStorage.setItem(
      MAP_PRESET_ROUTE_STORAGE_KEY,
      mapPresetRouteVisible ? '1' : '0'
    );

    updatePresetRouteUI();
    updatePresetRouteScreenGeometry();
  }

  function changePresetRoute(routeKey) {
    if (!MAP_PRESET_ROUTES[routeKey]) return;
    mapSelectedRouteKey = routeKey;
    localStorage.setItem(MAP_PRESET_ROUTE_SELECTED_KEY, mapSelectedRouteKey);
    renderPresetRoute();
  }

  function updateMapMeasurementScreenGeometry() {
    if (!els.mapMeasureLine || !els.mapMeasurePoints) return;

    const screenPoints = mapMeasurePoints.map(point => ({
      x: mapPanX + point.x * mapZoom,
      y: mapPanY + point.y * mapZoom
    }));

    els.mapMeasureLine.setAttribute(
      'points',
      screenPoints.map(point => `${point.x},${point.y}`).join(' ')
    );

    const circles = els.mapMeasurePoints.querySelectorAll('.map-measure-point');
    const labels = els.mapMeasurePoints.querySelectorAll('.map-measure-point-label');

    screenPoints.forEach((point, index) => {
      const circle = circles[index];
      if (circle) {
        circle.setAttribute('cx', point.x);
        circle.setAttribute('cy', point.y);
      }

      const label = labels[index];
      if (label) {
        label.setAttribute('x', point.x + 11);
        label.setAttribute('y', point.y - 10);
      }
    });

    updatePresetRouteScreenGeometry();
  }

  function renderMapMeasurement() {
    if (!els.mapMeasureLine || !els.mapMeasurePoints) return;

    if (
      els.mapPresetRoutePoints &&
      !els.mapPresetRoutePoints.childElementCount
    ) {
      renderPresetRoute();
    }

    els.mapMeasurePoints.innerHTML = '';

    mapMeasurePoints.forEach((point, index) => {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('r', '6.5');
      circle.setAttribute('class', 'map-measure-point');
      els.mapMeasurePoints.appendChild(circle);

      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('class', 'map-measure-point-label');
      text.setAttribute('font-size', '13');
      text.textContent = String(index + 1);
      els.mapMeasurePoints.appendChild(text);
    });

    updateMapMeasurementScreenGeometry();
    updateMapInfo();
  }


  function ensureHdZoneMap() {
    // v63: используется одна цельная карта 8192×8192.
  }

  function maybeLoadHdZoneMap() {
    // Дополнительные HD-слои и тайлы не используются.
  }





  function applyMapTransform(renderMeasurement = false) {
    if (!els.zoneMapTransform) return;

    if (!mapTransformFrame) {
      mapTransformFrame = window.requestAnimationFrame(() => {
        mapTransformFrame = 0;

        els.zoneMapTransform.style.transform =
          `translate3d(${mapPanX}px, ${mapPanY}px, 0) scale(${mapZoom})`;

        maybeLoadHdZoneMap();

        if (renderMeasurement) {
          renderMapMeasurement();
        } else {
          updateMapMeasurementScreenGeometry();
        }
      });
    }
  }

  function beginMapInteraction() {
    mapInteractionDepth += 1;

    if (mapInteractionEndTimer) {
      window.clearTimeout(mapInteractionEndTimer);
      mapInteractionEndTimer = 0;
    }

    if (els.mapViewport) {
      els.mapViewport.classList.add('map-interacting');
    }
  }

  function endMapInteraction() {
    mapInteractionDepth = Math.max(0, mapInteractionDepth - 1);

    if (mapInteractionDepth > 0) return;

    if (mapInteractionEndTimer) {
      window.clearTimeout(mapInteractionEndTimer);
    }

    mapInteractionEndTimer = window.setTimeout(() => {
      if (els.mapViewport) {
        els.mapViewport.classList.remove('map-interacting');
      }
      renderMapMeasurement();
      mapInteractionEndTimer = 0;
    }, 80);
  }

  function fitZoneMap() {
    if (!els.mapViewport) return;

    const rect = els.mapViewport.getBoundingClientRect();
    if (!(rect.width > 20 && rect.height > 20)) return;

    if (els.mapOverlay) {
      els.mapOverlay.setAttribute('width', String(rect.width));
      els.mapOverlay.setAttribute('height', String(rect.height));
    }

    mapFitZoom = Math.min(
      rect.width / MAP_IMAGE_SIZE,
      rect.height / MAP_IMAGE_SIZE
    );

    mapZoom = mapFitZoom;
    mapPanX = (rect.width - MAP_IMAGE_SIZE * mapZoom) / 2;
    mapPanY = (rect.height - MAP_IMAGE_SIZE * mapZoom) / 2;

    applyMapTransform(true);
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

    applyMapTransform(true);
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

    applyMapTransform(false);
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

  if (els.mapPresetRouteBtn) {
    els.mapPresetRouteBtn.addEventListener('click', togglePresetRoute);
  }

  if (els.mapRouteSelect) {
    els.mapRouteSelect.addEventListener('change', (event) => {
      changePresetRoute(event.target.value);
    });
  }

  if (els.mapRouteStartSelect) {
    els.mapRouteStartSelect.addEventListener('change', (event) => {
      const value = event.target.value;

      if (!['svalka', 'cement'].includes(value)) return;

      mapPresetRouteStart = value;

      localStorage.setItem(
        MAP_PRESET_ROUTE_START_KEY,
        mapPresetRouteStart
      );

      updatePresetRouteUI();
      updatePresetRouteScreenGeometry();
    });
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

      if (!els.mapViewport.classList.contains('map-interacting')) {
        beginMapInteraction();
      }

      zoomZoneMap(
        event.deltaY < 0 ? 1.18 : 1 / 1.18,
        event.clientX,
        event.clientY
      );

      if (mapInteractionEndTimer) {
        window.clearTimeout(mapInteractionEndTimer);
      }

      mapInteractionEndTimer = window.setTimeout(() => {
        mapInteractionDepth = 1;
        endMapInteraction();
      }, 140);
    }, { passive: false });

    els.mapViewport.addEventListener('pointerdown', event => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;

      beginMapInteraction();

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
        applyMapTransform(false);
      }

      mapPointerState.lastX = event.clientX;
      mapPointerState.lastY = event.clientY;
    });

    els.mapViewport.addEventListener('pointerup', event => {
      endMapInteraction();

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
      endMapInteraction();
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
      updatePresetRouteScreenGeometry();
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
    link.download = 'zone-clock-test-v72.csv';
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
