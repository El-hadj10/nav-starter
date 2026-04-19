import { useEffect, useMemo, useState } from 'react'
import './App.css'

type TabId = 'discover' | 'journeys' | 'saved' | 'profile'
type TravelMode = 'drive' | 'transit' | 'walk'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

type RouteStep = {
  title: string
  detail: string
  baseMinuteOffset: number
}

type Coordinates = {
  latitude: number
  longitude: number
}

type SearchResult = {
  id: string
  name: string
  area: string
  coordinates: Coordinates
}

type SearchStatus = 'idle' | 'loading' | 'ready' | 'error'

type RouteMetrics = {
  distanceKm: number
  durationMinutes: number
  steps: RouteStep[]
  source: 'live' | 'estimated'
}

type Destination = {
  id: string
  name: string
  area: string
  tag: string
  description: string
  distanceKm: number
  traffic: 'Low' | 'Moderate' | 'Heavy'
  parking: string
  etaByMode: Record<TravelMode, number>
  offlinePack: string
  coordinates: Coordinates
  steps: RouteStep[]
}

const tabs: Array<{ id: TabId; label: string; icon: string }> = [
  { id: 'discover', label: 'Discover', icon: '◎' },
  { id: 'journeys', label: 'Journeys', icon: '↗' },
  { id: 'saved', label: 'Saved', icon: '★' },
  { id: 'profile', label: 'Profile', icon: '◌' },
]

const travelModes: Array<{ id: TravelMode; label: string }> = [
  { id: 'drive', label: 'Drive' },
  { id: 'transit', label: 'Transit' },
  { id: 'walk', label: 'Walk' },
]

const destinations: Destination[] = [
  {
    id: 'marina-hub',
    name: 'Marina Hub',
    area: 'Lagoon District',
    tag: 'Work',
    description: 'Fast waterfront route with monitored parking and low congestion.',
    distanceKm: 12,
    traffic: 'Low',
    parking: '14 spots in Parking B',
    etaByMode: { drive: 18, transit: 27, walk: 82 },
    offlinePack: 'Lagoon + Marina',
    coordinates: { latitude: 5.2905, longitude: -3.9876 },
    steps: [
      {
        title: 'Leave Plateau',
        detail: 'Head south on Coastal Avenue and stay on the express lane.',
        baseMinuteOffset: 0,
      },
      {
        title: 'Cross Harbor Bridge',
        detail: 'Light traffic reported, keep right for Marina access.',
        baseMinuteOffset: 8,
      },
      {
        title: 'Arrive at Marina Hub',
        detail: 'Entry gate B is the quickest entrance this morning.',
        baseMinuteOffset: 18,
      },
    ],
  },
  {
    id: 'canal-market',
    name: 'Canal Market',
    area: 'Old Port',
    tag: 'Food',
    description: 'Compact route with dense activity and better access by transit.',
    distanceKm: 8,
    traffic: 'Moderate',
    parking: 'Street parking, average wait 6 min',
    etaByMode: { drive: 21, transit: 16, walk: 54 },
    offlinePack: 'Port Core',
    coordinates: { latitude: 5.3162, longitude: -4.0154 },
    steps: [
      {
        title: 'Take Riverside Boulevard',
        detail: 'Road works on the west side, keep the center lane.',
        baseMinuteOffset: 0,
      },
      {
        title: 'Switch at Market Junction',
        detail: 'Transit stop M2 is directly next to the main entrance.',
        baseMinuteOffset: 9,
      },
      {
        title: 'Arrive at Canal Market',
        detail: 'Food hall opens fully at 09:00.',
        baseMinuteOffset: 16,
      },
    ],
  },
  {
    id: 'sunset-point',
    name: 'Sunset Point',
    area: 'Cliffside',
    tag: 'Leisure',
    description: 'Scenic route with slower curves but strong offline coverage.',
    distanceKm: 19,
    traffic: 'Moderate',
    parking: 'Scenic lot currently at 60% capacity',
    etaByMode: { drive: 29, transit: 42, walk: 120 },
    offlinePack: 'Cliffside Trails',
    coordinates: { latitude: 5.3575, longitude: -3.9331 },
    steps: [
      {
        title: 'Exit city ring',
        detail: 'Take the eastern hill road and avoid the construction detour.',
        baseMinuteOffset: 0,
      },
      {
        title: 'Climb Ridge Pass',
        detail: 'Visibility is clear, moderate curve density ahead.',
        baseMinuteOffset: 13,
      },
      {
        title: 'Reach Sunset Point',
        detail: 'Best overlook is on the northern platform.',
        baseMinuteOffset: 29,
      },
    ],
  },
  {
    id: 'airport-gate',
    name: 'Airport Gate',
    area: 'North Terminal',
    tag: 'Travel',
    description: 'Priority corridor with heavier traffic but predictable timing.',
    distanceKm: 24,
    traffic: 'Heavy',
    parking: 'Drop-off only, gate C recommended',
    etaByMode: { drive: 36, transit: 31, walk: 180 },
    offlinePack: 'Airport Ring',
    coordinates: { latitude: 5.2614, longitude: -3.9263 },
    steps: [
      {
        title: 'Join northern expressway',
        detail: 'Use lane 2 to bypass freight entry traffic.',
        baseMinuteOffset: 0,
      },
      {
        title: 'Pass cargo interchange',
        detail: 'Delay pocket of around 5 minutes expected.',
        baseMinuteOffset: 15,
      },
      {
        title: 'Reach Airport Gate C',
        detail: 'Pickup and drop-off lane is currently open.',
        baseMinuteOffset: 31,
      },
    ],
  },
]

