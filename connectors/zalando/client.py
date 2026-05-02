"""
Connecteur Zalando — API Partenaire privée (OAuth2 Client Credentials).

Accès via le programme partenaire Zalando :
→ https://developers.zalando.com/
→ Audience : retailers / marques / comparateurs price

Flux OAuth2 :
  POST https://api.zalando.com/oauth2/token
  → grant_type=client_credentials
  → client_id / client_secret (fournis par Zalando Partner)

Catalog API :
  GET https://api.zalando.com/articles
  GET https://api.zalando.com/articles/{id}
  Paramètre locale : language=de|fr|en …

Le token est mis en cache en mémoire (TTL 3600s).
"""
import time
import httpx
from typing import Any

from connectors.base import BaseConnector, NormalizedProduct


class ZalandoConnector(BaseConnector):
    source_name = "zalando"

    # Endpoints officiels Zalando Partner API
    AUTH_URL = "https://api.zalando.com/oauth2/token"
    BASE_URL = "https://api.zalando.com"

    # Paramètres de localisation France
    DEFAULT_LANGUAGE = "fr"
    DEFAULT_CURRENCY = "EUR"

    def __init__(self, client_id: str, client_secret: str, language: str = DEFAULT_LANGUAGE):
        self.client_id = client_id
        self.client_secret = client_secret
        self.language = language

        # Cache token en mémoire
        self._access_token: str | None = None
        self._token_expires_at: float = 0.0

    # ------------------------------------------------------------------ #
    # Auth                                                                 #
    # ------------------------------------------------------------------ #

    async def _ensure_token(self) -> str:
        """Récupère ou renouvelle le token OAuth2 (TTL 3600s)."""
        now = time.time()
        if self._access_token and now < self._token_expires_at - 60:
            return self._access_token

        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(
                self.AUTH_URL,
                data={
                    "grant_type": "client_credentials",
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                },
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )
            resp.raise_for_status()
            payload = resp.json()

        self._access_token = payload["access_token"]
        self._token_expires_at = now + payload.get("expires_in", 3600)
        return self._access_token

    # ------------------------------------------------------------------ #
    # Interface BaseConnector                                              #
    # ------------------------------------------------------------------ #

    async def search_products(self, query: str, limit: int = 50) -> list[NormalizedProduct]:
        """
        Cherche des articles via la Catalog API Zalando.
        Filtre : articles actifs, langue FR, triés par pertinence.
        """
        params = {
            "query": query,
            "pageSize": min(limit, 100),
            "language": self.language,
            "currency": self.DEFAULT_CURRENCY,
            # Exclure les articles sans image ni prix
            "fields": (
                "content.id,content.name,content.brand.name,"
                "content.units,content.media.images,"
                "content.categoryKeys,content.modelId,"
                "content.supplierArticleId"
            ),
        }
        response = await self._get("/articles", params)
        articles = response.get("content", [])
        return [self.normalize(a) for a in articles if self._has_price(a)]

    async def get_product(self, product_id: str) -> NormalizedProduct | None:
        """Récupère un article par son ID Zalando."""
        try:
            response = await self._get(f"/articles/{product_id}", {
                "language": self.language,
                "currency": self.DEFAULT_CURRENCY,
            })
            return self.normalize(response) if response else None
        except httpx.HTTPStatusError as exc:
            if exc.response.status_code == 404:
                return None
            raise

    async def check_stock(self, product_id: str) -> dict[str, Any]:
        """
        Vérifie la disponibilité en temps réel.
        Zalando expose les tailles/unités disponibles dans chaque article.
        """
        product = await self.get_product(product_id)
        if not product:
            return {"in_stock": False, "price": None, "available_sizes": []}

        return {
            "in_stock": product.get("stock", 0) > 0,
            "price": product.get("source_price"),
            "available_sizes": product.get("available_sizes", []),
        }

    def normalize(self, raw: dict) -> NormalizedProduct:
        """
        Normalise un article Zalando vers NormalizedProduct.

        Structure Zalando :
          raw["units"]      → liste des tailles avec prix et stock
          raw["media"]      → images
          raw["brand"]      → {name}
        """
        units = raw.get("units", [])
        available_units = [u for u in units if u.get("available", False)]

        # Prix : prendre le minimum parmi les unités disponibles
        prices = [
            float(u.get("price", {}).get("value", 0))
            for u in (available_units or units)
            if u.get("price", {}).get("value")
        ]
        source_price = min(prices) if prices else 0.0

        # Images
        media = raw.get("media", {})
        images = [
            img.get("largeUrl") or img.get("mediumUrl") or img.get("smallUrl", "")
            for img in media.get("images", [])
            if img.get("largeUrl") or img.get("mediumUrl")
        ]

        # Tailles disponibles (utile pour le SAV / agent scoring)
        available_sizes = [
            u.get("size", "")
            for u in available_units
            if u.get("size")
        ]

        # URL affilié — si programme Awin/Zanox actif, Zalando injecte
        # des tracking links dans le champ "shopUrl" des unités.
        affiliate_url = (
            available_units[0].get("shopUrl") if available_units
            else units[0].get("shopUrl") if units
            else None
        )

        return NormalizedProduct({
            "id": raw.get("id"),
            "source_id": raw.get("id"),
            "title": raw.get("name", ""),
            "brand": raw.get("brand", {}).get("name", ""),
            "source_price": source_price,
            "shipping_cost": 0.0,      # Zalando : livraison gratuite FR
            "stock": len(available_units),
            "images": [img for img in images if img],
            "available_sizes": available_sizes,
            "categories": raw.get("categoryKeys", []),
            "model_id": raw.get("modelId"),
            "affiliate_url": affiliate_url,
            "source": "zalando",
        })

    # ------------------------------------------------------------------ #
    # HTTP helpers                                                         #
    # ------------------------------------------------------------------ #

    async def _get(self, endpoint: str, params: dict) -> dict:
        token = await self._ensure_token()
        url = f"{self.BASE_URL}{endpoint}"
        headers = {
            "Authorization": f"Bearer {token}",
            "Accept": "application/json",
            "Accept-Language": f"{self.language}-FR",
        }
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(url, params=params, headers=headers)
            resp.raise_for_status()
            return resp.json()

    # ------------------------------------------------------------------ #
    # Helpers privés                                                       #
    # ------------------------------------------------------------------ #

    @staticmethod
    def _has_price(raw: dict) -> bool:
        """Élimine les articles sans aucun prix renseigné."""
        units = raw.get("units", [])
        return any(u.get("price", {}).get("value") for u in units)
