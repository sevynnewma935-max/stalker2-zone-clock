from pathlib import Path

def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected 1 match, got {count}")
    return text.replace(old, new, 1)

# index.html
path = Path("index.html")
html = path.read_text(encoding="utf-8")

old_clock = '<div aria-live="polite" class="clock" id="clock">18:47</div>'
new_clock = '<button aria-label="Изменить время Зоны" aria-live="polite" class="clock clock-edit-trigger" id="clock" title="Нажмите, чтобы изменить время" type="button">18:47</button>'
html = replace_once(html, old_clock, new_clock, "clock trigger")

map_dialog_anchor = '<dialog aria-labelledby="mapDialogTitle" class="map-dialog" id="mapDialog">'
clock_dialog = '''<dialog aria-labelledby="clockEditTitle" class="clock-edit-dialog" id="clockEditDialog">
<form class="clock-edit-modal" id="clockEditForm">
<div class="clock-edit-title" id="clockEditTitle">УСТАНОВИТЬ ВРЕМЯ</div>
<label class="clock-edit-field" for="clockEditInput">
<span>ВРЕМЯ ЗОНЫ</span>
<input id="clockEditInput" required step="60" type="time"/>
</label>
<div aria-live="polite" class="clock-edit-message" id="clockEditMessage"></div>
<div class="clock-edit-actions">
<button class="btn" id="clockEditCancelBtn" type="button">ОТМЕНА</button>
<button class="btn primary" type="submit">УСТАНОВИТЬ</button>
</div>
</form>
</dialog>
'''
html = replace_once(html, map_dialog_anchor, clock_dialog + map_dialog_anchor, "clock edit dialog")
html = html.replace('ZONE CLOCK <strong>v1.21</strong>', 'ZONE CLOCK <strong>v1.22</strong>')
path.write_text(html, encoding="utf-8")

# app.js
path = Path("app.js")
app = path.read_text(encoding="utf-8")
anchor = '''  function updateNow() {
    const now = Date.now();
    if (running) {
      const delta = Math.max(0, Math.min(7 * 24 * 3600, (now - lastRealMs) / 1000));
      advance(delta);
    }
    lastRealMs = now;
    render();
    saveState();
  }

  els.syncForm.addEventListener('submit', (e) => {
'''
insert = '''  function updateNow() {
    const now = Date.now();
    if (running) {
      const delta = Math.max(0, Math.min(7 * 24 * 3600, (now - lastRealMs) / 1000));
      advance(delta);
    }
    lastRealMs = now;
    render();
    saveState();
  }

  // PWA v122 — изменение времени напрямую по нажатию на большие часы.
  const clockEditDialog = $('clockEditDialog');
  const clockEditForm = $('clockEditForm');
  const clockEditInput = $('clockEditInput');
  const clockEditCancelBtn = $('clockEditCancelBtn');
  const clockEditMessage = $('clockEditMessage');

  function openClockEditor() {
    updateNow();
    if (!clockEditDialog || !clockEditInput) return;

    clockEditInput.value = formatClock(gameSeconds);
    if (clockEditMessage) clockEditMessage.textContent = '';

    if (typeof clockEditDialog.showModal === 'function') {
      if (!clockEditDialog.open) clockEditDialog.showModal();
    } else {
      clockEditDialog.setAttribute('open', '');
    }

    window.requestAnimationFrame(() => {
      clockEditInput.focus();
      if (typeof clockEditInput.showPicker === 'function') {
        try { clockEditInput.showPicker(); } catch (_) {}
      }
    });
  }

  function closeClockEditor() {
    if (!clockEditDialog) return;
    if (typeof clockEditDialog.close === 'function') {
      clockEditDialog.close();
    } else {
      clockEditDialog.removeAttribute('open');
    }
  }

  function applyClockEditor() {
    if (!clockEditInput) return;

    const raw = String(clockEditInput.value || '').trim();
    const validFormat = /^([01]\\d|2[0-3]):[0-5]\\d$/.test(raw);
    const parsedTime = validFormat ? parseTime(raw) : null;

    if (parsedTime === null) {
      if (clockEditMessage) clockEditMessage.textContent = 'Введите время в формате ЧЧ:ММ.';
      clockEditInput.focus();
      return;
    }

    gameSeconds = parsedTime;
    absoluteGameSeconds = gameDay * DAY_SECONDS + gameSeconds;
    lastRealMs = Date.now();

    if (els.timeInput) els.timeInput.value = formatClock(gameSeconds);
    if (els.dayInput) els.dayInput.value = String(gameDay);

    els.message.textContent = `Время установлено: ${formatClock(gameSeconds)}.`;
    syncNotificationSchedule();
    saveState(true);
    render();
    closeClockEditor();
  }

  if (els.clock) {
    els.clock.addEventListener('click', openClockEditor);
  }

  if (clockEditForm) {
    clockEditForm.addEventListener('submit', event => {
      event.preventDefault();
      applyClockEditor();
    });
  }

  if (clockEditCancelBtn) {
    clockEditCancelBtn.addEventListener('click', closeClockEditor);
  }

  if (clockEditDialog) {
    clockEditDialog.addEventListener('click', event => {
      if (event.target === clockEditDialog) closeClockEditor();
    });
  }

  els.syncForm.addEventListener('submit', (e) => {
'''
app = replace_once(app, anchor, insert, "clock editor logic")
path.write_text(app, encoding="utf-8")

