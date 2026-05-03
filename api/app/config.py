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

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
