"""
Connecteur eBay Partner Network + Browse API.
"""
import httpx
from connectors.base import BaseConnector, NormalizedProduct
from typing import Any


class EbayConnector(BaseConnector):
    source_name = "ebay"
    BASE_URL = "https://api.ebay.com"

    def __init__(self, oauth_token: str, campaign_id: str):
        self.oauth_token = oauth_token
        self.campaign_id = campaign_id  # eBay Partner Network campaign

    async def search_products(self, query: str, limit: int = 50) -> list[NormalizedProduct]:
        params = {
            "q": query,
            "limit": min(limit, 200),
            "filter": "conditionIds:{1000}",  # Neuf uniquement
        }
        response = await self._get("/buy/browse/v1/item_summary/search", params)
        items = response.get("itemSummaries", [])
        return [self.normalize(item) for item in items]

    async def get_product(self, product_id: str) -> NormalizedProduct | None:
        response = await self._get(f"/buy/browse/v1/item/{product_id}", {})
        return self.normalize(response) if response else None

    async def check_stock(self, product_id: str) -> dict[str, Any]:
        product = await self.get_product(product_id)
        if not product:
            return {"in_stock": False, "price": None}
        return {
            "in_stock": product.get("stock", 0) > 0,
            "price": product.get("source_price"),
        }

    def normalize(self, raw: dict) -> NormalizedProduct:
        price_value = float(
            raw.get("price", {}).get("value", 0)
            or raw.get("currentBidPrice", {}).get("value", 0)
        )
        images = [raw.get("image", {}).get("imageUrl", "")] if raw.get("image") else []
        thumbnails = [t.get("imageUrl", "") for t in raw.get("additionalImages", [])]
        return NormalizedProduct({
            "id": raw.get("itemId"),
            "source_id": raw.get("itemId"),
            "title": raw.get("title", ""),
            "source_price": price_value,
            "shipping_cost": float(
                raw.get("shippingOptions", [{}])[0].get("shippingCost", {}).get("value", 0)
                if raw.get("shippingOptions") else 0
            ),
            "stock": 1 if raw.get("buyingOptions", []) else 0,
            "images": [img for img in images + thumbnails if img],
            "brand": raw.get("brand"),
            "affiliate_url": raw.get("itemAffiliateWebUrl", raw.get("itemWebUrl")),
            "source": "ebay",
        })

    async def _get(self, endpoint: str, params: dict) -> dict:
        url = f"{self.BASE_URL}{endpoint}"
        headers = {
            "Authorization": f"Bearer {self.oauth_token}",
            "Content-Type": "application/json",
            "X-EBAY-C-MARKETPLACE-ID": "EBAY_FR",
        }
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(url, params=params, headers=headers)
            resp.raise_for_status()
            return resp.json()
