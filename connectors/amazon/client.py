"""
Connecteur Amazon Product Advertising API (PA-API 5.0).
Nécessite un compte Amazon Associates actif.
"""
import httpx
import hmac
import hashlib
import json
from datetime import datetime, timezone
from typing import Any
from connectors.base import BaseConnector, NormalizedProduct


class AmazonConnector(BaseConnector):
    source_name = "amazon"
    BASE_URL = "https://webservices.amazon.fr/paapi5"

    def __init__(self, access_key: str, secret_key: str, partner_tag: str, region: str = "eu-west-1"):
        self.access_key = access_key
        self.secret_key = secret_key
        self.partner_tag = partner_tag
        self.region = region

    async def search_products(self, query: str, limit: int = 50) -> list[NormalizedProduct]:
        payload = {
            "Keywords": query,
            "PartnerTag": self.partner_tag,
            "PartnerType": "Associates",
            "Marketplace": "www.amazon.fr",
            "Resources": [
                "Images.Primary.Large",
                "ItemInfo.Title",
                "Offers.Listings.Price",
                "ItemInfo.Features",
            ],
            "ItemCount": min(limit, 10),  # PA-API max 10 par requête
        }
        response = await self._post("/searchitems", payload)
        items = response.get("SearchResult", {}).get("Items", [])
        return [self.normalize(item) for item in items]

    async def get_product(self, product_id: str) -> NormalizedProduct | None:
        payload = {
            "ItemIds": [product_id],
            "PartnerTag": self.partner_tag,
            "PartnerType": "Associates",
            "Marketplace": "www.amazon.fr",
            "Resources": [
                "Images.Primary.Large",
                "ItemInfo.Title",
                "Offers.Listings.Price",
                "ItemInfo.Features",
                "ItemInfo.ProductInfo",
            ],
        }
        response = await self._post("/getitems", payload)
        items = response.get("ItemsResult", {}).get("Items", [])
        return self.normalize(items[0]) if items else None

    async def check_stock(self, product_id: str) -> dict[str, Any]:
        product = await self.get_product(product_id)
        if not product:
            return {"in_stock": False, "price": None}
        return {
            "in_stock": product.get("stock", 0) > 0,
            "price": product.get("source_price"),
        }

    def normalize(self, raw: dict) -> NormalizedProduct:
        listings = raw.get("Offers", {}).get("Listings", [])
        price = listings[0].get("Price", {}).get("Amount", 0) if listings else 0
        images = [raw.get("Images", {}).get("Primary", {}).get("Large", {}).get("URL", "")]
        return NormalizedProduct({
            "id": raw.get("ASIN"),
            "source_id": raw.get("ASIN"),
            "title": raw.get("ItemInfo", {}).get("Title", {}).get("DisplayValue", ""),
            "source_price": float(price),
            "shipping_cost": 0.0,  # Inclus dans le prix Amazon
            "stock": 1 if price > 0 else 0,
            "images": [img for img in images if img],
            "brand": raw.get("ItemInfo", {}).get("ByLineInfo", {}).get("Brand", {}).get("DisplayValue"),
            "affiliate_url": raw.get("DetailPageURL"),
            "source": "amazon",
        })

    async def _post(self, endpoint: str, payload: dict) -> dict:
        """Appel signé PA-API 5.0 (HMAC-SHA256)."""
        url = f"{self.BASE_URL}{endpoint}"
        body = json.dumps(payload)
        # TODO: implémenter la signature AWS SigV4 complète
        headers = {
            "Content-Type": "application/json; charset=utf-8",
            "x-amz-access-token": self.access_key,
        }
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(url, content=body, headers=headers)
            resp.raise_for_status()
            return resp.json()
