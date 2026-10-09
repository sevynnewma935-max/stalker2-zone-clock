from pathlib import Path

def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected 1 match, got {count}")
    return text.replace(old, new, 1)

# ---------- index.html ----------
path = Path("index.html")
html = path.read_text(encoding="utf-8")

old = """<div class="map-artifact-visit-hint" id="mapArtifactVisitHint">
        Артефакты: нажмите точку после сбора. До 2 суток — СОБРАН, 2–3 суток — ВОЗМОЖНО ПОЯВИЛСЯ, после 3 суток — ПОРА ПРОВЕРИТЬ.
      </div>
<details class="map-road-planner" id="mapRoadPlanner">"""

new = """<div class="map-artifact-visit-hint" id="mapArtifactVisitHint">
        Артефакты: нажмите точку после сбора. До 2 суток — СОБРАН, 2–3 суток — ВОЗМОЖНО ПОЯВИЛСЯ, после 3 суток — ПОРА ПРОВЕРИТЬ.
      </div>
<details class="artifact-inventory" id="artifactInventory">
<summary><span>МОИ АРТЕФАКТЫ</span><strong id="artifactInventoryTotal">0 шт.</strong></summary>
<div class="artifact-inventory-body">
<form class="artifact-inventory-add" id="artifactInventoryForm">
<input autocomplete="off" id="artifactInventoryName" maxlength="50" placeholder="Название артефакта" type="text"/>
<button class="btn primary" type="submit">ДОБАВИТЬ</button>
</form>
<div class="artifact-inventory-note">«Нашёл +1» увеличивает количество. «Продал −1» вычитает один артефакт. Нулевые позиции остаются в списке.</div>
<div class="artifact-inventory-list" id="artifactInventoryList"></div>
</div>
</details>
<details class="map-road-planner" id="mapRoadPlanner">"""

html = replace_once(html, old, new, "artifact inventory html")
html = html.replace("ZONE CLOCK <strong>v1.27</strong>", "ZONE CLOCK <strong>v1.28</strong>")
path.write_text(html, encoding="utf-8")

# ---------- app.js ----------
path = Path("app.js")
app = path.read_text(encoding="utf-8")

app = replace_once(
    app,
    "  const ROUTE_RECORD_ACTIVE_KEY = 'stalker2-zone-clock-route-record-active-v1';\n",
    "  const ROUTE_RECORD_ACTIVE_KEY = 'stalker2-zone-clock-route-record-active-v1';\n  const ARTIFACT_INVENTORY_KEY = 'stalker2-zone-clock-artifact-inventory-v1';\n",
    "inventory storage key"
)

app = replace_once(
    app,
    "    mapArtifactVisitHint: $('mapArtifactVisitHint'),\n",
    "    mapArtifactVisitHint: $('mapArtifactVisitHint'),\n    artifactInventory: $('artifactInventory'),\n    artifactInventoryForm: $('artifactInventoryForm'),\n    artifactInventoryName: $('artifactInventoryName'),\n    artifactInventoryList: $('artifactInventoryList'),\n    artifactInventoryTotal: $('artifactInventoryTotal'),\n",
    "inventory refs"
)

app = replace_once(
    app,
    """  let mapCustomArtifactSequence = [];
  let mapCustomArtifactRoutePoints = [];
  let mapCustomArtifactMeters = 0;
  let mapCustomArtifactBusy = false;
  let mapCustomArtifactBuildTimer = 0;""",
    """  let mapCustomArtifactSequence = [];
  let mapCustomArtifactRoutePoints = [];
  let mapCustomArtifactRouteLegs = [];
  let mapCustomArtifactMeters = 0;
  let mapCustomArtifactBusy = false;
  let mapCustomArtifactBuildTimer = 0;
  let mapCustomArtifactJourneyVisited = new Set();""",
    "custom artifact route state"
)

# Patch only the custom-artifact build function.
start = app.index("  async function buildCustomArtifactRoute() {")
end = app.index("  function clearCustomArtifactRoute() {", start)
block = app[start:end]

block = replace_once(
    block,
    """      const grid = await loadRoadPlannerCostGrid();
      const fullPath = [];
      let totalMeters = 0;""",
    """      const grid = await loadRoadPlannerCostGrid();
      const fullPath = [];
      const routeLegs = [];
      let totalMeters = 0;""",
    "custom route legs init"
)

