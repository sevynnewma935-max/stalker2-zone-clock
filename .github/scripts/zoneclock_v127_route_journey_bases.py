from pathlib import Path

def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected 1 match, got {count}")
    return text.replace(old, new, 1)

# ---------- index.html ----------
path = Path("index.html")
html = path.read_text(encoding="utf-8")

route_start_anchor = '''</label>
<div class="map-saved-route-editor" hidden id="mapSavedRouteEditor">'''
base_picker = '''</label>
<label class="map-route-select-wrap" for="mapArtifactBaseSelect" hidden id="mapArtifactBaseWrap">
<span>ДОБАВИТЬ БАЗУ В МАРШРУТ</span>
<select class="map-route-select" id="mapArtifactBaseSelect">
<option value="">Выберите базу…</option>
</select>
</label>
<div class="map-saved-route-editor" hidden id="mapSavedRouteEditor">'''
html = replace_once(html, route_start_anchor, base_picker, "artifact base picker")

html = html.replace(
    'ZONE CLOCK <strong>v1.26</strong>',
    'ZONE CLOCK <strong>v1.27</strong>'
)
path.write_text(html, encoding="utf-8")

# ---------- app.js ----------
path = Path("app.js")
app = path.read_text(encoding="utf-8")

# DOM refs
app = replace_once(
    app,
    "    mapRouteStartSelect: $('mapRouteStartSelect'),\n",
    "    mapRouteStartSelect: $('mapRouteStartSelect'),\n    mapArtifactBaseWrap: $('mapArtifactBaseWrap'),\n    mapArtifactBaseSelect: $('mapArtifactBaseSelect'),\n",
    "artifact base DOM refs"
)

# Base keys after location order
order_anchor = '''  const MAP_ROUTE_LOCATION_ORDER = [
    'jupiter',
    'yaniv',
    'generators',
    'red_forest',
    'iron_forest',
    'cooling',
    'cement',
    'svalka',
    'rostok',
    'yantar',
    'malachite',
    'sircaa',
    'wild_island',
    'chemical',
    'lesser_zone',
    'burnt_forest',
    'duga',
    'zaton_varta',
    'zaton_sultan',
    'swamps',
    'cement_bridge',
    'swyd_east'
  ];'''
order_new = order_anchor + '''

  // PWA v127 — базы, которые можно включать в маршрут по артефактам.
  // Используются те же координаты общего слоя местоположений.
  const MAP_ARTIFACT_BASE_KEYS = [
    'yaniv',
    'rostok',
    'svalka',
    'yantar',
    'malachite',
    'sircaa',
    'wild_island',
    'chemical',
    'lesser_zone',
    'cement',
    'jupiter',
    'zaton_varta',
    'zaton_sultan'
  ];

  function isCustomArtifactBaseKey(placeKey) {
    return MAP_ARTIFACT_BASE_KEYS.includes(placeKey);
  }
'''
app = replace_once(app, order_anchor, order_new, "artifact base keys")

# Known locations layer: make bases selectable in artifact mode.
old_planner_active = '''    const plannerActive =
      mapSelectedRouteKey ===
      MAP_ROUTE_MODE_ROAD_PLANNER;

    els.mapKnownLocationsLayer.style.display = '';'''
new_planner_active = '''    const plannerActive =
      mapSelectedRouteKey ===
      MAP_ROUTE_MODE_ROAD_PLANNER;
    const customArtifactActive =
      mapSelectedRouteKey ===
      MAP_ROUTE_MODE_CUSTOM_ARTIFACT;

    els.mapKnownLocationsLayer.style.display = '';'''
app = replace_once(app, old_planner_active, new_planner_active, "known location custom mode")

old_selected = '''      const selectedIndex = plannerActive
        ? mapRoadPlannerSequence.findIndex(
            item => item.placeKey === key
          )
        : -1;'''
