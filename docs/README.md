# Documentation nav-starter

Ce dossier centralise la documentation du projet nav-starter.

## Contenu

- Vue d'ensemble de l'application mobile de navigation.
- Notes de developpement local.
- Rappels pour le deploiement et l'installation sur telephone.

## Resume du projet

nav-starter est une application front-end React, TypeScript et Vite orientee mobile. L'interface actuelle propose un rendu type application de navigation avec onglets, recherche, changement de mode de trajet, favoris persistants, historique recent, geolocalisation navigateur, installation PWA et support GitHub Pages.

## Fonctionnalites actuelles

- Recherche de destinations par nom, zone ou categorie.
- Selection d'un trajet actif avec mise a jour du resume et de la timeline.
- Changement de mode de trajet entre voiture, transport et marche.
- Sauvegarde locale des favoris et des destinations recentes via localStorage.
- Geolocalisation navigateur pour recalculer distance et ETA depuis la position courante.
- Recherche distante via Mapbox Geocoding, au travers d'un backend proxy.
- Routage route et marche via Mapbox Directions, avec fallback estime si le service ne repond pas.
- Installation mobile via PWA.

## Points techniques

- Interface principale : `src/App.tsx`
- Styles d'application : `src/App.css`
- Styles globaux : `src/index.css`
- Manifest PWA : `public/manifest.webmanifest`
- Service worker : `public/service-worker.js`
- Deploiement GitHub Pages : `.github/workflows/deploy-pages.yml`
- Backend de proxy : `backend/index.js`

## Lancer le projet

```bash
npm install
npm run dev
```

URL locale attendue : `http://localhost:5173/nav-starter/`

## Verifications

```bash
npm run lint
npm run build
```

## Strategie de deploiement

- Front-end : GitHub Pages
- Backend : Render ou Railway
- Variable de build front : `VITE_API_BASE_URL`
- Variables backend : `MAPBOX_TOKEN`, `ALLOWED_ORIGINS`, `PORT`

## Installation sur telephone

- Android : ouvrir la version HTTPS dans Chrome puis installer l'application.
- iPhone : ouvrir la version HTTPS dans Safari puis utiliser Share > Add to Home Screen.
- L'installation complete demande une URL HTTPS publiee, par exemple via GitHub Pages.

## URL cible de publication

`https://el-hadj10.github.io/nav-starter/`
