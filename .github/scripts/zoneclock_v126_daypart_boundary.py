from pathlib import Path

def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected 1 match, got {count}")
    return text.replace(old, new, 1)

# index.html
path = Path("index.html")
html = path.read_text(encoding="utf-8")

old_top = '''<div class="row between wrap top-line">
<span class="section-label">ВРЕМЯ В ЗОНЕ</span>
<span class="status-chip" id="daypart">ДЕНЬ</span>
</div>
<button aria-label="Изменить время Зоны" aria-live="polite" class="clock clock-edit-trigger" id="clock" title="Нажмите, чтобы изменить время" type="button">18:47</button>
<div class="game-day-line">День <strong id="gameDay">1</strong></div>
<div class="hero-stats hero-stats-single">
<div class="align-right">
<span class="muted" id="boundaryLabel">До ночи</span>
<strong id="boundary">—</strong>
</div>
</div>'''

new_top = '''<div class="row between wrap top-line">
<span class="section-label">ВРЕМЯ В ЗОНЕ</span>
<div class="daypart-stack">
<span class="status-chip" id="daypart">ДЕНЬ</span>
<div class="daypart-boundary"><span id="boundaryLabel">До ночи</span> <strong id="boundary">—</strong></div>
</div>
</div>
<button aria-label="Изменить время Зоны" aria-live="polite" class="clock clock-edit-trigger" id="clock" title="Нажмите, чтобы изменить время" type="button">18:47</button>
<div class="game-day-line">День <strong id="gameDay">1</strong></div>'''

html = replace_once(html, old_top, new_top, "move boundary under daypart")
html = html.replace('ZONE CLOCK <strong>v1.25</strong>', 'ZONE CLOCK <strong>v1.26</strong>')
path.write_text(html, encoding="utf-8")

# style.css
path = Path("style.css")
css = path.read_text(encoding="utf-8")
css += r'''

/* PWA v126 — граница следующего периода под УТРО/ДЕНЬ справа. */
.daypart-stack {
  display: grid;
  justify-items: end;
  gap: 5px;
}

.daypart-boundary {
  color: var(--muted);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: .68rem;
  line-height: 1.2;
  white-space: nowrap;
}

.daypart-boundary strong {
  color: var(--text);
  margin-left: 3px;
  font-weight: 800;
}

@media (max-width: 420px) {
  .daypart-boundary {
    font-size: .63rem;
  }
}
'''
path.write_text(css, encoding="utf-8")

# service worker
path = Path("service-worker.js")
sw = path.read_text(encoding="utf-8")
sw = sw.replace("stalker2-zone-clock-app-v125", "stalker2-zone-clock-app-v126")
sw = sw.replace("stalker2-zone-clock-map-v125", "stalker2-zone-clock-map-v126")
path.write_text(sw, encoding="utf-8")

# README
path = Path("README.txt")
readme = path.read_text(encoding="utf-8")
readme += """\n\nВерсия 126:\n- текст «До дня / До ночи / Рассвет через …» перенесён под плашку «УТРО / ДЕНЬ / ВЕЧЕР / НОЧЬ» справа от «ВРЕМЯ В ЗОНЕ»;\n- прежний отдельный нижний блок этого показателя удалён;\n- версия офлайн-кэша повышена до v126.\n"""
path.write_text(readme, encoding="utf-8")
