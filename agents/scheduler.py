"""
Scheduler Celery — tâches périodiques de l'agent IA.
Sources actives : Amazon · eBay · AliExpress · Zalando (selon .env)
"""
import asyncio
import logging

from celery import Celery
from celery.schedules import crontab

logger = logging.getLogger(__name__)

app = Celery("luma_agents", broker="redis://localhost:6379/0")

app.conf.beat_schedule = {
    # Actualisation prix/stock toutes les 30 minutes
    "refresh-pricing": {
        "task": "agents.tasks.refresh_all_pricing",
        "schedule": crontab(minute="*/30"),
    },
    # Pipeline sourcing toutes les heures (toutes sources)
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


@app.task(name="agents.tasks.refresh_all_pricing", bind=True, max_retries=3)
def refresh_all_pricing(self):
    """
    Recharge le prix optimal pour chaque listing actif en base.
    Utilise PricingAgent pour recalculer avec les données marché fraîches.
    """
    from agents.pricing.agent import PricingAgent
    from api.app.db.session import AsyncSessionLocal
    from sqlalchemy import select, text

    async def _run():
        async with AsyncSessionLocal() as db:
            rows = (await db.execute(
                text("""
                    SELECT p.id, o.source_price, o.shipping_cost
                    FROM products p
                    JOIN offers o ON o.product_id = p.id
                    WHERE p.status = 'published'
                """)
            )).fetchall()

        pricer = PricingAgent()
        updated = 0
        for row in rows:
            try:
                result = await pricer.run({
                    "source_price": float(row.source_price),
                    "shipping_cost": float(row.shipping_cost),
                    "fees_pct": 5,
                    "min_margin_pct": 15,
                })
                async with AsyncSessionLocal() as db:
                    await db.execute(
                        text("""
                            UPDATE listings
                            SET sale_price = :price
                            WHERE product_id = :pid
                        """),
                        {"price": result["sale_price"], "pid": str(row.id)},
                    )
                    await db.commit()
                updated += 1
            except Exception as exc:
                logger.error("[refresh_pricing] produit %s : %s", row.id, exc)

        logger.info("[refresh_pricing] %d listings mis à jour.", updated)

    try:
        asyncio.run(_run())
    except Exception as exc:
        logger.error("[refresh_pricing] Échec global : %s", exc)
        raise self.retry(exc=exc, countdown=120)


@app.task(name="agents.tasks.run_sourcing_pipeline", bind=True, max_retries=2)
def run_sourcing_pipeline(self):
    """
    Lance le pipeline complet multi-sources :
    Amazon · eBay · AliExpress · Zalando → Sourcing → Scoring → Copy → Pricing → DB
    """
    from agents.orchestrator import fetch_and_run_all_sources
    from api.app.config import settings
    from api.app.db.session import AsyncSessionLocal
    from api.app.services.product_service import ProductService
    from api.app.models.product import ProductCreate

    async def _run():
        ready_products = await fetch_and_run_all_sources(settings)
        if not ready_products:
            logger.info("[sourcing_pipeline] Aucun produit à publier.")
            return

        async with AsyncSessionLocal() as db:
            svc = ProductService(db)
            published = 0
            for p in ready_products:
                try:
                    product = await svc.create(ProductCreate(
                        title=p["title"],
                        brand=p.get("brand", ""),
                        source=p.get("source", "unknown"),
                        source_id=p.get("product_id", ""),
                        source_price=0.0,   # déjà pricé
                        shipping_cost=0.0,
                        images=p.get("images", []),
                        meta_description=p.get("meta_description", ""),
                        short_description=p.get("short_description", ""),
                        long_description=p.get("long_description", ""),
                        bullets=p.get("bullets", []),
                        affiliate_url=p.get("affiliate_url"),
                        sale_price=p["sale_price"],
                        score=p.get("score"),
                        risk_level=p.get("risk_level"),
                    ))
                    await svc.publish(product.id)
                    published += 1
                except Exception as exc:
                    logger.error("[sourcing_pipeline] Erreur save produit %s : %s",
                                 p.get("product_id"), exc)

        logger.info("[sourcing_pipeline] %d/%d produits publiés.", published, len(ready_products))

    try:
        asyncio.run(_run())
    except Exception as exc:
        logger.error("[sourcing_pipeline] Échec global : %s", exc)
        raise self.retry(exc=exc, countdown=300)


@app.task(name="agents.tasks.generate_growth_report", bind=True, max_retries=2)
def generate_growth_report(self):
    """
    Génère le rapport de croissance hebdomadaire via GrowthAgent.
    Lit les KPIs réels depuis la DB (commandes, revenus, top produits).
    """
    from agents.growth.agent import GrowthAgent
    from api.app.db.session import AsyncSessionLocal
    from sqlalchemy import text

    async def _run():
        async with AsyncSessionLocal() as db:
            kpis_row = (await db.execute(text("""
                SELECT
                    COUNT(o.id)                          AS total_orders,
                    COALESCE(SUM(o.total_amount), 0)     AS total_revenue,
                    COALESCE(AVG(o.total_amount), 0)     AS avg_order_value,
                    COUNT(DISTINCT o.customer_email)     AS unique_customers
                FROM orders o
                WHERE o.created_at >= NOW() - INTERVAL '7 days'
                  AND o.status != 'cancelled'
            """))).fetchone()

            top_products = (await db.execute(text("""
                SELECT p.title, SUM(oi.quantity) AS qty_sold
                FROM order_items oi
                JOIN products p ON p.id = oi.product_id
                JOIN orders o ON o.id = oi.order_id
                WHERE o.created_at >= NOW() - INTERVAL '7 days'
                  AND o.status != 'cancelled'
                GROUP BY p.id, p.title
                ORDER BY qty_sold DESC
                LIMIT 5
            """))).fetchall()

        kpis = {
            "total_orders": kpis_row.total_orders if kpis_row else 0,
            "total_revenue": float(kpis_row.total_revenue) if kpis_row else 0.0,
            "avg_order_value": float(kpis_row.avg_order_value) if kpis_row else 0.0,
            "unique_customers": kpis_row.unique_customers if kpis_row else 0,
            "top_products": [
                {"title": r.title, "qty_sold": r.qty_sold}
                for r in top_products
            ],
        }

        agent = GrowthAgent()
        report = await agent.run({"kpis": kpis, "period": "weekly"})
        logger.info("[growth_report] Rapport généré : %d actions recommandées.",
                    len(report.get("actions", [])))

    try:
        asyncio.run(_run())
    except Exception as exc:
        logger.error("[growth_report] Échec : %s", exc)
        raise self.retry(exc=exc, countdown=600)
