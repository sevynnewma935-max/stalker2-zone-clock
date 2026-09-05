const APP_CACHE = 'stalker2-zone-clock-app-v111';
const MAP_CACHE = 'stalker2-zone-clock-map-v111';

const APP_ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.webmanifest',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/background-main.jpg',
  './assets/zone-map-4096.jpg',
  './assets/zone-map-schematic-4096.jpg',
  './assets/zone-road-cost-512.png',
  './assets/worldview-side-left.webp',
  './assets/worldview-side-right.webp',
  './assets/worldview-center.webp',
  './assets/artefacts/artefact-fireball.png',
  './assets/artefacts/artefact-urchin.png',
  './assets/artefacts/artefact-mama-beads.png',
  './assets/artefacts/artefact-stone-blood.png',
  './assets/artefacts/artefact-slug.png',
  './assets/artefacts/artefact-night-star.png',
  './assets/artefacts/artefact-goldfish.png',
  './assets/artefacts/artefact-crystal-thorn.png',
  './assets/artefacts/artefact-flash.png',
  './assets/artefacts/artefact-weird-water.png',
  './assets/artefacts/artefact-weird-ball.png',
  './assets/artefacts/artefact-weird-flower.png',
  './assets/artefacts/artefact-weird-bolt.png',
  './assets/artefacts/artefact-weird-pot.png',
  './assets/artefacts/artefact-weird-nut.png'
];

const MAP_ASSETS = [
  './assets/zone-map-4096.jpg',
  './assets/zone-map-schematic-4096.jpg',
  './assets/zone-road-cost-512.png'
];

function isAppShellRequest(requestUrl) {
  const pathname = requestUrl.pathname || '';
  return (
    pathname.endsWith('/') ||
    pathname.endsWith('/index.html') ||
    pathname.endsWith('/style.css') ||
    pathname.endsWith('/app.js') ||
    pathname.endsWith('/manifest.webmanifest')
  );
}

self.addEventListener('install', event => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(APP_CACHE);
      await cache.addAll(APP_ASSETS);
      self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter(name =>
            name.startsWith('stalker2-zone-clock-') &&
            name !== APP_CACHE &&
            name !== MAP_CACHE
          )
          .map(name => caches.delete(name))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) return;

  if (isAppShellRequest(url)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(APP_CACHE);
        try {
          const response = await fetch(request, { cache: 'no-store' });
          cache.put(request, response.clone());
          return response;
        } catch (_) {
          const cached = await cache.match(request);
          if (cached) return cached;
          const fallback = await cache.match('./index.html');
          if (fallback) return fallback;
          throw _;
        }
      })()
    );
    return;
  }

  const targetCache = MAP_ASSETS.some(asset => url.pathname.endsWith(asset.replace('./', '/')))
    ? MAP_CACHE
    : APP_CACHE;

  event.respondWith(
    (async () => {
      const cache = await caches.open(targetCache);
      const cached = await cache.match(request);
      if (cached) return cached;
      const response = await fetch(request);
      cache.put(request, response.clone());
      return response;
    })()
  );
});
