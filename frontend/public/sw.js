/* Epic Road Trip service worker: installable app, offline pages, cached assets and map tiles.
 *
 * - Pages (navigations): network first, cached copy when offline, then the offline page.
 * - /assets/* (hashed, immutable) and fonts: cache first.
 * - /tiles/* (basemap styles, vector tiles, glyphs): stale-while-revalidate, bounded.
 * - /api/*: never cached (personal data, fresh results).
 */
const VERSION = "v2.0.0";
const PAGES = `ert-pages-${VERSION}`;
const ASSETS = `ert-assets-${VERSION}`;
const TILES = `ert-tiles-${VERSION}`;
const OFFLINE_URL = "/offline.html";
const PRECACHE = [OFFLINE_URL, "/fr", "/en", "/favicon.svg", "/icon-192.png"];
const MAX_TILES = 600;
const MAX_PAGES = 60;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(PAGES)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("ert-") && ![PAGES, ASSETS, TILES].includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

async function trim(cacheName, max) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - max; i++) await cache.delete(keys[i]);
}

async function networkFirstPage(request) {
  const cache = await caches.open(PAGES);
  try {
    const response = await fetch(request);
    if (response.ok && response.type === "basic") {
      await cache.put(request, response.clone());
      void trim(PAGES, MAX_PAGES);
    }
    return response;
  } catch {
    return (await cache.match(request, { ignoreSearch: true })) ?? (await cache.match(OFFLINE_URL));
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    await cache.put(request, response.clone());
    void trim(cacheName, 400); // hashed files from older releases age out
  }
  return response;
}

async function staleWhileRevalidate(request, event) {
  const cache = await caches.open(TILES);
  const cached = await cache.match(request);
  const refresh = fetch(request)
    .then(async (response) => {
      if (response.ok) {
        await cache.put(request, response.clone());
        void trim(TILES, MAX_TILES);
      }
      return response;
    })
    .catch(() => cached);
  if (cached) {
    event.waitUntil(refresh);
    return cached;
  }
  return refresh;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return; // always live

  if (request.mode === "navigate") {
    event.respondWith(networkFirstPage(request));
  } else if (url.pathname.startsWith("/assets/") || url.pathname.startsWith("/fonts/")) {
    event.respondWith(cacheFirst(request, ASSETS));
  } else if (url.pathname.startsWith("/tiles/")) {
    event.respondWith(staleWhileRevalidate(request, event));
  }
});
