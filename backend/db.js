// --- nav-starter base de données SQLite (node:sqlite, zéro dépendance) ---
// La base est créée dans backend/data/ au premier lancement et seedée
// automatiquement avec les destinations de démonstration si elle est vide.

import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { DatabaseSync } from 'node:sqlite'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dataDir = join(__dirname, 'data')

mkdirSync(dataDir, { recursive: true })

export const db = new DatabaseSync(join(dataDir, 'nav-starter.db'))

db.exec(`
  CREATE TABLE IF NOT EXISTS destinations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    area TEXT NOT NULL,
    tag TEXT NOT NULL DEFAULT 'Other',
    description TEXT NOT NULL DEFAULT '',
    traffic TEXT NOT NULL DEFAULT 'Moderate' CHECK (traffic IN ('Low', 'Moderate', 'Heavy')),
    parking TEXT NOT NULL DEFAULT '',
    offline_pack TEXT NOT NULL DEFAULT '',
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    steps TEXT NOT NULL DEFAULT '[]',
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL CHECK (type IN ('roadworks', 'road_closed', 'camera', 'slowdown', 'accident', 'hazard')),
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    comment TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cleared')),
    confirmations INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    expires_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_reports_active ON reports (status, expires_at);
`)

const seedDestinations = [
  {
    id: 'marina-hub',
    name: 'Marina Hub',
    area: 'Lagoon District',
    tag: 'Work',
    description: 'Fast waterfront corridor with consistent flow and monitored access.',
    traffic: 'Low',
    parking: '14 spots in Parking B',
    offlinePack: 'Lagoon + Marina',
    latitude: 5.2905,
    longitude: -3.9876,
    sortOrder: 1,
    steps: [
      { title: 'Leave Plateau', detail: 'Head south on Coastal Avenue.', baseMinuteOffset: 0 },
      { title: 'Cross Harbor Bridge', detail: 'Stay right for Marina access.', baseMinuteOffset: 9 },
      { title: 'Arrive at Marina Hub', detail: 'Entry gate B is open.', baseMinuteOffset: 18 },
    ],
  },
  {
    id: 'canal-market',
    name: 'Canal Market',
    area: 'Old Port',
    tag: 'Food',
    description: 'Dense but predictable urban route, better in transit at peak hours.',
    traffic: 'Moderate',
    parking: 'Street parking, average wait 6 min',
    offlinePack: 'Port Core',
    latitude: 5.3162,
    longitude: -4.0154,
    sortOrder: 2,
    steps: [
      { title: 'Take Riverside Boulevard', detail: 'Use center lane near market zone.', baseMinuteOffset: 0 },
      { title: 'Switch at Market Junction', detail: 'Transit stop M2 is nearby.', baseMinuteOffset: 7 },
      { title: 'Arrive at Canal Market', detail: 'Main hall opens at 09:00.', baseMinuteOffset: 16 },
    ],
  },
  {
    id: 'sunset-point',
    name: 'Sunset Point',
    area: 'Cliffside',
    tag: 'Leisure',
    description: 'Scenic segment with stable fallback for offline guidance.',
    traffic: 'Moderate',
    parking: 'Scenic lot currently at 60% capacity',
    offlinePack: 'Cliffside Trails',
    latitude: 5.3575,
    longitude: -3.9331,
    sortOrder: 3,
    steps: [
      { title: 'Exit city ring', detail: 'Use eastern hill road.', baseMinuteOffset: 0 },
      { title: 'Climb Ridge Pass', detail: 'Moderate curves ahead.', baseMinuteOffset: 13 },
      { title: 'Reach Sunset Point', detail: 'Northern platform has best view.', baseMinuteOffset: 29 },
    ],
  },
  {
    id: 'airport-gate',
    name: 'Airport Gate C',
    area: 'North Terminal',
    tag: 'Travel',
    description: 'Priority lane with stronger traffic variability during rush.',
    traffic: 'Heavy',
    parking: 'Drop-off only, gate C recommended',
    offlinePack: 'Airport Ring',
    latitude: 5.2614,
    longitude: -3.9263,
    sortOrder: 4,
    steps: [
      { title: 'Join northern expressway', detail: 'Take lane 2 for faster progression.', baseMinuteOffset: 0 },
      { title: 'Pass cargo interchange', detail: 'Expect congestion pocket.', baseMinuteOffset: 15 },
      { title: 'Reach Airport Gate C', detail: 'Drop-off lane is open.', baseMinuteOffset: 31 },
    ],
  },
]

const countRow = db.prepare('SELECT COUNT(*) AS total FROM destinations')
if (countRow.get().total === 0) {
  const insert = db.prepare(`
    INSERT INTO destinations (id, name, area, tag, description, traffic, parking, offline_pack, latitude, longitude, steps, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  for (const destination of seedDestinations) {
    insert.run(
      destination.id,
      destination.name,
      destination.area,
      destination.tag,
      destination.description,
      destination.traffic,
      destination.parking,
      destination.offlinePack,
      destination.latitude,
      destination.longitude,
      JSON.stringify(destination.steps),
      destination.sortOrder,
    )
  }
  console.log('Base SQLite initialisée avec les destinations de démonstration')
}

/** Convertit une ligne SQL en objet destination prêt pour l'API/frontend. */
export function rowToDestination(row) {
  let steps = []
  try {
    steps = JSON.parse(row.steps)
  } catch {
    steps = []
  }
  return {
    id: row.id,
    name: row.name,
    area: row.area,
    tag: row.tag,
    description: row.description,
    traffic: row.traffic,
    parking: row.parking,
    offlinePack: row.offline_pack,
    coordinates: { latitude: row.latitude, longitude: row.longitude },
    baseSteps: Array.isArray(steps) ? steps : [],
    sortOrder: row.sort_order,
  }
}

/** Convertit une ligne SQL en objet signalement prêt pour l'API/frontend. */
export function rowToReport(row) {
  return {
    id: row.id,
    type: row.type,
    latitude: row.latitude,
    longitude: row.longitude,
    comment: row.comment,
    status: row.status,
    confirmations: row.confirmations,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
  }
}
