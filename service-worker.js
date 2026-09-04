const APP_CACHE = 'stalker2-zone-clock-v72';
const MAP_CACHE = 'stalker2-zone-map-8192-v1';

const APP_ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

const MAP_ASSETS = [
  './assets/zone-map-8192.jpg',
  './assets/zone-map-4096.jpg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    Promise.all([
      caches.open(APP_CACHE).then(cache => cache.addAll(APP_ASSETS)),
      caches.open(MAP_CACHE).then(cache => cache.addAll(MAP_ASSETS))
    ])
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys
        .filter(key =>
          (key.startsWith('stalker2-zone-clock-') && key !== APP_CACHE) ||
          (key.startsWith('stalker2-zone-map-') && key !== MAP_CACHE)
        )
        .map(key => caches.delete(key))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  const isMap = url.pathname.endsWith('/assets/zone-map-8192.jpg');
  const cacheName = isMap ? MAP_CACHE : APP_CACHE;

  event.respondWith(
    caches.open(cacheName).then(async cache => {
      const cached = await cache.match(event.request);
      if (cached) return cached;
      try {
        const response = await fetch(event.request);
        if (response.ok) cache.put(event.request, response.clone());
        return response;
      } catch (_) {
        if (!isMap) return cache.match('./index.html');
        return Response.error();
      }
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || './';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      for (const client of windowClients) {
        if ('focus' in client) {
          client.navigate(targetUrl).catch(() => {});
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(targetUrl);
      return undefined;
    })
  );
});