new_selected = '''      const baseSelectable =
        customArtifactActive &&
        isCustomArtifactBaseKey(key);
      const selectedIndex = plannerActive
        ? mapRoadPlannerSequence.findIndex(
            item => item.placeKey === key
          )
        : baseSelectable
          ? mapCustomArtifactSequence.findIndex(
              item => item.id === `base:${key}`
            )
          : -1;'''
app = replace_once(app, old_selected, new_selected, "known location selected index")

old_classes = '''      const classes = ['map-known-location'];
      if (!plannerActive) classes.push('is-passive');
      if (selectedIndex >= 0) classes.push('is-selected');'''
new_classes = '''      const classes = ['map-known-location'];
      const locationInteractive = plannerActive || baseSelectable;
      if (!locationInteractive) classes.push('is-passive');
      if (baseSelectable) classes.push('is-artifact-base');
      if (selectedIndex >= 0) classes.push('is-selected');'''
app = replace_once(app, old_classes, new_classes, "known location classes")

old_role = '''      if (plannerActive) {
        group.setAttribute('tabindex', '0');
        group.setAttribute('role', 'button');
      } else {
        group.setAttribute('aria-label', `Местоположение: ${place.label}`);
      }'''
new_role = '''      if (locationInteractive) {
        group.setAttribute('tabindex', '0');
        group.setAttribute('role', 'button');
      } else {
        group.setAttribute('aria-label', `Местоположение: ${place.label}`);
      }'''
app = replace_once(app, old_role, new_role, "known location role")

old_aria = '''          : isRoadJourney
            ? `${place.label}, не входит в текущий маршрут`
            : `Добавить ${place.label} в маршрут`
      );'''
new_aria = '''          : isRoadJourney
            ? `${place.label}, не входит в текущий маршрут`
            : baseSelectable
              ? `Добавить базу ${place.label} в маршрут по артефактам`
              : `Местоположение: ${place.label}`
      );'''
app = replace_once(app, old_aria, new_aria, "known location aria")

# Candidate list: append bases.
candidate_end = '''    return result;
  }

  function saveCustomArtifactRoute() {'''
candidate_new = '''    MAP_ARTIFACT_BASE_KEYS.forEach(placeKey => {
      const place = MAP_KNOWN_LOCATIONS[placeKey];
      if (!place || place.visible === false) return;

      result.push({
        id: `base:${placeKey}`,
        kind: 'base',
        placeKey,
        routeKey: '',
        markerIndex: null,
        x: Number(place.x),
        y: Number(place.y),
        label: place.label
      });
    });

    return result;
  }

  function saveCustomArtifactRoute() {'''
app = replace_once(app, candidate_end, candidate_new, "append base candidates")

# Add helper to append a base without toggling it off.
toggle_anchor = '''  function toggleCustomArtifactSelection(candidate) {
    if (!candidate) return;'''
toggle_new = '''  function addCustomArtifactBase(placeKey) {
    if (!isCustomArtifactBaseKey(placeKey)) return;
    const candidate = getCustomArtifactCandidates().find(
      item => item.id === `base:${placeKey}`
    );
    if (!candidate) return;

    if (mapCustomArtifactSequence.some(item => item.id === candidate.id)) {
      return;
    }

    toggleCustomArtifactSelection(candidate);
  }

  function toggleCustomArtifactSelection(candidate) {
    if (!candidate) return;'''
app = replace_once(app, toggle_anchor, toggle_new, "add artifact base helper")

# Re-render known locations after selection changes.
app = replace_once(
    app,
    '''    renderCustomArtifactRoute();
    updateCustomArtifactRouteGeometry();
    requestCustomArtifactBuild();
    updateMapRouteHeaderSummary();''',
    '''    renderCustomArtifactRoute();
    renderKnownLocationsLayer();
    updateCustomArtifactRouteGeometry();
    requestCustomArtifactBuild();
    updateMapRouteHeaderSummary();''',
    "refresh base selection layer"
)

# Render artifact candidates safely when candidate is a base.
old_render_head = '''    getCustomArtifactCandidates().forEach(candidate => {
      const selectedIndex = mapCustomArtifactSequence.findIndex(
        item => item.id === candidate.id
      );
      const elapsed = artifactElapsedSeconds(
        candidate.routeKey,
        candidate.markerIndex
      );
      const isVisited = elapsed !== null;
      const respawnState = artifactRespawnState(elapsed);

      const circle = document.createElementNS('''
