import {
  useEffect,
  useState,
} from "react";

import {
  ArrowLeft,
  Clapperboard,
  Star,
  UserRound,
} from "lucide-react";

import { useAuth } from "../auth/AuthContext";

import {
  getMyMovies,
  type MyMovie,
} from "../services/movies";

import {
  getMyReviews,
  type MyReview,
} from "../services/auth";

import {
  formatRating,
} from "../utils/ratings";

interface AccountPageProps {
  onBack: () => void;
  onOpenMovie: (
    movieId: string
  ) => void;
}

function AccountPage({
  onBack,
  onOpenMovie,
}: AccountPageProps) {
  const { user, token } = useAuth();

  const [myMovies, setMyMovies] =
    useState<MyMovie[]>([]);

  const [moviesLoading, setMoviesLoading] =
    useState(true);

  const [reviews, setReviews] =
    useState<MyReview[]>([]);

  const [error, setError] =
    useState("");

  useEffect(() => {
    let active = true;

    async function loadReviews() {
      if (!token) {
        return;
      }

      setError("");

      try {
        const data =
          await getMyReviews(token);

        if (active) {
          setReviews(data);
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Erro ao carregar seu histórico."
          );
        }
      }
    }

    loadReviews();

    return () => {
      active = false;
    };
  }, [token]);

  useEffect(() => {
    let active = true;

    async function loadMyMovies() {
      if (!token) {
        if (active) {
          setMoviesLoading(false);
        }
        return;
      }

      if (active) {
        setMoviesLoading(true);
      }

      try {
        const data = await getMyMovies(token);

        if (active) {
          setMyMovies(data);
        }
      } catch (err) {
        console.error(
          "Erro ao carregar filmes do usuário:",
          err
        );

        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Erro ao carregar seus filmes."
          );
        }
      } finally {
        if (active) {
          setMoviesLoading(false);
        }
      }
    }

    loadMyMovies();

    return () => {
      active = false;
    };
  }, [token]);

  if (!user) {
    return (
      <main className="container account-page">
        <p>
          Usuário não carregado.
        </p>

        <button
          type="button"
          className="back-button"
          onClick={onBack}
        >
          Voltar ao catálogo
        </button>
      </main>
    );
  }

  const reviewedMovies =
    myMovies.filter(
      (movie) =>
        movie.nota !== null
    ).length;

  return (
    <main className="container account-page">
      <button
        type="button"
        className="back-button"
        onClick={onBack}
      >
        <ArrowLeft size={18} />

        Voltar ao catálogo
      </button>

      <section className="account-profile">
        <div className="account-profile-avatar">
          <UserRound size={34} />
        </div>

        <div>
          <p className="eyebrow">
            MINHA CONTA
          </p>

          <h1>
            {user.username}
          </h1>

          <p>
            {user.email}
          </p>
        </div>
      </section>

      <div className="account-stats">
        <div>
          <Clapperboard size={21} />

          <strong>
            {myMovies.length}
          </strong>

          <span>
            Filmes assistidos
          </span>
        </div>

        <div>
          <Star size={21} />

          <strong>
            {reviewedMovies}
          </strong>

          <span>
            Filmes avaliados
          </span>
        </div>

        <div>
          <Star size={21} />

          <strong>
            {reviews.length}
          </strong>

          <span>
            Avaliações publicadas
          </span>
        </div>
      </div>

      <section className="account-movies-section">
        <div className="account-section-heading">
          <p className="eyebrow">
            SEU HISTÓRICO
          </p>

          <h2>
            Seus filmes
          </h2>
        </div>

        {moviesLoading && (
          <p>
            Carregando seus filmes...
          </p>
        )}

        {error && (
          <p
            className="error"
            role="alert"
          >
            {error}
          </p>
        )}

        {!moviesLoading &&
          !error &&
          myMovies.length === 0 && (
            <div className="account-empty">
              <Clapperboard
                size={35}
              />

              <h3>
                Seu diário começa
                com um filme.
              </h3>

              <p>
                Marque um filme como
                assistido ou publique
                uma avaliação.
              </p>

              <button
                type="button"
                className="primary-button"
                onClick={onBack}
              >
                Explorar filmes
              </button>
            </div>
          )}

        {!moviesLoading &&
          !error &&
          myMovies.length > 0 && (
            <div className="account-movies-grid">
              {myMovies.map(
                (movie) => (
                  <button
                    type="button"
                    className="account-movie-card"
                    key={
                      movie.movie_id
                    }
                    onClick={() =>
                      onOpenMovie(
                        movie.movie_id
                      )
                    }
                  >
                    <div className="account-movie-poster">
                      {movie.url_poster ? (
                        <img
                          src={
                            movie.url_poster
                          }
                          alt={`Pôster de ${movie.titulo}`}
                          loading="lazy"
                        />
                      ) : (
                        <div className="account-movie-no-poster">
                          <Clapperboard
                            size={26}
                          />
                        </div>
                      )}
                    </div>

                    <div className="account-movie-info">
                      <h3>
                        {movie.titulo}
                      </h3>

                      <span className="account-movie-year">
                        {movie.ano_lancamento ??
                          "Ano desconhecido"}
                      </span>

                      {movie.nota !==
                      null ? (
                        <span className="account-movie-rating">
                          <Star
                            size={14}
                            fill="currentColor"
                          />

                          {formatRating(
                            movie.nota
                          )}
                        </span>
                      ) : (
                        <span className="account-movie-watched">
                          Assistido
                        </span>
                      )}
                    </div>
                  </button>
                )
              )}
            </div>
          )}
      </section>
    </main>
  );
}

export default AccountPage;