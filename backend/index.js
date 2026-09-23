// --- nav-starter backend proxy ---
// Fournit un proxy sécurisé pour Mapbox Geocoding/Directions
// Permet de protéger la clé API et de centraliser la config

import dotenv from 'dotenv'
import express from 'express'
import jwt from 'jsonwebtoken'
import { db, rowToDestination, rowToReport } from './db.js'

// Charge les variables d'environnement (.env ou plateforme)
dotenv.config()

const app = express()
const PORT = Number(process.env.PORT || 4000)
const MAPBOX_TOKEN = process.env.MAPBOX_TOKEN
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me'
const DEMO_USER_EMAIL = process.env.DEMO_USER_EMAIL || 'demo@navstarter.dev'
const DEMO_USER_PASSWORD = process.env.DEMO_USER_PASSWORD || 'NavStarter123!'
// Compte administrateur : accès au CRUD destinations
const ADMIN_EMAIL = String(process.env.ADMIN_EMAIL || 'admin@navstarter.dev').toLowerCase()
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'AdminStarter123!'
// Liste blanche d'origines autorisées pour le CORS
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

// Middleware CORS simple (GET/OPTIONS)
function setCorsHeaders(req, res) {
  const requestOrigin = req.headers.origin
  if (!requestOrigin) return
  if (allowedOrigins.length === 0 || allowedOrigins.includes(requestOrigin)) {
    res.setHeader('Access-Control-Allow-Origin', requestOrigin)
    res.setHeader('Vary', 'Origin')
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization')
  }
}

// Applique CORS à toutes les routes
app.use((req, res, next) => {
  setCorsHeaders(req, res)
  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }
  next()
})

app.use(express.json())

function createSessionToken(email, role) {
  return jwt.sign(
    {
      sub: email,
      scope: role === 'admin' ? ['routes:read', 'profile:read', 'destinations:write'] : ['routes:read', 'profile:read'],
      role,
    },
    JWT_SECRET,
    { expiresIn: '8h' },
  )
}

function authenticateToken(req, res, next) {
  const rawHeader = req.headers.authorization || ''
  const token = rawHeader.startsWith('Bearer ') ? rawHeader.slice(7) : ''

  if (!token) {
    res.status(401).json({ error: 'Missing bearer token' })
    return
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET)
    req.user = payload
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}

// Endpoint de healthcheck pour Render/Railway
app.get('/health', (_req, res) => {
  res.json({ ok: true, provider: 'mapbox' })
})

// Authentification simple JWT (démonstration)
app.post('/api/auth/login', (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase()
  const password = String(req.body?.password || '')

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' })
    return
  }

  const isAdminCredentials = email === ADMIN_EMAIL && password === ADMIN_PASSWORD
  const isDemoUser = email === DEMO_USER_EMAIL.toLowerCase() && password === DEMO_USER_PASSWORD
  if (!isAdminCredentials && !isDemoUser) {
    res.status(401).json({ error: 'Invalid credentials' })
    return
  }

  const role = isAdminCredentials ? 'admin' : 'user'
  const token = createSessionToken(email, role)
  res.json({
    token,
    role,
    user: {
      email,
      name: isAdminCredentials ? 'Administrator' : 'Demo Navigator',
    },
  })
})

// Endpoint protégé pour valider la session
app.get('/api/auth/session', authenticateToken, (req, res) => {
  res.json({ ok: true, user: req.user })
})

// ===================== CRUD destinations (SQLite) =====================
// Lecture : publique. Écriture : jeton JWT requis (rôle admin sur POST/DELETE).

function createRoleMiddleware(requiredRole) {
  return (req, res, next) => {
    authenticateToken(req, res, () => {
      if (req.user?.role !== requiredRole) {
        res.status(403).json({ error: `Role '${requiredRole}' required` })
        return
      }
      next()
    })
  }
}

const requireAdmin = createRoleMiddleware('admin')

function validateDestinationPayload(body) {
  const name = String(body?.name || '').trim()
  const area = String(body?.area || '').trim()
  const latitude = Number(body?.latitude)
  const longitude = Number(body?.longitude)

  if (!name || !area) {
    return { error: 'name and area are required' }
  }
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    return { error: 'latitude must be a number between -90 and 90' }
  }
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    return { error: 'longitude must be a number between -180 and 180' }
  }

  const traffic = ['Low', 'Moderate', 'Heavy'].includes(body?.traffic) ? body.traffic : 'Moderate'
  let steps = body?.steps
  if (steps !== undefined) {
    if (!Array.isArray(steps)) {
      return { error: 'steps must be an array' }
    }
    steps = steps.filter(
      (step) => step && typeof step.title === 'string' && step.title.trim() !== '' && typeof step.baseMinuteOffset === 'number',
    )
  }

  return {
    value: {
      name,
      area,
      tag: String(body?.tag || 'Other').trim() || 'Other',
      description: String(body?.description || '').trim(),
      traffic,
      parking: String(body?.parking || '').trim(),
      offlinePack: String(body?.offlinePack || '').trim(),
      latitude,
      longitude,
      steps: steps ?? [],
      sortOrder: Number.isFinite(Number(body?.sortOrder)) ? Number(body.sortOrder) : 0,
    },
  }
}

