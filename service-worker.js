const CACHE_NAME = 'den-to-nghe-taxi-v20-avatar';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icons/app-avatar.jpg',
  './js/firebase-bridge.js',
  './js/firebase-config.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      // Keep the new worker in 'waiting' so the installed app can show an explicit update action.
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  // Fallback browser/launcher icons to the current Taxi Guild avatar
  const path = url.pathname;
  if (path.endsWith('/icons/apple-touch-icon.png') ||
      path.endsWith('/apple-touch-icon.png') ||
      path.endsWith('/icons/favicon-32.png') ||
      path.endsWith('/favicon.ico') ||
      path.endsWith('/icons/icon-192-maskable.png')) {
    event.respondWith(
      caches.match('./icons/app-avatar.jpg').then((c) => c || fetch('./icons/app-avatar.jpg'))
    );
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(() => {});
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match('./index.html')))
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});