new_render_head = '''    getCustomArtifactCandidates().forEach(candidate => {
      const selectedIndex = mapCustomArtifactSequence.findIndex(
        item => item.id === candidate.id
      );
      const isBase = candidate.kind === 'base';

      // Базы уже подписаны постоянным слоем местоположений.
      // В этом слое рисуем базу только если она включена в маршрут,
      // чтобы показать номер в последовательности.
      if (isBase && selectedIndex < 0) return;

      const elapsed = isBase
        ? null
        : artifactElapsedSeconds(
            candidate.routeKey,
            candidate.markerIndex
          );
      const isVisited = !isBase && elapsed !== null;
      const respawnState = isBase
        ? { key: 'base' }
        : artifactRespawnState(elapsed);

      const circle = document.createElementNS('''
app = replace_once(app, old_render_head, new_render_head, "base-safe custom render")

old_class = '''        `map-custom-artifact-point map-artifact-visit-point${ 
          isVisited ? ` visited artifact-${respawnState.key}` : ''
        }${selectedIndex >= 0 ? ' is-custom-selected' : ''}`
      );'''
# Exact whitespace differs, do a simpler literal replacement of the class template body.
app = app.replace(
    '''        `map-custom-artifact-point map-artifact-visit-point${
          isVisited ? ` visited artifact-${respawnState.key}` : ''
        }${selectedIndex >= 0 ? ' is-custom-selected' : ''}`
      );''',
    '''        `map-custom-artifact-point map-artifact-visit-point${
          isBase ? ' map-custom-base-point' : ''
        }${
          isVisited ? ` visited artifact-${respawnState.key}` : ''
        }${selectedIndex >= 0 ? ' is-custom-selected' : ''}`
      );''',
    1
)

old_aria_custom = '''        selectedIndex >= 0
          ? `${candidate.label}, точка маршрута ${selectedIndex + 1}`
          : `${candidate.label}, добавить в свой маршрут`
      );'''
new_aria_custom = '''        selectedIndex >= 0
          ? `${candidate.label}, точка маршрута ${selectedIndex + 1}`
          : isBase
            ? `${candidate.label}, добавить базу в маршрут`
            : `${candidate.label}, добавить в свой маршрут`
      );'''
app = replace_once(app, old_aria_custom, new_aria_custom, "custom candidate aria")

app = replace_once(
    app,
    '''      if (!isVisited && selectedIndex < 0) {''',
    '''      if (!isBase && !isVisited && selectedIndex < 0) {''',
    "no base pulse"
)

# Journey plans for custom artifact and saved/custom routes.
road_plan_anchor = '''  function getRoadPlannerJourneyPlan() {
    const distanceMeters = Math.max(
      0,
      mapRoadPlannerMeters
    );'''
