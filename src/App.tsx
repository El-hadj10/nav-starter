import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import mapboxgl from 'mapbox-gl'
import './App.css'
import { formatClock, computeDistanceKm, computeLiveEta } from './lib/navigation'
import { type Locale, messages } from './lib/i18n'

type TabId = 'discover' | 'journeys' | 'saved' | 'profile'
type TravelMode = 'drive' | 'transit' | 'walk'
type SearchStatus = 'idle' | 'loading' | 'ready' | 'error'
type RouteStatus = 'idle' | 'loading' | 'ready' | 'error'
type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'error'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

type Coordinates = {
  latitude: number
  longitude: number
}

type RouteStep = {
  title: string
  detail: string
  baseMinuteOffset: number
}

type SearchResult = {
  id: string
  name: string
  area: string
  coordinates: Coordinates
}

type RouteMetrics = {
  distanceKm: number
  durationMinutes: number
  source: 'live' | 'estimated'
  steps: RouteStep[]
  geometry: [number, number][]
}

type Destination = {
  id: string
  name: string
  area: string
  tag: string
  description: string
  traffic: 'Low' | 'Moderate' | 'Heavy'
  parking: string
  offlinePack: string
  coordinates: Coordinates
  baseSteps: RouteStep[]
}

type SessionUser = {
  email: string
  name: string
}

const configuredApiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/$/, '')
const mapboxPublicToken = (import.meta.env.VITE_MAPBOX_PUBLIC_TOKEN || '').trim()

const favoriteStorageKey = 'nav-starter.favorite-destinations'
const historyStorageKey = 'nav-starter.recent-destinations'
const tokenStorageKey = 'nav-starter.jwt'
const localeStorageKey = 'nav-starter.locale'

const defaultOrigin: Coordinates = { latitude: 5.3207, longitude: -4.0161 }

const travelModes: Array<{ id: TravelMode; labelKey: keyof (typeof messages)['fr'] }> = [
  { id: 'drive', labelKey: 'modeDrive' },
  { id: 'transit', labelKey: 'modeTransit' },
  { id: 'walk', labelKey: 'modeWalk' },
]

const baseDestinations: Destination[] = [
  {
    id: 'marina-hub',
    name: 'Marina Hub',
    area: 'Lagoon District',
    tag: 'Work',
    description: 'Fast waterfront corridor with consistent flow and monitored access.',
    traffic: 'Low',
    parking: '14 spots in Parking B',
    offlinePack: 'Lagoon + Marina',
    coordinates: { latitude: 5.2905, longitude: -3.9876 },
    baseSteps: [
      { title: 'Leave Plateau', detail: 'Head south on Coastal Avenue.', baseMinuteOffset: 0 },
      { title: 'Cross Harbor Bridge', detail: 'Stay right for Marina access.', baseMinuteOffset: 9 },
      { title: 'Arrive at Marina Hub', detail: 'Entry gate B is open.', baseMinuteOffset: 18 },
    ],
  },
  {
    id: 'canal-market',
    name: 'Canal Market',
    area: 'Old Port',
    tag: 'Food',
    description: 'Dense but predictable urban route, better in transit at peak hours.',
    traffic: 'Moderate',
    parking: 'Street parking, average wait 6 min',
    offlinePack: 'Port Core',
    coordinates: { latitude: 5.3162, longitude: -4.0154 },
    baseSteps: [
      { title: 'Take Riverside Boulevard', detail: 'Use center lane near market zone.', baseMinuteOffset: 0 },
      { title: 'Switch at Market Junction', detail: 'Transit stop M2 is nearby.', baseMinuteOffset: 7 },
      { title: 'Arrive at Canal Market', detail: 'Main hall opens at 09:00.', baseMinuteOffset: 16 },
    ],
  },
  {
    id: 'sunset-point',
    name: 'Sunset Point',
    area: 'Cliffside',
    tag: 'Leisure',
    description: 'Scenic segment with stable fallback for offline guidance.',
    traffic: 'Moderate',
    parking: 'Scenic lot currently at 60% capacity',
    offlinePack: 'Cliffside Trails',
    coordinates: { latitude: 5.3575, longitude: -3.9331 },
    baseSteps: [
      { title: 'Exit city ring', detail: 'Use eastern hill road.', baseMinuteOffset: 0 },
      { title: 'Climb Ridge Pass', detail: 'Moderate curves ahead.', baseMinuteOffset: 13 },
      { title: 'Reach Sunset Point', detail: 'Northern platform has best view.', baseMinuteOffset: 29 },
    ],
  },
  {
    id: 'airport-gate',
    name: 'Airport Gate C',
    area: 'North Terminal',
    tag: 'Travel',
    description: 'Priority lane with stronger traffic variability during rush.',
    traffic: 'Heavy',
    parking: 'Drop-off only, gate C recommended',
    offlinePack: 'Airport Ring',
    coordinates: { latitude: 5.2614, longitude: -3.9263 },
    baseSteps: [
      { title: 'Join northern expressway', detail: 'Take lane 2 for faster progression.', baseMinuteOffset: 0 },
      { title: 'Pass cargo interchange', detail: 'Expect congestion pocket.', baseMinuteOffset: 15 },
      { title: 'Reach Airport Gate C', detail: 'Drop-off lane is open.', baseMinuteOffset: 31 },
    ],
  },
]

