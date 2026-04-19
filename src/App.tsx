import { useEffect, useState } from 'react'
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

function App() {
  const [activeTab, setActiveTab] = useState<TabId>('discover')
  const [travelMode, setTravelMode] = useState<TravelMode>('drive')
  const [query, setQuery] = useState('')
  const [selectedDestinationId, setSelectedDestinationId] = useState('marina-hub')
  const [locationLabel, setLocationLabel] = useState('Lagoon District')
  const [locationState, setLocationState] = useState('GPS strong')
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() =>
    readStoredIds(favoriteStorageKey, ['marina-hub', 'canal-market']),
  )
  const [recentIds, setRecentIds] = useState<string[]>(() =>
    readStoredIds(historyStorageKey, ['marina-hub']),
  )

  const filteredDestinations = destinations.filter((destination) => {
    const normalizedQuery = query.trim().toLowerCase()

    if (!normalizedQuery) {
      return true
    }

    return [destination.name, destination.area, destination.tag]
      .join(' ')
      .toLowerCase()
      .includes(normalizedQuery)
  })

  const selectedDestination =
    destinations.find((destination) => destination.id === selectedDestinationId) ??
    destinations[0]

  const favoriteDestinations = destinations.filter((destination) =>
    favoriteIds.includes(destination.id),
  )

  const recentDestinations = recentIds
    .map((id) => destinations.find((destination) => destination.id === id))
    .filter((destination): destination is Destination => Boolean(destination))

  const activeEta = selectedDestination.etaByMode[travelMode]
  const arrivalTime = formatClock(activeEta)
  const totalTrips = recentIds.length + 9
  const savedMinutes = favoriteIds.length * 7 + recentIds.length * 4

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
    setLocationState('Refreshing GPS')

    window.setTimeout(() => {
      setLocationLabel(selectedDestination.area)
      setLocationState('Position locked')
    }, 450)
  }

  const handleSelectDestination = (destinationId: string) => {
    setSelectedDestinationId(destinationId)
    setRecentIds((currentIds) => {
      const nextIds = [destinationId, ...currentIds.filter((id) => id !== destinationId)]
      return nextIds.slice(0, 4)
    })
    setActiveTab('discover')
    const destination = destinations.find((entry) => entry.id === destinationId)

    if (destination) {
      setLocationLabel(destination.area)
      setLocationState('Route updated')
    }
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
        </div>
      </section>

      <section className="panel-card emphasis-card">
        <div>
          <p className="micro-label">Suggested now</p>
          <h2>{selectedDestination.description}</h2>
        </div>
        <div className="stat-row">
          <span>{selectedDestination.distanceKm} km</span>
          <span>{selectedDestination.traffic} traffic</span>
          <span>{selectedDestination.offlinePack}</span>
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
        {selectedDestination.steps.map((step) => (
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
          <strong>{selectedDestination.offlinePack}</strong>
          <span>Offline pack</span>
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
          et historique recent sont maintenant relies a un etat applicatif simple.
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
            <span>Arrival around {arrivalTime} in {travelMode} mode.</span>
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
              <li>{selectedDestination.parking}</li>
              <li>Offline pack: {selectedDestination.offlinePack}</li>
            </ul>
          </section>

          <section className="details-card">
            <p className="micro-label">Recommended next step</p>
            <h2>What to wire next</h2>
            <ol>
              <li>Connect this state to a real mapping or routing API.</li>
              <li>Replace mock GPS with browser geolocation permissions.</li>
              <li>Add account sync for favorites and trip history.</li>
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