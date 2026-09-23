const configuredApiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/$/, '')

/** Construit l'URL d'un endpoint API, en respectant VITE_API_BASE_URL si défini. */
export function buildApiUrl(pathname: string): URL {
  if (configuredApiBaseUrl) {
    return new URL(pathname, `${configuredApiBaseUrl}/`)
  }
  return new URL(pathname, window.location.origin)
}
