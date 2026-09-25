
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

# Dados básicos de um filme.
class MovieOut(BaseModel):

    model_config = ConfigDict(from_attributes=True)

    sk_movie_id: str
    id_filme: str
    titulo: str
    data_lancamento: date | None
    ano_lancamento: int | None
    duracao_minutos: int | None
    status_filme: str | None
    sinopse: str | None
    url_poster: str | None
    url_backdrop: str | None

# Resultado de uma consulta paginada.
class PaginatedMovies(BaseModel):

    items: list[MovieOut]
    total: int
    page: int = Field(ge=1)
    page_size: int = Field(ge=1)
    total_pages: int

# Detalhes de uma pessoa.
class PersonOut(BaseModel):

    model_config = ConfigDict(from_attributes=True)

    sk_person_id: str
    nome_pessoa: str
    tipo_pessoa: str

# Esquema para criação de um novo filme.
class MovieCreate(BaseModel):

    titulo: str = Field(min_length=1, max_length=500)
    diretor: str = Field(min_length=1, max_length=255)
    ano_lancamento: int = Field(ge=1888, le=2100)
    generos: list[str] = Field(min_length=1)
    sinopse: str | None = Field(default=None, max_length=4000)
    duracao_minutos: int | None = Field(default=None, gt=0)
    url_poster: str | None = Field(default=None, max_length=2048)

    @field_validator("titulo", "diretor")
    @classmethod
    def validar_texto(cls, value: str) -> str:
        value = value.strip()

        if not value:
            raise ValueError("O campo não pode estar vazio")

        return value

    @field_validator("generos")
    @classmethod
    def validar_generos(cls, values: list[str]) -> list[str]:
        generos = []
        vistos = set()

        for value in values:
            genero = value.strip()

            if not genero or len(genero) > 50:
                raise ValueError("Gênero inválido")

            if genero.casefold() not in vistos:
                generos.append(genero)
                vistos.add(genero.casefold())

        if not generos:
            raise ValueError("Informe pelo menos um gênero")

        return generos

# Esquema para atualização de um filme existente.
class MovieUpdate(BaseModel):
    titulo: str | None = Field(default=None, min_length=1, max_length=500)
    diretor: str | None = Field(default=None, min_length=1, max_length=255)
    ano_lancamento: int | None = Field(default=None, ge=1888, le=2100)
    generos: list[str] | None = Field(default=None, min_length=1)
    sinopse: str | None = Field(default=None, max_length=4000)
    duracao_minutos: int | None = Field(default=None, gt=0)
    url_poster: str | None = Field(default=None, max_length=2048)

    @field_validator("titulo", "diretor")
    @classmethod
    def validar_texto(cls, value: str | None) -> str | None:
        if value is None:
            return None

        value = value.strip()

        if not value:
            raise ValueError("O campo não pode estar vazio")

        return value

    @field_validator("generos")
    @classmethod
    def validar_generos(cls, values: list[str] | None) -> list[str] | None:
        if values is None:
            return None

        generos = []
        vistos = set()

        for value in values:
            genero = value.strip()

            if not genero or len(genero) > 50:
                raise ValueError("Gênero inválido")

            if genero.casefold() not in vistos:
                generos.append(genero)
                vistos.add(genero.casefold())

        return generos

# Schema para criação de uma avaliação de filme.
class ReviewCreate(BaseModel):
    nome: str = Field(min_length=1, max_length=120)
    nota: float = Field(ge=1, le=5)
    comentario: str = Field(min_length=1, max_length=4000)

    @field_validator("nome", "comentario")
    @classmethod
    def validar_texto(cls, value: str) -> str:
        value = value.strip()

        if not value:
            raise ValueError("O campo não pode estar vazio")

        return value

# Schema para output de uma avaliação de filme.
class ReviewOut(BaseModel):
    sk_movie_review_id: str
    sk_movie_id: str
    nome: str
    nota: float
    comentario: str
    created_at: datetime

# Schema para output de avaliações de filme, incluindo estatísticas.
class MovieReviewsOut(BaseModel):
    movie_id: str
    reviews: list[ReviewOut]
    total: int
    nota_media: float | None

# Detalhes de um filme, incluindo relacionamentos.
class MovieDetail(MovieOut):

    genres: list[str]
    companies: list[str]
    people: list[PersonOut]
    reviews: list[ReviewOut] = Field(default_factory=list)
    total_avaliacoes: int = 0
    nota_media: float | None = None