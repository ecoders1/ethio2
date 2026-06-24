// EEE – Exit Exam Ethiopia
// Service Worker v3 – Full offline support
const CACHE_STATIC = 'eee-static-v3';
const CACHE_DATA   = 'eee-data-v3';
const CACHE_PAGES  = 'eee-pages-v3';

const STATIC_ASSETS = [
  '/manifest.json',
  '/globe.svg',
  '/bg-hero.svg',
  '/icons/icon.svg',
];

const PAGE_ASSETS = [
  '/',
  '/home',
  '/departments',
  '/exams',
  '/settings',
  '/auth/signin',
  '/auth/signup',
];

const CACHEABLE_API = [
  '/api/departments',
  '/api/exams',
  '/api/settings',
  '/api/access',
];

// ── Install: pre-cache static assets ─────────────────────────
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_STATIC).then(c => c.addAll(STATIC_ASSETS).catch(() => {})),
      caches.open(CACHE_PAGES).then(c => c.addAll(PAGE_ASSETS).catch(() => {})),
    ])
  );
});

// ── Activate: clean old caches ────────────────────────────────
self.addEventListener('activate', event => {
  const keep = [CACHE_STATIC, CACHE_DATA, CACHE_PAGES];
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => !keep.includes(k)).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ── Messages from app ─────────────────────────────────────────
self.addEventListener('message', event => {
  const { type, urls, userId } = event.data || {};

  // Cache exam/dept data after login
  if (type === 'CACHE_USER_DATA') {
    const toCache = [
      '/api/departments',
      '/api/exams?unlocked_only=true',
      '/api/access',
      '/api/settings',
      '/api/results',
    ];
    caches.open(CACHE_DATA).then(cache => {
      toCache.forEach(url => {
        fetch(url, { credentials: 'include' })
          .then(res => { if (res.ok) cache.put(url, res.clone()); })
          .catch(() => {});
      });
    });
    // Store userId so we know data is cached
    if (userId) {
      caches.open(CACHE_DATA).then(cache => {
        cache.put('/__user_cached', new Response(JSON.stringify({ userId, cachedAt: Date.now() })));
      });
    }
  }

  // Cache specific URLs
  if (type === 'CACHE_URLS' && Array.isArray(urls)) {
    caches.open(CACHE_DATA).then(cache => {
      urls.forEach(url => {
        fetch(url, { credentials: 'include' })
          .then(res => { if (res.ok) cache.put(url, res.clone()); })
          .catch(() => {});
      });
    });
  }

  if (type === 'SKIP_WAITING') self.skipWaiting();
});

// ── Fetch strategy ────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  // Skip non-GET, cross-origin, chrome-extension
  if (req.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;

  // API: network-first → data cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstWithCache(req, CACHE_DATA, CACHEABLE_API));
    return;
  }

  // Next.js chunks/static: cache-first
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(req, CACHE_STATIC));
    return;
  }

  // Pages: network-first → page cache fallback
  event.respondWith(networkFirstWithCache(req, CACHE_PAGES, null));
});

// Network-first with cache fallback
async function networkFirstWithCache(req, cacheName, cacheablePatterns) {
  try {
    const res = await fetch(req);
    if (res.ok) {
      const shouldCache = !cacheablePatterns ||
        cacheablePatterns.some(p => req.url.includes(p));
      if (shouldCache) {
        const cache = await caches.open(cacheName);
        cache.put(req, res.clone());
      }
    }
    return res;
  } catch {
    const cached = await caches.match(req, { cacheName });
    if (cached) return cached;
    // Return offline page for navigation requests
    if (req.mode === 'navigate') {
      const offlinePage = await caches.match('/');
      return offlinePage || new Response(
        '<html><body><h1>Offline</h1><p>Please reconnect to use EEE.</p></body></html>',
        { headers: { 'Content-Type': 'text/html' } }
      );
    }
    return new Response('', { status: 503 });
  }
}

// Cache-first strategy
async function cacheFirst(req, cacheName) {
  const cached = await caches.match(req, { cacheName });
  if (cached) return cached;
  try {
    const res = await fetch(req);
    if (res.ok) {
      const cache = await caches.open(cacheName);
      cache.put(req, res.clone());
    }
    return res;
  } catch {
    return new Response('', { status: 503 });
  }
}
