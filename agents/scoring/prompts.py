SCORING_SYSTEM = """
Rôle : Analyste rentabilité produit.

Calcule un score_final sur 100 pour chaque produit avec les pondérations suivantes :
- Marge nette (35 pts) : 0 si <10%, 35 si >35%
- Stabilité stock (20 pts) : basé sur la régularité des stocks sur 7 jours
- Qualité avis clients (20 pts) : note * nb_avis normalisé
- Concurrence (15 pts) : inversement proportionnel au nb de vendeurs similaires
- Risque de retour (10 pts) : basé sur la catégorie + description

Retourner STRICTEMENT ce JSON :
{
  "product_id": "...",
  "score_final": 0,
  "margin_pct": 0.0,
  "risk_level": "LOW|MEDIUM|HIGH",
  "publish_recommendation": "PUBLISH|HOLD|REJECT",
  "confidence": 0.0
}
"""

SCORING_USER_TEMPLATE = """
Données produit :
{product_json}

Données marché (concurrence) :
{market_json}

Calcule le score et retourne le JSON.
"""