# keep original function; insert helpers before it
journey_helpers = '''  function getCustomArtifactJourneyLabel() {
    if (!mapCustomArtifactSequence.length) {
      return 'Маршрут по артефактам';
    }
    return mapCustomArtifactSequence
      .map(item => item.label)
      .join(' → ');
  }

  function getCustomArtifactJourneyPlan() {
    const distanceMeters = Math.max(0, mapCustomArtifactMeters);
    const realSeconds = Math.max(
      60,
      (distanceMeters / 1000) / ROUTE_TRAVEL_SPEED_KMH * 3600
    );
    return {
      routeKey: MAP_ROUTE_MODE_CUSTOM_ARTIFACT,
      routeLabel: getCustomArtifactJourneyLabel(),
      distanceMeters,
      realSeconds,
      zoneAdvanceSeconds: projectZoneAdvanceForRealSeconds(
        realSeconds,
        gameSeconds
      )
    };
  }

  function getMovementJourneyPlan() {
    const route = getMovementTestRoute();
    const distanceMeters = Math.max(0, movementTestDistanceMeters());
    const realSeconds = Math.max(
      60,
      (distanceMeters / 1000) / ROUTE_TRAVEL_SPEED_KMH * 3600
    );
    return {
      routeKey: MAP_ROUTE_MODE_MOVEMENT_TEST,
      routeLabel: route.label || 'Свой маршрут',
      distanceMeters,
      realSeconds,
      zoneAdvanceSeconds: projectZoneAdvanceForRealSeconds(
        realSeconds,
        gameSeconds
      )
    };
  }

  function canStartSelectedJourney() {
    if (mapSelectedRouteKey === MAP_ROUTE_MODE_ROAD_PLANNER) {
      return Boolean(
        mapRoadPlannerSequence.length >= 2 &&
        mapRoadPlannerRoutePoints.length >= 2 &&
        mapRoadPlannerMeters > 0 &&
        !mapRoadPlannerBusy
      );
    }

    if (mapSelectedRouteKey === MAP_ROUTE_MODE_CUSTOM_ARTIFACT) {
      return Boolean(
        mapCustomArtifactSequence.length >= 2 &&
        mapCustomArtifactRoutePoints.length >= 2 &&
        mapCustomArtifactMeters > 0 &&
        !mapCustomArtifactBusy
      );
    }

    if (mapSelectedRouteKey === MAP_ROUTE_MODE_MOVEMENT_TEST) {
      return Boolean(
        movementTestCustomPoints.length >= 2 &&
        movementTestDistanceMeters() > 0
      );
    }

    return Boolean(getPresetRoute());
  }

  function updateJourneyActionUi() {
    const ready = canStartSelectedJourney();

    if (els.mapJourneyBtn) {
      els.mapJourneyBtn.hidden = false;
      els.mapJourneyBtn.disabled = !ready;
      els.mapJourneyBtn.textContent = ready ? 'В ПУТЬ' : 'В ПУТЬ · СНАЧАЛА ПОСТРОЙТЕ МАРШРУТ';
    }

    if (els.mapLocationJourneyBtn) {
      els.mapLocationJourneyBtn.hidden = !ready;
      els.mapLocationJourneyBtn.disabled = !ready;
      els.mapLocationJourneyBtn.setAttribute(
        'aria-label',
        'В путь по текущему маршруту'
      );
      els.mapLocationJourneyBtn.title = 'В путь';
    }
  }

'''
app = replace_once(app, road_plan_anchor, journey_helpers + road_plan_anchor, "journey helpers")

# Main journey preview supports all route modes.
old_preview_head = '''  function openJourneyPreview() {
    if (!els.mapJourneyDialog) return;

    const isRoadPlannerMode =
      mapSelectedRouteKey ===
      MAP_ROUTE_MODE_ROAD_PLANNER;

    let route = null;
    let plan = null;
    let routeName = '';

    if (isRoadPlannerMode) {'''
new_preview_head = '''  function openJourneyPreview() {
    if (!els.mapJourneyDialog) return;

    const isRoadPlannerMode =
      mapSelectedRouteKey ===
      MAP_ROUTE_MODE_ROAD_PLANNER;
    const isCustomArtifactMode =
      mapSelectedRouteKey ===
      MAP_ROUTE_MODE_CUSTOM_ARTIFACT;
    const isMovementRouteMode =
      mapSelectedRouteKey ===
      MAP_ROUTE_MODE_MOVEMENT_TEST;

    let route = null;
    let plan = null;
    let routeName = '';

    if (isCustomArtifactMode) {
      if (!canStartSelectedJourney()) return;
      plan = getCustomArtifactJourneyPlan();
      routeName = plan.routeLabel;
    } else if (isMovementRouteMode) {
      if (!canStartSelectedJourney()) return;
      plan = getMovementJourneyPlan();
      routeName = plan.routeLabel;
    } else if (isRoadPlannerMode) {'''
app = replace_once(app, old_preview_head, new_preview_head, "journey preview modes")

