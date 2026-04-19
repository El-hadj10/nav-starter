# Backend Node.js pour nav-starter

Ce backend sert de proxy sécurisé pour les appels aux APIs de géocodage et de routage (ex : Mapbox, Here, etc.), afin de protéger les clés et centraliser la configuration.

## Installation

1. Placer votre clé API dans un fichier `.env` à la racine du dossier backend :

```
MAPBOX_TOKEN=VOTRE_CLE_API
```

2. Installer les dépendances :

```
npm install express node-fetch dotenv
```

3. Lancer le serveur :

```
node index.js
```

## Endpoints

- `/api/geocode?q=adresse` → proxy vers le fournisseur de géocodage
- `/api/route?from=lon,lat&to=lon,lat` → proxy vers le fournisseur de routage

Adaptez les URLs dans `index.js` selon le fournisseur choisi.
