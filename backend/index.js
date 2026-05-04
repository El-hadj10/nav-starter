// --- nav-starter backend proxy ---
// Fournit un proxy sécurisé pour Mapbox Geocoding/Directions
// Permet de protéger la clé API et de centraliser la config

import dotenv from 'dotenv'
import express from 'express'
import jwt from 'jsonwebtoken'

// Charge les variables d'environnement (.env ou plateforme)
dotenv.config()

const app = express()
const PORT = Number(process.env.PORT || 4000)
const MAPBOX_TOKEN = process.env.MAPBOX_TOKEN
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me'
const DEMO_USER_EMAIL = process.env.DEMO_USER_EMAIL || 'demo@navstarter.dev'
const DEMO_USER_PASSWORD = process.env.DEMO_USER_PASSWORD || 'NavStarter123!'
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

function createSessionToken(email) {
  return jwt.sign(
    {
      sub: email,
      scope: ['routes:read', 'profile:read'],
      role: 'user',
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

  const isValidUser = email === DEMO_USER_EMAIL.toLowerCase() && password === DEMO_USER_PASSWORD
  if (!isValidUser) {
    res.status(401).json({ error: 'Invalid credentials' })
    return
  }

  const token = createSessionToken(email)
  res.json({
    token,
    user: {
      email,
      name: 'Demo Navigator',
    },
  })
})

// Endpoint protégé pour valider la session
app.get('/api/auth/session', authenticateToken, (req, res) => {
  res.json({ ok: true, user: req.user })
})

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

// Lancement du serveur
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`)
})
