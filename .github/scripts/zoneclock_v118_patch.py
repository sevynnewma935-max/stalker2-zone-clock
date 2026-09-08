from pathlib import Path
import re


def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected 1 match, got {count}")
    return text.replace(old, new, 1)


# ---------------- index.html ----------------
path = Path('index.html')
html = path.read_text(encoding='utf-8')

html = html.replace('<span class="sleep-hours">+8 Ч</span>', '<span class="sleep-hours">+7 Ч</span>')
html = html.replace(
    '<option value="movement_test">Свои маршруты по точкам</option>',
    '<option value="movement_test">Свои маршруты</option>'
)
html = html.replace(
    'Поставьте минимум две точки. Имя, начинающееся с «Тест…», добавит маршрут в раздел тестов скорости.',
    'Поставьте минимум две точки, задайте имя и сохраните маршрут.'
)

record_panel = '''<div class="map-route-record-panel" id="mapRouteRecordPanel">
<div class="map-route-record-stats">
<div><span>ВРЕМЯ</span><strong id="mapRouteRecordTime">00:00</strong></div>
<div><span>РАССТОЯНИЕ</span><strong id="mapRouteRecordDistance">—</strong></div>
</div>
<button class="btn primary wide map-route-record-btn" id="mapRouteRecordBtn" type="button">НАЧАТЬ МАРШРУТ</button>
<div class="map-route-record-status" id="mapRouteRecordStatus">Сначала сохраните маршрут.</div>
<div class="map-route-record-history" id="mapRouteRecordHistory"></div>
</div>
'''
html = replace_once(
    html,
    '<div class="map-saved-route-message" id="mapSavedRouteMessage">Поставьте минимум две точки, задайте имя и сохраните маршрут.</div>\n</div>\n<button class="btn primary map-journey-btn" id="mapJourneyBtn" type="button">',
    '<div class="map-saved-route-message" id="mapSavedRouteMessage">Поставьте минимум две точки, задайте имя и сохраните маршрут.</div>\n' + record_panel + '</div>\n<button class="btn primary map-journey-btn" id="mapJourneyBtn" type="button">',
    'route record panel insertion'
)

# Remove the old speed-test route block completely. Time/daylight calibration stays.
html, n = re.subn(
    r'<section class="movement-test-block">.*?</section>\n',
    '',
    html,
    count=1,
    flags=re.S
)
if n != 1:
    raise SystemExit(f'movement test block removal: expected 1, got {n}')

html = html.replace('ZONE CLOCK <strong>v1.17</strong>', 'ZONE CLOCK <strong>v1.18</strong>')
path.write_text(html, encoding='utf-8')


# ---------------- app.js ----------------
path = Path('app.js')
app = path.read_text(encoding='utf-8')

app = app.replace('const SLEEP_GAME_SECONDS = 8 * 3600;', 'const SLEEP_GAME_SECONDS = 7 * 3600;')

app = replace_once(
    app,
    "  const SAVED_ROUTE_MIGRATION_KEY = 'stalker2-zone-clock-saved-route-migration-v117';\n",
    "  const SAVED_ROUTE_MIGRATION_KEY = 'stalker2-zone-clock-saved-route-migration-v117';\n"
    "  const ROUTE_RECORD_STORAGE_KEY = 'stalker2-zone-clock-route-records-v1';\n"
    "  const ROUTE_RECORD_ACTIVE_KEY = 'stalker2-zone-clock-route-record-active-v1';\n",
    'route record constants'
)

app = replace_once(
    app,
    "    mapSavedRouteMessage: $('mapSavedRouteMessage'),\n",
    "    mapSavedRouteMessage: $('mapSavedRouteMessage'),\n"
    "    mapRouteRecordPanel: $('mapRouteRecordPanel'),\n"
    "    mapRouteRecordTime: $('mapRouteRecordTime'),\n"
    "    mapRouteRecordDistance: $('mapRouteRecordDistance'),\n"
    "    mapRouteRecordBtn: $('mapRouteRecordBtn'),\n"
    "    mapRouteRecordStatus: $('mapRouteRecordStatus'),\n"
    "    mapRouteRecordHistory: $('mapRouteRecordHistory'),\n",
    'route record refs'
)

