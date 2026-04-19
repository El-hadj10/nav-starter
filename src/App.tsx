import { useEffect, useState } from 'react'
import './App.css'

type TabId = 'discover' | 'journeys' | 'saved' | 'profile'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

const tabs: Array<{ id: TabId; label: string; icon: string }> = [
  { id: 'discover', label: 'Discover', icon: '◎' },
  { id: 'journeys', label: 'Journeys', icon: '↗' },
  { id: 'saved', label: 'Saved', icon: '★' },
  { id: 'profile', label: 'Profile', icon: '◌' },
]

const journeySteps = [
  { time: '08:10', title: 'Leave Plateau', detail: 'Traffic is light on the coastal line.' },
  { time: '08:34', title: 'Switch to express lane', detail: 'Save around 11 minutes on the main route.' },
  { time: '08:56', title: 'Arrival at Marina Hub', detail: 'Parking B still has 14 available spots.' },
]

const savedPlaces = [
  { name: 'Office Dock', eta: '12 min', tag: 'Work' },
  { name: 'Canal Market', eta: '18 min', tag: 'Food' },
  { name: 'Sunset Point', eta: '22 min', tag: 'Leisure' },
]

const profileStats = [
  { label: 'Trips this week', value: '12' },
  { label: 'Saved time', value: '1h 46m' },
  { label: 'Offline packs', value: '3' },
]

function App() {
  const [activeTab, setActiveTab] = useState<TabId>('discover')
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)

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

  const installLabel = isInstalled
    ? 'App already installed'
    : installPrompt
      ? 'Install nav-starter'
      : 'Use Share > Add to Home Screen on iPhone'

  const isInstallDisabled = isInstalled || !installPrompt

  const renderScreen = () => {
    if (activeTab === 'discover') {
      return (
        <>
          <section className="map-card">
            <div className="map-glow" />
            <div className="map-grid" />
            <div className="route-pill route-pill-start">Start</div>
            <div className="route-pill route-pill-end">Arrival</div>
            <div className="route-line" />
            <div className="route-pin route-pin-start" />
            <div className="route-pin route-pin-end" />
            <div className="map-overlay">
              <p className="micro-label">Live route</p>
              <strong>Marina Hub</strong>
              <span>18 min with light traffic</span>
            </div>
          </section>

          <section className="panel-card emphasis-card">
            <div>
              <p className="micro-label">Suggested now</p>
              <h2>Fastest waterfront path</h2>
            </div>
            <p>
              A compact mobile layout with route focus, quick details and clear
              bottom navigation.
            </p>
            <div className="stat-row">
              <span>12 km</span>
              <span>+3 min buffer</span>
              <span>Offline ready</span>
            </div>
          </section>
        </>
      )
    }

    if (activeTab === 'journeys') {
      return (
        <section className="panel-card timeline-card">
          <div>
            <p className="micro-label">Today plan</p>
            <h2>Commute timeline</h2>
          </div>
          <ol className="timeline-list">
            {journeySteps.map((step) => (
              <li key={step.time}>
                <span>{step.time}</span>
                <div>
                  <strong>{step.title}</strong>
                  <p>{step.detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )
    }

    if (activeTab === 'saved') {
      return (
        <section className="panel-card saved-card">
          <div>
            <p className="micro-label">Favorites</p>
            <h2>Quick destinations</h2>
          </div>
          <div className="saved-list">
            {savedPlaces.map((place) => (
              <article key={place.name} className="saved-item">
                <div>
                  <strong>{place.name}</strong>
                  <p>{place.tag}</p>
                </div>
                <span>{place.eta}</span>
              </article>
            ))}
          </div>
        </section>
      )
    }

    return (
      <section className="panel-card profile-card">
        <div>
          <p className="micro-label">Profile</p>
          <h2>Ready for daily use</h2>
        </div>
        <div className="profile-grid">
          {profileStats.map((stat) => (
            <article key={stat.label}>
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </article>
          ))}
        </div>
      </section>
    )
  }

  return (
    <main className="app-shell">
      <section className="intro-panel">
        <p className="eyebrow">Mobile navigation concept</p>
        <h1>nav-starter devient une web app installable pour le telephone.</h1>
        <p className="lead">
          L'interface ci-dessous simule une app de navigation mobile avec ecran
          principal, parcours, favoris, profil et bouton d'installation.
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
            <strong>Bottom tabs</strong>
            <span>Touch targets sized for phone usage.</span>
          </article>
          <article className="summary-card">
            <p className="micro-label">PWA</p>
            <strong>Installable</strong>
            <span>Manifest, icons and offline caching included.</span>
          </article>
          <article className="summary-card">
            <p className="micro-label">Delivery</p>
            <strong>Ready to host</strong>
            <span>Build the app and publish the dist folder.</span>
          </article>
        </div>
      </section>

      <section className="experience-grid">
        <article className="phone-frame" aria-label="Phone preview">
          <div className="phone-topbar">
            <span>9:41</span>
            <span>5G</span>
          </div>

          <div className="screen-header">
            <div>
              <p className="micro-label">Current area</p>
              <strong>Lagoon District</strong>
            </div>
            <span className="signal-badge">GPS strong</span>
          </div>

          <div className="screen-content">
            {renderScreen()}
          </div>

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
            <p className="micro-label">Why this works on phone</p>
            <h2>Mobile-first layout</h2>
            <ul>
              <li>Single thumb-friendly bottom navigation.</li>
              <li>Clear card hierarchy and compact route details.</li>
              <li>Install call to action wired to the browser prompt.</li>
            </ul>
          </section>

          <section className="details-card">
            <p className="micro-label">Install flow</p>
            <h2>From browser to app icon</h2>
            <ol>
              <li>Deploy the built app to HTTPS hosting.</li>
              <li>Open it from Chrome on Android or Safari on iPhone.</li>
              <li>Install from the prompt or from the Share menu.</li>
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