# startJourney supports custom artifact and saved/custom route.
start_anchor = '''  function startJourney() {
    const isRoadPlannerMode =
      mapSelectedRouteKey ===
      MAP_ROUTE_MODE_ROAD_PLANNER;

    if (isRoadPlannerMode) {'''
start_new = '''  function startJourney() {
    const isRoadPlannerMode =
      mapSelectedRouteKey ===
      MAP_ROUTE_MODE_ROAD_PLANNER;
    const isCustomArtifactMode =
      mapSelectedRouteKey ===
      MAP_ROUTE_MODE_CUSTOM_ARTIFACT;
    const isMovementRouteMode =
      mapSelectedRouteKey ===
      MAP_ROUTE_MODE_MOVEMENT_TEST;

    if (isCustomArtifactMode || isMovementRouteMode) {
      if (!canStartSelectedJourney()) {
        closeJourneyPreview();
        return;
      }

      mapJourneyPlan = isCustomArtifactMode
        ? getCustomArtifactJourneyPlan()
        : getMovementJourneyPlan();

      mapJourneyActive = true;
      mapJourneySequence = isCustomArtifactMode
        ? mapCustomArtifactSequence.map((item, index) => ({
            x: Number(item.x),
            y: Number(item.y),
            label: item.label,
            markerIndex: item.kind === 'base' ? null : item.markerIndex,
            sourceRouteKey: item.routeKey || '',
            routeKey: MAP_ROUTE_MODE_CUSTOM_ARTIFACT,
            distancePx: index
          }))
        : getMovementTestRoute().points.map((item, index) => ({
            x: Number(item.x),
            y: Number(item.y),
            label: item.label || `Точка ${index + 1}`,
            markerIndex: null,
            routeKey: MAP_ROUTE_MODE_MOVEMENT_TEST,
            distancePx: index
          }));

      closeJourneyPreview();

      if (!mapFullscreenMode) {
        mapFullscreenMode = true;
        updateMapFullscreenUI();
      }

      updateJourneyHud();

      window.setTimeout(() => {
        focusJourneyStep(0, 1050);
      }, 180);

      return;
    }

    if (isRoadPlannerMode) {'''
app = replace_once(app, start_anchor, start_new, "start journey all routes")

# Update generic journey button in UI instead of hiding special modes.
app = replace_once(
    app,
    '''    if (els.mapJourneyBtn) els.mapJourneyBtn.hidden = isSpecialMode;''',
    '''    if (els.mapJourneyBtn) {
      els.mapJourneyBtn.hidden = false;
    }''',
    "show journey button in special modes"
)

# Show and populate base picker in custom artifact mode + hint text.
roadplanner_ui_anchor = '''    if (els.mapRoadPlanner) {
      els.mapRoadPlanner.hidden = !isRoadPlannerMode;
      els.mapRoadPlanner.open = isRoadPlannerMode && !mapFullscreenMode;
    }

    mapMovementTestVisible = isMovementTestMode;'''
roadplanner_ui_new = '''    if (els.mapRoadPlanner) {
      els.mapRoadPlanner.hidden = !isRoadPlannerMode;
      els.mapRoadPlanner.open = isRoadPlannerMode && !mapFullscreenMode;
    }

    if (els.mapArtifactBaseWrap) {
      els.mapArtifactBaseWrap.hidden = !isCustomArtifactMode;
    }
    if (els.mapArtifactBaseSelect && isCustomArtifactMode) {
      const current = els.mapArtifactBaseSelect.value;
      els.mapArtifactBaseSelect.innerHTML =
        '<option value="">Выберите базу…</option>' +
        MAP_ARTIFACT_BASE_KEYS
          .filter(key => MAP_KNOWN_LOCATIONS[key] && MAP_KNOWN_LOCATIONS[key].visible !== false)
          .map(key => `<option value="${key}">${MAP_KNOWN_LOCATIONS[key].label}</option>`)
          .join('');
      els.mapArtifactBaseSelect.value =
        MAP_ARTIFACT_BASE_KEYS.includes(current) ? current : '';
    }

    mapMovementTestVisible = isMovementTestMode;'''