# All named routes are ordinary routes in v118, including those saved as "test" in v117.
app = app.replace("kind: isTestSavedRouteName(name) ? 'test' : 'route',", "kind: 'route',")
app = app.replace("kind: 'test',", "kind: 'route',")
app = app.replace(
    "    addGroup('СОХРАНЁННЫЕ', savedUserRoutes.filter(route => route.kind !== 'test'));\n    addGroup('ТЕСТОВЫЕ', savedUserRoutes.filter(route => route.kind === 'test'));",
    "    addGroup('СОХРАНЁННЫЕ', savedUserRoutes);"
)
app = app.replace(
    "          'Поставьте минимум две точки. Имя, начинающееся с «Тест…», добавит маршрут в раздел тестов скорости.';",
    "          'Поставьте минимум две точки, задайте имя и сохраните маршрут.';"
)
app = app.replace(
    "          savedRouteById(selectedSavedRouteId)?.kind === 'test'\n            ? 'Сохранён как тестовый маршрут и доступен в разделе тестов скорости.'\n            : 'Маршрут сохранён.';",
    "          'Маршрут сохранён.';"
)
app = app.replace(
    "      route.kind === 'test'\n        ? `«${name}» сохранён и добавлен в ТЕСТОВЫЕ МАРШРУТЫ.`\n        : `«${name}» сохранён.`",
    "      `«${name}» сохранён.`"
)

# Keep map point creation away from controls placed over the map (+/- etc.).
app = replace_once(
    app,
    "    els.mapViewport.addEventListener('pointerdown', event => {\n      if (event.pointerType === 'mouse' && event.button !== 0) return;",
    "    els.mapViewport.addEventListener('pointerdown', event => {\n      if (event.target.closest && event.target.closest('button, select, input, label, .map-fullscreen-zoom-controls')) return;\n      if (event.pointerType === 'mouse' && event.button !== 0) return;",
    'map control pointerdown guard'
)
app = replace_once(
    app,
    "    els.mapViewport.addEventListener('pointerup', event => {\n      endMapInteraction();",
    "    els.mapViewport.addEventListener('pointerup', event => {\n      if (event.target.closest && event.target.closest('button, select, input, label, .map-fullscreen-zoom-controls')) {\n        mapActivePointers.delete(event.pointerId);\n        mapPointerState = null;\n        mapPinchState = null;\n        return;\n      }\n      endMapInteraction();",
    'map control pointerup guard'
)

# Don't allow route geometry edits while a route recording is active.
app = app.replace(
    "if (!loadActiveMovementTest()) {\n            addMovementTestPoint(event.clientX, event.clientY);\n          }",
    "if (!loadActiveMovementTest() && !loadActiveRouteRecord()) {\n            addMovementTestPoint(event.clientX, event.clientY);\n          }"
)
app = app.replace(
    "if (mapSelectedRouteKey === MAP_ROUTE_MODE_MOVEMENT_TEST) {\n        undoMovementTestPoint();",
    "if (mapSelectedRouteKey === MAP_ROUTE_MODE_MOVEMENT_TEST) {\n        if (loadActiveRouteRecord()) return;\n        undoMovementTestPoint();"
)
app = app.replace(
    "if (mapSelectedRouteKey === MAP_ROUTE_MODE_MOVEMENT_TEST) {\n        clearMovementTestRoute();",
    "if (mapSelectedRouteKey === MAP_ROUTE_MODE_MOVEMENT_TEST) {\n        if (loadActiveRouteRecord()) return;\n        clearMovementTestRoute();"
)
app = app.replace(
    "if (mapSelectedRouteKey === MAP_ROUTE_MODE_MOVEMENT_TEST && movementTestCustomPoints.length) {\n          clearMovementTestRoute();",
    "if (mapSelectedRouteKey === MAP_ROUTE_MODE_MOVEMENT_TEST && movementTestCustomPoints.length) {\n          if (loadActiveRouteRecord()) return;\n          clearMovementTestRoute();"
)

