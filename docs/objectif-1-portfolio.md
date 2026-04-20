# Objectif 1 — Portfolio / Recruteur

Rendre le projet "présentable" et crédible : structure claire, scripts fiables, CI, sécurité de base, et documentation cohérente.

## Résultat attendu
- Installation simple (front + backend)
- Lint/build reproductibles
- Déploiement front sur GitHub Pages OK
- Backend proxy prêt à être déployé (config + sécurité minimale)

## Checklist (priorité)
### A. Repo & scripts
- [ ] Séparer clairement frontend et backend (au minimum : scripts dédiés `dev:front`, `dev:back` et une doc "comment lancer")
- [ ] Ajouter/valider les scripts : `lint`, `build`, `preview`, et un script "check" qui fait lint+build
- [ ] Vérifier `.gitignore` et fournir un `backend/.env.example`

### B. Documentation
- [ ] Mettre à jour `README.md` pour qu'il soit cohérent (Mapbox vs Nominatim/OSRM)
- [ ] Documenter le flux dev : Vite proxy -> backend local -> Mapbox
- [ ] Expliquer la contrainte : GitHub Pages = front statique (backend à héberger séparément)

### C. Qualité (CI)
- [ ] Ajouter un workflow CI (ou renforcer l'existant) qui exécute : `npm ci`, `npm run lint`, `npm run build`
- [ ] Rendre le build bloquant en cas d'erreurs TypeScript

### D. Sécurité backend (minimum viable)
- [ ] Valider les paramètres `q`, `from`, `to` (formats, longueur max)
- [ ] Ajouter un timeout et gérer les erreurs HTTP renvoyées par le fournisseur
- [ ] Ajouter rate limiting (anti-abus)
- [ ] Restreindre CORS aux origines attendues
- [ ] Vérifier la présence de `MAPBOX_TOKEN` au démarrage (sinon fail fast)

## Critères de fin
- `npm run lint` et `npm run build` passent sur une machine neuve
- La doc permet à une autre personne de lancer front+back en < 10 minutes
- Le backend ne divulgue pas la clé et refuse les requêtes invalides
