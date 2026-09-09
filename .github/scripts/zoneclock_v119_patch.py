from pathlib import Path


def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected 1 match, got {count}')
    return text.replace(old, new, 1)

# index.html
path = Path('index.html')
html = path.read_text(encoding='utf-8')
html = html.replace('ZONE CLOCK <strong>v1.18</strong>', 'ZONE CLOCK <strong>v1.19</strong>')
path.write_text(html, encoding='utf-8')

# service-worker.js
path = Path('service-worker.js')
sw = path.read_text(encoding='utf-8')
sw = sw.replace("stalker2-zone-clock-app-v118", "stalker2-zone-clock-app-v119")
sw = sw.replace("stalker2-zone-clock-map-v118", "stalker2-zone-clock-map-v119")
path.write_text(sw, encoding='utf-8')

# app.js
path = Path('app.js')
app = path.read_text(encoding='utf-8')

wake_lock_code = r'''

  // PWA v119 — не давать экрану выключаться, пока Zone Clock открыт.
  let zoneClockWakeLock = null;
  let zoneClockWakeLockRequestPending = false;

  async function requestZoneClockWakeLock() {
    if (document.visibilityState !== 'visible') return;
    if (!('wakeLock' in navigator)) return;
    if (zoneClockWakeLock || zoneClockWakeLockRequestPending) return;

    zoneClockWakeLockRequestPending = true;
    try {
      const sentinel = await navigator.wakeLock.request('screen');
      zoneClockWakeLock = sentinel;
      sentinel.addEventListener('release', () => {
        if (zoneClockWakeLock === sentinel) zoneClockWakeLock = null;
      }, { once: true });
    } catch (error) {
      // Браузер или энергосбережение могут временно отклонить запрос.
      console.info('Zone Clock: screen wake lock unavailable', error?.name || error);
    } finally {
      zoneClockWakeLockRequestPending = false;
    }
  }

  async function releaseZoneClockWakeLock() {
    const sentinel = zoneClockWakeLock;
    zoneClockWakeLock = null;
    if (!sentinel || sentinel.released) return;
    try {
      await sentinel.release();
    } catch (_) {}
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      requestZoneClockWakeLock();
    } else {
      releaseZoneClockWakeLock();
    }
  });

  // Первый запрос при запуске и повторная попытка после любого касания/клика,
  // если конкретный браузер требует пользовательское действие.
  requestZoneClockWakeLock();
  document.addEventListener('pointerdown', requestZoneClockWakeLock, {
    passive: true
  });
'''

anchor = "  restoreNotificationSchedule();\n  updateNotificationSettingsUi();"
if wake_lock_code.strip() not in app:
    app = replace_once(
        app,
        anchor,
        wake_lock_code + "\n\n" + anchor,
        'wake lock insertion'
    )
path.write_text(app, encoding='utf-8')

# README
path = Path('README.txt')
readme = path.read_text(encoding='utf-8')
if 'Версия 119:' not in readme:
    readme += '''\n\nВерсия 119:\n- добавлено предотвращение автоматического выключения экрана во время работы Zone Clock;\n- используется системный Screen Wake Lock, если он поддерживается браузером/PWA;\n- при сворачивании приложения блокировка экрана автоматически снимается;\n- при возвращении в приложение Wake Lock запрашивается повторно;\n- версия приложения: ZONE CLOCK v1.19;\n- версия офлайн-кэша повышена до v119.\n'''
path.write_text(readme, encoding='utf-8')