v118 = r'''
  // PWA v118 — запись обычных маршрутов.
  function loadRouteRecords() {
    try {
      const parsed = JSON.parse(localStorage.getItem(ROUTE_RECORD_STORAGE_KEY) || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  }

  function saveRouteRecords(records) {
    localStorage.setItem(ROUTE_RECORD_STORAGE_KEY, JSON.stringify(records.slice(-200)));
  }

  function loadActiveRouteRecord() {
    try {
      const parsed = JSON.parse(localStorage.getItem(ROUTE_RECORD_ACTIVE_KEY) || 'null');
      if (!parsed || !parsed.routeId || !(Number(parsed.startedAtMs) > 0)) return null;
      return parsed;
    } catch (_) {
      return null;
    }
  }

  function saveActiveRouteRecord(record) {
    if (!record) {
      localStorage.removeItem(ROUTE_RECORD_ACTIVE_KEY);
      return;
    }
    localStorage.setItem(ROUTE_RECORD_ACTIVE_KEY, JSON.stringify(record));
  }

  function routeRecordDistanceMeters(route) {
    const points = cleanSavedRoutePoints(route?.points);
    return points.length >= 2 ? plannerPathMeters(points) : 0;
  }

  function routeRecordElapsedSeconds(active) {
    return active ? Math.max(0, (Date.now() - Number(active.startedAtMs)) / 1000) : 0;
  }

  function routeRecordHistoryText(record) {
    const duration = formatMovementElapsed(Number(record.realSeconds) || 0);
    const distance = formatMapDistance(Number(record.distanceMeters) || 0);
    return `День ${record.startDay} · ${record.startTime} → ${record.endTime} · ${duration} · ${distance}`;
  }

  function renderRouteRecordHistory() {
    if (!els.mapRouteRecordHistory) return;
    const route = savedRouteById(selectedSavedRouteId);
    const records = loadRouteRecords()
      .filter(record => !route || record.routeId === route.id)
      .slice(-8)
      .reverse();

    els.mapRouteRecordHistory.innerHTML = '';
    if (!records.length) {
      const empty = document.createElement('div');
      empty.className = 'map-route-record-history-empty';
      empty.textContent = route ? 'Записей по этому маршруту пока нет.' : 'История маршрутов пока пуста.';
      els.mapRouteRecordHistory.appendChild(empty);
      return;
    }

    records.forEach(record => {
      const row = document.createElement('div');
      row.className = 'map-route-record-history-row';
      const name = document.createElement('strong');
      name.textContent = record.routeName || 'Маршрут';
      const info = document.createElement('span');
      info.textContent = routeRecordHistoryText(record);
      row.append(name, info);
      els.mapRouteRecordHistory.appendChild(row);
    });
  }

  function updateRouteRecordUi() {
    if (!els.mapRouteRecordPanel) return;
    const active = loadActiveRouteRecord();
    const selected = savedRouteById(selectedSavedRouteId);
    const activeSelected = active ? savedRouteById(active.routeId) : null;
    const route = active ? (activeSelected || active) : selected;
    const distanceMeters = active
      ? Number(active.distanceMeters) || 0
      : routeRecordDistanceMeters(route);

    if (els.mapRouteRecordTime) {
      els.mapRouteRecordTime.textContent = active
        ? formatMovementElapsed(routeRecordElapsedSeconds(active))
        : '00:00';
    }
    if (els.mapRouteRecordDistance) {
      els.mapRouteRecordDistance.textContent = distanceMeters > 0
        ? formatMapDistance(distanceMeters)
        : '—';
    }
    if (els.mapRouteRecordBtn) {
      els.mapRouteRecordBtn.textContent = active ? 'ЗАВЕРШИТЬ МАРШРУТ' : 'НАЧАТЬ МАРШРУТ';
      els.mapRouteRecordBtn.classList.toggle('danger', Boolean(active));
      els.mapRouteRecordBtn.disabled = !active && !selected;
    }
    if (els.mapRouteRecordStatus) {
      if (active) {
        els.mapRouteRecordStatus.textContent =
          `Идёт маршрут «${active.routeName}». Время и расстояние записываются.`;
      } else if (selected) {
        els.mapRouteRecordStatus.textContent =
          `Готов к старту: «${selected.name}» · ${formatMapDistance(distanceMeters)}.`;
      } else {
        els.mapRouteRecordStatus.textContent = 'Сначала создайте и сохраните маршрут.';
      }
    }

    const locked = Boolean(active);
    if (els.mapSavedRouteName) els.mapSavedRouteName.disabled = locked;
    if (els.mapSavedRouteNewBtn) els.mapSavedRouteNewBtn.disabled = locked;
    if (els.mapSavedRouteSaveBtn) els.mapSavedRouteSaveBtn.disabled = locked || els.mapSavedRouteSaveBtn.disabled;
    if (els.mapSavedRouteDeleteBtn) els.mapSavedRouteDeleteBtn.disabled = locked || !selected;
    if (els.mapRouteStartSelect) els.mapRouteStartSelect.disabled = locked;
    if (els.mapUndoBtn && mapSelectedRouteKey === MAP_ROUTE_MODE_MOVEMENT_TEST) els.mapUndoBtn.disabled = locked;
    if (els.mapClearBtn && mapSelectedRouteKey === MAP_ROUTE_MODE_MOVEMENT_TEST) els.mapClearBtn.disabled = locked;

    renderRouteRecordHistory();
  }

  function startRouteRecord() {
    const route = savedRouteById(selectedSavedRouteId);
    if (!route || route.points.length < 2) {
      if (els.mapRouteRecordStatus) els.mapRouteRecordStatus.textContent =
        'Сначала сохраните маршрут минимум из двух точек.';
      return;
    }

    updateNow();
    const distanceMeters = routeRecordDistanceMeters(route);
    saveActiveRouteRecord({
      routeId: route.id,
      routeName: route.name,
      points: cleanSavedRoutePoints(route.points),
      distanceMeters,
      startedAtMs: Date.now(),
      startAbsoluteGameSeconds: Math.round(absoluteGameSeconds),
      startDay: gameDay,
      startTime: formatClock(gameSeconds)
    });
    updateRouteRecordUi();
  }

  function finishRouteRecord() {
    const active = loadActiveRouteRecord();
    if (!active) return;

    updateNow();
    const finishedAtMs = Date.now();
    const realSeconds = Math.max(0.1, (finishedAtMs - Number(active.startedAtMs)) / 1000);
    const endAbsoluteGameSeconds = Math.round(absoluteGameSeconds);
    const zoneSeconds = Math.max(0, endAbsoluteGameSeconds - Number(active.startAbsoluteGameSeconds));

    const records = loadRouteRecords();
    records.push({
      routeId: active.routeId,
      routeName: active.routeName,
      distanceMeters: Math.round(Number(active.distanceMeters) || 0),
      realSeconds: Math.round(realSeconds * 10) / 10,
      zoneSeconds,
      startedAtMs: Number(active.startedAtMs),
      finishedAtMs,
      startDay: active.startDay,
      startTime: active.startTime,
      endDay: gameDay,
      endTime: formatClock(gameSeconds),
      capturedAt: new Date().toISOString()
    });
    saveRouteRecords(records);
    saveActiveRouteRecord(null);
    updateRouteRecordUi();

    if (els.mapRouteRecordStatus) {
      els.mapRouteRecordStatus.textContent =
        `Маршрут «${active.routeName}» записан: ${formatMovementElapsed(realSeconds)} · ${formatMapDistance(Number(active.distanceMeters) || 0)}.`;
    }
  }

  function toggleRouteRecord() {
    if (loadActiveRouteRecord()) finishRouteRecord();
    else startRouteRecord();
  }

  if (els.mapRouteRecordBtn) {
    els.mapRouteRecordBtn.addEventListener('click', toggleRouteRecord);
  }

  // Refresh route recorder whenever the ordinary route editor changes.
  if (els.mapSavedRouteName) {
    els.mapSavedRouteName.addEventListener('input', () => window.setTimeout(updateRouteRecordUi, 0));
  }
  if (els.mapRouteStartSelect) {
    els.mapRouteStartSelect.addEventListener('change', () => window.setTimeout(updateRouteRecordUi, 0));
  }
  if (els.mapSavedRouteSaveBtn) {
    els.mapSavedRouteSaveBtn.addEventListener('click', () => window.setTimeout(updateRouteRecordUi, 0));
  }
  if (els.mapSavedRouteNewBtn) {
    els.mapSavedRouteNewBtn.addEventListener('click', () => window.setTimeout(updateRouteRecordUi, 0));
  }
  if (els.mapSavedRouteDeleteBtn) {
    els.mapSavedRouteDeleteBtn.addEventListener('click', () => window.setTimeout(updateRouteRecordUi, 0));
  }

  window.setInterval(updateRouteRecordUi, 500);
'''

