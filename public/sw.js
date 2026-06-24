// EEE Service Worker – Full Offline Support v2
const CACHE_NAME = 'eee-v2';
const DATA_CACHE = 'eee-data-v2';

const STATIC_ASSETS = [
  '/',
  '/home',
  '/departments',
  '/exams',
  '/settings',
  '/manifest.json',
  '/globe.svg',
];

// ── Install ───────────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      cache.addAll(STATIC_ASSETS).catch(() => {})
    )
  );
  self.skipWaiting();
});

// ── Activate ──────────────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME && k !== DATA_CACHE)
          .map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ── Message: cache exam data after login ──────────────────────
self.addEventListener('message', event => {
  if (event.data?.type === 'CACHE_EXAM_DATA') {
    const { urls } = event.data;
    caches.open(DATA_CACHE).then(cache => {
      urls.forEach(url => {
        fetch(url)
          .then(res => { if (res.ok) cache.put(url, res); })
          .catch(() => {});
      });
    });
  }

  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ── Fetch ─────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Only handle GET
  if (event.request.method !== 'GET') return;

  // API routes: network-first, fall back to data cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then(res => {
          // Cache GET API responses that are safe to cache offline
          const cacheable = ['/api/departments', '/api/exams', '/api/questions', '/api/settings'];
          if (res.ok && cacheable.some(p => url.pathname.startsWith(p))) {
            const clone = res.clone();
            caches.open(DATA_CACHE).then(cache => cache.put(event.request, clone));
          }
          return res;
        })
        .catch(() => caches.match(event.request, { cacheName: DATA_CACHE }))
    );
    return;
  }

  // Static assets: stale-while-revalidate
  event.respondWith(
    caches.match(event.request).then(cached => {
      const networkFetch = fetch(event.request).then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return res;
      }).catch(() => null);

      return cached || networkFetch || caches.match('/');
    })
  );
});
