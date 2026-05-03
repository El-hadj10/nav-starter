"""
Interface abstraite pour tous les connecteurs marchands.
Chaque connecteur doit implémenter cette interface.
"""
from abc import ABC, abstractmethod
from typing import Any


class NormalizedProduct(dict):
    """
    Schéma normalisé interne.
    Tous les connecteurs doivent retourner ce format.
    """
    required_fields = ["id", "title", "source_price", "shipping_cost", "stock", "images"]


class BaseConnector(ABC):
    source_name: str = "unknown"

    @abstractmethod
    async def search_products(self, query: str, limit: int = 50) -> list[NormalizedProduct]:
        """Cherche des produits par mot-clé."""

    @abstractmethod
    async def get_product(self, product_id: str) -> NormalizedProduct | None:
        """Récupère un produit par son ID source."""

    @abstractmethod
    async def check_stock(self, product_id: str) -> dict[str, Any]:
        """Vérifie le stock et le prix en temps réel."""

    def normalize(self, raw: dict) -> NormalizedProduct:
        """Convertit les données brutes vers le schéma normalisé."""
        raise NotImplementedError
