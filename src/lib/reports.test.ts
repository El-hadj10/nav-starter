import { describe, expect, it } from 'vitest'
import {
  distanceToReportKm,
  filterReports,
  isReportExpiringSoon,
  isReportType,
  reportFilterDistances,
  reportTimeLeft,
  reportTypeIcons,
  reportTypes,
  type Report,
} from './reports'

describe('isReportType', () => {
  it('valide les 6 types et rejette les autres', () => {
    expect(reportTypes).toHaveLength(6)
    for (const type of reportTypes) {
      expect(isReportType(type)).toBe(true)
    }
    expect(isReportType('ovni')).toBe(false)
    expect(isReportType(42)).toBe(false)
  })
})

describe('reportTypeIcons', () => {
  it('fournit une icône pour chaque type', () => {
    for (const type of reportTypes) {
      expect(reportTypeIcons[type].length).toBeGreaterThan(0)
    }
  })
})

describe('distanceToReportKm', () => {
  it('renvoie 0 pour une position identique', () => {
    const point = { latitude: 5.32, longitude: -4.01 }
    expect(distanceToReportKm(point, point)).toBe(0)
  })

  it('calcule une distance plausible (Abidjan Plateau -> Cocody, ~5 km)', () => {
    const plateau = { latitude: 5.3247, longitude: -4.0196 }
    const cocody = { latitude: 5.3453, longitude: -3.9867 }
    const km = distanceToReportKm(plateau, cocody)
    expect(km).toBeGreaterThan(2)
    expect(km).toBeLessThan(8)
  })
})

describe('reportTimeLeft', () => {
  it('renvoie null pour un signalement expiré', () => {
    expect(reportTimeLeft('2020-01-01T00:00:00Z', new Date('2020-01-02T00:00:00Z'))).toBeNull()
  })

  it('calcule heures et minutes restantes', () => {
    const left = reportTimeLeft('2026-01-01T14:30:00Z', new Date('2026-01-01T12:00:00Z'))
    expect(left).toEqual({ hours: 2, minutes: 30 })
  })
})

describe('isReportExpiringSoon', () => {
  it('détecte une expiration à moins de 30 minutes', () => {
    const now = new Date('2026-01-01T12:00:00Z')
    expect(isReportExpiringSoon('2026-01-01T12:20:00Z', now)).toBe(true)
    expect(isReportExpiringSoon('2026-01-01T13:20:00Z', now)).toBe(false)
  })
})

describe('filterReports', () => {
  const origin = { latitude: 5.32, longitude: -4.01 }

  const makeReport = (id: number, type: Report['type'], latitude: number): Report => ({
    id,
    type,
    latitude,
    longitude: -4.01,
    comment: '',
    status: 'active',
    confirmations: 1,
    createdAt: '2026-01-01T12:00:00Z',
    expiresAt: '2026-01-01T18:00:00Z',
  })

  const reports = [
    makeReport(1, 'camera', 5.3205), // ~0.01 km
    makeReport(2, 'roadworks', 5.34), // ~2.2 km
    makeReport(3, 'slowdown', 5.45), // ~14.4 km
  ]

  it('expose les paliers de distance proposés', () => {
    expect(reportFilterDistances).toEqual([2, 5, 10, 25])
  })

  it('ne filtre rien quand tous les filtres sont désactivés', () => {
    const filtered = filterReports(reports, { maxDistanceKm: null, types: new Set() }, origin)
    expect(filtered).toHaveLength(3)
  })

  it('filtre par distance maximale', () => {
    const filtered = filterReports(reports, { maxDistanceKm: 5, types: new Set() }, origin)
    expect(filtered.map((report) => report.id)).toEqual([1, 2])
  })

  it('filtre par type sélectionné', () => {
    const filtered = filterReports(reports, { maxDistanceKm: null, types: new Set(['camera']) }, origin)
    expect(filtered.map((report) => report.id)).toEqual([1])
  })

  it('combine distance et types', () => {
    const filtered = filterReports(
      reports,
      { maxDistanceKm: 5, types: new Set(['camera', 'slowdown']) },
      origin,
    )
    expect(filtered.map((report) => report.id)).toEqual([1])
  })
})