block = replace_once(
    block,
    """        const simplified = simplifyRoadScreenPoints(logicalPath, 2.2);
        if (fullPath.length) fullPath.push(...simplified.slice(1));
        else fullPath.push(...simplified);
        totalMeters += plannerPathMeters(simplified);
      }

      mapCustomArtifactRoutePoints = fullPath;
      mapCustomArtifactMeters = totalMeters;""",
    """        const simplified = simplifyRoadScreenPoints(logicalPath, 2.2);
        routeLegs.push(simplified);
        if (fullPath.length) fullPath.push(...simplified.slice(1));
        else fullPath.push(...simplified);
        totalMeters += plannerPathMeters(simplified);
      }

      mapCustomArtifactRoutePoints = fullPath;
      mapCustomArtifactRouteLegs = routeLegs;
      mapCustomArtifactMeters = totalMeters;""",
    "custom route legs store"
)

block = replace_once(
    block,
    """      mapCustomArtifactRoutePoints = mapCustomArtifactSequence.map(item => ({
        x: item.x,
        y: item.y
      }));
      mapCustomArtifactMeters = plannerPathMeters(mapCustomArtifactRoutePoints);""",
    """      mapCustomArtifactRoutePoints = mapCustomArtifactSequence.map(item => ({
        x: item.x,
        y: item.y
      }));
      mapCustomArtifactRouteLegs = [];
      for (let index = 0; index < mapCustomArtifactRoutePoints.length - 1; index++) {
        mapCustomArtifactRouteLegs.push([
          mapCustomArtifactRoutePoints[index],
          mapCustomArtifactRoutePoints[index + 1]
        ]);
      }
      mapCustomArtifactMeters = plannerPathMeters(mapCustomArtifactRoutePoints);""",
    "custom route legs fallback"
)

app = app[:start] + block + app[end:]

app = replace_once(
    app,
    """  function clearCustomArtifactRoute() {
    window.clearTimeout(mapCustomArtifactBuildTimer);
    mapCustomArtifactSequence = [];
    mapCustomArtifactRoutePoints = [];
    mapCustomArtifactMeters = 0;""",
    """  function clearCustomArtifactRoute() {
    window.clearTimeout(mapCustomArtifactBuildTimer);
    mapCustomArtifactSequence = [];
    mapCustomArtifactRoutePoints = [];
    mapCustomArtifactRouteLegs = [];
    mapCustomArtifactJourneyVisited = new Set();
    mapCustomArtifactMeters = 0;""",
    "clear custom artifact route"
)

# During an active artifact journey, tapping a selected stop means "reached/taken",
# not "remove from route".
app = replace_once(
    app,
    """  function toggleCustomArtifactSelection(candidate) {
    if (!candidate) return;
    const existingIndex = mapCustomArtifactSequence.findIndex(
      item => item.id === candidate.id
    );""",
    """  function toggleCustomArtifactSelection(candidate) {
    if (!candidate) return;

    if (
      mapJourneyActive &&
      mapJourneyPlan &&
      mapJourneyPlan.routeKey === MAP_ROUTE_MODE_CUSTOM_ARTIFACT
    ) {
      const journeyIndex = mapCustomArtifactSequence.findIndex(
        item => item.id === candidate.id
      );
      if (journeyIndex >= 0) {
        markCustomArtifactJourneyStop(journeyIndex, candidate);
      }
      return;
    }

    mapCustomArtifactJourneyVisited = new Set();
    const existingIndex = mapCustomArtifactSequence.findIndex(
      item => item.id === candidate.id
    );""",
    "custom selection while journey active"
)

# Route editing invalidates old per-leg geometry.
app = replace_once(
    app,
    """    mapCustomArtifactRoutePoints = [];
    mapCustomArtifactMeters = 0;
    saveCustomArtifactRoute();""",
    """    mapCustomArtifactRoutePoints = [];
    mapCustomArtifactRouteLegs = [];
    mapCustomArtifactMeters = 0;
    saveCustomArtifactRoute();""",
    "reset legs on custom route edit"
)

