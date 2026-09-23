import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  accentPalettes,
  applyThemeToDocument,
  parseAccentId,
  parseThemeMode,
  persistThemePreferences,
  readThemePreferences,
  resolveDarkMode,
} from './theme'

describe('parseThemeMode', () => {
  it('retourne system par defaut', () => {
    expect(parseThemeMode(null)).toBe('system')
    expect(parseThemeMode('')).toBe('system')
    expect(parseThemeMode('valeur-inconnue')).toBe('system')
  })

  it('retourne la valeur valide stockee', () => {
    expect(parseThemeMode('light')).toBe('light')
    expect(parseThemeMode('dark')).toBe('dark')
    expect(parseThemeMode('system')).toBe('system')
  })
})

describe('parseAccentId', () => {
  it('retourne aurora par defaut', () => {
    expect(parseAccentId(null)).toBe('aurora')
    expect(parseAccentId('inconnu')).toBe('aurora')
  })

  it('retourne l accent valide stocke', () => {
    expect(parseAccentId('sunset')).toBe('sunset')
  })
})

describe('resolveDarkMode', () => {
  it('respecte le choix explicite', () => {
    expect(resolveDarkMode('dark', false)).toBe(true)
    expect(resolveDarkMode('light', true)).toBe(false)
  })

  it('suit le systeme en mode system', () => {
    expect(resolveDarkMode('system', true)).toBe(true)
    expect(resolveDarkMode('system', false)).toBe(false)
  })
})

describe('persistance des preferences', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  afterEach(() => {
    window.localStorage.clear()
  })

  it('lit des preferences par defaut quand le stockage est vide', () => {
    expect(readThemePreferences()).toEqual({ mode: 'system', accent: 'aurora' })
  })

  it('persiste puis relit les preferences', () => {
    persistThemePreferences({ mode: 'dark', accent: 'ocean' })
    expect(readThemePreferences()).toEqual({ mode: 'dark', accent: 'ocean' })
  })
})

describe('applyThemeToDocument', () => {
  afterEach(() => {
    document.documentElement.removeAttribute('data-theme')
    document.documentElement.removeAttribute('data-accent')
    document.documentElement.style.removeProperty('--accent')
    document.documentElement.style.removeProperty('--accent-soft')
  })

  it('applique le theme sombre et l accent sur le document', () => {
    applyThemeToDocument({ mode: 'dark', accent: 'violet' }, false)

    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(document.documentElement.dataset.accent).toBe('violet')
    expect(document.documentElement.style.getPropertyValue('--accent')).toBe(accentPalettes.violet.base)
  })

  it('applique le theme clair meme si le systeme prefere le sombre', () => {
    applyThemeToDocument({ mode: 'light', accent: 'lime' }, true)

    expect(document.documentElement.dataset.theme).toBe('light')
    expect(document.documentElement.dataset.accent).toBe('lime')
  })
})
