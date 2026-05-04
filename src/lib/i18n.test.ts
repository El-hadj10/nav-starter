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
})