app = replace_once(app, roadplanner_ui_anchor, roadplanner_ui_new, "artifact base picker UI")

app = replace_once(
    app,
    '''          'Свой маршрут: нажимайте артефакты в нужной последовательности. Повторное нажатие снимает точку с маршрута.';''',
    '''          'Свой маршрут: нажимайте артефакты и базы в нужной последовательности. Базу можно выбрать из списка или нажать её название на карте.';''',
    "artifact hint with bases"
)

# Main label wording.
app = app.replace(
    '''          ? `Свой маршрут по артефактам · ${mapCustomArtifactSequence.length} точек`
          : 'Свой маршрут по артефактам · выберите артефакты';''',
    '''          ? `Свой маршрут по артефактам и базам · ${mapCustomArtifactSequence.length} точек`
          : 'Свой маршрут по артефактам и базам · выберите точки';''',
    1
)

# Header summary also refreshes action.
summary_end = '''    if (els.mapRouteHeaderTime) {
      els.mapRouteHeaderTime.textContent = metrics.zoneSeconds > 0
        ? formatJourneyZoneTime(metrics.zoneSeconds)
        : '—';
    }
  }'''
summary_new = '''    if (els.mapRouteHeaderTime) {
      els.mapRouteHeaderTime.textContent = metrics.zoneSeconds > 0
        ? formatJourneyZoneTime(metrics.zoneSeconds)
        : '—';
    }
    updateJourneyActionUi();
  }'''
app = replace_once(app, summary_end, summary_new, "journey action after summary")

# Fullscreen "in path" button should work for every ready route.
old_fullscreen_journey = '''    if (els.mapLocationJourneyBtn) {
      const canStartLocationJourney =
        mapSelectedRouteKey ===
          MAP_ROUTE_MODE_ROAD_PLANNER &&
        mapRoadPlannerSequence.length >= 2 &&
        mapRoadPlannerRoutePoints.length >= 2 &&
        mapRoadPlannerMeters > 0 &&
        !mapRoadPlannerBusy;

      els.mapLocationJourneyBtn.hidden =
        !canStartLocationJourney;
      els.mapLocationJourneyBtn.disabled =
        !canStartLocationJourney;
    }

    updateJourneyHud();'''
new_fullscreen_journey = '''    updateJourneyActionUi();

    updateJourneyHud();'''
app = replace_once(app, old_fullscreen_journey, new_fullscreen_journey, "fullscreen journey any route")

# Add base select event before planner location select event.
planner_select_event = '''  if (els.mapPlannerLocationSelect) {
    els.mapPlannerLocationSelect.addEventListener('change', event => {'''
base_select_event = '''  if (els.mapArtifactBaseSelect) {
    els.mapArtifactBaseSelect.addEventListener('change', event => {
      const key = event.target.value;
      if (key) addCustomArtifactBase(key);
      event.target.value = '';
    });
  }

  if (els.mapPlannerLocationSelect) {
    els.mapPlannerLocationSelect.addEventListener('change', event => {'''
app = replace_once(app, planner_select_event, base_select_event, "artifact base select event")

# Known location click handler can add bases in custom artifact mode.
old_known_activation = '''    const handleKnownLocationActivation = event => {
      if (mapSelectedRouteKey !== MAP_ROUTE_MODE_ROAD_PLANNER) return;

      const group = event.target.closest(
        '[data-place-key]'
      );

      if (!group) {
        return;
      }

      event.preventDefault();
      pickRoadPlannerLocation(
        group.dataset.placeKey
      );
    };'''
new_known_activation = '''    const handleKnownLocationActivation = event => {
      const group = event.target.closest(
        '[data-place-key]'
      );

      if (!group) {
        return;
      }

      const placeKey = group.dataset.placeKey;

      if (mapSelectedRouteKey === MAP_ROUTE_MODE_ROAD_PLANNER) {
        event.preventDefault();
        pickRoadPlannerLocation(placeKey);
        return;
      }

      if (
        mapSelectedRouteKey === MAP_ROUTE_MODE_CUSTOM_ARTIFACT &&
        isCustomArtifactBaseKey(placeKey)
      ) {
        event.preventDefault();
        const candidate = getCustomArtifactCandidates().find(
          item => item.id === `base:${placeKey}`
        );
        toggleCustomArtifactSelection(candidate);
      }
    };'''
