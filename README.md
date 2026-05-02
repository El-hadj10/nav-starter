
# nav-starter

Starter front-end basé sur React, TypeScript et Vite. Le projet contient maintenant :

- Interface mobile de navigation installable (PWA)
- Recherche de destinations, favoris persistants, historique récent
- Géolocalisation navigateur
- Intégration de géocodage/routage via backend proxy sécurisé (Mapbox)

## Nouveautés architecture (avril 2026)

- Fournisseur carto/routing : Mapbox (remplace Nominatim/OSRM)
- Backend Node.js minimal (Express, proxy sécurisé, gestion clé API)
- Frontend adapté pour requêter un backend distant via `VITE_API_BASE_URL`
- Proxy Vite intégré dans `vite.config.ts` pour le dev local
- Lint/build validés

Voir `backend/README.md` pour le déploiement backend.

### Prochaines étapes possibles

- Ajouter authentification backend
- Centraliser la config multi-fournisseur
- Synchronisation utilisateur (favoris, historique)

## Scripts

```bash
npm install
npm run dev
npm run build
npm run lint
npm run backend:start
```

## Demarrage

1. Installer les dependances avec `npm install`.
2. Lancer le backend avec `npm run backend:start`.
3. Lancer le serveur de developpement avec `npm run dev`.
4. Ouvrir `http://localhost:5173/nav-starter/`.

## Debug et lancement

- Pour lancer le projet en local, utilisez `npm run dev` ou la tache VS Code `dev server`.
- Pour verifier la production, utilisez `npm run build` puis `npm run preview`.
- Le projet peut etre debugge depuis VS Code avec la configuration `Launch nav-starter`.

## Installation sur telephone

- Android : ouvrez la version HTTPS de l'application dans Chrome puis utilisez le bouton d'installation ou le menu du navigateur.
- iPhone : ouvrez la version HTTPS de l'application dans Safari puis utilisez Share > Add to Home Screen.
- Le mode developpement local ne suffit pas pour un vrai test sur telephone via une IP locale, car le service worker et l'installation exigent un contexte securise HTTPS.

## Deploiement GitHub Pages

- Le projet est configure avec `base: /nav-starter/` pour le depot GitHub `El-hadj10/nav-starter`.
- Le workflow GitHub Actions dans `.github/workflows/deploy-pages.yml` publie automatiquement le dossier `dist` sur GitHub Pages apres un push sur `main`.
- Ajouter la variable de repository GitHub Actions `VITE_API_BASE_URL` pointant vers l'URL publique du backend Render ou Railway.
- Une fois le workflow execute et GitHub Pages active dans le depot, l'URL attendue est `https://el-hadj10.github.io/nav-starter/`.

## Structure utile

- `src/App.tsx` contient l'experience mobile, la recherche, les favoris persistants, l'historique recent, la geolocalisation navigateur et les appels de geocodage/routage.
- `src/App.css` contient la mise en page type application et les composants interactifs.
- `public/manifest.webmanifest` decrit l'application installable.
- `public/service-worker.js` gere le cache hors ligne de base.
- `docs/README.md` centralise la documentation du projet.

## Services utilises

- Recherche distante : Mapbox Geocoding API via backend proxy.
- Routage route et marche : Mapbox Directions API via backend proxy.
- En cas d'echec reseau, l'application conserve un fallback local estime.

## Depot GitHub

Le depot cible est : [https://github.com/El-hadj10/nav-starter](https://github.com/El-hadj10/nav-starter)
