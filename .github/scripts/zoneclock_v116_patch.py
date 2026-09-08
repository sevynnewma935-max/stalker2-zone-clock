from pathlib import Path
import re


def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected 1 exact match, got {count}")
    return text.replace(old, new, 1)


def sub_once(text, pattern, repl, label):
    text2, count = re.subn(pattern, repl, text, count=1, flags=re.S)
    if count != 1:
        raise SystemExit(f"{label}: expected 1 regex match, got {count}")
    return text2


# ---------- app.js ----------
app_path = Path("app.js")
app = app_path.read_text(encoding="utf-8")

app = replace_once(
    app,
    "  const MOVEMENT_TEST_ROUTE_KEY = 'stalker2-zone-clock-movement-test-route-v1';\n",
    "  const MOVEMENT_TEST_ROUTE_KEY = 'stalker2-zone-clock-movement-test-route-v1';\n"
    "  const MOVEMENT_TEST_CUSTOM_ROUTE_KEY = 'stalker2-zone-clock-movement-test-custom-route-v1';\n",
    "custom route storage key",
)

app = replace_once(
    app,
    "    movementTestRouteSelect: $('movementTestRouteSelect'),\n"
    "    movementTestRouteName: $('movementTestRouteName'),\n"
    "    movementTestHelp: $('movementTestHelp'),\n"
    "    showMovementTestRouteBtn: $('showMovementTestRouteBtn'),\n",
    "    movementTestPointCount: $('movementTestPointCount'),\n"
    "    movementTestRouteName: $('movementTestRouteName'),\n"
    "    movementTestHelp: $('movementTestHelp'),\n"
    "    editMovementTestRouteBtn: $('editMovementTestRouteBtn'),\n"
    "    mapMovementTestDoneBtn: $('mapMovementTestDoneBtn'),\n",
    "movement DOM refs",
)

# In movement-test mode, map clicks create route points before double-tap zoom handling.
app = replace_once(
    app,
    "        const now = performance.now();\n        const nearPreviousTap =\n",
    "        if (mapSelectedRouteKey === MAP_ROUTE_MODE_MOVEMENT_TEST) {\n"
    "          mapLastTapAt = 0;\n"
    "          if (!loadActiveMovementTest()) {\n"
    "            addMovementTestPoint(event.clientX, event.clientY);\n"
    "          }\n"
    "          return;\n"
    "        }\n\n"
    "        const now = performance.now();\n        const nearPreviousTap =\n",
    "movement map tap",
)

# Toolbar undo / clear work on the custom test route while it is selected.
app = replace_once(
    app,
    "  if (els.mapUndoBtn) {\n"
    "    els.mapUndoBtn.addEventListener('click', () => {\n"
    "      mapMeasurePoints.pop();\n"
    "      renderMapMeasurement();\n"
    "    });\n"
    "  }\n\n"
    "  if (els.mapClearBtn) {\n"
    "    els.mapClearBtn.addEventListener('click', () => {\n"
    "      if (mapSelectedRouteKey === MAP_ROUTE_MODE_CUSTOM_ARTIFACT) {\n"
    "        clearCustomArtifactRoute();\n"
    "      } else {\n"
    "        clearMapMeasurement();\n"
    "      }\n"
    "    });\n"
    "  }\n",
    "  if (els.mapUndoBtn) {\n"
    "    els.mapUndoBtn.addEventListener('click', () => {\n"
    "      if (mapSelectedRouteKey === MAP_ROUTE_MODE_MOVEMENT_TEST) {\n"
    "        undoMovementTestPoint();\n"
    "      } else {\n"
    "        mapMeasurePoints.pop();\n"
    "        renderMapMeasurement();\n"
    "      }\n"
    "    });\n"
    "  }\n\n"
    "  if (els.mapClearBtn) {\n"
    "    els.mapClearBtn.addEventListener('click', () => {\n"
    "      if (mapSelectedRouteKey === MAP_ROUTE_MODE_MOVEMENT_TEST) {\n"
    "        clearMovementTestRoute();\n"
    "      } else if (mapSelectedRouteKey === MAP_ROUTE_MODE_CUSTOM_ARTIFACT) {\n"
    "        clearCustomArtifactRoute();\n"
    "      } else {\n"
    "        clearMapMeasurement();\n"
    "      }\n"
    "    });\n"
    "  }\n\n"
    "  if (els.mapMovementTestDoneBtn) {\n"
    "    els.mapMovementTestDoneBtn.addEventListener('click', returnToMovementTest);\n"
    "  }\n",
    "movement undo/clear/done handlers",
)

