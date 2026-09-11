from pathlib import Path
import re


def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected 1 match, got {count}")
    return text.replace(old, new, 1)


# app.js
path = Path('app.js')
app = path.read_text(encoding='utf-8')

old_visibility = """    const shouldShow =
      mapSelectedRouteKey ===
      MAP_ROUTE_MODE_ROAD_PLANNER;

    els.mapKnownLocationsLayer.style.display = shouldShow ? '' : 'none';
    if (!shouldShow) {
      els.mapKnownLocationsLayer.textContent = '';
      return;
    }

    els.mapKnownLocationsLayer.textContent = '';

    visibleRoadPlannerLocations().forEach(key => {
      const place = MAP_KNOWN_LOCATIONS[key];
      const screen = routePointToScreen(place);
      const selectedIndex = mapRoadPlannerSequence.findIndex(
        item => item.placeKey === key
      );
"""
new_visibility = """    // PWA v120: locations are a permanent overlay of the Zone map, not a
    // feature of one route mode. Every current and future map background uses
    // the same map coordinate system, so this layer stays visible regardless
    // of the selected map/view/route mode.
    const plannerActive =
      mapSelectedRouteKey ===
      MAP_ROUTE_MODE_ROAD_PLANNER;

    els.mapKnownLocationsLayer.style.display = '';
    els.mapKnownLocationsLayer.textContent = '';

    visibleRoadPlannerLocations().forEach(key => {
      const place = MAP_KNOWN_LOCATIONS[key];
      const screen = routePointToScreen(place);
      const selectedIndex = plannerActive
        ? mapRoadPlannerSequence.findIndex(
            item => item.placeKey === key
          )
        : -1;
"""
app = replace_once(app, old_visibility, new_visibility, 'known location visibility')

old_classes = """      const classes = ['map-known-location'];
      if (selectedIndex >= 0) classes.push('is-selected');
      if (isVisited) classes.push('is-journey-visited');
      if (isCurrent) classes.push('is-journey-current');

      const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      group.setAttribute('class', classes.join(' '));
      group.setAttribute('data-place-key', key);
      group.setAttribute('tabindex', '0');
      group.setAttribute('role', 'button');
"""
new_classes = """      const classes = ['map-known-location'];
      if (!plannerActive) classes.push('is-passive');
      if (selectedIndex >= 0) classes.push('is-selected');
      if (isVisited) classes.push('is-journey-visited');
      if (isCurrent) classes.push('is-journey-current');

      const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      group.setAttribute('class', classes.join(' '));
      group.setAttribute('data-place-key', key);
      if (plannerActive) {
        group.setAttribute('tabindex', '0');
        group.setAttribute('role', 'button');
      } else {
        group.setAttribute('aria-label', `Местоположение: ${place.label}`);
      }
"""
app = replace_once(app, old_classes, new_classes, 'known location passive class')

# Prevent passive location labels from acting like road-planner buttons.
old_handler = """    const handleKnownLocationActivation = event => {
      const group = event.target.closest(
        '[data-place-key]'
      );
"""
new_handler = """    const handleKnownLocationActivation = event => {
      if (mapSelectedRouteKey !== MAP_ROUTE_MODE_ROAD_PLANNER) return;

      const group = event.target.closest(
        '[data-place-key]'
      );
"""
app = replace_once(app, old_handler, new_handler, 'known location activation guard')

path.write_text(app, encoding='utf-8')


# style.css
path = Path('style.css')
css = path.read_text(encoding='utf-8')
marker = """.map-known-location {
  cursor: pointer;
}
"""
replacement = """.map-known-location {
  cursor: pointer;
}

/* PWA v120 — location names belong to the map itself and stay on every map. */
.map-known-location.is-passive {
  cursor: default;
  pointer-events: none;
}

.map-known-location.is-passive .map-known-location-pin {
  opacity: .94;
}

.map-known-location.is-passive .map-known-location-label {
  opacity: 1 !important;
}
"""
css = replace_once(css, marker, replacement, 'passive location css')
path.write_text(css, encoding='utf-8')


# index.html visible version
path = Path('index.html')
html = path.read_text(encoding='utf-8')
html = html.replace('ZONE CLOCK <strong>v1.19</strong>', 'ZONE CLOCK <strong>v1.20</strong>')
path.write_text(html, encoding='utf-8')


# service worker cache version
path = Path('service-worker.js')
sw = path.read_text(encoding='utf-8')
sw = sw.replace('stalker2-zone-clock-app-v119', 'stalker2-zone-clock-app-v120')
sw = sw.replace('stalker2-zone-clock-map-v119', 'stalker2-zone-clock-map-v120')
path.write_text(sw, encoding='utf-8')


# README note
path = Path('README.txt')
readme = path.read_text(encoding='utf-8')
readme += """

Версия 120:
- точки с названиями местоположений вынесены в постоянный слой карты;
- названия отображаются на всех режимах и всех подложках карты;
- будущие карты, использующие общий координатный слой Zone Clock, автоматически получают эти точки и названия;
- вне режима построения маршрута точки являются информационными и не добавляются в маршрут по нажатию;
- версия офлайн-кэша повышена до v120.
"""
path.write_text(readme, encoding='utf-8')
