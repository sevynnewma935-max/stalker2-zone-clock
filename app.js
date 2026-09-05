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
  const MOVEMENT_TEST_STORAGE_KEY = 'stalker2-zone-clock-movement-test-v1';
  const MOVEMENT_TEST_ACTIVE_KEY = 'stalker2-zone-clock-movement-test-active-v1';
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
    mapFullscreenBtn: $('mapFullscreenBtn'),
    mapViewport: $('mapViewport'), zoneMapTransform: $('zoneMapTransform'),
    zoneMapPreviewImage: $('zoneMapPreviewImage'),
    zoneMapImage: $('zoneMapImage'), mapOverlay: $('mapOverlay'),
    mapMeasureLine: $('mapMeasureLine'), mapMeasurePoints: $('mapMeasurePoints'),
    mapMeasureBtn: $('mapMeasureBtn'), mapUndoBtn: $('mapUndoBtn'),
    mapClearBtn: $('mapClearBtn'), mapZoomOutBtn: $('mapZoomOutBtn'),
    mapZoomInBtn: $('mapZoomInBtn'), mapFitBtn: $('mapFitBtn'),
    mapPresetRouteBtn: $('mapPresetRouteBtn'),
    mapRouteSelect: $('mapRouteSelect'),
    mapJourneyBtn: $('mapJourneyBtn'),
    mapRouteStartWrap: $('mapRouteStartWrap'),
    mapRouteStartSelect: $('mapRouteStartSelect'),
    mapRouteSelectValue: $('mapRouteSelectValue'),
    mapRouteStartValue: $('mapRouteStartValue'),
    mapRoadRoutePath: $('mapRoadRoutePath'),
    mapPresetRoadPath: $('mapPresetRoadPath'),
    mapPresetRouteLabel: $('mapPresetRouteLabel'),
    mapPresetRouteLayer: $('mapPresetRouteLayer'),
    mapPresetRouteMain: $('mapPresetRouteMain'),
    mapPresetRouteBranch: $('mapPresetRouteBranch'),
    mapPresetRoutePoints: $('mapPresetRoutePoints'),
    mapArtifactVisitPoints: $('mapArtifactVisitPoints'),
    mapArtifactVisitHint: $('mapArtifactVisitHint'),
    mapZoneTime: $('mapZoneTime'),
    mapJourneyHud: $('mapJourneyHud'),
    mapJourneyHudDistance: $('mapJourneyHudDistance'),
    mapJourneyHudTime: $('mapJourneyHudTime'),
    mapDistance: $('mapDistance'), mapPointCount: $('mapPointCount'),
