export type ThemeMode = 'system' | 'light' | 'dark'
export type AccentId = 'aurora' | 'sunset' | 'ocean' | 'violet' | 'lime'

export type ThemePreferences = {
  mode: ThemeMode
  accent: AccentId
}

export const accentPalettes: Record<AccentId, { label: string; base: string; soft: string }> = {
  aurora: { label: 'Aurora', base: '#47ffe5', soft: '#8cf7a7' },
  sunset: { label: 'Sunset', base: '#ff8a5c', soft: '#ffc66e' },
  ocean: { label: 'Ocean', base: '#54a0ff', soft: '#7de3ff' },
  violet: { label: 'Violet', base: '#a78bfa', soft: '#f0abfc' },
  lime: { label: 'Lime', base: '#a3e635', soft: '#5eead4' },
}

export const themeModeStorageKey = 'nav-starter.theme-mode'
export const themeAccentStorageKey = 'nav-starter.theme-accent'

export function parseThemeMode(raw: string | null): ThemeMode {
  return raw === 'light' || raw === 'dark' || raw === 'system' ? raw : 'system'
}

export function parseAccentId(raw: string | null): AccentId {
  if (raw && raw in accentPalettes) {
    return raw as AccentId
  }
  return 'aurora'
}

export function readThemePreferences(): ThemePreferences {
  return {
    mode: parseThemeMode(window.localStorage.getItem(themeModeStorageKey)),
    accent: parseAccentId(window.localStorage.getItem(themeAccentStorageKey)),
  }
}

export function persistThemePreferences(preferences: ThemePreferences): void {
  window.localStorage.setItem(themeModeStorageKey, preferences.mode)
  window.localStorage.setItem(themeAccentStorageKey, preferences.accent)
}

/**
 * Détermine si l'interface doit s'afficher en sombre.
 * `system` suit la préférence du système d'exploitation.
 */
export function resolveDarkMode(mode: ThemeMode, systemPrefersDark: boolean): boolean {
  if (mode === 'dark') return true
  if (mode === 'light') return false
  return systemPrefersDark
}

/** Applique le thème actif sur le document : attribut data-theme + variables d'accent. */
export function applyThemeToDocument(preferences: ThemePreferences, systemPrefersDark: boolean): void {
  const root = document.documentElement
  root.dataset.theme = resolveDarkMode(preferences.mode, systemPrefersDark) ? 'dark' : 'light'
  root.dataset.accent = preferences.accent

  const palette = accentPalettes[preferences.accent]
  root.style.setProperty('--accent', palette.base)
  root.style.setProperty('--accent-soft', palette.soft)
}