# Visual state: in an active custom route use this journey's progress.
app = replace_once(
    app,
    """      const elapsed = isBase
        ? null
        : artifactElapsedSeconds(
            candidate.routeKey,
            candidate.markerIndex
          );
      const isVisited = !isBase && elapsed !== null;
      const respawnState = isBase
        ? { key: 'base' }
        : artifactRespawnState(elapsed);""",
    """      const customJourneyActive = Boolean(
        mapJourneyActive &&
        mapJourneyPlan &&
        mapJourneyPlan.routeKey === MAP_ROUTE_MODE_CUSTOM_ARTIFACT
      );
      const takenThisJourney = Boolean(
        customJourneyActive &&
        selectedIndex >= 0 &&
        mapCustomArtifactJourneyVisited.has(selectedIndex)
      );
      const elapsed = isBase
        ? null
        : artifactElapsedSeconds(
            candidate.routeKey,
            candidate.markerIndex
          );
      const isVisited = isBase
        ? takenThisJourney
        : customJourneyActive && selectedIndex >= 0
          ? takenThisJourney
          : elapsed !== null;
      const respawnState = isBase
        ? { key: 'base' }
        : artifactRespawnState(elapsed);""",
    "journey visual progress"
)

app = replace_once(
    app,
    "      if (!isBase && !isVisited && selectedIndex < 0) {",
    "      if (!isBase && !isVisited) {",
    "pulse uncollected artifact points"
)

# Progressive path: hide legs already passed.
app = replace_once(
    app,
    """    const routeScreen = mapCustomArtifactRoutePoints.map(routePointToScreen);
    const simplified = simplifyRoadScreenPoints(routeScreen, 1.8);
    els.mapCustomArtifactPath.setAttribute(
      'd',
      routeScreen.length >= 2 ? buildSmoothScreenChain(simplified) : ''
    );""",
    """    let visibleRoutePoints = mapCustomArtifactRoutePoints;

    const customJourneyActive = Boolean(
      mapJourneyActive &&
      mapJourneyPlan &&
      mapJourneyPlan.routeKey === MAP_ROUTE_MODE_CUSTOM_ARTIFACT
    );

    if (customJourneyActive && mapCustomArtifactRouteLegs.length) {
      let latestVisited = -1;
      mapCustomArtifactJourneyVisited.forEach(index => {
        latestVisited = Math.max(latestVisited, Number(index));
      });

      const firstVisibleLeg = Math.max(0, latestVisited);
      const visibleLegs = mapCustomArtifactRouteLegs.slice(firstVisibleLeg);
      visibleRoutePoints = [];

      visibleLegs.forEach(leg => {
        if (!Array.isArray(leg) || !leg.length) return;
        if (visibleRoutePoints.length) visibleRoutePoints.push(...leg.slice(1));
        else visibleRoutePoints.push(...leg);
      });
    }

    const routeScreen = visibleRoutePoints.map(routePointToScreen);
    const simplified = simplifyRoadScreenPoints(routeScreen, 1.8);
    els.mapCustomArtifactPath.setAttribute(
      'd',
      routeScreen.length >= 2 ? buildSmoothScreenChain(simplified) : ''
    );""",
    "progressive custom route path"
)

progress_code = """  function firstUnvisitedCustomArtifactJourneyIndex() {
    for (let index = 0; index < mapCustomArtifactSequence.length; index++) {
      if (!mapCustomArtifactJourneyVisited.has(index)) return index;
    }
    return Math.max(0, mapCustomArtifactSequence.length - 1);
  }

  function markCustomArtifactJourneyStop(sequenceIndex, candidate = null) {
    if (
      !mapJourneyActive ||
      !mapJourneyPlan ||
      mapJourneyPlan.routeKey !== MAP_ROUTE_MODE_CUSTOM_ARTIFACT ||
      !Number.isInteger(sequenceIndex) ||
      sequenceIndex < 0 ||
      sequenceIndex >= mapCustomArtifactSequence.length
    ) {
      return;
    }

    const expectedIndex = firstUnvisitedCustomArtifactJourneyIndex();
    const stop = candidate || mapCustomArtifactSequence[sequenceIndex];

    if (mapCustomArtifactJourneyVisited.has(sequenceIndex)) {
      const next = mapCustomArtifactSequence[
        Math.min(mapCustomArtifactSequence.length - 1, sequenceIndex + 1)
      ];
      focusJourneyPoints(
        next && next !== stop ? [stop, next] : [stop],
        650,
        true
      );
      return;
    }

    if (sequenceIndex !== expectedIndex) {
      const expected = mapCustomArtifactSequence[expectedIndex];
      if (els.mapArtifactVisitHint && expected) {
        els.mapArtifactVisitHint.textContent =
          'Следующая точка маршрута: ' + expected.label + '.';
      }
      return;
    }

    mapCustomArtifactJourneyVisited.add(sequenceIndex);

    if (
      stop &&
      stop.kind !== 'base' &&
      stop.routeKey &&
      Number.isInteger(stop.markerIndex)
    ) {
      mapArtifactVisits[
        artifactVisitKey(stop.routeKey, stop.markerIndex)
      ] = absoluteGameSeconds;
      saveVisitedArtifacts();
    }

    renderCustomArtifactRoute();
    renderKnownLocationsLayer();
    updateCustomArtifactRouteGeometry();

    const hasNext = sequenceIndex < mapCustomArtifactSequence.length - 1;
    const next = hasNext
      ? mapCustomArtifactSequence[sequenceIndex + 1]
      : null;

    if (els.mapArtifactVisitHint) {
      els.mapArtifactVisitHint.textContent = hasNext
        ? stop.label + ' отмечена. Следующая точка: ' + next.label + '.'
        : stop.label + ' отмечена. Маршрут завершён.';
    }

    window.setTimeout(() => {
      focusJourneyPoints(
        next ? [stop, next] : [stop],
        850,
        true
      );
    }, 120);
  }

"""