mapMeasureHint: $('mapMeasureHint'),
    mapKnownDistanceKm: $('mapKnownDistanceKm'),
    mapApplyCalibrationBtn: $('mapApplyCalibrationBtn'),
    mapResetCalibrationBtn: $('mapResetCalibrationBtn'),
    mapCalibrationMessage: $('mapCalibrationMessage'),
    mapJourneyDialog: $('mapJourneyDialog'),
    closeJourneyBtn: $('closeJourneyBtn'),
    startJourneyBtn: $('startJourneyBtn'),
    mapJourneyWish: $('mapJourneyWish'),
    mapJourneyRouteName: $('mapJourneyRouteName'),
    mapJourneyDistance: $('mapJourneyDistance'),
    mapJourneyTime: $('mapJourneyTime'),
    mapJourneyEmission: $('mapJourneyEmission'),
    mapJourneyNight: $('mapJourneyNight'),
    openChronometryBtn: $('openChronometryBtn'),
    chronometryDialog: $('chronometryDialog'),
    closeChronometryBtn: $('closeChronometryBtn'),
    chronometryChart: $('chronometryChart'),
    chronometrySummary: $('chronometrySummary'),
    settingsTestBtn: $('settingsTestBtn'), closeTestBtn: $('closeTestBtn'), testDialog: $('testDialog'),
    testCurrentTime: $('testCurrentTime'), testTableBody: $('testTableBody'),
    dayCalibrationDetails: $('dayCalibrationDetails'),
    daylightMarksList: $('daylightMarksList'),
    exportTestBtn: $('exportTestBtn'), clearTestBtn: $('clearTestBtn'),
    movementTestDistance: $('movementTestDistance'),
    movementTestStatus: $('movementTestStatus'),
    showMovementTestRouteBtn: $('showMovementTestRouteBtn'),
    mapMovementTestLayer: $('mapMovementTestLayer'),
    mapMovementTestLine: $('mapMovementTestLine'),
    mapMovementTestStart: $('mapMovementTestStart'),
    mapMovementTestEnd: $('mapMovementTestEnd'),
    mapMovementTestStartLabel: $('mapMovementTestStartLabel'),
    mapMovementTestEndLabel: $('mapMovementTestEndLabel'),
    mapMovementTestDistanceLabel: $('mapMovementTestDistanceLabel'),
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
    updateMapZoneTime();
    updateArtifactVisitStatuses();
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

  // Контрольный тестовый отрезок для замера скорости перемещения.
  // Логические координаты карты Zone Clock 2048 × 2048.
  const MOVEMENT_TEST_START = {
    x: 1262.0,
    y: 934.5,
    label: 'Мост у Цементного завода'
  };

  const MOVEMENT_TEST_END = {
    x: 785.0,
    y: 948.5,
    label: 'SWYD-East Checkpoint, Железный лес'
  };

  const MOVEMENT_TEST_MODES = {
    slow: 'МЕДЛЕННЫЙ ШАГ',
    fast: 'БЫСТРЫЙ ШАГ',
    run: 'БЕГ'
  };

  const MAP_PRESET_ROUTE_STORAGE_KEY =
    'stalker2-zone-clock-preset-route-visible-v2';
  const MAP_PRESET_ROUTE_SELECTED_KEY =
    'stalker2-zone-clock-preset-route-selected-v2';

  const MAP_PRESET_ROUTES = {
    garbage_cement_cooling: {
      key: 'garbage_cement_cooling',
      label: 'СВАЛКА → ЦЕМЕНТНЫЙ ЗАВОД → ГРАДИРНИ',
      roadPath: `M1263.0,879.5L1266.0,886.0M1266.0,886.0L1266.0,886.5M1266.0,886.0L1265.5,886.5M1266.0,886.0L1266.5,886.5M1265.5,886.5L1266.0,886.5M1265.5,886.5L1264.0,887.5M1266.0,886.5L1266.5,886.5M1266.5,886.5L1267.0,888.0M1267.0,888.0L1267.0,888.5M1267.0,888.0L1267.5,888.5M1270.0,887.5L1267.5,888.5M1267.0,888.5L1267.5,888.5M1267.0,888.5L1267.0,889.0M1267.5,888.5L1267.0,889.0M1267.0,889.0L1266.7,889.8L1266.1,891.3L1265.1,893.7L1263.9,896.8L1263.1,899.8L1262.8,902.7L1262.9,905.4L1263.6,908.1L1264.3,910.2L1265.3,911.9L1266.4,913.1L1267.6,913.9L1268.6,914.4L1269.2,914.8L1269.5,915.0M1269.5,915.0L1269.5,915.5M1269.5,915.0L1270.0,915.0M1271.0,914.5L1270.0,915.0M1270.0,915.0L1269.5,915.5M1269.5,915.5L1262.0,934.5M957.0,932.0L957.9,932.9L959.8,934.7L962.6,937.4L966.4,941.1L969.5,944.6L972.0,948.0L973.9,951.4L975.1,954.6L976.1,957.1L976.7,958.7L977.0,959.5M1262.0,934.5L1259.7,933.5L1255.1,931.6L1248.1,928.7L1238.9,924.8L1231.3,922.5L1225.5,921.7L1221.4,922.4L1219.1,924.6L1216.6,926.4L1213.9,927.7L1211.2,928.6L1208.3,928.9L1206.2,930.6L1204.8,933.5L1204.2,937.8L1204.3,943.2L1202.9,949.6L1200.0,956.8L1195.5,964.8L1189.5,973.7L1184.9,980.6L1181.8,985.6L1180.1,988.7L1179.9,989.8L1179.7,990.7L1179.6,991.2L1179.5,991.5M1262.0,934.5L1262.0,935.5M1262.0,935.5L1262.0,936.0M1262.0,935.5L1262.5,936.0M1262.0,936.0L1253.5,954.0M1262.0,936.0L1262.5,936.0M1262.5,936.0L1271.0,937.5M1272.0,937.5L1272.1,937.4L1272.4,937.1L1272.8,936.8L1273.2,936.2L1273.8,935.9L1274.4,935.7L1275.1,935.7L1275.9,935.8L1279.2,937.2L1285.2,939.7L1293.7,943.5L1304.8,948.5L1313.1,952.8L1318.4,956.2L1320.9,959.0L1320.6,961.0L1320.3,962.5L1320.1,963.5L1320.0,964.0M1272.0,937.5L1271.5,937.5M1272.0,937.5L1271.5,938.0M1271.0,937.5L1271.5,937.5M1271.0,937.5L1271.5,938.0M1271.5,937.5L1271.5,938.0M1271.5,938.0L1272.0,938.5M977.0,959.5L977.0,960.0M977.0,959.5L977.5,960.0M977.0,960.0L977.0,960.5M977.0,960.0L977.5,960.0M977.5,960.0L977.0,960.5M977.5,960.0L1019.0,969.5M977.0,960.5L977.0,962.5L977.1,966.5L977.2,972.5L977.3,980.5L976.9,987.6L976.0,993.7L974.5,998.9L972.5,1003.1L971.0,1006.3L970.0,1008.4L969.5,1009.5M1019.5,967.5L1019.5,969.0M1019.5,969.0L1019.0,969.5M1019.5,969.0L1019.5,969.5M1019.0,969.5L1019.5,969.5M1019.5,969.5L1036.0,973.5M1036.0,973.5L1036.5,973.5M1036.0,973.5L1036.5,974.0M1036.5,973.5L1037.0,973.5M1036.5,973.5L1036.5,974.0M1036.5,974.0L1037.0,973.5M1036.5,974.0L1036.5,975.0M1037.0,973.5L1039.1,973.8L1043.2,974.4L1049.4,975.4L1057.6,976.6L1064.9,977.6L1071.1,978.3L1076.4,978.7L1080.6,978.8L1084.6,979.4L1088.4,980.4L1091.9,981.8L1095.1,983.7L1098.8,985.2L1102.8,986.2L1107.1,986.9L1111.9,987.1L1116.8,987.6L1121.9,988.4L1127.2,989.4L1132.8,990.6L1139.2,991.5L1146.8,992.1L1155.2,992.3L1164.8,992.2L1171.9,992.1L1176.6,992.0L1179.0,992.0M1179.5,991.5L1179.0,992.0M1179.5,991.5L1179.5,992.0M1179.5,991.5L1180.0,992.0M1179.0,992.0L1179.5,992.0M1179.5,992.0L1180.0,992.0M1180.0,992.0L1188.0,994.0M1188.5,993.5L1188.0,994.0M1188.5,993.5L1189.1,993.4L1190.2,993.3L1191.9,993.1L1194.1,992.9L1195.9,992.9L1197.3,993.3L1198.2,994.0L1198.8,995.0L1199.1,995.8L1199.4,996.2L1199.5,996.5M1188.5,993.5L1188.5,994.0M1188.0,994.0L1188.5,994.0M1188.5,994.0L1188.6,994.1L1188.8,994.4L1189.1,994.8L1189.4,995.2L1190.3,995.7L1191.7,996.0L1193.6,996.2L1195.9,996.3L1197.7,996.4L1198.9,996.5L1199.5,996.5M1199.5,996.5L1203.5,999.5M1203.5,999.5L1203.5,1000.0M1203.5,999.5L1204.0,1000.0M1203.5,1000.0L1203.5,1000.5M1203.5,1000.0L1204.0,1000.0M1204.0,1000.0L1206.5,1000.0M1204.0,1000.0L1203.5,1000.5M1203.5,1000.5L1203.5,1003.5M1203.5,1003.5L1204.0,1004.0M1203.5,1003.5L1203.5,1004.0M1207.0,1003.0L1204.0,1004.0M1203.5,1004.0L1204.0,1004.0M1203.5,1004.0L1202.0,1005.0M969.5,1009.5L966.5,1011.0M969.5,1009.5L969.8,1009.6L970.2,1009.7L971.0,1009.9L972.0,1010.1L972.8,1011.2L973.3,1013.2L973.7,1016.1L973.8,1019.9L973.9,1022.7L974.0,1024.6L974.0,1025.5M974.0,1025.5L974.5,1026.0M974.0,1025.5L974.0,1026.0M974.0,1026.0L974.5,1026.0M974.0,1026.0L974.0,1026.5M974.5,1026.0L976.5,1026.0M974.5,1026.0L974.0,1026.5M974.0,1026.5L973.0,1032.0L971.0,1042.9L968.0,1059.3L964.1,1081.2L961.0,1097.9L958.7,1109.6L957.4,1116.1L956.9,1117.4L955.5,1119.4L953.2,1122.1L950.1,1125.3L946.1,1129.2L943.4,1133.0L942.0,1136.8L942.0,1140.6L943.2,1144.4L944.2,1147.2L944.8,1149.1L945.1,1150.0M1054.5,1035.5L1054.4,1035.7L1054.2,1036.0L1053.9,1036.4L1053.6,1037.1L1053.1,1037.5L1052.6,1037.8L1052.1,1038.0L1051.4,1038.0L1051.0,1038.0L1050.7,1038.0L1050.5,1038.0M1048.5,1037.5L1050.5,1038.0M1050.5,1038.0L1050.4,1038.4L1050.1,1039.1L1049.8,1040.2L1049.2,1041.8L1049.0,1043.2L1048.9,1044.7L1049.1,1046.1L1049.4,1047.4L1049.7,1048.5L1049.9,1049.2L1050.0,1049.5M1051.5,1047.5L1050.5,1049.0M1050.5,1049.0L1050.0,1049.5M1050.5,1049.0L1050.5,1049.5M1050.0,1049.5L1050.5,1050.0M1050.0,1049.5L1050.5,1049.5M1050.5,1049.5L1050.5,1050.0M1050.5,1050.0L1050.5,1050.5M1050.5,1050.0L1051.0,1050.5M1050.5,1050.5L1050.5,1051.0M1050.5,1050.5L1051.0,1050.5M1051.0,1050.5L1050.5,1051.0M1051.0,1050.5L1059.5,1056.0M1050.5,1051.0L1050.5,1054.0M1059.5,1056.0L1060.0,1056.5M1059.5,1056.0L1059.5,1056.5M1059.5,1056.5L1060.0,1056.5M1059.5,1056.5L1058.5,1059.0M1060.0,1056.5L1060.3,1056.8L1061.0,1057.5L1062.1,1058.6L1063.4,1059.9L1065.5,1061.1L1068.2,1062.1L1071.5,1062.9L1075.5,1063.6L1080.8,1063.6L1087.4,1063.0L1095.4,1061.9L1104.6,1060.1L1112.1,1060.0L1117.9,1061.4L1121.9,1064.4L1124.1,1069.1L1126.0,1073.2L1127.5,1076.8L1128.6,1079.9L1129.4,1082.6L1129.9,1085.6L1130.1,1089.1L1130.1,1093.1L1129.9,1097.4L1128.8,1100.7L1127.0,1102.9L1124.4,1104.0L1121.1,1104.0L1118.1,1104.5L1115.6,1105.4L1113.6,1106.8L1111.9,1108.7L1110.7,1110.3L1109.9,1111.8L1109.5,1113.0L1109.5,1114.0L1109.5,1114.8L1109.5,1115.2L1109.5,1115.5M1206.0,1100.5L1206.0,1101.0M1206.0,1100.5L1206.1,1100.3L1206.3,1099.8L1206.6,1099.2L1206.9,1098.3L1207.4,1097.6L1208.1,1097.0L1208.8,1096.6L1209.7,1096.4L1210.7,1096.8L1211.9,1097.8L1213.2,1099.6L1214.8,1101.9L1215.9,1103.7L1216.6,1104.9L1217.0,1105.5M1206.0,1100.5L1205.5,1101.0M1205.5,1101.0L1195.5,1109.0M1205.5,1101.0L1206.0,1101.0M1206.0,1101.0L1216.5,1106.0M1217.0,1105.5L1216.5,1106.0M1217.0,1105.5L1217.0,1106.0M1216.5,1106.0L1217.0,1106.0M1216.5,1106.0L1217.0,1106.5M1217.0,1106.0L1217.0,1106.5M1217.0,1106.5L1217.2,1106.9L1217.8,1107.6L1218.5,1108.8L1219.5,1110.2L1220.1,1111.8L1220.3,1113.2L1220.1,1114.8L1219.4,1116.2L1219.0,1117.4L1218.7,1118.1L1218.5,1118.5M1195.5,1109.0L1195.0,1109.0M1195.5,1109.0L1195.5,1109.5M1195.0,1109.0L1194.2,1109.6L1192.8,1110.8L1190.5,1112.6L1187.5,1114.9L1184.2,1117.2L1180.5,1119.4L1176.4,1121.5L1172.1,1123.5L1167.9,1125.2L1163.9,1126.7L1160.1,1127.8L1156.4,1128.7L1152.5,1129.4L1148.2,1130.0L1143.5,1130.4L1138.5,1130.6L1134.8,1130.8L1132.2,1130.9L1131.0,1131.0M1195.0,1109.0L1195.5,1109.5M1195.5,1109.5L1195.9,1110.1L1196.6,1111.4L1197.8,1113.2L1199.2,1115.8L1200.6,1119.0L1201.8,1122.9L1202.8,1127.6L1203.7,1132.9L1204.8,1137.8L1206.2,1142.3L1207.8,1146.2L1209.7,1149.8L1211.7,1152.9L1213.7,1155.8L1215.9,1158.4L1218.1,1160.6L1221.8,1163.2L1227.0,1166.2L1233.7,1169.6L1241.8,1173.4L1248.0,1176.3L1252.2,1178.3L1254.6,1179.6L1254.9,1179.9L1255.2,1180.6L1255.3,1181.6L1255.3,1182.9L1255.2,1184.6L1254.8,1185.8L1254.1,1186.8L1253.1,1187.4L1251.9,1187.6L1250.6,1188.3L1249.2,1189.3L1247.8,1190.8L1246.2,1192.7L1244.9,1194.1L1243.8,1195.0L1242.9,1195.5L1242.1,1195.5L1240.5,1194.7L1238.0,1193.1L1234.6,1190.6L1230.4,1187.4L1226.5,1184.6L1223.0,1182.2L1219.9,1180.2L1217.1,1178.8L1214.4,1177.1L1211.8,1175.2L1209.2,1173.1L1206.8,1170.9L1203.2,1169.4L1198.7,1168.6L1193.1,1168.6L1186.4,1169.4L1178.7,1169.8L1169.8,1169.9L1159.8,1169.8L1148.7,1169.2L1140.3,1168.9L1134.8,1168.6L1132.0,1168.5M1109.5,1115.5L1110.0,1116.0M1109.5,1115.5L1109.0,1116.0M1109.5,1115.5L1109.5,1116.0M1109.0,1116.0L1108.0,1116.0M1109.0,1116.0L1109.5,1116.0M1109.5,1116.0L1110.0,1116.0M1110.0,1116.0L1111.1,1116.0L1113.2,1116.0L1116.4,1116.0L1120.6,1116.0L1124.0,1116.2L1126.4,1116.5L1127.9,1116.9L1128.6,1117.6L1129.0,1118.8L1129.2,1120.5L1129.3,1122.8L1129.2,1125.7L1129.2,1127.9L1129.3,1129.5L1129.6,1130.4L1129.9,1130.6L1130.2,1130.8L1130.4,1130.9L1130.5,1131.0M1131.0,1131.0L1130.5,1131.0M1131.0,1131.0L1131.0,1131.5M1130.5,1131.0L1131.0,1131.5M1131.0,1131.5L1131.0,1133.5M945.1,1150.0L945.6,1150.0M945.1,1150.0L945.1,1150.5M945.6,1150.0L945.1,1150.5M945.6,1150.0L947.6,1150.0M945.1,1150.5L945.6,1157.5M945.6,1157.5L945.6,1158.0M945.6,1157.5L946.1,1158.0M945.6,1158.0L945.6,1158.5M945.6,1158.0L946.1,1158.0M946.1,1158.0L947.1,1158.0M946.1,1158.0L945.6,1158.5M945.6,1158.5L945.1,1159.0M950.6,1158.0L945.6,1160.0M945.1,1159.0L944.6,1159.5M945.1,1159.0L945.1,1159.5M944.6,1159.5L943.6,1159.5M944.6,1159.5L945.1,1159.5M944.6,1159.5L945.1,1160.0M945.1,1159.5L945.1,1160.0M945.1,1159.5L945.6,1160.0M945.1,1160.0L945.1,1160.5M945.1,1160.0L945.6,1160.0M945.6,1160.0L945.1,1160.5M945.1,1160.5L944.6,1163.0M943.6,1162.5L944.1,1163.0M944.1,1163.0L944.6,1163.0M944.1,1163.0L944.1,1163.5M944.6,1163.0L944.1,1163.5M944.1,1163.5L944.1,1165.5M944.1,1165.5L943.9,1165.9L943.5,1166.8L943.0,1168.1L942.2,1169.9L940.4,1172.3L937.5,1175.3L933.6,1179.1L928.6,1183.4L924.5,1186.6L921.4,1188.6L919.2,1189.4L918.0,1189.1L916.7,1188.4L915.3,1187.6L913.9,1186.4L912.4,1185.1L910.0,1184.0L906.9,1183.3L903.0,1183.0L898.2,1183.0L894.7,1183.0L892.3,1183.0L891.1,1183.0M944.1,1165.5L945.6,1166.5M945.6,1166.5L946.1,1166.5M945.6,1166.5L946.1,1167.0M946.1,1166.5L946.1,1167.0M946.1,1166.5L946.6,1166.5M946.1,1167.0L946.1,1167.5M946.1,1167.0L946.6,1166.5M946.6,1166.5L947.1,1166.5M1131.5,1167.0L1131.5,1168.0M1131.5,1168.0L1131.5,1168.5M1131.5,1168.0L1132.0,1168.5M1131.5,1168.5L1129.0,1180.0M1131.5,1168.5L1132.0,1168.5M1129.0,1180.0L1129.0,1180.5M1129.0,1180.0L1129.5,1180.5M1129.0,1180.5L1129.0,1181.0M1129.0,1180.5L1129.5,1180.5M1129.5,1180.5L1129.0,1181.0M1129.5,1180.5L1132.0,1180.5M1129.0,1181.0L1129.0,1181.4L1129.1,1182.1L1129.2,1183.2L1129.3,1184.8L1129.2,1186.4L1129.0,1188.2L1128.6,1190.2L1127.9,1192.3L1126.6,1195.1L1124.4,1198.5L1121.6,1202.6L1117.9,1207.4L1114.9,1211.7L1112.5,1215.5L1110.6,1218.8L1109.4,1221.7L1108.5,1224.0L1107.9,1225.8L1107.7,1227.1L1107.8,1227.9L1107.9,1228.4L1108.0,1228.8L1108.0,1229.0M890.6,1181.5L890.6,1182.5M890.6,1182.5L890.1,1183.0M890.6,1182.5L890.6,1183.0M890.6,1182.5L891.1,1183.0M885.1,1182.5L885.1,1183.0M885.1,1183.0L884.6,1183.5M885.1,1183.0L885.6,1183.5M885.1,1183.0L885.1,1183.5M890.1,1183.0L885.6,1183.5M890.1,1183.0L890.6,1183.0M890.6,1183.0L891.1,1183.0M884.6,1183.5L876.1,1192.0M884.6,1183.5L885.1,1183.5M885.1,1183.5L885.6,1183.5M876.1,1192.0L876.1,1192.5M876.1,1192.0L875.6,1192.5M875.6,1192.5L876.1,1192.5M875.6,1192.5L873.1,1194.5M876.1,1192.5L876.6,1195.5M873.1,1194.5L873.1,1195.0M873.1,1194.5L872.6,1195.0M872.6,1195.0L869.1,1195.5M872.6,1195.0L873.1,1195.0M873.1,1195.0L876.1,1196.0M876.6,1195.5L876.1,1196.0M876.6,1195.5L876.6,1196.0M876.1,1196.0L876.6,1196.0M876.6,1196.0L878.1,1197.0M878.1,1197.0L878.1,1197.5M878.1,1197.0L878.6,1197.0M878.6,1197.0L878.1,1197.5M878.6,1197.0L878.8,1197.0L879.2,1197.1L879.7,1197.2L880.5,1197.3L881.1,1198.2L881.5,1199.8L881.8,1202.2L881.9,1205.3L883.7,1207.7L887.1,1209.2L892.2,1210.0L899.0,1210.0L905.2,1210.6L910.9,1211.9L916.0,1213.8L920.7,1216.2L924.4,1218.7L927.2,1221.1L929.1,1223.4L930.1,1225.6L930.0,1228.7L928.7,1232.6L926.4,1237.2L922.9,1242.8L920.2,1246.9L918.5,1249.6L917.6,1251.0M878.1,1197.5L878.1,1200.0M1108.0,1229.0L1107.5,1229.5M1108.0,1229.0L1108.5,1229.5M1108.0,1229.0L1108.0,1229.5M1107.5,1229.5L1108.0,1229.5M1107.5,1229.5L1107.0,1230.6L1106.1,1232.8L1104.7,1236.1L1102.8,1240.4L1100.7,1244.2L1098.2,1247.3L1095.5,1249.8L1092.5,1251.7L1088.9,1253.4L1084.7,1255.1L1079.9,1256.6L1074.6,1257.9L1067.8,1259.3L1059.6,1260.6L1050.0,1261.9L1039.0,1263.1L1030.3,1264.1L1024.0,1264.7L1020.1,1265.0L1018.4,1265.0L1016.0,1264.5L1012.7,1263.6L1008.5,1262.2L1003.5,1260.3L998.4,1257.6L993.0,1254.0L987.6,1249.6L982.0,1244.4L977.8,1240.4L975.0,1237.8L973.6,1236.5M1108.0,1229.5L1108.5,1229.5M1108.5,1229.5L1122.0,1232.5M969.1,1232.0L968.1,1234.5M968.1,1234.5L967.6,1235.0M968.1,1234.5L968.1,1235.0M967.6,1235.0L967.4,1235.1L967.0,1235.3L966.5,1235.6L965.7,1235.9L964.6,1237.0L963.2,1238.8L961.4,1241.2L959.3,1244.3L957.2,1247.0L955.1,1249.2L953.1,1250.9L951.1,1252.1L949.1,1252.9L947.2,1253.3L945.3,1253.2L943.4,1252.8L941.4,1252.4L939.3,1252.3L937.0,1252.4L934.7,1252.6L932.5,1252.7L930.5,1252.6L928.7,1252.2L927.0,1251.8L925.4,1251.4L923.8,1251.2L922.2,1251.2L920.5,1251.3L919.3,1251.4L918.5,1251.5L918.1,1251.5M967.6,1235.0L968.1,1235.0M968.1,1235.0L973.1,1236.0M974.6,1235.0L973.6,1236.0M973.6,1236.0L973.1,1236.0M973.6,1236.0L973.6,1236.5M973.1,1236.0L973.6,1236.5M917.6,1251.0L917.1,1251.5M917.6,1251.0L918.1,1251.5M917.6,1251.0L917.6,1251.5M917.1,1251.5L917.6,1251.5M917.1,1251.5L917.1,1253.0M917.6,1251.5L918.1,1251.5`,
      showCumulativeDistances: true,
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
      roadPath: `M747.5,818.2L735.8,813.3L714.8,799.7L659.2,773.1L635.8,770.7L630.2,783.6M659.2,1093.0L641.9,1078.8L617.8,1069.5L608.6,1061.5L604.3,1060.3L574.6,1060.3L573.4,1042.4L575.9,1001.6L564.7,1001.0L563.5,999.8L563.5,986.2L562.3,982.5L533.9,976.3L528.3,973.8L530.2,954.1L532.0,951.6L538.8,926.3L540.7,924.4L553.0,925.0L554.9,922.6L556.7,905.3L554.9,897.9L557.3,887.4L557.3,880.6L549.9,863.3L537.6,850.9L531.4,846.6L517.2,857.1L497.5,858.4L495.6,860.8L492.5,879.4L490.0,886.1L454.8,886.8L451.8,867.0L448.1,860.2M779.6,1036.8L735.8,1059.7L716.0,1061.5L665.4,1088.7L659.8,1093.0M448.1,859.6L448.1,846.6L420.3,846.0L419.7,806.5L418.4,803.4L419.0,778.1L434.5,752.8L438.2,733.0L441.3,731.2L451.8,729.3L454.9,710.8L467.8,710.2L478.3,687.3L518.5,689.2L538.2,704.0L543.1,704.0L556.7,699.1L579.0,687.9L589.5,701.5L590.1,715.1L603.7,737.3L625.3,754.6L627.7,782.4L629.0,783.6M658.0,1143.0L659.8,1138.7L669.7,1137.5L669.1,1130.0L659.8,1110.3L659.2,1093.6M747.5,818.8L762.3,887.4L767.3,904.1L812.3,904.1L835.2,899.7L843.8,899.7L845.7,901.0L845.7,917.6L829.6,943.0L825.3,962.1L842.6,985.6L851.9,1006.6L852.5,1012.1L822.2,1031.3L819.8,1031.3L804.9,1024.5L800.0,1025.1L796.3,1028.8L791.4,1028.8`,
      markers: [
        { x: 438.1, y: 733.0 },
        { x: 628.4, y: 791.0 },
        { x: 451.5, y: 866.8 },
        { x: 552.1, y: 867.6 },
        { x: 845.8, y: 900.8 },
        { x: 530.0, y: 955.2 },
        { x: 796.6, y: 1028.6 },
        { x: 779.2, y: 1036.7 },
        { x: 573.9, y: 1060.0 },
        { x: 712.7, y: 1063.5 },
        { x: 656.1, y: 1157.3 }
      ],
      showCumulativeDistances: false,
      journeyStops: [
        { x: 779.2, y: 1036.7, label: 'РОСТОК' },
        { x: 552.1, y: 867.6, label: 'РЫЖИЙ ЛЕС' },
        { x: 438.1, y: 733.0, label: 'ЯНОВ' },
        { x: 628.4, y: 791.0, label: 'ЮПИТЕР' },
        { x: 656.1, y: 1157.3, label: 'ХИМЗАВОД' }
      ],
      main: [],
      branch: []
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
  let mapFullscreenMode = false;
  let mapMovementTestVisible = false;
  let mapJourneyActive = false;
  let mapJourneyPlan = null;
  let mapJourneySequence = [];
  let mapJourneyAnimationFrame = 0;
  const ROUTE_TRAVEL_SPEED_KMH = 8;
  let mapPresetRouteVisible =
    localStorage.getItem(MAP_PRESET_ROUTE_STORAGE_KEY) !== '0';
  let mapSelectedRouteKey =
    localStorage.getItem(MAP_PRESET_ROUTE_SELECTED_KEY) || 'garbage_cement_cooling';
  const MAP_PRESET_ROUTE_START_KEY =
    'stalker2-zone-clock-preset-route-start-v1';
  const MAP_VISITED_ARTIFACTS_KEY =
    'stalker2-zone-clock-visited-artifacts-v2';
  const MAP_VISITED_ARTIFACTS_LEGACY_KEY =
    'stalker2-zone-clock-visited-artifacts-v1';
  let mapPresetRouteStart =
    localStorage.getItem(MAP_PRESET_ROUTE_START_KEY) || 'svalka';

  let mapArtifactVisits = (() => {
    try {
      const current = JSON.parse(
        localStorage.getItem(MAP_VISITED_ARTIFACTS_KEY) || '{}'
      );

      if (
        current &&
        typeof current === 'object' &&
        !Array.isArray(current)
      ) {
        return current;
      }

      return {};
    } catch (_) {
      return {};
    }
  })();

  let mapLegacyVisitedArtifacts = (() => {
    try {
      const parsed = JSON.parse(
        localStorage.getItem(MAP_VISITED_ARTIFACTS_LEGACY_KEY) || '[]'
      );

      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  })();

  let mapLegacyVisitsMigrated = false;

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
    updateMapZoneTime();
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

  function updateMapZoneTime() {
    if (!els.mapZoneTime) return;
    els.mapZoneTime.textContent = formatClock(gameSeconds);
  }

  function saveVisitedArtifacts() {
    localStorage.setItem(
      MAP_VISITED_ARTIFACTS_KEY,
      JSON.stringify(mapArtifactVisits)
    );
  }

  function artifactVisitKey(routeKey, index) {
    return `${routeKey}:${index}`;
  }

  function migrateLegacyArtifactVisits() {
    if (mapLegacyVisitsMigrated) return;
    mapLegacyVisitsMigrated = true;

    if (!mapLegacyVisitedArtifacts.length) return;

    let changed = false;

    mapLegacyVisitedArtifacts.forEach(key => {
      if (!(key in mapArtifactVisits)) {
        mapArtifactVisits[key] = absoluteGameSeconds;
        changed = true;
      }
    });

    if (changed) {
      saveVisitedArtifacts();
    }

    try {
      localStorage.removeItem(MAP_VISITED_ARTIFACTS_LEGACY_KEY);
    } catch (_) {}

    mapLegacyVisitedArtifacts = [];
  }

  function artifactVisitTime(routeKey, index) {
    const key = artifactVisitKey(routeKey, index);
    const value = Number(mapArtifactVisits[key]);
    return Number.isFinite(value) ? value : null;
  }

  function artifactElapsedSeconds(routeKey, index) {
    const visitTime = artifactVisitTime(routeKey, index);

    if (visitTime === null) return null;

    return Math.max(0, absoluteGameSeconds - visitTime);
  }

  function artifactRespawnState(elapsedSeconds) {
    if (!(elapsedSeconds >= 0)) {
      return {
        key: 'unvisited',
        label: '',
        shortLabel: ''
      };
    }

    if (elapsedSeconds < 2 * DAY_SECONDS) {
      return {
        key: 'collected',
        label: 'СОБРАН',
        shortLabel: 'СОБРАН'
      };
    }

    if (elapsedSeconds < 3 * DAY_SECONDS) {
      return {
        key: 'possible',
        label: 'ВОЗМОЖНО ПОЯВИЛСЯ',
        shortLabel: 'ВОЗМОЖНО'
      };
    }

    return {
      key: 'ready',
      label: 'ПОРА ПРОВЕРИТЬ — ТОЧКА СНОВА ДОСТУПНА',
      shortLabel: 'ПРОВЕРИТЬ'
    };
  }

  function formatArtifactElapsed(seconds) {
    const safe = Math.max(0, Math.floor(seconds));

    const days = Math.floor(safe / DAY_SECONDS);
    const hours = Math.floor((safe % DAY_SECONDS) / 3600);
    const minutes = Math.floor((safe % 3600) / 60);

    if (days > 0) {
      return `${days}д ${hours}ч`;
    }

    if (hours > 0) {
      return `${hours}ч ${minutes}м`;
    }

    return `${Math.max(0, minutes)}м`;
  }

  function toggleArtifactVisited(routeKey, index) {
    const key = artifactVisitKey(routeKey, index);
    const wasVisited = key in mapArtifactVisits;

    if (wasVisited) {
      delete mapArtifactVisits[key];
    } else {
      mapArtifactVisits[key] = absoluteGameSeconds;
    }

    saveVisitedArtifacts();
    renderPresetRoute();

    maybeAdvanceJourneyAfterVisit(
      routeKey,
      index,
      wasVisited
    );
  }

  function updateArtifactVisitStatuses() {
    migrateLegacyArtifactVisits();

    if (!els.mapPresetRoutePoints) return;

    const activeRoute = getPresetRoute();
    const circles = els.mapPresetRoutePoints.querySelectorAll(
      '.map-artifact-visit-point'
    );
    const statusLabels = els.mapPresetRoutePoints.querySelectorAll(
      '.map-artifact-status'
    );

    circles.forEach((circle, index) => {
      const elapsed = artifactElapsedSeconds(activeRoute.key, index);
      const isVisited = elapsed !== null;
      const state = artifactRespawnState(elapsed);

      circle.classList.toggle('visited', isVisited);
      circle.classList.toggle('artifact-collected', state.key === 'collected');
      circle.classList.toggle('artifact-possible', state.key === 'possible');
      circle.classList.toggle('artifact-ready', state.key === 'ready');

      circle.setAttribute(
        'aria-label',
        isVisited
          ? `Точка ${index + 1}: ${state.label}, прошло ${formatArtifactElapsed(elapsed)}`
          : `Точка ${index + 1}, не посещена`
      );

      const label = statusLabels[index];

      if (label) {
        if (isVisited) {
          label.textContent =
            `${state.shortLabel} · ${formatArtifactElapsed(elapsed)}`;
          label.style.display = '';
          label.setAttribute(
            'class',
            `map-artifact-status artifact-${state.key}`
          );
        } else {
          label.textContent = '';
          label.style.display = 'none';
          label.setAttribute(
            'class',
            'map-artifact-status'
          );
        }
      }
    });
  }



  const JOURNEY_WISHES = [
    'Пусть дорога будет тише счётчика, а рюкзак — легче совести барыги.',
    'Держи болты ближе, оружие сухим, а ближайшее укрытие — в памяти.',
    'Не спорь с Зоной. Если тропа вдруг стала слишком тихой — это уже разговор.',
    'Хорошей дороги, сталкер. Возвращаются обычно те, кто смотрит не только под ноги.',
    'Пусть артефакты светятся раньше, чем начнёт трещать детектор.',
    'Маршрут известен. Что встретится между точками — решает Зона.',
    'Смотри на небо, слушай детектор и не считай знакомую дорогу безопасной.',
    'Иди спокойно. Самая дорогая ошибка в Зоне обычно начинается со слов «я тут уже ходил».'
  ];

  function randomJourneyWish() {
    return JOURNEY_WISHES[
      Math.floor(Math.random() * JOURNEY_WISHES.length)
    ];
  }

  function getRoadNetworkLengthPx(route) {
    if (!route || !route.roadPath) return 0;
    if (Number.isFinite(route._roadNetworkLengthPx)) {
      return route._roadNetworkLengthPx;
    }

    const commands = getRoadPathCommands(route);
    let total = 0;
    let lastPoint = null;

    commands.forEach(command => {
      if (command.cmd === 'M') {
        lastPoint = command;
        return;
      }

      if (command.cmd === 'L' && lastPoint) {
        total += Math.hypot(
          command.x - lastPoint.x,
          command.y - lastPoint.y
        );
        lastPoint = command;
      }
    });

    route._roadNetworkLengthPx = total;
    return total;
  }

  function getJourneyStops(route = getPresetRoute()) {
    if (!route) return [];

    if (
      route.key === 'garbage_cement_cooling' &&
      Array.isArray(route.markers)
    ) {
      return route.markers
        .map((point, markerIndex) => ({
          ...point,
          markerIndex,
          routeKey: route.key,
          distancePx: getPresetMarkerDistancePx(
            route,
            point,
            markerIndex
          )
        }))
        .sort((a, b) => a.distancePx - b.distancePx);
    }

    if (Array.isArray(route.journeyStops)) {
      return route.journeyStops.map((point, index) => ({
        ...point,
        markerIndex: null,
        routeKey: route.key,
        distancePx: index
      }));
    }

    return [];
  }

  function getJourneyDistancePx(route = getPresetRoute()) {
    if (!route) return 0;

    if (
      route.key === 'garbage_cement_cooling' &&
      Array.isArray(route.markers) &&
      route.markers.length
    ) {
      return Math.max(
        ...route.markers.map((point, index) =>
          getPresetMarkerDistancePx(route, point, index)
        )
      );
    }

    return getRoadNetworkLengthPx(route);
  }

  function projectZoneAdvanceForRealSeconds(realSeconds, startGameSeconds) {
    if (!(realSeconds > 0)) return 0;

    if (els.profileInput.value !== 'vanilla') {
      return realSeconds * rateAt(startGameSeconds);
    }

    let left = Math.min(realSeconds, 12 * 3600);
    let localGame = wrap(startGameSeconds);
    let totalGame = 0;
    let guard = 0;

    while (left > 0.0001 && guard++ < 10000) {
      const rate = rateAt(localGame);
      const slot = Math.floor(localGame / RATE_SLOT_SECONDS);
      const nextBoundary = Math.min(
        DAY_SECONDS,
        (slot + 1) * RATE_SLOT_SECONDS
      );
      const gameToBoundary = Math.max(
        0.001,
        nextBoundary - localGame
      );
      const realToBoundary = gameToBoundary / rate;
      const usedReal = Math.min(left, realToBoundary);
      const gameDelta = usedReal * rate;

      totalGame += gameDelta;
      localGame = wrap(localGame + gameDelta);
      left -= usedReal;

      if (usedReal >= realToBoundary && left > 0) {
        localGame = wrap(localGame + 0.001);
        totalGame += 0.001;
      }
    }

    return totalGame;
  }

  function getJourneyPlan(route = getPresetRoute()) {
    const distancePx = getJourneyDistancePx(route);
    const distanceMeters = distancePx * mapMetersPerPixel;
    const distanceKm = distanceMeters / 1000;
    const realSeconds = Math.max(
      60,
      distanceKm / ROUTE_TRAVEL_SPEED_KMH * 3600
    );

    return {
      routeKey: route.key,
      routeLabel: route.label,
      distanceMeters,
      realSeconds,
      zoneAdvanceSeconds:
        projectZoneAdvanceForRealSeconds(
          realSeconds,
          gameSeconds
        )
    };
  }

  function formatJourneyRealTime(seconds) {
    const totalMinutes = Math.max(
      1,
      Math.round(seconds / 60)
    );
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours > 0) {
      return `~${hours} ч ${minutes} мин`;
    }

    return `~${minutes} мин`;
  }


  function formatJourneyZoneTime(seconds) {
    const totalMinutes = Math.max(
      1,
      Math.round(seconds / 60)
    );

    const days = Math.floor(
      totalMinutes / (24 * 60)
    );

    const restMinutes =
      totalMinutes % (24 * 60);

    const hours = Math.floor(
      restMinutes / 60
    );

    const minutes =
      restMinutes % 60;

    const parts = [];

    if (days > 0) {
      parts.push(`${days} д`);
    }

    if (hours > 0 || days > 0) {
      parts.push(`${hours} ч`);
    }

    if (minutes > 0 || !parts.length) {
      parts.push(`${minutes} мин`);
    }

    return `~${parts.join(' ')}`;
  }

  function routeTouchesNight(startAbsolute, endAbsolute) {
    if (!(endAbsolute >= startAbsolute)) return false;

    const firstDay =
      Math.floor(startAbsolute / DAY_SECONDS) - 1;
    const lastDay =
      Math.floor(endAbsolute / DAY_SECONDS) + 1;

    for (let day = firstDay; day <= lastDay; day++) {
      const nightStart =
        day * DAY_SECONDS + NIGHT_START;
      const nightEnd =
        (day + 1) * DAY_SECONDS + MORNING_START;

      if (
        Math.max(startAbsolute, nightStart) <
        Math.min(endAbsolute, nightEnd)
      ) {
        return true;
      }
    }

    return false;
  }

  function journeyEmissionMessage(plan) {
    if (!emission) {
      return 'ВЫБРОС: последний выброс не отмечен. Вероятность на время маршрута оценить нельзя — держи в голове ближайшее укрытие.';
    }

    const elapsedNow = Math.max(
      0,
      absoluteGameSeconds - emission.absoluteGameSeconds
    );
    const elapsedEnd =
      elapsedNow + plan.zoneAdvanceSeconds;

    const startRisk = emissionRisk(elapsedNow);
    const endRisk = emissionRisk(elapsedEnd);

    if (
      startRisk.badge === 'ВЫСОКИЙ' ||
      endRisk.badge === 'ВЫСОКИЙ'
    ) {
      return 'ВЫБРОС: риск высокий. По текущему интервалу выброс вполне может застать тебя в пути.';
    }

    if (
      startRisk.badge === 'ПОВЫШЕННЫЙ' ||
      endRisk.badge === 'ПОВЫШЕННЫЙ'
    ) {
      return 'ВЫБРОС: маршрут проходит через повышенное окно риска. Гарантии выброса нет, но укрытия лучше отмечать заранее.';
    }

    if (
      elapsedNow < 2 * DAY_SECONDS &&
      elapsedEnd >= 2 * DAY_SECONDS
    ) {
      return 'ВЫБРОС: в ходе маршрута ты войдёшь в ориентировочное окно 2–3 суток после прошлого выброса.';
    }

    return 'ВЫБРОС: по текущему таймеру риск на этом отрезке остаётся низким, но точный момент заранее определить нельзя.';
  }

  function updateJourneyHud() {
    if (!els.mapJourneyHud) return;

    const show = Boolean(
      mapJourneyActive &&
      mapJourneyPlan &&
      mapFullscreenMode
    );

    els.mapJourneyHud.hidden = !show;

    if (!show) return;

    if (els.mapJourneyHudDistance) {
      els.mapJourneyHudDistance.textContent =
        formatMapDistance(
          mapJourneyPlan.distanceMeters
        );
    }

    if (els.mapJourneyHudTime) {
      els.mapJourneyHudTime.textContent =
        formatJourneyZoneTime(
          mapJourneyPlan.zoneAdvanceSeconds
        );
    }
  }

  function openJourneyPreview() {
    const route = getPresetRoute();
    if (!route || !els.mapJourneyDialog) return;

    const plan = getJourneyPlan(route);
    mapJourneyPlan = plan;

    if (els.mapJourneyWish) {
      els.mapJourneyWish.textContent =
        randomJourneyWish();
    }

    if (els.mapJourneyRouteName) {
      els.mapJourneyRouteName.textContent =
        route.label;
    }

    if (els.mapJourneyDistance) {
      els.mapJourneyDistance.textContent =
        formatMapDistance(plan.distanceMeters);
    }

    if (els.mapJourneyTime) {
      els.mapJourneyTime.textContent =
        formatJourneyZoneTime(
          plan.zoneAdvanceSeconds
        );
    }

    if (els.mapJourneyEmission) {
      els.mapJourneyEmission.textContent =
        journeyEmissionMessage(plan);
    }

    const routeEndAbsolute =
      absoluteGameSeconds + plan.zoneAdvanceSeconds;

    const touchesNight = routeTouchesNight(
      absoluteGameSeconds,
      routeEndAbsolute
    );

    if (els.mapJourneyNight) {
      els.mapJourneyNight.hidden = !touchesNight;
      els.mapJourneyNight.textContent = touchesNight
        ? 'НОЧЬ: расчётный маршрут задевает ночной период 21:30–05:30. Видимость хуже, а знакомая тропа ночью выглядит совсем иначе.'
        : '';
    }

    if (
      typeof els.mapJourneyDialog.showModal ===
      'function'
    ) {
      els.mapJourneyDialog.showModal();
    } else {
      els.mapJourneyDialog.setAttribute(
        'open',
        ''
      );
    }
  }

  function closeJourneyPreview() {
    if (!els.mapJourneyDialog) return;

    if (
      typeof els.mapJourneyDialog.close ===
      'function'
    ) {
      els.mapJourneyDialog.close();
    } else {
      els.mapJourneyDialog.removeAttribute('open');
    }
  }

  function easeInOutJourney(t) {
    return t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function animateMapTo(
    targetPanX,
    targetPanY,
    targetZoom,
    duration = 850
  ) {
    if (mapJourneyAnimationFrame) {
      cancelAnimationFrame(
        mapJourneyAnimationFrame
      );
      mapJourneyAnimationFrame = 0;
    }

    const startPanX = mapPanX;
    const startPanY = mapPanY;
    const startZoom = mapZoom;
    const startedAt = performance.now();

    const frame = now => {
      const t = Math.min(
        1,
        Math.max(
          0,
          (now - startedAt) / duration
        )
      );
      const e = easeInOutJourney(t);

      mapPanX =
        startPanX +
        (targetPanX - startPanX) * e;
      mapPanY =
        startPanY +
        (targetPanY - startPanY) * e;
      mapZoom =
        startZoom +
        (targetZoom - startZoom) * e;

      applyMapTransform(false);

      if (t < 1) {
        mapJourneyAnimationFrame =
          requestAnimationFrame(frame);
      } else {
        mapJourneyAnimationFrame = 0;
        applyMapTransform(true);
      }
    };

    mapJourneyAnimationFrame =
      requestAnimationFrame(frame);
  }

  function focusJourneyPoints(
    points,
    duration = 850
  ) {
    if (!els.mapViewport || !points.length) return;

    const rect =
      els.mapViewport.getBoundingClientRect();
    if (!(rect.width > 40 && rect.height > 40)) {
      return;
    }

    const xs = points.map(point => point.x);
    const ys = points.map(point => point.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const dx = Math.max(24, maxX - minX);
    const dy = Math.max(24, maxY - minY);
    const padding = Math.min(
      90,
      Math.max(
        48,
        Math.min(
          rect.width,
          rect.height
        ) * 0.16
      )
    );

    let targetZoom = Math.min(
      (rect.width - 2 * padding) / dx,
      (rect.height - 2 * padding) / dy,
      8
    );

    targetZoom = Math.max(
      targetZoom,
      Math.max(mapFitZoom * 1.8, 0.45)
    );

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    animateMapTo(
      rect.width / 2 - centerX * targetZoom,
      rect.height / 2 - centerY * targetZoom,
      targetZoom,
      duration
    );
  }

  function getJourneySequence(
    route = getPresetRoute()
  ) {
    return getJourneyStops(route);
  }

  function firstUnvisitedJourneyIndex() {
    if (!mapJourneySequence.length) return 0;

    const routeKey = mapJourneyPlan
      ? mapJourneyPlan.routeKey
      : getPresetRoute().key;

    for (
      let i = 0;
      i < mapJourneySequence.length;
      i++
    ) {
      const stop = mapJourneySequence[i];

      if (stop.markerIndex === null) {
        return i;
      }

      if (
        artifactVisitTime(
          routeKey,
          stop.markerIndex
        ) === null
      ) {
        return i;
      }
    }

    return mapJourneySequence.length - 1;
  }

  function focusJourneyStep(
    stepIndex,
    duration = 850
  ) {
    if (!mapJourneySequence.length) return;

    const current =
      mapJourneySequence[
        Math.min(
          mapJourneySequence.length - 1,
          Math.max(0, stepIndex)
        )
      ];

    const next =
      mapJourneySequence[
        Math.min(
          mapJourneySequence.length - 1,
          Math.max(0, stepIndex + 1)
        )
      ];

    focusJourneyPoints(
      current === next
        ? [current]
        : [current, next],
      duration
    );
  }

  function startJourney() {
    const route = getPresetRoute();

    mapJourneyPlan =
      mapJourneyPlan &&
      mapJourneyPlan.routeKey === route.key
        ? mapJourneyPlan
        : getJourneyPlan(route);

    mapJourneyActive = true;
    mapJourneySequence =
      getJourneySequence(route);

    closeJourneyPreview();

    if (!mapPresetRouteVisible) {
      mapPresetRouteVisible = true;
      localStorage.setItem(
        MAP_PRESET_ROUTE_STORAGE_KEY,
        '1'
      );
      updatePresetRouteUI();
      updatePresetRouteScreenGeometry();
    }

    if (!mapFullscreenMode) {
      mapFullscreenMode = true;
      updateMapFullscreenUI();
    }

    updateJourneyHud();

    window.setTimeout(() => {
      focusJourneyStep(
        firstUnvisitedJourneyIndex(),
        1050
      );
    }, 180);
  }

  function maybeAdvanceJourneyAfterVisit(
    routeKey,
    markerIndex,
    wasVisited
  ) {
    if (
      wasVisited ||
      !mapJourneyActive ||
      !mapJourneyPlan ||
      mapJourneyPlan.routeKey !== routeKey
    ) {
      return;
    }

    const sequenceIndex =
      mapJourneySequence.findIndex(
        stop =>
          stop.markerIndex === markerIndex
      );

    if (sequenceIndex < 0) return;

    window.setTimeout(() => {
      focusJourneyStep(
        sequenceIndex,
        800
      );
    }, 120);
  }



  function getRouteStartLabel(startKey = mapPresetRouteStart) {
    return startKey === 'cement' ? 'ЦЕМЕНТНЫЙ ЗАВОД' : 'СВАЛКА';
  }

  function getRoadPathCommands(route) {
    if (!route || !route.roadPath) return [];
    if (route._roadPathCommands) return route._roadPathCommands;

    route._roadPathCommands = (route.roadPath.match(/[ML][^ML]+/g) || [])
      .map(chunk => {
        const cmd = chunk[0];
        const coords = chunk.slice(1).split(',');
        const x = Number(coords[0]);
        const y = Number(coords[1]);
        return Number.isFinite(x) && Number.isFinite(y)
          ? { cmd, x, y }
          : null;
      })
      .filter(Boolean);

    return route._roadPathCommands;
  }

  function pointToSegmentDistance(
    point,
    start,
    end
  ) {
    const dx = end.x - start.x;
    const dy = end.y - start.y;

    if (
      Math.abs(dx) < 0.0001 &&
      Math.abs(dy) < 0.0001
    ) {
      return Math.hypot(
        point.x - start.x,
        point.y - start.y
      );
    }

    const t = Math.max(
      0,
      Math.min(
        1,
        (
          (point.x - start.x) * dx +
          (point.y - start.y) * dy
        ) /
        (dx * dx + dy * dy)
      )
    );

    const px = start.x + dx * t;
    const py = start.y + dy * t;

    return Math.hypot(
      point.x - px,
      point.y - py
    );
  }

  function simplifyRoadScreenPoints(
    points,
    epsilon = 2.4
  ) {
    if (points.length <= 2) {
      return points.slice();
    }

    let maxDistance = -1;
    let splitIndex = -1;

    const first = points[0];
    const last = points[points.length - 1];

    for (
      let index = 1;
      index < points.length - 1;
      index++
    ) {
      const distance =
        pointToSegmentDistance(
          points[index],
          first,
          last
        );

      if (distance > maxDistance) {
        maxDistance = distance;
        splitIndex = index;
      }
    }

    if (
      maxDistance > epsilon &&
      splitIndex > 0
    ) {
      const left =
        simplifyRoadScreenPoints(
          points.slice(
            0,
            splitIndex + 1
          ),
          epsilon
        );

      const right =
        simplifyRoadScreenPoints(
          points.slice(splitIndex),
          epsilon
        );

      return [
        ...left.slice(0, -1),
        ...right
      ];
    }

    return [first, last];
  }

  function roadCommandsToChains(route) {
    const commands =
      getRoadPathCommands(route);

    const chains = [];
    let chain = [];

    commands.forEach(command => {
      if (command.cmd === 'M') {
        if (chain.length > 1) {
          chains.push(chain);
        }

        chain = [
          {
            x: command.x,
            y: command.y
          }
        ];

        return;
      }

      if (command.cmd === 'L') {
        chain.push({
          x: command.x,
          y: command.y
        });
      }
    });

    if (chain.length > 1) {
      chains.push(chain);
    }

    return chains;
  }

  function buildSmoothScreenChain(points) {
    if (!points.length) return '';

    if (points.length === 1) {
      return (
        `M${points[0].x.toFixed(1)},` +
        `${points[0].y.toFixed(1)}`
      );
    }

    if (points.length === 2) {
      return (
        `M${points[0].x.toFixed(1)},` +
        `${points[0].y.toFixed(1)}` +
        `L${points[1].x.toFixed(1)},` +
        `${points[1].y.toFixed(1)}`
      );
    }

    let path =
      `M${points[0].x.toFixed(1)},` +
      `${points[0].y.toFixed(1)}`;

    for (
      let index = 1;
      index < points.length - 1;
      index++
    ) {
      const current = points[index];
      const next = points[index + 1];

      const midX =
        (current.x + next.x) / 2;

      const midY =
        (current.y + next.y) / 2;

      path +=
        `Q${current.x.toFixed(1)},` +
        `${current.y.toFixed(1)} ` +
        `${midX.toFixed(1)},` +
        `${midY.toFixed(1)}`;
    }

    const beforeLast =
      points[points.length - 2];

    const last =
      points[points.length - 1];

    path +=
      `Q${beforeLast.x.toFixed(1)},` +
      `${beforeLast.y.toFixed(1)} ` +
      `${last.x.toFixed(1)},` +
      `${last.y.toFixed(1)}`;

    return path;
  }

  function buildScreenRoadPath(route) {
    return roadCommandsToChains(route)
      .map(chain => {
        const screenPoints = chain.map(
          point => ({
            x:
              mapPanX +
              point.x * mapZoom,
            y:
              mapPanY +
              point.y * mapZoom
          })
        );

        /*
         * Упрощение выполняется уже после масштабирования,
         * поэтому визуальная точность остаётся одинаковой
         * при любом zoom. Микро-зигзаги менее ~2.4 px
         * исчезают, а реальные повороты дорог сохраняются.
         */
        const simplified =
          simplifyRoadScreenPoints(
            screenPoints,
            2.4
          );

        return buildSmoothScreenChain(
          simplified
        );
      })
      .join('');
  }


  function getPresetMarkerDistancePx(route, point, index) {
    if (!route || !route.showCumulativeDistances) return 0;

    if (route.key !== 'garbage_cement_cooling') {
      return mapPresetRouteStart === 'cement'
        ? point.fromCement
        : point.fromSvalka;
    }

    if (mapPresetRouteStart !== 'cement') {
      return point.fromSvalka;
    }

    const eastOutAndBack = 2 * 100.02;
    const northOutAndBack = 2 * 89.15;
    const localDetourOffset = eastOutAndBack + northOutAndBack;

    if (index === 3) return 0;
    if (index === 4) return point.fromCement;
    if (index === 0) return point.fromCement + eastOutAndBack;

    return point.fromCement + localDetourOffset;
  }


  function updatePresetRouteUI() {
    const activeRoute = getPresetRoute();
    const showRouteStart = activeRoute.key === 'garbage_cement_cooling';

    if (els.mapPresetRouteBtn) {
      els.mapPresetRouteBtn.textContent =
        mapPresetRouteVisible ? 'МАРШРУТ: ВКЛ' : 'МАРШРУТ: ВЫКЛ';
      els.mapPresetRouteBtn.classList.toggle('active', mapPresetRouteVisible);
    }

    if (els.mapRouteSelect) {
      els.mapRouteSelect.value = activeRoute.key;
    }


    if (els.mapRouteStartWrap) {
      els.mapRouteStartWrap.hidden = !showRouteStart;
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
      !els.mapPresetRoutePoints ||
      !els.mapPresetRoadPath
    ) return;

    const activeRoute = getPresetRoute();
    const isRoadRoute = Boolean(activeRoute.roadPath);

    if (els.mapPresetRouteLayer) {
      els.mapPresetRouteLayer.style.display =
        mapPresetRouteVisible ? '' : 'none';
    }

    if (els.mapRoadRoutePath) {
      els.mapRoadRoutePath.setAttribute('d', '');
      els.mapRoadRoutePath.style.display = 'none';
    }

    els.mapPresetRoadPath.style.display =
      mapPresetRouteVisible && isRoadRoute ? '' : 'none';
    els.mapPresetRoadPath.setAttribute(
      'd',
      mapPresetRouteVisible && isRoadRoute ? buildScreenRoadPath(activeRoute) : ''
    );

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

    const artifactStatusLabels = els.mapPresetRoutePoints.querySelectorAll(
      '.map-artifact-status'
    );

    const routeZoomRatio =
      mapFitZoom > 0 ? mapZoom / mapFitZoom : 1;
    const showDistanceLabels =
      Boolean(activeRoute.showCumulativeDistances) &&
      routeZoomRatio >= 1.85;

    markerDefs.forEach((point, index) => {
      const screen = routePointToScreen(point);
      const circle = circles[index];

      if (circle) {
        circle.setAttribute('cx', screen.x);
        circle.setAttribute('cy', screen.y);
      }

      const artifactStatusLabel = artifactStatusLabels[index];

      if (artifactStatusLabel) {
        artifactStatusLabel.setAttribute('x', screen.x + 8);
        artifactStatusLabel.setAttribute('y', screen.y + 16);
      }

      const label = labels[index];

      if (label) {
        label.setAttribute('x', screen.x + 8);
        label.setAttribute('y', screen.y - 8);

        if (isRoadRoute && showDistanceLabels) {
          const logicalDistance = getPresetMarkerDistancePx(
            activeRoute,
            point,
            index
          );

          label.textContent = formatMapDistance(
            logicalDistance * mapMetersPerPixel
          );
          label.style.display = '';
        } else {
          label.textContent = '';
          label.style.display = 'none';
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

    markerDefs.forEach((point, index) => {
      const circle = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'circle'
      );

      const elapsed = artifactElapsedSeconds(activeRoute.key, index);
      const isVisited = elapsed !== null;
      const respawnState = artifactRespawnState(elapsed);

      circle.setAttribute('r', isRoadRoute ? '5.2' : '4.5');
      circle.setAttribute(
        'class',
        `map-preset-route-point map-artifact-visit-point${isVisited ? ` visited artifact-${respawnState.key}` : ''}`
      );
      circle.setAttribute('data-route-key', activeRoute.key);
      circle.setAttribute('data-point-index', String(index));
      circle.setAttribute('tabindex', '0');
      circle.setAttribute('role', 'button');
      circle.setAttribute(
        'aria-label',
        isVisited
          ? `Точка ${index + 1}: ${respawnState.label}, прошло ${formatArtifactElapsed(elapsed)}`
          : `Точка ${index + 1}, не посещена`
      );

      circle.addEventListener('pointerdown', event => {
        event.stopPropagation();
      });

      circle.addEventListener('click', event => {
        event.stopPropagation();
        toggleArtifactVisited(activeRoute.key, index);
      });

      circle.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          event.stopPropagation();
          toggleArtifactVisited(activeRoute.key, index);
        }
      });

      els.mapPresetRoutePoints.appendChild(circle);

      const statusText = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'text'
      );

      statusText.setAttribute(
        'class',
        `map-artifact-status${isVisited ? ` artifact-${respawnState.key}` : ''}`
      );
      statusText.setAttribute('font-size', '9.5');
      statusText.style.display = isVisited ? '' : 'none';
      statusText.textContent = isVisited
        ? `${respawnState.shortLabel} · ${formatArtifactElapsed(elapsed)}`
        : '';

      els.mapPresetRoutePoints.appendChild(statusText);

      if (isRoadRoute && activeRoute.showCumulativeDistances) {
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
    mapJourneyActive = false;
    mapJourneyPlan = null;
    mapJourneySequence = [];

    localStorage.setItem(
      MAP_PRESET_ROUTE_SELECTED_KEY,
      mapSelectedRouteKey
    );

    renderPresetRoute();
    updateJourneyHud();
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
    updateMovementTestScreenGeometry();
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

        updateMovementTestScreenGeometry();
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

  function updateMapFullscreenUI() {
    if (!els.mapDialog || !els.mapFullscreenBtn) return;

    els.mapDialog.classList.toggle('map-fullscreen', mapFullscreenMode);
    els.mapFullscreenBtn.classList.toggle('active', mapFullscreenMode);
    els.mapFullscreenBtn.setAttribute(
      'aria-label',
      mapFullscreenMode
        ? 'Выйти из полноэкранной карты'
        : 'Развернуть карту на весь экран'
    );
    els.mapFullscreenBtn.title = mapFullscreenMode
      ? 'Обычный размер'
      : 'На весь экран';

    updateJourneyHud();
  }

  function toggleMapFullscreen() {
    if (!els.mapViewport || !els.mapDialog) {
      return;
    }

    const oldDialogRect =
      els.mapDialog.getBoundingClientRect();

    const oldMapRect =
      els.mapViewport.getBoundingClientRect();

    const centerImageX =
      oldMapRect.width > 0
        ? (
            oldMapRect.width / 2 -
            mapPanX
          ) / mapZoom
        : MAP_IMAGE_SIZE / 2;

    const centerImageY =
      oldMapRect.height > 0
        ? (
            oldMapRect.height / 2 -
            mapPanY
          ) / mapZoom
        : MAP_IMAGE_SIZE / 2;

    mapFullscreenMode =
      !mapFullscreenMode;

    updateMapFullscreenUI();

    window.requestAnimationFrame(() => {
      const newDialogRect =
        els.mapDialog.getBoundingClientRect();

      const dx =
        oldDialogRect.left -
        newDialogRect.left;

      const dy =
        oldDialogRect.top -
        newDialogRect.top;

      const sx =
        newDialogRect.width > 0
          ? oldDialogRect.width /
            newDialogRect.width
          : 1;

      const sy =
        newDialogRect.height > 0
          ? oldDialogRect.height /
            newDialogRect.height
          : 1;

      const reduceMotion =
        window.matchMedia &&
        window.matchMedia(
          '(prefers-reduced-motion: reduce)'
        ).matches;

      if (
        !reduceMotion &&
        typeof els.mapDialog.animate ===
          'function'
      ) {
        els.mapDialog.animate(
          [
            {
              transformOrigin:
                'top left',
              transform:
                `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`,
              opacity: 0.96
            },
            {
              transformOrigin:
                'top left',
              transform:
                'translate(0, 0) scale(1, 1)',
              opacity: 1
            }
          ],
          {
            duration: 560,
            easing:
              'cubic-bezier(.20,.76,.18,1)',
            fill: 'both'
          }
        );
      }

      window.setTimeout(() => {
        const rect =
          els.mapViewport.getBoundingClientRect();

        if (
          !(rect.width > 20 &&
            rect.height > 20)
        ) {
          return;
        }

        if (els.mapOverlay) {
          els.mapOverlay.setAttribute(
            'width',
            String(rect.width)
          );
          els.mapOverlay.setAttribute(
            'height',
            String(rect.height)
          );
        }

        mapFitZoom = Math.min(
          rect.width / MAP_IMAGE_SIZE,
          rect.height / MAP_IMAGE_SIZE
        );

        const minZoom =
          Math.max(
            .08,
            mapFitZoom * .75
          );

        mapZoom =
          Math.max(
            mapZoom,
            minZoom
          );

        mapPanX =
          rect.width / 2 -
          centerImageX * mapZoom;

        mapPanY =
          rect.height / 2 -
          centerImageY * mapZoom;

        applyMapTransform(true);
      }, reduceMotion ? 0 : 500);
    });
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
      updateMapZoneTime();
      updateMapFullscreenUI();

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

  if (els.mapFullscreenBtn) {
    els.mapFullscreenBtn.addEventListener('click', toggleMapFullscreen);
  }

  if (els.closeMapBtn) {
    els.closeMapBtn.addEventListener('click', () => {
      mapFullscreenMode = false;
      updateMapFullscreenUI();
      if (typeof els.mapDialog.close === 'function') els.mapDialog.close();
      else els.mapDialog.removeAttribute('open');
    });
  }

  if (els.mapDialog) {
    els.mapDialog.addEventListener('click', event => {
      if (event.target === els.mapDialog) {
        mapFullscreenMode = false;
        updateMapFullscreenUI();
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

  if (els.mapJourneyBtn) {
    els.mapJourneyBtn.addEventListener(
      'click',
      openJourneyPreview
    );
  }

  if (els.closeJourneyBtn) {
    els.closeJourneyBtn.addEventListener(
      'click',
      closeJourneyPreview
    );
  }

  if (els.startJourneyBtn) {
    els.startJourneyBtn.addEventListener(
      'click',
      startJourney
    );
  }

  if (els.mapJourneyDialog) {
    els.mapJourneyDialog.addEventListener(
      'click',
      event => {
        if (event.target === els.mapJourneyDialog) {
          closeJourneyPreview();
        }
      }
    );
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
      mapJourneyActive = false;
      mapJourneyPlan = null;
      mapJourneySequence = [];

      localStorage.setItem(
        MAP_PRESET_ROUTE_START_KEY,
        mapPresetRouteStart
      );

      updatePresetRouteUI();
      updatePresetRouteScreenGeometry();
      updateJourneyHud();
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
      updateMovementTestUi();
      updateMovementTestScreenGeometry();
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
      updateMovementTestUi();
      updateMovementTestScreenGeometry();
      renderMapMeasurement();

      if (els.mapCalibrationMessage) {
        els.mapCalibrationMessage.textContent =
          'Калибровка сброшена к исходной.';
      }
    });
  }


  function movementTestDistanceMeters() {
    return Math.hypot(
      MOVEMENT_TEST_END.x - MOVEMENT_TEST_START.x,
      MOVEMENT_TEST_END.y - MOVEMENT_TEST_START.y
    ) * mapMetersPerPixel;
  }

  function formatMovementElapsed(seconds) {
    const safe = Math.max(0, Math.round(seconds));
    const minutes = Math.floor(safe / 60);
    const secs = safe % 60;

    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const restMinutes = minutes % 60;
      return `${hours}:${String(restMinutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  function loadMovementTests() {
    try {
      const data = JSON.parse(
        localStorage.getItem(MOVEMENT_TEST_STORAGE_KEY) || '{}'
      );

      return data && typeof data === 'object'
        ? data
        : {};
    } catch (_) {
      return {};
    }
  }

  function saveMovementTests(data) {
    localStorage.setItem(
      MOVEMENT_TEST_STORAGE_KEY,
      JSON.stringify(data)
    );
  }

  function loadActiveMovementTest() {
    try {
      const data = JSON.parse(
        localStorage.getItem(MOVEMENT_TEST_ACTIVE_KEY) || 'null'
      );

      if (
        !data ||
        !MOVEMENT_TEST_MODES[data.mode] ||
        !(Number(data.startedAtMs) > 0)
      ) {
        return null;
      }

      return data;
    } catch (_) {
      return null;
    }
  }

  function saveActiveMovementTest(data) {
    if (!data) {
      localStorage.removeItem(
        MOVEMENT_TEST_ACTIVE_KEY
      );
      return;
    }

    localStorage.setItem(
      MOVEMENT_TEST_ACTIVE_KEY,
      JSON.stringify(data)
    );
  }

  function movementModeRuns(mode) {
    const data = loadMovementTests();
    const runs = data[mode];
    return Array.isArray(runs) ? runs : [];
  }

  function movementModeAverage(mode) {
    const runs = movementModeRuns(mode);

    if (!runs.length) return null;

    const valid = runs.filter(run =>
      Number.isFinite(Number(run.speedKmh)) &&
      Number(run.speedKmh) > 0
    );

    if (!valid.length) return null;

    const speedKmh =
      valid.reduce(
        (sum, run) =>
          sum + Number(run.speedKmh),
        0
      ) / valid.length;

    const realSeconds =
      valid.reduce(
        (sum, run) =>
          sum + Number(run.realSeconds),
        0
      ) / valid.length;

    return {
      count: valid.length,
      speedKmh,
      realSeconds
    };
  }

  function updateMovementTestUi() {
    const distanceMeters =
      movementTestDistanceMeters();

    if (els.movementTestDistance) {
      els.movementTestDistance.textContent =
        formatMapDistance(distanceMeters);
    }

    const active = loadActiveMovementTest();

    document.querySelectorAll(
      '[data-movement-mode]'
    ).forEach(card => {
      const mode =
        card.dataset.movementMode;

      const result =
        card.querySelector(
          `[data-movement-result="${mode}"]`
        );

      const action =
        card.querySelector(
          `[data-movement-action="${mode}"]`
        );

      const average =
        movementModeAverage(mode);

      if (result) {
        if (average) {
          result.textContent =
            `Среднее: ${average.speedKmh.toFixed(2)} км/ч · ${formatMovementElapsed(average.realSeconds)} · замеров ${average.count}`;
        } else {
          result.textContent =
            'Нет замеров';
        }
      }

      if (action) {
        const isThisActive =
          active &&
          active.mode === mode;

        const otherActive =
          active &&
          active.mode !== mode;

        action.textContent =
          isThisActive
            ? 'ФИНИШ'
            : 'СТАРТ';

        action.classList.toggle(
          'danger',
          Boolean(isThisActive)
        );

        action.disabled =
          Boolean(otherActive);
      }
    });

    if (els.movementTestStatus) {
      if (active) {
        els.movementTestStatus.textContent =
          `${MOVEMENT_TEST_MODES[active.mode]}: замер идёт. На SWYD-East Checkpoint нажмите «ФИНИШ».`;
      } else {
        els.movementTestStatus.textContent =
          'Выберите темп и начните замер у моста.';
      }
    }
  }

  function updateMovementLiveTimers() {
    const active =
      loadActiveMovementTest();

    document.querySelectorAll(
      '[data-movement-live]'
    ).forEach(node => {
      const mode =
        node.dataset.movementLive;

      if (
        active &&
        active.mode === mode
      ) {
        const elapsed =
          Math.max(
            0,
            (
              Date.now() -
              Number(active.startedAtMs)
            ) / 1000
          );

        node.textContent =
          formatMovementElapsed(elapsed);
      } else {
        const runs =
          movementModeRuns(mode);

        const latest =
          runs.length
            ? runs[runs.length - 1]
            : null;

        node.textContent =
          latest
            ? formatMovementElapsed(
                Number(latest.realSeconds) || 0
              )
            : '00:00';
      }
    });
  }

  function startMovementTest(mode) {
    if (!MOVEMENT_TEST_MODES[mode]) return;

    updateNow();

    const active = loadActiveMovementTest();

    if (
      active &&
      active.mode !== mode
    ) {
      return;
    }

    if (!active) {
      saveActiveMovementTest({
        mode,
        startedAtMs: Date.now(),
        startAbsoluteGameSeconds:
          Math.round(absoluteGameSeconds),
        startDay: gameDay,
        startTime: formatClock(gameSeconds),
        distanceMeters:
          movementTestDistanceMeters()
      });

      updateMovementTestUi();
      updateMovementLiveTimers();

      if (els.testMessage) {
        els.testMessage.textContent =
          `${MOVEMENT_TEST_MODES[mode]}: старт записан. Идите от моста до SWYD-East Checkpoint.`;
      }

      return;
    }

    finishMovementTest(mode);
  }

  function finishMovementTest(mode) {
    const active = loadActiveMovementTest();

    if (
      !active ||
      active.mode !== mode
    ) {
      return;
    }

    updateNow();

    const finishedAtMs = Date.now();

    const realSeconds =
      Math.max(
        0.1,
        (
          finishedAtMs -
          Number(active.startedAtMs)
        ) / 1000
      );

    const endAbsoluteGameSeconds =
      Math.round(absoluteGameSeconds);

    const zoneSeconds =
      Math.max(
        0,
        endAbsoluteGameSeconds -
        Number(
          active.startAbsoluteGameSeconds
        )
      );

    const distanceMeters =
      Number(active.distanceMeters) > 0
        ? Number(active.distanceMeters)
        : movementTestDistanceMeters();

    const speedKmh =
      (
        distanceMeters / 1000
      ) /
      (
        realSeconds / 3600
      );

    const data = loadMovementTests();

    if (!Array.isArray(data[mode])) {
      data[mode] = [];
    }

    data[mode].push({
      mode,
      modeLabel:
        MOVEMENT_TEST_MODES[mode],
      startedAtMs:
        Number(active.startedAtMs),
      finishedAtMs,
      realSeconds:
        Math.round(realSeconds * 10) / 10,
      zoneSeconds,
      distanceMeters:
        Math.round(distanceMeters),
      speedKmh:
        Math.round(speedKmh * 100) / 100,
      startDay:
        active.startDay,
      startTime:
        active.startTime,
      endDay:
        gameDay,
      endTime:
        formatClock(gameSeconds),
      capturedAt:
        new Date().toISOString()
    });

    // Keep the latest 20 attempts for each pace.
    data[mode] =
      data[mode].slice(-20);

    saveMovementTests(data);
    saveActiveMovementTest(null);

    updateMovementTestUi();
    updateMovementLiveTimers();

    if (els.testMessage) {
      els.testMessage.textContent =
        `${MOVEMENT_TEST_MODES[mode]}: ${formatMovementElapsed(realSeconds)}, ${speedKmh.toFixed(2)} км/ч.`;
    }
  }

  document.querySelectorAll(
    '[data-movement-action]'
  ).forEach(button => {
    button.addEventListener(
      'click',
      () => {
        startMovementTest(
          button.dataset.movementAction
        );
      }
    );
  });

  function updateMovementTestScreenGeometry() {
    if (
      !els.mapMovementTestLayer ||
      !els.mapMovementTestLine ||
      !els.mapMovementTestStart ||
      !els.mapMovementTestEnd
    ) {
      return;
    }

    els.mapMovementTestLayer.style.display =
      mapMovementTestVisible
        ? ''
        : 'none';

    if (!mapMovementTestVisible) {
      return;
    }

    const start =
      routePointToScreen(
        MOVEMENT_TEST_START
      );

    const end =
      routePointToScreen(
        MOVEMENT_TEST_END
      );

    els.mapMovementTestLine.setAttribute(
      'points',
      `${start.x},${start.y} ${end.x},${end.y}`
    );

    els.mapMovementTestStart.setAttribute(
      'cx',
      start.x
    );
    els.mapMovementTestStart.setAttribute(
      'cy',
      start.y
    );

    els.mapMovementTestEnd.setAttribute(
      'cx',
      end.x
    );
    els.mapMovementTestEnd.setAttribute(
      'cy',
      end.y
    );

    if (els.mapMovementTestStartLabel) {
      els.mapMovementTestStartLabel.setAttribute(
        'x',
        start.x + 10
      );
      els.mapMovementTestStartLabel.setAttribute(
        'y',
        start.y - 10
      );
    }

    if (els.mapMovementTestEndLabel) {
      els.mapMovementTestEndLabel.setAttribute(
        'x',
        end.x + 10
      );
      els.mapMovementTestEndLabel.setAttribute(
        'y',
        end.y - 10
      );
    }

    if (els.mapMovementTestDistanceLabel) {
      els.mapMovementTestDistanceLabel.setAttribute(
        'x',
        (start.x + end.x) / 2
      );
      els.mapMovementTestDistanceLabel.setAttribute(
        'y',
        (start.y + end.y) / 2 - 10
      );
      els.mapMovementTestDistanceLabel.textContent =
        formatMapDistance(
          movementTestDistanceMeters()
        );
    }
  }

  function openMovementTestRouteOnMap() {
    mapMovementTestVisible = true;

    if (
      els.testDialog &&
      els.testDialog.open
    ) {
      if (
        typeof els.testDialog.close ===
        'function'
      ) {
        els.testDialog.close();
      } else {
        els.testDialog.removeAttribute(
          'open'
        );
      }
    }

    updateMapZoneTime();
    updateMapFullscreenUI();

    const openMap = () => {
      if (
        typeof els.mapDialog.showModal ===
        'function'
      ) {
        if (!els.mapDialog.open) {
          els.mapDialog.showModal();
        }
      } else {
        els.mapDialog.setAttribute(
          'open',
          ''
        );
      }

      window.requestAnimationFrame(() => {
        fitZoneMap();

        window.setTimeout(() => {
          focusJourneyPoints(
            [
              MOVEMENT_TEST_START,
              MOVEMENT_TEST_END
            ],
            850
          );
          updateMovementTestScreenGeometry();
        }, 120);
      });
    };

    window.requestAnimationFrame(openMap);
  }

  if (els.showMovementTestRouteBtn) {
    els.showMovementTestRouteBtn.addEventListener(
      'click',
      openMovementTestRouteOnMap
    );
  }

  window.setInterval(() => {
    updateMovementLiveTimers();
  }, 500);

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

    const movementTests = loadMovementTests();

    rows.push([]);
    rows.push(['ТЕСТ СКОРОСТИ ПЕРЕДВИЖЕНИЯ']);
    rows.push([
      'Темп',
      'Расстояние, м',
      'Реальное время, сек',
      'Время Зоны, сек',
      'Скорость, км/ч',
      'Старт: день',
      'Старт: время',
      'Финиш: день',
      'Финиш: время',
      'Дата записи'
    ]);

    ['slow', 'fast', 'run'].forEach(mode => {
      const runs = Array.isArray(movementTests[mode])
        ? movementTests[mode]
        : [];

      runs.forEach(run => {
        rows.push([
          MOVEMENT_TEST_MODES[mode],
          run.distanceMeters || '',
          run.realSeconds || '',
          run.zoneSeconds || '',
          run.speedKmh || '',
          run.startDay || '',
          run.startTime || '',
          run.endDay || '',
          run.endTime || '',
          run.capturedAt || ''
        ]);
      });
    });

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
    link.download = 'zone-clock-test-v90.csv';
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
    localStorage.removeItem(MOVEMENT_TEST_STORAGE_KEY);
    localStorage.removeItem(MOVEMENT_TEST_ACTIVE_KEY);
    renderDaylightMarks();
    updateMovementTestUi();
    updateMovementLiveTimers();
    if (els.testMessage) els.testMessage.textContent = 'Тесты времени, движения и отметки освещения очищены.';
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
      updateMovementTestUi();
      updateMovementLiveTimers();

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

  function buildChronometrySeries() {
    return PATCH20_RATE_TABLE.map(
      (rate, index) => ({
        index,
        zoneMinutes: index * 15,
        zoneTime:
          `${String(
            Math.floor(index / 4)
          ).padStart(2, '0')}:` +
          `${String(
            (index % 4) * 15
          ).padStart(2, '0')}`,
        rate,
        realSecondsPerInterval:
          RATE_SLOT_SECONDS / rate
      })
    );
  }

  function chronometryEffectiveAverage() {
    const totalRealSeconds =
      PATCH20_RATE_TABLE.reduce(
        (sum, rate) =>
          sum + RATE_SLOT_SECONDS / rate,
        0
      );

    return {
      totalRealSeconds,
      totalRealMinutes:
        totalRealSeconds / 60,
      effectiveRate:
        DAY_SECONDS / totalRealSeconds
    };
  }

  function drawChronometryChart() {
    if (!els.chronometryChart) return;

    const svg = els.chronometryChart;
    svg.innerHTML = '';

    const series = buildChronometrySeries();
    const average =
      chronometryEffectiveAverage();

    const ns = 'http://www.w3.org/2000/svg';
    const width = 760;
    const height = 400;
    const left = 68;
    const right = 24;
    const top = 34;
    const bottom = 58;
    const plotW = width - left - right;
    const plotH = height - top - bottom;

    const minRate =
      Math.min(
        ...series.map(point => point.rate)
      );

    const maxRate =
      Math.max(
        ...series.map(point => point.rate)
      );

    const yMin =
      Math.max(
        0,
        Math.floor(minRate - 2)
      );

    const yMax =
      Math.ceil(maxRate + 2);

    const xFor = zoneMinutes =>
      left +
      plotW *
        (zoneMinutes / (24 * 60));

    const yFor = rate =>
      top +
      plotH *
        (
          1 -
          (rate - yMin) /
            (yMax - yMin)
        );

    const make = (tag, attrs = {}) => {
      const node =
        document.createElementNS(ns, tag);

      Object.entries(attrs).forEach(
        ([key, value]) =>
          node.setAttribute(key, value)
      );

      return node;
    };

    const addText = (
      x,
      y,
      text,
      className,
      anchor = 'start'
    ) => {
      const node = make('text', {
        x,
        y,
        class: className,
        'text-anchor': anchor
      });

      node.textContent = text;
      svg.appendChild(node);
      return node;
    };

    for (
      let rate = 10;
      rate <= 24;
      rate += 2
    ) {
      if (
        rate < yMin ||
        rate > yMax
      ) {
        continue;
      }

      const y = yFor(rate);

      svg.appendChild(
        make('line', {
          x1: left,
          y1: y,
          x2: left + plotW,
          y2: y,
          class: 'chronometry-grid'
        })
      );

      addText(
        left - 10,
        y + 5,
        `×${rate}`,
        'chronometry-axis-label',
        'end'
      );
    }

    [0, 4, 8, 12, 16, 20, 24]
      .forEach(hour => {
        const x =
          left +
          plotW * (hour / 24);

        svg.appendChild(
          make('line', {
            x1: x,
            y1: top,
            x2: x,
            y2: top + plotH,
            class:
              'chronometry-grid chronometry-grid-vertical'
          })
        );

        addText(
          x,
          height - 26,
          `${String(hour).padStart(2, '0')}:00`,
          'chronometry-axis-label',
          'middle'
        );
      });

    addText(
      left + plotW / 2,
      height - 4,
      'время Зоны',
      'chronometry-axis-title',
      'middle'
    );

    const yTitle = addText(
      18,
      top + plotH / 2,
      'коэффициент скорости',
      'chronometry-axis-title',
      'middle'
    );

    yTitle.setAttribute(
      'transform',
      `rotate(-90 18 ${top + plotH / 2})`
    );

    const avgY =
      yFor(average.effectiveRate);

    svg.appendChild(
      make('line', {
        x1: left,
        y1: avgY,
        x2: left + plotW,
        y2: avgY,
        class: 'chronometry-real-series'
      })
    );

    addText(
      left + 8,
      avgY - 8,
      `среднее ×${average.effectiveRate.toFixed(2)}`,
      'chronometry-average-label'
    );

    const measuredPoints =
      series.map(point => [
        xFor(
          point.zoneMinutes + 7.5
        ),
        yFor(point.rate)
      ]);

    svg.appendChild(
      make('polyline', {
        points: measuredPoints
          .map(
            ([x, y]) =>
              `${x.toFixed(1)},${y.toFixed(1)}`
          )
          .join(' '),
        class: 'chronometry-zone-series'
      })
    );

    measuredPoints.forEach(
      ([x, y], index) => {
        const point = series[index];

        const circle = make('circle', {
          cx: x,
          cy: y,
          r: 2.8,
          class:
            'chronometry-measurement-dot'
        });

        const title =
          document.createElementNS(
            ns,
            'title'
          );

        const endMinutes =
          point.zoneMinutes + 15;

        const startHour =
          Math.floor(
            point.zoneMinutes / 60
          );

        const startMinute =
          point.zoneMinutes % 60;

        const endHour =
          Math.floor(
            endMinutes / 60
          ) % 24;

        const endMinute =
          endMinutes % 60;

        title.textContent =
          `${String(startHour).padStart(2, '0')}:` +
          `${String(startMinute).padStart(2, '0')} · ` +
          `скорость времени ×${point.rate.toFixed(2)}`;

        circle.appendChild(title);
        svg.appendChild(circle);
      }
    );

    const minPoint =
      series.reduce(
        (best, point) =>
          point.rate < best.rate
            ? point
            : best,
        series[0]
      );

    const maxPoint =
      series.reduce(
        (best, point) =>
          point.rate > best.rate
            ? point
            : best,
        series[0]
      );

    const markExtreme = (
      point,
      label,
      className,
      verticalOffset
    ) => {
      const x =
        xFor(
          point.zoneMinutes + 7.5
        );

      const y =
        yFor(point.rate);

      svg.appendChild(
        make('circle', {
          cx: x,
          cy: y,
          r: 5.2,
          class: className
        })
      );

      addText(
        x,
        y + verticalOffset,
        `${label} ×${point.rate.toFixed(2)}`,
        className + '-label',
        'middle'
      );
    };

    markExtreme(
      minPoint,
      'МИН',
      'chronometry-min-dot',
      22
    );

    markExtreme(
      maxPoint,
      'МАКС',
      'chronometry-max-dot',
      -14
    );

    if (els.chronometrySummary) {
      const minReal =
        RATE_SLOT_SECONDS /
        minPoint.rate;

      const maxReal =
        RATE_SLOT_SECONDS /
        maxPoint.rate;

      const variation =
        maxPoint.rate /
        minPoint.rate;

      els.chronometrySummary.textContent =
        `Наблюдаемая скорость времени меняется в диапазоне ×${minPoint.rate.toFixed(2)}–×${maxPoint.rate.toFixed(2)} (${variation.toFixed(2)} раза между крайними режимами). Полные сутки Зоны проходят примерно за ${average.totalRealMinutes.toFixed(1)} реальных мин. В наиболее медленной фазе ход времени заметно растягивается, а в наиболее быстрой — резко ускоряется.`;
    }
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

  function openChronometryDialog() {
    if (!els.chronometryDialog) return;

    const reopenSettings = Boolean(
      els.settingsDialog &&
      els.settingsDialog.open
    );

    if (reopenSettings) {
      closeSettings();
    }

    els.chronometryDialog.dataset.reopenSettings =
      reopenSettings ? '1' : '0';

    if (
      typeof els.chronometryDialog.showModal ===
      'function'
    ) {
      els.chronometryDialog.showModal();
    } else {
      els.chronometryDialog.setAttribute(
        'open',
        ''
      );
    }

    window.requestAnimationFrame(() => {
      drawChronometryChart();
    });
  }

  function closeChronometryDialog() {
    if (!els.chronometryDialog) return;

    const reopenSettings =
      els.chronometryDialog.dataset
        .reopenSettings === '1';

    if (
      typeof els.chronometryDialog.close ===
        'function' &&
      els.chronometryDialog.open
    ) {
      els.chronometryDialog.close();
    } else {
      els.chronometryDialog.removeAttribute(
        'open'
      );
    }

    els.chronometryDialog.dataset.reopenSettings =
      '0';

    if (reopenSettings) {
      window.setTimeout(
        openSettings,
        80
      );
    }
  }

  if (els.openChronometryBtn) {
    els.openChronometryBtn.addEventListener(
      'click',
      openChronometryDialog
    );
  }

  if (els.closeChronometryBtn) {
    els.closeChronometryBtn.addEventListener(
      'click',
      closeChronometryDialog
    );
  }

  if (els.chronometryDialog) {
    els.chronometryDialog.addEventListener(
      'click',
      event => {
        if (
          event.target ===
          els.chronometryDialog
        ) {
          closeChronometryDialog();
        }
      }
    );
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
