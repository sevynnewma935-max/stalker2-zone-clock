const CACHE = 'stalker2-zone-clock-v58';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './assets/map-tiles/tile-0-0.webp',
  './assets/map-tiles/tile-0-1.webp',
  './assets/map-tiles/tile-0-2.webp',
  './assets/map-tiles/tile-0-3.webp',
  './assets/map-tiles/tile-1-0.webp',
  './assets/map-tiles/tile-1-1.webp',
  './assets/map-tiles/tile-1-2.webp',
  './assets/map-tiles/tile-1-3.webp',
  './assets/map-tiles/tile-2-0.webp',
  './assets/map-tiles/tile-2-1.webp',
  './assets/map-tiles/tile-2-2.webp',
  './assets/map-tiles/tile-2-3.webp',
  './assets/map-tiles/tile-3-0.webp',
  './assets/map-tiles/tile-3-1.webp',
  './assets/map-tiles/tile-3-2.webp',
  './assets/map-tiles/tile-3-3.webp',
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE).then(cache => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match('./index.html'));
    })
  );
});


// PWA v43 — persistent notification interaction.
self.addEventListener('notificationclick', event => {
  event.notification.close();

  const targetUrl =
    (event.notification.data && event.notification.data.url) || './';

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(windowClients => {
      for (const client of windowClients) {
        if ('focus' in client) {
          client.navigate(targetUrl).catch(() => {});
          return client.focus();
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }

      return undefined;
    })
  );
});