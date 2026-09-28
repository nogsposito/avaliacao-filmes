import {
  useEffect,
  useState,
} from "react";

import {
  ArrowLeft,
  Clapperboard,
  MessageSquareText,
  Plus,
  Star,
} from "lucide-react";

import { useAuth } from "../auth/AuthContext";

import {
  getMyCreatedMovies,
  getMyMovies,
  type Movie,
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

  const [
    createdMovies,
    setCreatedMovies,
  ] = useState<Movie[]>([]);

  const [
    moviesLoading,
    setMoviesLoading,
  ] = useState(true);

  const [
    createdMoviesLoading,
    setCreatedMoviesLoading,
  ] = useState(true);

  const [reviews, setReviews] =
    useState<MyReview[]>([]);

  const [historyError, setHistoryError] =
    useState("");

  const [
    createdMoviesError,
    setCreatedMoviesError,
  ] = useState("");

  useEffect(() => {
    let active = true;

    async function loadReviews() {
      if (!token) {
        return;
      }

      try {
        const data =
          await getMyReviews(token);

        if (active) {
          setReviews(data);
        }
      } catch (err) {
        console.error(
          "Erro ao carregar avaliações:",
          err
        );
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

      setMoviesLoading(true);
      setHistoryError("");

      try {
        const data =
          await getMyMovies(token);

        if (active) {
          setMyMovies(data);
        }
      } catch (err) {
        console.error(
          "Erro ao carregar filmes do usuário:",
          err
        );

        if (active) {
          setHistoryError(
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

  useEffect(() => {
    let active = true;

    async function loadCreatedMovies() {
      if (!token) {
        if (active) {
          setCreatedMoviesLoading(false);
        }

        return;
      }

      setCreatedMoviesLoading(true);
      setCreatedMoviesError("");

      try {
        const data =
          await getMyCreatedMovies(token);

        if (active) {
          setCreatedMovies(data);
        }
      } catch (err) {
        console.error(
          "Erro ao carregar filmes criados:",
          err
        );

        if (active) {
          setCreatedMoviesError(
            err instanceof Error
              ? err.message
              : "Erro ao carregar filmes criados."
          );
        }
      } finally {
        if (active) {
          setCreatedMoviesLoading(false);
        }
      }
    }

    loadCreatedMovies();

    return () => {
      active = false;
    };
  }, [token]);

  if (!user) {
    return (
      <main className="account-page account-shell">
        <p>Usuário não carregado.</p>

        <button
          type="button"
          className="account-back"
          onClick={onBack}
        >
          <ArrowLeft size={18} />
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

  const initial =
    user.username
      .charAt(0)
      .toUpperCase();

  return (
    <main className="account-page account-shell">
      <button
        type="button"
        className="account-back"
        onClick={onBack}
      >
        <ArrowLeft size={18} />
        Voltar ao catálogo
      </button>

      <header className="account-hero">
        <div className="account-hero-avatar">
          {initial}
        </div>

        <div className="account-hero-info">
          <p className="account-kicker">
            MINHA CONTA
          </p>

          <h1>{user.username}</h1>

          <p className="account-email">
            {user.email}
          </p>
        </div>
      </header>

      <section className="account-stats-modern">
        <article className="account-stat-card">
          <div className="account-stat-icon account-stat-green">
            <Clapperboard size={25} />
          </div>

          <div>
            <strong>
              {myMovies.length}
            </strong>

            <span>
              Filmes assistidos
            </span>
          </div>
        </article>

        <article className="account-stat-card">
          <div className="account-stat-icon account-stat-yellow">
            <Star size={25} />
          </div>

          <div>
            <strong>
              {reviewedMovies}
            </strong>

            <span>
              Filmes avaliados
            </span>
          </div>
        </article>

        <article className="account-stat-card">
          <div className="account-stat-icon account-stat-blue">
            <MessageSquareText
              size={25}
            />
          </div>

          <div>
            <strong>
              {reviews.length}
            </strong>

            <span>
              Avaliações publicadas
            </span>
          </div>
        </article>
      </section>

      <section className="account-content-section">
        <div className="account-section-title">
          <div>
            <p className="account-kicker">
              SEU HISTÓRICO
            </p>

            <h2>Seus filmes</h2>
          </div>
        </div>

        {moviesLoading && (
          <p className="account-muted">
            Carregando seus filmes...
          </p>
        )}

        {historyError && (
          <p className="error">
            {historyError}
          </p>
        )}

        {!moviesLoading &&
          !historyError &&
          myMovies.length === 0 && (
            <div className="account-empty-modern">
              <Clapperboard
                size={34}
              />

              <h3>
                Seu diário começa com um filme.
              </h3>

              <p>
                Marque um filme como assistido
                ou publique uma avaliação.
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
          !historyError &&
          myMovies.length > 0 && (
            <div className="account-poster-row">
              {myMovies.map(
                (movie) => (
                  <button
                    type="button"
                    className="account-poster-card"
                    key={movie.movie_id}
                    onClick={() =>
                      onOpenMovie(
                        movie.movie_id
                      )
                    }
                  >
                    <div className="account-poster-image">
                      {movie.url_poster ? (
                        <img
                          src={movie.url_poster}
                          alt={`Pôster de ${movie.titulo}`}
                          loading="lazy"
                        />
                      ) : (
                        <div className="account-no-poster">
                          <Clapperboard
                            size={30}
                          />
                        </div>
                      )}
                    </div>

                    <div className="account-poster-details">
                      <h3>
                        {movie.titulo}
                      </h3>

                      <span className="account-poster-year">
                        {movie.ano_lancamento ??
                          "Ano desconhecido"}
                      </span>

                      {movie.nota !== null ? (
                        <span className="account-poster-rating">
                          <Star
                            size={14}
                            fill="currentColor"
                          />

                          {formatRating(
                            movie.nota
                          )}
                        </span>
                      ) : (
                        <span className="account-watched">
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

      <section className="account-content-section">
        <div className="account-section-title">
          <div>
            <p className="account-kicker">
              SUA CONTRIBUIÇÃO
            </p>

            <h2>
              Filmes criados por você
            </h2>
          </div>
        </div>

        {createdMoviesLoading && (
          <p className="account-muted">
            Carregando filmes criados...
          </p>
        )}

        {createdMoviesError && (
          <p className="error">
            {createdMoviesError}
          </p>
        )}

        {!createdMoviesLoading &&
          !createdMoviesError &&
          createdMovies.length === 0 && (
            <div className="account-empty-modern">
              <div className="account-empty-plus">
                <Plus size={26} />
              </div>

              <h3>
                Você ainda não adicionou
                nenhum filme.
              </h3>

              <p>
                Os filmes adicionados por você
                aparecerão aqui.
              </p>
            </div>
          )}

        {!createdMoviesLoading &&
          !createdMoviesError &&
          createdMovies.length > 0 && (
            <div className="account-poster-row">
              {createdMovies.map(
                (movie) => (
                  <button
                    type="button"
                    className="account-poster-card"
                    key={movie.sk_movie_id}
                    onClick={() =>
                      onOpenMovie(
                        movie.sk_movie_id
                      )
                    }
                  >
                    <div className="account-poster-image">
                      {movie.url_poster ? (
                        <img
                          src={movie.url_poster}
                          alt={`Pôster de ${movie.titulo}`}
                          loading="lazy"
                        />
                      ) : (
                        <div className="account-no-poster">
                          <Clapperboard
                            size={30}
                          />
                        </div>
                      )}
                    </div>

                    <div className="account-poster-details">
                      <h3>
                        {movie.titulo}
                      </h3>

                      <span className="account-poster-year">
                        {movie.ano_lancamento ??
                          "Ano desconhecido"}
                      </span>

                      <span className="account-created-label">
                        Criado por você
                      </span>
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