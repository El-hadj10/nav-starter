
# nav-starter

<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&height=220&color=0:0ea5e9,100:6366f1&text=nav-starter&fontAlignY=36&desc=Mobile%20Navigation%20PWA&descAlignY=56&fontColor=ffffff" alt="nav-starter Banner" />
</p>

<p align="center">
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=600&size=20&pause=900&color=0EA5E9&center=true&vCenter=true&width=760&lines=Search+%E2%86%92+Navigate+%E2%86%92+Arrive;React+%2B+TypeScript+%2B+Vite+PWA;Mapbox+%7C+Geolocation+%7C+Offline+Ready" alt="Typing Intro" />
</p>

<p align="center">
  <a href="https://github.com/El-hadj10"><img src="https://img.shields.io/badge/GitHub-El--hadj10-181717?style=for-the-badge&logo=github" alt="GitHub" /></a>
  <a href="https://el-hadj10.github.io/nav-starter/"><img src="https://img.shields.io/badge/Live-GitHub%20Pages-0ea5e9?style=for-the-badge" alt="Live" /></a>
  <img src="https://img.shields.io/badge/Stack-React%20%7C%20Vite%20%7C%20TypeScript-6366f1?style=for-the-badge" alt="Stack" />
  <img src="https://img.shields.io/badge/PWA-Installable-111827?style=for-the-badge" alt="PWA" />
</p>

## FR / EN Snapshot

### FR

Application mobile de navigation installable (PWA) — recherche de destinations, routage via Mapbox, favoris persistants et support hors-ligne.

### EN

Installable mobile navigation PWA — destination search, Mapbox-powered routing, persistent favorites and offline support.

## Fonctionnalites

- Recherche de destinations par nom, zone ou categorie
- Routage voiture, transport en commun et marche (Mapbox Directions)
- Geocodage distant via Mapbox Geocoding
- Geolocalisation navigateur pour recalcul ETA en temps reel
- Favoris et historique recent persistes en localStorage
- Installation mobile (PWA) — Android Chrome et iOS Safari
- Backend Node.js proxy securise (cle API jamais exposee cote client)
- Fallback estime si le service de routage ne repond pas

## Architecture

| Couche | Technologie | Role |
|---|---|---|
| Frontend | React 18 + TypeScript + Vite | Interface mobile, logique navigation |
| Styles | CSS custom | Mise en page type application native |
| Backend | Node.js + Express | Proxy securise Mapbox |
| PWA | manifest + service worker | Installation et cache hors-ligne |
| CI/CD | GitHub Actions | Build et deploy automatiques sur GitHub Pages |

## Quick Start

```bash
# Dependances
npm install

# Variables d environnement backend
cp .env.example .env
# Renseigner MAPBOX_TOKEN et ALLOWED_ORIGINS dans .env

# Lancer le backend proxy
npm run backend:start

# Lancer le frontend en dev
npm run dev
```

Frontend local : `http://localhost:5173/nav-starter/`

## Build et deploiement

```bash
npm run build    # production dans dist/
npm run preview  # verifier le build en local
```

- Deploiement automatique sur **GitHub Pages** via `.github/workflows/deploy-pages.yml`
- URL live : `https://el-hadj10.github.io/nav-starter/`
- Variable GitHub Actions requise : `VITE_API_BASE_URL` → URL publique du backend (Render ou Railway)

## Backend (proxy Mapbox)

| Endpoint | Description |
|---|---|
| `GET /health` | Verification disponibilite |
| `GET /api/geocode?q=adresse` | Geocodage Mapbox |
| `GET /api/route?from=lon,lat&to=lon,lat&profile=driving\|walking` | Routage Mapbox |

Voir [backend/README.md](backend/README.md) pour le deploiement Render/Railway.

## Debug VS Code

- Tache : `dev server` (menu Terminal > Run Task)
- Lancement debug : configuration `Launch nav-starter`
- Build + lint : `npm run build && npm run lint`

## Profil

- README profil personnel : [GITHUB_PROFILE_README.md](GITHUB_PROFILE_README.md)

## Auteur

Nour (El-hadj10) — Full-Stack Developer & Cybersecurity Enthusiast

<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=rect&height=110&color=0:0f172a,100:1e293b&text=Build%20in%20light.%20Harden%20in%20shadow.&fontColor=0ea5e9&fontSize=22" alt="Signature" />
</p>
