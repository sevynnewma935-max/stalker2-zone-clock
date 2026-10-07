from pathlib import Path

def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected 1 match, got {count}")
    return text.replace(old, new, 1)

# index.html
path = Path("index.html")
html = path.read_text(encoding="utf-8")
html = replace_once(
    html,
    '<div class="run-state muted" id="runState">Часы идут</div>\n',
    '',
    'remove run state line'
)
html = html.replace('ZONE CLOCK <strong>v1.23</strong>', 'ZONE CLOCK <strong>v1.24</strong>')
path.write_text(html, encoding="utf-8")

# app.js — runState is no longer present in DOM.
path = Path("app.js")
app = path.read_text(encoding="utf-8")
app = replace_once(
    app,
    "    els.runState.textContent = running ? 'Часы идут' : 'Часы на паузе';\n",
    "    if (els.runState) els.runState.textContent = running ? 'Часы идут' : 'Часы на паузе';\n",
    'guard removed run state'
)
path.write_text(app, encoding="utf-8")

# service worker
path = Path("service-worker.js")
sw = path.read_text(encoding="utf-8")
sw = sw.replace("stalker2-zone-clock-app-v123", "stalker2-zone-clock-app-v124")
sw = sw.replace("stalker2-zone-clock-map-v123", "stalker2-zone-clock-map-v124")
path.write_text(sw, encoding="utf-8")

# README
path = Path("README.txt")
readme = path.read_text(encoding="utf-8")
readme += """\n\nВерсия 124:\n- из блока «УПРАВЛЕНИЕ ЧАСАМИ» удалена строка состояния «Часы идут / Часы на паузе»;\n- кнопки паузы и продолжения идут сразу после заголовка;\n- версия офлайн-кэша повышена до v124.\n"""
path.write_text(readme, encoding="utf-8")
