# Documentation nav-starter

Ce dossier centralise la documentation du projet nav-starter.

## Contenu

- Vue d'ensemble de l'application mobile de navigation.
- Notes de developpement local.
- Rappels pour le deploiement et l'installation sur telephone.

## Resume du projet

nav-starter est une application front-end React, TypeScript et Vite orientee mobile. L'interface actuelle propose un rendu type application de navigation avec onglets, cartes d'information, installation PWA et support GitHub Pages.

## Points techniques

- Interface principale : `src/App.tsx`
- Styles d'application : `src/App.css`
- Styles globaux : `src/index.css`
- Manifest PWA : `public/manifest.webmanifest`
- Service worker : `public/service-worker.js`
- Deploiement GitHub Pages : `.github/workflows/deploy-pages.yml`

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

## Installation sur telephone

- Android : ouvrir la version HTTPS dans Chrome puis installer l'application.
- iPhone : ouvrir la version HTTPS dans Safari puis utiliser Share > Add to Home Screen.
- L'installation complete demande une URL HTTPS publiee, par exemple via GitHub Pages.

## URL cible de publication

`https://el-hadj10.github.io/nav-starter/`
