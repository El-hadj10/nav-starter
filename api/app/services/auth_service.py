from datetime import datetime, timedelta, timezone
from typing import Any
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Utilisateurs en mémoire pour le MVP (à remplacer par DB)
_USERS: dict[str, dict] = {}


def create_access_token(data: dict[str, Any], expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=60))
    to_encode["exp"] = expire
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str) -> dict[str, Any] | None:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None


class AuthService:
    @staticmethod
    async def authenticate(username: str, password: str) -> dict | None:
        user = _USERS.get(username)
        if not user:
            return None
        if not pwd_context.verify(password, user["hashed_password"]):
            return None
        return user

    @staticmethod
    def register(username: str, password: str, role: str = "admin") -> dict:
        hashed = pwd_context.hash(password)
        user = {"id": username, "username": username, "hashed_password": hashed, "role": role}
        _USERS[username] = user
        return user
