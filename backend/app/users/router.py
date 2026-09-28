from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.movies.models import DimMovie, MovieReview
from app.users.dependencies import get_current_user
from app.users.models import User

from app.users.schemas import (
    TokenResponse,
    UserCreate,
    UserLogin,
    UserResponse,
)

from app.users.security import (
    create_access_token,
    hash_password,
    verify_password,
)

# Rota de autenticação
router = APIRouter(
    prefix="/auth",
    tags=["Autenticação"],
)

# Rota de registro de usuário
@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
async def register(
    data: UserCreate,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(User).where(
            or_(
                User.email == data.email,
                User.username == data.username,
            )
        )
    )

    existing_user = result.scalar_one_or_none()

    if existing_user:
        raise HTTPException(
            status_code=409,
            detail="E-mail ou nome de usuário já cadastrado.",
        )

    user = User(
        username=data.username,
        email=data.email,
        password_hash=hash_password(data.password),
        is_admin=False,
    )

    db.add(user)

    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=409,
            detail="E-mail ou nome de usuário já cadastrado.",
        )

    await db.refresh(user)

    return user

# Rota de login de usuário
@router.post(
    "/login",
    response_model=TokenResponse,
)
async def login(
    data: UserLogin,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(User).where(User.email == data.email)
    )

    user = result.scalar_one_or_none()

    if user is None or not verify_password(
        data.password,
        user.password_hash,
    ):
        raise HTTPException(
            status_code=401,
            detail="E-mail ou senha incorretos.",
        )

    return TokenResponse(
        access_token=create_access_token(user.id),
    )

# Rota para obter informações do usuário autenticado
@router.get(
    "/me",
    response_model=UserResponse,
)
async def get_me(
    current_user: User = Depends(get_current_user),
):
    return current_user


# Dados de uma avaliação exibida no histórico do usuário.
class MyReviewOut(BaseModel):
    review_id: str
    movie_id: str
    titulo: str
    url_poster: str | None
    ano_lancamento: int | None
    nota: float
    comentario: str
    created_at: datetime

# Retorna as avaliações do usuário autenticado.
@router.get(
    "/me/reviews",
    response_model=list[MyReviewOut],
)
async def get_my_reviews(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(MovieReview, DimMovie)
        .join(
            DimMovie,
            MovieReview.sk_movie_id == DimMovie.sk_movie_id,
        )
        .where(MovieReview.user_id == current_user.id)
        .order_by(MovieReview.created_at.desc())
    )

    rows = result.all()

    return [
        MyReviewOut(
            review_id=review.sk_movie_review_id,
            movie_id=movie.sk_movie_id,
            titulo=movie.titulo,
            url_poster=movie.url_poster,
            ano_lancamento=movie.ano_lancamento,
            nota=review.nota / 2,
            comentario=review.comentario,
            created_at=review.created_at,
        )
        for review, movie in rows
    ]

# Retorna as avaliações do usuário autenticado.
@router.get(
    "/me/reviews",
    response_model=list[MyReviewOut],
)
async def get_my_reviews(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(MovieReview, DimMovie)
        .join(
            DimMovie,
            MovieReview.sk_movie_id == DimMovie.sk_movie_id,
        )
        .where(MovieReview.user_id == current_user.id)
        .order_by(
            MovieReview.created_at.desc(),
            MovieReview.sk_movie_review_id.desc(),
        )
    )

    return [
        MyReviewOut(
            review_id=review.sk_movie_review_id,
            movie_id=movie.sk_movie_id,
            titulo=movie.titulo,
            url_poster=movie.url_poster,
            ano_lancamento=movie.ano_lancamento,
            nota=review.nota / 2,
            comentario=review.comentario,
            created_at=review.created_at,
        )
        for review, movie in result.all()
    ]
