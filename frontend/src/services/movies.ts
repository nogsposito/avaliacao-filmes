
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
  user_id: string | null;
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

export interface MyMovie {
  movie_id: string;
  titulo: string;
  url_poster: string | null;
  ano_lancamento: number | null;
  watched_at: string;
  nota: number | null;
  comentario: string | null;
}

export interface RecentReview {
  sk_movie_review_id: string;
  sk_movie_id: string;
  nome: string;
  nota: number;
  comentario: string;
  created_at: string;
  titulo: string;
  url_poster: string | null;
}

export async function getMovies(
  page = 1,
  pageSize = 12,
  search = "",
  seed?: number
): Promise<PaginatedMovies> {
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
    search,
  });

  if (seed !== undefined) {
    params.set("seed", String(seed));
  }

  const response = await fetch(
    `${API_URL}/movies?${params.toString()}`
  );

  if (!response.ok) {
    throw new Error("Não foi possível carregar os filmes.");
  }

  return response.json();
}

export async function getFeaturedMovies(
  limit = 6
): Promise<Movie[]> {
  const response = await fetch(
    `${API_URL}/movies/featured?limit=${limit}`
  );

  if (!response.ok) {
    throw new Error(
      "Não foi possível carregar os filmes em destaque."
    );
  }

  return response.json();
}

export async function getMyMovies(
  token: string
): Promise<MyMovie[]> {
  const response = await fetch(
    `${API_URL}/movies/my-movies`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      "Não foi possível carregar seus filmes."
    );
  }

  return response.json();
}

export async function getRecentReviews(
  limit = 6
): Promise<RecentReview[]> {
  const response = await fetch(
    `${API_URL}/movies/recent-reviews?limit=${limit}`
  );

  if (!response.ok) {
    throw new Error(
      "Não foi possível carregar as avaliações recentes."
    );
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

export type MovieUpdate = Partial<MovieCreate>;

export async function updateMovie(
  movieId: string,
  data: MovieUpdate
): Promise<MovieDetail> {
  const response = await fetch(
    `${API_URL}/movies/${encodeURIComponent(movieId)}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    throw new Error(
      `Não foi possível atualizar o filme (HTTP ${response.status}).`
    );
  }

  return response.json();
}


export async function deleteMovie(movieId: string): Promise<void> {
  const response = await fetch(
    `${API_URL}/movies/${encodeURIComponent(movieId)}`,
    {
      method: "DELETE",
    }
  );

  if (!response.ok) {
    throw new Error(
      `Não foi possível excluir o filme (HTTP ${response.status}).`
    );
  }
}

export interface MovieWatchStatus {
  watched: boolean;
}

export async function getMovieWatchStatus(
  movieId: string,
  token: string
): Promise<MovieWatchStatus> {
  const response = await fetch(
    `${API_URL}/movies/${encodeURIComponent(movieId)}/watch`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      "Não foi possível verificar se o filme foi assistido."
    );
  }

  return response.json();
}

export async function markMovieAsWatched(
  movieId: string,
  token: string
): Promise<void> {
  const response = await fetch(
    `${API_URL}/movies/${encodeURIComponent(movieId)}/watch`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      "Não foi possível marcar o filme como assistido."
    );
  }
}

export async function unmarkMovieAsWatched(
  movieId: string,
  token: string
): Promise<void> {
  const response = await fetch(
    `${API_URL}/movies/${encodeURIComponent(movieId)}/watch`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      "Não foi possível desmarcar o filme."
    );
  }
}

export interface ReviewCreate {
  nota: number;
  comentario: string;
}

export async function createReview(
  movieId: string,
  data: ReviewCreate,
  token: string
): Promise<Review> {
  const response = await fetch(
    `${API_URL}/movies/${encodeURIComponent(movieId)}/reviews`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    throw new Error(
      response.status === 401
        ? "Sua sessão expirou. Entre novamente."
        : `Não foi possível publicar a avaliação (HTTP ${response.status}).`
    );
  }

  return response.json();
}

export async function updateReview(
  movieId: string,
  reviewId: string,
  data: ReviewCreate,
  token: string
): Promise<Review> {
  const response = await fetch(
    `${API_URL}/movies/${encodeURIComponent(
      movieId
    )}/reviews/${encodeURIComponent(reviewId)}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const body = await response
      .json()
      .catch(() => null);

    throw new Error(
      body?.detail ??
        "Não foi possível atualizar a avaliação."
    );
  }

  return response.json();
}

