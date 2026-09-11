from pathlib import Path

# style.css — in the normal (non-fullscreen) map window, show the map immediately
# after the compact header; all controls/details follow below it.
path = Path('style.css')
css = path.read_text(encoding='utf-8')
block = r'''

/* PWA v121 — при открытии окна сначала карта, затем остальные блоки. */
.map-dialog:not(.map-fullscreen) .map-modal > * {
  order: 2;
}

.map-dialog:not(.map-fullscreen) .map-modal-header {
  order: 0;
}

.map-dialog:not(.map-fullscreen) .map-viewport {
  order: 1;
}
'''
if 'PWA v121 — при открытии окна сначала карта' not in css:
    css += block
path.write_text(css, encoding='utf-8')

# index.html visible version
path = Path('index.html')
html = path.read_text(encoding='utf-8')
html = html.replace('ZONE CLOCK <strong>v1.20</strong>', 'ZONE CLOCK <strong>v1.21</strong>')
path.write_text(html, encoding='utf-8')

# service worker cache version
path = Path('service-worker.js')
sw = path.read_text(encoding='utf-8')
sw = sw.replace('stalker2-zone-clock-app-v120', 'stalker2-zone-clock-app-v121')
sw = sw.replace('stalker2-zone-clock-map-v120', 'stalker2-zone-clock-map-v121')
path.write_text(sw, encoding='utf-8')

# README
path = Path('README.txt')
readme = path.read_text(encoding='utf-8')
readme += '''\n\nВерсия 121:\n- в обычном окне карты сразу после шапки показывается сама карта;\n- панели управления, выбор маршрутов и остальные блоки перенесены визуально ниже карты;\n- полноэкранный режим карты сохранён без изменений;\n- версия офлайн-кэша повышена до v121.\n'''
path.write_text(readme, encoding='utf-8')