# Full-screen reset also clears user test points.
app = replace_once(
    app,
    "        if (mapSelectedRouteKey === MAP_ROUTE_MODE_CUSTOM_ARTIFACT && mapCustomArtifactSequence.length) {\n"
    "          clearCustomArtifactRoute();\n"
    "        } else if (mapRoadPlannerSequence.length) {\n",
    "        if (mapSelectedRouteKey === MAP_ROUTE_MODE_MOVEMENT_TEST && movementTestCustomPoints.length) {\n"
    "          clearMovementTestRoute();\n"
    "        } else if (mapSelectedRouteKey === MAP_ROUTE_MODE_CUSTOM_ARTIFACT && mapCustomArtifactSequence.length) {\n"
    "          clearCustomArtifactRoute();\n"
    "        } else if (mapRoadPlannerSequence.length) {\n",
    "fullscreen movement reset handler",
)

# Dynamic CSV export: current custom routes + legacy root runs.
app = sub_once(
    app,
    r"    Object\.keys\(\n      MOVEMENT_TEST_ROUTES\n    \)\.forEach\(routeKey => \{.*?\n    \}\);\n\n    const daylightMarks = loadDaylightMarks\(\);",
    """    Object.entries(movementTests).forEach(([routeKey, routeData]) => {
      if (!routeData || typeof routeData !== 'object' || Array.isArray(routeData)) return;

      ['slow', 'fast', 'run'].forEach(mode => {
        const runs = Array.isArray(routeData[mode]) ? routeData[mode] : [];
        runs.forEach(run => {
          rows.push([
            run.routeLabel || 'Свой тестовый маршрут',
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
    });

    ['slow', 'fast', 'run'].forEach(mode => {
      const runs = Array.isArray(movementTests[mode]) ? movementTests[mode] : [];
      runs.forEach(run => {
        rows.push([
          run.routeLabel || 'Старый контрольный маршрут',
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

    const daylightMarks = loadDaylightMarks();""",
    "movement CSV export",
)

