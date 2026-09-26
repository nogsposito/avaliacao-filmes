
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

export interface Person {
  sk_person_id: string;
  nome_pessoa: string;
  tipo_pessoa: string;
}

export interface Review {
  sk_movie_review_id: string;
  sk_movie_id: string;
  nome: string;
  nota: number;
  comentario: string;
  created_at: string;
}

export interface MovieDetail extends Movie {
  duracao_minutos: number | null;
  status_filme: string | null;
  url_backdrop: string | null;
  genres: string[];
  companies: string[];
  people: Person[];
  reviews: Review[];
  total_avaliacoes: number;
  nota_media: number | null;
}

export interface MovieCreate {
  titulo: string;
  diretor: string;
  ano_lancamento: number;
  generos: string[];
  sinopse: string | null;
  duracao_minutos: number | null;
  url_poster: string | null;
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

export async function getMovie(
  movieId: string
): Promise<MovieDetail> {
  const response = await fetch(
    `${API_URL}/movies/${encodeURIComponent(movieId)}`
  );

  if (!response.ok) {
    throw new Error("Não foi possível carregar os detalhes do filme.");
  }

  return response.json();
}

export async function createMovie(
  data: MovieCreate
): Promise<MovieDetail> {
  const response = await fetch(`${API_URL}/movies`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(
      `Erro ao cadastrar filme (HTTP ${response.status}).`
    );
  }

  return response.json();
}
