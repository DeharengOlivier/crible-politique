/**
 * Service worker for Le Crible Politique.
 *
 * Strategy: network first, fall back to the cache when the network is gone.
 * The cache exists so a reader who loses their connection mid-test keeps the
 * pages they had already opened.
 *
 * What it is allowed to keep is a privacy rule, not a performance detail.
 * Cache Storage is a copy of pages held on the device after the tab is closed,
 * on a tool whose whole premise is that nothing about anyone is stored, so
 * shared profiles and comparisons are never written to it. Everything the
 * cache does hold is erased by the "effacer mes données locales" button on the
 * privacy page, which also unregisters this worker.
 */

// Bumping this name is how a stale cache is emptied: the activate step deletes
// every cache that is not this one. It was "politicheck-v2", from an earlier
// project, and those caches held shared-profile pages whose URL still carried
// a full answer set.
const CACHE_NAME = 'crible-politique-v1';

// The offline shell, served for a navigation the cache does not hold.
const OFFLINE_SHELL = '/';

// Fetched at install so the essential pages work offline from the first visit.
const PRECACHE_ROUTES = [OFFLINE_SHELL, '/test', '/crible', '/concepts'];

// Paths this worker must never write to the cache.
//
// /p/{code} is a shared profile: someone else's political identity, which is
// not this tool's to keep on the recipient's device past the visit. /compare
// holds two of them at once. The trailing slash matters: /partners only starts
// like /p.
const NEVER_CACHED = ['/p/', '/compare'];

function isCacheable(pathname) {
    return !NEVER_CACHED.some(
        (prefix) => pathname === prefix || pathname.startsWith(prefix)
    );
}

// Registering listeners is skipped outside a worker, so the rules above can be
// imported and tested as ordinary functions. Nothing else in this file runs.
if (typeof self !== 'undefined' && typeof self.addEventListener === 'function') {
    self.addEventListener('install', (event) => {
        event.waitUntil(
            caches.open(CACHE_NAME).then((cache) =>
                // Individually, not addAll: one route failing to fetch (an
                // install started offline) must not leave the worker with no
                // cache at all.
                Promise.allSettled(PRECACHE_ROUTES.map((route) => cache.add(route)))
            )
        );
        self.skipWaiting();
    });

    self.addEventListener('activate', (event) => {
        event.waitUntil(
            caches
                .keys()
                .then((keys) =>
                    Promise.all(
                        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
                    )
                )
        );
        self.clients.claim();
    });

    self.addEventListener('fetch', (event) => {
        const { request } = event;
        if (request.method !== 'GET') return;

        const url = new URL(request.url);
        // Another origin's caching policy is not this worker's business.
        if (url.origin !== self.location.origin) return;

        event.respondWith(
            fetch(request)
                .then((response) => {
                    if (response.status === 200 && isCacheable(url.pathname)) {
                        const copy = response.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
                    }
                    return response;
                })
                .catch(async () => {
                    // The network is gone. Serve what we have, and the shell
                    // for a navigation we do not have, so the reader gets the
                    // site rather than the browser's error page.
                    const cached = await caches.match(request);
                    if (cached) return cached;
                    if (request.mode === 'navigate') {
                        const shell = await caches.match(OFFLINE_SHELL);
                        if (shell) return shell;
                    }
                    return Response.error();
                })
        );
    });
}

// Exported for the test suite. A service worker has no module system, so this
// guard is what lets the rules above be checked without a browser.
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CACHE_NAME, OFFLINE_SHELL, PRECACHE_ROUTES, isCacheable };
}