// Liste publique (alimente l'app mobile)
app.get('/api/destinations', (_req, res) => {
  const rows = db.prepare('SELECT * FROM destinations ORDER BY sort_order, name').all()
  res.json({ destinations: rows.map(rowToDestination) })
})

// Détail public
app.get('/api/destinations/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM destinations WHERE id = ?').get(String(req.params.id))
  if (!row) {
    res.status(404).json({ error: 'Destination not found' })
    return
  }
  res.json(rowToDestination(row))
})

// Création (admin)
app.post('/api/destinations', requireAdmin, (req, res) => {
  const validation = validateDestinationPayload(req.body)
  if (validation.error) {
    res.status(400).json({ error: validation.error })
    return
  }

  const value = validation.value
  const id = String(req.body?.id || '').trim() || `dest-${Date.now().toString(36)}`

  try {
    db.prepare(
      `INSERT INTO destinations (id, name, area, tag, description, traffic, parking, offline_pack, latitude, longitude, steps, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      value.name,
      value.area,
      value.tag,
      value.description,
      value.traffic,
      value.parking,
      value.offlinePack,
      value.latitude,
      value.longitude,
      JSON.stringify(value.steps),
      value.sortOrder,
    )
  } catch (error) {
    if (String(error?.message || '').includes('UNIQUE')) {
      res.status(409).json({ error: 'Destination id already exists' })
      return
    }
    throw error
  }

  const row = db.prepare('SELECT * FROM destinations WHERE id = ?').get(id)
  res.status(201).json(rowToDestination(row))
})

// Mise à jour (admin)
app.put('/api/destinations/:id', requireAdmin, (req, res) => {
  const row = db.prepare('SELECT * FROM destinations WHERE id = ?').get(String(req.params.id))
  if (!row) {
    res.status(404).json({ error: 'Destination not found' })
    return
  }

  const validation = validateDestinationPayload(req.body)
  if (validation.error) {
    res.status(400).json({ error: validation.error })
    return
  }

  const value = validation.value
  db.prepare(
    `UPDATE destinations
     SET name = ?, area = ?, tag = ?, description = ?, traffic = ?, parking = ?, offline_pack = ?, latitude = ?, longitude = ?, steps = ?, sort_order = ?, updated_at = datetime('now')
     WHERE id = ?`,
  ).run(
    value.name,
    value.area,
    value.tag,
    value.description,
    value.traffic,
    value.parking,
    value.offlinePack,
    value.latitude,
    value.longitude,
    JSON.stringify(value.steps),
    value.sortOrder,
    String(req.params.id),
  )

  const updated = db.prepare('SELECT * FROM destinations WHERE id = ?').get(String(req.params.id))
  res.json(rowToDestination(updated))
})

// Suppression (admin)
app.delete('/api/destinations/:id', requireAdmin, (req, res) => {
  const result = db.prepare('DELETE FROM destinations WHERE id = ?').run(String(req.params.id))
  if (result.changes === 0) {
    res.status(404).json({ error: 'Destination not found' })
    return
  }
  res.json({ ok: true })
})

// ===================== Fin CRUD destinations =====================

// Proxy Mapbox Geocoding
// GET /api/geocode?q=adresse
app.get('/api/geocode', async (req, res) => {
  const query = String(req.query.q || '').trim()
  if (!query) {
    res.status(400).json({ error: 'Missing query' })
    return
  }
  if (!MAPBOX_TOKEN) {
    res.status(500).json({ error: 'Missing MAPBOX_TOKEN' })
    return
  }
  // Construit l’URL Mapbox
  const endpoint = new URL(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`)
  endpoint.searchParams.set('access_token', MAPBOX_TOKEN)
  endpoint.searchParams.set('limit', '5')
  endpoint.searchParams.set('autocomplete', 'true')
  try {
    const response = await fetch(endpoint)
    if (!response.ok) {
      res.status(response.status).json({ error: 'Geocoding failed' })
      return
    }
    const data = await response.json()
    res.json(data)
  } catch {
    res.status(500).json({ error: 'Geocoding failed' })
  }
})

// Proxy Mapbox Directions
// GET /api/route?from=lon,lat&to=lon,lat&profile=driving|walking
app.get('/api/route', async (req, res) => {
  const from = String(req.query.from || '').trim()
  const to = String(req.query.to || '').trim()
  const profileParam = String(req.query.profile || 'driving').trim()
  // Sécurise le profil (driving ou walking)
  const profile = profileParam === 'walking' ? 'walking' : 'driving'
  if (!from || !to) {
    res.status(400).json({ error: 'Missing from/to' })
    return
  }
  if (!MAPBOX_TOKEN) {
    res.status(500).json({ error: 'Missing MAPBOX_TOKEN' })
    return
  }
  // Construit l’URL Mapbox
  const endpoint = new URL(`https://api.mapbox.com/directions/v5/mapbox/${profile}/${from};${to}`)
  endpoint.searchParams.set('access_token', MAPBOX_TOKEN)
  endpoint.searchParams.set('overview', 'full')
  endpoint.searchParams.set('steps', 'true')
  endpoint.searchParams.set('geometries', 'geojson')
  try {
    const response = await fetch(endpoint)
    if (!response.ok) {
      res.status(response.status).json({ error: 'Routing failed' })
      return
    }
    const data = await response.json()
    res.json(data)
  } catch {
    res.status(500).json({ error: 'Routing failed' })
  }
})

// ===================== Signalements communautaires (reports) =====================
// Types : roadworks (travaux), road_closed (voie fermée), camera (radar),
// slowdown (ralentissement), accident, hazard (danger).
// Lecture : publique. Création : jeton JWT requis. Levée : tout utilisateur authentifié.

const REPORT_TYPES = ['roadworks', 'road_closed', 'camera', 'slowdown', 'accident', 'hazard']
// Durée de vie par défaut par type (en minutes) — personnalisable via REPORT_TTL_JSON
const DEFAULT_REPORT_TTL_MINUTES = {
  roadworks: 12 * 60,
  road_closed: 6 * 60,
  camera: 2 * 60,
  slowdown: 90,
  accident: 2 * 60,
  hazard: 4 * 60,
}

function getReportTtlMinutes() {
  const raw = process.env.REPORT_TTL_JSON
  if (!raw) return DEFAULT_REPORT_TTL_MINUTES
  try {
    return { ...DEFAULT_REPORT_TTL_MINUTES, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_REPORT_TTL_MINUTES
  }
}

/** Expiration ISO des signalements de `type`, dans `now` (Date) comme référence. */
function computeReportExpiry(type, now) {
  const ttlMinutes = getReportTtlMinutes()[type] ?? 120
  return new Date(now.getTime() + ttlMinutes * 60_000).toISOString()
}

// Purge des signalements expirés (au démarrage + toutes les 5 minutes)
db.prepare("UPDATE reports SET status = 'cleared' WHERE status = 'active' AND expires_at <= datetime('now')").run()
setInterval(() => {
  db.prepare("UPDATE reports SET status = 'cleared' WHERE status = 'active' AND expires_at <= datetime('now')").run()
}, 5 * 60_000).unref()

// Liste des signalements actifs (public, alimente la carte)
app.get('/api/reports', (_req, res) => {
  const rows = db
    .prepare("SELECT * FROM reports WHERE status = 'active' AND expires_at > datetime('now') ORDER BY created_at DESC")
    .all()
  res.json({ reports: rows.map(rowToReport) })
})

// Création d'un signalement (auth requis, pas de restriction de rôle)
app.post('/api/reports', authenticateToken, (req, res) => {
  const type = String(req.body?.type || '').trim()
  const latitude = Number(req.body?.latitude)
  const longitude = Number(req.body?.longitude)
  const comment = String(req.body?.comment || '').trim().slice(0, 280)

  if (!REPORT_TYPES.includes(type)) {
    res.status(400).json({ error: `type must be one of: ${REPORT_TYPES.join(', ')}` })
    return
  }
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    res.status(400).json({ error: 'latitude must be a number between -90 and 90' })
    return
  }
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    res.status(400).json({ error: 'longitude must be a number between -180 and 180' })
    return
  }

  const now = new Date()
  const result = db
    .prepare(
      `INSERT INTO reports (type, latitude, longitude, comment, expires_at)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .run(type, latitude, longitude, comment, computeReportExpiry(type, now))

  const row = db.prepare('SELECT * FROM reports WHERE id = ?').get(result.lastInsertRowid)
  res.status(201).json(rowToReport(row))
})

// Confirmer un signalement (auth requis) — incrémente le compteur communautaire
app.post('/api/reports/:id/confirm', authenticateToken, (req, res) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: 'Invalid report id' })
    return
  }
  const result = db
    .prepare("UPDATE reports SET confirmations = confirmations + 1 WHERE id = ? AND status = 'active' AND expires_at > datetime('now')")
    .run(id)
  if (result.changes === 0) {
    res.status(404).json({ error: 'Active report not found' })
    return
  }
  const row = db.prepare('SELECT * FROM reports WHERE id = ?').get(id)
  res.json(rowToReport(row))
})

// Lever un signalement (auth requis) — "la route est dégagée maintenant"
app.post('/api/reports/:id/clear', authenticateToken, (req, res) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: 'Invalid report id' })
    return
  }
  const result = db
    .prepare("UPDATE reports SET status = 'cleared' WHERE id = ? AND status = 'active'")
    .run(id)
  if (result.changes === 0) {
    res.status(404).json({ error: 'Active report not found' })
    return
  }
  res.json({ ok: true })
})

// ===================== Fin signalements =====================

// Lancement du serveur
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`)
})
