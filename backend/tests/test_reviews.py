
import pytest


MOVIE_DATA = {
    "titulo": "Filme para Avaliações",
    "diretor": "Diretor de Teste",
    "ano_lancamento": 2022,
    "generos": ["Drama"],
    "sinopse": "Sinopse de teste.",
}

# Fixture para criar um filme antes de cada teste
@pytest.fixture
async def movie_id(client):
    response = await client.post(
        "/api/v1/movies",
        json=MOVIE_DATA,
    )

    assert response.status_code == 201

    return response.json()["sk_movie_id"]

# Teste para criar uma avaliação de filme e verificar se os dados estão corretos
@pytest.mark.asyncio
async def test_create_review(client, movie_id):
    response = await client.post(
        f"/api/v1/movies/{movie_id}/reviews",
        json={
            "nome": "Ana",
            "nota": 4,
            "comentario": "Gostei bastante.",
        },
    )

    assert response.status_code == 201

    review = response.json()

    assert review["nome"] == "Ana"
    assert review["nota"] == 4
    assert review["comentario"] == "Gostei bastante."

# Teste para listar média de avaliações de um filme e verificar se os dados estão corretos
@pytest.mark.asyncio
async def test_average_rating(client, movie_id):
    reviews = [
        {
            "nome": "Ana",
            "nota": 4,
            "comentario": "Muito bom.",
        },
        {
            "nome": "Bruno",
            "nota": 5,
            "comentario": "Excelente.",
        },
    ]

    for review in reviews:
        response = await client.post(
            f"/api/v1/movies/{movie_id}/reviews",
            json=review,
        )

        assert response.status_code == 201

    response = await client.get(
        f"/api/v1/movies/{movie_id}/reviews"
    )

    assert response.status_code == 200

    data = response.json()

    assert data["total"] == 2
    assert data["nota_media"] == 4.5
    assert sorted(
        review["nota"] for review in data["reviews"]
    ) == [4, 5]

    details = await client.get(
        f"/api/v1/movies/{movie_id}"
    )

    assert details.status_code == 200
    assert details.json()["total_avaliacoes"] == 2
    assert details.json()["nota_media"] == 4.5

# Teste para verificar se a avaliação de filme com nota inválida retorna erro
@pytest.mark.asyncio
@pytest.mark.parametrize("nota", [0, -1, 6, 10])
async def test_invalid_rating(client, movie_id, nota):
    response = await client.post(
        f"/api/v1/movies/{movie_id}/reviews",
        json={
            "nome": "Ana",
            "nota": nota,
            "comentario": "Comentário de teste.",
        },
    )

    assert response.status_code == 422

# Teste para deletar um filme com avaliações e verificar se ele foi removido corretamente
@pytest.mark.asyncio
async def test_delete_movie_with_reviews(client, movie_id):
    review = await client.post(
        f"/api/v1/movies/{movie_id}/reviews",
        json={
            "nome": "Ana",
            "nota": 5,
            "comentario": "Excelente.",
        },
    )

    assert review.status_code == 201

    deleted = await client.delete(
        f"/api/v1/movies/{movie_id}"
    )

    assert deleted.status_code == 204

    details = await client.get(
        f"/api/v1/movies/{movie_id}"
    )

    assert details.status_code == 404

# Teste para atualizar um filme com avaliações e verificar se os dados foram alterados corretamente
@pytest.mark.asyncio
async def test_update_movie_with_reviews(client, movie_id):
    review = await client.post(
        f"/api/v1/movies/{movie_id}/reviews",
        json={
            "nome": "Ana",
            "nota": 5,
            "comentario": "Excelente.",
        },
    )

    assert review.status_code == 201

    updated = await client.patch(
        f"/api/v1/movies/{movie_id}",
        json={"titulo": "Título Atualizado"},
    )

    assert updated.status_code == 200
    assert updated.json()["titulo"] == "Título Atualizado"
    assert updated.json()["total_avaliacoes"] == 1
    assert updated.json()["nota_media"] == 5
