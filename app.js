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

  const MAP_PRESET_ROUTE_STORAGE_KEY =
    'stalker2-zone-clock-preset-route-visible-v2';
  const MAP_PRESET_ROUTE_SELECTED_KEY =
    'stalker2-zone-clock-preset-route-selected-v2';

  const MAP_PRESET_ROUTES = {
    garbage_cement_cooling: {
      key: 'garbage_cement_cooling',
      label: 'СВАЛКА → ЦЕМЕНТНЫЙ ЗАВОД → ГРАДИРНИ',
      roadPath: `M1263.0,879.5L1263.5,880.0M1263.5,880.0L1263.5,880.5M1263.5,880.5L1264.0,881.0M1264.0,881.0L1264.5,881.5M1264.5,881.5L1264.5,882.0M1264.5,882.0L1264.5,882.5M1264.5,882.5L1264.5,883.0M1264.5,883.0L1264.5,883.5M1264.5,883.5L1265.0,884.0M1265.0,884.0L1265.5,884.5M1265.5,884.5L1265.5,885.0M1265.5,885.0L1265.5,885.5M1265.5,885.5L1266.0,886.0M1266.0,886.0L1265.5,886.5M1266.0,886.0L1266.0,886.5M1266.0,886.0L1266.5,886.5M1265.5,886.5L1266.0,886.5M1265.5,886.5L1265.0,887.0M1266.0,886.5L1266.5,886.5M1266.5,886.5L1267.0,887.0M1265.0,887.0L1264.5,887.5M1267.0,887.0L1267.0,887.5M1264.0,887.5L1264.5,887.5M1267.0,887.5L1267.0,888.0M1269.5,887.5L1270.0,887.5M1269.5,887.5L1269.0,888.0M1267.0,888.0L1267.0,888.5M1267.0,888.0L1267.5,888.5M1268.5,888.0L1269.0,888.0M1268.5,888.0L1268.0,888.5M1267.0,888.5L1267.5,888.5M1267.0,888.5L1267.0,889.0M1267.5,888.5L1268.0,888.5M1267.5,888.5L1267.0,889.0M1267.0,889.0L1267.0,889.5M1267.0,889.5L1267.0,890.0M1267.0,890.0L1267.0,890.5M1267.0,890.5L1266.5,891.0M1266.5,891.0L1266.5,891.5M1266.5,891.5L1266.0,892.0M1266.0,892.0L1266.0,892.5M1266.0,892.5L1265.5,893.0M1265.5,893.0L1265.5,893.5M1265.5,893.5L1265.0,894.0M1265.0,894.0L1265.0,894.5M1265.0,894.5L1264.5,895.0M1264.5,895.0L1264.5,895.5M1264.5,895.5L1264.0,896.0M1264.0,896.0L1263.5,896.5M1263.5,896.5L1263.5,897.0M1263.5,897.0L1263.0,897.5M1263.0,897.5L1263.0,898.0M1263.0,898.0L1262.5,898.5M1262.5,898.5L1262.5,899.0M1262.5,899.0L1262.5,899.5M1262.5,899.5L1262.0,900.0M1262.0,900.0L1262.0,900.5M1262.0,900.5L1262.0,901.0M1262.0,901.0L1262.0,901.5M1262.0,901.5L1262.5,902.0M1262.5,902.0L1262.5,902.5M1262.5,902.5L1262.5,903.0M1262.5,903.0L1262.5,903.5M1262.5,903.5L1262.5,904.0M1262.5,904.0L1263.0,904.5M1263.0,904.5L1263.0,905.0M1263.0,905.0L1263.0,905.5M1263.0,905.5L1263.5,906.0M1263.5,906.0L1263.5,906.5M1263.5,906.5L1263.5,907.0M1263.5,907.0L1263.5,907.5M1263.5,907.5L1263.5,908.0M1263.5,908.0L1264.0,908.5M1264.0,908.5L1264.0,909.0M1264.0,909.0L1264.0,909.5M1264.0,909.5L1264.0,910.0M1264.0,910.0L1264.0,910.5M1264.0,910.5L1264.5,911.0M1264.5,911.0L1264.5,911.5M1264.5,911.5L1264.5,912.0M1264.5,912.0L1265.0,912.5M1265.0,912.5L1265.5,913.0M1265.5,913.0L1266.0,913.5M1266.0,913.5L1266.5,913.5M1266.5,913.5L1267.0,913.5M1267.0,913.5L1267.5,914.0M1267.5,914.0L1268.0,914.0M1268.0,914.0L1268.5,914.0M1268.5,914.0L1269.0,914.5M1269.0,914.5L1269.5,915.0M1270.5,914.5L1271.0,914.5M1270.5,914.5L1270.0,915.0M1269.5,915.0L1270.0,915.0M1269.5,915.0L1269.5,915.5M1270.0,915.0L1269.5,915.5M1269.5,915.5L1269.0,916.0M1269.0,916.0L1269.0,916.5M1269.0,916.5L1269.0,917.0M1269.0,917.0L1269.0,917.5M1269.0,917.5L1269.0,918.0M1269.0,918.0L1269.0,918.5M1269.0,918.5L1268.5,919.0M1224.5,919.0L1225.0,919.0M1224.5,919.0L1224.0,919.5M1225.0,919.0L1225.5,919.5M1268.5,919.0L1268.5,919.5M1223.5,919.5L1224.0,919.5M1223.5,919.5L1223.0,920.0M1225.5,919.5L1226.0,919.5M1226.0,919.5L1226.5,919.5M1226.5,919.5L1227.0,920.0M1268.5,919.5L1268.5,920.0M1223.0,920.0L1222.5,920.5M1227.0,920.0L1227.5,920.0M1227.5,920.0L1228.0,920.5M1268.5,920.0L1268.0,920.5M1222.5,920.5L1222.0,921.0M1228.0,920.5L1228.5,920.5M1228.5,920.5L1229.0,920.5M1229.0,920.5L1229.5,921.0M1268.0,920.5L1268.0,921.0M1222.0,921.0L1221.5,921.5M1229.5,921.0L1230.0,921.0M1230.0,921.0L1230.5,921.5M1268.0,921.0L1267.5,921.5M1221.5,921.5L1221.0,922.0M1230.5,921.5L1231.0,921.5M1231.0,921.5L1231.5,921.5M1231.5,921.5L1232.0,922.0M1267.5,921.5L1267.5,922.0M1221.0,922.0L1221.0,922.5M1232.0,922.0L1232.5,922.0M1232.5,922.0L1233.0,922.5M1267.5,922.0L1267.0,922.5M1221.0,922.5L1220.5,923.0M1233.0,922.5L1233.5,922.5M1233.5,922.5L1234.0,923.0M1267.0,922.5L1267.0,923.0M1220.5,923.0L1220.0,923.5M1234.0,923.0L1234.5,923.0M1234.5,923.0L1235.0,923.0M1235.0,923.0L1235.5,923.5M1267.0,923.0L1266.5,923.5M1220.0,923.5L1219.5,924.0M1235.5,923.5L1236.0,923.5M1236.0,923.5L1236.5,924.0M1266.5,923.5L1266.5,924.0M1219.5,924.0L1219.0,924.5M1236.5,924.0L1237.0,924.0M1237.0,924.0L1237.5,924.5M1266.5,924.0L1266.5,924.5M1219.0,924.5L1218.5,925.0M1237.5,924.5L1238.0,924.5M1238.0,924.5L1238.5,924.5M1238.5,924.5L1239.0,925.0M1266.5,924.5L1266.0,925.0M1218.5,925.0L1218.0,925.5M1239.0,925.0L1239.5,925.0M1239.5,925.0L1240.0,925.5M1266.0,925.0L1266.0,925.5M1218.0,925.5L1217.5,926.0M1240.0,925.5L1240.5,925.5M1240.5,925.5L1241.0,926.0M1266.0,925.5L1265.5,926.0M1217.5,926.0L1217.0,926.5M1241.0,926.0L1241.5,926.0M1241.5,926.0L1242.0,926.0M1242.0,926.0L1242.5,926.5M1265.5,926.0L1265.5,926.5M1217.0,926.5L1216.5,927.0M1242.5,926.5L1243.0,926.5M1243.0,926.5L1243.5,927.0M1265.5,926.5L1265.0,927.0M1216.5,927.0L1216.0,927.5M1243.5,927.0L1244.0,927.0M1244.0,927.0L1244.5,927.5M1265.0,927.0L1265.0,927.5M1216.0,927.5L1215.5,928.0M1244.5,927.5L1245.0,927.5M1245.0,927.5L1245.5,927.5M1245.5,927.5L1246.0,928.0M1265.0,927.5L1265.0,928.0M1214.5,928.0L1215.0,928.0M1214.5,928.0L1214.0,928.5M1215.0,928.0L1215.5,928.0M1246.0,928.0L1246.5,928.0M1246.5,928.0L1247.0,928.5M1265.0,928.0L1264.5,928.5M1211.5,928.5L1212.0,928.5M1211.5,928.5L1211.0,929.0M1212.0,928.5L1212.5,928.5M1212.5,928.5L1213.0,928.5M1213.0,928.5L1213.5,928.5M1213.5,928.5L1214.0,928.5M1247.0,928.5L1247.5,928.5M1247.5,928.5L1248.0,928.5M1248.0,928.5L1248.5,929.0M1264.5,928.5L1264.5,929.0M1208.5,929.0L1209.0,929.0M1208.5,929.0L1208.0,929.5M1209.0,929.0L1209.5,929.0M1209.5,929.0L1210.0,929.0M1210.0,929.0L1210.5,929.0M1210.5,929.0L1211.0,929.0M1248.5,929.0L1249.0,929.0M1249.0,929.0L1249.5,929.5M1264.5,929.0L1264.0,929.5M1204.0,929.5L1204.5,929.5M1204.0,929.5L1203.5,930.0M1204.5,929.5L1205.0,929.5M1205.0,929.5L1205.5,929.5M1205.5,929.5L1206.0,929.5M1206.0,929.5L1206.5,929.5M1206.5,929.5L1207.0,929.5M1207.0,929.5L1207.5,929.5M1207.5,929.5L1208.0,929.5M1249.5,929.5L1250.0,929.5M1250.0,929.5L1250.5,930.0M1264.0,929.5L1264.0,930.0M1203.5,930.0L1203.0,930.5M1250.5,930.0L1251.0,930.0M1251.0,930.0L1251.5,930.0M1251.5,930.0L1252.0,930.5M1264.0,930.0L1263.5,930.5M1203.0,930.5L1203.0,931.0M1252.0,930.5L1252.5,930.5M1252.5,930.5L1253.0,931.0M1263.5,930.5L1263.5,931.0M1203.0,931.0L1203.0,931.5M1253.0,931.0L1253.5,931.0M1253.5,931.0L1254.0,931.5M1263.5,931.0L1263.5,931.5M1203.0,931.5L1203.0,932.0M1254.0,931.5L1254.5,931.5M1254.5,931.5L1255.0,931.5M1255.0,931.5L1255.5,932.0M1263.5,931.5L1263.0,932.0M957.0,932.0L957.5,932.5M1203.0,932.0L1203.0,932.5M1255.5,932.0L1256.0,932.0M1256.0,932.0L1256.5,932.5M1263.0,932.0L1263.0,932.5M957.5,932.5L958.0,933.0M1203.0,932.5L1203.0,933.0M1256.5,932.5L1257.0,932.5M1257.0,932.5L1257.5,933.0M1263.0,932.5L1263.0,933.0M958.0,933.0L958.5,933.5M1203.0,933.0L1203.0,933.5M1257.5,933.0L1258.0,933.0M1258.0,933.0L1258.5,933.0M1258.5,933.0L1259.0,933.5M1263.0,933.0L1262.5,933.5M958.5,933.5L959.0,934.0M1203.0,933.5L1203.0,934.0M1259.0,933.5L1259.5,933.5M1259.5,933.5L1260.0,933.5M1260.0,933.5L1260.5,933.5M1260.5,933.5L1261.0,934.0M1262.5,933.5L1262.5,934.0M959.0,934.0L959.5,934.0M959.5,934.0L960.0,934.5M1203.0,934.0L1203.0,934.5M1261.0,934.0L1261.5,934.0M1261.5,934.0L1262.0,934.5M1262.5,934.0L1262.0,934.5M960.0,934.5L960.5,935.0M1203.0,934.5L1203.5,935.0M1262.0,934.5L1262.0,935.0M960.5,935.0L961.0,935.5M1203.5,935.0L1203.5,935.5M1262.0,935.0L1262.0,935.5M961.0,935.5L961.5,936.0M1203.5,935.5L1203.5,936.0M1262.0,935.5L1262.0,936.0M1262.0,935.5L1262.5,936.0M1274.0,935.5L1274.5,935.5M1274.0,935.5L1273.5,936.0M1274.5,935.5L1275.0,936.0M961.5,936.0L962.0,936.5M1203.5,936.0L1203.5,936.5M1262.0,936.0L1262.5,936.0M1262.0,936.0L1261.5,936.5M1262.5,936.0L1263.0,936.0M1263.0,936.0L1263.5,936.0M1263.5,936.0L1264.0,936.5M1273.5,936.0L1273.0,936.5M1275.0,936.0L1275.5,936.0M1275.5,936.0L1276.0,936.0M1276.0,936.0L1276.5,936.0M1276.5,936.0L1277.0,936.0M1277.0,936.0L1277.5,936.5M962.0,936.5L962.5,937.0M1203.5,936.5L1203.5,937.0M1261.5,936.5L1261.0,937.0M1264.0,936.5L1264.5,936.5M1264.5,936.5L1265.0,936.5M1265.0,936.5L1265.5,936.5M1265.5,936.5L1266.0,937.0M1273.0,936.5L1272.5,937.0M1277.5,936.5L1278.0,936.5M1278.0,936.5L1278.5,937.0M962.5,937.0L963.0,937.5M1203.5,937.0L1203.5,937.5M1261.0,937.0L1261.0,937.5M1266.0,937.0L1266.5,937.0M1266.5,937.0L1267.0,937.0M1267.0,937.0L1267.5,937.0M1267.5,937.0L1268.0,937.5M1272.5,937.0L1272.0,937.5M1278.5,937.0L1279.0,937.0M1279.0,937.0L1279.5,937.5M963.0,937.5L963.5,938.0M1203.5,937.5L1203.5,938.0M1261.0,937.5L1260.5,938.0M1268.0,937.5L1268.5,937.5M1268.5,937.5L1269.0,937.5M1269.0,937.5L1269.5,937.5M1269.5,937.5L1270.0,937.5M1270.0,937.5L1270.5,937.5M1270.5,937.5L1271.0,937.5M1271.0,937.5L1271.5,937.5M1271.0,937.5L1271.5,938.0M1271.5,937.5L1272.0,937.5M1271.5,937.5L1271.5,938.0M1272.0,937.5L1271.5,938.0M1279.5,937.5L1280.0,937.5M1280.0,937.5L1280.5,938.0M963.5,938.0L964.0,938.5M1203.5,938.0L1203.5,938.5M1260.5,938.0L1260.5,938.5M1271.5,938.0L1272.0,938.5M1280.5,938.0L1281.0,938.0M1281.0,938.0L1281.5,938.0M1281.5,938.0L1282.0,938.5M964.0,938.5L964.5,939.0M1203.5,938.5L1203.5,939.0M1260.5,938.5L1260.0,939.0M1282.0,938.5L1282.5,938.5M1282.5,938.5L1283.0,939.0M964.5,939.0L965.0,939.5M1203.5,939.0L1204.0,939.5M1260.0,939.0L1260.0,939.5M1283.0,939.0L1283.5,939.0M1283.5,939.0L1284.0,939.5M965.0,939.5L965.5,939.5M965.5,939.5L966.0,940.0M1204.0,939.5L1204.0,940.0M1260.0,939.5L1259.5,940.0M1284.0,939.5L1284.5,939.5M1284.5,939.5L1285.0,940.0M966.0,940.0L966.5,940.5M1204.0,940.0L1204.0,940.5M1259.5,940.0L1259.5,940.5M1285.0,940.0L1285.5,940.0M1285.5,940.0L1286.0,940.0M1286.0,940.0L1286.5,940.5M966.5,940.5L967.0,941.0M1204.0,940.5L1204.0,941.0M1259.5,940.5L1259.0,941.0M1286.5,940.5L1287.0,940.5M1287.0,940.5L1287.5,941.0M967.0,941.0L967.5,941.5M1204.0,941.0L1204.0,941.5M1259.0,941.0L1259.0,941.5M1287.5,941.0L1288.0,941.0M1288.0,941.0L1288.5,941.5M967.5,941.5L968.0,942.0M1204.0,941.5L1204.0,942.0M1259.0,941.5L1258.5,942.0M1288.5,941.5L1289.0,941.5M1289.0,941.5L1289.5,942.0M968.0,942.0L968.5,942.5M1204.0,942.0L1204.0,942.5M1258.5,942.0L1258.5,942.5M1289.5,942.0L1290.0,942.0M1290.0,942.0L1290.5,942.0M1290.5,942.0L1291.0,942.5M968.5,942.5L969.0,943.0M1204.0,942.5L1204.0,943.0M1258.5,942.5L1258.5,943.0M1291.0,942.5L1291.5,942.5M1291.5,942.5L1292.0,943.0M969.0,943.0L969.0,943.5M1204.0,943.0L1204.0,943.5M1258.5,943.0L1258.0,943.5M1292.0,943.0L1292.5,943.0M1292.5,943.0L1293.0,943.5M969.0,943.5L969.5,944.0M1204.0,943.5L1204.5,944.0M1258.0,943.5L1258.0,944.0M1293.0,943.5L1293.5,943.5M1293.5,943.5L1294.0,944.0M969.5,944.0L970.0,944.5M1204.5,944.0L1204.5,944.5M1258.0,944.0L1257.5,944.5M1294.0,944.0L1294.5,944.0M1294.5,944.0L1295.0,944.0M1295.0,944.0L1295.5,944.5M970.0,944.5L970.5,945.0M1204.5,944.5L1204.5,945.0M1257.5,944.5L1257.5,945.0M1295.5,944.5L1296.0,944.5M1296.0,944.5L1296.5,945.0M970.5,945.0L971.0,945.5M1204.5,945.0L1204.5,945.5M1257.5,945.0L1257.0,945.5M1296.5,945.0L1297.0,945.0M1297.0,945.0L1297.5,945.5M971.0,945.5L971.5,946.0M1204.5,945.5L1204.5,946.0M1257.0,945.5L1257.0,946.0M1297.5,945.5L1298.0,945.5M1298.0,945.5L1298.5,946.0M971.5,946.0L972.0,946.5M1204.5,946.0L1204.5,946.5M1257.0,946.0L1257.0,946.5M1298.5,946.0L1299.0,946.0M1299.0,946.0L1299.5,946.0M1299.5,946.0L1300.0,946.5M972.0,946.5L972.0,947.0M1204.5,946.5L1204.5,947.0M1257.0,946.5L1256.5,947.0M1300.0,946.5L1300.5,946.5M1300.5,946.5L1301.0,947.0M972.0,947.0L972.5,947.5M1204.5,947.0L1204.5,947.5M1256.5,947.0L1256.5,947.5M1301.0,947.0L1301.5,947.0M1301.5,947.0L1302.0,947.5M972.5,947.5L972.5,948.0M1204.5,947.5L1204.5,948.0M1256.5,947.5L1256.0,948.0M1302.0,947.5L1302.5,947.5M1302.5,947.5L1303.0,948.0M972.5,948.0L973.0,948.5M1204.5,948.0L1204.5,948.5M1256.0,948.0L1256.0,948.5M1303.0,948.0L1303.5,948.0M1303.5,948.0L1304.0,948.0M1304.0,948.0L1304.5,948.5M973.0,948.5L973.0,949.0M1204.5,948.5L1204.5,949.0M1256.0,948.5L1255.5,949.0M1304.5,948.5L1305.0,948.5M1305.0,948.5L1305.5,949.0M973.0,949.0L973.0,949.5M1204.5,949.0L1204.5,949.5M1255.5,949.0L1255.5,949.5M1305.5,949.0L1306.0,949.0M1306.0,949.0L1306.5,949.5M973.0,949.5L973.5,950.0M1204.5,949.5L1204.5,950.0M1255.5,949.5L1255.0,950.0M1306.5,949.5L1307.0,949.5M1307.0,949.5L1307.5,950.0M973.5,950.0L973.5,950.5M1204.5,950.0L1204.5,950.5M1255.0,950.0L1255.0,950.5M1307.5,950.0L1308.0,950.0M1308.0,950.0L1308.5,950.0M1308.5,950.0L1309.0,950.5M973.5,950.5L974.0,951.0M1204.5,950.5L1204.5,951.0M1255.0,950.5L1255.0,951.0M1309.0,950.5L1309.5,950.5M1309.5,950.5L1310.0,951.0M974.0,951.0L974.0,951.5M1204.5,951.0L1204.5,951.5M1255.0,951.0L1254.5,951.5M1310.0,951.0L1310.5,951.0M1310.5,951.0L1311.0,951.5M974.0,951.5L974.0,952.0M1204.5,951.5L1204.0,952.0M1254.5,951.5L1254.5,952.0M1311.0,951.5L1311.5,951.5M1311.5,951.5L1312.0,952.0M974.0,952.0L974.0,952.5M1204.0,952.0L1204.0,952.5M1254.5,952.0L1254.0,952.5M1312.0,952.0L1312.5,952.0M1312.5,952.0L1313.0,952.0M1313.0,952.0L1313.5,952.5M974.0,952.5L974.5,953.0M1204.0,952.5L1203.5,953.0M1254.0,952.5L1254.0,953.0M1313.5,952.5L1314.0,952.5M1314.0,952.5L1314.5,953.0M974.5,953.0L974.5,953.5M1203.5,953.0L1203.0,953.5M1254.0,953.0L1253.5,953.5M1314.5,953.0L1315.0,953.0M1315.0,953.0L1315.5,953.5M974.5,953.5L975.0,954.0M1203.0,953.5L1203.0,954.0M1253.5,953.5L1253.5,954.0M1315.5,953.5L1316.0,953.5M1316.0,953.5L1316.5,954.0M975.0,954.0L975.0,954.5M1203.0,954.0L1202.5,954.5M1316.5,954.0L1317.0,954.0M1317.0,954.0L1317.5,954.0M1317.5,954.0L1318.0,954.5M975.0,954.5L975.0,955.0M1202.5,954.5L1202.0,955.0M1318.0,954.5L1318.5,954.5M1318.5,954.5L1319.0,955.0M975.0,955.0L975.5,955.5M1202.0,955.0L1202.0,955.5M1319.0,955.0L1319.5,955.0M1319.5,955.0L1320.0,955.5M975.5,955.5L975.5,956.0M1202.0,955.5L1201.5,956.0M1320.0,955.5L1320.5,955.5M1320.5,955.5L1321.0,956.0M975.5,956.0L976.0,956.5M1201.5,956.0L1201.5,956.5M1321.0,956.0L1321.5,956.0M1321.5,956.0L1322.0,956.5M976.0,956.5L976.0,957.0M1201.5,956.5L1201.0,957.0M1322.0,956.5L1322.0,957.0M976.0,957.0L976.5,957.5M1201.0,957.0L1200.5,957.5M1322.0,957.0L1322.0,957.5M976.5,957.5L976.5,958.0M1200.5,957.5L1200.0,958.0M1322.0,957.5L1322.0,958.0M976.5,958.0L976.5,958.5M1200.0,958.0L1200.0,958.5M1322.0,958.0L1322.0,958.5M976.5,958.5L977.0,959.0M1200.0,958.5L1199.5,959.0M1322.0,958.5L1322.0,959.0M977.0,959.0L977.0,959.5M1199.5,959.0L1199.5,959.5M1322.0,959.0L1321.5,959.5M977.0,959.5L977.0,960.0M977.0,959.5L977.5,960.0M1199.5,959.5L1199.0,960.0M1321.5,959.5L1321.5,960.0M977.0,960.0L977.5,960.0M977.0,960.0L977.0,960.5M977.5,960.0L977.0,960.5M977.5,960.0L978.0,960.5M1199.0,960.0L1198.5,960.5M1321.5,960.0L1321.5,960.5M977.0,960.5L976.5,961.0M978.0,960.5L978.5,960.5M978.5,960.5L979.0,960.5M979.0,960.5L979.5,961.0M1198.5,960.5L1198.0,961.0M1321.5,960.5L1321.5,961.0M976.5,961.0L976.5,961.5M979.5,961.0L980.0,961.0M980.0,961.0L980.5,961.0M980.5,961.0L981.0,961.0M981.0,961.0L981.5,961.0M981.5,961.0L982.0,961.5M1198.0,961.0L1198.0,961.5M1321.5,961.0L1321.5,961.5M976.5,961.5L976.5,962.0M982.0,961.5L982.5,961.5M982.5,961.5L983.0,961.5M983.0,961.5L983.5,961.5M983.5,961.5L984.0,961.5M984.0,961.5L984.5,962.0M1198.0,961.5L1197.5,962.0M1321.5,961.5L1321.5,962.0M976.5,962.0L976.5,962.5M984.5,962.0L985.0,962.0M985.0,962.0L985.5,962.0M985.5,962.0L986.0,962.0M986.0,962.0L986.5,962.5M1197.5,962.0L1197.0,962.5M1321.5,962.0L1321.0,962.5M976.5,962.5L976.5,963.0M986.5,962.5L987.0,962.5M987.0,962.5L987.5,962.5M987.5,962.5L988.0,962.5M988.0,962.5L988.5,963.0M1197.0,962.5L1197.0,963.0M1321.0,962.5L1321.0,963.0M976.5,963.0L976.5,963.5M988.5,963.0L989.0,963.0M989.0,963.0L989.5,963.0M989.5,963.0L990.0,963.0M990.0,963.0L990.5,963.0M990.5,963.0L991.0,963.0M991.0,963.0L991.5,963.5M1197.0,963.0L1196.5,963.5M1321.0,963.0L1320.5,963.5M976.5,963.5L976.5,964.0M991.5,963.5L992.0,963.5M992.0,963.5L992.5,963.5M992.5,963.5L993.0,963.5M993.0,963.5L993.5,964.0M1196.5,963.5L1196.0,964.0M1320.5,963.5L1320.0,964.0M976.5,964.0L976.5,964.5M993.5,964.0L994.0,964.0M994.0,964.0L994.5,964.0M994.5,964.0L995.0,964.0M995.0,964.0L995.5,964.0M995.5,964.0L996.0,964.5M1196.0,964.0L1196.0,964.5M976.5,964.5L977.0,965.0M996.0,964.5L996.5,964.5M996.5,964.5L997.0,964.5M997.0,964.5L997.5,965.0M1196.0,964.5L1195.5,965.0M977.0,965.0L977.0,965.5M997.5,965.0L998.0,965.0M998.0,965.0L998.5,965.0M998.5,965.0L999.0,965.0M999.0,965.0L999.5,965.0M999.5,965.0L1000.0,965.5M1195.5,965.0L1195.0,965.5M977.0,965.5L977.0,966.0M1000.0,965.5L1000.5,965.5M1000.5,965.5L1001.0,965.5M1001.0,965.5L1001.5,965.5M1001.5,965.5L1002.0,965.5M1002.0,965.5L1002.5,965.5M1002.5,965.5L1003.0,966.0M1195.0,965.5L1195.0,966.0M977.0,966.0L977.0,966.5M1003.0,966.0L1003.5,966.0M1003.5,966.0L1004.0,966.0M1004.0,966.0L1004.5,966.5M1195.0,966.0L1194.5,966.5M977.0,966.5L977.0,967.0M1004.5,966.5L1005.0,966.5M1005.0,966.5L1005.5,966.5M1005.5,966.5L1006.0,966.5M1006.0,966.5L1006.5,967.0M1194.5,966.5L1194.0,967.0M977.0,967.0L977.0,967.5M1006.5,967.0L1007.0,967.0M1007.0,967.0L1007.5,967.0M1007.5,967.0L1008.0,967.0M1008.0,967.0L1008.5,967.0M1008.5,967.0L1009.0,967.5M1194.0,967.0L1194.0,967.5M977.0,967.5L977.0,968.0M1009.0,967.5L1009.5,967.5M1009.5,967.5L1010.0,967.5M1010.0,967.5L1010.5,967.5M1010.5,967.5L1011.0,968.0M1019.5,967.5L1019.5,968.0M1194.0,967.5L1193.5,968.0M977.0,968.0L977.0,968.5M1011.0,968.0L1011.5,968.0M1011.5,968.0L1012.0,968.0M1012.0,968.0L1012.5,968.5M1019.5,968.0L1019.5,968.5M1193.5,968.0L1193.0,968.5M977.0,968.5L977.0,969.0M1012.5,968.5L1013.0,968.5M1013.0,968.5L1013.5,968.5M1013.5,968.5L1014.0,968.5M1014.0,968.5L1014.5,969.0M1019.5,968.5L1019.5,969.0M1193.0,968.5L1193.0,969.0M977.0,969.0L977.0,969.5M1014.5,969.0L1015.0,969.0M1015.0,969.0L1015.5,969.0M1015.5,969.0L1016.0,969.0M1016.0,969.0L1016.5,969.0M1016.5,969.0L1017.0,969.5M1019.5,969.0L1019.0,969.5M1019.5,969.0L1019.5,969.5M1193.0,969.0L1192.5,969.5M977.0,969.5L977.0,970.0M1017.0,969.5L1017.5,969.5M1017.5,969.5L1018.0,969.5M1018.0,969.5L1018.5,969.5M1018.5,969.5L1019.0,969.5M1019.0,969.5L1019.5,969.5M1019.5,969.5L1020.0,970.0M1192.5,969.5L1192.5,970.0M977.0,970.0L977.0,970.5M1020.0,970.0L1020.5,970.0M1020.5,970.0L1021.0,970.5M1192.5,970.0L1192.0,970.5M977.0,970.5L977.0,971.0M1021.0,970.5L1021.5,970.5M1021.5,970.5L1022.0,970.5M1022.0,970.5L1022.5,971.0M1192.0,970.5L1191.5,971.0M977.0,971.0L977.5,971.5M1022.5,971.0L1023.0,971.0M1023.0,971.0L1023.5,971.0M1023.5,971.0L1024.0,971.0M1024.0,971.0L1024.5,971.5M1191.5,971.0L1191.5,971.5M977.5,971.5L977.5,972.0M1024.5,971.5L1025.0,971.5M1025.0,971.5L1025.5,971.5M1025.5,971.5L1026.0,971.5M1026.0,971.5L1026.5,971.5M1026.5,971.5L1027.0,972.0M1191.5,971.5L1191.0,972.0M977.5,972.0L977.5,972.5M1027.0,972.0L1027.5,972.0M1027.5,972.0L1028.0,972.0M1028.0,972.0L1028.5,972.0M1028.5,972.0L1029.0,972.5M1191.0,972.0L1190.5,972.5M977.5,972.5L977.5,973.0M1029.0,972.5L1029.5,972.5M1029.5,972.5L1030.0,972.5M1030.0,972.5L1030.5,972.5M1030.5,972.5L1031.0,973.0M1190.5,972.5L1190.5,973.0M977.5,973.0L977.5,973.5M1031.0,973.0L1031.5,973.0M1031.5,973.0L1032.0,973.0M1032.0,973.0L1032.5,973.0M1032.5,973.0L1033.0,973.0M1033.0,973.0L1033.5,973.0M1033.5,973.0L1034.0,973.5M1190.5,973.0L1190.0,973.5M977.5,973.5L977.5,974.0M1034.0,973.5L1034.5,973.5M1034.5,973.5L1035.0,973.5M1035.0,973.5L1035.5,973.5M1035.5,973.5L1036.0,973.5M1036.0,973.5L1036.5,973.5M1036.0,973.5L1036.5,974.0M1036.5,973.5L1037.0,973.5M1036.5,973.5L1036.5,974.0M1037.0,973.5L1036.5,974.0M1037.0,973.5L1037.5,974.0M1190.0,973.5L1189.5,974.0M977.5,974.0L977.5,974.5M1036.5,974.0L1036.5,974.5M1037.5,974.0L1038.0,974.0M1038.0,974.0L1038.5,974.0M1038.5,974.0L1039.0,974.0M1039.0,974.0L1039.5,974.0M1039.5,974.0L1040.0,974.0M1040.0,974.0L1040.5,974.0M1040.5,974.0L1041.0,974.0M1041.0,974.0L1041.5,974.0M1041.5,974.0L1042.0,974.0M1042.0,974.0L1042.5,974.0M1042.5,974.0L1043.0,974.5M1189.5,974.0L1189.0,974.5M977.5,974.5L977.5,975.0M1036.5,974.5L1036.5,975.0M1043.0,974.5L1043.5,974.5M1043.5,974.5L1044.0,974.5M1044.0,974.5L1044.5,974.5M1044.5,974.5L1045.0,974.5M1045.0,974.5L1045.5,974.5M1045.5,974.5L1046.0,974.5M1046.0,974.5L1046.5,974.5M1046.5,974.5L1047.0,975.0M1189.0,974.5L1189.0,975.0M977.5,975.0L977.5,975.5M1047.0,975.0L1047.5,975.0M1047.5,975.0L1048.0,975.0M1048.0,975.0L1048.5,975.0M1048.5,975.0L1049.0,975.0M1049.0,975.0L1049.5,975.0M1049.5,975.0L1050.0,975.0M1050.0,975.0L1050.5,975.0M1050.5,975.0L1051.0,975.0M1051.0,975.0L1051.5,975.0M1051.5,975.0L1052.0,975.5M1189.0,975.0L1188.5,975.5M977.5,975.5L977.5,976.0M1052.0,975.5L1052.5,975.5M1052.5,975.5L1053.0,975.5M1053.0,975.5L1053.5,975.5M1053.5,975.5L1054.0,975.5M1054.0,975.5L1054.5,975.5M1054.5,975.5L1055.0,975.5M1055.0,975.5L1055.5,976.0M1188.5,975.5L1188.0,976.0M977.5,976.0L977.5,976.5M1055.5,976.0L1056.0,976.0M1056.0,976.0L1056.5,976.0M1056.5,976.0L1057.0,976.0M1057.0,976.0L1057.5,976.0M1057.5,976.0L1058.0,976.5M1188.0,976.0L1188.0,976.5M977.5,976.5L977.5,977.0M1058.0,976.5L1058.5,976.5M1058.5,976.5L1059.0,976.5M1059.0,976.5L1059.5,976.5M1059.5,976.5L1060.0,976.5M1060.0,976.5L1060.5,977.0M1188.0,976.5L1187.5,977.0M977.5,977.0L977.5,977.5M1060.5,977.0L1061.0,977.0M1061.0,977.0L1061.5,977.0M1061.5,977.0L1062.0,977.0M1062.0,977.0L1062.5,977.0M1062.5,977.0L1063.0,977.0M1063.0,977.0L1063.5,977.0M1063.5,977.0L1064.0,977.0M1064.0,977.0L1064.5,977.5M1187.5,977.0L1187.0,977.5M977.5,977.5L978.0,978.0M1064.5,977.5L1065.0,977.5M1065.0,977.5L1065.5,977.5M1065.5,977.5L1066.0,977.5M1066.0,977.5L1066.5,977.5M1066.5,977.5L1067.0,977.5M1067.0,977.5L1067.5,978.0M1187.0,977.5L1187.0,978.0M978.0,978.0L978.0,978.5M1067.5,978.0L1068.0,978.0M1068.0,978.0L1068.5,978.0M1068.5,978.0L1069.0,978.0M1069.0,978.0L1069.5,978.0M1069.5,978.0L1070.0,978.5M1078.0,978.0L1078.5,978.0M1078.0,978.0L1077.5,978.5M1078.5,978.0L1079.0,978.0M1079.0,978.0L1079.5,978.0M1079.5,978.0L1080.0,978.0M1080.0,978.0L1080.5,978.0M1080.5,978.0L1081.0,978.5M1187.0,978.0L1186.5,978.5M978.0,978.5L978.0,979.0M1070.0,978.5L1070.5,978.5M1070.5,978.5L1071.0,978.5M1071.0,978.5L1071.5,978.5M1071.5,978.5L1072.0,978.5M1072.0,978.5L1072.5,978.5M1072.5,978.5L1073.0,978.5M1073.0,978.5L1073.5,978.5M1073.5,978.5L1074.0,978.5M1074.0,978.5L1074.5,978.5M1074.5,978.5L1075.0,979.0M1077.0,978.5L1077.5,978.5M1077.0,978.5L1076.5,979.0M1081.0,978.5L1081.5,978.5M1081.5,978.5L1082.0,978.5M1082.0,978.5L1082.5,978.5M1082.5,978.5L1083.0,978.5M1083.0,978.5L1083.5,978.5M1083.5,978.5L1084.0,978.5M1084.0,978.5L1084.5,979.0M1186.5,978.5L1186.0,979.0M978.0,979.0L978.0,979.5M1075.0,979.0L1075.5,979.0M1075.5,979.0L1076.0,979.0M1076.0,979.0L1076.5,979.0M1084.5,979.0L1085.0,979.0M1085.0,979.0L1085.5,979.0M1085.5,979.0L1086.0,979.0M1086.0,979.0L1086.5,979.0M1086.5,979.0L1087.0,979.0M1087.0,979.0L1087.5,979.5M1186.0,979.0L1186.0,979.5M978.0,979.5L978.0,980.0M1087.5,979.5L1088.0,979.5M1088.0,979.5L1088.5,979.5M1088.5,979.5L1089.0,979.5M1089.0,979.5L1089.5,980.0M1186.0,979.5L1185.5,980.0M978.0,980.0L978.0,980.5M1089.5,980.0L1090.0,980.0M1090.0,980.0L1090.5,980.5M1185.5,980.0L1185.0,980.5M978.0,980.5L978.0,981.0M1090.5,980.5L1091.0,981.0M1185.0,980.5L1185.0,981.0M978.0,981.0L978.0,981.5M1091.0,981.0L1091.5,981.5M1185.0,981.0L1184.5,981.5M978.0,981.5L978.0,982.0M1091.5,981.5L1092.0,981.5M1092.0,981.5L1092.5,982.0M1184.5,981.5L1184.5,982.0M978.0,982.0L978.0,982.5M1092.5,982.0L1093.0,982.5M1184.5,982.0L1184.0,982.5M978.0,982.5L978.0,983.0M1093.0,982.5L1093.5,982.5M1093.5,982.5L1094.0,983.0M1184.0,982.5L1183.5,983.0M978.0,983.0L978.0,983.5M1094.0,983.0L1094.5,983.5M1183.5,983.0L1183.0,983.5M978.0,983.5L978.0,984.0M1094.5,983.5L1095.0,983.5M1095.0,983.5L1095.5,984.0M1183.0,983.5L1183.0,984.0M978.0,984.0L978.0,984.5M1095.5,984.0L1096.0,984.5M1183.0,984.0L1182.5,984.5M978.0,984.5L978.0,985.0M1096.0,984.5L1096.5,985.0M1182.5,984.5L1182.0,985.0M978.0,985.0L978.0,985.5M1096.5,985.0L1097.0,985.0M1097.0,985.0L1097.5,985.5M1182.0,985.0L1182.0,985.5M978.0,985.5L978.0,986.0M1097.5,985.5L1098.0,985.5M1098.0,985.5L1098.5,986.0M1182.0,985.5L1181.5,986.0M978.0,986.0L978.0,986.5M1098.5,986.0L1099.0,986.0M1099.0,986.0L1099.5,986.0M1099.5,986.0L1100.0,986.5M1181.5,986.0L1181.0,986.5M978.0,986.5L978.0,987.0M1100.0,986.5L1100.5,986.5M1100.5,986.5L1101.0,986.5M1101.0,986.5L1101.5,986.5M1101.5,986.5L1102.0,986.5M1102.0,986.5L1102.5,986.5M1102.5,986.5L1103.0,986.5M1103.0,986.5L1103.5,986.5M1103.5,986.5L1104.0,986.5M1104.0,986.5L1104.5,986.5M1104.5,986.5L1105.0,986.5M1105.0,986.5L1105.5,986.5M1105.5,986.5L1106.0,986.5M1106.0,986.5L1106.5,986.5M1106.5,986.5L1107.0,986.5M1107.0,986.5L1107.5,987.0M1181.0,986.5L1180.5,987.0M978.0,987.0L977.5,987.5M1107.5,987.0L1108.0,987.0M1108.0,987.0L1108.5,987.0M1108.5,987.0L1109.0,987.0M1109.0,987.0L1109.5,987.0M1109.5,987.0L1110.0,987.0M1110.0,987.0L1110.5,987.0M1110.5,987.0L1111.0,987.0M1111.0,987.0L1111.5,987.0M1111.5,987.0L1112.0,987.0M1112.0,987.0L1112.5,987.0M1112.5,987.0L1113.0,987.5M1180.5,987.0L1180.5,987.5M977.5,987.5L977.5,988.0M1113.0,987.5L1113.5,987.5M1113.5,987.5L1114.0,987.5M1114.0,987.5L1114.5,987.5M1114.5,987.5L1115.0,987.5M1115.0,987.5L1115.5,987.5M1115.5,987.5L1116.0,987.5M1116.0,987.5L1116.5,987.5M1116.5,987.5L1117.0,987.5M1117.0,987.5L1117.5,987.5M1117.5,987.5L1118.0,987.5M1118.0,987.5L1118.5,987.5M1118.5,987.5L1119.0,987.5M1119.0,987.5L1119.5,988.0M1180.5,987.5L1180.0,988.0M977.5,988.0L977.5,988.5M1119.5,988.0L1120.0,988.0M1120.0,988.0L1120.5,988.0M1120.5,988.0L1121.0,988.0M1121.0,988.0L1121.5,988.0M1121.5,988.0L1122.0,988.5M1180.0,988.0L1180.0,988.5M977.5,988.5L977.5,989.0M1122.0,988.5L1122.5,988.5M1122.5,988.5L1123.0,988.5M1123.0,988.5L1123.5,988.5M1123.5,988.5L1124.0,988.5M1124.0,988.5L1124.5,988.5M1124.5,988.5L1125.0,989.0M1180.0,988.5L1180.0,989.0M977.5,989.0L977.5,989.5M1125.0,989.0L1125.5,989.0M1125.5,989.0L1126.0,989.0M1126.0,989.0L1126.5,989.0M1126.5,989.0L1127.0,989.5M1180.0,989.0L1179.5,989.5M977.5,989.5L977.5,990.0M1127.0,989.5L1127.5,989.5M1127.5,989.5L1128.0,989.5M1128.0,989.5L1128.5,989.5M1128.5,989.5L1129.0,989.5M1129.0,989.5L1129.5,990.0M1179.5,989.5L1179.5,990.0M977.5,990.0L977.5,990.5M1129.5,990.0L1130.0,990.0M1130.0,990.0L1130.5,990.0M1130.5,990.0L1131.0,990.0M1131.0,990.0L1131.5,990.5M1179.5,990.0L1179.5,990.5M977.5,990.5L977.5,991.0M1131.5,990.5L1132.0,990.5M1132.0,990.5L1132.5,990.5M1132.5,990.5L1133.0,990.5M1133.0,990.5L1133.5,990.5M1133.5,990.5L1134.0,991.0M1179.5,990.5L1179.5,991.0M977.5,991.0L977.5,991.5M1134.0,991.0L1134.5,991.0M1134.5,991.0L1135.0,991.0M1135.0,991.0L1135.5,991.0M1135.5,991.0L1136.0,991.0M1136.0,991.0L1136.5,991.5M1179.5,991.0L1179.5,991.5M977.5,991.5L977.5,992.0M1136.5,991.5L1137.0,991.5M1137.0,991.5L1137.5,991.5M1137.5,991.5L1138.0,991.5M1138.0,991.5L1138.5,991.5M1138.5,991.5L1139.0,992.0M1179.5,991.5L1179.0,992.0M1179.5,991.5L1179.5,992.0M1179.5,991.5L1180.0,992.0M977.5,992.0L977.5,992.5M1139.0,992.0L1139.5,992.0M1139.5,992.0L1140.0,992.0M1140.0,992.0L1140.5,992.0M1140.5,992.0L1141.0,992.5M1155.0,992.0L1155.5,992.0M1155.0,992.0L1154.5,992.5M1155.5,992.0L1156.0,992.0M1156.0,992.0L1156.5,992.0M1156.5,992.0L1157.0,992.0M1157.0,992.0L1157.5,992.0M1157.5,992.0L1158.0,992.0M1158.0,992.0L1158.5,992.0M1158.5,992.0L1159.0,992.0M1159.0,992.0L1159.5,992.0M1159.5,992.0L1160.0,992.0M1160.0,992.0L1160.5,992.0M1160.5,992.0L1161.0,992.0M1161.0,992.0L1161.5,992.0M1161.5,992.0L1162.0,992.0M1162.0,992.0L1162.5,992.0M1162.5,992.0L1163.0,992.0M1163.0,992.0L1163.5,992.0M1163.5,992.0L1164.0,992.0M1164.0,992.0L1164.5,992.0M1164.5,992.0L1165.0,992.0M1165.0,992.0L1165.5,992.0M1165.5,992.0L1166.0,992.0M1166.0,992.0L1166.5,992.0M1166.5,992.0L1167.0,992.0M1167.0,992.0L1167.5,992.0M1167.5,992.0L1168.0,992.0M1168.0,992.0L1168.5,992.0M1168.5,992.0L1169.0,992.0M1169.0,992.0L1169.5,992.0M1169.5,992.0L1170.0,992.0M1170.0,992.0L1170.5,992.0M1170.5,992.0L1171.0,992.0M1171.0,992.0L1171.5,992.0M1171.5,992.0L1172.0,992.0M1172.0,992.0L1172.5,992.0M1172.5,992.0L1173.0,992.0M1173.0,992.0L1173.5,992.0M1173.5,992.0L1174.0,992.0M1174.0,992.0L1174.5,992.0M1174.5,992.0L1175.0,992.0M1175.0,992.0L1175.5,992.0M1175.5,992.0L1176.0,992.0M1176.0,992.0L1176.5,992.0M1176.5,992.0L1177.0,992.0M1177.0,992.0L1177.5,992.0M1177.5,992.0L1178.0,992.0M1178.0,992.0L1178.5,992.0M1178.5,992.0L1179.0,992.0M1179.0,992.0L1179.5,992.0M1179.5,992.0L1180.0,992.0M1180.0,992.0L1180.5,992.5M977.5,992.5L977.0,993.0M1141.0,992.5L1141.5,992.5M1141.5,992.5L1142.0,992.5M1142.0,992.5L1142.5,992.5M1142.5,992.5L1143.0,992.5M1143.0,992.5L1143.5,992.5M1143.5,992.5L1144.0,992.5M1144.0,992.5L1144.5,992.5M1144.5,992.5L1145.0,992.5M1145.0,992.5L1145.5,992.5M1145.5,992.5L1146.0,992.5M1146.0,992.5L1146.5,992.5M1146.5,992.5L1147.0,992.5M1147.0,992.5L1147.5,992.5M1147.5,992.5L1148.0,992.5M1148.0,992.5L1148.5,992.5M1148.5,992.5L1149.0,992.5M1149.0,992.5L1149.5,992.5M1149.5,992.5L1150.0,992.5M1150.0,992.5L1150.5,992.5M1150.5,992.5L1151.0,992.5M1151.0,992.5L1151.5,992.5M1151.5,992.5L1152.0,992.5M1152.0,992.5L1152.5,992.5M1152.5,992.5L1153.0,992.5M1153.0,992.5L1153.5,992.5M1153.5,992.5L1154.0,992.5M1154.0,992.5L1154.5,992.5M1180.5,992.5L1181.0,993.0M1189.5,992.5L1190.0,992.5M1189.5,992.5L1189.0,993.0M1190.0,992.5L1190.5,992.5M1190.5,992.5L1191.0,992.5M1191.0,992.5L1191.5,992.5M1191.5,992.5L1192.0,992.5M1192.0,992.5L1192.5,992.5M1192.5,992.5L1193.0,992.5M1193.0,992.5L1193.5,992.5M1193.5,992.5L1194.0,992.5M1194.0,992.5L1194.5,992.5M1194.5,992.5L1195.0,992.5M1195.0,992.5L1195.5,992.5M1195.5,992.5L1196.0,992.5M1196.0,992.5L1196.5,992.5M1196.5,992.5L1197.0,992.5M1197.0,992.5L1197.5,992.5M1197.5,992.5L1198.0,993.0M977.0,993.0L977.0,993.5M1181.0,993.0L1181.5,993.0M1181.5,993.0L1182.0,993.0M1182.0,993.0L1182.5,993.0M1182.5,993.0L1183.0,993.5M1189.0,993.0L1188.5,993.5M1198.0,993.0L1198.5,993.5M977.0,993.5L977.0,994.0M1183.0,993.5L1183.5,993.5M1183.5,993.5L1184.0,993.5M1184.0,993.5L1184.5,993.5M1184.5,993.5L1185.0,993.5M1185.0,993.5L1185.5,993.5M1185.5,993.5L1186.0,993.5M1186.0,993.5L1186.5,994.0M1188.5,993.5L1188.0,994.0M1188.5,993.5L1188.5,994.0M1198.5,993.5L1199.0,994.0M977.0,994.0L977.0,994.5M1186.5,994.0L1187.0,994.0M1187.0,994.0L1187.5,994.0M1187.5,994.0L1188.0,994.0M1188.0,994.0L1188.5,994.0M1188.5,994.0L1189.0,994.5M1199.0,994.0L1199.0,994.5M977.0,994.5L977.0,995.0M1189.0,994.5L1189.0,995.0M1199.0,994.5L1199.0,995.0M977.0,995.0L977.0,995.5M1189.0,995.0L1189.5,995.5M1199.0,995.0L1199.5,995.5M977.0,995.5L976.5,996.0M1189.5,995.5L1190.0,996.0M1199.5,995.5L1199.5,996.0M976.5,996.0L976.5,996.5M1190.0,996.0L1190.5,996.0M1190.5,996.0L1191.0,996.0M1191.0,996.0L1191.5,996.0M1191.5,996.0L1192.0,996.0M1192.0,996.0L1192.5,996.0M1192.5,996.0L1193.0,996.0M1193.0,996.0L1193.5,996.5M1199.5,996.0L1199.5,996.5M976.5,996.5L976.0,997.0M1193.5,996.5L1194.0,996.5M1194.0,996.5L1194.5,996.5M1194.5,996.5L1195.0,996.5M1195.0,996.5L1195.5,996.5M1195.5,996.5L1196.0,996.5M1196.0,996.5L1196.5,996.5M1196.5,996.5L1197.0,996.5M1197.0,996.5L1197.5,997.0M1199.5,996.5L1199.0,997.0M1199.5,996.5L1200.0,997.0M976.0,997.0L975.5,997.5M1197.5,997.0L1198.0,997.0M1198.0,997.0L1198.5,997.0M1198.5,997.0L1199.0,997.0M1200.0,997.0L1200.5,997.0M1200.5,997.0L1201.0,997.5M975.5,997.5L975.5,998.0M1201.0,997.5L1201.5,997.5M1201.5,997.5L1202.0,998.0M975.5,998.0L975.0,998.5M1202.0,998.0L1202.5,998.0M1202.5,998.0L1203.0,998.5M975.0,998.5L975.0,999.0M1203.0,998.5L1203.5,999.0M975.0,999.0L974.5,999.5M1203.5,999.0L1203.5,999.5M974.5,999.5L974.5,1000.0M1203.5,999.5L1203.5,1000.0M1203.5,999.5L1204.0,1000.0M974.5,1000.0L974.0,1000.5M1203.5,1000.0L1204.0,1000.0M1203.5,1000.0L1203.5,1000.5M1204.0,1000.0L1204.5,1000.0M1204.0,1000.0L1203.5,1000.5M1204.5,1000.0L1205.0,1000.0M1205.0,1000.0L1205.5,1000.0M1205.5,1000.0L1206.0,1000.0M1206.0,1000.0L1206.5,1000.0M974.0,1000.5L974.0,1001.0M1203.5,1000.5L1203.5,1001.0M974.0,1001.0L973.5,1001.5M1203.5,1001.0L1203.5,1001.5M973.5,1001.5L973.0,1002.0M1203.5,1001.5L1203.5,1002.0M973.0,1002.0L973.0,1002.5M1203.5,1002.0L1203.5,1002.5M973.0,1002.5L972.5,1003.0M1203.5,1002.5L1203.5,1003.0M972.5,1003.0L972.0,1003.5M1203.5,1003.0L1203.5,1003.5M1206.0,1003.0L1206.5,1003.0M1206.0,1003.0L1205.5,1003.5M1206.5,1003.0L1207.0,1003.0M972.0,1003.5L972.0,1004.0M1203.5,1003.5L1203.5,1004.0M1203.5,1003.5L1204.0,1004.0M1205.0,1003.5L1205.5,1003.5M1205.0,1003.5L1204.5,1004.0M972.0,1004.0L971.5,1004.5M1203.5,1004.0L1204.0,1004.0M1203.5,1004.0L1203.0,1004.5M1204.0,1004.0L1204.5,1004.0M971.5,1004.5L971.5,1005.0M1203.0,1004.5L1202.5,1005.0M971.5,1005.0L971.0,1005.5M1202.0,1005.0L1202.5,1005.0M971.0,1005.5L971.0,1006.0M971.0,1006.0L970.5,1006.5M970.5,1006.5L970.5,1007.0M970.5,1007.0L970.0,1007.5M970.0,1007.5L970.0,1008.0M970.0,1008.0L970.0,1008.5M970.0,1008.5L970.0,1009.0M970.0,1009.0L969.5,1009.5M969.0,1009.5L969.5,1009.5M969.0,1009.5L968.5,1010.0M969.5,1009.5L970.0,1010.0M968.0,1010.0L968.5,1010.0M968.0,1010.0L967.5,1010.5M970.0,1010.0L970.5,1010.0M970.5,1010.0L971.0,1010.0M971.0,1010.0L971.5,1010.0M971.5,1010.0L972.0,1010.0M972.0,1010.0L972.5,1010.0M972.5,1010.0L973.0,1010.0M973.0,1010.0L973.5,1010.5M967.5,1010.5L967.0,1011.0M973.5,1010.5L973.5,1011.0M966.5,1011.0L967.0,1011.0M973.5,1011.0L973.5,1011.5M973.5,1011.5L973.5,1012.0M973.5,1012.0L973.5,1012.5M973.5,1012.5L973.5,1013.0M973.5,1013.0L973.5,1013.5M973.5,1013.5L973.5,1014.0M973.5,1014.0L973.5,1014.5M973.5,1014.5L973.5,1015.0M973.5,1015.0L974.0,1015.5M974.0,1015.5L974.0,1016.0M974.0,1016.0L974.0,1016.5M974.0,1016.5L974.0,1017.0M974.0,1017.0L974.0,1017.5M974.0,1017.5L974.0,1018.0M974.0,1018.0L974.0,1018.5M974.0,1018.5L974.0,1019.0M974.0,1019.0L974.0,1019.5M974.0,1019.5L974.0,1020.0M974.0,1020.0L974.0,1020.5M974.0,1020.5L974.0,1021.0M974.0,1021.0L974.0,1021.5M974.0,1021.5L974.0,1022.0M974.0,1022.0L974.0,1022.5M974.0,1022.5L974.0,1023.0M974.0,1023.0L974.0,1023.5M974.0,1023.5L974.0,1024.0M974.0,1024.0L974.0,1024.5M974.0,1024.5L974.0,1025.0M974.0,1025.0L974.0,1025.5M974.0,1025.5L974.0,1026.0M974.0,1025.5L974.5,1026.0M974.0,1026.0L974.5,1026.0M974.0,1026.0L974.0,1026.5M974.5,1026.0L975.0,1026.0M974.5,1026.0L974.0,1026.5M975.0,1026.0L975.5,1026.0M975.5,1026.0L976.0,1026.0M976.0,1026.0L976.5,1026.0M974.0,1026.5L974.0,1027.0M974.0,1027.0L974.0,1027.5M974.0,1027.5L974.0,1028.0M974.0,1028.0L973.5,1028.5M973.5,1028.5L973.5,1029.0M973.5,1029.0L973.5,1029.5M973.5,1029.5L973.5,1030.0M973.5,1030.0L973.5,1030.5M973.5,1030.5L973.5,1031.0M973.5,1031.0L973.5,1031.5M973.5,1031.5L973.5,1032.0M973.5,1032.0L973.5,1032.5M973.5,1032.5L973.5,1033.0M973.5,1033.0L973.5,1033.5M973.5,1033.5L973.5,1034.0M973.5,1034.0L973.0,1034.5M973.0,1034.5L973.0,1035.0M973.0,1035.0L973.0,1035.5M973.0,1035.5L973.0,1036.0M1054.5,1035.5L1054.0,1036.0M973.0,1036.0L973.0,1036.5M1054.0,1036.0L1054.0,1036.5M973.0,1036.5L973.0,1037.0M1054.0,1036.5L1054.0,1037.0M973.0,1037.0L973.0,1037.5M1054.0,1037.0L1053.5,1037.5M973.0,1037.5L973.0,1038.0M1048.5,1037.5L1049.0,1037.5M1049.0,1037.5L1049.5,1037.5M1049.5,1037.5L1050.0,1037.5M1050.0,1037.5L1050.5,1038.0M1053.5,1037.5L1053.0,1038.0M973.0,1038.0L973.0,1038.5M1050.5,1038.0L1051.0,1038.0M1050.5,1038.0L1050.0,1038.5M1051.0,1038.0L1051.5,1038.0M1051.5,1038.0L1052.0,1038.0M1052.0,1038.0L1052.5,1038.0M1052.5,1038.0L1053.0,1038.0M973.0,1038.5L972.5,1039.0M1050.0,1038.5L1050.0,1039.0M972.5,1039.0L972.5,1039.5M1050.0,1039.0L1050.0,1039.5M972.5,1039.5L972.5,1040.0M1050.0,1039.5L1050.0,1040.0M972.5,1040.0L972.5,1040.5M1050.0,1040.0L1049.5,1040.5M972.5,1040.5L972.0,1041.0M1049.5,1040.5L1049.5,1041.0M972.0,1041.0L972.0,1041.5M1049.5,1041.0L1049.0,1041.5M972.0,1041.5L972.0,1042.0M1049.0,1041.5L1049.0,1042.0M972.0,1042.0L971.5,1042.5M1049.0,1042.0L1049.0,1042.5M971.5,1042.5L971.5,1043.0M1049.0,1042.5L1049.0,1043.0M971.5,1043.0L971.5,1043.5M1049.0,1043.0L1049.0,1043.5M971.5,1043.5L971.5,1044.0M1049.0,1043.5L1048.5,1044.0M971.5,1044.0L971.0,1044.5M1048.5,1044.0L1048.5,1044.5M971.0,1044.5L971.0,1045.0M1048.5,1044.5L1048.5,1045.0M971.0,1045.0L971.0,1045.5M1048.5,1045.0L1048.5,1045.5M971.0,1045.5L970.5,1046.0M1048.5,1045.5L1048.5,1046.0M970.5,1046.0L970.5,1046.5M1048.5,1046.0L1048.5,1046.5M970.5,1046.5L970.5,1047.0M1048.5,1046.5L1048.5,1047.0M970.5,1047.0L970.5,1047.5M1048.5,1047.0L1048.5,1047.5M970.5,1047.5L970.0,1048.0M1048.5,1047.5L1048.5,1048.0M1051.5,1047.5L1051.5,1048.0M970.0,1048.0L970.0,1048.5M1048.5,1048.0L1048.5,1048.5M1051.5,1048.0L1051.0,1048.5M970.0,1048.5L970.0,1049.0M1048.5,1048.5L1049.0,1049.0M1051.0,1048.5L1050.5,1049.0M970.0,1049.0L970.0,1049.5M1049.0,1049.0L1049.5,1049.0M1049.5,1049.0L1050.0,1049.5M1050.5,1049.0L1050.0,1049.5M1050.5,1049.0L1050.5,1049.5M970.0,1049.5L969.5,1050.0M1050.0,1049.5L1050.5,1049.5M1050.0,1049.5L1050.5,1050.0M1050.5,1049.5L1050.5,1050.0M969.5,1050.0L969.5,1050.5M1050.5,1050.0L1050.5,1050.5M1050.5,1050.0L1051.0,1050.5M969.5,1050.5L969.5,1051.0M1050.5,1050.5L1051.0,1050.5M1050.5,1050.5L1050.5,1051.0M1051.0,1050.5L1051.5,1050.5M1051.0,1050.5L1050.5,1051.0M1051.5,1050.5L1052.0,1051.0M969.5,1051.0L969.0,1051.5M1050.5,1051.0L1050.5,1051.5M1052.0,1051.0L1052.5,1051.0M1052.5,1051.0L1053.0,1051.0M1053.0,1051.0L1053.5,1051.5M969.0,1051.5L969.0,1052.0M1050.5,1051.5L1050.5,1052.0M1053.5,1051.5L1054.0,1052.0M969.0,1052.0L969.0,1052.5M1050.5,1052.0L1050.5,1052.5M1054.0,1052.0L1054.5,1052.0M1054.5,1052.0L1055.0,1052.0M1055.0,1052.0L1055.5,1052.5M969.0,1052.5L969.0,1053.0M1050.5,1052.5L1050.5,1053.0M1055.5,1052.5L1056.0,1052.5M1056.0,1052.5L1056.5,1053.0M969.0,1053.0L969.0,1053.5M1050.5,1053.0L1050.5,1053.5M1056.5,1053.0L1057.0,1053.0M1057.0,1053.0L1057.5,1053.5M969.0,1053.5L968.5,1054.0M1050.5,1053.5L1050.5,1054.0M1057.5,1053.5L1058.0,1054.0M968.5,1054.0L968.5,1054.5M1058.0,1054.0L1058.5,1054.5M968.5,1054.5L968.5,1055.0M1058.5,1054.5L1059.0,1055.0M968.5,1055.0L968.5,1055.5M1059.0,1055.0L1059.5,1055.5M968.5,1055.5L968.5,1056.0M1059.5,1055.5L1059.5,1056.0M968.5,1056.0L968.5,1056.5M1059.5,1056.0L1059.5,1056.5M1059.5,1056.0L1060.0,1056.5M968.5,1056.5L968.0,1057.0M1059.5,1056.5L1060.0,1056.5M1059.5,1056.5L1059.0,1057.0M1060.0,1056.5L1060.5,1057.0M968.0,1057.0L968.0,1057.5M1059.0,1057.0L1058.5,1057.5M1060.5,1057.0L1061.0,1057.5M1117.5,1057.0L1118.0,1057.0M1117.5,1057.0L1117.0,1057.5M1118.0,1057.0L1118.5,1057.5M968.0,1057.5L968.0,1058.0M1058.5,1057.5L1058.5,1058.0M1061.0,1057.5L1061.5,1058.0M1115.5,1057.5L1116.0,1057.5M1115.5,1057.5L1115.0,1058.0M1116.0,1057.5L1116.5,1057.5M1116.5,1057.5L1117.0,1057.5M1118.5,1057.5L1118.5,1058.0M968.0,1058.0L968.0,1058.5M1058.5,1058.0L1058.5,1058.5M1061.5,1058.0L1062.0,1058.5M1113.5,1058.0L1114.0,1058.0M1113.5,1058.0L1113.0,1058.5M1114.0,1058.0L1114.5,1058.0M1114.5,1058.0L1115.0,1058.0M1118.5,1058.0L1119.0,1058.5M968.0,1058.5L968.0,1059.0M1058.5,1058.5L1058.5,1059.0M1062.0,1058.5L1062.5,1059.0M1112.0,1058.5L1112.5,1058.5M1112.0,1058.5L1111.5,1059.0M1112.5,1058.5L1113.0,1058.5M1119.0,1058.5L1119.0,1059.0M968.0,1059.0L967.5,1059.5M1062.5,1059.0L1063.0,1059.5M1110.0,1059.0L1110.5,1059.0M1110.0,1059.0L1109.5,1059.5M1110.5,1059.0L1111.0,1059.0M1111.0,1059.0L1111.5,1059.0M1119.0,1059.0L1119.5,1059.5M967.5,1059.5L967.5,1060.0M1063.0,1059.5L1063.5,1060.0M1108.0,1059.5L1108.5,1059.5M1108.0,1059.5L1107.5,1060.0M1108.5,1059.5L1109.0,1059.5M1109.0,1059.5L1109.5,1059.5M1119.5,1059.5L1119.5,1060.0M967.5,1060.0L967.5,1060.5M1063.5,1060.0L1064.0,1060.5M1106.0,1060.0L1106.5,1060.0M1106.0,1060.0L1105.5,1060.5M1106.5,1060.0L1107.0,1060.0M1107.0,1060.0L1107.5,1060.0M1119.5,1060.0L1120.0,1060.5M967.5,1060.5L967.5,1061.0M1064.0,1060.5L1064.5,1061.0M1104.5,1060.5L1105.0,1060.5M1104.5,1060.5L1104.0,1061.0M1105.0,1060.5L1105.5,1060.5M1120.0,1060.5L1120.0,1061.0M967.5,1061.0L967.5,1061.5M1064.5,1061.0L1065.0,1061.5M1102.0,1061.0L1102.5,1061.0M1102.0,1061.0L1101.5,1061.5M1102.5,1061.0L1103.0,1061.0M1103.0,1061.0L1103.5,1061.0M1103.5,1061.0L1104.0,1061.0M1120.0,1061.0L1120.5,1061.5M967.5,1061.5L967.5,1062.0M1065.0,1061.5L1065.5,1062.0M1099.5,1061.5L1100.0,1061.5M1099.5,1061.5L1099.0,1062.0M1100.0,1061.5L1100.5,1061.5M1100.5,1061.5L1101.0,1061.5M1101.0,1061.5L1101.5,1061.5M1120.5,1061.5L1120.5,1062.0M967.5,1062.0L967.0,1062.5M1065.5,1062.0L1066.0,1062.0M1066.0,1062.0L1066.5,1062.0M1066.5,1062.0L1067.0,1062.0M1067.0,1062.0L1067.5,1062.5M1096.5,1062.0L1097.0,1062.0M1096.5,1062.0L1096.0,1062.5M1097.0,1062.0L1097.5,1062.0M1097.5,1062.0L1098.0,1062.0M1098.0,1062.0L1098.5,1062.0M1098.5,1062.0L1099.0,1062.0M1120.5,1062.0L1121.0,1062.5M967.0,1062.5L967.0,1063.0M1067.5,1062.5L1068.0,1062.5M1068.0,1062.5L1068.5,1062.5M1068.5,1062.5L1069.0,1062.5M1069.0,1062.5L1069.5,1062.5M1069.5,1062.5L1070.0,1062.5M1070.0,1062.5L1070.5,1062.5M1070.5,1062.5L1071.0,1063.0M1093.5,1062.5L1094.0,1062.5M1093.5,1062.5L1093.0,1063.0M1094.0,1062.5L1094.5,1062.5M1094.5,1062.5L1095.0,1062.5M1095.0,1062.5L1095.5,1062.5M1095.5,1062.5L1096.0,1062.5M1121.0,1062.5L1121.0,1063.0M967.0,1063.0L967.0,1063.5M1071.0,1063.0L1071.5,1063.0M1071.5,1063.0L1072.0,1063.0M1072.0,1063.0L1072.5,1063.0M1072.5,1063.0L1073.0,1063.0M1073.0,1063.0L1073.5,1063.0M1073.5,1063.0L1074.0,1063.0M1074.0,1063.0L1074.5,1063.5M1090.5,1063.0L1091.0,1063.0M1090.5,1063.0L1090.0,1063.5M1091.0,1063.0L1091.5,1063.0M1091.5,1063.0L1092.0,1063.0M1092.0,1063.0L1092.5,1063.0M1092.5,1063.0L1093.0,1063.0M1121.0,1063.0L1121.5,1063.5M967.0,1063.5L967.0,1064.0M1074.5,1063.5L1075.0,1063.5M1075.0,1063.5L1075.5,1063.5M1075.5,1063.5L1076.0,1063.5M1076.0,1063.5L1076.5,1063.5M1076.5,1063.5L1077.0,1064.0M1088.5,1063.5L1089.0,1063.5M1088.5,1063.5L1088.0,1064.0M1089.0,1063.5L1089.5,1063.5M1089.5,1063.5L1090.0,1063.5M1121.5,1063.5L1121.5,1064.0M967.0,1064.0L967.0,1064.5M1077.0,1064.0L1077.5,1064.0M1077.5,1064.0L1078.0,1064.0M1078.0,1064.0L1078.5,1064.0M1078.5,1064.0L1079.0,1064.0M1079.0,1064.0L1079.5,1064.0M1079.5,1064.0L1080.0,1064.0M1080.0,1064.0L1080.5,1064.0M1080.5,1064.0L1081.0,1064.0M1081.0,1064.0L1081.5,1064.5M1085.0,1064.0L1085.5,1064.0M1085.0,1064.0L1084.5,1064.5M1085.5,1064.0L1086.0,1064.0M1086.0,1064.0L1086.5,1064.0M1086.5,1064.0L1087.0,1064.0M1087.0,1064.0L1087.5,1064.0M1087.5,1064.0L1088.0,1064.0M1121.5,1064.0L1122.0,1064.5M967.0,1064.5L966.5,1065.0M1081.5,1064.5L1082.0,1064.5M1082.0,1064.5L1082.5,1064.5M1082.5,1064.5L1083.0,1064.5M1083.0,1064.5L1083.5,1064.5M1083.5,1064.5L1084.0,1064.5M1084.0,1064.5L1084.5,1064.5M1122.0,1064.5L1122.0,1065.0M966.5,1065.0L966.5,1065.5M1122.0,1065.0L1122.5,1065.5M966.5,1065.5L966.5,1066.0M1122.5,1065.5L1122.5,1066.0M966.5,1066.0L966.5,1066.5M1122.5,1066.0L1123.0,1066.5M966.5,1066.5L966.5,1067.0M1123.0,1066.5L1123.0,1067.0M966.5,1067.0L966.5,1067.5M1123.0,1067.0L1123.5,1067.5M966.5,1067.5L966.0,1068.0M1123.5,1067.5L1123.5,1068.0M966.0,1068.0L966.0,1068.5M1123.5,1068.0L1124.0,1068.5M966.0,1068.5L966.0,1069.0M1124.0,1068.5L1124.0,1069.0M966.0,1069.0L966.0,1069.5M1124.0,1069.0L1124.5,1069.5M966.0,1069.5L966.0,1070.0M1124.5,1069.5L1124.5,1070.0M966.0,1070.0L965.5,1070.5M1124.5,1070.0L1124.5,1070.5M965.5,1070.5L965.5,1071.0M1124.5,1070.5L1125.0,1071.0M965.5,1071.0L965.5,1071.5M1125.0,1071.0L1125.0,1071.5M965.5,1071.5L965.5,1072.0M1125.0,1071.5L1125.5,1072.0M965.5,1072.0L965.0,1072.5M1125.5,1072.0L1125.5,1072.5M965.0,1072.5L965.0,1073.0M1125.5,1072.5L1126.0,1073.0M965.0,1073.0L965.0,1073.5M1126.0,1073.0L1126.0,1073.5M965.0,1073.5L965.0,1074.0M1126.0,1073.5L1126.5,1074.0M965.0,1074.0L965.0,1074.5M1126.5,1074.0L1126.5,1074.5M965.0,1074.5L965.0,1075.0M1126.5,1074.5L1127.0,1075.0M965.0,1075.0L964.6,1075.5M1127.0,1075.0L1127.0,1075.5M964.6,1075.5L964.6,1076.0M1127.0,1075.5L1127.5,1076.0M964.6,1076.0L964.6,1076.5M1127.5,1076.0L1127.5,1076.5M964.6,1076.5L964.6,1077.0M1127.5,1076.5L1127.5,1077.0M964.6,1077.0L964.6,1077.5M1127.5,1077.0L1128.0,1077.5M964.6,1077.5L964.1,1078.0M1128.0,1077.5L1128.0,1078.0M964.1,1078.0L964.1,1078.5M1128.0,1078.0L1128.0,1078.5M964.1,1078.5L964.1,1079.0M1128.0,1078.5L1128.5,1079.0M964.1,1079.0L964.1,1079.5M1128.5,1079.0L1128.5,1079.5M964.1,1079.5L964.1,1080.0M1128.5,1079.5L1128.5,1080.0M964.1,1080.0L963.6,1080.5M1128.5,1080.0L1128.5,1080.5M963.6,1080.5L963.6,1081.0M1128.5,1080.5L1129.0,1081.0M963.6,1081.0L963.6,1081.5M1129.0,1081.0L1129.0,1081.5M963.6,1081.5L963.6,1082.0M1129.0,1081.5L1129.0,1082.0M963.6,1082.0L963.6,1082.5M1129.0,1082.0L1129.0,1082.5M963.6,1082.5L963.6,1083.0M1129.0,1082.5L1129.5,1083.0M963.6,1083.0L963.1,1083.5M1129.5,1083.0L1129.5,1083.5M963.1,1083.5L963.1,1084.0M1129.5,1083.5L1129.5,1084.0M963.1,1084.0L963.1,1084.5M1129.5,1084.0L1130.0,1084.5M963.1,1084.5L963.1,1085.0M1130.0,1084.5L1130.0,1085.0M963.1,1085.0L963.1,1085.5M1130.0,1085.0L1130.0,1085.5M963.1,1085.5L962.6,1086.0M1130.0,1085.5L1130.0,1086.0M962.6,1086.0L962.6,1086.5M1130.0,1086.0L1130.5,1086.5M962.6,1086.5L962.6,1087.0M1130.5,1086.5L1130.5,1087.0M962.6,1087.0L962.6,1087.5M1130.5,1087.0L1130.5,1087.5M962.6,1087.5L962.6,1088.0M1130.5,1087.5L1130.5,1088.0M962.6,1088.0L962.1,1088.5M1130.5,1088.0L1130.5,1088.5M962.1,1088.5L962.1,1089.0M1130.5,1088.5L1130.5,1089.0M962.1,1089.0L962.1,1089.5M1130.5,1089.0L1130.5,1089.5M962.1,1089.5L962.1,1090.0M1130.5,1089.5L1130.0,1090.0M962.1,1090.0L962.1,1090.5M1130.0,1090.0L1130.0,1090.5M962.1,1090.5L961.6,1091.0M1130.0,1090.5L1130.0,1091.0M961.6,1091.0L961.6,1091.5M1130.0,1091.0L1130.0,1091.5M961.6,1091.5L961.6,1092.0M1130.0,1091.5L1130.0,1092.0M961.6,1092.0L961.6,1092.5M1130.0,1092.0L1130.0,1092.5M961.6,1092.5L961.6,1093.0M1130.0,1092.5L1130.0,1093.0M961.6,1093.0L961.6,1093.5M1130.0,1093.0L1130.0,1093.5M961.6,1093.5L961.1,1094.0M1130.0,1093.5L1130.0,1094.0M961.1,1094.0L961.1,1094.5M1130.0,1094.0L1130.0,1094.5M961.1,1094.5L961.1,1095.0M1130.0,1094.5L1130.0,1095.0M961.1,1095.0L961.1,1095.5M1130.0,1095.0L1130.0,1095.5M961.1,1095.5L961.1,1096.0M1130.0,1095.5L1130.0,1096.0M961.1,1096.0L961.1,1096.5M1130.0,1096.0L1130.0,1096.5M1210.5,1096.0L1211.0,1096.0M1210.5,1096.0L1210.0,1096.5M1211.0,1096.0L1211.5,1096.5M961.1,1096.5L961.1,1097.0M1130.0,1096.5L1130.0,1097.0M1208.5,1096.5L1209.0,1096.5M1208.5,1096.5L1208.0,1097.0M1209.0,1096.5L1209.5,1096.5M1209.5,1096.5L1210.0,1096.5M1211.5,1096.5L1212.0,1097.0M961.1,1097.0L961.1,1097.5M1130.0,1097.0L1130.0,1097.5M1207.5,1097.0L1208.0,1097.0M1207.5,1097.0L1207.0,1097.5M1212.0,1097.0L1212.5,1097.5M961.1,1097.5L960.6,1098.0M1130.0,1097.5L1130.0,1098.0M1207.0,1097.5L1206.5,1098.0M1212.5,1097.5L1213.0,1098.0M960.6,1098.0L960.6,1098.5M1130.0,1098.0L1129.5,1098.5M1206.5,1098.0L1206.5,1098.5M1213.0,1098.0L1213.5,1098.5M960.6,1098.5L960.6,1099.0M1129.5,1098.5L1129.5,1099.0M1206.5,1098.5L1206.0,1099.0M1213.5,1098.5L1214.0,1099.0M960.6,1099.0L960.6,1099.5M1129.5,1099.0L1129.5,1099.5M1206.0,1099.0L1206.0,1099.5M1214.0,1099.0L1214.5,1099.5M960.6,1099.5L960.6,1100.0M1129.5,1099.5L1129.5,1100.0M1206.0,1099.5L1206.0,1100.0M1214.5,1099.5L1214.5,1100.0M960.6,1100.0L960.6,1100.5M1129.5,1100.0L1129.5,1100.5M1206.0,1100.0L1206.0,1100.5M1214.5,1100.0L1215.0,1100.5M960.6,1100.5L960.6,1101.0M1129.5,1100.5L1129.5,1101.0M1206.0,1100.5L1205.5,1101.0M1206.0,1100.5L1206.0,1101.0M1215.0,1100.5L1215.5,1101.0M960.6,1101.0L960.6,1101.5M1129.5,1101.0L1129.5,1101.5M1205.0,1101.0L1205.5,1101.0M1205.0,1101.0L1204.5,1101.5M1205.5,1101.0L1206.0,1101.0M1206.0,1101.0L1206.5,1101.5M1215.5,1101.0L1215.5,1101.5M960.6,1101.5L960.1,1102.0M1129.5,1101.5L1129.5,1102.0M1204.0,1101.5L1204.5,1101.5M1204.0,1101.5L1203.5,1102.0M1206.5,1101.5L1207.0,1101.5M1207.0,1101.5L1207.5,1101.5M1207.5,1101.5L1208.0,1101.5M1208.0,1101.5L1208.5,1102.0M1215.5,1101.5L1216.0,1102.0M960.1,1102.0L960.1,1102.5M1129.5,1102.0L1129.5,1102.5M1203.5,1102.0L1203.0,1102.5M1208.5,1102.0L1209.0,1102.0M1209.0,1102.0L1209.5,1102.5M1216.0,1102.0L1216.0,1102.5M960.1,1102.5L960.1,1103.0M1129.5,1102.5L1129.5,1103.0M1203.0,1102.5L1202.5,1103.0M1209.5,1102.5L1210.0,1103.0M1216.0,1102.5L1216.5,1103.0M960.1,1103.0L960.1,1103.5M1129.5,1103.0L1129.5,1103.5M1202.5,1103.0L1202.0,1103.5M1210.0,1103.0L1210.5,1103.0M1210.5,1103.0L1211.0,1103.5M1216.5,1103.0L1216.5,1103.5M960.1,1103.5L960.1,1104.0M1117.0,1103.5L1117.5,1103.5M1117.0,1103.5L1116.5,1104.0M1117.5,1103.5L1118.0,1103.5M1118.0,1103.5L1118.5,1103.5M1118.5,1103.5L1119.0,1103.5M1119.0,1103.5L1119.5,1103.5M1119.5,1103.5L1120.0,1103.5M1120.0,1103.5L1120.5,1104.0M1121.0,1103.5L1121.5,1103.5M1121.0,1103.5L1120.5,1104.0M1121.5,1103.5L1122.0,1103.5M1122.0,1103.5L1122.5,1103.5M1122.5,1103.5L1123.0,1103.5M1123.0,1103.5L1123.5,1104.0M1129.5,1103.5L1129.5,1104.0M1202.0,1103.5L1201.5,1104.0M1211.0,1103.5L1211.5,1104.0M1216.5,1103.5L1216.5,1104.0M960.1,1104.0L960.1,1104.5M1116.0,1104.0L1116.5,1104.0M1116.0,1104.0L1115.5,1104.5M1123.5,1104.0L1124.0,1104.0M1124.0,1104.0L1124.5,1104.0M1124.5,1104.0L1125.0,1104.0M1125.0,1104.0L1125.5,1104.0M1125.5,1104.0L1126.0,1104.0M1126.0,1104.0L1126.5,1104.0M1126.5,1104.0L1127.0,1104.0M1127.0,1104.0L1127.5,1104.0M1127.5,1104.0L1128.0,1104.0M1128.0,1104.0L1128.5,1104.5M1129.5,1104.0L1129.0,1104.5M1201.0,1104.0L1201.5,1104.0M1201.0,1104.0L1200.5,1104.5M1211.5,1104.0L1212.0,1104.0M1212.0,1104.0L1212.5,1104.5M1216.5,1104.0L1216.5,1104.5M960.1,1104.5L960.1,1105.0M1115.5,1104.5L1115.5,1105.0M1128.5,1104.5L1129.0,1104.5M1200.5,1104.5L1200.0,1105.0M1212.5,1104.5L1213.0,1105.0M1216.5,1104.5L1217.0,1105.0M960.1,1105.0L960.1,1105.5M1115.5,1105.0L1115.0,1105.5M1200.0,1105.0L1199.5,1105.5M1213.0,1105.0L1213.5,1105.5M1217.0,1105.0L1217.0,1105.5M960.1,1105.5L960.1,1106.0M1115.0,1105.5L1114.5,1106.0M1199.5,1105.5L1199.0,1106.0M1213.5,1105.5L1214.0,1105.5M1214.0,1105.5L1214.5,1105.5M1214.5,1105.5L1215.0,1106.0M1217.0,1105.5L1216.5,1106.0M1217.0,1105.5L1217.0,1106.0M960.1,1106.0L960.1,1106.5M1114.5,1106.0L1114.0,1106.5M1199.0,1106.0L1198.5,1106.5M1215.0,1106.0L1215.5,1106.0M1215.5,1106.0L1216.0,1106.0M1216.0,1106.0L1216.5,1106.0M1216.5,1106.0L1217.0,1106.0M1216.5,1106.0L1217.0,1106.5M1217.0,1106.0L1217.0,1106.5M960.1,1106.5L960.1,1107.0M1114.0,1106.5L1113.5,1107.0M1198.0,1106.5L1198.5,1106.5M1198.0,1106.5L1197.5,1107.0M1217.0,1106.5L1217.5,1107.0M960.1,1107.0L959.6,1107.5M1113.5,1107.0L1113.0,1107.5M1197.5,1107.0L1197.0,1107.5M1217.5,1107.0L1217.5,1107.5M959.6,1107.5L959.6,1108.0M1113.0,1107.5L1112.5,1108.0M1197.0,1107.5L1196.5,1108.0M1217.5,1107.5L1218.0,1108.0M959.6,1108.0L959.6,1108.5M1112.5,1108.0L1112.0,1108.5M1196.5,1108.0L1196.0,1108.5M1218.0,1108.0L1218.5,1108.5M959.6,1108.5L959.6,1109.0M1112.0,1108.5L1111.5,1109.0M1196.0,1108.5L1195.5,1109.0M1218.5,1108.5L1218.5,1109.0M959.6,1109.0L959.1,1109.5M1111.5,1109.0L1111.5,1109.5M1194.5,1109.0L1195.0,1109.0M1194.5,1109.0L1194.0,1109.5M1195.0,1109.0L1195.5,1109.0M1195.0,1109.0L1195.5,1109.5M1195.5,1109.0L1195.5,1109.5M1218.5,1109.0L1219.0,1109.5M959.1,1109.5L959.1,1110.0M1111.5,1109.5L1111.0,1110.0M1193.0,1109.5L1193.5,1109.5M1193.0,1109.5L1192.5,1110.0M1193.5,1109.5L1194.0,1109.5M1195.5,1109.5L1195.5,1110.0M1219.0,1109.5L1219.5,1110.0M959.1,1110.0L959.1,1110.5M1111.0,1110.0L1110.5,1110.5M1192.0,1110.0L1192.5,1110.0M1192.0,1110.0L1191.5,1110.5M1195.5,1110.0L1195.5,1110.5M1219.5,1110.0L1220.0,1110.5M959.1,1110.5L958.6,1111.0M1110.5,1110.5L1110.0,1111.0M1191.5,1110.5L1191.0,1111.0M1195.5,1110.5L1196.0,1111.0M1220.0,1110.5L1220.5,1111.0M958.6,1111.0L958.6,1111.5M1110.0,1111.0L1109.5,1111.5M1191.0,1111.0L1190.5,1111.5M1196.0,1111.0L1196.0,1111.5M1220.5,1111.0L1220.5,1111.5M958.6,1111.5L958.6,1112.0M1109.5,1111.5L1109.5,1112.0M1190.5,1111.5L1190.0,1112.0M1196.0,1111.5L1196.0,1112.0M1220.5,1111.5L1220.5,1112.0M958.6,1112.0L958.1,1112.5M1109.5,1112.0L1109.5,1112.5M1190.0,1112.0L1189.5,1112.5M1196.0,1112.0L1196.5,1112.5M1220.5,1112.0L1221.0,1112.5M958.1,1112.5L958.1,1113.0M1109.5,1112.5L1109.5,1113.0M1189.5,1112.5L1189.0,1113.0M1196.5,1112.5L1196.5,1113.0M1221.0,1112.5L1221.0,1113.0M958.1,1113.0L958.1,1113.5M1109.5,1113.0L1109.5,1113.5M1189.0,1113.0L1188.5,1113.5M1196.5,1113.0L1197.0,1113.5M1221.0,1113.0L1221.0,1113.5M958.1,1113.5L958.1,1114.0M1109.5,1113.5L1109.5,1114.0M1188.5,1113.5L1188.0,1114.0M1197.0,1113.5L1197.5,1114.0M1221.0,1113.5L1221.0,1114.0M958.1,1114.0L957.6,1114.5M1109.5,1114.0L1109.5,1114.5M1188.0,1114.0L1187.5,1114.5M1197.5,1114.0L1198.0,1114.5M1221.0,1114.0L1221.0,1114.5M957.6,1114.5L957.6,1115.0M1109.5,1114.5L1109.5,1115.0M1187.5,1114.5L1187.0,1115.0M1198.0,1114.5L1198.0,1115.0M1221.0,1114.5L1220.5,1115.0M957.6,1115.0L957.6,1115.5M1109.5,1115.0L1109.5,1115.5M1187.0,1115.0L1186.5,1115.5M1198.0,1115.0L1198.5,1115.5M1220.5,1115.0L1220.0,1115.5M957.6,1115.5L957.1,1116.0M1109.5,1115.5L1109.0,1116.0M1109.5,1115.5L1109.5,1116.0M1109.5,1115.5L1110.0,1116.0M1124.0,1115.5L1124.5,1115.5M1124.0,1115.5L1123.5,1116.0M1124.5,1115.5L1125.0,1115.5M1125.0,1115.5L1125.5,1115.5M1125.5,1115.5L1126.0,1115.5M1126.0,1115.5L1126.5,1116.0M1186.5,1115.5L1186.0,1116.0M1198.5,1115.5L1199.0,1116.0M1220.0,1115.5L1220.0,1116.0M957.1,1116.0L957.1,1116.5M1108.0,1116.0L1108.5,1116.0M1108.5,1116.0L1109.0,1116.0M1109.0,1116.0L1109.5,1116.0M1109.5,1116.0L1110.0,1116.0M1110.0,1116.0L1110.5,1116.0M1110.5,1116.0L1111.0,1116.0M1111.0,1116.0L1111.5,1116.5M1120.5,1116.0L1121.0,1116.0M1120.5,1116.0L1120.0,1116.5M1121.0,1116.0L1121.5,1116.0M1121.5,1116.0L1122.0,1116.0M1122.0,1116.0L1122.5,1116.0M1122.5,1116.0L1123.0,1116.0M1123.0,1116.0L1123.5,1116.0M1126.5,1116.0L1127.0,1116.0M1127.0,1116.0L1127.5,1116.5M1186.0,1116.0L1185.5,1116.5M1199.0,1116.0L1199.5,1116.5M1220.0,1116.0L1220.0,1116.5M957.1,1116.5L957.1,1117.0M1111.5,1116.5L1112.0,1116.5M1112.0,1116.5L1112.5,1116.5M1112.5,1116.5L1113.0,1116.5M1113.0,1116.5L1113.5,1116.5M1113.5,1116.5L1114.0,1116.5M1114.0,1116.5L1114.5,1116.5M1114.5,1116.5L1115.0,1117.0M1116.0,1116.5L1116.5,1116.5M1116.0,1116.5L1115.5,1117.0M1116.5,1116.5L1117.0,1116.5M1117.0,1116.5L1117.5,1116.5M1117.5,1116.5L1118.0,1116.5M1118.0,1116.5L1118.5,1116.5M1118.5,1116.5L1119.0,1116.5M1119.0,1116.5L1119.5,1116.5M1119.5,1116.5L1120.0,1116.5M1127.5,1116.5L1128.0,1117.0M1185.5,1116.5L1185.0,1117.0M1199.5,1116.5L1200.0,1117.0M1220.0,1116.5L1219.5,1117.0M957.1,1117.0L956.6,1117.5M1115.0,1117.0L1115.5,1117.0M1128.0,1117.0L1128.5,1117.5M1185.0,1117.0L1184.5,1117.5M1200.0,1117.0L1200.5,1117.5M1219.5,1117.0L1219.5,1117.5M956.6,1117.5L956.6,1118.0M1128.5,1117.5L1129.0,1118.0M1184.0,1117.5L1184.5,1117.5M1184.0,1117.5L1183.5,1118.0M1200.5,1117.5L1200.5,1118.0M1219.5,1117.5L1219.0,1118.0M956.6,1118.0L956.6,1118.5M1129.0,1118.0L1129.5,1118.5M1183.5,1118.0L1183.0,1118.5M1200.5,1118.0L1201.0,1118.5M1219.0,1118.0L1218.5,1118.5M956.6,1118.5L956.1,1119.0M1129.5,1118.5L1129.5,1119.0M1182.5,1118.5L1183.0,1118.5M1182.5,1118.5L1182.0,1119.0M1201.0,1118.5L1201.0,1119.0M956.1,1119.0L956.1,1119.5M1129.5,1119.0L1129.5,1119.5M1181.5,1119.0L1182.0,1119.0M1181.5,1119.0L1181.0,1119.5M1201.0,1119.0L1201.5,1119.5M956.1,1119.5L955.6,1120.0M1129.5,1119.5L1129.5,1120.0M1180.5,1119.5L1181.0,1119.5M1180.5,1119.5L1180.0,1120.0M1201.5,1119.5L1201.5,1120.0M955.6,1120.0L955.1,1120.5M1129.5,1120.0L1129.5,1120.5M1179.5,1120.0L1180.0,1120.0M1179.5,1120.0L1179.0,1120.5M1201.5,1120.0L1201.5,1120.5M955.1,1120.5L954.6,1121.0M1129.5,1120.5L1129.5,1121.0M1178.0,1120.5L1178.5,1120.5M1178.0,1120.5L1177.5,1121.0M1178.5,1120.5L1179.0,1120.5M1201.5,1120.5L1201.5,1121.0M954.6,1121.0L954.1,1121.5M1129.5,1121.0L1129.5,1121.5M1177.0,1121.0L1177.5,1121.0M1177.0,1121.0L1176.5,1121.5M1201.5,1121.0L1202.0,1121.5M954.1,1121.5L953.6,1122.0M1129.5,1121.5L1129.5,1122.0M1176.0,1121.5L1176.5,1121.5M1176.0,1121.5L1175.5,1122.0M1202.0,1121.5L1202.0,1122.0M953.6,1122.0L953.1,1122.5M1129.5,1122.0L1129.0,1122.5M1175.0,1122.0L1175.5,1122.0M1175.0,1122.0L1174.5,1122.5M1202.0,1122.0L1202.0,1122.5M953.1,1122.5L952.6,1123.0M1129.0,1122.5L1129.0,1123.0M1173.5,1122.5L1174.0,1122.5M1173.5,1122.5L1173.0,1123.0M1174.0,1122.5L1174.5,1122.5M1202.0,1122.5L1202.0,1123.0M952.6,1123.0L952.1,1123.5M1129.0,1123.0L1129.0,1123.5M1172.5,1123.0L1173.0,1123.0M1172.5,1123.0L1172.0,1123.5M1202.0,1123.0L1202.5,1123.5M952.1,1123.5L951.6,1124.0M1129.0,1123.5L1129.0,1124.0M1171.5,1123.5L1172.0,1123.5M1171.5,1123.5L1171.0,1124.0M1202.5,1123.5L1202.5,1124.0M951.6,1124.0L951.1,1124.5M1129.0,1124.0L1129.0,1124.5M1170.5,1124.0L1171.0,1124.0M1170.5,1124.0L1170.0,1124.5M1202.5,1124.0L1202.5,1124.5M951.1,1124.5L950.6,1125.0M1129.0,1124.5L1129.0,1125.0M1169.0,1124.5L1169.5,1124.5M1169.0,1124.5L1168.5,1125.0M1169.5,1124.5L1170.0,1124.5M1202.5,1124.5L1202.5,1125.0M950.6,1125.0L950.1,1125.5M1129.0,1125.0L1129.0,1125.5M1168.0,1125.0L1168.5,1125.0M1168.0,1125.0L1167.5,1125.5M1202.5,1125.0L1202.5,1125.5M950.1,1125.5L949.6,1126.0M1129.0,1125.5L1129.0,1126.0M1167.0,1125.5L1167.5,1125.5M1167.0,1125.5L1166.5,1126.0M1202.5,1125.5L1202.5,1126.0M949.1,1126.0L949.6,1126.0M949.1,1126.0L948.6,1126.5M1129.0,1126.0L1129.0,1126.5M1166.0,1126.0L1166.5,1126.0M1166.0,1126.0L1165.5,1126.5M1202.5,1126.0L1203.0,1126.5M948.6,1126.5L948.1,1127.0M1129.0,1126.5L1129.0,1127.0M1164.5,1126.5L1165.0,1126.5M1164.5,1126.5L1164.0,1127.0M1165.0,1126.5L1165.5,1126.5M1203.0,1126.5L1203.0,1127.0M948.1,1127.0L947.6,1127.5M1129.0,1127.0L1129.0,1127.5M1162.5,1127.0L1163.0,1127.0M1162.5,1127.0L1162.0,1127.5M1163.0,1127.0L1163.5,1127.0M1163.5,1127.0L1164.0,1127.0M1203.0,1127.0L1203.0,1127.5M947.6,1127.5L947.1,1128.0M1129.0,1127.5L1129.0,1128.0M1160.5,1127.5L1161.0,1127.5M1160.5,1127.5L1160.0,1128.0M1161.0,1127.5L1161.5,1127.5M1161.5,1127.5L1162.0,1127.5M1203.0,1127.5L1203.0,1128.0M947.1,1128.0L946.6,1128.5M1129.0,1128.0L1129.0,1128.5M1158.5,1128.0L1159.0,1128.0M1158.5,1128.0L1158.0,1128.5M1159.0,1128.0L1159.5,1128.0M1159.5,1128.0L1160.0,1128.0M1203.0,1128.0L1203.0,1128.5M946.6,1128.5L946.1,1129.0M1129.0,1128.5L1129.0,1129.0M1155.5,1128.5L1156.0,1128.5M1155.5,1128.5L1155.0,1129.0M1156.0,1128.5L1156.5,1128.5M1156.5,1128.5L1157.0,1128.5M1157.0,1128.5L1157.5,1128.5M1157.5,1128.5L1158.0,1128.5M1203.0,1128.5L1203.0,1129.0M946.1,1129.0L945.6,1129.5M1129.0,1129.0L1129.0,1129.5M1153.5,1129.0L1154.0,1129.0M1153.5,1129.0L1153.0,1129.5M1154.0,1129.0L1154.5,1129.0M1154.5,1129.0L1155.0,1129.0M1203.0,1129.0L1203.5,1129.5M945.6,1129.5L945.1,1130.0M1129.0,1129.5L1129.0,1130.0M1151.5,1129.5L1152.0,1129.5M1151.5,1129.5L1151.0,1130.0M1152.0,1129.5L1152.5,1129.5M1152.5,1129.5L1153.0,1129.5M1203.5,1129.5L1203.5,1130.0M945.1,1130.0L944.6,1130.5M1129.0,1130.0L1129.5,1130.5M1146.5,1130.0L1147.0,1130.0M1146.5,1130.0L1146.0,1130.5M1147.0,1130.0L1147.5,1130.0M1147.5,1130.0L1148.0,1130.0M1148.0,1130.0L1148.5,1130.0M1148.5,1130.0L1149.0,1130.0M1149.0,1130.0L1149.5,1130.0M1149.5,1130.0L1150.0,1130.0M1150.0,1130.0L1150.5,1130.0M1150.5,1130.0L1151.0,1130.0M1203.5,1130.0L1203.5,1130.5M944.6,1130.5L944.1,1131.0M1129.5,1130.5L1130.0,1131.0M1131.5,1130.5L1132.0,1130.5M1131.5,1130.5L1131.0,1131.0M1132.0,1130.5L1132.5,1130.5M1132.5,1130.5L1133.0,1130.5M1133.0,1130.5L1133.5,1130.5M1133.5,1130.5L1134.0,1130.5M1134.0,1130.5L1134.5,1130.5M1134.5,1130.5L1135.0,1130.5M1135.0,1130.5L1135.5,1130.5M1135.5,1130.5L1136.0,1130.5M1136.0,1130.5L1136.5,1130.5M1136.5,1130.5L1137.0,1130.5M1137.0,1130.5L1137.5,1130.5M1137.5,1130.5L1138.0,1130.5M1138.0,1130.5L1138.5,1130.5M1138.5,1130.5L1139.0,1130.5M1139.0,1130.5L1139.5,1130.5M1139.5,1130.5L1140.0,1130.5M1140.0,1130.5L1140.5,1130.5M1140.5,1130.5L1141.0,1130.5M1141.0,1130.5L1141.5,1130.5M1141.5,1130.5L1142.0,1130.5M1142.0,1130.5L1142.5,1130.5M1142.5,1130.5L1143.0,1130.5M1143.0,1130.5L1143.5,1130.5M1143.5,1130.5L1144.0,1130.5M1144.0,1130.5L1144.5,1130.5M1144.5,1130.5L1145.0,1130.5M1145.0,1130.5L1145.5,1130.5M1145.5,1130.5L1146.0,1130.5M1203.5,1130.5L1203.5,1131.0M944.1,1131.0L943.6,1131.5M1130.0,1131.0L1130.5,1131.0M1130.5,1131.0L1131.0,1131.0M1130.5,1131.0L1131.0,1131.5M1131.0,1131.0L1131.0,1131.5M1203.5,1131.0L1203.5,1131.5M943.6,1131.5L943.1,1132.0M1131.0,1131.5L1131.0,1132.0M1203.5,1131.5L1203.5,1132.0M942.6,1132.0L943.1,1132.0M942.6,1132.0L942.1,1132.5M1131.0,1132.0L1131.0,1132.5M1203.5,1132.0L1204.0,1132.5M942.1,1132.5L941.6,1133.0M1131.0,1132.5L1131.0,1133.0M1204.0,1132.5L1204.0,1133.0M941.6,1133.0L941.1,1133.5M1131.0,1133.0L1131.0,1133.5M1204.0,1133.0L1204.0,1133.5M941.1,1133.5L940.6,1134.0M1204.0,1133.5L1204.0,1134.0M940.6,1134.0L940.6,1134.5M1204.0,1134.0L1204.0,1134.5M940.6,1134.5L940.1,1135.0M1204.0,1134.5L1204.5,1135.0M940.1,1135.0L940.1,1135.5M1204.5,1135.0L1204.5,1135.5M940.1,1135.5L940.1,1136.0M1204.5,1135.5L1204.5,1136.0M940.1,1136.0L940.1,1136.5M1204.5,1136.0L1204.5,1136.5M940.1,1136.5L940.6,1137.0M1204.5,1136.5L1204.5,1137.0M940.6,1137.0L940.6,1137.5M1204.5,1137.0L1204.5,1137.5M940.6,1137.5L940.6,1138.0M1204.5,1137.5L1204.5,1138.0M940.6,1138.0L941.1,1138.5M1204.5,1138.0L1205.0,1138.5M941.1,1138.5L941.1,1139.0M1205.0,1138.5L1205.0,1139.0M941.1,1139.0L941.6,1139.5M1205.0,1139.0L1205.0,1139.5M941.6,1139.5L942.1,1140.0M1205.0,1139.5L1205.0,1140.0M942.1,1140.0L942.1,1140.5M1205.0,1140.0L1205.0,1140.5M942.1,1140.5L942.6,1141.0M1205.0,1140.5L1205.0,1141.0M942.6,1141.0L942.6,1141.5M1205.0,1141.0L1205.5,1141.5M942.6,1141.5L943.1,1142.0M1205.5,1141.5L1205.5,1142.0M943.1,1142.0L943.1,1142.5M1205.5,1142.0L1206.0,1142.5M943.1,1142.5L943.1,1143.0M1206.0,1142.5L1206.0,1143.0M943.1,1143.0L943.6,1143.5M1206.0,1143.0L1206.0,1143.5M943.6,1143.5L943.6,1144.0M1206.0,1143.5L1206.5,1144.0M943.6,1144.0L943.6,1144.5M1206.5,1144.0L1206.5,1144.5M943.6,1144.5L943.6,1145.0M1206.5,1144.5L1207.0,1145.0M943.6,1145.0L943.6,1145.5M1207.0,1145.0L1207.5,1145.5M943.6,1145.5L944.1,1146.0M1207.5,1145.5L1207.5,1146.0M944.1,1146.0L944.1,1146.5M1207.5,1146.0L1208.0,1146.5M944.1,1146.5L944.1,1147.0M1208.0,1146.5L1208.0,1147.0M944.1,1147.0L944.1,1147.5M1208.0,1147.0L1208.5,1147.5M944.1,1147.5L944.6,1148.0M1208.5,1147.5L1209.0,1148.0M944.6,1148.0L944.6,1148.5M1209.0,1148.0L1209.0,1148.5M944.6,1148.5L944.6,1149.0M1209.0,1148.5L1209.5,1149.0M944.6,1149.0L944.6,1149.5M1209.5,1149.0L1209.5,1149.5M944.6,1149.5L945.1,1150.0M1209.5,1149.5L1210.0,1150.0M945.1,1150.0L945.6,1150.0M945.1,1150.0L945.1,1150.5M945.6,1150.0L946.1,1150.0M945.6,1150.0L945.1,1150.5M946.1,1150.0L946.6,1150.0M946.6,1150.0L947.1,1150.0M947.1,1150.0L947.6,1150.0M1210.0,1150.0L1210.0,1150.5M945.1,1150.5L945.1,1151.0M1210.0,1150.5L1210.5,1151.0M945.1,1151.0L945.1,1151.5M1210.5,1151.0L1210.5,1151.5M945.1,1151.5L945.1,1152.0M1210.5,1151.5L1211.0,1152.0M945.1,1152.0L945.1,1152.5M1211.0,1152.0L1211.0,1152.5M945.1,1152.5L945.1,1153.0M1211.0,1152.5L1211.5,1153.0M945.1,1153.0L945.6,1153.5M1211.5,1153.0L1212.0,1153.5M945.6,1153.5L945.6,1154.0M1212.0,1153.5L1212.0,1154.0M945.6,1154.0L945.6,1154.5M1212.0,1154.0L1212.5,1154.5M945.6,1154.5L945.6,1155.0M1212.5,1154.5L1212.5,1155.0M945.6,1155.0L945.6,1155.5M1212.5,1155.0L1213.0,1155.5M945.6,1155.5L945.6,1156.0M1213.0,1155.5L1213.5,1156.0M945.6,1156.0L945.6,1156.5M1213.5,1156.0L1214.0,1156.5M945.6,1156.5L945.6,1157.0M1214.0,1156.5L1214.5,1157.0M945.6,1157.0L945.6,1157.5M1214.5,1157.0L1215.0,1157.5M945.6,1157.5L945.6,1158.0M945.6,1157.5L946.1,1158.0M1215.0,1157.5L1215.5,1158.0M945.6,1158.0L946.1,1158.0M945.6,1158.0L945.6,1158.5M946.1,1158.0L946.6,1158.0M946.1,1158.0L945.6,1158.5M946.6,1158.0L947.1,1158.0M950.6,1158.0L950.6,1158.5M1215.5,1158.0L1216.0,1158.5M945.6,1158.5L945.1,1159.0M950.6,1158.5L950.1,1159.0M1216.0,1158.5L1216.5,1159.0M945.1,1159.0L944.6,1159.5M945.1,1159.0L945.1,1159.5M950.1,1159.0L949.6,1159.5M1216.5,1159.0L1217.0,1159.5M943.6,1159.5L944.1,1159.5M944.1,1159.5L944.6,1159.5M944.6,1159.5L945.1,1159.5M944.6,1159.5L945.1,1160.0M945.1,1159.5L945.1,1160.0M945.1,1159.5L945.6,1160.0M949.1,1159.5L949.6,1159.5M949.1,1159.5L948.6,1160.0M1217.0,1159.5L1217.5,1160.0M945.1,1160.0L945.6,1160.0M945.1,1160.0L945.1,1160.5M945.6,1160.0L946.1,1160.0M945.6,1160.0L945.1,1160.5M946.1,1160.0L946.6,1160.0M946.6,1160.0L947.1,1160.0M947.1,1160.0L947.6,1160.0M947.6,1160.0L948.1,1160.0M948.1,1160.0L948.6,1160.0M1217.5,1160.0L1218.0,1160.5M945.1,1160.5L945.1,1161.0M1218.0,1160.5L1218.5,1161.0M945.1,1161.0L945.1,1161.5M1218.5,1161.0L1219.0,1161.5M945.1,1161.5L945.1,1162.0M1219.0,1161.5L1219.5,1162.0M945.1,1162.0L945.1,1162.5M1219.5,1162.0L1220.0,1162.5M943.6,1162.5L944.1,1163.0M945.1,1162.5L944.6,1163.0M1220.0,1162.5L1220.5,1163.0M944.1,1163.0L944.6,1163.0M944.1,1163.0L944.1,1163.5M944.6,1163.0L944.1,1163.5M1220.5,1163.0L1221.0,1163.5M944.1,1163.5L944.1,1164.0M1221.0,1163.5L1221.5,1164.0M944.1,1164.0L944.1,1164.5M1221.5,1164.0L1222.0,1164.0M1222.0,1164.0L1222.5,1164.5M944.1,1164.5L944.1,1165.0M1222.5,1164.5L1223.0,1164.5M1223.0,1164.5L1223.5,1165.0M944.1,1165.0L944.1,1165.5M1223.5,1165.0L1224.0,1165.0M1224.0,1165.0L1224.5,1165.5M944.1,1165.5L943.6,1166.0M944.1,1165.5L944.6,1166.0M1224.5,1165.5L1225.0,1165.5M1225.0,1165.5L1225.5,1166.0M943.6,1166.0L943.1,1166.5M944.6,1166.0L945.1,1166.5M1225.5,1166.0L1226.0,1166.0M1226.0,1166.0L1226.5,1166.5M943.1,1166.5L943.1,1167.0M945.1,1166.5L945.6,1166.5M945.6,1166.5L946.1,1166.5M945.6,1166.5L946.1,1167.0M946.1,1166.5L946.6,1166.5M946.1,1166.5L946.1,1167.0M946.6,1166.5L947.1,1166.5M946.6,1166.5L946.1,1167.0M1226.5,1166.5L1227.0,1166.5M1227.0,1166.5L1227.5,1167.0M943.1,1167.0L943.1,1167.5M946.1,1167.0L946.1,1167.5M1131.5,1167.0L1131.5,1167.5M1227.5,1167.0L1228.0,1167.0M1228.0,1167.0L1228.5,1167.0M1228.5,1167.0L1229.0,1167.5M943.1,1167.5L943.1,1168.0M1131.5,1167.5L1131.5,1168.0M1201.5,1167.5L1202.0,1167.5M1201.5,1167.5L1201.0,1168.0M1202.0,1167.5L1202.5,1167.5M1202.5,1167.5L1203.0,1167.5M1203.0,1167.5L1203.5,1168.0M1229.0,1167.5L1229.5,1167.5M1229.5,1167.5L1230.0,1168.0M943.1,1168.0L942.6,1168.5M1131.5,1168.0L1131.5,1168.5M1131.5,1168.0L1132.0,1168.5M1196.0,1168.0L1196.5,1168.0M1196.0,1168.0L1195.5,1168.5M1196.5,1168.0L1197.0,1168.0M1197.0,1168.0L1197.5,1168.0M1197.5,1168.0L1198.0,1168.0M1198.0,1168.0L1198.5,1168.0M1198.5,1168.0L1199.0,1168.0M1199.0,1168.0L1199.5,1168.0M1199.5,1168.0L1200.0,1168.0M1200.0,1168.0L1200.5,1168.0M1200.5,1168.0L1201.0,1168.0M1203.5,1168.0L1204.0,1168.5M1230.0,1168.0L1230.5,1168.0M1230.5,1168.0L1231.0,1168.5M942.6,1168.5L942.6,1169.0M1131.5,1168.5L1132.0,1168.5M1131.5,1168.5L1131.0,1169.0M1132.0,1168.5L1132.5,1168.5M1132.5,1168.5L1133.0,1168.5M1133.0,1168.5L1133.5,1168.5M1133.5,1168.5L1134.0,1168.5M1134.0,1168.5L1134.5,1169.0M1191.0,1168.5L1191.5,1168.5M1191.0,1168.5L1190.5,1169.0M1191.5,1168.5L1192.0,1168.5M1192.0,1168.5L1192.5,1168.5M1192.5,1168.5L1193.0,1168.5M1193.0,1168.5L1193.5,1168.5M1193.5,1168.5L1194.0,1168.5M1194.0,1168.5L1194.5,1168.5M1194.5,1168.5L1195.0,1168.5M1195.0,1168.5L1195.5,1168.5M1204.0,1168.5L1204.5,1168.5M1204.5,1168.5L1205.0,1169.0M1231.0,1168.5L1231.5,1168.5M1231.5,1168.5L1232.0,1169.0M942.6,1169.0L942.1,1169.5M1131.0,1169.0L1131.0,1169.5M1134.5,1169.0L1135.0,1169.0M1135.0,1169.0L1135.5,1169.0M1135.5,1169.0L1136.0,1169.0M1136.0,1169.0L1136.5,1169.0M1136.5,1169.0L1137.0,1169.0M1137.0,1169.0L1137.5,1169.0M1137.5,1169.0L1138.0,1169.0M1138.0,1169.0L1138.5,1169.0M1138.5,1169.0L1139.0,1169.0M1139.0,1169.0L1139.5,1169.0M1139.5,1169.0L1140.0,1169.0M1140.0,1169.0L1140.5,1169.5M1186.5,1169.0L1187.0,1169.0M1186.5,1169.0L1186.0,1169.5M1187.0,1169.0L1187.5,1169.0M1187.5,1169.0L1188.0,1169.0M1188.0,1169.0L1188.5,1169.0M1188.5,1169.0L1189.0,1169.0M1189.0,1169.0L1189.5,1169.0M1189.5,1169.0L1190.0,1169.0M1190.0,1169.0L1190.5,1169.0M1205.0,1169.0L1205.5,1169.5M1232.0,1169.0L1232.5,1169.0M1232.5,1169.0L1233.0,1169.5M942.1,1169.5L942.1,1170.0M1131.0,1169.5L1131.0,1170.0M1140.5,1169.5L1141.0,1169.5M1141.0,1169.5L1141.5,1169.5M1141.5,1169.5L1142.0,1169.5M1142.0,1169.5L1142.5,1169.5M1142.5,1169.5L1143.0,1169.5M1143.0,1169.5L1143.5,1169.5M1143.5,1169.5L1144.0,1169.5M1144.0,1169.5L1144.5,1169.5M1144.5,1169.5L1145.0,1169.5M1145.0,1169.5L1145.5,1169.5M1145.5,1169.5L1146.0,1169.5M1146.0,1169.5L1146.5,1169.5M1146.5,1169.5L1147.0,1169.5M1147.0,1169.5L1147.5,1169.5M1147.5,1169.5L1148.0,1169.5M1148.0,1169.5L1148.5,1169.5M1148.5,1169.5L1149.0,1169.5M1149.0,1169.5L1149.5,1169.5M1149.5,1169.5L1150.0,1169.5M1150.0,1169.5L1150.5,1169.5M1150.5,1169.5L1151.0,1169.5M1151.0,1169.5L1151.5,1169.5M1151.5,1169.5L1152.0,1169.5M1152.0,1169.5L1152.5,1169.5M1152.5,1169.5L1153.0,1169.5M1153.0,1169.5L1153.5,1169.5M1153.5,1169.5L1154.0,1169.5M1154.0,1169.5L1154.5,1169.5M1154.5,1169.5L1155.0,1169.5M1155.0,1169.5L1155.5,1169.5M1155.5,1169.5L1156.0,1169.5M1156.0,1169.5L1156.5,1169.5M1156.5,1169.5L1157.0,1169.5M1157.0,1169.5L1157.5,1170.0M1181.5,1169.5L1182.0,1169.5M1181.5,1169.5L1181.0,1170.0M1182.0,1169.5L1182.5,1169.5M1182.5,1169.5L1183.0,1169.5M1183.0,1169.5L1183.5,1169.5M1183.5,1169.5L1184.0,1169.5M1184.0,1169.5L1184.5,1169.5M1184.5,1169.5L1185.0,1169.5M1185.0,1169.5L1185.5,1169.5M1185.5,1169.5L1186.0,1169.5M1205.5,1169.5L1206.0,1170.0M1233.0,1169.5L1233.5,1169.5M1233.5,1169.5L1234.0,1170.0M942.1,1170.0L941.6,1170.5M1131.0,1170.0L1130.5,1170.5M1157.5,1170.0L1158.0,1170.0M1158.0,1170.0L1158.5,1170.0M1158.5,1170.0L1159.0,1170.0M1159.0,1170.0L1159.5,1170.0M1159.5,1170.0L1160.0,1170.0M1160.0,1170.0L1160.5,1170.0M1160.5,1170.0L1161.0,1170.0M1161.0,1170.0L1161.5,1170.0M1161.5,1170.0L1162.0,1170.0M1162.0,1170.0L1162.5,1170.0M1162.5,1170.0L1163.0,1170.0M1163.0,1170.0L1163.5,1170.0M1163.5,1170.0L1164.0,1170.0M1164.0,1170.0L1164.5,1170.0M1164.5,1170.0L1165.0,1170.0M1165.0,1170.0L1165.5,1170.0M1165.5,1170.0L1166.0,1170.5M1177.0,1170.0L1177.5,1170.0M1177.0,1170.0L1176.5,1170.5M1177.5,1170.0L1178.0,1170.0M1178.0,1170.0L1178.5,1170.0M1178.5,1170.0L1179.0,1170.0M1179.0,1170.0L1179.5,1170.0M1179.5,1170.0L1180.0,1170.0M1180.0,1170.0L1180.5,1170.0M1180.5,1170.0L1181.0,1170.0M1206.0,1170.0L1206.5,1170.5M1234.0,1170.0L1234.5,1170.0M1234.5,1170.0L1235.0,1170.5M941.6,1170.5L941.6,1171.0M1130.5,1170.5L1130.5,1171.0M1166.0,1170.5L1166.5,1170.5M1166.5,1170.5L1167.0,1170.5M1167.0,1170.5L1167.5,1170.5M1167.5,1170.5L1168.0,1170.5M1168.0,1170.5L1168.5,1170.5M1168.5,1170.5L1169.0,1170.5M1169.0,1170.5L1169.5,1170.5M1169.5,1170.5L1170.0,1170.5M1170.0,1170.5L1170.5,1170.5M1170.5,1170.5L1171.0,1170.5M1171.0,1170.5L1171.5,1170.5M1171.5,1170.5L1172.0,1170.5M1172.0,1170.5L1172.5,1170.5M1172.5,1170.5L1173.0,1170.5M1173.0,1170.5L1173.5,1170.5M1173.5,1170.5L1174.0,1170.5M1174.0,1170.5L1174.5,1170.5M1174.5,1170.5L1175.0,1170.5M1175.0,1170.5L1175.5,1170.5M1175.5,1170.5L1176.0,1170.5M1176.0,1170.5L1176.5,1170.5M1206.5,1170.5L1207.0,1171.0M1235.0,1170.5L1235.5,1170.5M1235.5,1170.5L1236.0,1171.0M941.6,1171.0L941.6,1171.5M1130.5,1171.0L1130.5,1171.5M1207.0,1171.0L1207.5,1171.5M1236.0,1171.0L1236.5,1171.0M1236.5,1171.0L1237.0,1171.0M1237.0,1171.0L1237.5,1171.5M941.6,1171.5L941.1,1172.0M1130.5,1171.5L1130.5,1172.0M1207.5,1171.5L1208.0,1172.0M1237.5,1171.5L1238.0,1171.5M1238.0,1171.5L1238.5,1171.5M1238.5,1171.5L1239.0,1172.0M941.1,1172.0L941.1,1172.5M1130.5,1172.0L1130.0,1172.5M1208.0,1172.0L1208.5,1172.5M1239.0,1172.0L1239.5,1172.0M1239.5,1172.0L1240.0,1172.5M941.1,1172.5L940.6,1173.0M1130.0,1172.5L1130.0,1173.0M1208.5,1172.5L1209.0,1173.0M1240.0,1172.5L1240.5,1172.5M1240.5,1172.5L1241.0,1172.5M1241.0,1172.5L1241.5,1173.0M940.6,1173.0L940.1,1173.5M1130.0,1173.0L1130.0,1173.5M1209.0,1173.0L1209.5,1173.5M1241.5,1173.0L1242.0,1173.0M1242.0,1173.0L1242.5,1173.0M1242.5,1173.0L1243.0,1173.5M940.1,1173.5L939.6,1174.0M1130.0,1173.5L1130.0,1174.0M1209.5,1173.5L1210.0,1173.5M1210.0,1173.5L1210.5,1174.0M1243.0,1173.5L1243.5,1173.5M1243.5,1173.5L1244.0,1173.5M1244.0,1173.5L1244.5,1174.0M939.6,1174.0L939.1,1174.5M1130.0,1174.0L1130.0,1174.5M1210.5,1174.0L1211.0,1174.5M1244.5,1174.0L1245.0,1174.0M1245.0,1174.0L1245.5,1174.5M939.1,1174.5L938.6,1175.0M1130.0,1174.5L1130.0,1175.0M1211.0,1174.5L1211.5,1175.0M1245.5,1174.5L1246.0,1174.5M1246.0,1174.5L1246.5,1175.0M938.1,1175.0L938.6,1175.0M938.1,1175.0L937.6,1175.5M1130.0,1175.0L1129.5,1175.5M1211.5,1175.0L1212.0,1175.5M1246.5,1175.0L1247.0,1175.5M937.6,1175.5L937.1,1176.0M1129.5,1175.5L1129.5,1176.0M1212.0,1175.5L1212.5,1176.0M1247.0,1175.5L1247.5,1175.5M1247.5,1175.5L1248.0,1176.0M937.1,1176.0L936.6,1176.5M1129.5,1176.0L1129.5,1176.5M1212.5,1176.0L1213.0,1176.5M1248.0,1176.0L1248.5,1176.0M1248.5,1176.0L1249.0,1176.5M936.1,1176.5L936.6,1176.5M936.1,1176.5L935.6,1177.0M1129.5,1176.5L1129.5,1177.0M1213.0,1176.5L1213.5,1176.5M1213.5,1176.5L1214.0,1176.5M1214.0,1176.5L1214.5,1177.0M1249.0,1176.5L1249.5,1177.0M935.6,1177.0L935.1,1177.5M1129.5,1177.0L1129.0,1177.5M1214.5,1177.0L1215.0,1177.0M1215.0,1177.0L1215.5,1177.5M1249.5,1177.0L1250.0,1177.0M1250.0,1177.0L1250.5,1177.5M935.1,1177.5L934.6,1178.0M1129.0,1177.5L1129.0,1178.0M1215.5,1177.5L1216.0,1177.5M1216.0,1177.5L1216.5,1178.0M1250.5,1177.5L1251.0,1177.5M1251.0,1177.5L1251.5,1178.0M934.6,1178.0L934.1,1178.5M1129.0,1178.0L1129.0,1178.5M1216.5,1178.0L1217.0,1178.5M1251.5,1178.0L1252.0,1178.0M1252.0,1178.0L1252.5,1178.5M934.1,1178.5L933.6,1179.0M1129.0,1178.5L1129.0,1179.0M1217.0,1178.5L1217.5,1178.5M1217.5,1178.5L1218.0,1179.0M1252.5,1178.5L1253.0,1178.5M1253.0,1178.5L1253.5,1179.0M933.1,1179.0L933.6,1179.0M933.1,1179.0L932.6,1179.5M1129.0,1179.0L1129.0,1179.5M1218.0,1179.0L1218.5,1179.5M1253.5,1179.0L1254.0,1179.0M1254.0,1179.0L1254.5,1179.5M932.6,1179.5L932.1,1180.0M1129.0,1179.5L1129.0,1180.0M1218.5,1179.5L1219.0,1179.5M1219.0,1179.5L1219.5,1180.0M1254.5,1179.5L1255.0,1180.0M932.1,1180.0L931.6,1180.5M1129.0,1180.0L1129.0,1180.5M1129.0,1180.0L1129.5,1180.5M1219.5,1180.0L1220.0,1180.0M1220.0,1180.0L1220.5,1180.5M1255.0,1180.0L1255.5,1180.5M931.1,1180.5L931.6,1180.5M931.1,1180.5L930.6,1181.0M1129.0,1180.5L1129.5,1180.5M1129.0,1180.5L1129.0,1181.0M1129.5,1180.5L1130.0,1180.5M1129.5,1180.5L1129.0,1181.0M1130.0,1180.5L1130.5,1180.5M1130.5,1180.5L1131.0,1180.5M1131.0,1180.5L1131.5,1180.5M1131.5,1180.5L1132.0,1180.5M1220.5,1180.5L1221.0,1180.5M1221.0,1180.5L1221.5,1181.0M1255.5,1180.5L1255.5,1181.0M930.6,1181.0L930.1,1181.5M1129.0,1181.0L1129.0,1181.5M1221.5,1181.0L1222.0,1181.5M1255.5,1181.0L1255.5,1181.5M890.6,1181.5L890.6,1182.0M930.1,1181.5L929.6,1182.0M1129.0,1181.5L1129.0,1182.0M1222.0,1181.5L1222.5,1181.5M1222.5,1181.5L1223.0,1182.0M1255.5,1181.5L1255.5,1182.0M890.6,1182.0L890.6,1182.5M929.6,1182.0L929.1,1182.5M1129.0,1182.0L1129.0,1182.5M1223.0,1182.0L1223.5,1182.5M1255.5,1182.0L1255.5,1182.5M885.1,1182.5L885.1,1183.0M890.6,1182.5L890.1,1183.0M890.6,1182.5L890.6,1183.0M890.6,1182.5L891.1,1183.0M928.6,1182.5L929.1,1182.5M928.6,1182.5L928.1,1183.0M1129.0,1182.5L1129.0,1183.0M1223.5,1182.5L1224.0,1182.5M1224.0,1182.5L1224.5,1183.0M1255.5,1182.5L1255.5,1183.0M885.1,1183.0L884.6,1183.5M885.1,1183.0L885.1,1183.5M885.1,1183.0L885.6,1183.5M888.1,1183.0L888.6,1183.0M888.1,1183.0L887.6,1183.5M888.6,1183.0L889.1,1183.0M889.1,1183.0L889.6,1183.0M889.6,1183.0L890.1,1183.0M890.1,1183.0L890.6,1183.0M890.6,1183.0L891.1,1183.0M891.1,1183.0L891.6,1183.0M891.6,1183.0L892.1,1183.0M892.1,1183.0L892.6,1183.0M892.6,1183.0L893.1,1183.0M893.1,1183.0L893.6,1183.0M893.6,1183.0L894.1,1183.0M894.1,1183.0L894.6,1183.0M894.6,1183.0L895.1,1183.0M895.1,1183.0L895.6,1183.0M895.6,1183.0L896.1,1183.0M896.1,1183.0L896.6,1183.0M896.6,1183.0L897.1,1183.0M897.1,1183.0L897.6,1183.0M897.6,1183.0L898.1,1183.0M898.1,1183.0L898.6,1183.0M898.6,1183.0L899.1,1183.0M899.1,1183.0L899.6,1183.0M899.6,1183.0L900.1,1183.0M900.1,1183.0L900.6,1183.0M900.6,1183.0L901.1,1183.0M901.1,1183.0L901.6,1183.0M901.6,1183.0L902.1,1183.0M902.1,1183.0L902.6,1183.0M902.6,1183.0L903.1,1183.0M903.1,1183.0L903.6,1183.0M903.6,1183.0L904.1,1183.0M904.1,1183.0L904.6,1183.0M904.6,1183.0L905.1,1183.0M905.1,1183.0L905.6,1183.0M905.6,1183.0L906.1,1183.0M906.1,1183.0L906.6,1183.0M906.6,1183.0L907.1,1183.0M907.1,1183.0L907.6,1183.0M907.6,1183.0L908.1,1183.0M908.1,1183.0L908.6,1183.0M908.6,1183.0L909.1,1183.0M909.1,1183.0L909.6,1183.0M909.6,1183.0L910.1,1183.0M910.1,1183.0L910.6,1183.5M928.1,1183.0L927.6,1183.5M1129.0,1183.0L1129.0,1183.5M1224.5,1183.0L1225.0,1183.5M1255.5,1183.0L1255.5,1183.5M884.6,1183.5L885.1,1183.5M884.6,1183.5L884.1,1184.0M885.1,1183.5L885.6,1183.5M885.6,1183.5L886.1,1183.5M886.1,1183.5L886.6,1183.5M886.6,1183.5L887.1,1183.5M887.1,1183.5L887.6,1183.5M910.6,1183.5L911.1,1184.0M927.6,1183.5L927.1,1184.0M1129.0,1183.5L1129.5,1184.0M1225.0,1183.5L1225.5,1184.0M1255.5,1183.5L1255.5,1184.0M884.1,1184.0L883.6,1184.5M911.1,1184.0L911.6,1184.5M927.1,1184.0L927.1,1184.5M1129.5,1184.0L1129.5,1184.5M1225.5,1184.0L1226.0,1184.0M1226.0,1184.0L1226.5,1184.5M1255.5,1184.0L1255.5,1184.5M883.6,1184.5L883.1,1185.0M911.6,1184.5L912.1,1185.0M927.1,1184.5L927.1,1185.0M1129.5,1184.5L1129.5,1185.0M1226.5,1184.5L1227.0,1185.0M1255.5,1184.5L1255.5,1185.0M883.1,1185.0L882.6,1185.5M912.1,1185.0L912.6,1185.5M927.1,1185.0L926.6,1185.5M1129.5,1185.0L1129.5,1185.5M1227.0,1185.0L1227.5,1185.5M1255.5,1185.0L1255.5,1185.5M882.6,1185.5L882.1,1186.0M912.6,1185.5L913.1,1186.0M926.1,1185.5L926.6,1185.5M926.1,1185.5L925.6,1186.0M1129.5,1185.5L1129.5,1186.0M1227.5,1185.5L1228.0,1186.0M1255.5,1185.5L1255.5,1186.0M882.1,1186.0L881.6,1186.5M913.1,1186.0L913.6,1186.5M925.6,1186.0L925.1,1186.5M1129.5,1186.0L1129.5,1186.5M1228.0,1186.0L1228.5,1186.5M1255.5,1186.0L1255.5,1186.5M881.6,1186.5L881.1,1187.0M913.6,1186.5L914.1,1187.0M925.1,1186.5L924.6,1187.0M1129.5,1186.5L1129.5,1187.0M1228.5,1186.5L1229.0,1186.5M1229.0,1186.5L1229.5,1187.0M1255.5,1186.5L1255.0,1187.0M881.1,1187.0L880.6,1187.5M914.1,1187.0L914.6,1187.5M924.6,1187.0L924.1,1187.5M1129.5,1187.0L1129.0,1187.5M1229.5,1187.0L1230.0,1187.5M1253.0,1187.0L1253.5,1187.0M1253.0,1187.0L1252.5,1187.5M1253.5,1187.0L1254.0,1187.0M1254.0,1187.0L1254.5,1187.0M1254.5,1187.0L1255.0,1187.0M880.6,1187.5L880.1,1188.0M914.6,1187.5L915.1,1187.5M915.1,1187.5L915.6,1188.0M923.6,1187.5L924.1,1187.5M923.6,1187.5L923.1,1188.0M1129.0,1187.5L1129.0,1188.0M1230.0,1187.5L1230.5,1188.0M1251.0,1187.5L1251.5,1187.5M1251.0,1187.5L1250.5,1188.0M1251.5,1187.5L1252.0,1187.5M1252.0,1187.5L1252.5,1187.5M880.1,1188.0L879.6,1188.5M915.6,1188.0L916.1,1188.5M923.1,1188.0L922.6,1188.5M1129.0,1188.0L1129.0,1188.5M1230.5,1188.0L1231.0,1188.5M1250.0,1188.0L1250.5,1188.0M1250.0,1188.0L1249.5,1188.5M879.6,1188.5L879.1,1189.0M916.1,1188.5L916.6,1188.5M916.6,1188.5L917.1,1189.0M922.6,1188.5L922.1,1189.0M1129.0,1188.5L1129.0,1189.0M1231.0,1188.5L1231.5,1189.0M1249.5,1188.5L1249.0,1189.0M879.1,1189.0L878.6,1189.5M917.1,1189.0L917.6,1189.0M917.6,1189.0L918.1,1189.5M922.1,1189.0L921.6,1189.5M1129.0,1189.0L1129.0,1189.5M1231.5,1189.0L1232.0,1189.0M1232.0,1189.0L1232.5,1189.5M1249.0,1189.0L1248.5,1189.5M878.6,1189.5L878.1,1190.0M918.1,1189.5L918.6,1189.5M918.6,1189.5L919.1,1190.0M921.6,1189.5L921.1,1190.0M1129.0,1189.5L1129.0,1190.0M1232.5,1189.5L1233.0,1190.0M1248.5,1189.5L1248.0,1190.0M878.1,1190.0L877.6,1190.5M919.1,1190.0L919.6,1190.0M919.6,1190.0L920.1,1190.0M920.1,1190.0L920.6,1190.0M920.6,1190.0L921.1,1190.0M1129.0,1190.0L1128.5,1190.5M1233.0,1190.0L1233.5,1190.5M1248.0,1190.0L1248.0,1190.5M877.6,1190.5L877.1,1191.0M1128.5,1190.5L1128.5,1191.0M1233.5,1190.5L1234.0,1191.0M1248.0,1190.5L1247.5,1191.0M877.1,1191.0L876.6,1191.5M1128.5,1191.0L1128.5,1191.5M1234.0,1191.0L1234.5,1191.5M1247.5,1191.0L1247.0,1191.5M876.6,1191.5L876.1,1192.0M1128.5,1191.5L1128.0,1192.0M1234.5,1191.5L1235.0,1191.5M1235.0,1191.5L1235.5,1192.0M1247.0,1191.5L1247.0,1192.0M876.1,1192.0L875.6,1192.5M876.1,1192.0L876.1,1192.5M1128.0,1192.0L1128.0,1192.5M1235.5,1192.0L1236.0,1192.5M1247.0,1192.0L1246.5,1192.5M875.6,1192.5L876.1,1192.5M875.6,1192.5L875.1,1193.0M876.1,1192.5L876.6,1193.0M1128.0,1192.5L1128.0,1193.0M1236.0,1192.5L1236.5,1193.0M1246.5,1192.5L1246.0,1193.0M874.6,1193.0L875.1,1193.0M874.6,1193.0L874.1,1193.5M876.6,1193.0L876.6,1193.5M1128.0,1193.0L1127.5,1193.5M1236.5,1193.0L1237.0,1193.5M1246.0,1193.0L1246.0,1193.5M874.1,1193.5L873.6,1194.0M876.6,1193.5L876.6,1194.0M1127.5,1193.5L1127.5,1194.0M1237.0,1193.5L1237.5,1193.5M1237.5,1193.5L1238.0,1194.0M1246.0,1193.5L1245.5,1194.0M873.6,1194.0L873.1,1194.5M876.6,1194.0L876.6,1194.5M1127.5,1194.0L1127.0,1194.5M1238.0,1194.0L1238.5,1194.0M1238.5,1194.0L1239.0,1194.5M1245.5,1194.0L1245.0,1194.5M873.1,1194.5L872.6,1195.0M873.1,1194.5L873.1,1195.0M876.6,1194.5L876.6,1195.0M1127.0,1194.5L1127.0,1195.0M1239.0,1194.5L1239.5,1194.5M1239.5,1194.5L1240.0,1195.0M1245.0,1194.5L1244.5,1195.0M870.1,1195.0L870.6,1195.0M870.1,1195.0L869.6,1195.5M870.6,1195.0L871.1,1195.0M871.1,1195.0L871.6,1195.0M871.6,1195.0L872.1,1195.0M872.1,1195.0L872.6,1195.0M872.6,1195.0L873.1,1195.0M873.1,1195.0L873.6,1195.5M876.6,1195.0L876.6,1195.5M1127.0,1195.0L1127.0,1195.5M1240.0,1195.0L1240.5,1195.0M1240.5,1195.0L1241.0,1195.5M1244.5,1195.0L1244.0,1195.5M869.1,1195.5L869.6,1195.5M873.6,1195.5L874.1,1196.0M876.6,1195.5L876.1,1196.0M876.6,1195.5L876.6,1196.0M1127.0,1195.5L1126.5,1196.0M1241.0,1195.5L1241.5,1195.5M1241.5,1195.5L1242.0,1195.5M1242.0,1195.5L1242.5,1195.5M1242.5,1195.5L1243.0,1195.5M1243.0,1195.5L1243.5,1195.5M1243.5,1195.5L1244.0,1195.5M874.1,1196.0L874.6,1196.0M874.6,1196.0L875.1,1196.0M875.1,1196.0L875.6,1196.0M875.6,1196.0L876.1,1196.0M876.1,1196.0L876.6,1196.0M876.6,1196.0L877.1,1196.5M1126.5,1196.0L1126.5,1196.5M877.1,1196.5L877.6,1196.5M877.6,1196.5L878.1,1197.0M1126.5,1196.5L1126.0,1197.0M878.1,1197.0L878.6,1197.0M878.1,1197.0L878.1,1197.5M878.6,1197.0L879.1,1197.0M878.6,1197.0L878.1,1197.5M879.1,1197.0L879.6,1197.0M879.6,1197.0L880.1,1197.0M880.1,1197.0L880.6,1197.0M880.6,1197.0L881.1,1197.0M881.1,1197.0L881.6,1197.5M1126.0,1197.0L1125.5,1197.5M878.1,1197.5L878.1,1198.0M881.6,1197.5L881.6,1198.0M1125.5,1197.5L1125.0,1198.0M878.1,1198.0L878.1,1198.5M881.6,1198.0L881.6,1198.5M1125.0,1198.0L1125.0,1198.5M878.1,1198.5L878.1,1199.0M881.6,1198.5L881.6,1199.0M1125.0,1198.5L1124.5,1199.0M878.1,1199.0L878.1,1199.5M881.6,1199.0L881.6,1199.5M1124.5,1199.0L1124.0,1199.5M878.1,1199.5L878.1,1200.0M881.6,1199.5L881.6,1200.0M1124.0,1199.5L1123.5,1200.0M881.6,1200.0L881.6,1200.5M1123.5,1200.0L1123.5,1200.5M881.6,1200.5L881.6,1201.0M1123.5,1200.5L1123.0,1201.0M881.6,1201.0L881.6,1201.5M1123.0,1201.0L1122.5,1201.5M881.6,1201.5L881.6,1202.0M1122.5,1201.5L1122.5,1202.0M881.6,1202.0L881.6,1202.5M1122.5,1202.0L1122.0,1202.5M881.6,1202.5L881.6,1203.0M1122.0,1202.5L1121.5,1203.0M881.6,1203.0L881.6,1203.5M1121.5,1203.0L1121.0,1203.5M881.6,1203.5L881.6,1204.0M1121.0,1203.5L1121.0,1204.0M881.6,1204.0L881.6,1204.5M1121.0,1204.0L1120.5,1204.5M881.6,1204.5L881.6,1205.0M1120.5,1204.5L1120.0,1205.0M881.6,1205.0L881.6,1205.5M1120.0,1205.0L1119.5,1205.5M881.6,1205.5L881.6,1206.0M1119.5,1205.5L1119.0,1206.0M881.6,1206.0L881.6,1206.5M1119.0,1206.0L1118.5,1206.5M881.6,1206.5L881.6,1207.0M1118.5,1206.5L1118.5,1207.0M881.6,1207.0L881.6,1207.5M1118.5,1207.0L1118.0,1207.5M881.6,1207.5L881.6,1208.0M1118.0,1207.5L1117.5,1208.0M881.6,1208.0L881.6,1208.5M1117.5,1208.0L1117.0,1208.5M881.6,1208.5L881.6,1209.0M1117.0,1208.5L1117.0,1209.0M881.6,1209.0L881.6,1209.5M1117.0,1209.0L1116.5,1209.5M881.6,1209.5L882.1,1210.0M1116.5,1209.5L1116.0,1210.0M882.1,1210.0L882.6,1210.0M882.6,1210.0L883.1,1210.0M883.1,1210.0L883.6,1210.0M883.6,1210.0L884.1,1210.0M884.1,1210.0L884.6,1210.0M884.6,1210.0L885.1,1210.0M885.1,1210.0L885.6,1210.0M885.6,1210.0L886.1,1210.0M886.1,1210.0L886.6,1210.0M886.6,1210.0L887.1,1210.0M887.1,1210.0L887.6,1210.0M887.6,1210.0L888.1,1210.0M888.1,1210.0L888.6,1210.0M888.6,1210.0L889.1,1210.0M889.1,1210.0L889.6,1210.0M889.6,1210.0L890.1,1210.0M890.1,1210.0L890.6,1210.0M890.6,1210.0L891.1,1210.0M891.1,1210.0L891.6,1210.0M891.6,1210.0L892.1,1210.0M892.1,1210.0L892.6,1210.0M892.6,1210.0L893.1,1210.0M893.1,1210.0L893.6,1210.0M893.6,1210.0L894.1,1210.0M894.1,1210.0L894.6,1210.0M894.6,1210.0L895.1,1210.0M895.1,1210.0L895.6,1210.0M895.6,1210.0L896.1,1210.0M896.1,1210.0L896.6,1210.0M896.6,1210.0L897.1,1210.0M897.1,1210.0L897.6,1210.0M897.6,1210.0L898.1,1210.0M898.1,1210.0L898.6,1210.0M898.6,1210.0L899.1,1210.0M899.1,1210.0L899.6,1210.0M899.6,1210.0L900.1,1210.0M900.1,1210.0L900.6,1210.0M900.6,1210.0L901.1,1210.0M901.1,1210.0L901.6,1210.0M901.6,1210.0L902.1,1210.0M902.1,1210.0L902.6,1210.0M902.6,1210.0L903.1,1210.0M903.1,1210.0L903.6,1210.0M903.6,1210.0L904.1,1210.0M904.1,1210.0L904.6,1210.0M904.6,1210.0L905.1,1210.0M905.1,1210.0L905.6,1210.0M905.6,1210.0L906.1,1210.0M906.1,1210.0L906.6,1210.0M906.6,1210.0L907.1,1210.0M907.1,1210.0L907.6,1210.0M907.6,1210.0L908.1,1210.0M908.1,1210.0L908.6,1210.0M908.6,1210.0L909.1,1210.0M909.1,1210.0L909.6,1210.5M1116.0,1210.0L1116.0,1210.5M909.6,1210.5L910.1,1210.5M910.1,1210.5L910.6,1211.0M1116.0,1210.5L1115.5,1211.0M910.6,1211.0L911.1,1211.0M911.1,1211.0L911.6,1211.5M1115.5,1211.0L1115.0,1211.5M911.6,1211.5L912.1,1211.5M912.1,1211.5L912.6,1212.0M1115.0,1211.5L1114.5,1212.0M912.6,1212.0L913.1,1212.0M913.1,1212.0L913.6,1212.5M1114.5,1212.0L1114.0,1212.5M913.6,1212.5L914.1,1212.5M914.1,1212.5L914.6,1213.0M1114.0,1212.5L1113.5,1213.0M914.6,1213.0L915.1,1213.0M915.1,1213.0L915.6,1213.5M1113.5,1213.0L1113.5,1213.5M915.6,1213.5L916.1,1213.5M916.1,1213.5L916.6,1214.0M1113.5,1213.5L1113.0,1214.0M916.6,1214.0L917.1,1214.5M1113.0,1214.0L1112.5,1214.5M917.1,1214.5L917.6,1214.5M917.6,1214.5L918.1,1215.0M1112.5,1214.5L1112.5,1215.0M918.1,1215.0L918.6,1215.0M918.6,1215.0L919.1,1215.0M919.1,1215.0L919.6,1215.5M1112.5,1215.0L1112.5,1215.5M919.6,1215.5L920.1,1216.0M1112.5,1215.5L1112.0,1216.0M920.1,1216.0L920.6,1216.0M920.6,1216.0L921.1,1216.5M1112.0,1216.0L1112.0,1216.5M921.1,1216.5L921.6,1216.5M921.6,1216.5L922.1,1217.0M1112.0,1216.5L1111.5,1217.0M922.1,1217.0L922.6,1217.0M922.6,1217.0L923.1,1217.5M1111.5,1217.0L1111.5,1217.5M923.1,1217.5L923.6,1217.5M923.6,1217.5L924.1,1218.0M1111.5,1217.5L1111.0,1218.0M924.1,1218.0L924.6,1218.0M924.6,1218.0L925.1,1218.5M1111.0,1218.0L1111.0,1218.5M925.1,1218.5L925.6,1218.5M925.6,1218.5L926.1,1219.0M1111.0,1218.5L1111.0,1219.0M926.1,1219.0L926.6,1219.0M926.6,1219.0L927.1,1219.5M1111.0,1219.0L1110.5,1219.5M927.1,1219.5L927.6,1220.0M1110.5,1219.5L1110.5,1220.0M927.6,1220.0L927.6,1220.5M1110.5,1220.0L1110.0,1220.5M927.6,1220.5L928.1,1221.0M1110.0,1220.5L1110.0,1221.0M928.1,1221.0L928.1,1221.5M1110.0,1221.0L1109.5,1221.5M928.1,1221.5L928.6,1222.0M1109.5,1221.5L1109.5,1222.0M928.6,1222.0L928.6,1222.5M1109.5,1222.0L1109.0,1222.5M928.6,1222.5L929.1,1223.0M1109.0,1222.5L1109.0,1223.0M929.1,1223.0L929.1,1223.5M1109.0,1223.0L1108.5,1223.5M929.1,1223.5L929.6,1224.0M1108.5,1223.5L1108.5,1224.0M929.6,1224.0L929.6,1224.5M1108.5,1224.0L1108.5,1224.5M929.6,1224.5L930.1,1225.0M1108.5,1224.5L1108.0,1225.0M930.1,1225.0L930.1,1225.5M1108.0,1225.0L1108.0,1225.5M930.1,1225.5L930.6,1226.0M1108.0,1225.5L1107.5,1226.0M930.6,1226.0L931.1,1226.5M1107.5,1226.0L1107.5,1226.5M931.1,1226.5L931.1,1227.0M1107.5,1226.5L1107.5,1227.0M931.1,1227.0L931.1,1227.5M1107.5,1227.0L1107.5,1227.5M931.1,1227.5L931.1,1228.0M1107.5,1227.5L1107.5,1228.0M931.1,1228.0L931.6,1228.5M1107.5,1228.0L1107.5,1228.5M931.6,1228.5L931.6,1229.0M1107.5,1228.5L1108.0,1229.0M931.6,1229.0L931.1,1229.5M1108.0,1229.0L1107.5,1229.5M1108.0,1229.0L1108.0,1229.5M1108.0,1229.0L1108.5,1229.5M931.1,1229.5L931.1,1230.0M1107.5,1229.5L1108.0,1229.5M1107.5,1229.5L1107.0,1230.0M1108.0,1229.5L1108.5,1229.5M1108.5,1229.5L1109.0,1229.5M1109.0,1229.5L1109.5,1229.5M1109.5,1229.5L1110.0,1229.5M1110.0,1229.5L1110.5,1230.0M931.1,1230.0L931.1,1230.5M1107.0,1230.0L1106.5,1230.5M1110.5,1230.0L1111.0,1230.0M1111.0,1230.0L1111.5,1230.0M1111.5,1230.0L1112.0,1230.5M931.1,1230.5L930.6,1231.0M1106.5,1230.5L1106.0,1231.0M1112.0,1230.5L1112.5,1230.5M1112.5,1230.5L1113.0,1230.5M1113.0,1230.5L1113.5,1230.5M1113.5,1230.5L1114.0,1231.0M930.6,1231.0L930.6,1231.5M1106.0,1231.0L1106.0,1231.5M1114.0,1231.0L1114.5,1231.0M1114.5,1231.0L1115.0,1231.0M1115.0,1231.0L1115.5,1231.0M1115.5,1231.0L1116.0,1231.0M1116.0,1231.0L1116.5,1231.5M930.6,1231.5L930.1,1232.0M1106.0,1231.5L1106.0,1232.0M1116.5,1231.5L1117.0,1231.5M1117.0,1231.5L1117.5,1231.5M1117.5,1231.5L1118.0,1231.5M1118.0,1231.5L1118.5,1231.5M1118.5,1231.5L1119.0,1231.5M1119.0,1231.5L1119.5,1231.5M1119.5,1231.5L1120.0,1231.5M1120.0,1231.5L1120.5,1231.5M1120.5,1231.5L1121.0,1231.5M1121.0,1231.5L1121.5,1232.0M930.1,1232.0L930.1,1232.5M969.1,1232.0L968.6,1232.5M1106.0,1232.0L1105.5,1232.5M1121.5,1232.0L1122.0,1232.5M930.1,1232.5L929.6,1233.0M968.6,1232.5L968.1,1233.0M1105.5,1232.5L1105.5,1233.0M929.6,1233.0L929.6,1233.5M968.1,1233.0L968.1,1233.5M1105.5,1233.0L1105.5,1233.5M929.6,1233.5L929.1,1234.0M968.1,1233.5L968.1,1234.0M1105.5,1233.5L1105.0,1234.0M929.1,1234.0L929.1,1234.5M968.1,1234.0L968.1,1234.5M1105.0,1234.0L1105.0,1234.5M929.1,1234.5L928.6,1235.0M968.1,1234.5L967.6,1235.0M968.1,1234.5L968.1,1235.0M1105.0,1234.5L1104.5,1235.0M928.6,1235.0L928.6,1235.5M966.6,1235.0L967.1,1235.0M966.6,1235.0L966.1,1235.5M967.1,1235.0L967.6,1235.0M967.6,1235.0L968.1,1235.0M968.1,1235.0L968.6,1235.5M974.6,1235.0L974.1,1235.5M1104.5,1235.0L1104.5,1235.5M928.6,1235.5L928.1,1236.0M965.6,1235.5L966.1,1235.5M965.6,1235.5L965.1,1236.0M968.6,1235.5L969.1,1235.5M969.1,1235.5L969.6,1235.5M969.6,1235.5L970.1,1235.5M970.1,1235.5L970.6,1236.0M974.1,1235.5L973.6,1236.0M1104.5,1235.5L1104.0,1236.0M928.1,1236.0L928.1,1236.5M965.1,1236.0L964.6,1236.5M970.6,1236.0L971.1,1236.0M971.1,1236.0L971.6,1236.0M971.6,1236.0L972.1,1236.0M972.1,1236.0L972.6,1236.0M972.6,1236.0L973.1,1236.0M973.1,1236.0L973.6,1236.0M973.1,1236.0L973.6,1236.5M973.6,1236.0L973.6,1236.5M1104.0,1236.0L1104.0,1236.5M928.1,1236.5L927.6,1237.0M964.6,1236.5L964.6,1237.0M973.6,1236.5L974.1,1237.0M1104.0,1236.5L1104.0,1237.0M927.6,1237.0L927.1,1237.5M964.6,1237.0L964.1,1237.5M974.1,1237.0L974.6,1237.5M1104.0,1237.0L1103.5,1237.5M927.1,1237.5L927.1,1238.0M964.1,1237.5L964.1,1238.0M974.6,1237.5L975.1,1238.0M1103.5,1237.5L1103.5,1238.0M927.1,1238.0L926.6,1238.5M964.1,1238.0L963.6,1238.5M975.1,1238.0L975.6,1238.5M1103.5,1238.0L1103.0,1238.5M926.6,1238.5L926.1,1239.0M963.6,1238.5L963.1,1239.0M975.6,1238.5L976.1,1239.0M1103.0,1238.5L1103.0,1239.0M926.1,1239.0L925.6,1239.5M963.1,1239.0L963.1,1239.5M976.1,1239.0L976.6,1239.5M1103.0,1239.0L1103.0,1239.5M925.6,1239.5L925.1,1240.0M963.1,1239.5L962.6,1240.0M976.6,1239.5L977.1,1240.0M1103.0,1239.5L1102.5,1240.0M925.1,1240.0L924.6,1240.5M962.6,1240.0L962.1,1240.5M977.1,1240.0L977.6,1240.5M1102.5,1240.0L1102.5,1240.5M924.6,1240.5L924.6,1241.0M962.1,1240.5L962.1,1241.0M977.6,1240.5L978.1,1241.0M1102.5,1240.5L1102.5,1241.0M924.6,1241.0L924.1,1241.5M962.1,1241.0L962.1,1241.5M978.1,1241.0L978.6,1241.5M1102.5,1241.0L1102.0,1241.5M924.1,1241.5L923.6,1242.0M962.1,1241.5L961.6,1242.0M978.6,1241.5L979.1,1242.0M1102.0,1241.5L1102.0,1242.0M923.6,1242.0L923.1,1242.5M961.6,1242.0L961.1,1242.5M979.1,1242.0L979.6,1242.5M1102.0,1242.0L1101.5,1242.5M923.1,1242.5L922.6,1243.0M961.1,1242.5L960.6,1243.0M979.6,1242.5L979.6,1243.0M1101.5,1242.5L1101.5,1243.0M922.6,1243.0L922.6,1243.5M960.6,1243.0L960.6,1243.5M979.6,1243.0L979.6,1243.5M1101.5,1243.0L1101.5,1243.5M922.6,1243.5L922.1,1244.0M960.6,1243.5L960.1,1244.0M979.6,1243.5L980.1,1244.0M1101.5,1243.5L1101.0,1244.0M922.1,1244.0L921.6,1244.5M960.1,1244.0L959.6,1244.5M980.1,1244.0L980.6,1244.0M980.6,1244.0L981.1,1244.5M1101.0,1244.0L1101.0,1244.5M921.6,1244.5L921.1,1245.0M959.6,1244.5L959.6,1245.0M981.1,1244.5L981.6,1245.0M1101.0,1244.5L1100.5,1245.0M921.1,1245.0L920.6,1245.5M959.6,1245.0L959.1,1245.5M981.6,1245.0L981.6,1245.5M1100.5,1245.0L1100.5,1245.5M920.6,1245.5L920.1,1246.0M959.1,1245.5L958.6,1246.0M981.6,1245.5L982.1,1246.0M1100.5,1245.5L1100.0,1246.0M920.1,1246.0L920.1,1246.5M958.6,1246.0L958.6,1246.5M982.1,1246.0L982.6,1246.5M1100.0,1246.0L1100.0,1246.5M920.1,1246.5L919.6,1247.0M958.6,1246.5L958.1,1247.0M982.6,1246.5L983.1,1247.0M1100.0,1246.5L1100.0,1247.0M919.6,1247.0L919.1,1247.5M958.1,1247.0L957.6,1247.5M983.1,1247.0L983.6,1247.0M983.6,1247.0L984.1,1247.5M1100.0,1247.0L1099.5,1247.5M919.1,1247.5L919.1,1248.0M957.6,1247.5L957.1,1248.0M984.1,1247.5L984.6,1247.5M984.6,1247.5L985.1,1248.0M1099.5,1247.5L1099.0,1248.0M919.1,1248.0L918.6,1248.5M957.1,1248.0L956.6,1248.5M985.1,1248.0L985.6,1248.5M1099.0,1248.0L1098.5,1248.5M918.6,1248.5L918.6,1249.0M956.6,1248.5L956.1,1249.0M985.6,1248.5L986.1,1249.0M1098.5,1248.5L1098.0,1249.0M918.6,1249.0L918.1,1249.5M955.6,1249.0L956.1,1249.0M955.6,1249.0L955.1,1249.5M986.1,1249.0L986.6,1249.5M1097.5,1249.0L1098.0,1249.0M1097.5,1249.0L1097.0,1249.5M918.1,1249.5L918.1,1250.0M955.1,1249.5L954.6,1250.0M986.6,1249.5L986.6,1250.0M1097.0,1249.5L1096.5,1250.0M918.1,1250.0L917.6,1250.5M954.1,1250.0L954.6,1250.0M954.1,1250.0L953.6,1250.5M986.6,1250.0L987.1,1250.5M1096.0,1250.0L1096.5,1250.0M1096.0,1250.0L1095.5,1250.5M917.6,1250.5L917.6,1251.0M953.6,1250.5L953.1,1251.0M987.1,1250.5L987.6,1250.5M987.6,1250.5L988.1,1251.0M1095.0,1250.5L1095.5,1250.5M1095.0,1250.5L1094.5,1251.0M917.6,1251.0L917.1,1251.5M917.6,1251.0L917.6,1251.5M917.6,1251.0L918.1,1251.5M919.1,1251.0L919.6,1251.0M919.1,1251.0L918.6,1251.5M919.6,1251.0L920.1,1251.0M920.1,1251.0L920.6,1251.0M920.6,1251.0L921.1,1251.0M921.1,1251.0L921.6,1251.0M921.6,1251.0L922.1,1251.0M922.1,1251.0L922.6,1251.0M922.6,1251.0L923.1,1251.0M923.1,1251.0L923.6,1251.0M923.6,1251.0L924.1,1251.0M924.1,1251.0L924.6,1251.0M924.6,1251.0L925.1,1251.5M952.6,1251.0L953.1,1251.0M952.6,1251.0L952.1,1251.5M988.1,1251.0L988.6,1251.5M1094.5,1251.0L1094.0,1251.5M917.1,1251.5L917.6,1251.5M917.1,1251.5L916.6,1252.0M917.6,1251.5L918.1,1251.5M918.1,1251.5L918.6,1251.5M925.1,1251.5L925.6,1251.5M925.6,1251.5L926.1,1251.5M926.1,1251.5L926.6,1251.5M926.6,1251.5L927.1,1251.5M927.1,1251.5L927.6,1252.0M952.1,1251.5L951.6,1252.0M988.6,1251.5L989.1,1252.0M1093.5,1251.5L1094.0,1251.5M1093.5,1251.5L1093.0,1252.0M916.6,1252.0L916.6,1252.5M927.6,1252.0L928.1,1252.0M928.1,1252.0L928.6,1252.0M928.6,1252.0L929.1,1252.5M937.6,1252.0L938.1,1252.0M937.6,1252.0L937.1,1252.5M938.1,1252.0L938.6,1252.0M938.6,1252.0L939.1,1252.0M939.1,1252.0L939.6,1252.0M939.6,1252.0L940.1,1252.0M940.1,1252.0L940.6,1252.0M940.6,1252.0L941.1,1252.5M951.1,1252.0L951.6,1252.0M951.1,1252.0L950.6,1252.5M989.1,1252.0L989.5,1252.5M1092.5,1252.0L1093.0,1252.0M1092.5,1252.0L1092.0,1252.5M916.6,1252.5L917.1,1253.0M929.1,1252.5L929.6,1252.5M929.6,1252.5L930.1,1252.5M930.1,1252.5L930.6,1252.5M930.6,1252.5L931.1,1253.0M934.6,1252.5L935.1,1252.5M934.6,1252.5L934.1,1253.0M935.1,1252.5L935.6,1252.5M935.6,1252.5L936.1,1252.5M936.1,1252.5L936.6,1252.5M936.6,1252.5L937.1,1252.5M941.1,1252.5L941.6,1252.5M941.6,1252.5L942.1,1252.5M942.1,1252.5L942.6,1253.0M950.6,1252.5L950.1,1253.0M989.5,1252.5L990.0,1252.5M990.0,1252.5L990.5,1253.0M1091.5,1252.5L1092.0,1252.5M1091.5,1252.5L1091.0,1253.0M931.1,1253.0L931.6,1253.0M931.6,1253.0L932.1,1253.0M932.1,1253.0L932.6,1253.0M932.6,1253.0L933.1,1253.0M933.1,1253.0L933.6,1253.0M933.6,1253.0L934.1,1253.0M942.6,1253.0L943.1,1253.0M943.1,1253.0L943.6,1253.0M943.6,1253.0L944.1,1253.0M944.1,1253.0L944.6,1253.5M949.6,1253.0L950.1,1253.0M949.6,1253.0L949.1,1253.5M990.5,1253.0L991.0,1253.5M1090.5,1253.0L1091.0,1253.0M1090.5,1253.0L1090.0,1253.5M944.6,1253.5L945.1,1253.5M945.1,1253.5L945.6,1253.5M945.6,1253.5L946.1,1253.5M946.1,1253.5L946.6,1253.5M946.6,1253.5L947.1,1253.5M947.1,1253.5L947.6,1253.5M947.6,1253.5L948.1,1254.0M948.6,1253.5L949.1,1253.5M948.6,1253.5L948.1,1254.0M991.0,1253.5L991.5,1254.0M1089.5,1253.5L1090.0,1253.5M1089.5,1253.5L1089.0,1254.0M991.5,1254.0L992.0,1254.5M1088.5,1254.0L1089.0,1254.0M1088.5,1254.0L1088.0,1254.5M992.0,1254.5L992.5,1255.0M1086.5,1254.5L1087.0,1254.5M1086.5,1254.5L1086.0,1255.0M1087.0,1254.5L1087.5,1254.5M1087.5,1254.5L1088.0,1254.5M992.5,1255.0L993.0,1255.0M993.0,1255.0L993.5,1255.5M1085.0,1255.0L1085.5,1255.0M1085.0,1255.0L1084.5,1255.5M1085.5,1255.0L1086.0,1255.0M993.5,1255.5L994.0,1256.0M1083.5,1255.5L1084.0,1255.5M1083.5,1255.5L1083.0,1256.0M1084.0,1255.5L1084.5,1255.5M994.0,1256.0L994.5,1256.5M1082.5,1256.0L1083.0,1256.0M1082.5,1256.0L1082.0,1256.5M994.5,1256.5L995.0,1256.5M995.0,1256.5L995.5,1257.0M1080.5,1256.5L1081.0,1256.5M1080.5,1256.5L1080.0,1257.0M1081.0,1256.5L1081.5,1256.5M1081.5,1256.5L1082.0,1256.5M995.5,1257.0L996.0,1257.5M1079.0,1257.0L1079.5,1257.0M1079.0,1257.0L1078.5,1257.5M1079.5,1257.0L1080.0,1257.0M996.0,1257.5L996.5,1257.5M996.5,1257.5L997.0,1257.5M997.0,1257.5L997.5,1258.0M1077.5,1257.5L1078.0,1257.5M1077.5,1257.5L1077.0,1258.0M1078.0,1257.5L1078.5,1257.5M997.5,1258.0L998.0,1258.0M998.0,1258.0L998.5,1258.0M998.5,1258.0L999.0,1258.5M1075.5,1258.0L1076.0,1258.0M1075.5,1258.0L1075.0,1258.5M1076.0,1258.0L1076.5,1258.0M1076.5,1258.0L1077.0,1258.0M999.0,1258.5L999.5,1258.5M999.5,1258.5L1000.0,1259.0M1073.0,1258.5L1073.5,1258.5M1073.0,1258.5L1072.5,1259.0M1073.5,1258.5L1074.0,1258.5M1074.0,1258.5L1074.5,1258.5M1074.5,1258.5L1075.0,1258.5M1000.0,1259.0L1000.5,1259.0M1000.5,1259.0L1001.0,1259.0M1001.0,1259.0L1001.5,1259.5M1070.0,1259.0L1070.5,1259.0M1070.0,1259.0L1069.5,1259.5M1070.5,1259.0L1071.0,1259.0M1071.0,1259.0L1071.5,1259.0M1071.5,1259.0L1072.0,1259.0M1072.0,1259.0L1072.5,1259.0M1001.5,1259.5L1002.0,1259.5M1002.0,1259.5L1002.5,1259.5M1002.5,1259.5L1003.0,1260.0M1067.0,1259.5L1067.5,1259.5M1067.0,1259.5L1066.5,1260.0M1067.5,1259.5L1068.0,1259.5M1068.0,1259.5L1068.5,1259.5M1068.5,1259.5L1069.0,1259.5M1069.0,1259.5L1069.5,1259.5M1003.0,1260.0L1003.5,1260.0M1003.5,1260.0L1004.0,1260.0M1004.0,1260.0L1004.5,1260.5M1063.5,1260.0L1064.0,1260.0M1063.5,1260.0L1063.0,1260.5M1064.0,1260.0L1064.5,1260.0M1064.5,1260.0L1065.0,1260.0M1065.0,1260.0L1065.5,1260.0M1065.5,1260.0L1066.0,1260.0M1066.0,1260.0L1066.5,1260.0M1004.5,1260.5L1005.0,1260.5M1005.0,1260.5L1005.5,1260.5M1005.5,1260.5L1006.0,1261.0M1060.5,1260.5L1061.0,1260.5M1060.5,1260.5L1060.0,1261.0M1061.0,1260.5L1061.5,1260.5M1061.5,1260.5L1062.0,1260.5M1062.0,1260.5L1062.5,1260.5M1062.5,1260.5L1063.0,1260.5M1006.0,1261.0L1006.5,1261.0M1006.5,1261.0L1007.0,1261.5M1057.0,1261.0L1057.5,1261.0M1057.0,1261.0L1056.5,1261.5M1057.5,1261.0L1058.0,1261.0M1058.0,1261.0L1058.5,1261.0M1058.5,1261.0L1059.0,1261.0M1059.0,1261.0L1059.5,1261.0M1059.5,1261.0L1060.0,1261.0M1007.0,1261.5L1007.5,1261.5M1007.5,1261.5L1008.0,1261.5M1008.0,1261.5L1008.5,1262.0M1053.5,1261.5L1054.0,1261.5M1053.5,1261.5L1053.0,1262.0M1054.0,1261.5L1054.5,1261.5M1054.5,1261.5L1055.0,1261.5M1055.0,1261.5L1055.5,1261.5M1055.5,1261.5L1056.0,1261.5M1056.0,1261.5L1056.5,1261.5M1008.5,1262.0L1009.0,1262.0M1009.0,1262.0L1009.5,1262.5M1050.0,1262.0L1050.5,1262.0M1050.0,1262.0L1049.5,1262.5M1050.5,1262.0L1051.0,1262.0M1051.0,1262.0L1051.5,1262.0M1051.5,1262.0L1052.0,1262.0M1052.0,1262.0L1052.5,1262.0M1052.5,1262.0L1053.0,1262.0M1009.5,1262.5L1010.0,1262.5M1010.0,1262.5L1010.5,1262.5M1010.5,1262.5L1011.0,1263.0M1045.0,1262.5L1045.5,1262.5M1045.0,1262.5L1044.5,1263.0M1045.5,1262.5L1046.0,1262.5M1046.0,1262.5L1046.5,1262.5M1046.5,1262.5L1047.0,1262.5M1047.0,1262.5L1047.5,1262.5M1047.5,1262.5L1048.0,1262.5M1048.0,1262.5L1048.5,1262.5M1048.5,1262.5L1049.0,1262.5M1049.0,1262.5L1049.5,1262.5M1011.0,1263.0L1011.5,1263.0M1011.5,1263.0L1012.0,1263.0M1012.0,1263.0L1012.5,1263.5M1041.5,1263.0L1042.0,1263.0M1041.5,1263.0L1041.0,1263.5M1042.0,1263.0L1042.5,1263.0M1042.5,1263.0L1043.0,1263.0M1043.0,1263.0L1043.5,1263.0M1043.5,1263.0L1044.0,1263.0M1044.0,1263.0L1044.5,1263.0M1012.5,1263.5L1013.0,1263.5M1013.0,1263.5L1013.5,1264.0M1035.0,1263.5L1035.5,1263.5M1035.0,1263.5L1034.5,1264.0M1035.5,1263.5L1036.0,1263.5M1036.0,1263.5L1036.5,1263.5M1036.5,1263.5L1037.0,1263.5M1037.0,1263.5L1037.5,1263.5M1037.5,1263.5L1038.0,1263.5M1038.0,1263.5L1038.5,1263.5M1038.5,1263.5L1039.0,1263.5M1039.0,1263.5L1039.5,1263.5M1039.5,1263.5L1040.0,1263.5M1040.0,1263.5L1040.5,1263.5M1040.5,1263.5L1041.0,1263.5M1013.5,1264.0L1014.0,1264.0M1014.0,1264.0L1014.5,1264.5M1028.5,1264.0L1029.0,1264.0M1028.5,1264.0L1028.0,1264.5M1029.0,1264.0L1029.5,1264.0M1029.5,1264.0L1030.0,1264.0M1030.0,1264.0L1030.5,1264.0M1030.5,1264.0L1031.0,1264.0M1031.0,1264.0L1031.5,1264.0M1031.5,1264.0L1032.0,1264.0M1032.0,1264.0L1032.5,1264.0M1032.5,1264.0L1033.0,1264.0M1033.0,1264.0L1033.5,1264.0M1033.5,1264.0L1034.0,1264.0M1034.0,1264.0L1034.5,1264.0M1014.5,1264.5L1015.0,1264.5M1015.0,1264.5L1015.5,1264.5M1015.5,1264.5L1016.0,1265.0M1023.0,1264.5L1023.5,1264.5M1023.0,1264.5L1022.5,1265.0M1023.5,1264.5L1024.0,1264.5M1024.0,1264.5L1024.5,1264.5M1024.5,1264.5L1025.0,1264.5M1025.0,1264.5L1025.5,1264.5M1025.5,1264.5L1026.0,1264.5M1026.0,1264.5L1026.5,1264.5M1026.5,1264.5L1027.0,1264.5M1027.0,1264.5L1027.5,1264.5M1027.5,1264.5L1028.0,1264.5M1016.0,1265.0L1016.5,1265.0M1016.5,1265.0L1017.0,1265.0M1017.0,1265.0L1017.5,1265.0M1017.5,1265.0L1018.0,1265.0M1018.0,1265.0L1018.5,1265.0M1018.5,1265.0L1019.0,1265.0M1019.0,1265.0L1019.5,1265.0M1019.5,1265.0L1020.0,1265.0M1020.0,1265.0L1020.5,1265.0M1020.5,1265.0L1021.0,1265.0M1021.0,1265.0L1021.5,1265.0M1021.5,1265.0L1022.0,1265.0M1022.0,1265.0L1022.5,1265.0`,
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
      roadPath: `M478.9,688.1L479.5,688.1M478.9,688.1L478.3,688.7M479.5,688.1L480.1,688.1M480.1,688.1L480.7,688.1M480.7,688.1L481.2,688.1M481.2,688.1L481.8,688.1M481.8,688.1L482.4,688.1M482.4,688.1L483.0,688.1M483.0,688.1L483.6,688.1M483.6,688.1L484.2,688.1M484.2,688.1L484.8,688.1M484.8,688.1L485.4,688.1M485.4,688.1L486.0,688.1M486.0,688.1L486.6,688.1M486.6,688.1L487.2,688.7M478.3,688.7L477.7,689.3M487.2,688.7L487.8,688.7M487.8,688.7L488.4,688.7M488.4,688.7L489.0,688.7M489.0,688.7L489.6,688.7M489.6,688.7L490.2,688.7M490.2,688.7L490.8,688.7M490.8,688.7L491.4,688.7M491.4,688.7L491.9,688.7M491.9,688.7L492.5,688.7M492.5,688.7L493.1,688.7M493.1,688.7L493.7,688.7M493.7,688.7L494.3,688.7M494.3,688.7L494.9,688.7M494.9,688.7L495.5,688.7M495.5,688.7L496.1,688.7M496.1,688.7L496.7,688.7M496.7,688.7L497.3,688.7M497.3,688.7L497.9,688.7M497.9,688.7L498.5,688.7M498.5,688.7L499.1,688.7M499.1,688.7L499.7,688.7M499.7,688.7L500.3,688.7M500.3,688.7L500.9,688.7M500.9,688.7L501.5,689.3M578.7,688.7L579.3,688.7M578.7,688.7L578.1,689.3M579.3,688.7L579.9,689.3M477.7,689.3L477.7,689.9M501.5,689.3L502.1,689.3M502.1,689.3L502.6,689.3M502.6,689.3L503.2,689.3M503.2,689.3L503.8,689.3M503.8,689.3L504.4,689.3M504.4,689.3L505.0,689.3M505.0,689.3L505.6,689.3M505.6,689.3L506.2,689.3M506.2,689.3L506.8,689.3M506.8,689.3L507.4,689.3M507.4,689.3L508.0,689.3M508.0,689.3L508.6,689.3M508.6,689.3L509.2,689.3M509.2,689.3L509.8,689.3M509.8,689.3L510.4,689.3M510.4,689.3L511.0,689.3M511.0,689.3L511.6,689.3M511.6,689.3L512.2,689.3M512.2,689.3L512.7,689.3M512.7,689.3L513.3,689.3M513.3,689.3L513.9,689.3M513.9,689.3L514.5,689.9M576.3,689.3L576.9,689.3M576.3,689.3L575.7,689.9M576.9,689.3L577.5,689.3M577.5,689.3L578.1,689.3M579.9,689.3L580.5,689.9M477.7,689.9L477.1,690.4M514.5,689.9L515.1,689.9M515.1,689.9L515.7,689.9M515.7,689.9L516.3,689.9M516.3,689.9L516.9,689.9M516.9,689.9L517.5,689.9M517.5,689.9L518.1,689.9M518.1,689.9L518.7,689.9M518.7,689.9L519.3,689.9M519.3,689.9L519.9,689.9M519.9,689.9L520.5,690.4M575.1,689.9L575.7,689.9M575.1,689.9L574.6,690.4M580.5,689.9L581.1,690.4M477.1,690.4L477.1,691.0M520.5,690.4L521.1,691.0M574.6,690.4L574.0,691.0M581.1,690.4L581.7,691.0M477.1,691.0L477.1,691.6M521.1,691.0L521.7,691.0M521.7,691.0L522.3,691.6M572.8,691.0L573.4,691.0M572.8,691.0L572.2,691.6M573.4,691.0L574.0,691.0M581.7,691.0L581.7,691.6M477.1,691.6L476.5,692.2M522.3,691.6L522.9,692.2M571.6,691.6L572.2,691.6M571.6,691.6L571.0,692.2M581.7,691.6L582.3,692.2M476.5,692.2L476.5,692.8M522.9,692.2L523.4,692.8M570.4,692.2L571.0,692.2M570.4,692.2L569.8,692.8M582.3,692.2L582.9,692.8M476.5,692.8L475.9,693.4M523.4,692.8L524.0,693.4M569.2,692.8L569.8,692.8M569.2,692.8L568.6,693.4M582.9,692.8L582.9,693.4M475.9,693.4L475.9,694.0M524.0,693.4L524.6,693.4M524.6,693.4L525.2,694.0M568.0,693.4L568.6,693.4M568.0,693.4L567.4,694.0M582.9,693.4L583.5,694.0M475.9,694.0L475.9,694.6M525.2,694.0L525.8,694.6M566.8,694.0L567.4,694.0M566.8,694.0L566.2,694.6M583.5,694.0L584.1,694.6M475.9,694.6L475.3,695.2M525.8,694.6L526.4,694.6M526.4,694.6L527.0,695.2M565.6,694.6L566.2,694.6M565.6,694.6L565.0,695.2M584.1,694.6L584.7,695.2M475.3,695.2L475.3,695.8M527.0,695.2L527.6,695.8M564.5,695.2L565.0,695.2M564.5,695.2L563.9,695.8M584.7,695.2L585.3,695.8M475.3,695.8L474.7,696.4M527.6,695.8L528.2,696.4M563.3,695.8L563.9,695.8M563.3,695.8L562.7,696.4M585.3,695.8L585.3,696.4M474.7,696.4L474.7,697.0M528.2,696.4L528.8,697.0M562.1,696.4L562.7,696.4M562.1,696.4L561.5,697.0M585.3,696.4L585.8,697.0M474.7,697.0L474.7,697.6M528.8,697.0L529.4,697.0M529.4,697.0L530.0,697.6M560.9,697.0L561.5,697.0M560.9,697.0L560.3,697.6M585.8,697.0L586.4,697.6M474.7,697.6L474.1,698.2M530.0,697.6L530.6,698.2M560.3,697.6L559.7,698.2M586.4,697.6L587.0,698.2M474.1,698.2L474.1,698.8M530.6,698.2L531.2,698.8M559.7,698.2L559.1,698.8M587.0,698.2L587.0,698.8M474.1,698.8L473.5,699.4M531.2,698.8L531.8,698.8M531.8,698.8L532.4,699.4M559.1,698.8L558.5,699.4M587.0,698.8L587.6,699.4M473.5,699.4L473.5,700.0M532.4,699.4L533.0,700.0M557.3,699.4L557.9,699.4M557.3,699.4L556.7,700.0M557.9,699.4L558.5,699.4M587.6,699.4L588.2,700.0M473.5,700.0L473.5,700.5M533.0,700.0L533.5,700.5M555.5,700.0L556.1,700.0M555.5,700.0L554.9,700.5M556.1,700.0L556.7,700.0M588.2,700.0L588.8,700.5M473.5,700.5L472.9,701.1M533.5,700.5L534.1,700.5M534.1,700.5L534.7,701.1M553.8,700.5L554.3,700.5M553.8,700.5L553.2,701.1M554.3,700.5L554.9,700.5M588.8,700.5L588.8,701.1M472.9,701.1L472.9,701.7M534.7,701.1L535.3,701.7M552.0,701.1L552.6,701.1M552.0,701.1L551.4,701.7M552.6,701.1L553.2,701.1M588.8,701.1L589.4,701.7M472.9,701.7L472.3,702.3M535.3,701.7L535.9,702.3M550.2,701.7L550.8,701.7M550.2,701.7L549.6,702.3M550.8,701.7L551.4,701.7M589.4,701.7L590.0,702.3M472.3,702.3L472.3,702.9M535.9,702.3L536.5,702.3M536.5,702.3L537.1,702.9M548.4,702.3L549.0,702.3M548.4,702.3L547.8,702.9M549.0,702.3L549.6,702.3M590.0,702.3L590.0,702.9M472.3,702.9L471.7,703.5M537.1,702.9L537.7,703.5M547.2,702.9L547.8,702.9M547.2,702.9L546.6,703.5M590.0,702.9L590.0,703.5M471.7,703.5L471.7,704.1M537.7,703.5L538.3,704.1M545.4,703.5L546.0,703.5M545.4,703.5L544.8,704.1M546.0,703.5L546.6,703.5M590.0,703.5L590.0,704.1M471.7,704.1L471.7,704.7M538.3,704.1L538.9,704.1M538.9,704.1L539.5,704.7M543.7,704.1L544.2,704.1M543.7,704.1L543.1,704.7M544.2,704.1L544.8,704.1M590.0,704.1L590.0,704.7M471.7,704.7L471.1,705.3M539.5,704.7L540.1,704.7M540.1,704.7L540.7,704.7M540.7,704.7L541.3,704.7M541.3,704.7L541.9,704.7M541.9,704.7L542.5,704.7M542.5,704.7L543.1,704.7M590.0,704.7L590.0,705.3M471.1,705.3L471.1,705.9M590.0,705.3L590.0,705.9M471.1,705.9L470.6,706.5M590.0,705.9L590.0,706.5M470.6,706.5L470.6,707.1M590.0,706.5L590.0,707.1M470.6,707.1L470.0,707.7M590.0,707.1L590.0,707.7M470.0,707.7L470.0,708.3M590.0,707.7L590.0,708.3M470.0,708.3L470.0,708.9M590.0,708.3L590.0,708.9M470.0,708.9L469.4,709.5M590.0,708.9L590.6,709.5M469.4,709.5L469.4,710.1M590.6,709.5L590.6,710.1M469.4,710.1L469.4,710.7M590.6,710.1L590.6,710.7M456.3,710.7L456.9,710.7M456.3,710.7L455.7,711.2M456.9,710.7L457.5,710.7M457.5,710.7L458.1,710.7M458.1,710.7L458.7,710.7M458.7,710.7L459.3,710.7M459.3,710.7L459.9,710.7M459.9,710.7L460.4,710.7M460.4,710.7L461.0,710.7M461.0,710.7L461.6,710.7M461.6,710.7L462.2,710.7M462.2,710.7L462.8,710.7M462.8,710.7L463.4,710.7M463.4,710.7L464.0,710.7M464.0,710.7L464.6,711.2M469.4,710.7L468.8,711.2M590.6,710.7L590.6,711.2M455.7,711.2L455.7,711.8M464.6,711.2L465.2,711.2M465.2,711.2L465.8,711.2M465.8,711.2L466.4,711.2M466.4,711.2L467.0,711.2M467.0,711.2L467.6,711.2M467.6,711.2L468.2,711.2M468.2,711.2L468.8,711.2M590.6,711.2L590.6,711.8M455.7,711.8L455.7,712.4M590.6,711.8L590.6,712.4M455.7,712.4L455.1,713.0M590.6,712.4L590.6,713.0M455.1,713.0L455.1,713.6M590.6,713.0L590.6,713.6M455.1,713.6L455.1,714.2M590.6,713.6L590.6,714.2M455.1,714.2L455.1,714.8M590.6,714.2L590.6,714.8M455.1,714.8L455.1,715.4M590.6,714.8L590.6,715.4M455.1,715.4L455.1,716.0M590.6,715.4L590.6,716.0M455.1,716.0L454.5,716.6M590.6,716.0L591.2,716.6M454.5,716.6L454.5,717.2M591.2,716.6L591.8,717.2M454.5,717.2L454.5,717.8M591.8,717.2L591.8,717.8M454.5,717.8L454.5,718.4M591.8,717.8L592.4,718.4M454.5,718.4L454.5,719.0M592.4,718.4L593.0,719.0M454.5,719.0L453.9,719.6M593.0,719.0L593.0,719.6M453.9,719.6L453.9,720.2M593.0,719.6L593.6,720.2M453.9,720.2L453.9,720.8M593.6,720.2L593.6,720.8M453.9,720.8L453.9,721.3M593.6,720.8L594.2,721.3M453.9,721.3L453.9,721.9M594.2,721.3L594.8,721.9M453.9,721.9L453.9,722.5M594.8,721.9L594.8,722.5M453.9,722.5L453.3,723.1M594.8,722.5L595.4,723.1M453.3,723.1L453.3,723.7M595.4,723.1L595.4,723.7M453.3,723.7L453.3,724.3M595.4,723.7L596.0,724.3M453.3,724.3L453.3,724.9M596.0,724.3L596.5,724.9M453.3,724.9L453.3,725.5M596.5,724.9L596.5,725.5M453.3,725.5L452.7,726.1M596.5,725.5L597.1,726.1M452.7,726.1L452.7,726.7M597.1,726.1L597.1,726.7M452.7,726.7L452.7,727.3M597.1,726.7L597.7,727.3M452.7,727.3L452.7,727.9M597.7,727.3L598.3,727.9M452.7,727.9L452.7,728.5M598.3,727.9L598.3,728.5M452.7,728.5L452.1,729.1M598.3,728.5L598.9,729.1M452.1,729.1L451.5,729.7M598.9,729.1L598.9,729.7M451.5,729.7L450.9,730.3M598.9,729.7L599.5,730.3M450.9,730.3L450.3,730.9M599.5,730.3L600.1,730.9M448.0,730.9L448.6,730.9M448.0,730.9L447.4,731.5M448.6,730.9L449.2,730.9M449.2,730.9L449.8,730.9M449.8,730.9L450.3,730.9M600.1,730.9L600.1,731.5M445.0,731.5L445.6,731.5M445.0,731.5L444.4,732.0M445.6,731.5L446.2,731.5M446.2,731.5L446.8,731.5M446.8,731.5L447.4,731.5M600.1,731.5L600.7,732.0M442.6,732.0L443.2,732.0M442.6,732.0L442.0,732.6M443.2,732.0L443.8,732.0M443.8,732.0L444.4,732.0M600.7,732.0L601.3,732.6M440.2,732.6L440.8,732.6M440.2,732.6L439.6,733.2M440.8,732.6L441.4,732.6M441.4,732.6L442.0,732.6M601.3,732.6L601.3,733.2M439.6,733.2L439.1,733.8M601.3,733.2L601.9,733.8M439.1,733.8L438.5,734.4M601.9,733.8L602.5,734.4M438.5,734.4L438.5,735.0M602.5,734.4L602.5,735.0M438.5,735.0L438.5,735.6M602.5,735.0L603.1,735.6M438.5,735.6L438.5,736.2M603.1,735.6L603.1,736.2M438.5,736.2L438.5,736.8M603.1,736.2L603.7,736.8M438.5,736.8L438.5,737.4M603.7,736.8L604.3,737.4M438.5,737.4L438.5,738.0M604.3,737.4L604.3,738.0M438.5,738.0L438.5,738.6M604.3,738.0L604.9,738.6M438.5,738.6L438.5,739.2M604.9,738.6L605.5,739.2M438.5,739.2L438.5,739.8M605.5,739.2L606.1,739.8M438.5,739.8L437.9,740.4M606.1,739.8L606.6,739.8M606.6,739.8L607.2,740.4M437.9,740.4L437.9,741.0M607.2,740.4L607.8,741.0M437.9,741.0L437.9,741.6M607.8,741.0L608.4,741.6M437.9,741.6L437.9,742.1M608.4,741.6L609.0,741.6M609.0,741.6L609.6,742.1M437.9,742.1L437.3,742.7M609.6,742.1L610.2,742.7M437.3,742.7L437.3,743.3M610.2,742.7L610.8,743.3M437.3,743.3L437.3,743.9M610.8,743.3L611.4,743.9M437.3,743.9L437.3,744.5M611.4,743.9L612.0,743.9M612.0,743.9L612.6,744.5M437.3,744.5L436.7,745.1M612.6,744.5L613.2,745.1M436.7,745.1L436.7,745.7M613.2,745.1L613.8,745.7M436.7,745.7L436.7,746.3M613.8,745.7L614.4,745.7M614.4,745.7L615.0,746.3M436.7,746.3L436.7,746.9M615.0,746.3L615.6,746.9M436.7,746.9L436.1,747.5M615.6,746.9L616.2,747.5M436.1,747.5L436.1,748.1M616.2,747.5L616.8,747.5M616.8,747.5L617.3,748.1M436.1,748.1L436.1,748.7M617.3,748.1L617.9,748.7M436.1,748.7L436.1,749.3M617.9,748.7L618.5,749.3M436.1,749.3L436.1,749.9M618.5,749.3L619.1,749.3M619.1,749.3L619.7,749.9M436.1,749.9L435.5,750.5M619.7,749.9L620.3,750.5M435.5,750.5L435.5,751.1M620.3,750.5L620.9,751.1M435.5,751.1L435.5,751.7M620.9,751.1L621.5,751.1M621.5,751.1L622.1,751.7M435.5,751.7L435.5,752.2M622.1,751.7L622.7,752.3M435.5,752.2L434.9,752.8M622.7,752.3L623.3,752.8M434.9,752.8L434.9,753.4M623.3,752.8L623.9,753.4M434.9,753.4L434.3,754.0M623.9,753.4L624.5,753.4M624.5,753.4L625.1,754.0M434.3,754.0L434.3,754.6M625.1,754.0L625.7,754.6M434.3,754.6L433.7,755.2M625.7,754.6L625.7,755.2M433.7,755.2L433.7,755.8M625.7,755.2L625.7,755.8M433.7,755.8L433.1,756.4M625.7,755.8L625.7,756.4M433.1,756.4L433.1,757.0M625.7,756.4L625.7,757.0M433.1,757.0L432.5,757.6M625.7,757.0L626.3,757.6M432.5,757.6L431.9,758.2M626.3,757.6L626.3,758.2M431.9,758.2L431.9,758.8M626.3,758.2L626.3,758.8M431.9,758.8L431.3,759.4M626.3,758.8L626.3,759.4M431.3,759.4L431.3,760.0M626.3,759.4L626.3,760.0M431.3,760.0L430.7,760.6M626.3,760.0L626.3,760.6M430.7,760.6L430.1,761.2M626.3,760.6L626.3,761.2M430.1,761.2L430.1,761.8M626.3,761.2L626.3,761.8M430.1,761.8L429.5,762.4M626.3,761.8L626.3,762.4M429.5,762.4L429.5,762.9M626.3,762.4L626.9,762.9M429.5,762.9L428.9,763.5M626.9,762.9L626.9,763.5M428.9,763.5L428.4,764.1M626.9,763.5L626.9,764.1M428.4,764.1L428.4,764.7M626.9,764.1L626.9,764.7M428.4,764.7L427.8,765.3M626.9,764.7L626.9,765.3M427.8,765.3L427.8,765.9M626.9,765.3L626.9,765.9M427.8,765.9L427.2,766.5M626.9,765.9L626.9,766.5M427.2,766.5L426.6,767.1M626.9,766.5L626.9,767.1M426.6,767.1L426.6,767.7M626.9,767.1L626.9,767.7M426.6,767.7L426.0,768.3M626.9,767.7L627.4,768.3M426.0,768.3L426.0,768.9M627.4,768.3L627.4,768.9M426.0,768.9L425.4,769.5M627.4,768.9L627.4,769.5M425.4,769.5L424.8,770.1M627.4,769.5L627.4,770.1M424.8,770.1L424.8,770.7M627.4,770.1L627.4,770.7M424.8,770.7L424.2,771.3M627.4,770.7L627.4,771.3M424.2,771.3L424.2,771.9M627.4,771.3L627.4,771.9M636.4,771.3L637.0,771.3M636.4,771.3L635.8,771.9M637.0,771.3L637.6,771.9M424.2,771.9L423.6,772.5M627.4,771.9L627.4,772.5M635.8,771.9L635.2,772.5M637.6,771.9L638.1,771.9M638.1,771.9L638.7,771.9M638.7,771.9L639.3,771.9M639.3,771.9L639.9,771.9M639.9,771.9L640.5,771.9M640.5,771.9L641.1,771.9M641.1,771.9L641.7,771.9M641.7,771.9L642.3,771.9M642.3,771.9L642.9,771.9M642.9,771.9L643.5,771.9M643.5,771.9L644.1,772.5M423.6,772.5L423.0,773.0M627.4,772.5L628.0,773.1M635.2,772.5L635.2,773.1M644.1,772.5L644.7,772.5M644.7,772.5L645.3,772.5M645.3,772.5L645.9,772.5M645.9,772.5L646.5,772.5M646.5,772.5L647.1,772.5M647.1,772.5L647.7,772.5M647.7,772.5L648.2,772.5M648.2,772.5L648.8,772.5M648.8,772.5L649.4,772.5M649.4,772.5L650.0,772.5M650.0,772.5L650.6,773.1M423.0,773.0L423.0,773.6M628.0,773.1L628.0,773.6M635.2,773.1L635.2,773.6M650.6,773.1L651.2,773.1M651.2,773.1L651.8,773.1M651.8,773.1L652.4,773.1M652.4,773.1L653.0,773.1M653.0,773.1L653.6,773.1M653.6,773.1L654.2,773.1M654.2,773.1L654.8,773.1M654.8,773.1L655.4,773.1M655.4,773.1L656.0,773.6M423.0,773.6L422.4,774.2M628.0,773.6L628.0,774.2M635.2,773.6L634.6,774.2M656.0,773.6L656.6,773.6M656.6,773.6L657.2,773.6M657.2,773.6L657.8,773.6M657.8,773.6L658.4,773.6M658.4,773.6L658.9,773.6M658.9,773.6L659.5,773.6M659.5,773.6L660.1,774.2M422.4,774.2L422.4,774.8M628.0,774.2L628.0,774.8M634.6,774.2L634.6,774.8M660.1,774.2L660.7,774.2M660.7,774.2L661.3,774.8M422.4,774.8L421.8,775.4M628.0,774.8L628.0,775.4M634.6,774.8L634.6,775.4M661.3,774.8L661.9,774.8M661.9,774.8L662.5,775.4M421.8,775.4L421.2,776.0M628.0,775.4L628.0,776.0M634.6,775.4L634.0,776.0M662.5,775.4L663.1,775.4M663.1,775.4L663.7,776.0M421.2,776.0L421.2,776.6M628.0,776.0L628.0,776.6M634.0,776.0L634.0,776.6M663.7,776.0L664.3,776.0M664.3,776.0L664.9,776.6M421.2,776.6L420.6,777.2M628.0,776.6L628.0,777.2M634.0,776.6L634.0,777.2M664.9,776.6L665.5,776.6M665.5,776.6L666.1,777.2M420.6,777.2L420.6,777.8M628.0,777.2L628.0,777.8M634.0,777.2L634.0,777.8M666.1,777.2L666.7,777.2M666.7,777.2L667.3,777.2M667.3,777.2L667.9,777.8M420.6,777.8L420.0,778.4M628.0,777.8L628.6,778.4M634.0,777.8L633.4,778.4M667.9,777.8L668.5,777.8M668.5,777.8L669.1,778.4M420.0,778.4L419.4,779.0M628.6,778.4L628.6,779.0M633.4,778.4L633.4,779.0M669.1,778.4L669.6,778.4M669.6,778.4L670.2,779.0M419.4,779.0L419.4,779.6M628.6,779.0L628.6,779.6M633.4,779.0L632.8,779.6M670.2,779.0L670.8,779.0M670.8,779.0L671.4,779.6M419.4,779.6L419.4,780.2M628.6,779.6L628.6,780.2M632.8,779.6L632.2,780.2M671.4,779.6L672.0,779.6M672.0,779.6L672.6,780.2M419.4,780.2L419.4,780.8M628.6,780.2L629.2,780.8M632.2,780.2L631.6,780.8M672.6,780.2L673.2,780.2M673.2,780.2L673.8,780.2M673.8,780.2L674.4,780.8M419.4,780.8L419.4,781.4M629.2,780.8L629.8,781.4M631.6,780.8L631.0,781.4M674.4,780.8L675.0,780.8M675.0,780.8L675.6,781.4M419.4,781.4L419.4,782.0M629.8,781.4L630.4,781.4M629.8,781.4L630.4,782.0M630.4,781.4L631.0,781.4M630.4,781.4L630.4,782.0M631.0,781.4L630.4,782.0M675.6,781.4L676.2,781.4M676.2,781.4L676.8,782.0M419.4,782.0L419.4,782.6M630.4,782.0L630.4,782.6M676.8,782.0L677.4,782.0M677.4,782.0L678.0,782.6M419.4,782.6L419.4,783.2M630.4,782.6L630.4,783.2M678.0,782.6L678.6,782.6M678.6,782.6L679.2,783.2M419.4,783.2L419.4,783.7M630.4,783.2L630.4,783.7M679.2,783.2L679.7,783.2M679.7,783.2L680.3,783.8M419.4,783.7L419.4,784.3M630.4,783.7L630.4,784.3M680.3,783.8L680.9,783.8M680.9,783.8L681.5,783.8M681.5,783.8L682.1,784.3M419.4,784.3L419.4,784.9M630.4,784.3L629.8,784.9M682.1,784.3L682.7,784.3M682.7,784.3L683.3,784.9M419.4,784.9L419.4,785.5M629.8,784.9L629.8,785.5M683.3,784.9L683.9,784.9M683.9,784.9L684.5,785.5M419.4,785.5L419.4,786.1M629.8,785.5L629.8,786.1M684.5,785.5L685.1,785.5M685.1,785.5L685.7,786.1M419.4,786.1L419.4,786.7M629.8,786.1L629.8,786.7M685.7,786.1L686.3,786.1M686.3,786.1L686.9,786.7M419.4,786.7L419.4,787.3M629.8,786.7L629.8,787.3M686.9,786.7L687.5,786.7M687.5,786.7L688.1,787.3M419.4,787.3L419.4,787.9M629.8,787.3L629.8,787.9M688.1,787.3L688.7,787.3M688.7,787.3L689.3,787.9M419.4,787.9L419.4,788.5M629.8,787.9L629.8,788.5M689.3,787.9L689.9,787.9M689.9,787.9L690.4,788.5M419.4,788.5L419.4,789.1M629.8,788.5L629.2,789.1M690.4,788.5L691.0,788.5M691.0,788.5L691.6,789.1M419.4,789.1L419.4,789.7M629.2,789.1L629.2,789.7M691.6,789.1L692.2,789.1M692.2,789.1L692.8,789.7M419.4,789.7L419.4,790.3M629.2,789.7L629.2,790.3M692.8,789.7L693.4,789.7M693.4,789.7L694.0,790.3M419.4,790.3L419.4,790.9M629.2,790.3L629.2,790.9M694.0,790.3L694.6,790.3M694.6,790.3L695.2,790.9M419.4,790.9L419.4,791.5M629.2,790.9L629.2,791.5M695.2,790.9L695.8,790.9M695.8,790.9L696.4,790.9M696.4,790.9L697.0,791.5M419.4,791.5L419.4,792.1M629.2,791.5L629.2,792.1M697.0,791.5L697.6,791.5M697.6,791.5L698.2,792.1M419.4,792.1L419.4,792.7M698.2,792.1L698.8,792.1M698.8,792.1L699.4,792.7M419.4,792.7L419.4,793.3M699.4,792.7L700.0,792.7M700.0,792.7L700.5,793.3M419.4,793.3L419.4,793.9M700.5,793.3L701.1,793.3M701.1,793.3L701.7,793.9M419.4,793.9L419.4,794.4M701.7,793.9L702.3,793.9M702.3,793.9L702.9,794.4M419.4,794.4L419.4,795.0M702.9,794.4L703.5,794.4M703.5,794.4L704.1,795.0M419.4,795.0L419.4,795.6M704.1,795.0L704.7,795.0M704.7,795.0L705.3,795.6M419.4,795.6L419.4,796.2M705.3,795.6L705.9,795.6M705.9,795.6L706.5,796.2M419.4,796.2L419.4,796.8M706.5,796.2L707.1,796.2M707.1,796.2L707.7,796.8M419.4,796.8L419.4,797.4M707.7,796.8L708.3,796.8M708.3,796.8L708.9,797.4M419.4,797.4L419.4,798.0M708.9,797.4L709.5,797.4M709.5,797.4L710.1,798.0M419.4,798.0L419.4,798.6M710.1,798.0L710.7,798.0M710.7,798.0L711.2,798.6M419.4,798.6L419.4,799.2M711.2,798.6L711.8,798.6M711.8,798.6L712.4,799.2M419.4,799.2L419.4,799.8M712.4,799.2L713.0,799.2M713.0,799.2L713.6,799.8M419.4,799.8L419.4,800.4M713.6,799.8L714.2,799.8M714.2,799.8L714.8,800.4M419.4,800.4L419.4,801.0M714.8,800.4L715.4,800.4M715.4,800.4L716.0,801.0M419.4,801.0L419.4,801.6M716.0,801.0L716.6,801.6M419.4,801.6L419.4,802.2M716.6,801.6L717.2,801.6M717.2,801.6L717.8,802.2M419.4,802.2L419.4,802.8M717.8,802.2L718.4,802.2M718.4,802.2L719.0,802.8M419.4,802.8L419.4,803.4M719.0,802.8L719.6,803.4M419.4,803.4L419.4,804.0M719.6,803.4L720.2,803.4M720.2,803.4L720.8,804.0M419.4,804.0L419.4,804.5M720.8,804.0L721.4,804.6M419.4,804.5L419.4,805.1M721.4,804.6L721.9,804.6M721.9,804.6L722.5,805.1M419.4,805.1L419.4,805.7M722.5,805.1L723.1,805.1M723.1,805.1L723.7,805.7M419.4,805.7L419.4,806.3M723.7,805.7L724.3,806.3M419.4,806.3L420.0,806.9M724.3,806.3L724.9,806.3M724.9,806.3L725.5,806.9M420.0,806.9L420.0,807.5M725.5,806.9L726.1,806.9M726.1,806.9L726.7,807.5M420.0,807.5L420.0,808.1M726.7,807.5L727.3,808.1M420.0,808.1L420.0,808.7M727.3,808.1L727.9,808.1M727.9,808.1L728.5,808.7M420.0,808.7L420.0,809.3M728.5,808.7L729.1,809.3M420.0,809.3L420.0,809.9M729.1,809.3L729.7,809.3M729.7,809.3L730.3,809.9M420.0,809.9L420.0,810.5M730.3,809.9L730.9,810.5M420.0,810.5L420.0,811.1M730.9,810.5L731.5,810.5M731.5,810.5L732.0,811.1M420.0,811.1L420.0,811.7M732.0,811.1L732.6,811.1M732.6,811.1L733.2,811.7M420.0,811.7L420.0,812.3M733.2,811.7L733.8,812.3M420.0,812.3L420.0,812.9M733.8,812.3L734.4,812.3M734.4,812.3L735.0,812.9M420.0,812.9L420.0,813.5M735.0,812.9L735.6,812.9M735.6,812.9L736.2,813.5M420.0,813.5L420.0,814.1M736.2,813.5L736.8,814.1M420.0,814.1L420.0,814.7M736.8,814.1L737.4,814.1M737.4,814.1L738.0,814.7M420.0,814.7L420.0,815.2M738.0,814.7L738.6,814.7M738.6,814.7L739.2,814.7M739.2,814.7L739.8,815.2M420.0,815.2L420.0,815.8M739.8,815.2L740.4,815.2M740.4,815.2L741.0,815.8M420.0,815.8L420.0,816.4M741.0,815.8L741.6,815.8M741.6,815.8L742.2,815.8M742.2,815.8L742.7,816.4M420.0,816.4L420.0,817.0M742.7,816.4L743.3,816.4M743.3,816.4L743.9,817.0M420.0,817.0L420.0,817.6M743.9,817.0L744.5,817.0M744.5,817.0L745.1,817.0M745.1,817.0L745.7,817.6M420.0,817.6L420.0,818.2M745.7,817.6L746.3,817.6M746.3,817.6L746.9,817.6M746.9,817.6L747.5,818.2M420.0,818.2L420.0,818.8M747.5,818.2L748.1,818.8M749.3,818.2L748.7,818.8M420.0,818.8L420.0,819.4M748.1,818.8L748.7,818.8M748.1,818.8L748.1,819.4M748.7,818.8L748.1,819.4M420.0,819.4L420.0,820.0M748.1,819.4L748.1,820.0M420.0,820.0L420.0,820.6M748.1,820.0L748.1,820.6M420.0,820.6L420.0,821.2M748.1,820.6L748.1,821.2M420.0,821.2L420.0,821.8M748.1,821.2L748.7,821.8M420.0,821.8L420.0,822.4M748.7,821.8L748.7,822.4M420.0,822.4L420.0,823.0M748.7,822.4L748.7,823.0M420.0,823.0L420.0,823.6M748.7,823.0L748.7,823.6M420.0,823.6L420.0,824.2M748.7,823.6L748.7,824.2M420.0,824.2L420.0,824.8M748.7,824.2L748.7,824.8M420.0,824.8L420.0,825.3M748.7,824.8L749.3,825.4M420.0,825.3L420.0,825.9M749.3,825.4L749.3,825.9M420.0,825.9L420.0,826.5M749.3,825.9L749.3,826.5M420.0,826.5L420.0,827.1M749.3,826.5L749.3,827.1M420.0,827.1L420.0,827.7M749.3,827.1L749.9,827.7M420.0,827.7L420.0,828.3M749.9,827.7L749.9,828.3M420.0,828.3L420.0,828.9M749.9,828.3L749.9,828.9M420.0,828.9L420.0,829.5M749.9,828.9L749.9,829.5M420.0,829.5L420.0,830.1M749.9,829.5L749.9,830.1M420.0,830.1L420.0,830.7M749.9,830.1L750.5,830.7M420.0,830.7L420.0,831.3M750.5,830.7L750.5,831.3M420.0,831.3L420.0,831.9M750.5,831.3L750.5,831.9M420.0,831.9L420.0,832.5M750.5,831.9L750.5,832.5M420.0,832.5L420.0,833.1M750.5,832.5L751.1,833.1M420.0,833.1L420.0,833.7M751.1,833.1L751.1,833.7M420.0,833.7L420.0,834.3M751.1,833.7L751.1,834.3M420.0,834.3L420.0,834.9M751.1,834.3L751.1,834.9M420.0,834.9L420.0,835.5M751.1,834.9L751.1,835.5M420.0,835.5L420.0,836.0M751.1,835.5L751.7,836.0M420.0,836.0L420.6,836.6M751.7,836.0L751.7,836.6M420.6,836.6L420.6,837.2M751.7,836.6L751.7,837.2M420.6,837.2L420.6,837.8M751.7,837.2L751.7,837.8M420.6,837.8L420.6,838.4M751.7,837.8L752.3,838.4M420.6,838.4L420.6,839.0M752.3,838.4L752.3,839.0M420.6,839.0L420.6,839.6M752.3,839.0L752.3,839.6M420.6,839.6L420.6,840.2M752.3,839.6L752.3,840.2M420.6,840.2L420.6,840.8M752.3,840.2L752.8,840.8M420.6,840.8L420.6,841.4M752.8,840.8L752.8,841.4M420.6,841.4L420.6,842.0M752.8,841.4L752.8,842.0M420.6,842.0L420.6,842.6M752.8,842.0L752.8,842.6M420.6,842.6L420.6,843.2M752.8,842.6L752.8,843.2M420.6,843.2L420.6,843.8M752.8,843.2L753.4,843.8M420.6,843.8L420.6,844.4M753.4,843.8L753.4,844.4M420.6,844.4L420.6,845.0M753.4,844.4L753.4,845.0M420.6,845.0L420.6,845.6M753.4,845.0L753.4,845.6M420.6,845.6L420.6,846.1M753.4,845.6L753.4,846.2M420.6,846.1L420.6,846.7M753.4,846.2L754.0,846.7M420.6,846.7L421.2,847.3M754.0,846.7L754.0,847.3M421.2,847.3L421.8,847.3M421.8,847.3L422.4,847.3M422.4,847.3L423.0,847.3M423.0,847.3L423.6,847.3M423.6,847.3L424.2,847.3M424.2,847.3L424.8,847.3M424.8,847.3L425.4,847.3M425.4,847.3L426.0,847.3M426.0,847.3L426.6,847.3M426.6,847.3L427.2,847.3M427.2,847.3L427.8,847.3M427.8,847.3L428.4,847.3M428.4,847.3L428.9,847.3M428.9,847.3L429.5,847.3M429.5,847.3L430.1,847.3M430.1,847.3L430.7,847.3M430.7,847.3L431.3,847.3M431.3,847.3L431.9,847.3M431.9,847.3L432.5,847.3M432.5,847.3L433.1,847.3M433.1,847.3L433.7,847.3M433.7,847.3L434.3,847.3M434.3,847.3L434.9,847.3M434.9,847.3L435.5,847.3M435.5,847.3L436.1,847.3M436.1,847.3L436.7,847.3M436.7,847.3L437.3,847.3M437.3,847.3L437.9,847.3M437.9,847.3L438.5,847.3M438.5,847.3L439.1,847.3M439.1,847.3L439.6,847.3M439.6,847.3L440.2,847.3M440.2,847.3L440.8,847.3M440.8,847.3L441.4,847.3M441.4,847.3L442.0,847.3M442.0,847.3L442.6,847.3M442.6,847.3L443.2,847.3M443.2,847.3L443.8,847.3M443.8,847.3L444.4,847.3M444.4,847.3L445.0,847.3M445.0,847.3L445.6,847.3M445.6,847.3L446.2,847.3M446.2,847.3L446.8,847.3M446.8,847.3L447.4,847.3M447.4,847.3L448.0,847.3M448.0,847.3L448.6,847.3M448.6,847.3L449.2,847.9M531.8,847.3L532.4,847.3M531.8,847.3L531.2,847.9M532.4,847.3L533.0,847.3M533.0,847.3L533.5,847.9M754.0,847.3L754.0,847.9M449.2,847.9L449.2,848.5M530.0,847.9L530.6,847.9M530.0,847.9L529.4,848.5M530.6,847.9L531.2,847.9M533.5,847.9L534.1,847.9M534.1,847.9L534.7,848.5M754.0,847.9L754.0,848.5M449.2,848.5L449.2,849.1M529.4,848.5L528.8,849.1M534.7,848.5L535.3,849.1M754.0,848.5L754.6,849.1M449.2,849.1L449.2,849.7M528.8,849.1L528.2,849.7M535.3,849.1L535.9,849.7M754.6,849.1L754.6,849.7M449.2,849.7L449.2,850.3M528.2,849.7L527.6,850.3M535.9,849.7L536.5,850.3M754.6,849.7L754.6,850.3M449.2,850.3L449.2,850.9M527.0,850.3L527.6,850.3M527.0,850.3L526.4,850.9M536.5,850.3L537.1,850.9M754.6,850.3L754.6,850.9M449.2,850.9L449.2,851.5M526.4,850.9L525.8,851.5M537.1,850.9L537.7,851.5M754.6,850.9L755.2,851.5M449.2,851.5L449.2,852.1M525.8,851.5L525.2,852.1M537.7,851.5L538.3,852.1M755.2,851.5L755.2,852.1M449.2,852.1L449.2,852.7M525.2,852.1L524.6,852.7M538.3,852.1L538.9,852.7M755.2,852.1L755.2,852.7M449.2,852.7L449.2,853.3M524.0,852.7L524.6,852.7M524.0,852.7L523.4,853.3M538.9,852.7L539.5,853.3M755.2,852.7L755.2,853.3M449.2,853.3L449.2,853.9M523.4,853.3L522.8,853.9M539.5,853.3L540.1,853.9M755.2,853.3L755.2,853.9M449.2,853.9L449.2,854.5M522.8,853.9L522.3,854.5M540.1,853.9L540.7,854.5M755.2,853.9L755.8,854.5M449.2,854.5L449.2,855.1M522.3,854.5L521.7,855.1M540.7,854.5L541.3,855.1M755.8,854.5L755.8,855.1M449.2,855.1L449.2,855.7M521.1,855.1L521.7,855.1M521.1,855.1L520.5,855.7M541.3,855.1L541.9,855.7M755.8,855.1L755.8,855.7M449.2,855.7L449.2,856.3M520.5,855.7L519.9,856.3M541.9,855.7L542.5,856.3M755.8,855.7L755.8,856.3M449.2,856.3L449.2,856.8M519.9,856.3L519.3,856.8M542.5,856.3L543.1,856.3M543.1,856.3L543.7,856.8M755.8,856.3L756.4,856.8M449.2,856.8L449.2,857.4M518.7,856.8L519.3,856.8M518.7,856.8L518.1,857.4M543.7,856.8L544.2,857.4M756.4,856.8L756.4,857.4M449.2,857.4L449.2,858.0M516.3,857.4L516.9,857.4M516.3,857.4L515.7,858.0M516.9,857.4L517.5,857.4M517.5,857.4L518.1,857.4M544.2,857.4L544.8,858.0M756.4,857.4L756.4,858.0M449.2,858.0L449.2,858.6M507.4,858.0L508.0,858.0M507.4,858.0L506.8,858.6M508.0,858.0L508.6,858.0M508.6,858.0L509.2,858.0M509.2,858.0L509.8,858.0M509.8,858.0L510.4,858.0M510.4,858.0L511.0,858.0M511.0,858.0L511.6,858.0M511.6,858.0L512.2,858.0M512.2,858.0L512.7,858.0M512.7,858.0L513.3,858.0M513.3,858.0L513.9,858.0M513.9,858.0L514.5,858.0M514.5,858.0L515.1,858.0M515.1,858.0L515.7,858.0M544.8,858.0L545.4,858.6M756.4,858.0L756.4,858.6M449.2,858.6L449.2,859.2M500.3,858.6L500.9,858.6M500.3,858.6L499.7,859.2M500.9,858.6L501.5,858.6M501.5,858.6L502.0,858.6M502.0,858.6L502.6,858.6M502.6,858.6L503.2,858.6M503.2,858.6L503.8,858.6M503.8,858.6L504.4,858.6M504.4,858.6L505.0,858.6M505.0,858.6L505.6,858.6M505.6,858.6L506.2,858.6M506.2,858.6L506.8,858.6M545.4,858.6L546.0,859.2M756.4,858.6L757.0,859.2M449.2,859.2L448.6,859.8M497.3,859.2L497.9,859.2M497.3,859.2L496.7,859.8M497.9,859.2L498.5,859.2M498.5,859.2L499.1,859.2M499.1,859.2L499.7,859.2M546.0,859.2L546.6,859.8M757.0,859.2L757.0,859.8M448.6,859.8L448.6,860.4M496.7,859.8L496.7,860.4M546.6,859.8L547.2,860.4M757.0,859.8L757.0,860.4M448.6,860.4L449.2,861.0M496.7,860.4L496.7,861.0M547.2,860.4L547.8,861.0M757.0,860.4L757.0,861.0M449.2,861.0L449.2,861.6M496.7,861.0L496.1,861.6M547.8,861.0L548.4,861.6M757.0,861.0L757.0,861.6M449.2,861.6L449.2,862.2M496.1,861.6L496.1,862.2M548.4,861.6L549.0,862.2M757.0,861.6L757.6,862.2M449.2,862.2L449.7,862.8M496.1,862.2L496.1,862.8M549.0,862.2L549.6,862.8M757.6,862.2L757.6,862.8M449.7,862.8L450.3,863.4M496.1,862.8L496.1,863.4M549.6,862.8L550.2,863.4M757.6,862.8L757.6,863.4M450.3,863.4L450.9,864.0M496.1,863.4L496.1,864.0M550.2,863.4L550.8,864.0M757.6,863.4L757.6,864.0M450.9,864.0L451.5,864.6M496.1,864.0L496.1,864.6M550.8,864.0L550.8,864.6M757.6,864.0L758.2,864.6M451.5,864.6L451.5,865.2M496.1,864.6L495.5,865.2M550.8,864.6L551.4,865.2M758.2,864.6L758.2,865.2M451.5,865.2L451.5,865.8M495.5,865.2L495.5,865.8M551.4,865.2L551.4,865.8M758.2,865.2L758.2,865.8M451.5,865.8L451.5,866.4M495.5,865.8L495.5,866.4M551.4,865.8L552.0,866.4M758.2,865.8L758.2,866.4M451.5,866.4L452.1,866.9M495.5,866.4L495.5,866.9M552.0,866.4L552.0,867.0M758.2,866.4L758.2,867.0M452.1,866.9L452.1,867.5M495.5,866.9L495.5,867.5M552.0,867.0L552.0,867.5M758.2,867.0L758.8,867.5M452.1,867.5L452.1,868.1M495.5,867.5L494.9,868.1M552.0,867.5L552.6,868.1M758.8,867.5L758.8,868.1M452.1,868.1L452.1,868.7M494.9,868.1L494.9,868.7M552.6,868.1L552.6,868.7M758.8,868.1L758.8,868.7M452.1,868.7L452.1,869.3M494.9,868.7L494.9,869.3M552.6,868.7L553.2,869.3M758.8,868.7L758.8,869.3M452.1,869.3L452.1,869.9M494.9,869.3L494.9,869.9M553.2,869.3L553.2,869.9M758.8,869.3L759.4,869.9M452.1,869.9L452.1,870.5M494.9,869.9L494.9,870.5M553.2,869.9L553.2,870.5M759.4,869.9L759.4,870.5M452.1,870.5L452.7,871.1M494.9,870.5L494.3,871.1M553.2,870.5L553.8,871.1M759.4,870.5L759.4,871.1M452.7,871.1L452.7,871.7M494.3,871.1L494.3,871.7M553.8,871.1L553.8,871.7M759.4,871.1L759.4,871.7M452.7,871.7L452.7,872.3M494.3,871.7L494.3,872.3M553.8,871.7L554.3,872.3M759.4,871.7L759.4,872.3M452.7,872.3L452.7,872.9M494.3,872.3L494.3,872.9M554.3,872.3L554.3,872.9M759.4,872.3L760.0,872.9M452.7,872.9L452.7,873.5M494.3,872.9L494.3,873.5M554.3,872.9L554.9,873.5M760.0,872.9L760.0,873.5M452.7,873.5L452.7,874.1M494.3,873.5L493.7,874.1M554.9,873.5L554.9,874.1M760.0,873.5L760.0,874.1M452.7,874.1L453.3,874.7M493.7,874.1L493.7,874.7M554.9,874.1L554.9,874.7M760.0,874.1L760.0,874.7M453.3,874.7L453.3,875.3M493.7,874.7L493.7,875.3M554.9,874.7L555.5,875.3M760.0,874.7L760.6,875.3M453.3,875.3L453.3,875.9M493.7,875.3L493.7,875.9M555.5,875.3L555.5,875.9M760.6,875.3L760.6,875.9M453.3,875.9L453.3,876.5M493.7,875.9L493.7,876.5M555.5,875.9L555.5,876.5M760.6,875.9L760.6,876.5M453.3,876.5L453.3,877.1M493.7,876.5L493.1,877.1M555.5,876.5L556.1,877.1M760.6,876.5L760.6,877.1M453.3,877.1L453.3,877.6M493.1,877.1L493.1,877.6M556.1,877.1L556.1,877.6M760.6,877.1L761.2,877.7M453.3,877.6L453.9,878.2M493.1,877.6L493.1,878.2M556.1,877.6L556.7,878.2M761.2,877.7L761.2,878.2M453.9,878.2L453.9,878.8M493.1,878.2L493.1,878.8M556.7,878.2L556.7,878.8M761.2,878.2L761.2,878.8M453.9,878.8L453.9,879.4M493.1,878.8L493.1,879.4M556.7,878.8L556.7,879.4M761.2,878.8L761.2,879.4M453.9,879.4L453.9,880.0M493.1,879.4L492.5,880.0M556.7,879.4L557.3,880.0M761.2,879.4L761.2,880.0M453.9,880.0L453.9,880.6M492.5,880.0L492.5,880.6M557.3,880.0L557.3,880.6M761.2,880.0L761.8,880.6M453.9,880.6L453.9,881.2M492.5,880.6L492.5,881.2M557.3,880.6L557.9,881.2M761.8,880.6L761.8,881.2M453.9,881.2L454.5,881.8M492.5,881.2L492.5,881.8M557.9,881.2L557.9,881.8M761.8,881.2L761.8,881.8M454.5,881.8L454.5,882.4M492.5,881.8L492.5,882.4M557.9,881.8L557.9,882.4M761.8,881.8L761.8,882.4M454.5,882.4L454.5,883.0M492.5,882.4L492.5,883.0M557.9,882.4L557.9,883.0M761.8,882.4L762.4,883.0M454.5,883.0L454.5,883.6M492.5,883.0L491.9,883.6M557.9,883.0L557.9,883.6M762.4,883.0L762.4,883.6M454.5,883.6L454.5,884.2M491.9,883.6L491.9,884.2M557.9,883.6L557.9,884.2M762.4,883.6L762.4,884.2M454.5,884.2L454.5,884.8M491.9,884.2L491.9,884.8M557.9,884.2L557.9,884.8M762.4,884.2L762.4,884.8M454.5,884.8L454.5,885.4M491.9,884.8L491.9,885.4M557.9,884.8L557.9,885.4M762.4,884.8L763.0,885.4M454.5,885.4L454.5,886.0M491.9,885.4L491.4,886.0M557.9,885.4L557.9,886.0M763.0,885.4L763.0,886.0M454.5,886.0L454.5,886.6M491.4,886.0L490.8,886.6M557.9,886.0L557.9,886.6M763.0,886.0L763.0,886.6M454.5,886.6L454.5,887.2M490.8,886.6L490.2,887.2M557.9,886.6L557.9,887.2M763.0,886.6L763.0,887.2M454.5,887.2L455.1,887.7M465.2,887.2L465.8,887.2M465.2,887.2L464.6,887.8M465.8,887.2L466.4,887.2M466.4,887.2L467.0,887.2M467.0,887.2L467.6,887.2M467.6,887.2L468.2,887.2M468.2,887.2L468.8,887.2M468.8,887.2L469.4,887.2M469.4,887.2L470.0,887.2M470.0,887.2L470.5,887.2M470.5,887.2L471.1,887.2M471.1,887.2L471.7,887.2M471.7,887.2L472.3,887.2M472.3,887.2L472.9,887.2M472.9,887.2L473.5,887.2M473.5,887.2L474.1,887.2M474.1,887.2L474.7,887.2M474.7,887.2L475.3,887.2M475.3,887.2L475.9,887.2M475.9,887.2L476.5,887.2M476.5,887.2L477.1,887.2M477.1,887.2L477.7,887.2M477.7,887.2L478.3,887.2M478.3,887.2L478.9,887.2M478.9,887.2L479.5,887.2M479.5,887.2L480.1,887.2M480.1,887.2L480.7,887.2M480.7,887.2L481.2,887.2M481.2,887.2L481.8,887.2M481.8,887.2L482.4,887.2M482.4,887.2L483.0,887.2M483.0,887.2L483.6,887.2M483.6,887.2L484.2,887.2M484.2,887.2L484.8,887.2M484.8,887.2L485.4,887.2M485.4,887.2L486.0,887.2M486.0,887.2L486.6,887.2M486.6,887.2L487.2,887.2M487.2,887.2L487.8,887.2M487.8,887.2L488.4,887.2M488.4,887.2L489.0,887.2M489.0,887.2L489.6,887.2M489.6,887.2L490.2,887.2M557.9,887.2L557.9,887.8M763.0,887.2L763.0,887.8M455.1,887.7L455.7,887.7M455.7,887.7L456.3,887.7M456.3,887.7L456.9,887.7M456.9,887.7L457.5,887.7M457.5,887.7L458.1,887.7M458.1,887.7L458.7,887.7M458.7,887.7L459.3,887.7M459.3,887.7L459.9,887.7M459.9,887.7L460.4,887.7M460.4,887.7L461.0,887.7M461.0,887.7L461.6,887.7M461.6,887.7L462.2,887.7M462.2,887.7L462.8,887.7M462.8,887.7L463.4,887.7M463.4,887.7L464.0,887.8M464.0,887.8L464.6,887.8M557.9,887.8L557.3,888.3M763.0,887.8L763.5,888.3M557.3,888.3L557.3,888.9M763.5,888.3L763.5,888.9M557.3,888.9L557.3,889.5M763.5,888.9L763.5,889.5M557.3,889.5L557.3,890.1M763.5,889.5L763.5,890.1M557.3,890.1L557.3,890.7M763.5,890.1L764.1,890.7M557.3,890.7L556.7,891.3M764.1,890.7L764.1,891.3M556.7,891.3L556.7,891.9M764.1,891.3L764.1,891.9M556.7,891.9L556.7,892.5M764.1,891.9L764.1,892.5M556.7,892.5L556.7,893.1M764.1,892.5L764.1,893.1M556.7,893.1L556.7,893.7M764.1,893.1L764.7,893.7M556.7,893.7L556.7,894.3M764.7,893.7L764.7,894.3M556.7,894.3L556.1,894.9M764.7,894.3L764.7,894.9M556.1,894.9L556.1,895.5M764.7,894.9L764.7,895.5M556.1,895.5L556.1,896.1M764.7,895.5L765.3,896.1M556.1,896.1L556.1,896.7M765.3,896.1L765.3,896.7M556.1,896.7L556.1,897.3M765.3,896.7L765.3,897.3M556.1,897.3L555.5,897.9M765.3,897.3L765.3,897.9M555.5,897.9L555.5,898.4M765.3,897.9L765.9,898.5M555.5,898.4L555.5,899.0M765.9,898.5L765.9,899.0M846.2,898.5L846.2,899.0M555.5,899.0L555.5,899.6M765.9,899.0L765.9,899.6M846.2,899.0L845.6,899.6M846.2,899.0L846.2,899.6M555.5,899.6L555.5,900.2M765.9,899.6L765.9,900.2M841.4,899.6L842.0,899.6M841.4,899.6L840.8,900.2M842.0,899.6L842.6,899.6M842.6,899.6L843.2,899.6M843.2,899.6L843.8,899.6M843.8,899.6L844.4,899.6M844.4,899.6L845.0,899.6M845.0,899.6L845.6,899.6M845.6,899.6L846.2,899.6M845.6,899.6L846.2,900.2M846.2,899.6L846.2,900.2M555.5,900.2L555.5,900.8M765.9,900.2L765.9,900.8M837.8,900.2L838.4,900.2M837.8,900.2L837.2,900.8M838.4,900.2L839.0,900.2M839.0,900.2L839.6,900.2M839.6,900.2L840.2,900.2M840.2,900.2L840.8,900.2M846.2,900.2L846.2,900.8M555.5,900.8L554.9,901.4M765.9,900.8L766.5,901.4M834.3,900.8L834.9,900.8M834.3,900.8L833.7,901.4M834.9,900.8L835.5,900.8M835.5,900.8L836.1,900.8M836.1,900.8L836.6,900.8M836.6,900.8L837.2,900.8M846.2,900.8L846.2,901.4M554.9,901.4L555.5,902.0M766.5,901.4L766.5,902.0M830.7,901.4L831.3,901.4M830.7,901.4L830.1,902.0M831.3,901.4L831.9,901.4M831.9,901.4L832.5,901.4M832.5,901.4L833.1,901.4M833.1,901.4L833.7,901.4M846.2,901.4L846.2,902.0M555.5,902.0L556.1,902.0M556.1,902.0L556.7,902.6M766.5,902.0L766.5,902.6M826.5,902.0L827.1,902.0M826.5,902.0L826.0,902.6M827.1,902.0L827.7,902.0M827.7,902.0L828.3,902.0M828.3,902.0L828.9,902.0M828.9,902.0L829.5,902.0M829.5,902.0L830.1,902.0M846.2,902.0L846.2,902.6M556.7,902.6L556.7,903.2M766.5,902.6L766.5,903.2M823.0,902.6L823.6,902.6M823.0,902.6L822.4,903.2M823.6,902.6L824.2,902.6M824.2,902.6L824.8,902.6M824.8,902.6L825.4,902.6M825.4,902.6L826.0,902.6M846.2,902.6L846.2,903.2M556.7,903.2L556.7,903.8M766.5,903.2L766.5,903.8M819.4,903.2L820.0,903.2M819.4,903.2L818.8,903.8M820.0,903.2L820.6,903.2M820.6,903.2L821.2,903.2M821.2,903.2L821.8,903.2M821.8,903.2L822.4,903.2M846.2,903.2L846.2,903.8M556.7,903.8L556.7,904.4M766.5,903.8L767.1,904.4M815.8,903.8L816.4,903.8M815.8,903.8L815.3,904.4M816.4,903.8L817.0,903.8M817.0,903.8L817.6,903.8M817.6,903.8L818.2,903.8M818.2,903.8L818.8,903.8M846.2,903.8L846.2,904.4M556.7,904.4L556.7,905.0M767.1,904.4L767.7,905.0M812.3,904.4L812.9,904.4M812.3,904.4L811.7,905.0M812.9,904.4L813.5,904.4M813.5,904.4L814.1,904.4M814.1,904.4L814.7,904.4M814.7,904.4L815.3,904.4M846.2,904.4L846.2,905.0M556.7,905.0L556.7,905.6M767.7,905.0L768.3,905.0M768.3,905.0L768.9,905.0M768.9,905.0L769.5,905.0M769.5,905.0L770.1,905.0M770.1,905.0L770.7,905.0M770.7,905.0L771.3,905.0M771.3,905.0L771.9,905.0M771.9,905.0L772.5,905.0M772.5,905.0L773.1,905.0M773.1,905.0L773.7,905.0M773.7,905.0L774.2,905.0M774.2,905.0L774.8,905.0M774.8,905.0L775.4,905.0M775.4,905.0L776.0,905.0M776.0,905.0L776.6,905.0M776.6,905.0L777.2,905.0M777.2,905.0L777.8,905.0M777.8,905.0L778.4,905.0M778.4,905.0L779.0,905.0M779.0,905.0L779.6,905.0M779.6,905.0L780.2,905.0M780.2,905.0L780.8,905.0M780.8,905.0L781.4,905.0M781.4,905.0L782.0,905.0M782.0,905.0L782.6,905.0M782.6,905.0L783.2,905.0M783.2,905.0L783.8,905.0M783.8,905.0L784.3,905.0M784.3,905.0L784.9,905.0M784.9,905.0L785.5,905.0M785.5,905.0L786.1,905.0M786.1,905.0L786.7,905.0M786.7,905.0L787.3,905.0M787.3,905.0L787.9,905.0M787.9,905.0L788.5,905.0M788.5,905.0L789.1,905.0M789.1,905.0L789.7,905.0M789.7,905.0L790.3,905.0M790.3,905.0L790.9,905.0M790.9,905.0L791.5,905.0M791.5,905.0L792.1,905.0M792.1,905.0L792.7,905.0M792.7,905.0L793.3,905.0M793.3,905.0L793.9,905.0M793.9,905.0L794.5,905.0M794.5,905.0L795.0,905.0M795.0,905.0L795.6,905.0M795.6,905.0L796.2,905.0M796.2,905.0L796.8,905.0M796.8,905.0L797.4,905.0M797.4,905.0L798.0,905.0M798.0,905.0L798.6,905.0M798.6,905.0L799.2,905.0M799.2,905.0L799.8,905.0M799.8,905.0L800.4,905.0M800.4,905.0L801.0,905.0M801.0,905.0L801.6,905.0M801.6,905.0L802.2,905.0M802.2,905.0L802.8,905.0M802.8,905.0L803.4,905.0M803.4,905.0L804.0,905.0M804.0,905.0L804.6,905.0M804.6,905.0L805.2,905.0M805.2,905.0L805.7,905.0M805.7,905.0L806.3,905.0M806.3,905.0L806.9,905.0M806.9,905.0L807.5,905.0M807.5,905.0L808.1,905.0M808.1,905.0L808.7,905.0M808.7,905.0L809.3,905.0M809.3,905.0L809.9,905.0M809.9,905.0L810.5,905.0M810.5,905.0L811.1,905.0M811.1,905.0L811.7,905.0M846.2,905.0L846.2,905.6M556.7,905.6L556.7,906.2M846.2,905.6L846.2,906.2M556.7,906.2L556.7,906.8M846.2,906.2L846.2,906.8M556.7,906.8L556.7,907.4M846.2,906.8L846.2,907.4M556.7,907.4L556.7,908.0M846.2,907.4L846.2,908.0M556.7,908.0L556.7,908.6M846.2,908.0L846.2,908.6M556.7,908.6L556.7,909.1M846.2,908.6L846.2,909.1M556.7,909.1L556.7,909.7M846.2,909.1L846.2,909.7M556.7,909.7L556.7,910.3M846.2,909.7L846.2,910.3M556.7,910.3L556.7,910.9M846.2,910.3L846.2,910.9M556.7,910.9L556.1,911.5M846.2,910.9L846.2,911.5M556.1,911.5L556.1,912.1M846.2,911.5L846.2,912.1M556.1,912.1L556.1,912.7M846.2,912.1L846.2,912.7M556.1,912.7L556.1,913.3M846.2,912.7L846.2,913.3M556.1,913.3L556.1,913.9M846.2,913.3L846.2,913.9M556.1,913.9L556.1,914.5M846.2,913.9L846.2,914.5M556.1,914.5L556.1,915.1M846.2,914.5L846.2,915.1M556.1,915.1L556.1,915.7M846.2,915.1L846.2,915.7M556.1,915.7L556.1,916.3M846.2,915.7L846.2,916.3M556.1,916.3L556.1,916.9M846.2,916.3L846.2,916.9M556.1,916.9L555.5,917.5M846.2,916.9L846.2,917.5M555.5,917.5L555.5,918.1M846.2,917.5L846.2,918.1M555.5,918.1L555.5,918.7M846.2,918.1L846.2,918.7M555.5,918.7L555.5,919.2M846.2,918.7L845.6,919.3M555.5,919.2L555.5,919.8M845.6,919.3L845.0,919.8M555.5,919.8L555.5,920.4M845.0,919.8L845.0,920.4M555.5,920.4L555.5,921.0M845.0,920.4L844.4,921.0M555.5,921.0L555.5,921.6M844.4,921.0L844.4,921.6M555.5,921.6L555.5,922.2M844.4,921.6L843.8,922.2M555.5,922.2L555.5,922.8M843.8,922.2L843.2,922.8M555.5,922.8L554.9,923.4M843.2,922.8L843.2,923.4M554.9,923.4L554.9,924.0M843.2,923.4L842.6,924.0M554.9,924.0L554.9,924.6M842.6,924.0L842.0,924.6M554.9,924.6L554.9,925.2M842.0,924.6L842.0,925.2M540.7,925.2L541.3,925.2M540.7,925.2L540.1,925.8M541.3,925.2L541.9,925.2M541.9,925.2L542.5,925.2M542.5,925.2L543.1,925.2M543.1,925.2L543.7,925.2M543.7,925.2L544.2,925.2M544.2,925.2L544.8,925.2M544.8,925.2L545.4,925.2M545.4,925.2L546.0,925.2M546.0,925.2L546.6,925.2M546.6,925.2L547.2,925.2M547.2,925.2L547.8,925.2M547.8,925.2L548.4,925.2M548.4,925.2L549.0,925.8M554.9,925.2L554.3,925.8M842.0,925.2L841.4,925.8M540.1,925.8L539.5,926.4M549.0,925.8L549.6,925.8M549.6,925.8L550.2,925.8M550.2,925.8L550.8,925.8M550.8,925.8L551.4,925.8M551.4,925.8L552.0,925.8M552.0,925.8L552.6,925.8M552.6,925.8L553.2,925.8M553.2,925.8L553.8,925.8M553.8,925.8L554.3,925.8M841.4,925.8L841.4,926.4M539.5,926.4L539.5,927.0M841.4,926.4L840.8,927.0M539.5,927.0L539.5,927.6M840.8,927.0L840.2,927.6M539.5,927.6L539.5,928.2M840.2,927.6L840.2,928.2M539.5,928.2L538.9,928.8M840.2,928.2L839.6,928.8M538.9,928.8L538.9,929.4M839.6,928.8L839.6,929.4M538.9,929.4L538.9,929.9M839.6,929.4L839.0,929.9M538.9,929.9L538.9,930.5M839.0,929.9L838.4,930.5M538.9,930.5L538.3,931.1M838.4,930.5L838.4,931.1M538.3,931.1L538.3,931.7M838.4,931.1L837.8,931.7M538.3,931.7L538.3,932.3M837.8,931.7L837.8,932.3M538.3,932.3L537.7,932.9M837.8,932.3L837.2,932.9M537.7,932.9L537.7,933.5M837.2,932.9L836.7,933.5M537.7,933.5L537.7,934.1M836.7,933.5L836.7,934.1M537.7,934.1L537.7,934.7M836.7,934.1L836.1,934.7M537.7,934.7L537.1,935.3M836.1,934.7L835.5,935.3M537.1,935.3L537.1,935.9M835.5,935.3L835.5,935.9M537.1,935.9L537.1,936.5M835.5,935.9L834.9,936.5M537.1,936.5L536.5,937.1M834.9,936.5L834.3,937.1M536.5,937.1L536.5,937.7M834.3,937.1L834.3,937.7M536.5,937.7L536.5,938.3M834.3,937.7L833.7,938.3M536.5,938.3L535.9,938.9M833.7,938.3L833.7,938.9M535.9,938.9L535.9,939.5M833.7,938.9L833.1,939.5M535.9,939.5L535.9,940.0M833.1,939.5L832.5,940.1M535.9,940.0L535.3,940.6M832.5,940.1L832.5,940.6M535.3,940.6L535.3,941.2M832.5,940.6L831.9,941.2M535.3,941.2L535.3,941.8M831.9,941.2L831.9,941.8M535.3,941.8L534.7,942.4M831.9,941.8L831.3,942.4M534.7,942.4L534.7,943.0M831.3,942.4L830.7,943.0M534.7,943.0L534.7,943.6M830.7,943.0L830.1,943.6M534.7,943.6L534.7,944.2M830.1,943.6L830.1,944.2M534.7,944.2L534.1,944.8M830.1,944.2L830.1,944.8M534.1,944.8L534.1,945.4M830.1,944.8L830.1,945.4M534.1,945.4L534.1,946.0M830.1,945.4L829.5,946.0M534.1,946.0L533.5,946.6M829.5,946.0L829.5,946.6M533.5,946.6L533.5,947.2M829.5,946.6L829.5,947.2M533.5,947.2L533.5,947.8M829.5,947.2L829.5,947.8M533.5,947.8L533.5,948.4M829.5,947.8L828.9,948.4M533.5,948.4L533.0,949.0M828.9,948.4L828.9,949.0M533.0,949.0L533.0,949.6M828.9,949.0L828.9,949.6M533.0,949.6L533.0,950.2M828.9,949.6L828.3,950.2M533.0,950.2L532.4,950.7M828.3,950.2L828.3,950.8M532.4,950.7L532.4,951.3M828.3,950.8L828.3,951.3M532.4,951.3L532.4,951.9M828.3,951.3L828.3,951.9M532.4,951.9L532.4,952.5M828.3,951.9L827.7,952.5M532.4,952.5L531.8,953.1M827.7,952.5L827.7,953.1M531.8,953.1L531.8,953.7M827.7,953.1L827.7,953.7M531.8,953.7L531.8,954.3M827.7,953.7L827.1,954.3M531.8,954.3L531.2,954.9M827.1,954.3L827.1,954.9M531.2,954.9L531.2,955.5M827.1,954.9L827.1,955.5M531.2,955.5L531.2,956.1M827.1,955.5L827.1,956.1M531.2,956.1L531.2,956.7M827.1,956.1L826.5,956.7M531.2,956.7L531.2,957.3M826.5,956.7L826.5,957.3M531.2,957.3L531.2,957.9M826.5,957.3L826.5,957.9M531.2,957.9L530.6,958.5M826.5,957.9L826.0,958.5M530.6,958.5L530.6,959.1M826.0,958.5L826.0,959.1M530.6,959.1L530.6,959.7M826.0,959.1L826.0,959.7M530.6,959.7L530.6,960.3M826.0,959.7L826.0,960.3M530.6,960.3L530.6,960.9M826.0,960.3L826.0,960.9M530.6,960.9L530.6,961.4M826.0,960.9L826.0,961.4M530.6,961.4L530.6,962.0M826.0,961.4L826.0,962.0M530.6,962.0L530.6,962.6M826.0,962.0L826.0,962.6M530.6,962.6L530.6,963.2M826.0,962.6L826.5,963.2M530.6,963.2L530.0,963.8M826.5,963.2L827.1,963.8M530.0,963.8L530.0,964.4M827.1,963.8L827.1,964.4M530.0,964.4L530.0,965.0M827.1,964.4L827.7,965.0M530.0,965.0L530.0,965.6M827.7,965.0L828.3,965.6M530.0,965.6L530.0,966.2M828.3,965.6L828.9,966.2M530.0,966.2L530.0,966.8M828.9,966.2L828.9,966.8M530.0,966.8L530.0,967.4M828.9,966.8L829.5,967.4M530.0,967.4L530.0,968.0M829.5,967.4L830.1,968.0M530.0,968.0L529.4,968.6M830.1,968.0L830.1,968.6M529.4,968.6L529.4,969.2M830.1,968.6L830.7,969.2M529.4,969.2L529.4,969.8M830.7,969.2L831.3,969.8M529.4,969.8L529.4,970.4M831.3,969.8L831.9,970.4M529.4,970.4L529.4,971.0M831.9,970.4L831.9,971.0M529.4,971.0L529.4,971.5M831.9,971.0L832.5,971.6M529.4,971.5L529.4,972.1M832.5,971.6L833.1,972.1M529.4,972.1L529.4,972.7M833.1,972.1L833.1,972.7M529.4,972.7L529.4,973.3M833.1,972.7L833.7,973.3M529.4,973.3L528.8,973.9M833.7,973.3L834.3,973.9M528.8,973.9L528.8,974.5M834.3,973.9L834.3,974.5M528.8,974.5L529.4,975.1M834.3,974.5L834.9,975.1M529.4,975.1L530.0,975.1M530.0,975.1L530.6,975.7M834.9,975.1L835.5,975.7M530.6,975.7L531.2,975.7M531.2,975.7L531.8,975.7M531.8,975.7L532.4,975.7M532.4,975.7L533.0,976.3M835.5,975.7L836.1,976.3M533.0,976.3L533.5,976.3M533.5,976.3L534.1,976.3M534.1,976.3L534.7,976.3M534.7,976.3L535.3,976.9M836.1,976.3L836.1,976.9M535.3,976.9L535.9,976.9M535.9,976.9L536.5,976.9M536.5,976.9L537.1,976.9M537.1,976.9L537.7,977.5M836.1,976.9L836.7,977.5M537.7,977.5L538.3,977.5M538.3,977.5L538.9,977.5M538.9,977.5L539.5,977.5M539.5,977.5L540.1,978.1M836.7,977.5L837.2,978.1M540.1,978.1L540.7,978.1M540.7,978.1L541.3,978.1M541.3,978.1L541.9,978.1M541.9,978.1L542.5,978.7M837.2,978.1L837.2,978.7M542.5,978.7L543.1,978.7M543.1,978.7L543.6,978.7M543.6,978.7L544.2,978.7M544.2,978.7L544.8,978.7M544.8,978.7L545.4,979.3M837.2,978.7L837.8,979.3M545.4,979.3L546.0,979.3M546.0,979.3L546.6,979.3M546.6,979.3L547.2,979.3M547.2,979.3L547.8,979.9M837.8,979.3L838.4,979.9M547.8,979.9L548.4,979.9M548.4,979.9L549.0,979.9M549.0,979.9L549.6,979.9M549.6,979.9L550.2,979.9M550.2,979.9L550.8,980.5M838.4,979.9L839.0,980.5M550.8,980.5L551.4,980.5M551.4,980.5L552.0,980.5M552.0,980.5L552.6,981.1M839.0,980.5L839.0,981.1M552.6,981.1L553.2,981.1M553.2,981.1L553.8,981.1M553.8,981.1L554.3,981.1M554.3,981.1L554.9,981.7M839.0,981.1L839.6,981.7M554.9,981.7L555.5,981.7M555.5,981.7L556.1,981.7M556.1,981.7L556.7,981.7M556.7,981.7L557.3,981.7M557.3,981.7L557.9,982.2M839.6,981.7L840.2,982.2M557.9,982.2L558.5,982.2M558.5,982.2L559.1,982.2M559.1,982.2L559.7,982.2M559.7,982.2L560.3,982.8M840.2,982.2L840.2,982.8M560.3,982.8L560.9,982.8M560.9,982.8L561.5,982.8M561.5,982.8L562.1,982.8M562.1,982.8L562.7,983.4M840.2,982.8L840.8,983.4M562.7,983.4L563.3,983.4M563.3,983.4L563.9,984.0M840.8,983.4L841.4,984.0M563.9,984.0L563.9,984.6M841.4,984.0L842.0,984.6M563.9,984.6L563.9,985.2M842.0,984.6L842.0,985.2M563.9,985.2L563.9,985.8M842.0,985.2L842.6,985.8M563.9,985.8L563.9,986.4M842.6,985.8L843.2,986.4M563.9,986.4L563.9,987.0M843.2,986.4L843.2,987.0M563.9,987.0L563.9,987.6M843.2,987.0L843.8,987.6M563.9,987.6L563.9,988.2M843.8,987.6L844.4,988.2M563.9,988.2L563.9,988.8M844.4,988.2L844.4,988.8M563.9,988.8L563.9,989.4M844.4,988.8L845.0,989.4M563.9,989.4L563.9,990.0M845.0,989.4L845.0,990.0M563.9,990.0L563.9,990.6M845.0,990.0L845.6,990.6M563.9,990.6L563.9,991.2M845.6,990.6L845.6,991.2M563.9,991.2L563.9,991.8M845.6,991.2L845.6,991.8M563.9,991.8L563.9,992.4M845.6,991.8L846.2,992.4M563.9,992.4L563.9,992.9M846.2,992.4L846.2,992.9M563.9,992.9L563.9,993.5M846.2,992.9L846.8,993.5M563.9,993.5L563.9,994.1M846.8,993.5L846.8,994.1M563.9,994.1L563.9,994.7M846.8,994.1L846.8,994.7M563.9,994.7L563.9,995.3M846.8,994.7L847.3,995.3M563.9,995.3L563.9,995.9M847.3,995.3L847.3,995.9M563.9,995.9L564.5,996.5M847.3,995.9L847.9,996.5M564.5,996.5L564.5,997.1M847.9,996.5L847.9,997.1M564.5,997.1L564.5,997.7M847.9,997.1L848.5,997.7M564.5,997.7L564.5,998.3M848.5,997.7L848.5,998.3M564.5,998.3L564.5,998.9M848.5,998.3L848.5,998.9M564.5,998.9L564.5,999.5M848.5,998.9L849.1,999.5M564.5,999.5L564.5,1000.1M849.1,999.5L849.1,1000.1M564.5,1000.1L564.5,1000.7M849.1,1000.1L849.7,1000.7M564.5,1000.7L564.5,1001.3M849.7,1000.7L849.7,1001.3M564.5,1001.3L565.0,1001.9M849.7,1001.3L849.7,1001.9M565.0,1001.9L565.6,1001.9M565.6,1001.9L566.2,1001.9M566.2,1001.9L566.8,1001.9M566.8,1001.9L567.4,1001.9M567.4,1001.9L568.0,1001.9M568.0,1001.9L568.6,1001.9M568.6,1001.9L569.2,1001.9M569.2,1001.9L569.8,1001.9M569.8,1001.9L570.4,1001.9M570.4,1001.9L571.0,1001.9M571.0,1001.9L571.6,1001.9M571.6,1001.9L572.2,1001.9M572.2,1001.9L572.8,1001.9M572.8,1001.9L573.4,1001.9M573.4,1001.9L574.0,1001.9M574.0,1001.9L574.6,1001.9M574.6,1001.9L575.1,1001.9M575.1,1001.9L575.7,1001.9M575.7,1001.9L576.3,1002.5M849.7,1001.9L850.3,1002.5M576.3,1002.5L576.3,1003.0M850.3,1002.5L850.3,1003.1M576.3,1003.0L576.3,1003.6M850.3,1003.1L850.9,1003.6M576.3,1003.6L576.3,1004.2M850.9,1003.6L850.9,1004.2M576.3,1004.2L576.3,1004.8M850.9,1004.2L851.5,1004.8M576.3,1004.8L576.3,1005.4M851.5,1004.8L851.5,1005.4M576.3,1005.4L576.3,1006.0M851.5,1005.4L851.5,1006.0M576.3,1006.0L576.3,1006.6M851.5,1006.0L852.1,1006.6M576.3,1006.6L576.3,1007.2M852.1,1006.6L852.1,1007.2M576.3,1007.2L576.3,1007.8M852.1,1007.2L852.7,1007.8M576.3,1007.8L576.3,1008.4M852.7,1007.8L852.7,1008.4M576.3,1008.4L576.3,1009.0M852.7,1008.4L853.3,1009.0M576.3,1009.0L576.3,1009.6M853.3,1009.0L853.3,1009.6M576.3,1009.6L576.3,1010.2M853.3,1009.6L853.3,1010.2M576.3,1010.2L576.3,1010.8M853.3,1010.2L853.3,1010.8M576.3,1010.8L576.3,1011.4M853.3,1010.8L853.3,1011.4M576.3,1011.4L576.3,1012.0M853.3,1011.4L853.3,1012.0M576.3,1012.0L576.3,1012.6M853.3,1012.0L853.3,1012.6M576.3,1012.6L576.3,1013.2M853.3,1012.6L852.7,1013.2M576.3,1013.2L576.3,1013.7M852.7,1013.2L852.1,1013.7M576.3,1013.7L576.3,1014.3M851.5,1013.7L852.1,1013.7M851.5,1013.7L850.9,1014.3M576.3,1014.3L576.3,1014.9M850.9,1014.3L850.3,1014.9M576.3,1014.9L576.3,1015.5M849.7,1014.9L850.3,1014.9M849.7,1014.9L849.1,1015.5M576.3,1015.5L576.3,1016.1M848.5,1015.5L849.1,1015.5M848.5,1015.5L847.9,1016.1M576.3,1016.1L575.7,1016.7M847.9,1016.1L847.3,1016.7M575.7,1016.7L575.7,1017.3M846.8,1016.7L847.3,1016.7M846.8,1016.7L846.2,1017.3M575.7,1017.3L575.7,1017.9M845.6,1017.3L846.2,1017.3M845.6,1017.3L845.0,1017.9M575.7,1017.9L575.7,1018.5M845.0,1017.9L844.4,1018.5M575.7,1018.5L575.7,1019.1M843.8,1018.5L844.4,1018.5M843.8,1018.5L843.2,1019.1M575.7,1019.1L575.7,1019.7M843.2,1019.1L842.6,1019.7M575.7,1019.7L575.7,1020.3M842.0,1019.7L842.6,1019.7M842.0,1019.7L841.4,1020.3M575.7,1020.3L575.7,1020.9M840.8,1020.3L841.4,1020.3M840.8,1020.3L840.2,1020.9M575.7,1020.9L575.7,1021.5M840.2,1020.9L839.6,1021.5M575.7,1021.5L575.7,1022.1M839.0,1021.5L839.6,1021.5M839.0,1021.5L838.4,1022.1M575.7,1022.1L575.7,1022.7M838.4,1022.1L837.8,1022.7M575.7,1022.7L575.7,1023.3M837.2,1022.7L837.8,1022.7M837.2,1022.7L836.7,1023.3M575.7,1023.3L575.7,1023.8M836.1,1023.3L836.7,1023.3M836.1,1023.3L835.5,1023.9M575.7,1023.8L575.7,1024.4M835.5,1023.9L834.9,1024.4M575.7,1024.4L575.7,1025.0M834.3,1024.4L834.9,1024.4M834.3,1024.4L833.7,1025.0M575.7,1025.0L575.1,1025.6M802.2,1025.0L802.8,1025.0M802.2,1025.0L801.6,1025.6M802.8,1025.0L803.4,1025.0M803.4,1025.0L804.0,1025.0M804.0,1025.0L804.6,1025.0M804.6,1025.0L805.2,1025.0M805.2,1025.0L805.7,1025.0M805.7,1025.0L806.3,1025.6M833.1,1025.0L833.7,1025.0M833.1,1025.0L832.5,1025.6M575.1,1025.6L575.1,1026.2M801.0,1025.6L801.6,1025.6M801.0,1025.6L800.4,1026.2M806.3,1025.6L806.9,1025.6M806.9,1025.6L807.5,1026.2M832.5,1025.6L831.9,1026.2M575.1,1026.2L575.1,1026.8M799.2,1026.2L799.8,1026.2M799.2,1026.2L798.6,1026.8M799.8,1026.2L800.4,1026.2M807.5,1026.2L808.1,1026.2M808.1,1026.2L808.7,1026.8M831.3,1026.2L831.9,1026.2M831.3,1026.2L830.7,1026.8M575.1,1026.8L575.1,1027.4M798.0,1026.8L798.6,1026.8M798.0,1026.8L797.4,1027.4M808.7,1026.8L809.3,1026.8M809.3,1026.8L809.9,1026.8M809.9,1026.8L810.5,1027.4M830.1,1026.8L830.7,1026.8M830.1,1026.8L829.5,1027.4M575.1,1027.4L575.1,1028.0M796.2,1027.4L796.8,1027.4M796.2,1027.4L795.6,1028.0M796.8,1027.4L797.4,1027.4M810.5,1027.4L811.1,1027.4M811.1,1027.4L811.7,1028.0M829.5,1027.4L828.9,1028.0M575.1,1028.0L575.1,1028.6M795.0,1028.0L795.6,1028.0M795.0,1028.0L794.5,1028.6M811.7,1028.0L812.3,1028.0M812.3,1028.0L812.9,1028.0M812.9,1028.0L813.5,1028.6M828.3,1028.0L828.9,1028.0M828.3,1028.0L827.7,1028.6M575.1,1028.6L575.1,1029.2M793.3,1028.6L793.9,1028.6M793.3,1028.6L792.7,1029.2M793.9,1028.6L794.5,1028.6M813.5,1028.6L814.1,1028.6M814.1,1028.6L814.7,1029.2M827.7,1028.6L827.1,1029.2M575.1,1029.2L575.1,1029.8M792.1,1029.2L792.7,1029.2M814.7,1029.2L815.3,1029.2M815.3,1029.2L815.9,1029.8M826.5,1029.2L827.1,1029.2M826.5,1029.2L826.0,1029.8M575.1,1029.8L575.1,1030.4M815.9,1029.8L816.4,1029.8M816.4,1029.8L817.0,1029.8M817.0,1029.8L817.6,1030.4M825.4,1029.8L826.0,1029.8M825.4,1029.8L824.8,1030.4M575.1,1030.4L575.1,1031.0M817.6,1030.4L818.2,1030.4M818.2,1030.4L818.8,1031.0M824.8,1030.4L824.2,1031.0M575.1,1031.0L575.1,1031.6M818.8,1031.0L819.4,1031.0M819.4,1031.0L820.0,1031.0M820.0,1031.0L820.6,1031.0M820.6,1031.0L821.2,1031.0M821.2,1031.0L821.8,1031.6M822.4,1031.0L823.0,1031.0M822.4,1031.0L821.8,1031.6M823.0,1031.0L823.6,1031.0M823.6,1031.0L824.2,1031.0M575.1,1031.6L575.1,1032.2M575.1,1032.2L575.1,1032.8M575.1,1032.8L575.1,1033.4M575.1,1033.4L575.1,1034.0M575.1,1034.0L575.1,1034.5M575.1,1034.5L574.6,1035.1M574.6,1035.1L574.6,1035.7M574.6,1035.7L574.6,1036.3M574.6,1036.3L574.6,1036.9M574.6,1036.9L574.6,1037.5M779.6,1036.9L779.0,1037.5M574.6,1037.5L574.6,1038.1M778.4,1037.5L779.0,1037.5M778.4,1037.5L777.8,1038.1M574.6,1038.1L574.6,1038.7M777.2,1038.1L777.8,1038.1M777.2,1038.1L776.6,1038.7M574.6,1038.7L574.6,1039.3M776.0,1038.7L776.6,1038.7M776.0,1038.7L775.4,1039.3M574.6,1039.3L574.6,1039.9M774.8,1039.3L775.4,1039.3M774.8,1039.3L774.2,1039.9M574.6,1039.9L574.6,1040.5M773.7,1039.9L774.2,1039.9M773.7,1039.9L773.1,1040.5M574.6,1040.5L574.6,1041.1M773.1,1040.5L772.5,1041.1M574.6,1041.1L574.6,1041.7M771.9,1041.1L772.5,1041.1M771.9,1041.1L771.3,1041.7M574.6,1041.7L574.6,1042.3M770.7,1041.7L771.3,1041.7M770.7,1041.7L770.1,1042.3M574.6,1042.3L574.6,1042.9M769.5,1042.3L770.1,1042.3M769.5,1042.3L768.9,1042.9M574.6,1042.9L574.6,1043.5M768.3,1042.9L768.9,1042.9M768.3,1042.9L767.7,1043.5M574.6,1043.5L574.6,1044.1M767.1,1043.5L767.7,1043.5M767.1,1043.5L766.5,1044.1M574.6,1044.1L574.6,1044.7M765.9,1044.1L766.5,1044.1M765.9,1044.1L765.3,1044.7M574.6,1044.7L574.6,1045.2M764.7,1044.7L765.3,1044.7M764.7,1044.7L764.1,1045.2M574.6,1045.2L574.6,1045.8M763.6,1045.2L764.1,1045.2M763.6,1045.2L763.0,1045.8M574.6,1045.8L574.6,1046.4M763.0,1045.8L762.4,1046.4M574.6,1046.4L574.0,1047.0M761.8,1046.4L762.4,1046.4M761.8,1046.4L761.2,1047.0M574.0,1047.0L574.0,1047.6M760.6,1047.0L761.2,1047.0M760.6,1047.0L760.0,1047.6M574.0,1047.6L574.0,1048.2M759.4,1047.6L760.0,1047.6M759.4,1047.6L758.8,1048.2M574.0,1048.2L574.0,1048.8M758.2,1048.2L758.8,1048.2M758.2,1048.2L757.6,1048.8M574.0,1048.8L574.6,1049.4M757.0,1048.8L757.6,1048.8M757.0,1048.8L756.4,1049.4M574.6,1049.4L575.1,1050.0M756.4,1049.4L755.8,1050.0M575.1,1050.0L575.1,1050.6M755.2,1050.0L755.8,1050.0M755.2,1050.0L754.6,1050.6M575.1,1050.6L575.1,1051.2M754.0,1050.6L754.6,1050.6M754.0,1050.6L753.4,1051.2M575.1,1051.2L575.1,1051.8M752.9,1051.2L753.4,1051.2M752.9,1051.2L752.3,1051.8M575.1,1051.8L575.1,1052.4M751.7,1051.8L752.3,1051.8M751.7,1051.8L751.1,1052.4M575.1,1052.4L575.1,1053.0M750.5,1052.4L751.1,1052.4M750.5,1052.4L749.9,1053.0M575.1,1053.0L575.1,1053.6M749.3,1053.0L749.9,1053.0M749.3,1053.0L748.7,1053.6M575.1,1053.6L575.1,1054.2M748.1,1053.6L748.7,1053.6M748.1,1053.6L747.5,1054.2M575.1,1054.2L575.1,1054.8M747.5,1054.2L746.9,1054.8M575.1,1054.8L574.6,1055.3M746.3,1054.8L746.9,1054.8M746.3,1054.8L745.7,1055.4M574.6,1055.3L574.6,1055.9M745.1,1055.4L745.7,1055.4M745.1,1055.4L744.5,1055.9M574.6,1055.9L574.6,1056.5M743.9,1055.9L744.5,1055.9M743.9,1055.9L743.3,1056.5M574.6,1056.5L574.6,1057.1M742.7,1056.5L743.3,1056.5M742.7,1056.5L742.2,1057.1M574.6,1057.1L574.6,1057.7M741.6,1057.1L742.2,1057.1M741.6,1057.1L741.0,1057.7M574.6,1057.7L574.6,1058.3M740.4,1057.7L741.0,1057.7M740.4,1057.7L739.8,1058.3M574.6,1058.3L574.6,1058.9M739.2,1058.3L739.8,1058.3M739.2,1058.3L738.6,1058.9M574.6,1058.9L574.6,1059.5M738.6,1058.9L738.0,1059.5M574.6,1059.5L574.6,1060.1M737.4,1059.5L738.0,1059.5M737.4,1059.5L736.8,1060.1M574.6,1060.1L574.6,1060.7M733.2,1060.1L733.8,1060.1M733.2,1060.1L732.6,1060.7M733.8,1060.1L734.4,1060.1M734.4,1060.1L735.0,1060.1M735.0,1060.1L735.6,1060.1M735.6,1060.1L736.2,1060.1M736.2,1060.1L736.8,1060.1M574.6,1060.7L574.6,1061.3M727.9,1060.7L728.5,1060.7M727.9,1060.7L727.3,1061.3M728.5,1060.7L729.1,1060.7M729.1,1060.7L729.7,1060.7M729.7,1060.7L730.3,1060.7M730.3,1060.7L730.9,1060.7M730.9,1060.7L731.5,1060.7M731.5,1060.7L732.1,1060.7M732.1,1060.7L732.6,1060.7M574.6,1061.3L575.1,1061.9M583.5,1061.3L584.1,1061.3M583.5,1061.3L582.9,1061.9M584.1,1061.3L584.7,1061.3M584.7,1061.3L585.3,1061.3M585.3,1061.3L585.8,1061.3M585.8,1061.3L586.4,1061.3M586.4,1061.3L587.0,1061.3M587.0,1061.3L587.6,1061.3M587.6,1061.3L588.2,1061.3M588.2,1061.3L588.8,1061.3M588.8,1061.3L589.4,1061.3M589.4,1061.3L590.0,1061.3M590.0,1061.3L590.6,1061.3M590.6,1061.3L591.2,1061.3M591.2,1061.3L591.8,1061.3M591.8,1061.3L592.4,1061.3M592.4,1061.3L593.0,1061.3M593.0,1061.3L593.6,1061.3M593.6,1061.3L594.2,1061.3M594.2,1061.3L594.8,1061.3M594.8,1061.3L595.4,1061.3M595.4,1061.3L595.9,1061.3M595.9,1061.3L596.5,1061.3M596.5,1061.3L597.1,1061.3M597.1,1061.3L597.7,1061.3M597.7,1061.3L598.3,1061.3M598.3,1061.3L598.9,1061.3M598.9,1061.3L599.5,1061.3M599.5,1061.3L600.1,1061.3M600.1,1061.3L600.7,1061.3M600.7,1061.3L601.3,1061.3M601.3,1061.3L601.9,1061.3M601.9,1061.3L602.5,1061.3M602.5,1061.3L603.1,1061.3M603.1,1061.3L603.7,1061.3M603.7,1061.3L604.3,1061.3M604.3,1061.3L604.9,1061.3M604.9,1061.3L605.5,1061.3M605.5,1061.3L606.1,1061.9M721.9,1061.3L722.5,1061.3M721.9,1061.3L721.4,1061.9M722.5,1061.3L723.1,1061.3M723.1,1061.3L723.7,1061.3M723.7,1061.3L724.3,1061.3M724.3,1061.3L724.9,1061.3M724.9,1061.3L725.5,1061.3M725.5,1061.3L726.1,1061.3M726.1,1061.3L726.7,1061.3M726.7,1061.3L727.3,1061.3M575.1,1061.9L575.7,1061.9M575.7,1061.9L576.3,1061.9M576.3,1061.9L576.9,1061.9M576.9,1061.9L577.5,1061.9M577.5,1061.9L578.1,1061.9M578.1,1061.9L578.7,1061.9M578.7,1061.9L579.3,1061.9M579.3,1061.9L579.9,1061.9M579.9,1061.9L580.5,1061.9M580.5,1061.9L581.1,1061.9M581.1,1061.9L581.7,1061.9M581.7,1061.9L582.3,1061.9M582.3,1061.9L582.9,1061.9M606.1,1061.9L606.6,1061.9M606.6,1061.9L607.2,1061.9M607.2,1061.9L607.8,1061.9M607.8,1061.9L608.4,1062.5M717.8,1061.9L718.4,1061.9M717.8,1061.9L717.2,1062.5M718.4,1061.9L719.0,1061.9M719.0,1061.9L719.6,1061.9M719.6,1061.9L720.2,1061.9M720.2,1061.9L720.8,1061.9M720.8,1061.9L721.4,1061.9M608.4,1062.5L609.0,1062.5M609.0,1062.5L609.6,1062.5M609.6,1062.5L610.2,1063.1M716.6,1062.5L717.2,1062.5M716.6,1062.5L716.0,1063.1M610.2,1063.1L610.8,1063.7M715.4,1063.1L716.0,1063.1M715.4,1063.1L714.8,1063.7M610.8,1063.7L611.4,1063.7M611.4,1063.7L612.0,1064.3M714.2,1063.7L714.8,1063.7M714.2,1063.7L713.6,1064.3M612.0,1064.3L612.6,1064.3M612.6,1064.3L613.2,1064.9M713.0,1064.3L713.6,1064.3M713.0,1064.3L712.4,1064.9M613.2,1064.9L613.2,1065.5M711.8,1064.9L712.4,1064.9M711.8,1064.9L711.2,1065.5M613.2,1065.5L613.2,1066.0M710.7,1065.5L711.2,1065.5M710.7,1065.5L710.1,1066.0M613.2,1066.0L613.8,1066.6M709.5,1066.0L710.1,1066.0M709.5,1066.0L708.9,1066.6M613.8,1066.6L614.4,1067.2M708.3,1066.6L708.9,1066.6M708.3,1066.6L707.7,1067.2M614.4,1067.2L615.0,1067.8M707.1,1067.2L707.7,1067.2M707.1,1067.2L706.5,1067.8M615.0,1067.8L615.6,1067.8M615.6,1067.8L616.2,1068.4M705.9,1067.8L706.5,1067.8M705.9,1067.8L705.3,1068.4M616.2,1068.4L616.8,1069.0M704.7,1068.4L705.3,1068.4M704.7,1068.4L704.1,1069.0M616.8,1069.0L617.3,1069.0M617.3,1069.0L617.9,1069.6M703.5,1069.0L704.1,1069.0M703.5,1069.0L702.9,1069.6M617.9,1069.6L618.5,1070.2M702.9,1069.6L702.3,1070.2M618.5,1070.2L619.1,1070.2M619.1,1070.2L619.7,1070.2M619.7,1070.2L620.3,1070.8M701.7,1070.2L702.3,1070.2M701.7,1070.2L701.1,1070.8M620.3,1070.8L620.9,1070.8M620.9,1070.8L621.5,1070.8M621.5,1070.8L622.1,1070.8M622.1,1070.8L622.7,1071.4M700.6,1070.8L701.1,1070.8M700.6,1070.8L700.0,1071.4M622.7,1071.4L623.3,1071.4M623.3,1071.4L623.9,1072.0M699.4,1071.4L700.0,1071.4M699.4,1071.4L698.8,1072.0M623.9,1072.0L624.5,1072.0M624.5,1072.0L625.1,1072.0M625.1,1072.0L625.7,1072.6M698.2,1072.0L698.8,1072.0M698.2,1072.0L697.6,1072.6M625.7,1072.6L626.3,1072.6M626.3,1072.6L626.9,1073.2M697.0,1072.6L697.6,1072.6M697.0,1072.6L696.4,1073.2M626.9,1073.2L627.4,1073.2M627.4,1073.2L628.0,1073.8M695.8,1073.2L696.4,1073.2M695.8,1073.2L695.2,1073.8M628.0,1073.8L628.6,1073.8M628.6,1073.8L629.2,1073.8M629.2,1073.8L629.8,1074.4M694.6,1073.8L695.2,1073.8M694.6,1073.8L694.0,1074.4M629.8,1074.4L630.4,1074.4M630.4,1074.4L631.0,1075.0M693.4,1074.4L694.0,1074.4M693.4,1074.4L692.8,1075.0M631.0,1075.0L631.6,1075.0M631.6,1075.0L632.2,1075.0M632.2,1075.0L632.8,1075.6M692.2,1075.0L692.8,1075.0M692.2,1075.0L691.6,1075.6M632.8,1075.6L633.4,1075.6M633.4,1075.6L634.0,1076.2M691.6,1075.6L691.0,1076.2M634.0,1076.2L634.6,1076.2M634.6,1076.2L635.2,1076.7M690.4,1076.2L691.0,1076.2M690.4,1076.2L689.9,1076.7M635.2,1076.7L635.8,1076.7M635.8,1076.7L636.4,1076.7M636.4,1076.7L637.0,1077.3M689.3,1076.7L689.9,1076.7M689.3,1076.7L688.7,1077.3M637.0,1077.3L637.6,1077.3M637.6,1077.3L638.1,1077.3M638.1,1077.3L638.7,1077.9M688.7,1077.3L688.1,1077.9M638.7,1077.9L639.3,1077.9M639.3,1077.9L639.9,1078.5M687.5,1077.9L688.1,1077.9M687.5,1077.9L686.9,1078.5M639.9,1078.5L640.5,1078.5M640.5,1078.5L641.1,1079.1M686.3,1078.5L686.9,1078.5M686.3,1078.5L685.7,1079.1M641.1,1079.1L641.7,1079.1M641.7,1079.1L642.3,1079.7M685.1,1079.1L685.7,1079.1M685.1,1079.1L684.5,1079.7M642.3,1079.7L642.9,1079.7M642.9,1079.7L643.5,1080.3M683.9,1079.7L684.5,1079.7M683.9,1079.7L683.3,1080.3M643.5,1080.3L644.1,1080.9M682.7,1080.3L683.3,1080.3M682.7,1080.3L682.1,1080.9M644.1,1080.9L644.7,1081.5M681.5,1080.9L682.1,1080.9M681.5,1080.9L680.9,1081.5M644.7,1081.5L645.3,1082.1M680.9,1081.5L680.3,1082.1M645.3,1082.1L645.9,1082.1M645.9,1082.1L646.5,1082.7M679.8,1082.1L680.3,1082.1M679.8,1082.1L679.2,1082.7M646.5,1082.7L647.1,1083.3M678.6,1082.7L679.2,1082.7M678.6,1082.7L678.0,1083.3M647.1,1083.3L647.7,1083.9M677.4,1083.3L678.0,1083.3M677.4,1083.3L676.8,1083.9M647.7,1083.9L648.3,1083.9M648.3,1083.9L648.8,1084.5M676.2,1083.9L676.8,1083.9M676.2,1083.9L675.6,1084.5M648.8,1084.5L649.4,1085.1M675.0,1084.5L675.6,1084.5M675.0,1084.5L674.4,1085.1M649.4,1085.1L650.0,1085.7M674.4,1085.1L673.8,1085.7M650.0,1085.7L650.6,1085.7M650.6,1085.7L651.2,1086.3M673.2,1085.7L673.8,1085.7M673.2,1085.7L672.6,1086.3M651.2,1086.3L651.8,1086.8M672.0,1086.3L672.6,1086.3M672.0,1086.3L671.4,1086.8M651.8,1086.8L652.4,1087.4M670.8,1086.8L671.4,1086.8M670.8,1086.8L670.2,1087.4M652.4,1087.4L653.0,1088.0M669.6,1087.4L670.2,1087.4M669.6,1087.4L669.1,1088.0M653.0,1088.0L653.6,1088.0M653.6,1088.0L654.2,1088.6M668.5,1088.0L669.1,1088.0M668.5,1088.0L667.9,1088.6M654.2,1088.6L654.8,1089.2M667.3,1088.6L667.9,1088.6M667.3,1088.6L666.7,1089.2M654.8,1089.2L655.4,1089.2M655.4,1089.2L656.0,1089.8M666.7,1089.2L666.1,1089.8M656.0,1089.8L656.6,1090.4M665.5,1089.8L666.1,1089.8M665.5,1089.8L664.9,1090.4M656.6,1090.4L657.2,1091.0M664.3,1090.4L664.9,1090.4M664.3,1090.4L663.7,1091.0M657.2,1091.0L657.8,1091.0M657.8,1091.0L658.4,1091.6M663.1,1091.0L663.7,1091.0M663.1,1091.0L662.5,1091.6M658.4,1091.6L658.9,1091.6M658.9,1091.6L659.5,1092.2M661.9,1091.6L662.5,1091.6M661.9,1091.6L661.3,1092.2M659.5,1092.2L660.1,1092.8M661.3,1092.2L660.7,1092.8M660.1,1092.8L660.7,1092.8M660.1,1092.8L660.1,1093.4M660.7,1092.8L660.1,1093.4M660.1,1093.4L660.1,1094.0M660.1,1094.0L660.1,1094.6M660.1,1094.6L660.1,1095.2M660.1,1095.2L660.1,1095.8M660.1,1095.8L660.1,1096.4M660.1,1096.4L660.1,1097.0M660.1,1097.0L660.1,1097.5M660.1,1097.5L660.1,1098.1M660.1,1098.1L660.1,1098.7M660.1,1098.7L660.1,1099.3M660.1,1099.3L660.1,1099.9M660.1,1099.9L660.1,1100.5M660.1,1100.5L660.1,1101.1M660.1,1101.1L660.1,1101.7M660.1,1101.7L660.1,1102.3M660.1,1102.3L660.1,1102.9M660.1,1102.9L660.1,1103.5M660.1,1103.5L660.1,1104.1M660.1,1104.1L660.1,1104.7M660.1,1104.7L660.1,1105.3M660.1,1105.3L660.1,1105.9M660.1,1105.9L660.1,1106.5M660.1,1106.5L660.1,1107.1M660.1,1107.1L660.1,1107.7M660.1,1107.7L660.1,1108.2M660.1,1108.2L660.1,1108.8M660.1,1108.8L660.1,1109.4M660.1,1109.4L660.1,1110.0M660.1,1110.0L660.7,1110.6M660.7,1110.6L660.7,1111.2M660.7,1111.2L660.7,1111.8M660.7,1111.8L661.3,1112.4M661.3,1112.4L661.3,1113.0M661.3,1113.0L661.9,1113.6M661.9,1113.6L661.9,1114.2M661.9,1114.2L661.9,1114.8M661.9,1114.8L662.5,1115.4M662.5,1115.4L662.5,1116.0M662.5,1116.0L663.1,1116.6M663.1,1116.6L663.1,1117.2M663.1,1117.2L663.7,1117.8M663.7,1117.8L663.7,1118.3M663.7,1118.3L664.3,1118.9M664.3,1118.9L664.3,1119.5M664.3,1119.5L664.9,1120.1M664.9,1120.1L664.9,1120.7M664.9,1120.7L664.9,1121.3M664.9,1121.3L665.5,1121.9M665.5,1121.9L665.5,1122.5M665.5,1122.5L666.1,1123.1M666.1,1123.1L666.1,1123.7M666.1,1123.7L666.7,1124.3M666.7,1124.3L666.7,1124.9M666.7,1124.9L667.3,1125.5M667.3,1125.5L667.3,1126.1M667.3,1126.1L667.9,1126.7M667.9,1126.7L667.9,1127.3M667.9,1127.3L668.5,1127.9M668.5,1127.9L668.5,1128.5M668.5,1128.5L669.1,1129.0M669.1,1129.0L669.1,1129.6M669.1,1129.6L669.1,1130.2M669.1,1130.2L669.6,1130.8M669.6,1130.8L669.6,1131.4M669.6,1131.4L670.2,1132.0M670.2,1132.0L670.2,1132.6M670.2,1132.6L670.2,1133.2M670.2,1133.2L670.2,1133.8M670.2,1133.8L670.2,1134.4M670.2,1134.4L670.2,1135.0M670.2,1135.0L670.2,1135.6M670.2,1135.6L670.2,1136.2M670.2,1136.2L670.2,1136.8M670.2,1136.8L670.2,1137.4M670.2,1137.4L669.6,1138.0M669.6,1138.0L669.1,1138.6M669.1,1138.6L668.5,1139.2M663.1,1139.2L663.7,1139.2M663.1,1139.2L662.5,1139.7M663.7,1139.2L664.3,1139.2M664.3,1139.2L664.9,1139.2M664.9,1139.2L665.5,1139.2M665.5,1139.2L666.1,1139.2M666.1,1139.2L666.7,1139.2M666.7,1139.2L667.3,1139.2M667.3,1139.2L667.9,1139.2M667.9,1139.2L668.5,1139.2M660.1,1139.7L660.7,1139.7M660.1,1139.7L659.5,1140.3M660.7,1139.7L661.3,1139.7M661.3,1139.7L661.9,1139.7M661.9,1139.7L662.5,1139.7M659.5,1140.3L658.9,1140.9M658.9,1140.9L658.9,1141.5M658.9,1141.5L658.9,1142.1M658.9,1142.1L658.9,1142.7M658.9,1142.7L658.4,1143.3M658.4,1143.3L658.4,1143.9M658.4,1143.9L658.4,1144.5M658.4,1144.5L658.4,1145.1M658.4,1145.1L658.4,1145.7M658.4,1145.7L657.8,1146.3M658.4,1145.7L658.4,1146.3M657.8,1146.3L658.4,1146.3M657.8,1146.3L657.2,1146.9M658.4,1146.3L658.9,1146.9M657.2,1146.9L656.6,1147.5M658.9,1146.9L659.5,1147.5M656.6,1147.5L656.0,1148.1M659.5,1147.5L660.1,1148.1M656.0,1148.1L655.4,1148.7M660.1,1148.1L660.1,1148.7M655.4,1148.7L655.4,1149.3M660.1,1148.7L660.1,1149.3M655.4,1149.3L655.4,1149.8M660.1,1149.3L660.1,1149.8M655.4,1149.8L655.4,1150.4M660.1,1149.8L660.1,1150.4M655.4,1150.4L654.8,1151.0M660.1,1150.4L660.1,1151.0M654.8,1151.0L654.8,1151.6M660.1,1151.0L660.1,1151.6M654.8,1151.6L654.8,1152.2M660.1,1151.6L660.1,1152.2M654.8,1152.2L654.8,1152.8M660.1,1152.2L660.1,1152.8M654.8,1152.8L654.2,1153.4M660.1,1152.8L660.1,1153.4M654.2,1153.4L654.2,1154.0M660.1,1153.4L660.1,1154.0M654.2,1154.0L654.2,1154.6M660.1,1154.0L660.1,1154.6M654.2,1154.6L654.2,1155.2M660.1,1154.6L660.1,1155.2M654.2,1155.2L654.2,1155.8M660.1,1155.2L660.1,1155.8M654.2,1155.8L653.6,1156.4M660.1,1155.8L660.1,1156.4M653.6,1156.4L653.6,1157.0M660.1,1156.4L660.1,1157.0M653.6,1157.0L653.6,1157.6M660.1,1157.0L660.1,1157.6M653.6,1157.6L653.6,1158.2M660.1,1157.6L660.1,1158.2M653.6,1158.2L653.0,1158.8M653.6,1158.2L654.2,1158.8M660.1,1158.2L659.5,1158.8M654.2,1158.8L654.8,1158.8M654.8,1158.8L655.4,1158.8M655.4,1158.8L656.0,1158.8M656.0,1158.8L656.6,1158.8M656.6,1158.8L657.2,1158.8M657.2,1158.8L657.8,1158.8M657.8,1158.8L658.4,1158.8M658.4,1158.8L658.9,1158.8M658.9,1158.8L659.5,1158.8`,
      markers: [],
      showCumulativeDistances: false,
      journeyStops: [
        { x: 1435.0, y: 920.0, label: 'РОСТОК' },
        { x: 890.0, y: 850.0, label: 'РЫЖИЙ ЛЕС' },
        { x: 660.0, y: 620.0, label: 'ЯНОВ' },
        { x: 1085.0, y: 595.0, label: 'ЮПИТЕР' },
        { x: 1070.0, y: 1380.0, label: 'ХИМЗАВОД' }
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
      label: 'ПОРА ПРОВЕРИТЬ',
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
    let lastMove = null;

    commands.forEach(command => {
      if (command.cmd === 'M') {
        lastMove = command;
        return;
      }

      if (command.cmd === 'L' && lastMove) {
        total += Math.hypot(
          command.x - lastMove.x,
          command.y - lastMove.y
        );
        lastMove = null;
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
        formatJourneyRealTime(
          mapJourneyPlan.realSeconds
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
        formatJourneyRealTime(plan.realSeconds);
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

  function buildScreenRoadPath(route) {
    return getRoadPathCommands(route)
      .map(({ cmd, x, y }) => {
        const sx = mapPanX + x * mapZoom;
        const sy = mapPanY + y * mapZoom;
        return `${cmd}${sx.toFixed(1)},${sy.toFixed(1)}`;
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
    link.download = 'zone-clock-test-v80.csv';
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

  function buildChronometrySeries() {
    const series = [
      {
        realMinutes: 0,
        zoneHours: 0,
        realHours: 0
      }
    ];

    let realSeconds = 0;
    let zoneSeconds = 0;

    PATCH20_RATE_TABLE.forEach(rate => {
      const zoneDelta = RATE_SLOT_SECONDS;
      const realDelta = zoneDelta / rate;

      zoneSeconds += zoneDelta;
      realSeconds += realDelta;

      series.push({
        realMinutes: realSeconds / 60,
        zoneHours: zoneSeconds / 3600,
        realHours: realSeconds / 3600
      });
    });

    return series;
  }

  function drawChronometryChart() {
    if (!els.chronometryChart) return;

    const svg = els.chronometryChart;
    svg.innerHTML = '';

    const series = buildChronometrySeries();

    const ns = 'http://www.w3.org/2000/svg';
    const width = 760;
    const height = 400;
    const left = 68;
    const right = 28;
    const top = 38;
    const bottom = 62;
    const plotW = width - left - right;
    const plotH = height - top - bottom;

    const totalRealMinutes =
      series[series.length - 1].realMinutes;

    const maxX =
      Math.ceil(totalRealMinutes / 15) * 15;
    const maxY = 24;

    const xFor = minutes =>
      left + plotW * (minutes / maxX);

    const yFor = hours =>
      top + plotH * (1 - hours / maxY);

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

    [0, 4, 8, 12, 16, 20, 24]
      .forEach(hours => {
        const y = yFor(hours);

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
          `${hours} ч`,
          'chronometry-axis-label',
          'end'
        );
      });

    const xStep = maxX <= 105 ? 15 : 30;

    for (
      let minutes = 0;
      minutes <= maxX;
      minutes += xStep
    ) {
      const x = xFor(minutes);

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
        height - 28,
        String(minutes),
        'chronometry-axis-label',
        'middle'
      );
    }

    addText(
      left + plotW / 2,
      height - 6,
      'реально прошло, минут',
      'chronometry-axis-title',
      'middle'
    );

    const yTitle = addText(
      18,
      top + plotH / 2,
      'накопленное время, часов',
      'chronometry-axis-title',
      'middle'
    );

    yTitle.setAttribute(
      'transform',
      `rotate(-90 18 ${top + plotH / 2})`
    );

    const zonePoints = series.map(
      point => [
        xFor(point.realMinutes),
        yFor(point.zoneHours)
      ]
    );

    const realPoints = series.map(
      point => [
        xFor(point.realMinutes),
        yFor(point.realHours)
      ]
    );

    const gapPolygon = [
      ...zonePoints,
      ...realPoints.slice().reverse()
    ]
      .map(
        ([x, y]) =>
          `${x.toFixed(1)},${y.toFixed(1)}`
      )
      .join(' ');

    svg.appendChild(
      make('polygon', {
        points: gapPolygon,
        class: 'chronometry-gap-series'
      })
    );

    svg.appendChild(
      make('polyline', {
        points: zonePoints
          .map(
            ([x, y]) =>
              `${x.toFixed(1)},${y.toFixed(1)}`
          )
          .join(' '),
        class: 'chronometry-zone-series'
      })
    );

    svg.appendChild(
      make('polyline', {
        points: realPoints
          .map(
            ([x, y]) =>
              `${x.toFixed(1)},${y.toFixed(1)}`
          )
          .join(' '),
        class: 'chronometry-real-series'
      })
    );

    const end = series[series.length - 1];
    const endX = xFor(end.realMinutes);
    const zoneY = yFor(end.zoneHours);
    const realY = yFor(end.realHours);

    svg.appendChild(
      make('circle', {
        cx: endX,
        cy: zoneY,
        r: 5.5,
        class: 'chronometry-zone-dot'
      })
    );

    svg.appendChild(
      make('circle', {
        cx: endX,
        cy: realY,
        r: 4.5,
        class: 'chronometry-real-dot'
      })
    );

    addText(
      endX - 10,
      zoneY - 13,
      '24 ч Зоны',
      'chronometry-zone-end-label',
      'end'
    );

    addText(
      endX - 10,
      realY - 12,
      `${end.realHours.toFixed(1)} ч реального`,
      'chronometry-real-end-label',
      'end'
    );

    if (els.chronometrySummary) {
      const roundedMinutes =
        Math.round(end.realMinutes);

      const hours =
        Math.floor(roundedMinutes / 60);

      const minutes =
        roundedMinutes % 60;

      const gap =
        24 - end.realHours;

      els.chronometrySummary.textContent =
        `24 часа Зоны по калибровке Patch 2.0 проходят примерно за ${hours} ч ${minutes} мин реального времени. К завершению цикла накопленное расхождение составляет около ${gap.toFixed(1)} часа.`;
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
