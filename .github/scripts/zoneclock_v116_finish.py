from pathlib import Path


def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected 1 match, got {count}")
    return text.replace(old, new, 1)


p = Path("app.js")
s = p.read_text(encoding="utf-8")

s = replace_once(
    s,
    "      const hasMeasuredPoints =\n        mapMeasurePoints.length > 0;\n\n"
    "      els.mapFullscreenResetPointsBtn.disabled =\n"
    "        !(hasSelectedLocationPoints || hasSelectedArtifactPoints || hasMeasuredPoints);\n\n"
    "      els.mapFullscreenResetPointsBtn.title =\n"
    "        hasSelectedLocationPoints || hasSelectedArtifactPoints\n"
    "          ? 'Сбросить выбранные точки маршрута'\n"
    "          : 'Сбросить выбранные точки';\n",
    "      const hasMeasuredPoints =\n        mapMeasurePoints.length > 0;\n"
    "      const hasMovementTestPoints = (() => {\n"
    "        if (mapSelectedRouteKey !== MAP_ROUTE_MODE_MOVEMENT_TEST) return false;\n"
    "        try {\n"
    "          const points = JSON.parse(localStorage.getItem(MOVEMENT_TEST_CUSTOM_ROUTE_KEY) || '[]');\n"
    "          return Array.isArray(points) && points.length > 0;\n"
    "        } catch (_) {\n"
    "          return false;\n"
    "        }\n"
    "      })();\n\n"
    "      els.mapFullscreenResetPointsBtn.disabled =\n"
    "        !(hasSelectedLocationPoints || hasSelectedArtifactPoints || hasMeasuredPoints || hasMovementTestPoints);\n\n"
    "      els.mapFullscreenResetPointsBtn.title =\n"
    "        hasSelectedLocationPoints || hasSelectedArtifactPoints || hasMovementTestPoints\n"
    "          ? 'Сбросить выбранные точки маршрута'\n"
    "          : 'Сбросить выбранные точки';\n",
    "fullscreen reset availability",
)

s = replace_once(
    s,
    "    if (els.mapDialog) els.mapDialog.classList.toggle('movement-test-editing', active);\n"
    "    if (els.mapRouteStartWrap && active) els.mapRouteStartWrap.hidden = true;\n",
    "    if (els.mapDialog) els.mapDialog.classList.toggle('movement-test-editing', active);\n"
    "    if (els.mapRouteSelect) els.mapRouteSelect.disabled = active;\n"
    "    if (els.mapRouteStartWrap && active) els.mapRouteStartWrap.hidden = true;\n",
    "lock route selector while editing",
)

s = replace_once(
    s,
    "  function returnToMovementTest() {\n"
    "    if (els.mapDialog) els.mapDialog.classList.remove('movement-test-editing');\n",
    "  function returnToMovementTest() {\n"
    "    if (els.mapDialog) els.mapDialog.classList.remove('movement-test-editing');\n"
    "    if (els.mapRouteSelect) els.mapRouteSelect.disabled = false;\n"
    "    if (els.mapMovementTestDoneBtn) els.mapMovementTestDoneBtn.hidden = true;\n",
    "return from route editor",
)

p.write_text(s, encoding="utf-8")
print("v116 final UI fixes applied")
