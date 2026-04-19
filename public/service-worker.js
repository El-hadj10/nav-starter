const CACHE_NAME = 'nav-starter-v1'
const BASE_PATH = self.location.pathname.replace(/service-worker\.js$/, '')
const APP_SHELL = [
  BASE_PATH,
  `${BASE_PATH}manifest.webmanifest`,
  `${BASE_PATH}apple-touch-icon.png`,
  `${BASE_PATH}pwa-192x192.png`,
  `${BASE_PATH}pwa-512x512.png`,
  `${BASE_PATH}maskable-512x512.png`,
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event

  if (request.method !== 'GET') {
    return
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match(BASE_PATH).then((response) => response || Response.error()),
      ),
    )
    return
  }

  const requestUrl = new URL(request.url)

  if (requestUrl.origin !== self.location.origin) {
    return
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse
      }

      return fetch(request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200) {
          return networkResponse
        }

        const responseClone = networkResponse.clone()
        void caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone))

        return networkResponse
      })
    }),
  )
})