app = replace_once(
    app,
    "  function getSelectedRouteMetrics() {",
    progress_code + "  function getSelectedRouteMetrics() {",
    "custom journey progress functions"
)

# Reset current-run progress when starting the route.
app = replace_once(
    app,
    """      mapJourneyPlan = isCustomArtifactMode
        ? getCustomArtifactJourneyPlan()
        : getMovementJourneyPlan();

      mapJourneyActive = true;
      mapJourneySequence = isCustomArtifactMode""",
    """      mapJourneyPlan = isCustomArtifactMode
        ? getCustomArtifactJourneyPlan()
        : getMovementJourneyPlan();

      mapJourneyActive = true;
      if (isCustomArtifactMode) {
        mapCustomArtifactJourneyVisited = new Set();
        renderCustomArtifactRoute();
        renderKnownLocationsLayer();
        updateCustomArtifactRouteGeometry();
      }
      mapJourneySequence = isCustomArtifactMode""",
    "reset progress at artifact journey start"
)

# Inventory logic.
inventory_logic = """  // PWA v128 — учёт найденных и проданных артефактов.
  function normalizeArtifactInventoryName(value) {
    return String(value || '')
      .trim()
      .replace(/\\s+/g, ' ')
      .slice(0, 50);
  }

  function loadArtifactInventory() {
    try {
      const parsed = JSON.parse(localStorage.getItem(ARTIFACT_INVENTORY_KEY) || '[]');
      if (!Array.isArray(parsed)) return [];
      return parsed
        .map(item => ({
          id: String(item && item.id || '').slice(0, 80),
          name: normalizeArtifactInventoryName(item && item.name),
          count: Math.max(0, Math.floor(Number(item && item.count) || 0))
        }))
        .filter(item => item.id && item.name)
        .slice(0, 200);
    } catch (_) {
      return [];
    }
  }

  let artifactInventoryItems = loadArtifactInventory();

  function saveArtifactInventory() {
    localStorage.setItem(
      ARTIFACT_INVENTORY_KEY,
      JSON.stringify(artifactInventoryItems.slice(0, 200))
    );
  }

  function makeArtifactInventoryId() {
    return 'artifact_' + Date.now().toString(36) + '_' +
      Math.random().toString(36).slice(2, 8);
  }

  function renderArtifactInventory() {
    if (!els.artifactInventoryList) return;

    const items = artifactInventoryItems
      .slice()
      .sort((a, b) => {
        const stockDelta = Number(b.count > 0) - Number(a.count > 0);
        if (stockDelta) return stockDelta;
        return a.name.localeCompare(b.name, 'ru');
      });

    els.artifactInventoryList.innerHTML = '';

    if (els.artifactInventoryTotal) {
      const total = items.reduce((sum, item) => sum + item.count, 0);
      els.artifactInventoryTotal.textContent = total + ' шт.';
    }

    if (!items.length) {
      const empty = document.createElement('div');
      empty.className = 'artifact-inventory-empty';
      empty.textContent = 'Список пуст. Добавьте название первого артефакта.';
      els.artifactInventoryList.appendChild(empty);
      return;
    }

    items.forEach(item => {
      const row = document.createElement('div');
      row.className = 'artifact-inventory-row' + (item.count > 0 ? ' has-stock' : '');
      row.dataset.artifactInventoryId = item.id;

      const info = document.createElement('div');
      info.className = 'artifact-inventory-info';

      const name = document.createElement('strong');
      name.textContent = item.name;

      const count = document.createElement('span');
      count.textContent = '×' + item.count;

      info.append(name, count);

      const actions = document.createElement('div');
      actions.className = 'artifact-inventory-actions';

      const found = document.createElement('button');
      found.type = 'button';
      found.className = 'btn artifact-inventory-found';
      found.dataset.inventoryAction = 'found';
      found.textContent = 'НАШЁЛ +1';

      const sold = document.createElement('button');
      sold.type = 'button';
      sold.className = 'btn artifact-inventory-sold';
      sold.dataset.inventoryAction = 'sold';
      sold.textContent = 'ПРОДАЛ −1';
      sold.disabled = item.count <= 0;

      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'btn artifact-inventory-remove';
      remove.dataset.inventoryAction = 'remove';
      remove.textContent = '×';
      remove.setAttribute('aria-label', 'Удалить ' + item.name + ' из списка');

      actions.append(found, sold, remove);
      row.append(info, actions);
      els.artifactInventoryList.appendChild(row);
    });
  }

  function addArtifactInventoryItem(nameValue) {
    const name = normalizeArtifactInventoryName(nameValue);
    if (!name) return;

    const lower = name.toLocaleLowerCase('ru-RU');
    const existing = artifactInventoryItems.find(
      item => item.name.toLocaleLowerCase('ru-RU') === lower
    );

    if (existing) {
      existing.count += 1;
    } else {
      artifactInventoryItems.push({
        id: makeArtifactInventoryId(),
        name,
        count: 1
      });
    }

    saveArtifactInventory();
    renderArtifactInventory();
  }

  function changeArtifactInventoryCount(id, delta) {
    const item = artifactInventoryItems.find(entry => entry.id === id);
    if (!item) return;
    item.count = Math.max(0, item.count + delta);
    saveArtifactInventory();
    renderArtifactInventory();
  }

  function removeArtifactInventoryItem(id) {
    artifactInventoryItems = artifactInventoryItems.filter(item => item.id !== id);
    saveArtifactInventory();
    renderArtifactInventory();
  }

  if (els.artifactInventoryForm) {
    els.artifactInventoryForm.addEventListener('submit', event => {
      event.preventDefault();
      const name = normalizeArtifactInventoryName(
        els.artifactInventoryName && els.artifactInventoryName.value
      );
      if (!name) {
        if (els.artifactInventoryName) els.artifactInventoryName.focus();
        return;
      }
      addArtifactInventoryItem(name);
      if (els.artifactInventoryName) {
        els.artifactInventoryName.value = '';
        els.artifactInventoryName.focus();
      }
    });
  }

  if (els.artifactInventoryList) {
    els.artifactInventoryList.addEventListener('click', event => {
      const button = event.target.closest('[data-inventory-action]');
      if (!button) return;
      const row = button.closest('[data-artifact-inventory-id]');
      const id = row && row.dataset ? row.dataset.artifactInventoryId : '';
      if (!id) return;

      const action = button.dataset.inventoryAction;
      if (action === 'found') changeArtifactInventoryCount(id, 1);
      if (action === 'sold') changeArtifactInventoryCount(id, -1);
      if (action === 'remove') removeArtifactInventoryItem(id);
    });
  }

  renderArtifactInventory();

"""

