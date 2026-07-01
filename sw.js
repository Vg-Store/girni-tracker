/* ------------------------------------------------------ */
/* SERVICE WORKER — app-shell caching for offline use       */
/* Bump CACHE_VERSION whenever any cached file changes.     */
/* ------------------------------------------------------ */

const CACHE_VERSION = "girni-nond-v1";

const APP_SHELL = [
  "./",
  "./index.html",
  "./styles.css",
  "./translations.js",
  "./db.js",
  "./billing.js",
  "./charts.js",
  "./app.js",
  "./manifest.json",
  "./assets/logo.png",
  "./assets/icon-192.png",
  "./assets/icon-512.png"
];

self.addEventListener("install", (event) => {

  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );

});

self.addEventListener("activate", (event) => {

  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_VERSION)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );

});

/* Stale-while-revalidate: serve from cache instantly, refresh the
   cache in the background from the network when available. */
self.addEventListener("fetch", (event) => {

  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(

    caches.match(event.request).then((cached) => {

      const networkFetch = fetch(event.request)
        .then((response) => {

          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, copy));
          }

          return response;

        })
        .catch(() => cached);

      return cached || networkFetch;

    })

  );

});
