import argparse
import asyncio
import csv
import math
from datetime import date
from decimal import Decimal, InvalidOperation
from pathlib import Path

from sqlalchemy import Date, Float, Integer, Numeric, String
from sqlalchemy.dialects.sqlite import insert

from app.db.base import Base
from app.db.session import AsyncSessionLocal, engine
from app.movies import models  # noqa: F401 — registra as tabelas


# As tabelas principais vêm antes das que dependem delas.
FILES = [
    ("dim_movies.csv", "dim_movies"),
    ("dim_genres.csv", "dim_genres"),
    ("dim_companies.csv", "dim_companies"),
    ("dim_people.csv", "dim_people"),
    ("bridge_movie_genre.csv", "bridge_movie_genre"),
    ("bridge_movie_company.csv", "bridge_movie_company"),
    ("bridge_movie_person.csv", "bridge_movie_person"),
    ("fact_movies_performance.csv", "fact_movies_performance"),
    ("dim_reviews.csv", "dim_reviews"),
    ("movies_reviews.csv", "movie_reviews"),
]


DEFAULT_DATA_DIR = Path(__file__).resolve().parents[2] / "data"
BATCH_SIZE = 500


# Converte o texto do CSV para o tipo esperado pela coluna e verifica campos vazios e a validade dos valores.
def convert_value(raw: str, column):
    value = raw.strip()

    # Tratamento de campos vazios.
    if not value:
        if column.nullable:
            return None
        raise ValueError(f"{column.name}: campo obrigatório vazio")

    # Aceita inteiros escritos como "2375" ou "2375.0"
    if isinstance(column.type, Integer):
        number = Decimal(value)
        if not number.is_finite() or number != number.to_integral_value():
            raise ValueError(f"{column.name}: inteiro inválido: {value!r}")
        return int(number)

    # Usa Decimal para valores financeiros.
    if isinstance(column.type, Numeric):
        number = Decimal(value)
        if not number.is_finite():
            raise ValueError(f"{column.name}: número inválido: {value!r}")
        return number

    # Converte notas e outros números decimais.
    if isinstance(column.type, Float):
        number = float(value)
        if not math.isfinite(number):
            raise ValueError(f"{column.name}: número inválido: {value!r}")
        return number

    # Converte datas no formato AAAA-MM-DD.
    if isinstance(column.type, Date):
        return date.fromisoformat(value)

    # Confere o tamanho máximo dos textos.
    if isinstance(column.type, String):
        if column.type.length and len(value) > column.type.length:
            raise ValueError(
                f"{column.name}: excede {column.type.length} caracteres"
            )

    return value


# Confere se as colunas do CSV correspondem às da tabela.
def check_headers(reader, table, path):
    headers = reader.fieldnames

    if not headers:
        raise ValueError(f"{path.name}: arquivo sem cabeçalho")

    if len(headers) != len(set(headers)):
        raise ValueError(f"{path.name}: colunas repetidas no cabeçalho")

    expected = set(table.columns.keys()) - {"created_at"}
    received = set(headers)

    if received != expected:
        missing = sorted(expected - received)
        extra = sorted(received - expected)
        raise ValueError(
            f"{path.name}: cabeçalho incompatível. "
            f"Faltando: {missing}. Extras: {extra}"
        )


# Insere um lote, ignorando chaves primárias já existentes e retornando erro se for o caso.
async def save_batch(session, table, rows, filename, line_range):
    statement = insert(table).on_conflict_do_nothing(
        index_elements=list(table.primary_key.columns)
    )

    try:
        await session.execute(statement, rows)
    except Exception as exc:
        raise RuntimeError(
            f"{filename}: falha no lote entre as linhas {line_range}. "
            "Verifique chaves estrangeiras, valores únicos e restrições "
            "como nota entre 0 e 10."
        ) from exc


# Lê um arquivo linha a linha, converte os campos e envia os lotes.
async def import_file(session, path, table):
    batch = []
    processed = 0
    first_line = 0

    with path.open("r", encoding="utf-8-sig", newline="") as file:
        reader = csv.DictReader(file)
        check_headers(reader, table, path)

        for row in reader:
            line = reader.line_num

            if None in row or any(value is None for value in row.values()):
                raise ValueError(
                    f"{path.name}, linha {line}: quantidade incorreta de campos"
                )

            try:
                converted = {
                    name: convert_value(value, table.columns[name])
                    for name, value in row.items()
                }
            except (ValueError, InvalidOperation) as exc:
                raise ValueError(
                    f"{path.name}, linha {line}: {exc}"
                ) from exc

            if not batch:
                first_line = line

            batch.append(converted)
            processed += 1

            if len(batch) >= BATCH_SIZE:
                await save_batch(
                    session, table, batch, path.name, f"{first_line}–{line}"
                )
                batch = []

        # Salva os registros restantes do último lote.
        if batch:
            await save_batch(
                session,
                table,
                batch,
                path.name,
                f"{first_line}–{reader.line_num}",
            )

    print(f"{path.name}: {processed} registros processados")

# Coordena a importação dos dez arquivos em uma única transação.
async def run(data_dir):
    try:
        if engine.dialect.name != "sqlite":
            raise ValueError("Este importador foi preparado para SQLite.")

        # Confere os dez arquivos e cabeçalhos antes de inserir qualquer dado.
        for filename, table_name in FILES:
            path = data_dir / filename
            if not path.is_file():
                raise FileNotFoundError(f"Arquivo não encontrado: {path}")

            with path.open("r", encoding="utf-8-sig", newline="") as file:
                check_headers(
                    csv.DictReader(file),
                    Base.metadata.tables[table_name],
                    path,
                )

        async with AsyncSessionLocal() as session:
            # Só confirma a carga quando os dez arquivos terminarem.
            # Em caso de erro, desfaz as inserções desta execução.
            async with session.begin():
                for filename, table_name in FILES:
                    await import_file(
                        session,
                        data_dir / filename,
                        Base.metadata.tables[table_name],
                    )

        print("Importação concluída e confirmada no banco.")
        print("Chaves primárias já existentes foram mantidas sem alteração.")
    finally:
        await engine.dispose()

# Permite executar pelo terminal e escolher outra pasta de CSVs.
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Importa os dez CSVs de filmes.")
    parser.add_argument("--data-dir", type=Path, default=DEFAULT_DATA_DIR)
    args = parser.parse_args()

    asyncio.run(run(args.data_dir))