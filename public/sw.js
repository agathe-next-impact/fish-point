const CACHE_VERSION = 3;
const STATIC_CACHE = `fishspot-static-v${CACHE_VERSION}`;
const API_CACHE = `fishspot-api-v${CACHE_VERSION}`;
const TILES_CACHE = `fishspot-tiles-v${CACHE_VERSION}`;
const ALL_CACHES = [STATIC_CACHE, API_CACHE, TILES_CACHE];

const MAX_API_ENTRIES = 100;
const MAX_TILES_ENTRIES = 500;
const API_CACHE_MAX_AGE = 5 * 60 * 1000;

const STATIC_ASSETS = [
  '/',
  '/map',
  '/spots',
  '/manifest.json',
];

// Install
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate — purge old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => !ALL_CACHES.includes(key))
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxEntries) {
    await Promise.all(keys.slice(0, keys.length - maxEntries).map((k) => cache.delete(k)));
  }
}

// Fetch
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (event.request.method !== 'GET') return;

  // PMTiles on Vercel Blob: bypass SW cache and let the browser HTTP cache handle it.
  // The Cache API does not properly store 206 Partial Content responses (PMTiles
  // fetches use HTTP Range requests). The Cache-Control: max-age=31536000 on the
  // Blob object is sufficient — browser caches it natively without our help.
  if (url.hostname.endsWith('.public.blob.vercel-storage.com')) {
    return;
  }

  // Stale While Revalidate for API (with TTL + size limit)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      caches.open(API_CACHE).then(async (cache) => {
        const cached = await cache.match(event.request);

        const fetchPromise = fetch(event.request)
          .then((response) => {
            if (response.ok) {
              const clone = response.clone();
              cache.put(event.request, clone);
              trimCache(API_CACHE, MAX_API_ENTRIES);
            }
            return response;
          })
          .catch(() => cached);

        return cached || fetchPromise;
      })
    );
    return;
  }

  // Network first for pages
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(STATIC_CACHE).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() =>
        caches.match(event.request).then((cached) => cached || caches.match('/'))
      )
  );
});
