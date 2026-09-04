const CACHE = 'stalker2-zone-clock-v61';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './assets/map-tiles-16384/tile-0-0.jpg',
  './assets/map-tiles-16384/tile-0-1.jpg',
  './assets/map-tiles-16384/tile-0-2.jpg',
  './assets/map-tiles-16384/tile-0-3.jpg',
  './assets/map-tiles-16384/tile-0-4.jpg',
  './assets/map-tiles-16384/tile-0-5.jpg',
  './assets/map-tiles-16384/tile-0-6.jpg',
  './assets/map-tiles-16384/tile-0-7.jpg',
  './assets/map-tiles-16384/tile-1-0.jpg',
  './assets/map-tiles-16384/tile-1-1.jpg',
  './assets/map-tiles-16384/tile-1-2.jpg',
  './assets/map-tiles-16384/tile-1-3.jpg',
  './assets/map-tiles-16384/tile-1-4.jpg',
  './assets/map-tiles-16384/tile-1-5.jpg',
  './assets/map-tiles-16384/tile-1-6.jpg',
  './assets/map-tiles-16384/tile-1-7.jpg',
  './assets/map-tiles-16384/tile-2-0.jpg',
  './assets/map-tiles-16384/tile-2-1.jpg',
  './assets/map-tiles-16384/tile-2-2.jpg',
  './assets/map-tiles-16384/tile-2-3.jpg',
  './assets/map-tiles-16384/tile-2-4.jpg',
  './assets/map-tiles-16384/tile-2-5.jpg',
  './assets/map-tiles-16384/tile-2-6.jpg',
  './assets/map-tiles-16384/tile-2-7.jpg',
  './assets/map-tiles-16384/tile-3-0.jpg',
  './assets/map-tiles-16384/tile-3-1.jpg',
  './assets/map-tiles-16384/tile-3-2.jpg',
  './assets/map-tiles-16384/tile-3-3.jpg',
  './assets/map-tiles-16384/tile-3-4.jpg',
  './assets/map-tiles-16384/tile-3-5.jpg',
  './assets/map-tiles-16384/tile-3-6.jpg',
  './assets/map-tiles-16384/tile-3-7.jpg',
  './assets/map-tiles-16384/tile-4-0.jpg',
  './assets/map-tiles-16384/tile-4-1.jpg',
  './assets/map-tiles-16384/tile-4-2.jpg',
  './assets/map-tiles-16384/tile-4-3.jpg',
  './assets/map-tiles-16384/tile-4-4.jpg',
  './assets/map-tiles-16384/tile-4-5.jpg',
  './assets/map-tiles-16384/tile-4-6.jpg',
  './assets/map-tiles-16384/tile-4-7.jpg',
  './assets/map-tiles-16384/tile-5-0.jpg',
  './assets/map-tiles-16384/tile-5-1.jpg',
  './assets/map-tiles-16384/tile-5-2.jpg',
  './assets/map-tiles-16384/tile-5-3.jpg',
  './assets/map-tiles-16384/tile-5-4.jpg',
  './assets/map-tiles-16384/tile-5-5.jpg',
  './assets/map-tiles-16384/tile-5-6.jpg',
  './assets/map-tiles-16384/tile-5-7.jpg',
  './assets/map-tiles-16384/tile-6-0.jpg',
  './assets/map-tiles-16384/tile-6-1.jpg',
  './assets/map-tiles-16384/tile-6-2.jpg',
  './assets/map-tiles-16384/tile-6-3.jpg',
  './assets/map-tiles-16384/tile-6-4.jpg',
  './assets/map-tiles-16384/tile-6-5.jpg',
  './assets/map-tiles-16384/tile-6-6.jpg',
  './assets/map-tiles-16384/tile-6-7.jpg',
  './assets/map-tiles-16384/tile-7-0.jpg',
  './assets/map-tiles-16384/tile-7-1.jpg',
  './assets/map-tiles-16384/tile-7-2.jpg',
  './assets/map-tiles-16384/tile-7-3.jpg',
  './assets/map-tiles-16384/tile-7-4.jpg',
  './assets/map-tiles-16384/tile-7-5.jpg',
  './assets/map-tiles-16384/tile-7-6.jpg',
  './assets/map-tiles-16384/tile-7-7.jpg',
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