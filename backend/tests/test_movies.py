import pytest

MOVIE_DATA = {
    "titulo": "Filme de Teste",
    "diretor": "Diretor de Teste",
    "ano_lancamento": 2020,
    "generos": ["Drama", "Suspense"],
    "sinopse": "Uma sinopse para os testes.",
    "duracao_minutos": 120,
    "url_poster": None,
}

# Teste para verificar lista de filmes vazia
@pytest.mark.asyncio
async def test_list_empty_catalog(client):
    response = await client.get("/api/v1/movies")

    assert response.status_code == 200

    data = response.json()

    assert data["items"] == []
    assert data["total"] == 0
    assert data["total_pages"] == 0

# Teste para criar um filme e verificar se os dados estão corretos
@pytest.mark.asyncio
async def test_create_movie(client):
    response = await client.post(
        "/api/v1/movies",
        json=MOVIE_DATA,
    )

    assert response.status_code == 201

    movie = response.json()

    assert movie["titulo"] == "Filme de Teste"
    assert movie["ano_lancamento"] == 2020
    assert set(movie["genres"]) == {"Drama", "Suspense"}
    assert movie["total_avaliacoes"] == 0
    assert movie["nota_media"] is None

    directors = [
        person["nome_pessoa"]
        for person in movie["people"]
        if person["tipo_pessoa"] == "Diretor"
    ]

    assert directors == ["Diretor de Teste"]

# Teste para obter um filme criado e verificar se os dados estão corretos
@pytest.mark.asyncio
async def test_get_movie(client):
    created = await client.post(
        "/api/v1/movies",
        json=MOVIE_DATA,
    )

    assert created.status_code == 201

    movie_id = created.json()["sk_movie_id"]

    response = await client.get(
        f"/api/v1/movies/{movie_id}"
    )

    assert response.status_code == 200
    assert response.json()["sk_movie_id"] == movie_id
    assert response.json()["titulo"] == "Filme de Teste"

# Teste para buscar filmes com paginação e filtro de busca
@pytest.mark.asyncio
async def test_search_and_pagination(client):
    titles = [
        "Alien",
        "Aliens",
        "Blade Runner",
    ]

    for title in titles:
        response = await client.post(
            "/api/v1/movies",
            json={**MOVIE_DATA, "titulo": title},
        )
        assert response.status_code == 201

    response = await client.get(
        "/api/v1/movies",
        params={
            "search": "alien",
            "page": 1,
            "page_size": 1,
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["total"] == 2
    assert data["total_pages"] == 2
    assert len(data["items"]) == 1
    assert data["items"][0]["titulo"] == "Alien"

    second_page = await client.get(
        "/api/v1/movies",
        params={
            "search": "alien",
            "page": 2,
            "page_size": 1,
        },
    )

    assert second_page.status_code == 200
    assert second_page.json()["items"][0]["titulo"] == "Aliens"

# Teste para atualizar um filme e verificar se os dados foram alterados corretamente
@pytest.mark.asyncio
async def test_update_movie(client):
    created = await client.post(
        "/api/v1/movies",
        json=MOVIE_DATA,
    )

    assert created.status_code == 201

    movie_id = created.json()["sk_movie_id"]

    response = await client.patch(
        f"/api/v1/movies/{movie_id}",
        json={
            "titulo": "Filme Atualizado",
            "generos": ["Comédia"],
        },
    )

    assert response.status_code == 200

    updated = response.json()

    assert updated["titulo"] == "Filme Atualizado"
    assert updated["genres"] == ["Comédia"]
    assert updated["ano_lancamento"] == 2020

# Teste para deletar um filme e verificar se ele foi removido corretamente
@pytest.mark.asyncio
async def test_delete_movie(client):
    created = await client.post(
        "/api/v1/movies",
        json=MOVIE_DATA,
    )

    assert created.status_code == 201

    movie_id = created.json()["sk_movie_id"]

    deleted = await client.delete(
        f"/api/v1/movies/{movie_id}"
    )

    assert deleted.status_code == 204

    response = await client.get(
        f"/api/v1/movies/{movie_id}"
    )

    assert response.status_code == 404

# Teste para verificar paginação inválida
@pytest.mark.asyncio
async def test_invalid_pagination(client):
    response = await client.get(
        "/api/v1/movies",
        params={"page": 0},
    )

    assert response.status_code == 422

# Teste para verificar busca inválida
@pytest.mark.asyncio
async def test_missing_movie(client):
    response = await client.get(
        "/api/v1/movies/filme-inexistente"
    )

    assert response.status_code == 404