function buildApiUrl(pathname: string): URL {
  if (configuredApiBaseUrl) {
    return new URL(pathname, `${configuredApiBaseUrl}/`)
  }
  return new URL(pathname, window.location.origin)
}

function readStoredIds(storageKey: string, fallback: string[]) {
  try {
    const raw = window.localStorage.getItem(storageKey)
    if (!raw) return fallback
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return fallback
    return parsed.filter((entry): entry is string => typeof entry === 'string')
  } catch {
    return fallback
  }
}

function parseLocale(raw: string | null): Locale {
  return raw === 'en' ? 'en' : 'fr'
}

function estimatedSteps(destination: Destination, eta: number): RouteStep[] {
  return [
    {
      title: 'Leave current position',
      detail: `Head toward ${destination.area} using the fastest available corridor.`,
      baseMinuteOffset: 0,
    },
    {
      title: `Approach ${destination.name}`,
      detail: destination.description,
      baseMinuteOffset: Math.max(4, Math.round(eta * 0.55)),
    },
    {
      title: `Arrive at ${destination.name}`,
      detail: destination.parking,
      baseMinuteOffset: eta,
    },
  ]
}

function App() {
  const [locale, setLocale] = useState<Locale>(() => parseLocale(window.localStorage.getItem(localeStorageKey)))
  const t = messages[locale]

  const [activeTab, setActiveTab] = useState<TabId>('discover')
  const [travelMode, setTravelMode] = useState<TravelMode>('drive')
  const [query, setQuery] = useState('')
  const [selectedDestinationId, setSelectedDestinationId] = useState('marina-hub')
  const [selectedSearchResult, setSelectedSearchResult] = useState<SearchResult | null>(null)

  const [locationLabel, setLocationLabel] = useState('Lagoon District')
  const [locationState, setLocationState] = useState('GPS ready')
  const [currentCoordinates, setCurrentCoordinates] = useState<Coordinates | null>(null)

  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searchStatus, setSearchStatus] = useState<SearchStatus>('idle')
  const [searchError, setSearchError] = useState('')

  const [routeMetrics, setRouteMetrics] = useState<RouteMetrics | null>(null)
  const [routeStatus, setRouteStatus] = useState<RouteStatus>('idle')
  const [routeError, setRouteError] = useState('')

  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => readStoredIds(favoriteStorageKey, ['marina-hub']))
  const [recentIds, setRecentIds] = useState<string[]>(() => readStoredIds(historyStorageKey, ['marina-hub']))

  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)

  const [authStatus, setAuthStatus] = useState<AuthStatus>('idle')
  const [authError, setAuthError] = useState('')
  const [emailInput, setEmailInput] = useState('demo@navstarter.dev')
  const [passwordInput, setPasswordInput] = useState('NavStarter123!')
  const [token, setToken] = useState(() => window.localStorage.getItem(tokenStorageKey) || '')
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null)

  const mapNodeRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const originMarkerRef = useRef<mapboxgl.Marker | null>(null)
  const destinationMarkerRef = useRef<mapboxgl.Marker | null>(null)
  const [mapError, setMapError] = useState('')

  const routeOrigin = currentCoordinates ?? defaultOrigin

  const destinations = useMemo(() => baseDestinations.map((destination) => {
    const directDistanceKm = computeDistanceKm(routeOrigin, destination.coordinates)
    const routedDistanceKm = Math.max(1, Math.round(directDistanceKm * 1.18 * 10) / 10)

    return {
      ...destination,
      distanceKm: routedDistanceKm,
      etaByMode: {
        drive: computeLiveEta(routedDistanceKm, 'drive', destination.traffic),
        transit: computeLiveEta(routedDistanceKm, 'transit', destination.traffic),
        walk: computeLiveEta(routedDistanceKm, 'walk', destination.traffic),
      },
    }
  }), [routeOrigin])

  const filteredDestinations = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return destinations
    return destinations.filter((destination) =>
      [destination.name, destination.area, destination.tag].join(' ').toLowerCase().includes(normalized),
    )
  }, [destinations, query])

  const selectedDestination = useMemo(() => {
    if (selectedSearchResult) {
      return {
        id: selectedSearchResult.id,
        name: selectedSearchResult.name,
        area: selectedSearchResult.area,
        tag: 'Search',
        description: 'Destination resolved from online geocoding.',
        traffic: 'Moderate' as const,
        parking: 'Live parking details unavailable for this result',
        offlinePack: 'Online route only',
        coordinates: selectedSearchResult.coordinates,
        baseSteps: [
          { title: 'Leave current position', detail: `Start route guidance toward ${selectedSearchResult.name}.`, baseMinuteOffset: 0 },
          { title: `Approach ${selectedSearchResult.area}`, detail: 'Follow live map guidance.', baseMinuteOffset: 6 },
          { title: `Arrive at ${selectedSearchResult.name}`, detail: 'Check final approach nearby.', baseMinuteOffset: 12 },
        ],
        distanceKm: 1,
        etaByMode: { drive: 8, transit: 12, walk: 20 },
      }
    }

    return destinations.find((entry) => entry.id === selectedDestinationId) ?? destinations[0]
  }, [destinations, selectedDestinationId, selectedSearchResult])

  const favoriteDestinations = useMemo(
    () => destinations.filter((destination) => favoriteIds.includes(destination.id)),
    [destinations, favoriteIds],
  )

  const recentDestinations = useMemo(
    () =>
      recentIds
        .map((id) => destinations.find((destination) => destination.id === id))
        .filter((destination): destination is (typeof destinations)[number] => Boolean(destination)),
    [recentIds, destinations],
  )

  const shouldSearchOnline = query.trim().length >= 3
  const activeEta = routeMetrics?.durationMinutes ?? selectedDestination.etaByMode[travelMode]
  const arrivalTime = formatClock(activeEta)

  const tabLabels = {
    discover: t.tabDiscover,
    journeys: t.tabJourneys,
    saved: t.tabSaved,
    profile: t.tabProfile,
  }

  useEffect(() => {
    window.localStorage.setItem(localeStorageKey, locale)
  }, [locale])

  useEffect(() => {
    window.localStorage.setItem(favoriteStorageKey, JSON.stringify(favoriteIds))
  }, [favoriteIds])

  useEffect(() => {
    window.localStorage.setItem(historyStorageKey, JSON.stringify(recentIds))
  }, [recentIds])

  useEffect(() => {
    if (!token) {
      window.localStorage.removeItem(tokenStorageKey)
      return
    }
    window.localStorage.setItem(tokenStorageKey, token)
  }, [token])

  useEffect(() => {
    if (!token) {
      return
    }

    const controller = new AbortController()

    void (async () => {
      setAuthStatus('loading')
      setAuthError('')

      try {
        const endpoint = buildApiUrl('/api/auth/session')
        const response = await fetch(endpoint.toString(), {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error('Session expired')
        }

        const payload = (await response.json()) as { user?: { sub?: string } }
        setSessionUser({
          email: payload.user?.sub || emailInput,
          name: 'Demo Navigator',
        })
        setAuthStatus('authenticated')
      } catch (error) {
        if ((error as Error).name === 'AbortError') return
        setAuthStatus('error')
        setAuthError(t.authSessionExpired)
        setToken('')
        setSessionUser(null)
      }
    })()

    return () => controller.abort()
  }, [token, t.authSessionExpired, emailInput])

  useEffect(() => {
    const normalizedQuery = query.trim()

    if (normalizedQuery.length < 3) {
      return
    }

    const controller = new AbortController()
    const timeoutId = window.setTimeout(async () => {
      setSearchStatus('loading')
      setSearchError('')

      try {
        const endpoint = buildApiUrl('/api/geocode')
        endpoint.searchParams.set('q', normalizedQuery)

        const response = await fetch(endpoint.toString(), {
          signal: controller.signal,
          headers: {
            Accept: 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        })

        if (!response.ok) {
          throw new Error('Search failed')
        }

        const payload = (await response.json()) as {
          features: Array<{
            id: string
            place_name: string
            text: string
            center: [number, number]
            context?: Array<{ text: string }>
          }>
        }

        const nextResults = payload.features.map((entry) => ({
          id: entry.id,
          name: entry.text,
          area: entry.context?.[0]?.text || entry.place_name.split(',')[1] || 'Result',
          coordinates: {
            latitude: entry.center[1],
            longitude: entry.center[0],
          },
        }))

        setSearchResults(nextResults)
        setSearchStatus('ready')
      } catch (error) {
        if ((error as Error).name === 'AbortError') return
        setSearchResults([])
        setSearchStatus('error')
        setSearchError(t.searchError)
      }
    }, 360)

    return () => {
      controller.abort()
      window.clearTimeout(timeoutId)
    }
  }, [query, token, t.searchError])

  useEffect(() => {
    const controller = new AbortController()

    const buildEstimatedRoute = () => {
      const eta = selectedDestination.etaByMode[travelMode]
      const distance = Math.max(
        1,
        Math.round(computeDistanceKm(routeOrigin, selectedDestination.coordinates) * 1.18 * 10) / 10,
      )

      setRouteMetrics({
        distanceKm: distance,
        durationMinutes: eta,
        source: 'estimated',
        steps: selectedDestination.baseSteps.length ? selectedDestination.baseSteps : estimatedSteps(selectedDestination, eta),
        geometry: [
          [routeOrigin.longitude, routeOrigin.latitude],
          [selectedDestination.coordinates.longitude, selectedDestination.coordinates.latitude],
        ],
      })
      setRouteStatus('error')
      setRouteError(t.routeFallback)
    }

    if (travelMode === 'transit') {
      buildEstimatedRoute()
      return
    }

    void (async () => {
      setRouteStatus('loading')
      setRouteError('')

      try {
        const profile = travelMode === 'walk' ? 'walking' : 'driving'
        const endpoint = buildApiUrl('/api/route')
        endpoint.searchParams.set('from', `${routeOrigin.longitude},${routeOrigin.latitude}`)
        endpoint.searchParams.set('to', `${selectedDestination.coordinates.longitude},${selectedDestination.coordinates.latitude}`)
        endpoint.searchParams.set('profile', profile)

        const response = await fetch(endpoint.toString(), {
          signal: controller.signal,
          headers: {
            Accept: 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        })

        if (!response.ok) {
          throw new Error('Routing failed')
        }

        const payload = (await response.json()) as {
          routes?: Array<{
            distance: number
            duration: number
            geometry?: { coordinates: [number, number][] }
            legs?: Array<{
              steps?: Array<{ maneuver?: { instruction?: string; type?: string }; name: string }>
            }>
          }>
        }

        const route = payload.routes?.[0]
        if (!route) {
          throw new Error('No route')
        }

        const steps = route.legs?.[0]?.steps?.slice(0, 4).map((step, index) => ({
          title: step.maneuver?.instruction || step.name || `Step ${index + 1}`,
          detail: step.name || step.maneuver?.type || 'Continue on suggested route.',
          baseMinuteOffset: Math.round((route.duration / 60 / 3) * index),
        })) ?? []

        const geometry: [number, number][] = route.geometry?.coordinates && route.geometry.coordinates.length >= 2
          ? route.geometry.coordinates.map(([lng, lat]) => [lng, lat] as [number, number])
          : [
              [routeOrigin.longitude, routeOrigin.latitude],
              [selectedDestination.coordinates.longitude, selectedDestination.coordinates.latitude],
            ]

        setRouteMetrics({
          distanceKm: Math.max(1, Math.round((route.distance / 1000) * 10) / 10),
          durationMinutes: Math.max(1, Math.round(route.duration / 60)),
          source: 'live',
          steps: steps.length ? steps : estimatedSteps(selectedDestination, selectedDestination.etaByMode[travelMode]),
          geometry,
        })
        setRouteStatus('ready')
      } catch (error) {
        if ((error as Error).name === 'AbortError') return
        buildEstimatedRoute()
      }
    })()

    return () => controller.abort()
  }, [routeOrigin, selectedDestination, travelMode, token, t.routeFallback])

  useEffect(() => {
    const mediaQuery = window.matchMedia('(display-mode: standalone)')

    const updateInstalled = () => {
      const nav = navigator as Navigator & { standalone?: boolean }
      setIsInstalled(mediaQuery.matches || nav.standalone === true)
    }

    const onPrompt = (event: Event) => {
      event.preventDefault()
      setInstallPrompt(event as BeforeInstallPromptEvent)
    }

    const onInstalled = () => {
      setInstallPrompt(null)
      setIsInstalled(true)
    }

    updateInstalled()
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    mediaQuery.addEventListener('change', updateInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
      mediaQuery.removeEventListener('change', updateInstalled)
    }
  }, [])

  useEffect(() => {
    if (!mapNodeRef.current || mapRef.current) {
      return
    }

    if (!mapboxPublicToken) {
      return
    }

    mapboxgl.accessToken = mapboxPublicToken
    const map = new mapboxgl.Map({
      container: mapNodeRef.current,
      style: 'mapbox://styles/mapbox/navigation-night-v1',
      center: [routeOrigin.longitude, routeOrigin.latitude],
      zoom: 11,
      attributionControl: false,
    })

    map.addControl(new mapboxgl.NavigationControl({ showCompass: true }), 'top-right')
    mapRef.current = map

    map.on('error', () => {
      setMapError(t.mapLoadFailed)
    })

    return () => {
      originMarkerRef.current?.remove()
      destinationMarkerRef.current?.remove()
      map.remove()
      mapRef.current = null
    }
  }, [routeOrigin.latitude, routeOrigin.longitude, t.mapLoadFailed, t.mapTokenMissing])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !routeMetrics) {
      return
    }

    const originLngLat: [number, number] = [routeOrigin.longitude, routeOrigin.latitude]
    const destinationLngLat: [number, number] = [selectedDestination.coordinates.longitude, selectedDestination.coordinates.latitude]

    if (!originMarkerRef.current) {
      originMarkerRef.current = new mapboxgl.Marker({ color: '#8cf7a7' }).setLngLat(originLngLat).addTo(map)
    } else {
      originMarkerRef.current.setLngLat(originLngLat)
    }

    if (!destinationMarkerRef.current) {
      destinationMarkerRef.current = new mapboxgl.Marker({ color: '#47ffe5' }).setLngLat(destinationLngLat).addTo(map)
    } else {
      destinationMarkerRef.current.setLngLat(destinationLngLat)
    }

    const lineData = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: routeMetrics.geometry,
      },
    }

    const existingSource = map.getSource('route-line') as mapboxgl.GeoJSONSource | undefined
    if (existingSource) {
      existingSource.setData(lineData as never)
    } else if (map.isStyleLoaded()) {
      map.addSource('route-line', { type: 'geojson', data: lineData as never })
      map.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'route-line',
        paint: {
          'line-color': '#47ffe5',
          'line-width': 4,
          'line-opacity': 0.9,
        },
      })
    }

    const bounds = new mapboxgl.LngLatBounds(originLngLat, originLngLat)
    routeMetrics.geometry.forEach(([lng, lat]) => bounds.extend([lng, lat]))
    map.fitBounds(bounds, { padding: 70, duration: 650, maxZoom: 13 })
  }, [routeMetrics, routeOrigin, selectedDestination.coordinates])

  const handleInstall = async () => {
    if (!installPrompt) return
    await installPrompt.prompt()
    const choice = await installPrompt.userChoice
    if (choice.outcome === 'accepted') {
      setInstallPrompt(null)
    }
  }

  const handleLocate = () => {
    if (!('geolocation' in navigator)) {
      setLocationState(t.geoUnavailable)
      return
    }

    setLocationState(t.geoRefreshing)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextCoordinates = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }
        setCurrentCoordinates(nextCoordinates)
        setLocationLabel(`Near ${selectedDestination.area}`)
        setLocationState(t.geoLocked)
      },
      () => setLocationState(t.geoDenied),
      { enableHighAccuracy: true, maximumAge: 300000, timeout: 10000 },
    )
  }

  const handleSelectDestination = (destinationId: string) => {
    setSelectedSearchResult(null)
    setSelectedDestinationId(destinationId)
    setRecentIds((currentIds) => [destinationId, ...currentIds.filter((id) => id !== destinationId)].slice(0, 4))
    setActiveTab('discover')
    setLocationState(t.routeUpdated)
  }

  const handleSelectSearchResult = (result: SearchResult) => {
    setSelectedSearchResult(result)
    setActiveTab('discover')
    setLocationState(t.routeUpdated)
  }

  const toggleFavorite = (destinationId: string) => {
    setFavoriteIds((currentIds) => {
      if (currentIds.includes(destinationId)) {
        return currentIds.filter((id) => id !== destinationId)
      }
      return [destinationId, ...currentIds]
    })
  }

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setAuthStatus('loading')
    setAuthError('')

    try {
      const endpoint = buildApiUrl('/api/auth/login')
      const response = await fetch(endpoint.toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput, password: passwordInput }),
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string }
        throw new Error(payload.error || 'Login failed')
      }

      const payload = (await response.json()) as { token: string; user: SessionUser }
      setToken(payload.token)
      setSessionUser(payload.user)
      setAuthStatus('authenticated')
    } catch (error) {
      setAuthStatus('error')
      setAuthError((error as Error).message || t.authLoginFailed)
    }
  }

  const handleLogout = () => {
    setToken('')
    setSessionUser(null)
    setAuthStatus('idle')
    setAuthError('')
  }

  const renderDiscoverScreen = () => (
    <>
      <section className="map-card">
        <div ref={mapNodeRef} className="map-canvas" data-testid="map-canvas" />
        {(mapboxPublicToken ? mapError : t.mapTokenMissing) ? (
          <div className="map-error-banner">{mapboxPublicToken ? mapError : t.mapTokenMissing}</div>
        ) : null}
        <div className="map-overlay">
          <p className="micro-label">{t.liveRoute}</p>
          <strong>{selectedDestination.name}</strong>
          <span>
            {activeEta} min · {travelMode} · {arrivalTime}
          </span>
          {routeStatus === 'loading' ? <span className="inline-loading">{t.routeLoading}</span> : null}
          {routeError ? <span className="inline-error">{routeError}</span> : null}
        </div>
      </section>

      <section className="panel-card search-card">
        <div className="search-row">
          <label className="search-field">
            <span className="sr-only">Search destination</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t.searchPlaceholder}
            />
          </label>
          <button type="button" className="ghost-button" onClick={handleLocate}>
            {t.locateMe}
          </button>
        </div>

        <div className="mode-switcher" aria-label="Travel mode">
          {travelModes.map((mode) => (
            <button
              key={mode.id}
              type="button"
              className={mode.id === travelMode ? 'mode-button is-active' : 'mode-button'}
              onClick={() => setTravelMode(mode.id)}
            >
              {t[mode.labelKey]}
            </button>
          ))}
        </div>

        <div className="results-list">
          {filteredDestinations.map((destination) => {
            const isSelected = destination.id === selectedDestination.id
            const isFavorite = favoriteIds.includes(destination.id)

            return (
              <article key={destination.id} className={isSelected ? 'result-card is-selected' : 'result-card'}>
                <button type="button" className="result-main" onClick={() => handleSelectDestination(destination.id)}>
                  <div>
                    <p className="micro-label">{destination.tag}</p>
                    <strong>{destination.name}</strong>
                    <p>{destination.area}</p>
                  </div>
                  <div className="result-meta">
                    <span>{destination.etaByMode[travelMode]} min</span>
                    <small>{destination.distanceKm} km</small>
                  </div>
                </button>
                <button
                  type="button"
                  className={isFavorite ? 'favorite-button is-active' : 'favorite-button'}
                  onClick={() => toggleFavorite(destination.id)}
                >
                  {isFavorite ? t.saved : t.save}
                </button>
              </article>
            )
          })}

          {filteredDestinations.length === 0 ? <p className="empty-state">{t.noDestination}</p> : null}

          {shouldSearchOnline ? (
            <section className="remote-results-block">
              <div className="section-header-row compact-header">
                <div>
                  <p className="micro-label">{t.onlineSearch}</p>
                  <strong>OpenStreetMap</strong>
                </div>
                <span className="result-source-badge">
                  {searchStatus === 'loading'
                    ? t.searching
                    : searchStatus === 'error'
                      ? t.unavailable
                      : searchResults.length
                        ? `${searchResults.length} ${t.found}`
                        : t.noMatch}
                </span>
              </div>

              {searchStatus === 'loading' ? <div className="skeleton-row" /> : null}
              {searchError ? <p className="error-state">{searchError}</p> : null}

              {searchResults.map((result) => (
                <article key={result.id} className="result-card remote-card">
                  <button type="button" className="result-main" onClick={() => handleSelectSearchResult(result)}>
                    <div>
                      <p className="micro-label">Search</p>
                      <strong>{result.name}</strong>
                      <p>{result.area}</p>
                    </div>
                    <div className="result-meta">
                      <span>{t.routeLabel}</span>
                      <small>{t.liveGeocode}</small>
                    </div>
                  </button>
                </article>
              ))}
            </section>
          ) : null}
        </div>
      </section>
    </>
  )

  const renderJourneyScreen = () => (
    <section className="panel-card timeline-card">
      <div className="section-header-row">
        <div>
          <p className="micro-label">{t.activeRoute}</p>
          <h2>{selectedDestination.name}</h2>
        </div>
        <span className="signal-badge">ETA {activeEta} min</span>
      </div>

      <ol className="timeline-list">
        {(routeMetrics?.steps || selectedDestination.baseSteps).map((step) => (
          <li key={step.title}>
            <span>{formatClock(step.baseMinuteOffset)}</span>
            <div>
              <strong>{step.title}</strong>
              <p>{step.detail}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="journey-summary-grid">
        <article>
          <strong>{selectedDestination.parking}</strong>
          <span>{t.parkingStatus}</span>
        </article>
        <article>
          <strong>{routeMetrics?.source === 'live' ? t.liveRouting : selectedDestination.offlinePack}</strong>
          <span>{routeMetrics?.source === 'live' ? t.routingSource : t.offlinePack}</span>
        </article>
      </div>
    </section>
  )

  const renderSavedScreen = () => (
    <section className="panel-card saved-card">
      <div className="section-header-row">
        <div>
          <p className="micro-label">{t.favorites}</p>
          <h2>{t.quickDestinations}</h2>
        </div>
        <span className="signal-badge">{favoriteDestinations.length} {t.saved}</span>
      </div>

      <div className="saved-list">
        {favoriteDestinations.map((destination) => (
          <article key={destination.id} className="saved-item-card">
            <button type="button" className="saved-item" onClick={() => handleSelectDestination(destination.id)}>
              <div>
                <strong>{destination.name}</strong>
                <p>{destination.tag} · {destination.area}</p>
              </div>
              <span>{destination.etaByMode[travelMode]} min</span>
            </button>
            <button type="button" className="ghost-button inline-ghost" onClick={() => toggleFavorite(destination.id)}>
              {t.remove}
            </button>
          </article>
        ))}

        {favoriteDestinations.length === 0 ? <p className="empty-state">{t.noFavorites}</p> : null}
      </div>
    </section>
  )

  const renderProfileScreen = () => (
    <section className="panel-card profile-card">
      <div>
        <p className="micro-label">{t.profile}</p>
        <h2>{t.usageSnapshot}</h2>
      </div>

      <div className="profile-grid">
        <article>
          <strong>{recentIds.length + 9}</strong>
          <span>{t.tripsWeek}</span>
        </article>
        <article>
          <strong>{favoriteIds.length * 7 + recentIds.length * 4} min</strong>
          <span>{t.timeSaved}</span>
        </article>
        <article>
          <strong>{favoriteIds.length}</strong>
          <span>{t.favoriteDestinations}</span>
        </article>
      </div>

      <div className="recent-panel">
        <div className="section-header-row">
          <div>
            <p className="micro-label">{t.recentActivity}</p>
            <h2>{t.lastRoutes}</h2>
          </div>
        </div>

        <div className="recent-list">
          {recentDestinations.map((destination) => (
            <button key={destination.id} type="button" className="recent-item" onClick={() => handleSelectDestination(destination.id)}>
              <div>
                <strong>{destination.name}</strong>
                <p>{destination.area}</p>
              </div>
              <span>{destination.etaByMode[travelMode]} min</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  )

  const renderScreen = () => {
    if (activeTab === 'discover') return renderDiscoverScreen()
    if (activeTab === 'journeys') return renderJourneyScreen()
    if (activeTab === 'saved') return renderSavedScreen()
    return renderProfileScreen()
  }

  const isInstallDisabled = isInstalled || !installPrompt

  return (
    <main className="app-shell">
      <section className="intro-panel">
        <div className="section-header-row locale-row">
          <div>
            <p className="eyebrow">{t.operationalTitle}</p>
            <h1>{t.heroTitle}</h1>
          </div>
          <button
            type="button"
            className="ghost-button"
            onClick={() => setLocale((current) => (current === 'fr' ? 'en' : 'fr'))}
            data-testid="locale-toggle"
          >
            {locale === 'fr' ? 'EN' : 'FR'}
          </button>
        </div>

        <p className="lead">{t.heroLead}</p>

        <div className="auth-panel">
          <div>
            <p className="micro-label">{t.authentication}</p>
            <strong>{sessionUser ? `${t.loggedInAs} ${sessionUser.email}` : t.loginRequired}</strong>
            <p>{t.demoCredentials}</p>
          </div>

          {sessionUser ? (
            <button type="button" className="ghost-button" onClick={handleLogout}>
              {t.logout}
            </button>
          ) : (
            <form className="auth-form" onSubmit={handleLogin}>
              <input
                type="email"
                value={emailInput}
                onChange={(event) => setEmailInput(event.target.value)}
                placeholder="demo@navstarter.dev"
                required
              />
              <input
                type="password"
                value={passwordInput}
                onChange={(event) => setPasswordInput(event.target.value)}
                placeholder="NavStarter123!"
                required
              />
              <button type="submit" className="install-button" disabled={authStatus === 'loading'}>
                {authStatus === 'loading' ? t.loggingIn : t.login}
              </button>
            </form>
          )}

          {authError ? <p className="error-state">{authError}</p> : null}
        </div>

        <div className="install-banner">
          <div>
            <p className="micro-label">{t.installStatus}</p>
            <strong>{isInstalled ? t.alreadyInstalled : t.readyToInstall}</strong>
            <p>{t.installHint}</p>
          </div>
          <button className="install-button" onClick={() => void handleInstall()} disabled={isInstallDisabled}>
            {isInstalled ? t.alreadyInstalled : t.installApp}
          </button>
        </div>

        <div className="summary-grid">
          <article className="summary-card">
            <p className="micro-label">{t.navigation}</p>
            <strong>{destinations.length} {t.destinations}</strong>
            <span>{t.destinationHint}</span>
          </article>
          <article className="summary-card">
            <p className="micro-label">{t.persistence}</p>
            <strong>{favoriteIds.length} {t.saved}</strong>
            <span>{t.persistenceHint}</span>
          </article>
          <article className="summary-card">
            <p className="micro-label">{t.currentRoute}</p>
            <strong>{selectedDestination.name}</strong>
            <span>{t.arrivalAround} {arrivalTime} · {travelMode}</span>
          </article>
        </div>
      </section>

      <section className="experience-grid">
        <article className="phone-frame" aria-label="Phone preview">
          <div className="phone-topbar">
            <span>{formatClock(0)}</span>
            <span>5G</span>
          </div>

          <div className="screen-header">
            <div>
              <p className="micro-label">{t.currentArea}</p>
              <strong>{locationLabel}</strong>
            </div>
            <span className="signal-badge">{locationState}</span>
          </div>

          <div className="screen-content">{renderScreen()}</div>

          <nav className="bottom-nav" aria-label="App sections">
            {(['discover', 'journeys', 'saved', 'profile'] as TabId[]).map((tabId) => (
              <button
                key={tabId}
                type="button"
                className={tabId === activeTab ? 'tab-button is-active' : 'tab-button'}
                onClick={() => setActiveTab(tabId)}
              >
                <span>{tabId === 'discover' ? '◎' : tabId === 'journeys' ? '↗' : tabId === 'saved' ? '★' : '◌'}</span>
                <span>{tabLabels[tabId]}</span>
              </button>
            ))}
          </nav>
        </article>

        <aside className="details-panel">
          <section className="details-card accent-surface">
            <p className="micro-label">{t.operationalState}</p>
            <h2>{selectedDestination.name}</h2>
            <ul>
              <li>{selectedDestination.description}</li>
              <li>{t.detailsGeo}</li>
              <li>{t.detailsSearch}</li>
              <li>{t.detailsAuth}</li>
              <li>{routeMetrics?.source === 'live' ? t.liveRouting : selectedDestination.offlinePack}</li>
            </ul>
          </section>

          <section className="details-card">
            <p className="micro-label">{t.uxState}</p>
            <h2>{t.uxTitle}</h2>
            <ol>
              <li>{searchStatus === 'loading' ? t.searchSkeleton : t.searchReady}</li>
              <li>{routeStatus === 'loading' ? t.routeSkeleton : t.routeReady}</li>
              <li>{searchError || routeError ? t.clearErrors : t.noErrorNow}</li>
            </ol>
          </section>

          <section className="details-card compact-card">
            <p className="micro-label">Repository</p>
            <a className="repo-link" href="https://github.com/your-username/your-repo" target="_blank" rel="noopener noreferrer">
              github.com/your-username/your-repo
            </a>
          </section>
        </aside>
      </section>
    </main>
  )
}

export default App
