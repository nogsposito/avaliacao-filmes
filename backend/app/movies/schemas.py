
from datetime import date

from pydantic import BaseModel, ConfigDict, Field

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

#Resultado de uma consulta paginada.
class PaginatedMovies(BaseModel):

    items: list[MovieOut]
    total: int
    page: int = Field(ge=1)
    page_size: int = Field(ge=1)
    total_pages: int


class PersonOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    sk_person_id: str
    nome_pessoa: str
    tipo_pessoa: str


class MovieDetail(MovieOut):
    genres: list[str]
    companies: list[str]
    people: list[PersonOut]
