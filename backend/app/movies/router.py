from math import ceil
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.movies.models import DimGenre, DimMovie, DimPerson, MovieReview
from app.movies.schemas import (
    MovieCreate,
    MovieDetail,
    MovieOut,
    MovieReviewsOut,
    MovieUpdate,
    PaginatedMovies,
    PersonOut,
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


@router.patch("/{movie_id}", response_model=MovieDetail)
async def update_movie(
    movie_id: str,
    data: MovieUpdate,
    db: AsyncSession = Depends(get_db),
):
    # Busca o filme com seus relacionamentos.
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

    changes = data.model_dump(exclude_unset=True)

    # Atualiza os campos básicos.
    for field in (
        "titulo",
        "ano_lancamento",
        "sinopse",
        "duracao_minutos",
        "url_poster",
    ):
        if field in changes:
            setattr(movie, field, changes[field])

    # Atualiza o diretor, preservando outros participantes.
    if "diretor" in changes:
        if changes["diretor"] is None:
            raise HTTPException(
                status_code=422,
                detail="O diretor não pode ser nulo",
            )

        result = await db.execute(
            select(DimPerson).where(
                func.lower(DimPerson.nome_pessoa)
                == changes["diretor"].lower(),
                DimPerson.tipo_pessoa == "Diretor",
            )
        )

        diretor = result.scalar_one_or_none()

        if diretor is None:
            diretor = DimPerson(
                nome_pessoa=changes["diretor"],
                tipo_pessoa="Diretor",
            )
            db.add(diretor)

        movie.people = [
            person
            for person in movie.people
            if person.tipo_pessoa != "Diretor"
        ]
        movie.people.append(diretor)

    # Substitui os gêneros quando informados.
    if "generos" in changes:
        if not changes["generos"]:
            raise HTTPException(
                status_code=422,
                detail="Informe pelo menos um gênero",
            )

        novos_generos = []

        for nome in changes["generos"]:
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

            novos_generos.append(genero)

        movie.genres = novos_generos

    await db.commit()

    # Recarrega o filme para devolver os dados atualizados.
    result = await db.execute(
        select(DimMovie)
        .options(
            selectinload(DimMovie.genres),
            selectinload(DimMovie.companies),
            selectinload(DimMovie.people),
        )
        .where(DimMovie.sk_movie_id == movie_id)
    )

    movie = result.scalar_one()

    return format_movie_detail(movie)


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
):
    # Confere se o filme existe.
    movie = await db.get(DimMovie, movie_id)

    if movie is None:
        raise HTTPException(
            status_code=404,
            detail="Filme não encontrado",
        )

    # Converte a nota de 1–5 para a escala de 0–10 do banco.
    review = MovieReview(
        sk_movie_id=movie_id,
        nome=data.nome,
        nota=data.nota * 2,
        comentario=data.comentario,
    )

    db.add(review)
    await db.commit()
    await db.refresh(review)

    return format_review(review)


# Converte a nota armazenada de 0–10 para a escala de 0–5.
def format_review(review: MovieReview) -> ReviewOut:
    return ReviewOut(
        sk_movie_review_id=review.sk_movie_review_id,
        sk_movie_id=review.sk_movie_id,
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
