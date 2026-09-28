from datetime import datetime
from math import ceil
from uuid import uuid4

from app import db
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from pydantic import BaseModel

from app.users.dependencies import get_current_user
from app.users.models import User

from app.db.session import get_db
from app.movies.models import (
    DimGenre,
    DimMovie,
    DimPerson,
    MovieReview,
    MovieWatch,
)

from app.movies.schemas import (
    MovieCreate,
    MovieDetail,
    MovieOut,
    MovieReviewsOut,
    MovieUpdate,
    MovieWatchOut,
    MyMovieOut,
    PaginatedMovies,
    PersonOut,
    RecentReviewOut,
    ReviewCreate,
    ReviewOut,
)

router = APIRouter()

# Lista filmes com pesquisa por título e paginação.

@router.get("", response_model=PaginatedMovies)
async def list_movies(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    search: str | None = Query(default=None),
    seed: int | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
):

    query = select(DimMovie)

    query = query.where(
        DimMovie.url_poster.is_not(None),
        DimMovie.url_poster != "",
    )  

    if search and search.strip():
        query = query.where(
            DimMovie.titulo.ilike(f"%{search.strip()}%")
        )

    count_query = select(func.count()).select_from(
        query.order_by(None).subquery()
    )

    total = (await db.execute(count_query)).scalar_one()

    if seed is not None and not search:
        query = query.order_by(
            DimMovie.url_poster.is_(None),
            DimMovie.url_poster == "",
            func.abs(
                func.random() + seed
            )
        )
    else:
        query = query.order_by(
            DimMovie.titulo,
            DimMovie.sk_movie_id,
        )

    query = (
        query
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

# Retorna uma seleção variada de filmes para a tela inicial.
@router.get("/featured", response_model=list[MovieOut])
async def get_featured_movies(
    limit: int = Query(default=6, ge=1, le=12),
    db: AsyncSession = Depends(get_db),
):
    # Seleciona primeiro um conjunto de filmes recentes.
    result = await db.execute(
        select(DimMovie)
        .where(
            DimMovie.url_poster.is_not(None),
            DimMovie.url_poster != "",
        )
        .limit(30)
    )

    candidates = list(result.scalars().all())

    if len(candidates) <= limit:
        selected = candidates
    else:
        # A escolha varia a cada carregamento,
        # mas não interfere na paginação do catálogo.
        import random

        selected = random.sample(candidates, limit)

    return [
        MovieOut.model_validate(movie)
        for movie in selected
    ]

# Retorna avaliações recentes para exibição na tela inicial.
@router.get(
    "/recent-reviews",
    response_model=list[RecentReviewOut],
)
async def get_recent_reviews(
    limit: int = Query(default=6, ge=1, le=12),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(MovieReview, DimMovie)
        .join(
            DimMovie,
            MovieReview.sk_movie_id == DimMovie.sk_movie_id,
        )
        .where(
            DimMovie.url_poster.is_not(None),
            DimMovie.url_poster != "",
        )
        .order_by(MovieReview.created_at.desc())
        .limit(limit)
    )

    rows = result.all()

    return [
        RecentReviewOut(
            sk_movie_review_id=review.sk_movie_review_id,
            sk_movie_id=review.sk_movie_id,
            nome=review.nome,
            nota=review.nota / 2,
            comentario=review.comentario,
            created_at=review.created_at,
            titulo=movie.titulo,
            url_poster=movie.url_poster,
        )
        for review, movie in rows
    ]

# Retorna os filmes assistidos pelo usuário autenticado, incluindo detalhes do filme e avaliações.
@router.get(
    "/my-movies",
    response_model=list[MyMovieOut],
)
async def get_my_movies(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(MovieWatch, DimMovie)
        .join(
            DimMovie,
            MovieWatch.sk_movie_id == DimMovie.sk_movie_id,
        )
        .where(
            MovieWatch.user_id == current_user.id,
        )
        .order_by(MovieWatch.watched_at.desc())
    )

    rows = result.all()
    movies = []

    for watch, movie in rows:
        review_result = await db.execute(
            select(MovieReview).where(
                MovieReview.sk_movie_id == movie.sk_movie_id,
                MovieReview.user_id == current_user.id,
            )
        )

        review = review_result.scalar_one_or_none()

        movies.append(
            MyMovieOut(
                movie_id=movie.sk_movie_id,
                titulo=movie.titulo,
                url_poster=movie.url_poster,
                ano_lancamento=movie.ano_lancamento,
                watched_at=watch.watched_at,
                nota=review.nota / 2 if review else None,
                comentario=review.comentario if review else None,
            )
        )

    return movies

# Retorna o status de assistido de um filme para o usuário autenticado.
@router.get(
    "/{movie_id}/watch",
)
async def get_movie_watch_status(
    movie_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(MovieWatch).where(
            MovieWatch.sk_movie_id == movie_id,
            MovieWatch.user_id == current_user.id,
        )
    )

    watch = result.scalar_one_or_none()

    return {
        "watched": watch is not None
    }

# Marca um filme como assistido pelo usuário autenticado.
@router.post(
    "/{movie_id}/watch",
    response_model=MovieWatchOut,
)
async def mark_movie_as_watched(
    movie_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    movie = await db.get(DimMovie, movie_id)

    if movie is None:
        raise HTTPException(
            status_code=404,
            detail="Filme não encontrado.",
        )

    result = await db.execute(
        select(MovieWatch).where(
            MovieWatch.sk_movie_id == movie_id,
            MovieWatch.user_id == current_user.id,
        )
    )

    existing_watch = result.scalar_one_or_none()

    if existing_watch:
        return existing_watch

    watch = MovieWatch(
        sk_movie_id=movie_id,
        user_id=current_user.id,
    )

    db.add(watch)
    await db.commit()
    await db.refresh(watch)

    return watch

# Desmarca um filme como assistido pelo usuário autenticado.
@router.delete(
    "/{movie_id}/watch",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def unmark_movie_as_watched(
    movie_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(MovieWatch).where(
            MovieWatch.sk_movie_id == movie_id,
            MovieWatch.user_id == current_user.id,
        )
    )

    watch = result.scalar_one_or_none()

    if watch is None:
        raise HTTPException(
            status_code=404,
            detail="Filme não está marcado como assistido.",
        )

    await db.delete(watch)
    await db.commit()

# Busca o filme e carrega seus relacionamentos.
@router.get("/{movie_id}", response_model=MovieDetail)
async def get_movie(
    movie_id: str,
    db: AsyncSession = Depends(get_db),
):
    # Busca o filme com todos os relacionamentos necessários.
    result = await db.execute(
        select(DimMovie)
        .options(
            selectinload(DimMovie.genres),
            selectinload(DimMovie.companies),
            selectinload(DimMovie.people),
            selectinload(DimMovie.reviews),
        )
        .where(DimMovie.sk_movie_id == movie_id)
    )

    movie = result.scalar_one_or_none()

    if movie is None:
        raise HTTPException(
            status_code=404,
            detail="Filme não encontrado",
        )

    return format_movie_detail(movie)

# Cria o filme e associa seu diretor e seus gêneros
@router.post(
    "",
    response_model=MovieDetail,
    status_code=status.HTTP_201_CREATED,
)
async def create_movie(
    data: MovieCreate,
    db: AsyncSession = Depends(get_db),
):
    async with db.begin():
        movie = DimMovie(
            id_filme=uuid4().hex,
            titulo=data.titulo,
            ano_lancamento=data.ano_lancamento,
            sinopse=data.sinopse,
            duracao_minutos=data.duracao_minutos,
            url_poster=data.url_poster,
        )

        db.add(movie)

        # Reutiliza o diretor caso ele já esteja cadastrado.
        result = await db.execute(
            select(DimPerson).where(
                func.lower(DimPerson.nome_pessoa)
                == data.diretor.lower(),
                DimPerson.tipo_pessoa == "Diretor",
            )
        )

        diretor = result.scalar_one_or_none()

        if diretor is None:
            diretor = DimPerson(
                nome_pessoa=data.diretor,
                tipo_pessoa="Diretor",
            )
            db.add(diretor)

        movie.people.append(diretor)

        # Reutiliza os gêneros existentes.
        for nome in data.generos:
            result = await db.execute(
                select(DimGenre).where(
                    func.lower(DimGenre.nome_genero)
                    == nome.lower()
                )
            )

            genero = result.scalar_one_or_none()

            if genero is None:
                genero = DimGenre(nome_genero=nome)
                db.add(genero)

            movie.genres.append(genero)

        await db.flush()
        movie_id = movie.sk_movie_id

    # Busca novamente o filme com os relacionamentos carregados.
    result = await db.execute(
        select(DimMovie)
        .options(
            selectinload(DimMovie.genres),
            selectinload(DimMovie.companies),
            selectinload(DimMovie.people),
            selectinload(DimMovie.reviews),
        )
        .where(DimMovie.sk_movie_id == movie_id)
    )

    movie = result.scalar_one()

    return format_movie_detail(movie)



# Atualiza uma avaliação pertencente ao usuário autenticado.
@router.patch(
    "/{movie_id}/reviews/{review_id}",
    response_model=ReviewOut,
)
async def update_review(
    movie_id: str,
    review_id: str,
    data: ReviewCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(MovieReview).where(
            MovieReview.sk_movie_review_id == review_id,
            MovieReview.sk_movie_id == movie_id,
        )
    )

    review = result.scalar_one_or_none()

    if review is None:
        raise HTTPException(
            status_code=404,
            detail="Avaliação não encontrada.",
        )

    if review.user_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Você só pode editar suas próprias avaliações.",
        )

    review.nota = data.nota * 2
    review.comentario = data.comentario

    await db.commit()
    await db.refresh(review)

    return format_review(review)


@router.delete(
    "/{movie_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_movie(
    movie_id: str,
    db: AsyncSession = Depends(get_db),
):
    # Procura o filme pelo identificador.
    movie = await db.get(DimMovie, movie_id)

    if movie is None:
        raise HTTPException(
            status_code=404,
            detail="Filme não encontrado",
        )

    # Remove o filme e confirma a transação.
    await db.delete(movie)
    await db.commit()

# Lista as avaliações individuais de um filme, incluindo a média das notas.
@router.get(
    "/{movie_id}/reviews",
    response_model=MovieReviewsOut,
)
async def list_reviews(
    movie_id: str,
    db: AsyncSession = Depends(get_db),
):
    # Verifica se o filme existe.
    movie = await db.get(DimMovie, movie_id)

    if movie is None:
        raise HTTPException(
            status_code=404,
            detail="Filme não encontrado",
        )

    # Busca as avaliações individuais do filme.
    result = await db.execute(
        select(MovieReview)
        .where(MovieReview.sk_movie_id == movie_id)
        .order_by(
            MovieReview.created_at.desc(),
            MovieReview.sk_movie_review_id,
        )
    )

    reviews = result.scalars().all()

    # Calcula a média apenas das avaliações individuais.
    total = len(reviews)

    nota_media = (
        round(sum(review.nota for review in reviews) / total / 2, 2)
        if total > 0
        else None
    )

    return MovieReviewsOut(
        movie_id=movie_id,
        reviews=[
            format_review(review)
            for review in reviews
        ],
        total=total,
        nota_media=nota_media,
    )

# Cria uma avaliação individual de um filme, convertendo a nota para a escala de 0–10.
@router.post(
    "/{movie_id}/reviews",
    response_model=ReviewOut,
    status_code=status.HTTP_201_CREATED,
)
async def create_review(
    movie_id: str,
    data: ReviewCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    movie = await db.get(DimMovie, movie_id)

    if movie is None:
        raise HTTPException(
            status_code=404,
            detail="Filme não encontrado",
        )

    existing_review_result = await db.execute(
        select(MovieReview).where(
            MovieReview.sk_movie_id == movie_id,
            MovieReview.user_id == current_user.id,
        )
    )

    existing_review = (
        existing_review_result.scalar_one_or_none()
    )

    if existing_review is not None:
        raise HTTPException(
            status_code=409,
            detail=(
                "Você já avaliou este filme. "
                "Edite sua avaliação existente."
            ),
        )

    review = MovieReview(
        sk_movie_id=movie_id,
        user_id=current_user.id,
        nome=current_user.username,
        nota=data.nota * 2,
        comentario=data.comentario,
    )

    db.add(review)
    existing_watch_result = await db.execute(
        select(MovieWatch).where(
            MovieWatch.sk_movie_id == movie_id,
            MovieWatch.user_id == current_user.id,
        )
    )

    existing_watch = existing_watch_result.scalar_one_or_none()

    if existing_watch is None:
        watch = MovieWatch(
            sk_movie_id=movie_id,
            user_id=current_user.id,
        )
        db.add(watch)
    
    await db.commit()
    await db.refresh(review)

    return format_review(review)



# Converte a nota armazenada de 0–10 para a escala de 0–5.
def format_review(review: MovieReview) -> ReviewOut:
    return ReviewOut(
        sk_movie_review_id=review.sk_movie_review_id,
        sk_movie_id=review.sk_movie_id,
        user_id=review.user_id,
        nome=review.nome,
        nota=review.nota / 2,
        comentario=review.comentario,
        created_at=review.created_at,
    )


# Formata os detalhes de um filme, incluindo relacionamentos e estatísticas de avaliações.
def format_movie_detail(movie: DimMovie) -> MovieDetail:
    # Converte as avaliações para a escala de cinco estrelas.
    reviews = [format_review(review) for review in movie.reviews]

    # Calcula a média das avaliações individuais.
    total = len(reviews)

    nota_media = (
        round(sum(review.nota for review in reviews) / total, 2)
        if total > 0
        else None
    )

    # Aproveita os campos básicos do filme.
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
        reviews=reviews,
        total_avaliacoes=total,
        nota_media=nota_media,
    )

