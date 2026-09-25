
const API_URL = "http://localhost:8000/api/v1";

export interface Movie {
  sk_movie_id: string;
  id_filme: string;
  titulo: string;
  ano_lancamento: number | null;
  sinopse: string | null;
  url_poster: string | null;
}

export interface PaginatedMovies {
  items: Movie[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export async function getMovies(
  page = 1,
  pageSize = 12,
  search = ""
): Promise<PaginatedMovies> {
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
    search,
  });

  const response = await fetch(
    `${API_URL}/movies?${params.toString()}`
  );

  if (!response.ok) {
    throw new Error("Não foi possível carregar os filmes.");
  }

  return response.json();
}
