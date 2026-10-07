from pathlib import Path

def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected 1 match, got {count}")
    return text.replace(old, new, 1)

# index.html
path = Path("index.html")
html = path.read_text(encoding="utf-8")

old_risk = '''<div class="risk-zone hidden" id="riskWrap">
<div class="risk-head">
<span class="section-label">ВЕРОЯТНОСТЬ ВЫБРОСА</span>
<span class="risk-badge" id="riskBadge">НИЗКИЙ</span>
</div>
<div class="risk-title-row">
<div class="risk-title" id="riskLabel">Низкая вероятность</div>
<div aria-hidden="true" class="risk-percent" id="riskPercent">0%</div>
</div>
<div aria-hidden="true" class="risk-track">
<div class="risk-progress" id="riskProgress"></div>
</div>
<div class="risk-scale"><span>0%</span><span>50%</span><span>100%</span></div>
<p class="risk-detail" id="riskDetail"></p>
<p class="risk-next" id="riskNext"></p>
<p class="note">Ориентир, а не точный таймер. Сюжетный выброс и погодная логика игры могут изменить интервал.</p>
</div>
</section>
<section class="terminal-card emission">
<div class="terminal-corner tl"></div><div class="terminal-corner tr"></div>
<div class="terminal-corner bl"></div><div class="terminal-corner br"></div>
<div class="row between wrap gap">
<div>
<div class="section-label emission-label"><span class="radiation">☢</span> ПОСЛЕДНИЙ ВЫБРОС</div>
<div class="emission-time" id="emissionTime">Не отмечен</div>
<div class="emission-day muted" id="emissionDay"></div>
</div>
<button class="btn outline-accent" id="markEmissionBtn" type="button">ОТМЕТИТЬ ВЫБРОС</button>
</div>
</section>'''

new_risk = '''<div class="risk-zone" id="riskWrap">
<div class="risk-head">
<span class="section-label">ВЕРОЯТНОСТЬ ВЫБРОСА</span>
<span class="risk-badge" id="riskBadge">—</span>
</div>
<div class="risk-title-row">
<div class="risk-title" id="riskLabel">Нет данных о последнем выбросе</div>
<div aria-hidden="true" class="risk-percent" id="riskPercent">0%</div>
</div>
<div aria-hidden="true" class="risk-track">
<div class="risk-progress" id="riskProgress"></div>
</div>
<div class="risk-scale"><span>0%</span><span>50%</span><span>100%</span></div>
<div class="risk-emission-row">
<div class="risk-emission-last">Последний выброс был <strong id="emissionTime">не отмечен</strong></div>
<button class="btn outline-accent risk-emission-btn" id="markEmissionBtn" type="button">ОТМЕТИТЬ ВЫБРОС</button>
</div>
</div>
</section>'''

html = replace_once(html, old_risk, new_risk, "compact emission risk block")

old_correction = '''<div class="grid two-buttons correction-row">
<button class="btn utility-btn" data-shift="-30" type="button">−30 сек</button>
<button class="btn utility-btn" data-shift="30" type="button">+30 сек</button>
</div>
<div class="grid two-buttons correction-row">
<button class="btn utility-btn" data-shift="-60" type="button">−1 мин</button>
<button class="btn utility-btn" data-shift="60" type="button">+1 мин</button>
</div>
<div class="grid two-buttons correction-row">
<button class="btn utility-btn" data-shift="-3600" type="button">−1 час</button>
<button class="btn utility-btn" data-shift="3600" type="button">+1 час</button>
</div>
<div class="grid two-buttons correction-row">
<button class="btn utility-btn" id="dayMinusBtn" type="button">−1 день</button>
<button class="btn utility-btn" id="dayPlusBtn" type="button">+1 день</button>
</div>'''

new_correction = '''<div class="grid correction-row correction-row-four">
<button class="btn utility-btn" data-shift="-30" type="button">−30 сек</button>
<button class="btn utility-btn" data-shift="-60" type="button">−1 мин</button>
<button class="btn utility-btn" data-shift="-3600" type="button">−1 час</button>
<button class="btn utility-btn" id="dayMinusBtn" type="button">−1 день</button>
</div>
<div class="grid correction-row correction-row-four">
<button class="btn utility-btn" data-shift="30" type="button">+30 сек</button>
<button class="btn utility-btn" data-shift="60" type="button">+1 мин</button>
<button class="btn utility-btn" data-shift="3600" type="button">+1 час</button>
<button class="btn utility-btn" id="dayPlusBtn" type="button">+1 день</button>
</div>'''

html = replace_once(html, old_correction, new_correction, "quick correction layout")
html = html.replace('ZONE CLOCK <strong>v1.22</strong>', 'ZONE CLOCK <strong>v1.23</strong>')
path.write_text(html, encoding="utf-8")

# app.js
path = Path("app.js")
app = path.read_text(encoding="utf-8")

