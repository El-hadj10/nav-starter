export type ReportType = 'roadworks' | 'road_closed' | 'camera' | 'slowdown' | 'accident' | 'hazard'

export type ReportStatus = 'active' | 'cleared'

export type Report = {
  id: number
  type: ReportType
  latitude: number
  longitude: number
  comment: string
  status: ReportStatus
  confirmations: number
  createdAt: string
  expiresAt: string
}

export type ReportInput = {
  type: ReportType
  latitude: number
  longitude: number
  comment?: string
}

/** Clés i18n des libellés par type (`reportType.roadworks`, etc.). */
export const reportTypes: ReportType[] = ['roadworks', 'road_closed', 'camera', 'slowdown', 'accident', 'hazard']

/** Icône affichée sur la carte et dans l'interface. */
export const reportTypeIcons: Record<ReportType, string> = {
  roadworks: '🚧',
  road_closed: '⛔',
  camera: '📸',
  slowdown: '🐢',
  accident: '💥',
  hazard: '⚠️',
}

/** Durée de vie affichable par type (doit refléter DEFAULT_REPORT_TTL_MINUTES côté backend). */
export const reportTypeTtlMinutes: Record<ReportType, number> = {
  roadworks: 12 * 60,
  road_closed: 6 * 60,
  camera: 2 * 60,
  slowdown: 90,
  accident: 2 * 60,
  hazard: 4 * 60,
}

export function isReportType(value: unknown): value is ReportType {
  return typeof value === 'string' && reportTypes.includes(value as ReportType)
}

/** Clé i18n du libellé d'un type (`road_closed` -> `reportTypeRoadClosed`). */
export function reportTypeLabelKey(type: ReportType): string {
  return (
    'reportType' +
    type
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join('')
  )
}

/** Distance orthodromique approximative (km) entre le signalement et la position. */
export function distanceToReportKm(
  origin: { latitude: number; longitude: number },
  report: { latitude: number; longitude: number },
): number {
  const toRad = Math.PI / 180
  const dLat = (report.latitude - origin.latitude) * toRad
  const dLng = (report.longitude - origin.longitude) * toRad
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(origin.latitude * toRad) * Math.cos(report.latitude * toRad) * Math.sin(dLng / 2) ** 2
  return Math.round(2 * 6371 * Math.asin(Math.sqrt(a)) * 10) / 10
}

/** Reste-t-il du temps avant expiration ? Renvoie null si déjà expiré. */
export function reportTimeLeft(expiresAt: string, now: Date = new Date()): { hours: number; minutes: number } | null {
  const expiry = new Date(expiresAt).getTime()
  const diff = Math.max(0, expiry - now.getTime())
  if (diff <= 0) return null
  return {
    hours: Math.floor(diff / 3_600_000),
    minutes: Math.floor((diff % 3_600_000) / 60_000),
  }
}

/** Indique si le signalement expire bientôt (moins de 30 min). */
export function isReportExpiringSoon(expiresAt: string, now: Date = new Date()): boolean {
  const left = reportTimeLeft(expiresAt, now)
  return left !== null && left.hours === 0 && left.minutes <= 30
}

export type ReportFilters = {
  /** Distance max en km, ou null pour "tous". */
  maxDistanceKm: number | null
  /** Types affichés ; ensemble vide = tous les types. */
  types: Set<ReportType>
}

export const reportFilterDistances = [2, 5, 10, 25] as const

/** Applique les filtres (distance + types) à une liste de signalements. */
export function filterReports(
  reports: Report[],
  filters: ReportFilters,
  origin: { latitude: number; longitude: number },
): Report[] {
  return reports.filter((report) => {
    if (filters.types.size > 0 && !filters.types.has(report.type)) {
      return false
    }
    if (filters.maxDistanceKm !== null && distanceToReportKm(origin, report) > filters.maxDistanceKm) {
      return false
    }
    return true
  })
}
