const CACHE = 'expence-tracker-pwa-v5';
const APP_SCOPE = '/expence-tracker/';

const CORE = [
  '/expence-tracker/',
  '/expence-tracker/index.html',
  '/expence-tracker/manifest.webmanifest',
  '/expence-tracker/purple-reticle-final-192.png',
  '/expence-tracker/purple-reticle-final-512.png',
  '/expence-tracker/purple-reticle-final-maskable-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(CORE))
  );

  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key =>
            key.startsWith('expence-tracker-') &&
            key !== CACHE
          )
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  if (event.request.method !== 'GET') return;

  // این Service Worker فقط مربوط به ثبت مخارج است
  if (
    url.origin !== self.location.origin ||
    !url.pathname.startsWith(APP_SCOPE)
  ) return;

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const copy = response.clone();

          caches.open(CACHE).then(cache =>
            cache.put('/expence-tracker/index.html', copy)
          );

          return response;
        })
        .catch(() =>
          caches.match('/expence-tracker/index.html')
        )
    );

    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request).then(response => {
        if (response && response.ok) {
          const copy = response.clone();

          caches.open(CACHE).then(cache =>
            cache.put(event.request, copy)
          );
        }

        return response;
      });
    })
  );
});
