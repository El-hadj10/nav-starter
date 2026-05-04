const CACHE_VERSION = 'v2'
const APP_SHELL_CACHE = `nav-starter-shell-${CACHE_VERSION}`
const RUNTIME_CACHE = `nav-starter-runtime-${CACHE_VERSION}`
const API_CACHE = `nav-starter-api-${CACHE_VERSION}`

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
    caches.open(APP_SHELL_CACHE)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys
        .filter((key) => ![APP_SHELL_CACHE, RUNTIME_CACHE, API_CACHE].includes(key))
        .map((key) => caches.delete(key)),
    )).then(() => self.clients.claim()),
  )
})

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)

  const networkPromise = fetch(request)
    .then((response) => {
      if (response && response.ok) {
        cache.put(request, response.clone())
      }
      return response
    })
    .catch(() => null)

  if (cached) {
    void networkPromise
    return cached
  }

  const network = await networkPromise
  return network || Response.error()
}

async function networkFirst(request, cacheName, fallback) {
  const cache = await caches.open(cacheName)

  try {
    const response = await fetch(request)
    if (response && response.ok) {
      cache.put(request, response.clone())
    }
    return response
  } catch {
    const cached = await cache.match(request)
    if (cached) {
      return cached
    }

    if (fallback) {
      return fallback
    }

    return Response.error()
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event

  if (request.method !== 'GET') {
    return
  }

  const requestUrl = new URL(request.url)

  if (request.mode === 'navigate') {
    event.respondWith(
      networkFirst(
        request,
        RUNTIME_CACHE,
        caches.match(BASE_PATH).then((response) => response || Response.error()),
      ),
    )
    return
  }

  if (requestUrl.pathname.startsWith('/api/')) {
    event.respondWith(
      networkFirst(
        request,
        API_CACHE,
        new Response(JSON.stringify({
          error: 'offline',
          message: 'Network unavailable. Showing cached or fallback data.',
        }), {
          headers: { 'Content-Type': 'application/json' },
          status: 503,
        }),
      ),
    )
    return
  }

  if (requestUrl.origin === self.location.origin) {
    event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE))
    return
  }

  if (requestUrl.hostname.includes('mapbox.com') || requestUrl.hostname.includes('openstreetmap.org')) {
    event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE))
  }
})
