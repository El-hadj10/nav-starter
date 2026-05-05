# Backend Node.js pour nav-starter

Ce backend sert de proxy sécurisé pour les appels aux APIs de géocodage et de routage Mapbox afin de protéger les clés et centraliser la configuration.

## Installation

1. Définir les variables d'environnement :

```bash
MAPBOX_TOKEN=your_mapbox_api_key_here
ALLOWED_ORIGINS=http://localhost:5173,https://yourdomain.com
PORT=4000
JWT_SECRET=your-secret-key-change-in-production
DEMO_USER_EMAIL=demo@example.com
DEMO_USER_PASSWORD=DemoPassword123!
```

1. Installer les dépendances à la racine du projet :

```bash
npm install
```

1. Lancer le serveur :

```bash
npm run backend:start
```

## Endpoints utiles

- `/health` : vérification simple de disponibilité
- `POST /api/auth/login` : authentification demo (JWT)
- `GET /api/auth/session` : validation de session JWT (Bearer token)
- `/api/geocode?q=adresse` : proxy vers Mapbox Geocoding
- `/api/route?from=lon,lat&to=lon,lat&profile=driving|walking` : proxy vers Mapbox Directions

## Deploiement Render

- Runtime : Node
- Build command : `npm install`
- Start command : `npm run backend:start`
- Variables : `MAPBOX_TOKEN`, `ALLOWED_ORIGINS`

## Deploiement Railway

- Start command : `npm run backend:start`
- Variables : `MAPBOX_TOKEN`, `ALLOWED_ORIGINS`
- Health check : `/health`
