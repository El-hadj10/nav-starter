from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import products, orders, pricing, auth, webhooks
from app.config import settings

app = FastAPI(
    title="Luma API",
    version="0.1.0",
    description="Backend orchestrateur pour la plateforme e-commerce Luma.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(products.router, prefix="/products", tags=["products"])
app.include_router(orders.router, prefix="/orders", tags=["orders"])
app.include_router(pricing.router, prefix="/pricing", tags=["pricing"])
app.include_router(webhooks.router, prefix="/webhooks", tags=["webhooks"])


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "luma-api"}