const favoriteStorageKey = 'nav-starter.favorite-destinations'
const historyStorageKey = 'nav-starter.recent-destinations'
const defaultOrigin: Coordinates = { latitude: 5.3207, longitude: -4.0161 }

function readStoredIds(storageKey: string, fallback: string[]) {
  if (typeof window === 'undefined') {
    return fallback
  }

  try {
    const rawValue = window.localStorage.getItem(storageKey)

    if (!rawValue) {
      return fallback
    }

    const parsedValue = JSON.parse(rawValue)

    if (!Array.isArray(parsedValue)) {
      return fallback
    }

    return parsedValue.filter((entry): entry is string => typeof entry === 'string')
  } catch {
    return fallback
  }
}

function persistIds(storageKey: string, values: string[]) {
  window.localStorage.setItem(storageKey, JSON.stringify(values))
}

function formatClock(offsetInMinutes: number) {
  const now = new Date()
  now.setMinutes(now.getMinutes() + offsetInMinutes)

  return now.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function toRadians(value: number) {
  return (value * Math.PI) / 180
}

function computeDistanceKm(origin: Coordinates, destination: Coordinates) {
  const earthRadiusKm = 6371
  const latitudeDelta = toRadians(destination.latitude - origin.latitude)
  const longitudeDelta = toRadians(destination.longitude - origin.longitude)
  const startLatitude = toRadians(origin.latitude)
  const endLatitude = toRadians(destination.latitude)

  const haversineValue =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(startLatitude) *
      Math.cos(endLatitude) *
      Math.sin(longitudeDelta / 2) ** 2

  const centralAngle = 2 * Math.atan2(Math.sqrt(haversineValue), Math.sqrt(1 - haversineValue))

  return earthRadiusKm * centralAngle
}

function computeLiveEta(distanceKm: number, mode: TravelMode, traffic: Destination['traffic']) {
  const trafficPenalty = traffic === 'Heavy' ? 1.28 : traffic === 'Moderate' ? 1.12 : 1

  if (mode === 'walk') {
    return Math.max(3, Math.round((distanceKm / 4.8) * 60))
  }

  if (mode === 'transit') {
    return Math.max(5, Math.round((distanceKm / 26) * 60 + 6))
  }

  return Math.max(4, Math.round((distanceKm / 34) * 60 * trafficPenalty + 2))
}

function formatAreaLabel(origin: Coordinates) {
  const nearestDestination = destinations.reduce((closest, destination) => {
    if (!closest) {
      return destination
    }

    const currentDistance = computeDistanceKm(origin, destination.coordinates)
    const closestDistance = computeDistanceKm(origin, closest.coordinates)

    return currentDistance < closestDistance ? destination : closest
  }, destinations[0])

  return `Near ${nearestDestination.area}`
}

function buildEstimatedSteps(destination: Destination): RouteStep[] {
  return [
    {
      title: 'Leave current position',
      detail: `Head toward ${destination.area} and stay on the fastest available corridor.`,
      baseMinuteOffset: 0,
    },
    {
      title: `Approach ${destination.name}`,
      detail: destination.description,
      baseMinuteOffset: Math.max(4, Math.round(destination.etaByMode.drive * 0.55)),
    },
    {
      title: `Arrive at ${destination.name}`,
      detail: destination.parking,
      baseMinuteOffset: destination.etaByMode.drive,
    },
  ]
}

function buildSearchDestination(result: SearchResult): Destination {
  return {
    id: result.id,
    name: result.name,
    area: result.area,
    tag: 'Search',
    description: 'Destination resolved from live OpenStreetMap geocoding.',
    distanceKm: 1,
    traffic: 'Moderate',
    parking: 'Live parking details unavailable for this result',
    etaByMode: { drive: 8, transit: 12, walk: 20 },
    offlinePack: 'Online route only',
    coordinates: result.coordinates,
    steps: [
      {
        title: 'Leave current position',
        detail: `Start route guidance toward ${result.name}.`,
        baseMinuteOffset: 0,
      },
      {
        title: `Approach ${result.area}`,
        detail: 'Follow the fastest corridor suggested by the routing service.',
        baseMinuteOffset: 6,
      },
      {
        title: `Arrive at ${result.name}`,
        detail: 'Check local access and final approach on arrival.',
        baseMinuteOffset: 12,
      },
    ],
  }
}

function App() {
  const [activeTab, setActiveTab] = useState<TabId>('discover')
  const [travelMode, setTravelMode] = useState<TravelMode>('drive')
  const [query, setQuery] = useState('')
  const [selectedDestinationId, setSelectedDestinationId] = useState('marina-hub')
  const [selectedSearchResult, setSelectedSearchResult] =
    useState<SearchResult | null>(null)
  const [locationLabel, setLocationLabel] = useState('Lagoon District')
  const [locationState, setLocationState] = useState('GPS strong')
  const [currentCoordinates, setCurrentCoordinates] = useState<Coordinates | null>(null)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searchStatus, setSearchStatus] = useState<SearchStatus>('idle')
  const [routeMetrics, setRouteMetrics] = useState<RouteMetrics | null>(null)
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() =>
    readStoredIds(favoriteStorageKey, ['marina-hub', 'canal-market']),
  )
  const [recentIds, setRecentIds] = useState<string[]>(() =>
    readStoredIds(historyStorageKey, ['marina-hub']),
  )

  const routeOrigin = currentCoordinates ?? defaultOrigin

  const liveDestinations = useMemo(
    () =>
      destinations.map((destination) => {
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
      }),
    [routeOrigin],
  )

  const filteredDestinations = useMemo(() => liveDestinations.filter((destination) => {
    const normalizedQuery = query.trim().toLowerCase()

    if (!normalizedQuery) {
      return true
    }

    return [destination.name, destination.area, destination.tag]
      .join(' ')
      .toLowerCase()
      .includes(normalizedQuery)
  }), [liveDestinations, query])

  const selectedDestination = useMemo(
    () =>
      selectedSearchResult
        ? buildSearchDestination(selectedSearchResult)
        : (liveDestinations.find((destination) => destination.id === selectedDestinationId) ??
          liveDestinations[0]),
    [liveDestinations, selectedDestinationId, selectedSearchResult],
  )

  const favoriteDestinations = useMemo(
    () =>
      liveDestinations.filter((destination) => favoriteIds.includes(destination.id)),
    [favoriteIds, liveDestinations],
  )

  const recentDestinations = useMemo(
    () =>
      recentIds
        .map((id) => liveDestinations.find((destination) => destination.id === id))
        .filter((destination): destination is Destination => Boolean(destination)),
    [liveDestinations, recentIds],
  )

  const activeEta = routeMetrics?.durationMinutes ?? selectedDestination.etaByMode[travelMode]
  const arrivalTime = formatClock(activeEta)
  const totalTrips = recentIds.length + 9
  const savedMinutes = favoriteIds.length * 7 + recentIds.length * 4
  const shouldSearchOnline = query.trim().length >= 3
  const visibleSearchResults = shouldSearchOnline ? searchResults : []
  const visibleSearchStatus = shouldSearchOnline ? searchStatus : 'idle'

  useEffect(() => {
    const normalizedQuery = query.trim()

    if (normalizedQuery.length < 3) {
      return
    }

    const controller = new AbortController()

    const timeoutId = window.setTimeout(async () => {
      setSearchStatus('loading')

      try {
        const endpoint = new URL('/api/geocode', window.location.origin)
        endpoint.searchParams.set('q', normalizedQuery)

        const response = await fetch(endpoint.toString(), {
          signal: controller.signal,
          headers: {
            Accept: 'application/json',
          },
        })

        if (!response.ok) {
          throw new Error('Geocoding failed')
        }

        // Mapbox response format
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
        if ((error as Error).name === 'AbortError') {
          return
        }

        setSearchResults([])
        setSearchStatus('error')
      }
    }, 350)

    return () => {
      controller.abort()
      window.clearTimeout(timeoutId)
    }
  }, [query])

  useEffect(() => {
    const buildEstimatedRoute = () => {
      const estimatedDistanceKm = Math.max(
        1,
        Math.round(computeDistanceKm(routeOrigin, selectedDestination.coordinates) * 1.18 * 10) / 10,
      )

      setRouteMetrics({
        distanceKm: estimatedDistanceKm,
        durationMinutes: selectedDestination.etaByMode[travelMode],
        steps: selectedDestination.steps.length
          ? selectedDestination.steps
          : buildEstimatedSteps(selectedDestination),
        source: 'estimated',
      })
    }

    if (travelMode === 'transit') {
      buildEstimatedRoute()
      return
    }

    const controller = new AbortController()


    void (async () => {
      try {
        const profile = travelMode === 'walk' ? 'walking' : 'driving'
        const from = `${routeOrigin.longitude},${routeOrigin.latitude}`
        const to = `${selectedDestination.coordinates.longitude},${selectedDestination.coordinates.latitude}`
        const endpoint = new URL('/api/route', window.location.origin)
        endpoint.searchParams.set('from', from)
        endpoint.searchParams.set('to', to)
        endpoint.searchParams.set('profile', profile)

        const response = await fetch(endpoint.toString(), {
          signal: controller.signal,
          headers: {
            Accept: 'application/json',
          },
        })

        if (!response.ok) {
          throw new Error('Routing failed')
        }

        // Mapbox Directions API response format
        const payload = (await response.json()) as {
          routes?: Array<{
            distance: number
            duration: number
            legs?: Array<{
              steps?: Array<{
                maneuver?: { instruction?: string; type?: string; modifier?: string }
                name: string
              }>
            }>
          }>
        }

        const route = payload.routes?.[0]

        if (!route) {
          throw new Error('No route')
        }

        const stepList =
          route.legs?.[0]?.steps
            ?.slice(0, 3)
            .map((step, index) => ({
              title: step.maneuver?.instruction || step.name || `Step ${index + 1}`,
              detail: step.name || step.maneuver?.type || 'Continue on the suggested route.',
              baseMinuteOffset: Math.round((route.duration / 60 / 3) * index),
            })) ?? []

        setRouteMetrics({
          distanceKm: Math.max(1, Math.round((route.distance / 1000) * 10) / 10),
          durationMinutes: Math.max(1, Math.round(route.duration / 60)),
          steps: stepList.length ? stepList : buildEstimatedSteps(selectedDestination),
          source: 'live',
        })
      } catch (error) {
        if ((error as Error).name === 'AbortError') {
          return
        }

        buildEstimatedRoute()
      }
    })()

    return () => {
      controller.abort()
    }
  }, [routeOrigin, selectedDestination, travelMode])

  useEffect(() => {
    const mediaQuery = window.matchMedia('(display-mode: standalone)')

    const updateInstalledState = () => {
      const navigatorWithStandalone = navigator as Navigator & {
        standalone?: boolean
      }

      setIsInstalled(
        mediaQuery.matches || navigatorWithStandalone.standalone === true,
      )
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setInstallPrompt(event as BeforeInstallPromptEvent)
    }

    const handleInstalled = () => {
      setInstallPrompt(null)
      setIsInstalled(true)
    }

    updateInstalledState()
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleInstalled)
    mediaQuery.addEventListener('change', updateInstalledState)

    return () => {
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt,
      )
      window.removeEventListener('appinstalled', handleInstalled)
      mediaQuery.removeEventListener('change', updateInstalledState)
    }
  }, [])

  useEffect(() => {
    persistIds(favoriteStorageKey, favoriteIds)
  }, [favoriteIds])

  useEffect(() => {
    persistIds(historyStorageKey, recentIds)
  }, [recentIds])

  const handleInstall = async () => {
    if (!installPrompt) {
      return
    }

    await installPrompt.prompt()
    const choice = await installPrompt.userChoice

    if (choice.outcome === 'accepted') {
      setInstallPrompt(null)
    }
  }

  const handleLocate = () => {
    if (!('geolocation' in navigator)) {
      setLocationState('Geolocation unavailable')
      return
    }

    setLocationState('Refreshing GPS')
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextCoordinates = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }

        setCurrentCoordinates(nextCoordinates)
        setLocationLabel(formatAreaLabel(nextCoordinates))
        setLocationState('Position locked')
      },
      (error) => {
        const errorLabel =
          error.code === error.PERMISSION_DENIED
            ? 'Location denied'
            : error.code === error.TIMEOUT
              ? 'Location timeout'
              : 'Location unavailable'

        setLocationState(errorLabel)
      },
      {
        enableHighAccuracy: true,
        maximumAge: 300000,
        timeout: 10000,
      },
    )
  }

  const handleSelectDestination = (destinationId: string) => {
    setSelectedSearchResult(null)
    setSelectedDestinationId(destinationId)
    setRecentIds((currentIds) => {
      const nextIds = [destinationId, ...currentIds.filter((id) => id !== destinationId)]
      return nextIds.slice(0, 4)
    })
    setActiveTab('discover')
    const destination = liveDestinations.find((entry) => entry.id === destinationId)

    if (destination) {
      setLocationState('Route updated')
    }
  }

  const handleSelectSearchResult = (result: SearchResult) => {
    setSelectedSearchResult(result)
    setActiveTab('discover')
    setLocationState(currentCoordinates ? 'Live route resolved' : 'Using default origin')
  }

  const toggleFavorite = (destinationId: string) => {
    setFavoriteIds((currentIds) => {
      if (currentIds.includes(destinationId)) {
        return currentIds.filter((id) => id !== destinationId)
      }

      return [destinationId, ...currentIds]
    })
  }

  const installLabel = isInstalled
    ? 'App already installed'
    : installPrompt
      ? 'Install nav-starter'
      : 'Use Share > Add to Home Screen on iPhone'

  const isInstallDisabled = isInstalled || !installPrompt

  const renderDiscoverScreen = () => (
    <>
      <section className="map-card">
        <div className="map-glow" />
        <div className="map-grid" />
        <div className="route-pill route-pill-start">{locationLabel}</div>
        <div className="route-pill route-pill-end">{selectedDestination.name}</div>
        <div className="route-line" />
        <div className="route-pin route-pin-start" />
        <div className="route-pin route-pin-end" />
        <div className="map-overlay">
          <p className="micro-label">Live route</p>
          <strong>{selectedDestination.name}</strong>
          <span>
            {activeEta} min in {travelMode} mode, arrival around {arrivalTime}
          </span>
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
              placeholder="Search destination or area"
            />
          </label>
          <button type="button" className="ghost-button" onClick={handleLocate}>
            Locate me
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
              {mode.label}
            </button>
          ))}
        </div>

        <div className="results-list">
          {filteredDestinations.map((destination) => {
            const isSelected = destination.id === selectedDestination.id
            const isFavorite = favoriteIds.includes(destination.id)

            return (
              <article
                key={destination.id}
                className={isSelected ? 'result-card is-selected' : 'result-card'}
              >
                <button
                  type="button"
                  className="result-main"
                  onClick={() => handleSelectDestination(destination.id)}
                >
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
                  aria-label={
                    isFavorite
                      ? `Remove ${destination.name} from favorites`
                      : `Save ${destination.name} as favorite`
                  }
                >
                  {isFavorite ? 'Saved' : 'Save'}
                </button>
              </article>
            )
          })}

          {filteredDestinations.length === 0 ? (
            <p className="empty-state">No destination matches this search yet.</p>
          ) : null}

          {shouldSearchOnline ? (
            <section className="remote-results-block">
              <div className="section-header-row compact-header">
                <div>
                  <p className="micro-label">Online search</p>
                  <strong>OpenStreetMap results</strong>
                </div>
                <span className="result-source-badge">
                  {visibleSearchStatus === 'loading'
                    ? 'Searching'
                    : visibleSearchStatus === 'error'
                      ? 'Unavailable'
                      : visibleSearchResults.length
                        ? `${visibleSearchResults.length} found`
                        : 'No match'}
                </span>
              </div>

              {visibleSearchResults.map((result) => (
                <article key={result.id} className="result-card remote-card">
                  <button
                    type="button"
                    className="result-main"
                    onClick={() => handleSelectSearchResult(result)}
                  >
                    <div>
                      <p className="micro-label">Search</p>
                      <strong>{result.name}</strong>
                      <p>{result.area}</p>
                    </div>
                    <div className="result-meta">
                      <span>Route</span>
                      <small>Live geocode</small>
                    </div>
                  </button>
                </article>
              ))}
            </section>
          ) : null}
        </div>
      </section>

      <section className="panel-card emphasis-card">
        <div>
          <p className="micro-label">Suggested now</p>
          <h2>{selectedDestination.description}</h2>
        </div>
        <div className="stat-row">
          <span>{routeMetrics?.distanceKm ?? selectedDestination.distanceKm} km</span>
          <span>{selectedDestination.traffic} traffic</span>
          <span>{routeMetrics?.source === 'live' ? 'Live routing' : selectedDestination.offlinePack}</span>
        </div>
      </section>
    </>
  )

  const renderJourneyScreen = () => (
    <section className="panel-card timeline-card">
      <div className="section-header-row">
        <div>
          <p className="micro-label">Active route</p>
          <h2>{selectedDestination.name}</h2>
        </div>
        <span className="signal-badge">ETA {activeEta} min</span>
      </div>

      <ol className="timeline-list">
        {(routeMetrics?.steps ?? selectedDestination.steps).map((step) => (
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
          <span>Parking status</span>
        </article>
        <article>
          <strong>{routeMetrics?.source === 'live' ? 'OSRM live route' : selectedDestination.offlinePack}</strong>
          <span>{routeMetrics?.source === 'live' ? 'Routing source' : 'Offline pack'}</span>
        </article>
      </div>
    </section>
  )

  const renderSavedScreen = () => (
    <section className="panel-card saved-card">
      <div className="section-header-row">
        <div>
          <p className="micro-label">Favorites</p>
          <h2>Quick destinations</h2>
        </div>
        <span className="signal-badge">{favoriteDestinations.length} saved</span>
      </div>

      <div className="saved-list">
        {favoriteDestinations.map((destination) => (
          <article key={destination.id} className="saved-item-card">
            <button
              type="button"
              className="saved-item"
              onClick={() => handleSelectDestination(destination.id)}
            >
              <div>
                <strong>{destination.name}</strong>
                <p>
                  {destination.tag} · {destination.area}
                </p>
              </div>
              <span>{destination.etaByMode[travelMode]} min</span>
            </button>
            <button
              type="button"
              className="ghost-button inline-ghost"
              onClick={() => toggleFavorite(destination.id)}
            >
              Remove
            </button>
          </article>
        ))}

        {favoriteDestinations.length === 0 ? (
          <p className="empty-state">Save a route from Discover to keep it here.</p>
        ) : null}
      </div>
    </section>
  )

  const renderProfileScreen = () => (
    <section className="panel-card profile-card">
      <div>
        <p className="micro-label">Profile</p>
        <h2>Usage snapshot</h2>
      </div>

      <div className="profile-grid">
        <article>
          <strong>{totalTrips}</strong>
          <span>Trips this week</span>
        </article>
        <article>
          <strong>{savedMinutes} min</strong>
          <span>Estimated time saved</span>
        </article>
        <article>
          <strong>{favoriteIds.length}</strong>
          <span>Favorite destinations</span>
        </article>
      </div>

      <div className="recent-panel">
        <div className="section-header-row">
          <div>
            <p className="micro-label">Recent activity</p>
            <h2>Last selected routes</h2>
          </div>
        </div>

        <div className="recent-list">
          {recentDestinations.map((destination) => (
            <button
              key={destination.id}
              type="button"
              className="recent-item"
              onClick={() => handleSelectDestination(destination.id)}
            >
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
    if (activeTab === 'discover') {
      return renderDiscoverScreen()
    }

    if (activeTab === 'journeys') {
      return renderJourneyScreen()
    }

    if (activeTab === 'saved') {
      return renderSavedScreen()
    }

    return renderProfileScreen()
  }

  return (
    <main className="app-shell">
      <section className="intro-panel">
        <p className="eyebrow">Operational mobile navigation app</p>
        <h1>nav-starter passe d’une demo visuelle a une base interactive exploitable.</h1>
        <p className="lead">
          Recherche de destinations, changement de mode de trajet, favoris persistants
          et historique recent sont maintenant relies a un etat applicatif simple,
          avec geolocalisation navigateur pour recalculer les trajets.
        </p>

        <div className="install-banner">
          <div>
            <p className="micro-label">Install status</p>
            <strong>{isInstalled ? 'Installed on this device' : 'Ready for install'}</strong>
            <p>
              Android affichera un prompt natif. Sur iPhone, utilisez le menu de
              partage puis Add to Home Screen.
            </p>
          </div>
          <button
            className="install-button"
            onClick={() => {
              void handleInstall()
            }}
            disabled={isInstallDisabled}
          >
            {installLabel}
          </button>
        </div>

        <div className="summary-grid">
          <article className="summary-card">
            <p className="micro-label">Navigation</p>
            <strong>{destinations.length} destinations</strong>
            <span>Route cards can be filtered and selected instantly.</span>
          </article>
          <article className="summary-card">
            <p className="micro-label">Persistence</p>
            <strong>{favoriteIds.length} favorites saved</strong>
            <span>Favorites and recent routes survive app reloads.</span>
          </article>
          <article className="summary-card">
            <p className="micro-label">Current route</p>
            <strong>{selectedDestination.name}</strong>
            <span>Arrival around {arrivalTime} in {travelMode} mode from your current position.</span>
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
              <p className="micro-label">Current area</p>
              <strong>{locationLabel}</strong>
            </div>
            <span className="signal-badge">{locationState}</span>
          </div>

          <div className="screen-content">{renderScreen()}</div>

          <nav className="bottom-nav" aria-label="App sections">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={tab.id === activeTab ? 'tab-button is-active' : 'tab-button'}
                onClick={() => setActiveTab(tab.id)}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </article>

        <aside className="details-panel">
          <section className="details-card accent-surface">
            <p className="micro-label">Operational state</p>
            <h2>{selectedDestination.name}</h2>
            <ul>
              <li>{selectedDestination.description}</li>
              <li>Browser geolocation can refresh current position and recompute route metrics.</li>
              <li>Remote search uses OpenStreetMap geocoding and OSRM routing services.</li>
              <li>{selectedDestination.parking}</li>
              <li>Offline pack: {selectedDestination.offlinePack}</li>
            </ul>
          </section>

          <section className="details-card">
            <p className="micro-label">Recommended next step</p>
            <h2>What to wire next</h2>
            <ol>
              <li>Connect this state to a real mapping or routing API.</li>
              <li>Add account sync for favorites and trip history.</li>
              <li>Introduce live traffic or notification refresh.</li>
            </ol>
          </section>

          <section className="details-card compact-card">
            <p className="micro-label">Repository</p>
            <a
              className="repo-link"
              href="https://github.com/El-hadj10/nav-starter"
              target="_blank"
              rel="noopener noreferrer"
            >
              github.com/El-hadj10/nav-starter
            </a>
          </section>
        </aside>
      </section>
    </main>
  )
}

export default App