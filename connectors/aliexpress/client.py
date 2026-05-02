"""
Connecteur AliExpress Affiliate API.
"""
import hashlib
import hmac
import time
import httpx
from connectors.base import BaseConnector, NormalizedProduct
from typing import Any


class AliExpressConnector(BaseConnector):
    source_name = "aliexpress"
    BASE_URL = "https://gw.api.alibaba.com/openapi/param2/2/portals.open/api"

    def __init__(self, app_key: str, app_secret: str, tracking_id: str):
        self.app_key = app_key
        self.app_secret = app_secret
        self.tracking_id = tracking_id

    async def search_products(self, query: str, limit: int = 50) -> list[NormalizedProduct]:
        params = self._sign_params({
            "method": "aliexpress.affiliate.product.query",
            "keywords": query,
            "page_size": min(limit, 50),
            "tracking_id": self.tracking_id,
            "fields": "product_id,product_title,original_price,sale_price,product_main_image_url,shop_url,commission_rate",
        })
        response = await self._get(params)
        items = response.get("aliexpress_affiliate_product_query_response", {}) \
                        .get("resp_result", {}).get("result", {}).get("products", {}) \
                        .get("product", [])
        return [self.normalize(item) for item in items]

    async def get_product(self, product_id: str) -> NormalizedProduct | None:
        params = self._sign_params({
            "method": "aliexpress.affiliate.product.detail.get",
            "product_id": product_id,
            "tracking_id": self.tracking_id,
            "fields": "product_id,product_title,original_price,sale_price,product_main_image_url",
        })
        response = await self._get(params)
        item = response.get("aliexpress_affiliate_product_detail_get_response", {}) \
                       .get("resp_result", {}).get("result", {})
        return self.normalize(item) if item else None

    async def check_stock(self, product_id: str) -> dict[str, Any]:
        product = await self.get_product(product_id)
        return {
            "in_stock": bool(product and product.get("source_price", 0) > 0),
            "price": product.get("source_price") if product else None,
        }

    def normalize(self, raw: dict) -> NormalizedProduct:
        return NormalizedProduct({
            "id": str(raw.get("product_id")),
            "source_id": str(raw.get("product_id")),
            "title": raw.get("product_title", ""),
            "source_price": float(raw.get("sale_price", raw.get("original_price", 0))),
            "shipping_cost": 0.0,
            "stock": 1,
            "images": [raw.get("product_main_image_url", "")],
            "brand": None,
            "affiliate_url": raw.get("shop_url"),
            "commission_rate": raw.get("commission_rate"),
            "source": "aliexpress",
        })

    def _sign_params(self, params: dict) -> dict:
        params["app_key"] = self.app_key
        params["timestamp"] = str(int(time.time() * 1000))
        params["sign_method"] = "hmac"
        sorted_params = "".join(f"{k}{v}" for k, v in sorted(params.items()))
        signature = hmac.new(
            self.app_secret.encode("utf-8"),
            sorted_params.encode("utf-8"),
            hashlib.md5,
        ).hexdigest().upper()
        params["sign"] = signature
        return params

    async def _get(self, params: dict) -> dict:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(self.BASE_URL, params=params)
            resp.raise_for_status()
            return resp.json()