# Custom route compatibility layer. Later function declarations intentionally replace
# the old fixed-route implementations without disturbing other Zone Clock logic.
override = r'''

  // PWA v116 — пользовательский тестовый маршрут по произвольным точкам.
  let movementTestCustomPoints = (() => {
    try {
      const parsed = JSON.parse(
        localStorage.getItem(MOVEMENT_TEST_CUSTOM_ROUTE_KEY) || '[]'
      );
      if (!Array.isArray(parsed)) return [];
      return parsed
        .map(point => ({ x: Number(point?.x), y: Number(point?.y) }))
        .filter(point =>
          Number.isFinite(point.x) && Number.isFinite(point.y) &&
          point.x >= 0 && point.x <= 2048 &&
          point.y >= 0 && point.y <= 2048
        );
    } catch (_) {
      return [];
    }
  })();

  let movementTestReturnToDialog = false;

  function movementTestRouteId(points = movementTestCustomPoints) {
    if (!Array.isArray(points) || points.length < 2) return 'custom_empty';
    const source = points
      .map(point => `${Math.round(Number(point.x) * 10)},${Math.round(Number(point.y) * 10)}`)
      .join(';');
    let hash = 2166136261;
    for (let index = 0; index < source.length; index++) {
      hash ^= source.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return `custom_${(hash >>> 0).toString(36)}`;
  }

  function persistMovementTestRoute() {
    localStorage.setItem(
      MOVEMENT_TEST_CUSTOM_ROUTE_KEY,
      JSON.stringify(movementTestCustomPoints)
    );
    movementTestRouteKey = movementTestRouteId();
    localStorage.setItem(MOVEMENT_TEST_ROUTE_KEY, movementTestRouteKey);
  }

  function getMovementTestRoute(_routeKey = movementTestRouteKey) {
    const points = movementTestCustomPoints.map((point, index) => ({
      x: Number(point.x),
      y: Number(point.y),
      label: `Точка ${index + 1}`,
      shortLabel: `ТОЧКА ${index + 1}`
    }));
    const key = movementTestRouteId(points);
    movementTestRouteKey = key;
    return {
      key,
      label: 'Свой тестовый маршрут',
      shortLabel: points.length ? `Свой маршрут · ${points.length} точек` : 'Свой маршрут',
      points,
      start: points[0] || null,
      end: points[points.length - 1] || null,
      help: points.length >= 2
        ? 'Маршрут готов. Встаньте в точке 1, выберите темп и нажмите «СТАРТ». Пройдите все точки по порядку и в последней нажмите «ФИНИШ».'
        : 'Нажмите «СОЗДАТЬ ПО ТОЧКАМ» и поставьте на общей карте минимум две точки. Промежуточных точек может быть сколько угодно.'
    };
  }

  function movementTestDistanceMeters() {
    const route = getMovementTestRoute();
    return route.points.length >= 2 ? plannerPathMeters(route.points) : 0;
  }

  function loadActiveMovementTest() {
    try {
      const data = JSON.parse(localStorage.getItem(MOVEMENT_TEST_ACTIVE_KEY) || 'null');
      if (!data || !MOVEMENT_TEST_MODES[data.mode] || !(Number(data.startedAtMs) > 0)) {
        return null;
      }
      return data;
    } catch (_) {
      return null;
    }
  }

  function movementModeRuns(mode, routeKey = movementTestRouteKey) {
    const data = loadMovementTests();
    if (data[routeKey] && Array.isArray(data[routeKey][mode])) {
      return data[routeKey][mode];
    }
    if (routeKey === 'cement_swyd' && Array.isArray(data[mode])) {
      return data[mode];
    }
    return [];
  }

  function movementModeAverage(mode, routeKey = movementTestRouteKey) {
    const runs = movementModeRuns(mode, routeKey);
    const valid = runs.filter(run =>
      Number.isFinite(Number(run.speedKmh)) && Number(run.speedKmh) > 0
    );
    if (!valid.length) return null;
    return {
      count: valid.length,
      speedKmh: valid.reduce((sum, run) => sum + Number(run.speedKmh), 0) / valid.length,
      realSeconds: valid.reduce((sum, run) => sum + Number(run.realSeconds), 0) / valid.length
    };
  }

  function movementRouteSnapshot(route) {
    return {
      key: route.key,
      label: route.label,
      shortLabel: route.shortLabel,
      points: route.points.map(point => ({
        x: Number(point.x),
        y: Number(point.y),
        label: point.label,
        shortLabel: point.shortLabel
      })),
      start: route.start ? { ...route.start } : null,
      end: route.end ? { ...route.end } : null
    };
  }

  function updateMovementTestUi() {
    const active = loadActiveMovementTest();
    const currentRoute = getMovementTestRoute();
    const route = active?.routeSnapshot?.points?.length >= 2
      ? active.routeSnapshot
      : currentRoute;
    const distanceMeters = active && Number(active.distanceMeters) > 0
      ? Number(active.distanceMeters)
      : movementTestDistanceMeters();

    if (els.movementTestRouteName) {
      els.movementTestRouteName.textContent = 'СВОЙ ТЕСТОВЫЙ МАРШРУТ';
    }
    if (els.movementTestPointCount) {
      els.movementTestPointCount.textContent = String(currentRoute.points.length);
    }
    if (els.editMovementTestRouteBtn) {
      els.editMovementTestRouteBtn.disabled = Boolean(active);
      els.editMovementTestRouteBtn.textContent = active
        ? 'МАРШРУТ ЗАБЛОКИРОВАН'
        : currentRoute.points.length
          ? 'ИЗМЕНИТЬ ПО ТОЧКАМ'
          : 'СОЗДАТЬ ПО ТОЧКАМ';
    }
    if (els.movementTestHelp) {
      els.movementTestHelp.textContent = active
        ? 'Замер идёт. Маршрут нельзя менять до финиша.'
        : currentRoute.help;
    }
    if (els.movementTestDistance) {
      els.movementTestDistance.textContent = formatMapDistance(distanceMeters);
    }

    document.querySelectorAll('[data-movement-mode]').forEach(card => {
      const mode = card.dataset.movementMode;
      const result = card.querySelector(`[data-movement-result="${mode}"]`);
      const action = card.querySelector(`[data-movement-action="${mode}"]`);
      const average = movementModeAverage(mode, currentRoute.key);

      if (result) {
        result.textContent = average
          ? `Среднее: ${average.speedKmh.toFixed(2)} км/ч · ${formatMovementElapsed(average.realSeconds)} · замеров ${average.count}`
          : 'Нет замеров';
      }
      if (action) {
        const isThisActive = active && active.mode === mode;
        action.textContent = isThisActive ? 'ФИНИШ' : 'СТАРТ';
        action.classList.toggle('danger', Boolean(isThisActive));
        action.disabled = Boolean(active && !isThisActive) || (!active && currentRoute.points.length < 2);
      }
    });

    if (els.movementTestStatus) {
      if (active) {
        const count = route.points?.length || 0;
        els.movementTestStatus.textContent =
          `${MOVEMENT_TEST_MODES[active.mode]}: замер идёт. Пройдите точки 1–${count} по порядку и в точке ${count} нажмите «ФИНИШ».`;
      } else if (currentRoute.points.length < 2) {
        els.movementTestStatus.textContent =
          'Сначала создайте тестовый маршрут минимум из двух точек.';
      } else {
        els.movementTestStatus.textContent =
          `Маршрут готов: ${currentRoute.points.length} точек · ${formatMapDistance(distanceMeters)}. Начните замер в точке 1.`;
      }
    }
  }

  function updateMovementLiveTimers() {
    const active = loadActiveMovementTest();
    const route = getMovementTestRoute();
    document.querySelectorAll('[data-movement-live]').forEach(node => {
      const mode = node.dataset.movementLive;
      if (active && active.mode === mode) {
        node.textContent = formatMovementElapsed(
          Math.max(0, (Date.now() - Number(active.startedAtMs)) / 1000)
        );
      } else {
        const runs = movementModeRuns(mode, route.key);
        const latest = runs.length ? runs[runs.length - 1] : null;
        node.textContent = latest
          ? formatMovementElapsed(Number(latest.realSeconds) || 0)
          : '00:00';
      }
    });
  }

  function startMovementTest(mode) {
    if (!MOVEMENT_TEST_MODES[mode]) return;
    updateNow();
    const route = getMovementTestRoute();
    const active = loadActiveMovementTest();
    if (active && active.mode !== mode) return;

    if (!active) {
      if (route.points.length < 2) {
        if (els.testMessage) els.testMessage.textContent =
          'Сначала создайте маршрут минимум из двух точек.';
        return;
      }
      const distanceMeters = movementTestDistanceMeters();
      saveActiveMovementTest({
        mode,
        routeKey: route.key,
        routeLabel: route.label,
        routeSnapshot: movementRouteSnapshot(route),
        startedAtMs: Date.now(),
        startAbsoluteGameSeconds: Math.round(absoluteGameSeconds),
        startDay: gameDay,
        startTime: formatClock(gameSeconds),
        distanceMeters
      });
      updateMovementTestUi();
      updateMovementLiveTimers();
      if (els.testMessage) els.testMessage.textContent =
        `${MOVEMENT_TEST_MODES[mode]}: старт записан в точке 1. Финиш — точка ${route.points.length}.`;
      return;
    }

    finishMovementTest(mode);
  }

  function finishMovementTest(mode) {
    const active = loadActiveMovementTest();
    if (!active || active.mode !== mode) return;

    const route = active.routeSnapshot?.points?.length >= 2
      ? active.routeSnapshot
      : movementRouteSnapshot(getMovementTestRoute());
    const routeKey = active.routeKey || route.key;

    updateNow();
    const finishedAtMs = Date.now();
    const realSeconds = Math.max(
      0.1,
      (finishedAtMs - Number(active.startedAtMs)) / 1000
    );
    const endAbsoluteGameSeconds = Math.round(absoluteGameSeconds);
    const zoneSeconds = Math.max(
      0,
      endAbsoluteGameSeconds - Number(active.startAbsoluteGameSeconds)
    );
    const distanceMeters = Number(active.distanceMeters) > 0
      ? Number(active.distanceMeters)
      : plannerPathMeters(route.points);
    const speedKmh = (distanceMeters / 1000) / (realSeconds / 3600);

    const data = loadMovementTests();
    if (!data[routeKey] || typeof data[routeKey] !== 'object' || Array.isArray(data[routeKey])) {
      data[routeKey] = {};
    }
    if (!Array.isArray(data[routeKey][mode])) data[routeKey][mode] = [];
    data[routeKey][mode].push({
      routeKey,
      routeLabel: route.label || 'Свой тестовый маршрут',
      routePoints: route.points.map(point => ({ x: point.x, y: point.y })),
      mode,
      modeLabel: MOVEMENT_TEST_MODES[mode],
      startedAtMs: Number(active.startedAtMs),
      finishedAtMs,
      realSeconds: Math.round(realSeconds * 10) / 10,
      zoneSeconds,
      distanceMeters: Math.round(distanceMeters),
      speedKmh: Math.round(speedKmh * 100) / 100,
      startDay: active.startDay,
      startTime: active.startTime,
      endDay: gameDay,
      endTime: formatClock(gameSeconds),
      capturedAt: new Date().toISOString()
    });
    data[routeKey][mode] = data[routeKey][mode].slice(-20);
    saveMovementTests(data);
    saveActiveMovementTest(null);
    updateMovementTestUi();
    updateMovementLiveTimers();

    if (els.testMessage) els.testMessage.textContent =
      `${MOVEMENT_TEST_MODES[mode]} · свой маршрут: ${formatMovementElapsed(realSeconds)}, ${speedKmh.toFixed(2)} км/ч.`;
  }

  function updateMapInfo() {
    updateMapZoneTime();
    const movementMode = mapSelectedRouteKey === MAP_ROUTE_MODE_MOVEMENT_TEST;
    if (els.mapDistance) {
      els.mapDistance.textContent = movementMode
        ? formatMapDistance(movementTestDistanceMeters())
        : formatMapDistance(mapRouteMeters());
    }
    if (els.mapPointCount) {
      els.mapPointCount.textContent = String(
        movementMode ? movementTestCustomPoints.length : mapMeasurePoints.length
      );
    }
    if (els.mapMeasureBtn) {
      els.mapMeasureBtn.hidden = movementMode;
      els.mapMeasureBtn.classList.toggle('active', mapMeasureMode);
      els.mapMeasureBtn.textContent = mapMeasureMode ? 'ИЗМЕРЕНИЕ: ВКЛ' : 'ИЗМЕРИТЬ';
    }
    if (els.mapMeasureHint) {
      if (movementMode) {
        els.mapMeasureHint.textContent = loadActiveMovementTest()
          ? 'Идёт замер скорости. Маршрут заблокирован до финиша.'
          : movementTestCustomPoints.length >= 2
            ? `Тестовый маршрут: ${movementTestCustomPoints.length} точек · ${formatMapDistance(movementTestDistanceMeters())}. Нажмите карту, чтобы добавить следующую точку.`
            : 'Нажимайте на карту, чтобы поставить минимум две точки. Перетаскивание двигает карту.';
      } else if (mapMeasureMode) {
        els.mapMeasureHint.textContent =
          'Нажимайте на карту для добавления точек измерения. Перетаскивание двигает карту.';
      } else if (mapRoadPlannerRoutePoints.length >= 2) {
        els.mapMeasureHint.textContent =
          `Маршрут по местоположениям: ${formatMapDistance(mapRoadPlannerMeters)} · точек ${mapRoadPlannerSequence.length}.`;
      } else if (els.mapRoadPlanner && els.mapRoadPlanner.open) {
        els.mapMeasureHint.textContent = mapRoadPlannerSequence.length
          ? `Выбрано точек: ${mapRoadPlannerSequence.length}. Нажмите следующую точку местоположения на карте.`
          : 'Нажмите первую точку местоположения на карте. Затем выбирайте следующие по порядку.';
      } else if (mapMeasurePoints.length >= 2) {
        els.mapMeasureHint.textContent = `Измерение: ${formatMapDistance(mapRouteMeters())}.`;
      } else {
        els.mapMeasureHint.textContent = 'Увеличение: два пальца, кнопки +/− или колёсико.';
      }
    }
  }

  function syncMovementTestMapChrome() {
    const active = mapSelectedRouteKey === MAP_ROUTE_MODE_MOVEMENT_TEST;
    if (els.mapDialog) els.mapDialog.classList.toggle('movement-test-editing', active);
    if (els.mapRouteStartWrap && active) els.mapRouteStartWrap.hidden = true;
    if (els.mapMovementTestDoneBtn) {
      els.mapMovementTestDoneBtn.hidden = !active;
      els.mapMovementTestDoneBtn.disabled = false;
    }
    if (els.mapPresetRouteLabel && active) {
      els.mapPresetRouteLabel.hidden = false;
      els.mapPresetRouteLabel.textContent = movementTestCustomPoints.length
        ? `ТЕСТОВЫЙ МАРШРУТ · ${movementTestCustomPoints.length} точек · ${formatMapDistance(movementTestDistanceMeters())}`
        : 'ТЕСТОВЫЙ МАРШРУТ · поставьте точки на карте';
    }
    updateMapInfo();
  }

  function addMovementTestPoint(clientX, clientY) {
    if (loadActiveMovementTest()) return;
    const point = clientToMapPoint(clientX, clientY);
    if (!point) return;
    movementTestCustomPoints.push(point);
    persistMovementTestRoute();
    updateMovementTestScreenGeometry();
    updateMovementTestUi();
    syncMovementTestMapChrome();
    updateMapFullscreenUI();
  }

  function undoMovementTestPoint() {
    if (loadActiveMovementTest() || !movementTestCustomPoints.length) return;
    movementTestCustomPoints.pop();
    persistMovementTestRoute();
    updateMovementTestScreenGeometry();
    updateMovementTestUi();
    syncMovementTestMapChrome();
    updateMapFullscreenUI();
  }

  function clearMovementTestRoute() {
    if (loadActiveMovementTest()) return;
    movementTestCustomPoints = [];
    persistMovementTestRoute();
    updateMovementTestScreenGeometry();
    updateMovementTestUi();
    syncMovementTestMapChrome();
    updateMapFullscreenUI();
  }

  function updateMovementTestScreenGeometry() {
    if (!els.mapMovementTestLayer || !els.mapMovementTestLine ||
        !els.mapMovementTestStart || !els.mapMovementTestEnd) return;

    const route = getMovementTestRoute();
    const points = route.points || [];
    const show = mapMovementTestVisible && points.length > 0;
    els.mapMovementTestLayer.style.display = show ? '' : 'none';
    els.mapMovementTestLayer
      .querySelectorAll('.map-movement-test-waypoint')
      .forEach(node => node.remove());

    if (!show) {
      els.mapMovementTestLine.setAttribute('points', '');
      return;
    }

    const screenPoints = points.map(routePointToScreen);
    els.mapMovementTestLine.setAttribute(
      'points',
      screenPoints.map(point => `${point.x},${point.y}`).join(' ')
    );

    const start = screenPoints[0];
    els.mapMovementTestStart.style.display = '';
    els.mapMovementTestStart.setAttribute('cx', start.x);
    els.mapMovementTestStart.setAttribute('cy', start.y);

    const hasEnd = screenPoints.length >= 2;
    const end = screenPoints[screenPoints.length - 1];
    els.mapMovementTestEnd.style.display = hasEnd ? '' : 'none';
    if (hasEnd) {
      els.mapMovementTestEnd.setAttribute('cx', end.x);
      els.mapMovementTestEnd.setAttribute('cy', end.y);
    }

    if (els.mapMovementTestStartLabel) {
      els.mapMovementTestStartLabel.setAttribute('x', start.x + 10);
      els.mapMovementTestStartLabel.setAttribute('y', start.y - 10);
      els.mapMovementTestStartLabel.textContent = '1 · СТАРТ';
    }
    if (els.mapMovementTestEndLabel) {
      els.mapMovementTestEndLabel.style.display = hasEnd ? '' : 'none';
      if (hasEnd) {
        els.mapMovementTestEndLabel.setAttribute('x', end.x + 10);
        els.mapMovementTestEndLabel.setAttribute('y', end.y - 10);
        els.mapMovementTestEndLabel.textContent = `${screenPoints.length} · ФИНИШ`;
      }
    }

    for (let index = 1; index < screenPoints.length - 1; index++) {
      const point = screenPoints[index];
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('class', 'map-movement-test-point waypoint map-movement-test-waypoint');
      circle.setAttribute('r', '5');
      circle.setAttribute('cx', point.x);
      circle.setAttribute('cy', point.y);
      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('class', 'map-movement-test-label map-movement-test-waypoint');
      label.setAttribute('x', point.x + 9);
      label.setAttribute('y', point.y - 8);
      label.textContent = String(index + 1);
      els.mapMovementTestLayer.appendChild(circle);
      els.mapMovementTestLayer.appendChild(label);
    }

    if (els.mapMovementTestDistanceLabel) {
      const middle = screenPoints[Math.floor((screenPoints.length - 1) / 2)];
      els.mapMovementTestDistanceLabel.setAttribute('x', middle.x);
      els.mapMovementTestDistanceLabel.setAttribute('y', middle.y - 16);
      els.mapMovementTestDistanceLabel.textContent = hasEnd
        ? formatMapDistance(movementTestDistanceMeters())
        : '';
    }
  }

  function openMovementTestRouteEditor() {
    if (loadActiveMovementTest()) return;
    movementTestReturnToDialog = true;
    mapSelectedRouteKey = MAP_ROUTE_MODE_MOVEMENT_TEST;
    mapMovementTestVisible = true;
    mapMeasureMode = false;
    localStorage.setItem(MAP_PRESET_ROUTE_SELECTED_KEY, mapSelectedRouteKey);
    ensureRoadPlannerLandscapeView();

    if (els.testDialog?.open) {
      if (typeof els.testDialog.close === 'function') els.testDialog.close();
      else els.testDialog.removeAttribute('open');
    }

    updateMapZoneTime();
    updateMapFullscreenUI();
    updatePresetRouteUI();

    if (typeof els.mapDialog.showModal === 'function') {
      if (!els.mapDialog.open) els.mapDialog.showModal();
    } else {
      els.mapDialog.setAttribute('open', '');
    }

    window.requestAnimationFrame(() => {
      if (movementTestCustomPoints.length >= 2) {
        focusJourneyPoints(movementTestCustomPoints, 600);
      } else {
        fitZoneMap();
      }
      syncMovementTestMapChrome();
      updateMovementTestScreenGeometry();
    });
  }

  function returnToMovementTest() {
    if (els.mapDialog) els.mapDialog.classList.remove('movement-test-editing');
    if (els.mapDialog?.open) {
      if (typeof els.mapDialog.close === 'function') els.mapDialog.close();
      else els.mapDialog.removeAttribute('open');
    }
    movementTestReturnToDialog = false;
    updateMovementTestUi();
    updateMovementLiveTimers();
    window.requestAnimationFrame(() => {
      if (typeof els.testDialog.showModal === 'function') {
        if (!els.testDialog.open) els.testDialog.showModal();
      } else {
        els.testDialog.setAttribute('open', '');
      }
    });
  }

  if (els.editMovementTestRouteBtn) {
    els.editMovementTestRouteBtn.addEventListener('click', openMovementTestRouteEditor);
  }

  persistMovementTestRoute();
  updateMovementTestUi();
'''

