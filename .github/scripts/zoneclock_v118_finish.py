from pathlib import Path
import re

# index.html
path = Path('index.html')
html = path.read_text(encoding='utf-8')
html = html.replace('placeholder="Например: До Янова или Тестовый 1"', 'placeholder="Например: Росток → Янов"')
html = html.replace('id="mapMovementTestDoneBtn" type="button">В ТЕСТ</button>', 'id="mapMovementTestDoneBtn" type="button">ГОТОВО</button>')
path.write_text(html, encoding='utf-8')

# app.js
path = Path('app.js')
app = path.read_text(encoding='utf-8')

# Move route recorder refresh to the end of refreshSavedRouteEditorUi so its lock state wins.
app = app.replace(
    "    renderSavedRouteMapOptions();\n    if (typeof updateRouteRecordUi === 'function') updateRouteRecordUi();\n\n    if (els.mapRouteStartWrap)",
    "    renderSavedRouteMapOptions();\n\n    if (els.mapRouteStartWrap)",
    1
)
pattern = re.compile(r"(  function refreshSavedRouteEditorUi\(message = ''\) \{.*?)(\n  \}\n\n  function saveCurrentNamedRoute\(\))", re.S)
m = pattern.search(app)
if not m:
    raise SystemExit('refreshSavedRouteEditorUi block not found')
block = m.group(1)
if "updateRouteRecordUi();" not in block:
    block += "\n    if (typeof updateRouteRecordUi === 'function') updateRouteRecordUi();"
app = app[:m.start()] + block + m.group(2) + app[m.end():]

old = """    const locked = Boolean(active);
    if (els.mapSavedRouteName) els.mapSavedRouteName.disabled = locked;
    if (els.mapSavedRouteNewBtn) els.mapSavedRouteNewBtn.disabled = locked;
    if (els.mapSavedRouteSaveBtn) els.mapSavedRouteSaveBtn.disabled = locked || els.mapSavedRouteSaveBtn.disabled;
    if (els.mapSavedRouteDeleteBtn) els.mapSavedRouteDeleteBtn.disabled = locked || !selected;
    if (els.mapRouteStartSelect) els.mapRouteStartSelect.disabled = locked;
    if (els.mapUndoBtn && mapSelectedRouteKey === MAP_ROUTE_MODE_MOVEMENT_TEST) els.mapUndoBtn.disabled = locked;
    if (els.mapClearBtn && mapSelectedRouteKey === MAP_ROUTE_MODE_MOVEMENT_TEST) els.mapClearBtn.disabled = locked;
"""
new = """    const locked = Boolean(active);
    const editorMode = mapSelectedRouteKey === MAP_ROUTE_MODE_MOVEMENT_TEST;
    const editorNameReady = Boolean(normalizeSavedRouteName(movementTestEditorName));
    const editorPointsReady = movementTestCustomPoints.length >= 2;
    if (els.mapSavedRouteName) els.mapSavedRouteName.disabled = editorMode && locked;
    if (els.mapSavedRouteNewBtn) els.mapSavedRouteNewBtn.disabled = editorMode && locked;
    if (els.mapSavedRouteSaveBtn) {
      els.mapSavedRouteSaveBtn.disabled = editorMode && (locked || !editorNameReady || !editorPointsReady);
    }
    if (els.mapSavedRouteDeleteBtn) els.mapSavedRouteDeleteBtn.disabled = editorMode && (locked || !selected);
    if (els.mapRouteStartSelect && editorMode) els.mapRouteStartSelect.disabled = locked;
    if (els.mapUndoBtn && editorMode) els.mapUndoBtn.disabled = locked;
    if (els.mapClearBtn && editorMode) els.mapClearBtn.disabled = locked;
"""
if old not in app:
    raise SystemExit('route recorder lock block not found')
app = app.replace(old, new, 1)

# Export ordinary route history instead of legacy speed-test routes.
pattern = re.compile(
    r"    const movementTests = loadMovementTests\(\);\n.*?    const daylightMarks = loadDaylightMarks\(\);",
    re.S
)
replacement = """    const routeRecords = loadRouteRecords();

    rows.push([]);
    rows.push(['ЗАПИСАННЫЕ МАРШРУТЫ']);
    rows.push([
      'Маршрут',
      'Расстояние, м',
      'Реальное время, сек',
      'Время Зоны, сек',
      'Старт: день',
      'Старт: время',
      'Финиш: день',
      'Финиш: время',
      'Дата записи'
    ]);

    routeRecords.forEach(record => {
      rows.push([
        record.routeName || 'Маршрут',
        record.distanceMeters || '',
        record.realSeconds || '',
        record.zoneSeconds || '',
        record.startDay || '',
        record.startTime || '',
        record.endDay || '',
        record.endTime || '',
        record.capturedAt || ''
      ]);
    });

    const daylightMarks = loadDaylightMarks();"""
app, count = pattern.subn(replacement, app, count=1)
if count != 1:
    raise SystemExit(f'CSV movement block replacement failed: {count}')

app = app.replace("link.download = 'zone-clock-test-v116.csv';", "link.download = 'zone-clock-test-v118.csv';")
app = app.replace(
    "els.testMessage.textContent = 'Тесты времени, движения и отметки освещения очищены.';",
    "els.testMessage.textContent = 'Тест времени и отметки освещения очищены. История маршрутов сохранена.';"
)

path.write_text(app, encoding='utf-8')
