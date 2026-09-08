from pathlib import Path


def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected 1 match, got {count}")
    return text.replace(old, new, 1)


# ---------- index.html ----------
path = Path('index.html')
html = path.read_text(encoding='utf-8')

html = replace_once(
    html,
    '<option value="movement_test">Тестовый маршрут по точкам</option>',
    '<option value="movement_test">Свои маршруты по точкам</option>',
    'map route option'
)

route_editor = '''<div class="map-saved-route-editor" hidden id="mapSavedRouteEditor">
<label class="map-saved-route-name-field">
<span>ИМЯ МАРШРУТА</span>
<input autocomplete="off" id="mapSavedRouteName" maxlength="60" placeholder="Например: До Янова или Тестовый 1" type="text"/>
</label>
<div class="map-saved-route-actions">
<button class="btn" id="mapSavedRouteNewBtn" type="button">НОВЫЙ</button>
<button class="btn primary" id="mapSavedRouteSaveBtn" type="button">СОХРАНИТЬ</button>
<button class="btn" id="mapSavedRouteDeleteBtn" type="button">УДАЛИТЬ</button>
</div>
<div class="map-saved-route-message" id="mapSavedRouteMessage">Поставьте минимум две точки. Имя, начинающееся с «Тест…», добавит маршрут в раздел тестов скорости.</div>
</div>
'''
html = replace_once(
    html,
    '</label>\n<button class="btn primary map-journey-btn" id="mapJourneyBtn" type="button">',
    '</label>\n' + route_editor + '<button class="btn primary map-journey-btn" id="mapJourneyBtn" type="button">',
    'map saved route editor insertion'
)

test_picker = '''<label class="movement-test-route-picker">
<span>ТЕСТОВЫЕ МАРШРУТЫ</span>
<select id="movementTestSavedRouteSelect">
<option value="">Нет сохранённых тестовых маршрутов</option>
</select>
</label>
'''
html = replace_once(
    html,
    '</div>\n<div class="movement-test-distance-row">\n<span>ТОЧЕК <strong id="movementTestPointCount">0</strong></span>',
    '</div>\n' + test_picker + '<div class="movement-test-distance-row">\n<span>ТОЧЕК <strong id="movementTestPointCount">0</strong></span>',
    'movement test route picker insertion'
)

html = html.replace('ZONE CLOCK <strong>v1.16</strong>', 'ZONE CLOCK <strong>v1.17</strong>')
path.write_text(html, encoding='utf-8')


# ---------- app.js ----------
path = Path('app.js')
app = path.read_text(encoding='utf-8')

app = replace_once(
    app,
    "  const MOVEMENT_TEST_CUSTOM_ROUTE_KEY = 'stalker2-zone-clock-movement-test-custom-route-v1';\n",
    "  const MOVEMENT_TEST_CUSTOM_ROUTE_KEY = 'stalker2-zone-clock-movement-test-custom-route-v1';\n"
    "  const SAVED_ROUTE_STORAGE_KEY = 'stalker2-zone-clock-saved-routes-v1';\n"
    "  const SAVED_ROUTE_MAP_SELECTED_KEY = 'stalker2-zone-clock-saved-route-selected-v1';\n"
    "  const MOVEMENT_TEST_SAVED_ROUTE_KEY = 'stalker2-zone-clock-movement-test-saved-route-v1';\n"
    "  const SAVED_ROUTE_MIGRATION_KEY = 'stalker2-zone-clock-saved-route-migration-v117';\n",
    'saved route storage constants'
)

app = replace_once(
    app,
    "    mapRouteStartSelect: $('mapRouteStartSelect'),\n",
    "    mapRouteStartSelect: $('mapRouteStartSelect'),\n"
    "    mapSavedRouteEditor: $('mapSavedRouteEditor'),\n"
    "    mapSavedRouteName: $('mapSavedRouteName'),\n"
    "    mapSavedRouteNewBtn: $('mapSavedRouteNewBtn'),\n"
    "    mapSavedRouteSaveBtn: $('mapSavedRouteSaveBtn'),\n"
    "    mapSavedRouteDeleteBtn: $('mapSavedRouteDeleteBtn'),\n"
    "    mapSavedRouteMessage: $('mapSavedRouteMessage'),\n",
    'saved route map refs'
)