marker = "\n  window.setInterval(() => {\n    updateMovementLiveTimers();\n  }, 500);"
app = replace_once(app, marker, override + marker, "movement override insertion")

app = app.replace("zone-clock-test-v115.csv", "zone-clock-test-v116.csv")
app_path.write_text(app, encoding="utf-8")


# ---------- index.html ----------
index_path = Path("index.html")
html = index_path.read_text(encoding="utf-8")

html = replace_once(
    html,
    '<button class="btn" id="mapClearBtn" type="button">СБРОС</button>\n',
    '<button class="btn" id="mapClearBtn" type="button">СБРОС</button>\n'
    '<button class="btn primary" hidden id="mapMovementTestDoneBtn" type="button">В ТЕСТ</button>\n',
    "map done button",
)
html = html.replace(
    '<option value="movement_test">Тестовый маршрут</option>',
    '<option value="movement_test">Тестовый маршрут по точкам</option>',
)

movement_section = '''<section class="movement-test-block">
<div class="movement-test-head">
<div>
<div class="daylight-test-title">ТЕСТ СКОРОСТИ ПЕРЕДВИЖЕНИЯ</div>
<div class="movement-test-route" id="movementTestRouteName">СВОЙ ТЕСТОВЫЙ МАРШРУТ</div>
</div>
<button class="btn movement-map-btn" id="editMovementTestRouteBtn" type="button">СОЗДАТЬ ПО ТОЧКАМ</button>
</div>
<div class="movement-test-distance-row">
<span>ТОЧЕК <strong id="movementTestPointCount">0</strong></span>
<span>РАССТОЯНИЕ <strong id="movementTestDistance">—</strong></span>
</div>
<div class="movement-test-help" id="movementTestHelp">
Нажмите «СОЗДАТЬ ПО ТОЧКАМ» и поставьте на общей карте минимум две точки маршрута. Можно добавить промежуточные точки.
</div>
<div class="movement-test-modes">
<div class="movement-test-card" data-movement-mode="slow">
<div class="movement-test-mode-title">МЕДЛЕННЫЙ ШАГ</div>
<div class="movement-live-time" data-movement-live="slow">00:00</div>
<div class="movement-test-result" data-movement-result="slow">Нет замеров</div>
<button class="btn primary movement-test-action" data-movement-action="slow" type="button">СТАРТ</button>
</div>
<div class="movement-test-card" data-movement-mode="fast">
<div class="movement-test-mode-title">БЫСТРЫЙ ШАГ</div>
<div class="movement-live-time" data-movement-live="fast">00:00</div>
<div class="movement-test-result" data-movement-result="fast">Нет замеров</div>
<button class="btn primary movement-test-action" data-movement-action="fast" type="button">СТАРТ</button>
</div>
<div class="movement-test-card" data-movement-mode="run">
<div class="movement-test-mode-title">БЕГ</div>
<div class="movement-live-time" data-movement-live="run">00:00</div>
<div class="movement-test-result" data-movement-result="run">Нет замеров</div>
<button class="btn primary movement-test-action" data-movement-action="run" type="button">СТАРТ</button>
</div>
</div>
<div class="movement-test-status" id="movementTestStatus">Сначала создайте тестовый маршрут минимум из двух точек.</div>
</section>'''

