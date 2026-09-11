const CACHE_NAME = 'den-to-nghe-taxi-v14-official-logo';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './js/firebase-bridge.js',
  './js/firebase-config.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
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

  // Fallback apple-touch / favicon to official icon-192
  const path = url.pathname;
  if (path.endsWith('/icons/apple-touch-icon.png') ||
      path.endsWith('/apple-touch-icon.png') ||
      path.endsWith('/icons/favicon-32.png') ||
      path.endsWith('/favicon.ico') ||
      path.endsWith('/icons/icon-192-maskable.png')) {
    event.respondWith(
      caches.match('./icons/icon-192.png').then((c) => c || fetch('./icons/icon-192.png'))
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
