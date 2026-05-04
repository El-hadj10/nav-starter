# Backend Node.js pour nav-starter

Ce backend sert de proxy sécurisé pour les appels aux APIs de géocodage et de routage Mapbox afin de protéger les clés et centraliser la configuration.

## Installation

1. Définir les variables d'environnement :

```bash
MAPBOX_TOKEN=VOTRE_CLE_API
ALLOWED_ORIGINS=https://el-hadj10.github.io,http://localhost:5173
PORT=4000
JWT_SECRET=change-this-in-production
DEMO_USER_EMAIL=demo@navstarter.dev
DEMO_USER_PASSWORD=NavStarter123!
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
