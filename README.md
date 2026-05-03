
# Luma.store

<p align="center">
	<img src="https://capsule-render.vercel.app/api?type=waving&height=220&color=0:f59e0b,100:f97316&text=Luma.store&fontAlignY=36&desc=AI%20Commerce%20Engine&descAlignY=56&fontColor=ffffff" alt="Luma Banner" />
</p>

<p align="center">
	<img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=600&size=20&pause=900&color=F59E0B&center=true&vCenter=true&width=760&lines=Discover+%E2%86%92+Score+%E2%86%92+Price+%E2%86%92+Publish;Multi-agent+commerce+automation;FastAPI+%2B+Next.js+%2B+PostgreSQL+%2B+Redis" alt="Typing Intro" />
</p>

<p align="center">
	<a href="https://github.com/El-hadj10"><img src="https://img.shields.io/badge/GitHub-El--hadj10-181717?style=for-the-badge&logo=github" alt="GitHub" /></a>
	<a href="https://github.com/El-hadj10/LUMA.STORE"><img src="https://img.shields.io/badge/Repo-LUMA.STORE-f59e0b?style=for-the-badge" alt="Repository" /></a>
	<img src="https://img.shields.io/badge/Stack-FastAPI%20%7C%20Next.js%20%7C%20Agents-orange?style=for-the-badge" alt="Stack" />
	<img src="https://img.shields.io/badge/Aura-Cyber%20Hardened-111827?style=for-the-badge" alt="Cyber Aura" />
</p>

## FR / EN Snapshot

### FR

Plateforme e-commerce IA qui automatise sourcing, scoring, pricing et publication avec une approche orientee marge, fiabilite et execution.

### EN

AI-native commerce platform that automates sourcing, scoring, pricing, and publishing with a margin-first, reliability-driven execution model.

## Vision

Luma.store est une architecture e-commerce pilotee par IA:

- Sourcing produits multi-marketplaces
- Evaluation automatique par score business
- Pricing dynamique avec contraintes de marge
- Publication guidee vers une vitrine moderne

## Manifesto

Transformer un catalogue en machine de croissance:

- Data d'abord
- Marge controlee
- Vitesse d'execution
- Qualite editoriale
- Boucle d'amelioration continue

## Philosophie

- Lumiere: experience client claire, rapide, elegante.
- Ombre: resilience technique, monitoring, securite.
- Ordre: architecture modulaire et agents specialises.

## Architecture

| Module | Role |
|---|---|
| `agents/` | Orchestration IA (copywriting, pricing, scoring, sourcing, growth) |
| `api/` | FastAPI, auth, produits, commandes, webhooks |
| `connectors/` | Integrations Amazon, eBay, AliExpress |
| `frontend/` | Next.js 14, experience boutique complete |
| `database/` | Schemas SQL et migrations |
| `infrastructure/` | Docker Compose, Nginx, orchestration |
| `shared/` | Constantes et schemas partages |

## Agents IA

- Sourcing Agent: detecte les offres pertinentes
- Scoring Agent: filtre par qualite, note et potentiel
- Pricing Agent: calcule les prix cibles et marges
- Copywriter Agent: genere titres et descriptions
- Growth Agent: propose des optimisations conversion
- Customer Service Agent: prepare les reponses support

## Execution Loop

1. Sourcer des offres multi-marketplaces.
2. Evaluer via score, marge et fiabilite.
3. Re-pricer selon objectifs business.
4. Generer fiches produit et assets texte.
5. Publier puis monitorer les signaux de performance.

## Tech Arsenal

- Frontend: Next.js 14, TypeScript
- Backend: FastAPI, SQLAlchemy, Pydantic
- IA: orchestration multi-agents Python
- Data: PostgreSQL, Redis, Celery
- Infra: Docker Compose, Nginx, CI/CD

## GitHub Pulse

<p align="center">
	<img height="170" src="https://github-readme-stats.vercel.app/api?username=El-hadj10&show_icons=true&theme=transparent&title_color=f59e0b&icon_color=f59e0b&text_color=cbd5e1&border_color=334155" alt="GitHub Stats" />
	<img height="170" src="https://github-readme-stats.vercel.app/api/top-langs/?username=El-hadj10&layout=compact&theme=transparent&title_color=f59e0b&text_color=cbd5e1&border_color=334155" alt="Top Languages" />
</p>

## Quick Start

```bash
docker compose -f infrastructure/docker-compose.yml up postgres redis -d

cd api
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

cd ../frontend
npm install
npm run dev
```

- Frontend: http://localhost:3000
- API docs: http://localhost:8000/docs

## Status 2026-05-03

- Backend et agents operationnels
- Frontend Next.js refondu sur les pages critiques
- CI/CD et deploiement pages en place
- Prochain bloc: migrations Alembic + KPIs reels admin

## Roadmap 30 Jours

1. Finaliser pipeline Alembic (revision + upgrade head).
2. Brancher KPIs admin sur donnees API reelles.
3. Completer la signature AWS SigV4 cote Amazon.
4. Ajouter tests API critiques (pricing, orders, products).
5. Renforcer logs agents vers table dediee.

## Documentation

- Architecture detaillee: [docs/architecture.md](docs/architecture.md)
- Notes projet: [docs/README.md](docs/README.md)
- Backend proxy nav: [backend/README.md](backend/README.md)

## Profil Alternatif

- Version profil personnelle: [GITHUB_PROFILE_README.md](GITHUB_PROFILE_README.md)

## Auteur

Nour (El-hadj10) - Full-Stack Developer and Cybersecurity Enthusiast

<p align="center">
	<img src="https://capsule-render.vercel.app/api?type=rect&height=120&color=0:111827,100:1f2937&text=Build%20in%20light.%20Harden%20in%20shadow.&fontColor=f59e0b&fontSize=24" alt="Signature" />
</p>