marker = '  migrateV116TestRoute();\n'
if marker not in app:
    raise SystemExit('v118 insertion marker not found')
app = app.replace(marker, v118 + '\n' + marker, 1)

# Add route recorder refresh at end of the named-route UI refresh function.
needle = "    renderSavedRouteMapOptions();\n\n    if (els.mapRouteStartWrap)"
app = replace_once(
    app,
    needle,
    "    renderSavedRouteMapOptions();\n    if (typeof updateRouteRecordUi === 'function') updateRouteRecordUi();\n\n    if (els.mapRouteStartWrap)",
    'route recorder refresh hook'
)

path.write_text(app, encoding='utf-8')


# ---------------- style.css ----------------
path = Path('style.css')
css = path.read_text(encoding='utf-8')
css += r'''

/* PWA v118 — запись обычных маршрутов */
.map-route-record-panel {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid rgba(171, 194, 109, .24);
}
.map-route-record-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 8px;
}
.map-route-record-stats > div {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 8px 10px;
  border: 1px solid rgba(171, 194, 109, .20);
  background: rgba(0, 0, 0, .16);
}
.map-route-record-stats span {
  font-size: 10px;
  letter-spacing: .08em;
  opacity: .68;
}
.map-route-record-stats strong {
  font-size: 18px;
}
.map-route-record-status {
  margin-top: 7px;
  font-size: 12px;
  line-height: 1.35;
  opacity: .82;
}
.map-route-record-history {
  display: grid;
  gap: 6px;
  margin-top: 9px;
  max-height: 160px;
  overflow: auto;
}
.map-route-record-history-row {
  display: grid;
  gap: 2px;
  padding: 7px 8px;
  border-left: 2px solid rgba(171, 194, 109, .45);
  background: rgba(0, 0, 0, .13);
}
.map-route-record-history-row strong { font-size: 12px; }
.map-route-record-history-row span,
.map-route-record-history-empty {
  font-size: 11px;
  opacity: .72;
}
'''
path.write_text(css, encoding='utf-8')


# ---------------- service-worker.js ----------------
path = Path('service-worker.js')
sw = path.read_text(encoding='utf-8')
sw = sw.replace('stalker2-zone-clock-app-v117', 'stalker2-zone-clock-app-v118')
sw = sw.replace('stalker2-zone-clock-map-v117', 'stalker2-zone-clock-map-v118')
path.write_text(sw, encoding='utf-8')


# ---------------- README.txt ----------------
path = Path('README.txt')
readme = path.read_text(encoding='utf-8')
readme += '''\n\nВерсия 118:\n- тестовые маршруты заменены обычными сохраняемыми маршрутами по точкам;\n- для сохранённого маршрута можно начать и завершить запись прохождения;\n- сохраняются время прохождения, расстояние, время старта и финиша;\n- добавлена история прохождений маршрута;\n- нажатия на кнопки +/− поверх карты больше не ставят точки маршрута;\n- сон изменён с 8 на 7 игровых часов;\n- версия офлайн-кэша повышена до v118.\n'''
path.write_text(readme, encoding='utf-8')
