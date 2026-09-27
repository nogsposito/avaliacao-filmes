
import jwt
from fastapi import Depends, HTTPException
from fastapi.security import (
    HTTPAuthorizationCredentials,
    HTTPBearer,
)
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.users.models import User
from app.users.security import ALGORITHM, SECRET_KEY

bearer_scheme = HTTPBearer(auto_error=False)

# Função de dependência para obter o usuário autenticado a partir do token JWT
async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(
        bearer_scheme
    ),
    db: AsyncSession = Depends(get_db),
) -> User:
    unauthorized = HTTPException(
        status_code=401,
        detail="Token inválido ou expirado.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if credentials is None:
        raise unauthorized

    try:
        payload = jwt.decode(
            credentials.credentials,
            SECRET_KEY,
            algorithms=[ALGORITHM],
        )

        user_id = payload.get("sub")

        if not isinstance(user_id, str):
            raise unauthorized

    except jwt.InvalidTokenError:
        raise unauthorized

    user = await db.get(User, user_id)

    if user is None:
        raise unauthorized

    return user
