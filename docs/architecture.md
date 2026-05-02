# Luma — Architecture Technique

## Vue d'ensemble

Luma est une plateforme e-commerce 100% automatisée par un système multi-agents IA.
Le nom Luma est l'équivalent latin de Nour (نور) — la lumière.

## Structure du projet

```
nav-starter/
├── frontend/        # Vitrine Next.js 14 (App Router, SSR, SEO)
├── api/             # Backend FastAPI Python (REST, auth JWT, webhooks)
├── agents/          # Moteur IA multi-agents (sourcing → publication)
├── connectors/      # Connecteurs marchands (Amazon, eBay, AliExpress)
├── database/        # Schémas SQL, migrations Alembic, seeds
├── infrastructure/  # Docker, Nginx, CI/CD GitHub Actions
├── shared/          # Schémas Pydantic + constantes cross-modules
└── docs/            # Documentation technique
```

## Flux principal (Pipeline de publication)

```
Connecteur → Sourcing Agent → Scoring Agent → Copywriter Agent → Pricing Agent → Publication
```

## Agents IA

| Agent | Rôle | Fichier |
|---|---|---|
| SourcingAgent | Filtre les produits source | agents/sourcing/agent.py |
| ScoringAgent | Score rentabilité 0-100 | agents/scoring/agent.py |
| CopywriterAgent | Génère contenu SEO | agents/copywriter/agent.py |
| PricingAgent | Calcule prix optimal | agents/pricing/agent.py |
| CustomerServiceAgent | SAV niveau 1 | agents/customer_service/agent.py |
| GrowthAgent | Analyse KPI hebdo | agents/growth/agent.py |

## Constitution IA (règles immuables)

Voir `agents/core/constitution.py` — s'applique à tous les agents.

## Stack

- **Frontend** : Next.js 14, React 18, TypeScript, Tailwind CSS, Stripe.js
- **Backend** : FastAPI, Pydantic v2, SQLAlchemy async, Alembic
- **IA** : OpenAI GPT-4o / Anthropic Claude (fallback configurable)
- **Async** : Celery + Redis
- **DB** : PostgreSQL 15
- **Infra** : Docker Compose, Nginx (reverse proxy SSL)
- **CI** : GitHub Actions

## Lancer en développement

```bash
# Démarrer les services (DB, Redis)
docker compose -f infrastructure/docker-compose.yml up postgres redis -d

# API
cd api && pip install -r requirements.txt
cp .env.example .env  # configurer les clés
uvicorn app.main:app --reload

# Frontend
cd frontend && npm install && npm run dev

# Agents (workers)
cd ..
celery -A agents.scheduler worker --loglevel=info
```

## Variables d'environnement

Voir `api/.env.example` pour toutes les clés requises.
