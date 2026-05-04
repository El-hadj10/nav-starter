import { describe, expect, it } from 'vitest'
import { computeDistanceKm, computeLiveEta } from './navigation'

describe('navigation helpers', () => {
  it('computes near-zero distance for same point', () => {
    const distance = computeDistanceKm(
      { latitude: 5.32, longitude: -4.01 },
      { latitude: 5.32, longitude: -4.01 },
    )

    expect(distance).toBeLessThan(0.001)
  })

  it('applies heavy traffic penalty for drive mode', () => {
    const lowTrafficEta = computeLiveEta(10, 'drive', 'Low')
    const heavyTrafficEta = computeLiveEta(10, 'drive', 'Heavy')

    expect(heavyTrafficEta).toBeGreaterThan(lowTrafficEta)
  })

  it('keeps a minimum ETA for walk mode', () => {
    expect(computeLiveEta(0.02, 'walk', 'Low')).toBeGreaterThanOrEqual(3)
  })
})