html = sub_once(
    html,
    r'<section class="movement-test-block">.*?</section>',
    movement_section,
    "movement test section",
)
html = html.replace('>МОСТ</text>', '>СТАРТ</text>')
html = html.replace('>SWYD-EAST</text>', '>ФИНИШ</text>')
html = replace_once(
    html,
    'ZONE CLOCK <strong>v1.15</strong>',
    'ZONE CLOCK <strong>v1.16</strong>',
    "visible version",
)
index_path.write_text(html, encoding="utf-8")


# ---------- style.css ----------
style_path = Path("style.css")
css = style_path.read_text(encoding="utf-8")
css += r'''

/* PWA v116 — пользовательский тестовый маршрут по точкам */
.map-dialog.movement-test-editing #mapRouteStartWrap {
  display: none !important;
}

.map-screen-overlay .map-movement-test-point.waypoint {
  fill: #d9ffd9;
  stroke: #25df4c;
  stroke-width: 2px;
}

.map-screen-overlay .map-movement-test-waypoint {
  pointer-events: none;
}

.movement-test-distance-row {
  align-items: center;
}

.movement-test-distance-row > span {
  display: inline-flex;
  align-items: baseline;
  gap: 7px;
}

.movement-test-distance-row strong {
  color: var(--accent-2);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-weight: 900;
}
'''
style_path.write_text(css, encoding="utf-8")


