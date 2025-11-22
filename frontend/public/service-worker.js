/* eslint-env serviceworker */
/* eslint-disable no-restricted-globals */

const SHELL_CACHE = 'omegoo-shell-v2';
const API_CACHE = 'omegoo-api-v2';
const IMAGE_CACHE = 'omegoo-images-v1';
const SEO_CACHE = 'omegoo-seo-v1';

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo192.png',
  '/logo512.png',
  '/favicon.ico',
  '/favicon-64x64.png',
  '/favicon-48x48.png',
  '/favicon-32x32.png',
  '/favicon-16x16.png',
  '/robots.txt',
  '/humans.txt',
  '/sitemap.xml'
];

// SEO pages to cache for offline access
const SEO_URLS = [
  '/about',
  '/contact',
  '/privacy',
  '/terms',
  '/safety',
  '/no-login-video-chat',
  '/anonymous-video-chat',
  '/stranger-cam-chat',
  '/omegle-like-app',
  '/random-chat-no-registration'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  const keepCaches = [SHELL_CACHE, API_CACHE, IMAGE_CACHE, SEO_CACHE];

  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => !keepCaches.includes(key))
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') {
    return;
  }

  const requestUrl = new URL(request.url);
  const isSameOrigin = requestUrl.origin === self.location.origin;

  if (isSameOrigin) {
    // Cache static assets (JS, CSS)
    if (requestUrl.pathname.startsWith('/static/')) {
      event.respondWith(cacheFirst(request, SHELL_CACHE));
      return;
    }

    // Cache images with separate cache
    if (requestUrl.pathname.match(/\.(png|jpg|jpeg|webp|gif|svg|ico)$/)) {
      event.respondWith(cacheFirst(request, IMAGE_CACHE));
      return;
    }

    // Cache precached URLs
    if (PRECACHE_URLS.includes(requestUrl.pathname)) {
      event.respondWith(cacheFirst(request, SHELL_CACHE));
      return;
    }

    // Cache SEO pages for better performance
    if (SEO_URLS.includes(requestUrl.pathname) || requestUrl.pathname.startsWith('/country/')) {
      event.respondWith(staleWhileRevalidate(request, SEO_CACHE));
      return;
    }
  }

  if (requestUrl.pathname.includes('/api/status/summary')) {
    event.respondWith(staleWhileRevalidate(request, API_CACHE));
    return;
  }

  if (requestUrl.pathname.includes('/api/analytics/event')) {
    event.respondWith(networkOnlyWithFallback(request));
  }
});

function cacheFirst(request, cacheName) {
  return caches.open(cacheName).then(async (cache) => {
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }

    const response = await fetch(request);
    cache.put(request, response.clone());
    return response;
  });
}

function staleWhileRevalidate(request, cacheName) {
  return caches.open(cacheName).then(async (cache) => {
    const cached = await cache.match(request);
    const networkPromise = fetch(request)
      .then((response) => {
        cache.put(request, response.clone());
        return response;
      })
      .catch(() => cached);

    return cached || networkPromise;
  });
}

async function networkOnlyWithFallback(request) {
  try {
    return await fetch(request);
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: 'offline' }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
