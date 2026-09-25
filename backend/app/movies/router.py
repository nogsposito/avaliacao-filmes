from uuid import uuid4

from math import ceil

from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.movies.models import DimMovie, DimGenre, DimPerson
from app.movies.schemas import MovieOut, PaginatedMovies, MovieDetail, PersonOut, MovieCreate, MovieUpdate


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
        )
        .where(DimMovie.sk_movie_id == movie_id)
    )

    movie = result.scalar_one()

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

    detail = MovieOut.model_validate(movie).model_dump()

    return MovieDetail(
        **detail,
        genres=[genre.nome_genero for genre in movie.genres],
        companies=[
            company.nome_produtora
            for company in movie.companies
        ],
        people=[
            PersonOut.model_validate(person)
            for person in movie.people
        ],
    )


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
