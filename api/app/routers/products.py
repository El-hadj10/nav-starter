from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.services.product_service import ProductService
from app.models.product import ProductCreate, ProductOut

router = APIRouter()


@router.get("/", response_model=list[ProductOut])
async def list_products(
    category: str | None = Query(None),
    limit: int = Query(24, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    return await ProductService(db).list_published(category=category, limit=limit, offset=offset)


@router.get("/{slug}", response_model=ProductOut)
async def get_product(slug: str, db: AsyncSession = Depends(get_db)):
    product = await ProductService(db).get_by_slug(slug)
    if not product:
        raise HTTPException(status_code=404, detail="Produit introuvable.")
    return product


@router.post("/", response_model=ProductOut, status_code=201)
async def create_product(payload: ProductCreate, db: AsyncSession = Depends(get_db)):
    return await ProductService(db).create(payload)