# ---------- service-worker.js ----------
sw_path = Path("service-worker.js")
sw = sw_path.read_text(encoding="utf-8")
if "stalker2-zone-clock-app-v115" not in sw or "stalker2-zone-clock-map-v115" not in sw:
    raise SystemExit("v115 service worker cache names not found")
sw = sw.replace("stalker2-zone-clock-app-v115", "stalker2-zone-clock-app-v116")
sw = sw.replace("stalker2-zone-clock-map-v115", "stalker2-zone-clock-map-v116")
sw_path.write_text(sw, encoding="utf-8")


# ---------- README.txt ----------
readme_path = Path("README.txt")
readme = readme_path.read_text(encoding="utf-8").rstrip()
readme += """


Версия 116:
- из теста скорости убран выбор двух фиксированных контрольных маршрутов;
- тестовый маршрут теперь создаётся пользователем по точкам прямо на общей карте Zone Clock;
- можно поставить две или больше точек в нужной последовательности;
- длина считается как сумма всех отрезков между выбранными точками;
- «− ТОЧКА» удаляет последнюю точку, «СБРОС» очищает тестовый маршрут;
- кнопка «В ТЕСТ» возвращает с карты к замеру скорости;
- во время активного замера редактирование маршрута блокируется;
- результаты сохраняются отдельно для каждой геометрии пользовательского маршрута;
- версия приложения обновлена до ZONE CLOCK v1.16;
- service worker обновлён до v116;
- CSV экспортируется как zone-clock-test-v116.csv.
"""
readme_path.write_text(readme, encoding="utf-8")

print("v116 patch applied")