app = replace_once(app, old_known_activation, new_known_activation, "known location base click")

# Don't stop propagation for passive location labels in non-interactive modes.
old_pointer_stop = '''      event => {
        if (event.target.closest('[data-place-key]')) {
          event.stopPropagation();
        }
      }'''
new_pointer_stop = '''      event => {
        const group = event.target.closest('[data-place-key]');
        const key = group?.dataset?.placeKey || '';
        const interactive =
          mapSelectedRouteKey === MAP_ROUTE_MODE_ROAD_PLANNER ||
          (
            mapSelectedRouteKey === MAP_ROUTE_MODE_CUSTOM_ARTIFACT &&
            isCustomArtifactBaseKey(key)
          );
        if (group && interactive) {
          event.stopPropagation();
        }
      }'''
app = replace_once(app, old_pointer_stop, new_pointer_stop, "known location pointer pass-through")

# click handler shouldn't block map when labels are passive.
old_click_handler = '''    els.mapKnownLocationsLayer.addEventListener(
      'click',
      event => {
        event.stopPropagation();
        handleKnownLocationActivation(event);
      }
    );'''
new_click_handler = '''    els.mapKnownLocationsLayer.addEventListener(
      'click',
      event => {
        const group = event.target.closest('[data-place-key]');
        const key = group?.dataset?.placeKey || '';
        const interactive =
          mapSelectedRouteKey === MAP_ROUTE_MODE_ROAD_PLANNER ||
          (
            mapSelectedRouteKey === MAP_ROUTE_MODE_CUSTOM_ARTIFACT &&
            isCustomArtifactBaseKey(key)
          );
        if (!interactive) return;
        event.stopPropagation();
        handleKnownLocationActivation(event);
      }
    );'''
app = replace_once(app, old_click_handler, new_click_handler, "known location click pass-through")

path.write_text(app, encoding="utf-8")

# ---------- style.css ----------
path = Path("style.css")
css = path.read_text(encoding="utf-8")
css += r'''

/* PWA v127 — базы в маршруте по артефактам + единая кнопка «В ПУТЬ». */
.map-custom-base-point {
  fill: rgba(9, 18, 12, .98) !important;
  stroke: var(--accent-2) !important;
  stroke-width: 2.4px !important;
}

.map-known-location.is-artifact-base:not(.is-selected) .map-known-location-pin {
  stroke-dasharray: 3 2;
}

.map-known-location.is-artifact-base {
  cursor: pointer;
}

.map-journey-btn:disabled {
  opacity: .42;
  cursor: not-allowed;
}
'''
path.write_text(css, encoding="utf-8")

# ---------- service-worker.js ----------
path = Path("service-worker.js")
sw = path.read_text(encoding="utf-8")
sw = sw.replace("stalker2-zone-clock-app-v126", "stalker2-zone-clock-app-v127")
sw = sw.replace("stalker2-zone-clock-map-v126", "stalker2-zone-clock-map-v127")
path.write_text(sw, encoding="utf-8")

# ---------- README ----------
path = Path("README.txt")
readme = path.read_text(encoding="utf-8")
readme += """\n\nВерсия 127:\n- кнопка «В ПУТЬ» доступна для всех типов маршрутов и активируется после готовности текущего маршрута;\n- «В ПУТЬ» поддерживает маршруты по местоположениям, по артефактам/базам, сохранённые пользовательские маршруты и готовые маршруты;\n- в маршруте по артефактам можно добавлять базы из отдельного списка;\n- базы также можно добавлять нажатием на их точки/названия на карте;\n- выбранные базы участвуют в построении дорожного пути и получают номер в общей последовательности;\n- версия офлайн-кэша повышена до v127.\n"""
path.write_text(readme, encoding="utf-8")