# style.css
path = Path("style.css")
css = path.read_text(encoding="utf-8")
if "PWA v122 — редактирование времени по нажатию на часы" not in css:
    css += r'''

/* PWA v122 — редактирование времени по нажатию на часы. */
.clock-edit-trigger {
  display: block;
  width: 100%;
  border: 0;
  padding: 0;
  appearance: none;
  background: transparent;
  cursor: pointer;
}
.clock-edit-trigger:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 7px;
  border-radius: 6px;
}
.clock-edit-trigger:active {
  transform: scale(.985);
}

.clock-edit-dialog {
  width: min(92vw, 390px);
  max-width: 390px;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--text);
}
.clock-edit-dialog::backdrop {
  background: rgba(0,0,0,.72);
  backdrop-filter: blur(4px);
}
.clock-edit-modal {
  padding: 20px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--card);
  box-shadow: 0 24px 70px var(--shadow);
}
.clock-edit-title {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: .82rem;
  font-weight: 900;
  letter-spacing: .14em;
  color: var(--accent-2);
}
.clock-edit-field {
  display: grid;
  gap: 8px;
  margin-top: 18px;
}
.clock-edit-field span {
  color: var(--muted);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: .7rem;
  font-weight: 800;
  letter-spacing: .12em;
}
.clock-edit-field input {
  width: 100%;
  min-height: 58px;
  border: 1px solid var(--border);
  border-radius: 7px;
  padding: 8px 12px;
  color: var(--text);
  background: var(--input);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 1.65rem;
  font-weight: 800;
  text-align: center;
}
.clock-edit-message {
  min-height: 1.2em;
  margin-top: 8px;
  color: var(--warning);
  font-size: .76rem;
}
.clock-edit-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 12px;
}
'''
path.write_text(css, encoding="utf-8")

# service-worker.js
path = Path("service-worker.js")
sw = path.read_text(encoding="utf-8")
sw = sw.replace("stalker2-zone-clock-app-v121", "stalker2-zone-clock-app-v122")
sw = sw.replace("stalker2-zone-clock-map-v121", "stalker2-zone-clock-map-v122")
path.write_text(sw, encoding="utf-8")

# README
path = Path("README.txt")
readme = path.read_text(encoding="utf-8")
readme += """\n\nВерсия 122:\n- большие часы на главном экране стали интерактивными;\n- нажатие на часы открывает окно выбора времени Зоны;\n- новое время применяется к текущему дню без изменения номера дня;\n- после изменения ход часов продолжается в прежнем состоянии (идут или на паузе);\n- версия офлайн-кэша повышена до v122.\n"""
path.write_text(readme, encoding="utf-8")
