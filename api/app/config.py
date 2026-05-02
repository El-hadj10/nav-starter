from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    APP_NAME: str = "Luma API"
    DEBUG: bool = False

    DATABASE_URL: str = "postgresql+asyncpg://luma:luma@localhost:5432/luma_db"
    REDIS_URL: str = "redis://localhost:6379/0"

    SECRET_KEY: str = "change-me-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    CORS_ORIGINS: List[str] = ["http://localhost:3000"]

    OPENAI_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""

    STRIPE_SECRET_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""

    MIN_MARGIN_PCT: float = 15.0
    MIN_PRODUCT_RATING: float = 4.2

    # Connecteurs marchands
    AMAZON_ACCESS_KEY: str = ""
    AMAZON_SECRET_KEY: str = ""
    AMAZON_PARTNER_TAG: str = ""
    EBAY_OAUTH_TOKEN: str = ""
    EBAY_CAMPAIGN_ID: str = ""
    ALIEXPRESS_APP_KEY: str = ""
    ALIEXPRESS_APP_SECRET: str = ""
    ZALANDO_CLIENT_ID: str = ""
    ZALANDO_CLIENT_SECRET: str = ""
    ZALANDO_LANGUAGE: str = "fr"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
