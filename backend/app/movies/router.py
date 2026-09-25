
from math import ceil

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.movies.models import DimMovie
from app.movies.schemas import MovieOut, PaginatedMovies, MovieDetail, PersonOut


router = APIRouter()

# Lista filmes com pesquisa por título e paginação.

@router.get("", response_model=PaginatedMovies)
async def list_movies(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    search: str | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
):

    query = select(DimMovie)

    if search and search.strip():
        query = query.where(
            DimMovie.titulo.ilike(f"%{search.strip()}%")
        )

    count_query = select(func.count()).select_from(
        query.order_by(None).subquery()
    )

    total = (await db.execute(count_query)).scalar_one()

    query = (
        query
        .order_by(DimMovie.titulo, DimMovie.sk_movie_id)
        .offset((page - 1) * page_size)
        .limit(page_size)
    )

    result = await db.execute(query)
    movies = result.scalars().all()

    return PaginatedMovies(
        items=[
            MovieOut.model_validate(movie)
            for movie in movies
        ],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=ceil(total / page_size),
    )

# Busca o filme e carrega seus relacionamentos.
@router.get("/{movie_id}", response_model=MovieDetail)
async def get_movie(
    movie_id: str,
    db: AsyncSession = Depends(get_db),
):
    query = (
        select(DimMovie)
        .options(
            selectinload(DimMovie.genres), # Carregando relacionaments de forma explícita
            selectinload(DimMovie.companies),
            selectinload(DimMovie.people),
        )
        .where(DimMovie.sk_movie_id == movie_id)
    )

    result = await db.execute(query)
    movie = result.scalar_one_or_none()

    # Retorna 404 quando o filme não existe.
    if movie is None:
        raise HTTPException(
            status_code = 404,
            detail = "Filme não encontrado",
        )

    # Converte os dados do banco para o formato da API.
    detail = MovieOut.model_validate(movie).model_dump()

    return MovieDetail(
        **detail,
        genres=[
            genre.nome_genero
            for genre in movie.genres
        ],
        companies=[
            company.nome_produtora
            for company in movie.companies
        ],
        people=[
            PersonOut.model_validate(person)
            for person in movie.people
        ],
    )