old_render_risk = '''    if (els.riskPercent) els.riskPercent.style.color = r.color;
    els.riskDetail.textContent = r.detail;

    if (r.nextAt !== null) {
      els.riskNext.textContent = `${r.nextText}: ${formatDuration(Math.max(0, r.nextAt - gameElapsed))}`;
    } else {
      els.riskNext.textContent = 'Точного момента выброса заранее определить нельзя.';
    }
  }

  function renderEmission() {
    if (!emission) {
      els.emissionTime.textContent = 'Не отмечен';
      els.emissionDay.textContent = '';
      els.riskWrap.classList.add('hidden');
      document.documentElement.style.setProperty('--emission-danger-level', '0');
      document.documentElement.style.setProperty('--emission-danger-pulse', '0');
      document.body.classList.remove('emission-danger-active', 'emission-danger-high');
      return;
    }

    const gameElapsed = Math.max(0, absoluteGameSeconds - emission.absoluteGameSeconds);

    els.emissionTime.textContent = formatDaysHoursAgo(gameElapsed);
    els.emissionDay.textContent = '';

    renderRisk(gameElapsed);
  }'''

new_render_risk = '''    if (els.riskPercent) els.riskPercent.style.color = r.color;
  }

  function renderEmission() {
    // PWA v123: risk block is always visible because it also contains
    // the "mark emission" action. Before the first mark the risk is unknown.
    els.riskWrap.classList.remove('hidden');

    if (!emission) {
      if (els.emissionTime) els.emissionTime.textContent = 'не отмечен';
      if (els.emissionDay) els.emissionDay.textContent = '';
      els.riskLabel.textContent = 'Нет данных о последнем выбросе';
      els.riskBadge.textContent = '—';
      if (els.riskPercent) {
        els.riskPercent.textContent = '0%';
        els.riskPercent.style.color = 'var(--muted)';
      }
      els.riskProgress.style.width = '0%';
      els.riskProgress.style.background = 'var(--success)';
      els.riskBadge.style.color = 'var(--muted)';
      document.documentElement.style.setProperty('--emission-danger-level', '0');
      document.documentElement.style.setProperty('--emission-danger-pulse', '0');
      document.body.classList.remove('emission-danger-active', 'emission-danger-high');
      return;
    }

    const gameElapsed = Math.max(0, absoluteGameSeconds - emission.absoluteGameSeconds);

    if (els.emissionTime) {
      els.emissionTime.textContent = formatDaysHoursAgo(gameElapsed);
    }
    if (els.emissionDay) els.emissionDay.textContent = '';

    renderRisk(gameElapsed);
  }'''

app = replace_once(app, old_render_risk, new_render_risk, "compact risk JS")
path.write_text(app, encoding="utf-8")

# style.css
path = Path("style.css")
css = path.read_text(encoding="utf-8")
if "PWA v123 — компактный блок выброса" not in css:
    css += r'''

/* PWA v123 — компактный блок выброса и 4-кнопочная коррекция. */
.risk-zone {
  padding-bottom: 0;
}

.risk-emission-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid var(--border-soft);
}

.risk-emission-last {
  min-width: 0;
  color: var(--muted);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: .73rem;
  line-height: 1.35;
}

.risk-emission-last strong {
  color: var(--text);
  font-weight: 900;
}

.risk-emission-btn {
  min-height: 38px;
  padding: 7px 10px;
  white-space: nowrap;
  font-size: .68rem;
}

.correction-row-four {
  grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
  gap: 6px !important;
}

.correction-row-four .utility-btn {
  min-width: 0;
  padding: 10px 4px;
  white-space: nowrap;
  font-size: .68rem;
  letter-spacing: 0;
}

@media (max-width: 420px) {
  .risk-emission-row {
    grid-template-columns: 1fr auto;
    gap: 7px;
  }

  .risk-emission-last {
    font-size: .68rem;
  }

  .risk-emission-btn {
    padding-inline: 7px;
    font-size: .62rem;
  }

  .correction-row-four {
    gap: 4px !important;
  }

  .correction-row-four .utility-btn {
    padding-inline: 2px;
    font-size: .64rem;
  }
}
'''
path.write_text(css, encoding="utf-8")

# service-worker.js
path = Path("service-worker.js")
sw = path.read_text(encoding="utf-8")
sw = sw.replace("stalker2-zone-clock-app-v122", "stalker2-zone-clock-app-v123")
sw = sw.replace("stalker2-zone-clock-map-v122", "stalker2-zone-clock-map-v123")
path.write_text(sw, encoding="utf-8")

# README
path = Path("README.txt")
readme = path.read_text(encoding="utf-8")
readme += """\n\nВерсия 123:\n- блок вероятности выброса сокращён: убраны пояснения под шкалой;\n- в блок вероятности добавлены «Последний выброс был …» и кнопка «ОТМЕТИТЬ ВЫБРОС»;\n- отдельный блок последнего выброса удалён;\n- блок вероятности остаётся доступным и до первой отметки выброса;\n- быстрая коррекция перестроена в две строки по четыре кнопки: минусы сверху, плюсы снизу;\n- версия офлайн-кэша повышена до v123.\n"""
path.write_text(readme, encoding="utf-8")
