import re
import uuid
from datetime import datetime, timezone
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models import Product, Offer, Listing
from app.models.product import ProductCreate, ProductOut


def _slugify(text: str) -> str:
    slug = text.lower().strip()
    slug = re.sub(r"[^\w\s-]", "", slug)
    slug = re.sub(r"[\s_-]+", "-", slug)
    return slug[:200]


class ProductService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_published(
        self, category: str | None = None, limit: int = 24, offset: int = 0
    ) -> list[ProductOut]:
        stmt = (
            select(Product, Listing)
            .join(Listing, Listing.product_id == Product.id)
            .where(Product.status == "published")
        )
        if category:
            stmt = stmt.where(Product.category == category)
        stmt = stmt.limit(limit).offset(offset)
        result = await self.db.execute(stmt)
        rows = result.all()
        return [self._to_out(p, l) for p, l in rows]

    async def get_by_slug(self, slug: str) -> ProductOut | None:
        stmt = (
            select(Product, Listing)
            .join(Listing, Listing.product_id == Product.id)
            .where(Product.slug == slug, Product.status == "published")
        )
        result = await self.db.execute(stmt)
        row = result.first()
        if not row:
            return None
        return self._to_out(row[0], row[1])

    async def create(self, payload: ProductCreate) -> ProductOut:
        base_slug = _slugify(payload.title)
        # Déduplication slug
        slug = base_slug
        exists = await self.db.execute(select(Product).where(Product.slug == slug))
        if exists.scalar_one_or_none():
            slug = f"{base_slug}-{str(uuid.uuid4())[:8]}"

        product = Product(
            slug=slug,
            source_id=payload.source_id,
            source=payload.source if hasattr(payload, "source") else "manual",
            title=payload.title,
            brand=payload.brand,
            category=payload.category,
            attributes=payload.attributes,
        )
        offer = Offer(
            supplier=getattr(payload, "source", "manual"),
            source_price=payload.source_price,
            shipping_cost=payload.shipping_cost,
            stock=payload.stock,
        )
        product.offers.append(offer)

        # Listing draft minimal
        listing = Listing(
            sale_price=round(payload.source_price * 1.20, 2),  # +20% par défaut
            margin_pct=20.0,
        )
        product.listing = listing

        self.db.add(product)
        await self.db.commit()
        await self.db.refresh(product)
        return self._to_out(product, product.listing)

    async def publish(self, product_id: str, listing_data: dict) -> None:
        """Met à jour le listing et publie le produit."""
        await self.db.execute(
            update(Listing)
            .where(Listing.product_id == product_id)
            .values(**listing_data, published_at=datetime.now(timezone.utc))
        )
        await self.db.execute(
            update(Product).where(Product.id == product_id).values(status="published")
        )
        await self.db.commit()

    def _to_out(self, product: Product, listing: Listing | None) -> ProductOut:
        return ProductOut(
            id=product.id,
            slug=product.slug,
            title=listing.title or product.title if listing else product.title,
            brand=product.brand,
            category=product.category,
            sale_price=float(listing.sale_price) if listing else 0,
            margin_pct=float(listing.margin_pct or 0) if listing else 0,
            stock_status="in_stock" if product.offers and product.offers[0].stock > 0 else "out_of_stock",
            images=listing.images if listing else [],
            short_description=listing.short_description or "" if listing else "",
            seo_score=listing.seo_score if listing else 0,
            published_at=listing.published_at if listing else None,
        )