app = replace_once(
    app,
    "  const DAYLIGHT_EVENT_LABELS = {",
    inventory_logic + "  const DAYLIGHT_EVENT_LABELS = {",
    "artifact inventory logic"
)

app = app.replace(
    "link.download = 'zone-clock-test-v118.csv';",
    "link.download = 'zone-clock-test-v128.csv';"
)

path.write_text(app, encoding="utf-8")

# ---------- style.css ----------
path = Path("style.css")
css = path.read_text(encoding="utf-8")
css += """

/* PWA v128 — прогресс маршрута по артефактам и инвентарь. */
@keyframes zoneArtifactJourneyPulse {
  0%, 100% {
    opacity: .38;
    stroke-width: 2px;
    filter: drop-shadow(0 0 2px rgba(99, 255, 122, .55));
  }
  50% {
    opacity: 1;
    stroke-width: 4px;
    filter: drop-shadow(0 0 6px rgba(99, 255, 122, .98)) drop-shadow(0 0 12px rgba(54, 255, 90, .72));
  }
}

#mapCustomArtifactPoints .map-artifact-visit-point:not(.visited):not(.map-custom-base-point) {
  fill: rgba(18, 150, 42, .98) !important;
  stroke: #63ff7a !important;
  opacity: 1 !important;
  filter: drop-shadow(0 0 5px rgba(99, 255, 122, .82));
}

#mapCustomArtifactPoints .map-artifact-visit-point.visited {
  fill: rgba(126, 134, 128, .84) !important;
  stroke: #c5cdc7 !important;
  opacity: .46 !important;
  filter: none !important;
}

#mapCustomArtifactPoints .map-artifact-pulse-ring {
  fill: none !important;
  stroke: #63ff7a !important;
  animation: zoneArtifactJourneyPulse 1.15s ease-in-out infinite;
  pointer-events: none;
}

.artifact-inventory {
  border: 1px solid var(--border-soft);
  border-radius: 13px;
  background: rgba(7, 16, 10, .58);
  overflow: hidden;
}

.artifact-inventory > summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  cursor: pointer;
  list-style: none;
  color: var(--text);
  font-size: .7rem;
  font-weight: 800;
  letter-spacing: .08em;
}

.artifact-inventory > summary::-webkit-details-marker {
  display: none;
}

.artifact-inventory > summary strong {
  color: var(--accent-2);
  font-size: .72rem;
  white-space: nowrap;
}

.artifact-inventory-body {
  display: grid;
  gap: 10px;
  padding: 0 12px 12px;
}

.artifact-inventory-add {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 8px;
}

.artifact-inventory-add input {
  min-width: 0;
}

.artifact-inventory-note,
.artifact-inventory-empty {
  color: var(--muted);
  font-size: .63rem;
  line-height: 1.45;
}

.artifact-inventory-list {
  display: grid;
  gap: 7px;
}

.artifact-inventory-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
  padding: 9px 10px;
  border: 1px solid var(--border-soft);
  border-radius: 10px;
  background: rgba(7, 14, 9, .55);
  opacity: .62;
}

.artifact-inventory-row.has-stock {
  opacity: 1;
  border-color: rgba(99, 255, 122, .26);
}

.artifact-inventory-info {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 9px;
}

.artifact-inventory-info strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--text);
  font-size: .72rem;
}

.artifact-inventory-info span {
  color: var(--accent-2);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: .78rem;
  font-weight: 900;
  white-space: nowrap;
}

.artifact-inventory-actions {
  display: flex;
  gap: 5px;
}

.artifact-inventory-actions .btn {
  min-height: 34px;
  padding: 6px 8px;
  font-size: .54rem;
}

.artifact-inventory-remove {
  min-width: 34px;
  padding-inline: 7px !important;
}

.map-dialog.map-fullscreen .artifact-inventory {
  display: none !important;
}

@media (max-width: 620px) {
  .artifact-inventory-row {
    grid-template-columns: 1fr;
  }

  .artifact-inventory-actions {
    display: grid;
    grid-template-columns: 1fr 1fr auto;
  }

  .artifact-inventory-actions .btn {
    width: 100%;
  }
}
"""
path.write_text(css, encoding="utf-8")

# ---------- service-worker.js ----------
path = Path("service-worker.js")
sw = path.read_text(encoding="utf-8")
sw = sw.replace("stalker2-zone-clock-app-v127", "stalker2-zone-clock-app-v128")
sw = sw.replace("stalker2-zone-clock-map-v127", "stalker2-zone-clock-map-v128")
path.write_text(sw, encoding="utf-8")

# ---------- README ----------
path = Path("README.txt")
readme = path.read_text(encoding="utf-8")
readme += """

Версия 128:
- в маршруте по артефактам после отметки взятого артефакта карта автоматически показывает текущую и следующую точку;
- после отметки следующей точки уже пройденный отрезок маршрута скрывается;
- взятые в текущем маршруте артефакты становятся бледными, ещё не взятые подсвечиваются зелёным пульсирующим свечением;
- базы внутри маршрута по артефактам также поддерживают последовательное прохождение;
- добавлен блок «Мои артефакты» с ручным списком, количеством и действиями «Нашёл +1» / «Продал −1»;
- инвентарь хранится локально в браузере;
- CSV переименован в zone-clock-test-v128.csv;
- версия офлайн-кэша повышена до v128.
"""
path.write_text(readme, encoding="utf-8")
