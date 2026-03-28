/**
 * Service Worker for Political Reality Check PWA
 *
 * Strategy: Network-first for API calls, Cache-first for static assets.
 * This enables offline access to previously loaded results.
 */

const CACHE_NAME = 'politicheck-v2';
const STATIC_ASSETS = [
  '/',
  '/mode1',
  '/mode2',
  '/elections',
];

// Install — pre-cache shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch — network-first for API, cache-first for pages
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET
  if (request.method !== 'GET') return;

  // API calls — network only (don't cache dynamic data)
  if (url.pathname.startsWith('/api/')) return;

  // Next.js build assets and HTML pages — always network-first
  // Cache-first caused stale CSS/JS after rebuilds
  event.respondWith(
    fetch(request).then((response) => {
      if (response.status === 200) {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, clone);
        });
      }
      return response;
    }).catch(() => {
      return caches.match(request) || caches.match('/');
    })
  );
});
