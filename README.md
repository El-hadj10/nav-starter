# nav-starter

Starter front-end base sur React, TypeScript et Vite. Le projet contient maintenant une interface mobile de navigation installable avec recherche de destinations, modes de trajet, favoris persistants, historique recent, geolocalisation navigateur et integration de geocodage/routage public.

## Scripts

```bash
npm install
npm run dev
npm run build
npm run lint
```

## Demarrage

1. Installer les dependances avec `npm install`.
2. Lancer le serveur de developpement avec `npm run dev`.
3. Ouvrir `http://localhost:5173/nav-starter/`.

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
- Une fois le workflow execute et GitHub Pages active dans le depot, l'URL attendue est `https://el-hadj10.github.io/nav-starter/`.

## Structure utile

- `src/App.tsx` contient l'experience mobile, la recherche, les favoris persistants, l'historique recent, la geolocalisation navigateur et les appels de geocodage/routage.
- `src/App.css` contient la mise en page type application et les composants interactifs.
- `public/manifest.webmanifest` decrit l'application installable.
- `public/service-worker.js` gere le cache hors ligne de base.
- `docs/README.md` centralise la documentation du projet.

## Services utilises

- Recherche distante : Nominatim OpenStreetMap.
- Routage route et marche : OSRM demo server.
- En cas d'echec reseau, l'application conserve un fallback local estime.

## Depot GitHub

Le depot cible est : [https://github.com/El-hadj10/nav-starter](https://github.com/El-hadj10/nav-starter)
