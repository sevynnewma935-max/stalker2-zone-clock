from pathlib import Path

def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected 1 match, got {count}")
    return text.replace(old, new, 1)

# app.js — скрываем ошибочный артефакт возле Цементного завода
path = Path("app.js")
app = path.read_text(encoding="utf-8")
app = replace_once(
    app,
    "{ routeKey: 'garbage_cement_cooling', exclude: new Set([3, 13]) },",
    "{ routeKey: 'garbage_cement_cooling', exclude: new Set([3, 6, 13]) },",
    "remove cement artifact marker index 6"
)
path.write_text(app, encoding="utf-8")

# visible version
path = Path("index.html")
html = path.read_text(encoding="utf-8")
html = html.replace("ZONE CLOCK <strong>v1.28</strong>", "ZONE CLOCK <strong>v1.29</strong>")
path.write_text(html, encoding="utf-8")

# caches
path = Path("service-worker.js")
sw = path.read_text(encoding="utf-8")
sw = sw.replace("stalker2-zone-clock-app-v128", "stalker2-zone-clock-app-v129")
sw = sw.replace("stalker2-zone-clock-map-v128", "stalker2-zone-clock-map-v129")
path.write_text(sw, encoding="utf-8")

# README
path = Path("README.txt")
readme = path.read_text(encoding="utf-8")
readme += """

Версия 129:
- с карты артефактов удалена ошибочная точка возле Цементного завода (маркер маршрута garbage_cement_cooling №6, координаты 1187.4 / 993.9);
- исходный индекс остальных маркеров сохранён, поэтому сохранённые отметки и маршруты не сдвигаются;
- версия офлайн-кэша повышена до v129.
"""
path.write_text(readme, encoding="utf-8")
