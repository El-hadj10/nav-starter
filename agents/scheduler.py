"""
Scheduler Celery — tâches périodiques de l'agent IA.
"""
from celery import Celery
from celery.schedules import crontab

app = Celery("luma_agents", broker="redis://localhost:6379/0")

app.conf.beat_schedule = {
    # Actualisation prix/stock toutes les 30 minutes
    "refresh-pricing": {
        "task": "agents.tasks.refresh_all_pricing",
        "schedule": crontab(minute="*/30"),
    },
    # Pipeline sourcing toutes les heures
    "sourcing-pipeline": {
        "task": "agents.tasks.run_sourcing_pipeline",
        "schedule": crontab(minute=0),
    },
    # Rapport croissance hebdomadaire (lundi 8h)
    "weekly-growth-report": {
        "task": "agents.tasks.generate_growth_report",
        "schedule": crontab(hour=8, minute=0, day_of_week=1),
    },
}


@app.task(name="agents.tasks.refresh_all_pricing")
def refresh_all_pricing():
    import asyncio
    from agents.pricing.agent import PricingAgent
    # TODO: fetch active listings from DB and refresh prices
    pass


@app.task(name="agents.tasks.run_sourcing_pipeline")
def run_sourcing_pipeline():
    import asyncio
    from agents.orchestrator import run_ingestion_pipeline
    # TODO: fetch raw products from active connectors
    pass


@app.task(name="agents.tasks.generate_growth_report")
def generate_growth_report():
    import asyncio
    from agents.growth.agent import GrowthAgent
    # TODO: fetch weekly KPIs from DB
    pass