app = replace_once(
    app,
    "    movementTestPointCount: $('movementTestPointCount'),\n",
    "    movementTestPointCount: $('movementTestPointCount'),\n"
    "    movementTestSavedRouteSelect: $('movementTestSavedRouteSelect'),\n",
    'movement test saved route ref'
)

app = app.replace(
    "els.mapRouteStartLabel.textContent = isMovementTestMode ? 'ТЕСТОВЫЙ МАРШРУТ' : 'НАЧАЛО МАРШРУТА';",
    "els.mapRouteStartLabel.textContent = isMovementTestMode ? 'СОХРАНЁННЫЙ МАРШРУТ' : 'НАЧАЛО МАРШРУТА';"
)
app = app.replace(
    "els.mapPresetRouteLabel.textContent = `ТЕСТОВЫЙ МАРШРУТ · ${testRoute.shortLabel}`;",
    "els.mapPresetRouteLabel.textContent = `СВОЙ МАРШРУТ · ${testRoute.shortLabel}`;"
)

anchor = '''  persistMovementTestRoute();
  updateMovementTestUi();

  window.setInterval(() => {
    updateMovementLiveTimers();
  }, 500);
'''

v117 = r'''  // PWA v117 — библиотека именованных пользовательских маршрутов.
  function normalizeSavedRouteName(value) {
    return String(value || '').trim().replace(/\s+/g, ' ').slice(0, 60);
  }

  function isTestSavedRouteName(value) {
    const normalized = normalizeSavedRouteName(value).toLocaleLowerCase('ru-RU');
    return normalized.startsWith('тест') || normalized.startsWith('test');
  }

  function cleanSavedRoutePoints(points) {
    if (!Array.isArray(points)) return [];
    return points
      .slice(0, 200)
      .map(point => ({ x: Number(point?.x), y: Number(point?.y) }))
      .filter(point =>
        Number.isFinite(point.x) && Number.isFinite(point.y) &&
        point.x >= 0 && point.x <= MAP_IMAGE_SIZE &&
        point.y >= 0 && point.y <= MAP_IMAGE_SIZE
      );
  }

  function loadSavedUserRoutes() {
    try {
      const parsed = JSON.parse(localStorage.getItem(SAVED_ROUTE_STORAGE_KEY) || '[]');
      if (!Array.isArray(parsed)) return [];
      return parsed
        .map(item => {
          const name = normalizeSavedRouteName(item?.name);
          const points = cleanSavedRoutePoints(item?.points);
          if (!item?.id || !name || points.length < 2) return null;
          return {
            id: String(item.id).slice(0, 80),
            name,
            kind: isTestSavedRouteName(name) ? 'test' : 'route',
            points,
            createdAt: Number(item.createdAt) || Date.now(),
            updatedAt: Number(item.updatedAt) || Date.now()
          };
        })
        .filter(Boolean)
        .slice(-100);
    } catch (_) {
      return [];
    }
  }

  let savedUserRoutes = loadSavedUserRoutes();
  let selectedSavedRouteId = localStorage.getItem(SAVED_ROUTE_MAP_SELECTED_KEY) || '';
  let movementTestSelectedSavedRouteId = localStorage.getItem(MOVEMENT_TEST_SAVED_ROUTE_KEY) || '';
  let movementTestEditorName = '';

  function saveSavedUserRoutes() {
    localStorage.setItem(SAVED_ROUTE_STORAGE_KEY, JSON.stringify(savedUserRoutes));
  }

  function savedRouteById(id) {
    return savedUserRoutes.find(route => route.id === id) || null;
  }

  function testSavedRoutes() {
    return savedUserRoutes
      .filter(route => route.kind === 'test')
      .sort((a, b) => Number(b.updatedAt) - Number(a.updatedAt));
  }

  function makeSavedRouteId() {
    return `route_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  }

  function savedRoutePointsEqual(route, points = movementTestCustomPoints) {
    if (!route || route.points.length !== points.length) return false;
    return route.points.every((point, index) =>
      Math.abs(Number(point.x) - Number(points[index]?.x)) < 0.001 &&
      Math.abs(Number(point.y) - Number(points[index]?.y)) < 0.001
    );
  }

  function editorMatchesSavedRoute() {
    const route = savedRouteById(selectedSavedRouteId);
    if (!route) return false;
    return normalizeSavedRouteName(movementTestEditorName) === route.name &&
      savedRoutePointsEqual(route);
  }

  function persistMovementTestRoute() {
    try {
      localStorage.setItem(
        MOVEMENT_TEST_CUSTOM_ROUTE_KEY,
        JSON.stringify(movementTestCustomPoints)
      );
    } catch (_) {}
    movementTestRouteKey = movementTestRouteId();
    localStorage.setItem(MOVEMENT_TEST_ROUTE_KEY, movementTestRouteKey);
    refreshSavedRouteEditorUi();
  }

  function loadSavedRouteIntoEditor(routeOrId, { asTest = false } = {}) {
    const route = typeof routeOrId === 'string'
      ? savedRouteById(routeOrId)
      : routeOrId;
    if (!route) return false;

    movementTestCustomPoints = cleanSavedRoutePoints(route.points);
    movementTestEditorName = route.name;
    selectedSavedRouteId = route.id;
    localStorage.setItem(SAVED_ROUTE_MAP_SELECTED_KEY, route.id);

    if (asTest && route.kind === 'test') {
      movementTestSelectedSavedRouteId = route.id;
      localStorage.setItem(MOVEMENT_TEST_SAVED_ROUTE_KEY, route.id);
    }

    persistMovementTestRoute();
    updateMovementTestScreenGeometry();
    updateMapInfo();
    updateMovementTestUi();
    return true;
  }

  function newSavedRouteDraft(preferTestName = false) {
    selectedSavedRouteId = '';
    localStorage.removeItem(SAVED_ROUTE_MAP_SELECTED_KEY);
    movementTestEditorName = preferTestName ? 'Тестовый' : '';
    movementTestCustomPoints = [];
    persistMovementTestRoute();
    updateMovementTestScreenGeometry();
    updateMapInfo();
    updateMovementTestUi();
  }

  function renderSavedRouteMapOptions() {
    if (!els.mapRouteStartSelect || mapSelectedRouteKey !== MAP_ROUTE_MODE_MOVEMENT_TEST) return;
    const select = els.mapRouteStartSelect;
    select.innerHTML = '';

    const draftOption = document.createElement('option');
    draftOption.value = '';
    draftOption.textContent = 'Новый маршрут';
    select.appendChild(draftOption);

    const addGroup = (label, routes) => {
      if (!routes.length) return;
      const group = document.createElement('optgroup');
      group.label = label;
      routes
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name, 'ru'))
        .forEach(route => {
          const option = document.createElement('option');
          option.value = route.id;
          option.textContent = route.name;
          group.appendChild(option);
        });
      select.appendChild(group);
    };

    addGroup('СОХРАНЁННЫЕ', savedUserRoutes.filter(route => route.kind !== 'test'));
    addGroup('ТЕСТОВЫЕ', savedUserRoutes.filter(route => route.kind === 'test'));
    select.value = savedRouteById(selectedSavedRouteId) ? selectedSavedRouteId : '';
  }

  function renderMovementTestSavedRouteOptions() {
    if (!els.movementTestSavedRouteSelect) return;
    const select = els.movementTestSavedRouteSelect;
    const routes = testSavedRoutes();
    select.innerHTML = '';

    if (!routes.length) {
      const option = document.createElement('option');
      option.value = '';
      option.textContent = 'Нет сохранённых тестовых маршрутов';
      select.appendChild(option);
      select.disabled = true;
      return;
    }

    select.disabled = Boolean(loadActiveMovementTest());
    routes.forEach(route => {
      const option = document.createElement('option');
      option.value = route.id;
      option.textContent = route.name;
      select.appendChild(option);
    });

    if (!routes.some(route => route.id === movementTestSelectedSavedRouteId)) {
      movementTestSelectedSavedRouteId = routes[0].id;
      localStorage.setItem(MOVEMENT_TEST_SAVED_ROUTE_KEY, movementTestSelectedSavedRouteId);
    }
    select.value = movementTestSelectedSavedRouteId;
  }

  function refreshSavedRouteEditorUi(message = '') {
    const inRouteEditor = mapSelectedRouteKey === MAP_ROUTE_MODE_MOVEMENT_TEST;
    if (els.mapSavedRouteEditor) els.mapSavedRouteEditor.hidden = !inRouteEditor;
    if (!inRouteEditor) return;

    renderSavedRouteMapOptions();

    if (els.mapRouteStartWrap) els.mapRouteStartWrap.hidden = false;
    if (els.mapRouteStartLabel) els.mapRouteStartLabel.textContent = 'СОХРАНЁННЫЙ МАРШРУТ';
    if (els.mapSavedRouteName && document.activeElement !== els.mapSavedRouteName) {
      els.mapSavedRouteName.value = movementTestEditorName;
    }

    const name = normalizeSavedRouteName(movementTestEditorName);
    const pointsReady = movementTestCustomPoints.length >= 2;
    const hasSaved = Boolean(savedRouteById(selectedSavedRouteId));

    if (els.mapSavedRouteSaveBtn) {
      els.mapSavedRouteSaveBtn.disabled = !pointsReady || !name;
      els.mapSavedRouteSaveBtn.textContent = hasSaved ? 'СОХРАНИТЬ ИЗМЕНЕНИЯ' : 'СОХРАНИТЬ';
    }
    if (els.mapSavedRouteDeleteBtn) els.mapSavedRouteDeleteBtn.disabled = !hasSaved;

    if (els.mapPresetRouteLabel) {
      els.mapPresetRouteLabel.hidden = false;
      const shownName = name || 'без имени';
      els.mapPresetRouteLabel.textContent =
        `СВОЙ МАРШРУТ · ${shownName} · ${movementTestCustomPoints.length} точек`;
    }

    if (els.mapSavedRouteMessage) {
      if (message) {
        els.mapSavedRouteMessage.textContent = message;
      } else if (!pointsReady) {
        els.mapSavedRouteMessage.textContent =
          'Поставьте минимум две точки. Имя, начинающееся с «Тест…», добавит маршрут в раздел тестов скорости.';
      } else if (!name) {
        els.mapSavedRouteMessage.textContent = 'Введите имя маршрута и нажмите «СОХРАНИТЬ».';
      } else if (hasSaved && !editorMatchesSavedRoute()) {
        els.mapSavedRouteMessage.textContent = 'Маршрут изменён. Нажмите «СОХРАНИТЬ ИЗМЕНЕНИЯ».';
      } else if (hasSaved) {
        els.mapSavedRouteMessage.textContent =
          savedRouteById(selectedSavedRouteId)?.kind === 'test'
            ? 'Сохранён как тестовый маршрут и доступен в разделе тестов скорости.'
            : 'Маршрут сохранён.';
      } else {
        els.mapSavedRouteMessage.textContent = 'Маршрут готов к сохранению.';
      }
    }
  }

  function saveCurrentNamedRoute() {
    const name = normalizeSavedRouteName(els.mapSavedRouteName?.value || movementTestEditorName);
    const points = cleanSavedRoutePoints(movementTestCustomPoints);

    if (points.length < 2) {
      refreshSavedRouteEditorUi('Нужно поставить минимум две точки.');
      return;
    }
    if (!name) {
      refreshSavedRouteEditorUi('Введите имя маршрута.');
      els.mapSavedRouteName?.focus();
      return;
    }

    const now = Date.now();
    const existing = savedRouteById(selectedSavedRouteId);
    const id = existing?.id || makeSavedRouteId();
    const route = {
      id,
      name,
      kind: isTestSavedRouteName(name) ? 'test' : 'route',
      points,
      createdAt: existing?.createdAt || now,
      updatedAt: now
    };

    if (existing) {
      savedUserRoutes = savedUserRoutes.map(item => item.id === id ? route : item);
    } else {
      savedUserRoutes.push(route);
    }

    savedUserRoutes = savedUserRoutes.slice(-100);
    selectedSavedRouteId = id;
    movementTestEditorName = name;
    localStorage.setItem(SAVED_ROUTE_MAP_SELECTED_KEY, id);

    if (route.kind === 'test') {
      movementTestSelectedSavedRouteId = id;
      localStorage.setItem(MOVEMENT_TEST_SAVED_ROUTE_KEY, id);
    } else if (movementTestSelectedSavedRouteId === id) {
      movementTestSelectedSavedRouteId = '';
      localStorage.removeItem(MOVEMENT_TEST_SAVED_ROUTE_KEY);
    }

    saveSavedUserRoutes();
    renderMovementTestSavedRouteOptions();
    updateMovementTestUi();
    refreshSavedRouteEditorUi(
      route.kind === 'test'
        ? `«${name}» сохранён и добавлен в ТЕСТОВЫЕ МАРШРУТЫ.`
        : `«${name}» сохранён.`
    );
  }

  function deleteCurrentNamedRoute() {
    const route = savedRouteById(selectedSavedRouteId);
    if (!route) return;
    if (!window.confirm(`Удалить маршрут «${route.name}»?`)) return;

    savedUserRoutes = savedUserRoutes.filter(item => item.id !== route.id);
    if (movementTestSelectedSavedRouteId === route.id) {
      movementTestSelectedSavedRouteId = '';
      localStorage.removeItem(MOVEMENT_TEST_SAVED_ROUTE_KEY);
    }
    saveSavedUserRoutes();
    renderMovementTestSavedRouteOptions();
    newSavedRouteDraft(false);
    refreshSavedRouteEditorUi(`Маршрут «${route.name}» удалён.`);
  }

  function migrateV116TestRoute() {
    if (localStorage.getItem(SAVED_ROUTE_MIGRATION_KEY) === '1') return;
    localStorage.setItem(SAVED_ROUTE_MIGRATION_KEY, '1');

    if (movementTestCustomPoints.length < 2 || testSavedRoutes().length) return;
    const now = Date.now();
    const route = {
      id: makeSavedRouteId(),
      name: 'Тестовый',
      kind: 'test',
      points: cleanSavedRoutePoints(movementTestCustomPoints),
      createdAt: now,
      updatedAt: now
    };
    savedUserRoutes.push(route);
    selectedSavedRouteId = route.id;
    movementTestSelectedSavedRouteId = route.id;
    movementTestEditorName = route.name;
    localStorage.setItem(SAVED_ROUTE_MAP_SELECTED_KEY, route.id);
    localStorage.setItem(MOVEMENT_TEST_SAVED_ROUTE_KEY, route.id);
    saveSavedUserRoutes();
  }

  function ensureSelectedTestRouteLoaded() {
    const routes = testSavedRoutes();
    let route = routes.find(item => item.id === movementTestSelectedSavedRouteId) || routes[0] || null;
    if (!route) return false;
    movementTestSelectedSavedRouteId = route.id;
    localStorage.setItem(MOVEMENT_TEST_SAVED_ROUTE_KEY, route.id);
    return loadSavedRouteIntoEditor(route, { asTest: true });
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
    const name = normalizeSavedRouteName(movementTestEditorName) || 'Несохранённый маршрут';
    return {
      key,
      label: name,
      shortLabel: name,
      points,
      start: points[0] || null,
      end: points[points.length - 1] || null,
      help: points.length >= 2
        ? 'Маршрут готов. Для теста он должен быть сохранён под именем, начинающимся с «Тест…».'
        : 'Поставьте на карте минимум две точки. Промежуточных точек может быть сколько угодно.'
    };
  }

  function updateMovementTestUi() {
    const active = loadActiveMovementTest();
    renderMovementTestSavedRouteOptions();

    const selectedTest = savedRouteById(movementTestSelectedSavedRouteId);
    const selectedIsTest = Boolean(selectedTest && selectedTest.kind === 'test');
    const editorSaved = selectedIsTest && selectedSavedRouteId === selectedTest.id && editorMatchesSavedRoute();
    const currentRoute = getMovementTestRoute();
    const route = active?.routeSnapshot?.points?.length >= 2 ? active.routeSnapshot : currentRoute;
    const distanceMeters = active && Number(active.distanceMeters) > 0
      ? Number(active.distanceMeters)
      : movementTestDistanceMeters();

    if (els.movementTestRouteName) {
      els.movementTestRouteName.textContent = selectedIsTest
        ? selectedTest.name.toUpperCase()
        : 'ТЕСТОВЫЙ МАРШРУТ НЕ ВЫБРАН';
    }
    if (els.movementTestPointCount) {
      els.movementTestPointCount.textContent = String(currentRoute.points.length);
    }
    if (els.editMovementTestRouteBtn) {
      els.editMovementTestRouteBtn.disabled = Boolean(active);
      els.editMovementTestRouteBtn.textContent = active
        ? 'МАРШРУТ ЗАБЛОКИРОВАН'
        : selectedIsTest
          ? 'ИЗМЕНИТЬ ПО ТОЧКАМ'
          : 'СОЗДАТЬ ТЕСТОВЫЙ';
    }
    if (els.movementTestHelp) {
      els.movementTestHelp.textContent = active
        ? 'Замер идёт. Маршрут нельзя менять до финиша.'
        : selectedIsTest && !editorSaved
          ? 'Маршрут изменён. Сначала сохраните изменения на карте.'
          : selectedIsTest
            ? 'Выбран сохранённый тестовый маршрут. Встаньте в точке 1 и начинайте замер.'
            : 'Создайте маршрут по точкам и сохраните его под именем, начинающимся с «Тест…».';
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
        action.disabled = Boolean(active && !isThisActive) ||
          (!active && (!selectedIsTest || !editorSaved || currentRoute.points.length < 2));
      }
    });

    if (els.movementTestStatus) {
      if (active) {
        const count = route.points?.length || 0;
        els.movementTestStatus.textContent =
          `${MOVEMENT_TEST_MODES[active.mode]}: замер идёт по «${route.label}». Пройдите точки 1–${count} и в точке ${count} нажмите «ФИНИШ».`;
      } else if (!selectedIsTest) {
        els.movementTestStatus.textContent = 'Нет тестового маршрута. Создайте и сохраните маршрут с именем «Тестовый…».';
      } else if (!editorSaved) {
        els.movementTestStatus.textContent = 'Есть несохранённые изменения маршрута. Сохраните их перед тестом.';
      } else {
        els.movementTestStatus.textContent =
          `Маршрут «${selectedTest.name}»: ${currentRoute.points.length} точек · ${formatMapDistance(distanceMeters)}. Начните в точке 1.`;
      }
    }
  }

  function openMovementTestRouteEditor() {
    if (loadActiveMovementTest()) return;
    movementTestReturnToDialog = true;

    if (!ensureSelectedTestRouteLoaded()) {
      newSavedRouteDraft(true);
    }

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
    refreshSavedRouteEditorUi();

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
      refreshSavedRouteEditorUi();
      updateMovementTestScreenGeometry();
    });
  }

  migrateV116TestRoute();

  if (!savedRouteById(selectedSavedRouteId)) {
    const preferred = savedRouteById(movementTestSelectedSavedRouteId) || savedUserRoutes[0] || null;
    if (preferred) loadSavedRouteIntoEditor(preferred);
    else movementTestEditorName = '';
  } else {
    loadSavedRouteIntoEditor(selectedSavedRouteId);
  }

  if (els.mapSavedRouteName) {
    els.mapSavedRouteName.addEventListener('input', () => {
      movementTestEditorName = normalizeSavedRouteName(els.mapSavedRouteName.value);
      refreshSavedRouteEditorUi();
      updateMovementTestUi();
    });
  }

  if (els.mapSavedRouteSaveBtn) {
    els.mapSavedRouteSaveBtn.addEventListener('click', saveCurrentNamedRoute);
  }

  if (els.mapSavedRouteNewBtn) {
    els.mapSavedRouteNewBtn.addEventListener('click', () => {
      newSavedRouteDraft(movementTestReturnToDialog);
      refreshSavedRouteEditorUi('Новый маршрут. Поставьте точки на карте.');
    });
  }

  if (els.mapSavedRouteDeleteBtn) {
    els.mapSavedRouteDeleteBtn.addEventListener('click', deleteCurrentNamedRoute);
  }

  if (els.mapRouteStartSelect) {
    els.mapRouteStartSelect.addEventListener('change', event => {
      if (mapSelectedRouteKey !== MAP_ROUTE_MODE_MOVEMENT_TEST) return;
      const id = event.target.value;
      if (!id) {
        newSavedRouteDraft(false);
      } else {
        loadSavedRouteIntoEditor(id);
      }
      refreshSavedRouteEditorUi();
    });
  }

  if (els.mapRouteSelect) {
    els.mapRouteSelect.addEventListener('change', event => {
      if (event.target.value === MAP_ROUTE_MODE_MOVEMENT_TEST) {
        const route = savedRouteById(selectedSavedRouteId) || savedUserRoutes[0] || null;
        if (route) loadSavedRouteIntoEditor(route);
        refreshSavedRouteEditorUi();
      } else if (els.mapSavedRouteEditor) {
        els.mapSavedRouteEditor.hidden = true;
      }
    });
  }

  if (els.movementTestSavedRouteSelect) {
    els.movementTestSavedRouteSelect.addEventListener('change', event => {
      const route = savedRouteById(event.target.value);
      if (!route || route.kind !== 'test' || loadActiveMovementTest()) return;
      movementTestSelectedSavedRouteId = route.id;
      localStorage.setItem(MOVEMENT_TEST_SAVED_ROUTE_KEY, route.id);
      loadSavedRouteIntoEditor(route, { asTest: true });
      updateMovementTestUi();
      updateMovementLiveTimers();
    });
  }

  if (els.settingsTestBtn) {
    els.settingsTestBtn.addEventListener('click', () => {
      window.setTimeout(() => {
        ensureSelectedTestRouteLoaded();
        updateMovementTestUi();
        updateMovementLiveTimers();
      }, 0);
    });
  }

  refreshSavedRouteEditorUi();
  renderMovementTestSavedRouteOptions();
'''

