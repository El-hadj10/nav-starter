"""
Orchestrateur principal — pipeline de publication automatique.
Chaîne : Sourcing → Compliance → Scoring → Copywriter → Pricing → Publication
"""
import asyncio
import logging
from typing import Any
from agents.sourcing.agent import SourcingAgent
from agents.scoring.agent import ScoringAgent
from agents.copywriter.agent import CopywriterAgent
from agents.pricing.agent import PricingAgent

logger = logging.getLogger(__name__)

PUBLISH_SCORE_THRESHOLD = 65


async def run_ingestion_pipeline(source_name: str, raw_products: list[dict]) -> list[dict]:
    """
    Pipeline complet pour ingérer et publier des produits.
    Retourne la liste des produits prêts à publier.
    """
    ready_products = []

    # Étape 1 : Sourcing & filtrage
    sourcing = SourcingAgent()
    sourcing_result = await sourcing.run({
        "source_name": source_name,
        "products": raw_products,
        "min_margin_pct": 15.0,
    })
    accepted_ids = set(sourcing_result.get("accepted", []))
    logger.info("[Orchestrator] %d/%d produits acceptés au sourcing.", len(accepted_ids), len(raw_products))

    accepted_products = [p for p in raw_products if p.get("id") in accepted_ids]

    # Étapes 2-4 : Scoring + Copywriter + Pricing en parallèle par produit
    tasks = [_process_single_product(p) for p in accepted_products]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    for result in results:
        if isinstance(result, Exception):
            logger.error("[Orchestrator] Erreur produit : %s", result)
            continue
        if result:
            ready_products.append(result)

    logger.info("[Orchestrator] %d produits prêts à publier.", len(ready_products))
    return ready_products


async def _process_single_product(product: dict[str, Any]) -> dict[str, Any] | None:
    scorer = ScoringAgent()
    copywriter = CopywriterAgent()
    pricer = PricingAgent()

    # Scoring
    score_result = await scorer.run({"product": product, "market": {}})
    if score_result.get("publish_recommendation") == "REJECT":
        return None
    if score_result.get("score_final", 0) < PUBLISH_SCORE_THRESHOLD:
        logger.info("[Orchestrator] Produit %s trop faible (score=%d), mis en attente.",
                    product.get("id"), score_result.get("score_final"))
        return None

    # Copywriter & Pricing en parallèle
    copy_task = copywriter.run({"product": product, "keywords": []})
    price_task = pricer.run({
        "source_price": product.get("source_price", 0),
        "shipping_cost": product.get("shipping_cost", 0),
        "fees_pct": 5,
        "min_margin_pct": 15,
    })
    copy_result, price_result = await asyncio.gather(copy_task, price_task)

    return {
        "product_id": product.get("id"),
        "title": copy_result.get("title"),
        "meta_description": copy_result.get("meta_description"),
        "short_description": copy_result.get("short_description"),
        "long_description": copy_result.get("long_description"),
        "bullets": copy_result.get("bullets"),
        "sale_price": price_result.get("sale_price"),
        "margin_pct": price_result.get("expected_margin_pct"),
        "score": score_result.get("score_final"),
        "risk_level": score_result.get("risk_level"),
    }
