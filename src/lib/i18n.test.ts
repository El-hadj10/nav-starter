import { describe, expect, it } from 'vitest'
import { messages } from './i18n'

describe('i18n messages', () => {
  it('contains FR and EN labels for tabs', () => {
    expect(messages.fr.tabDiscover).toBeTruthy()
    expect(messages.en.tabDiscover).toBeTruthy()
  })

  it('keeps auth labels available in both locales', () => {
    expect(messages.fr.authentication).toContain('Authent')
    expect(messages.en.authentication).toContain('Auth')
  })

  it('garde une parite stricte des cles entre fr et en', () => {
    const frKeys = Object.keys(messages.fr).sort()
    const enKeys = Object.keys(messages.en).sort()
    expect(enKeys).toEqual(frKeys)
  })

  it('couvre les libelles admin et theme dans les deux langues', () => {
    expect(messages.fr.tabAdmin).toBeTruthy()
    expect(messages.en.tabAdmin).toBeTruthy()
    expect(messages.fr.themeLabel).toBeTruthy()
    expect(messages.en.themeLabel).toBeTruthy()
    expect(messages.fr.adminTitle).toBeTruthy()
    expect(messages.en.adminTitle).toBeTruthy()
  })
})