if anchor not in app:
    raise SystemExit('v116 init anchor not found')
app = app.replace(anchor, v117 + '\n' + anchor, 1)
path.write_text(app, encoding='utf-8')


# ---------- style.css ----------
path = Path('style.css')
css = path.read_text(encoding='utf-8')
css += r'''

/* PWA v117 — именованные маршруты по точкам */
.map-saved-route-editor {
  grid-column: 1 / -1;
  display: grid;
  gap: 9px;
  padding: 10px;
  border: 1px solid var(--border-soft);
  border-radius: 10px;
  background: color-mix(in srgb, var(--card-2) 88%, transparent);
}

.map-saved-route-editor[hidden] {
  display: none !important;
}

.map-saved-route-name-field {
  display: grid;
  gap: 6px;
}

.map-saved-route-name-field > span,
.movement-test-route-picker > span {
  color: var(--muted);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: .58rem;
  font-weight: 800;
  letter-spacing: .08em;
}

.map-saved-route-name-field input,
.movement-test-route-picker select {
  width: 100%;
  min-height: 42px;
  border: 1px solid var(--border-soft);
  border-radius: 8px;
  background: var(--input);
  color: var(--text);
  padding: 8px 10px;
  font: inherit;
}

.map-saved-route-actions {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 7px;
}

.map-saved-route-message {
  min-height: 1.2em;
  color: var(--muted);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: .62rem;
  line-height: 1.4;
}

.movement-test-route-picker {
  display: grid;
  gap: 6px;
  margin: 10px 0 6px;
}

@media (max-width: 480px) {
  .map-saved-route-actions {
    grid-template-columns: 1fr;
  }
}
'''
path.write_text(css, encoding='utf-8')


# ---------- service worker ----------
path = Path('service-worker.js')
sw = path.read_text(encoding='utf-8')
sw = sw.replace('stalker2-zone-clock-app-v116', 'stalker2-zone-clock-app-v117')
sw = sw.replace('stalker2-zone-clock-map-v116', 'stalker2-zone-clock-map-v117')
path.write_text(sw, encoding='utf-8')


# ---------- README ----------
path = Path('README.txt')
readme = path.read_text(encoding='utf-8')
readme += '''\n\nPWA v117\n- Добавлена библиотека пользовательских маршрутов по произвольным точкам карты.\n- Маршрут можно назвать, сохранить, выбрать повторно, изменить или удалить.\n- Маршруты с именем, начинающимся с «Тест…», автоматически попадают в раздел тестов скорости.\n- Старый тестовый маршрут v116 автоматически переносится в библиотеку как «Тестовый».\n'''
path.write_text(readme, encoding='utf-8')
