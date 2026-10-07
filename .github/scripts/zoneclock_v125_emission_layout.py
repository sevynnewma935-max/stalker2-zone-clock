from pathlib import Path

def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected 1 match, got {count}")
    return text.replace(old, new, 1)

# style.css
path = Path("style.css")
css = path.read_text(encoding="utf-8")
css += r'''

/* PWA v125 — последний выброс отдельной строкой, кнопка на всю ширину. */
.risk-emission-row {
  grid-template-columns: 1fr !important;
  align-items: stretch !important;
  gap: 7px !important;
}

.risk-emission-last {
  width: 100%;
  font-size: .66rem !important;
  line-height: 1.3;
}

.risk-emission-btn {
  width: 100%;
  min-height: 42px;
  display: block;
  font-size: .72rem !important;
}

@media (max-width: 420px) {
  .risk-emission-row {
    grid-template-columns: 1fr !important;
    gap: 6px !important;
  }

  .risk-emission-last {
    font-size: .63rem !important;
  }

  .risk-emission-btn {
    width: 100%;
    font-size: .68rem !important;
  }
}
'''
path.write_text(css, encoding="utf-8")

# index.html visible version
path = Path("index.html")
html = path.read_text(encoding="utf-8")
html = html.replace('ZONE CLOCK <strong>v1.24</strong>', 'ZONE CLOCK <strong>v1.25</strong>')
path.write_text(html, encoding="utf-8")

# service worker cache
path = Path("service-worker.js")
sw = path.read_text(encoding="utf-8")
sw = sw.replace("stalker2-zone-clock-app-v124", "stalker2-zone-clock-app-v125")
sw = sw.replace("stalker2-zone-clock-map-v124", "stalker2-zone-clock-map-v125")
path.write_text(sw, encoding="utf-8")

# README
path = Path("README.txt")
readme = path.read_text(encoding="utf-8")
readme += """\n\nВерсия 125:\n- в блоке вероятности выброса строка «Последний выброс был …» вынесена на всю ширину мелким шрифтом;\n- кнопка «ОТМЕТИТЬ ВЫБРОС» перенесена ниже и растянута на всю ширину;\n- версия офлайн-кэша повышена до v125.\n"""
path.write_text(readme, encoding="utf-8")
