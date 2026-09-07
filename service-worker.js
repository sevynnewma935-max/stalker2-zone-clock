const APP_CACHE = 'stalker2-zone-clock-app-v115';
const MAP_CACHE = 'stalker2-zone-clock-map-v115';

const APP_ASSETS = [
  './', './index.html', './style.css', './app.js', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png',
  './assets/zone-map-4096.jpg', './assets/zone-map-schematic-4096.jpg', './assets/zone-road-cost-512.png'
];
const MAP_ASSETS = [
  './assets/zone-map-4096.jpg', './assets/zone-map-8192.jpg',
  './assets/zone-map-schematic-4096.jpg', './assets/zone-road-cost-512.png'
];

function isAppShellRequest(url) {
  const p = url.pathname || '';
  return p.endsWith('/') || p.endsWith('/index.html') || p.endsWith('/style.css') || p.endsWith('/app.js') || p.endsWith('/manifest.webmanifest');
}

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(APP_CACHE);
    await Promise.all(APP_ASSETS.map(async asset => {
      try { await cache.add(asset); } catch (_) {}
    }));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith('stalker2-zone-clock-') && name !== APP_CACHE && name !== MAP_CACHE).map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Live telemetry is always network-only; never cache player coordinates.
  if (url.pathname.startsWith('/api/live-')) return;

  if (isAppShellRequest(url)) {
    event.respondWith((async () => {
      const cache = await caches.open(APP_CACHE);
      try {
        const response = await fetch(request, { cache: 'no-store' });
        if (response.ok) cache.put(request, response.clone());
        return response;
      } catch (error) {
        const cached = await cache.match(request);
        if (cached) return cached;
        const fallback = await cache.match('./index.html');
        if (fallback) return fallback;
        throw error;
      }
    })());
    return;
  }

  const targetCache = MAP_ASSETS.some(asset => url.pathname.endsWith(asset.replace('./', '/'))) ? MAP_CACHE : APP_CACHE;
  event.respondWith((async () => {
    const cache = await caches.open(targetCache);
    const cached = await cache.match(request);
    if (cached) return cached;
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  })());
});
