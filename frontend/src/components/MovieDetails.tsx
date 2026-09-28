
import { useEffect, useState } from "react";

import ReviewForm from "./ReviewForm";
import MovieLoader from "./MovieLoader";

import { useAuth } from "../auth/AuthContext";

import {
  getMovie,
  getMovieWatchStatus,
  markMovieAsWatched,
  unmarkMovieAsWatched,
  type MovieDetail,
} from "../services/movies";

import { formatRating } from "../utils/ratings";

interface MovieDetailsProps {
  movieId: string;
  onBack: () => void;
  onEdit: () => void;
  onDelete: (movie: MovieDetail) => void;
  onLogin: () => void;
  onRegister: () => void;
}

function MovieDetails({
  movieId,
  onBack,
  onEdit,
  onDelete,
  onLogin,
  onRegister,
}: MovieDetailsProps) {
  const [movie, setMovie] =
    useState<MovieDetail | null>(null);

  const { user, token } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [watched, setWatched] = useState(false);
  const [watchLoading, setWatchLoading] = useState(false);

  const [reviewsRefreshKey, setReviewsRefreshKey] =
    useState(0);

  useEffect(() => {
    let active = true;

    async function loadMovie() {
      setLoading(true);
      setError("");

      try {
        const data = await getMovie(movieId);

        if (active) {
          setMovie(data);
        }
      } catch (error) {
        if (active) {
          setError(
            error instanceof Error
              ? error.message
              : "Não foi possível carregar o filme."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadMovie();

    return () => {
      active = false;
    };
  }, [movieId, reviewsRefreshKey]);

  useEffect(() => {
    let active = true;

    async function loadWatchStatus() {
      if (!user || !token) {
        setWatched(false);
        return;
      }

      try {
        const data = await getMovieWatchStatus(
          movieId,
          token
        );

        if (active) {
          setWatched(data.watched);
        }
      } catch (error) {
        console.error(
          "Erro ao carregar status de assistido:",
          error
        );
      }
    }

    loadWatchStatus();

    return () => {
      active = false;
    };
  }, [movieId, user, token]);

  async function handleWatchToggle() {
    if (!token || watchLoading) {
      return;
    }

    setWatchLoading(true);

    try {
      if (watched) {
        await unmarkMovieAsWatched(
          movieId,
          token
        );

        setWatched(false);
      } else {
        await markMovieAsWatched(
          movieId,
          token
        );

        setWatched(true);
      }
    } catch (error) {
      console.error(
        "Erro ao alterar status de assistido:",
        error
      );
    } finally {
      setWatchLoading(false);
    }
  }

  if (loading) {
    return (
      <main className="container">
        <MovieLoader />
      </main>
    );
  }

  if (error || !movie) {
    return (
      <main className="container">
        <button
          type="button"
          className="back-button"
          onClick={onBack}
        >
          Voltar ao catálogo
        </button>

        <p className="error">
          {error || "Filme não encontrado."}
        </p>
      </main>
    );
  }

  const directors = (movie.people ?? []).filter(
    (person) => person.tipo_pessoa === "Diretor"
  );

  const reviews = [...(movie.reviews ?? [])].sort(
    (a, b) =>
      new Date(b.created_at).getTime() -
      new Date(a.created_at).getTime()
  );

  const userReview = user
    ? reviews.find(
        (review) =>
          review.user_id === user.id
      ) ?? null
    : null;

  return (
    <main className="container">
      <button
        type="button"
        className="back-button"
        onClick={onBack}
      >
        Voltar ao catálogo
      </button>

      <div className="details-layout">
        <div className="details-poster">
          {movie.url_poster ? (
            <img
              src={movie.url_poster}
              alt={`Pôster de ${movie.titulo}`}
            />
          ) : (
            <span>Sem pôster</span>
          )}
        </div>

        <div className="details-content">
          <p className="eyebrow">
            ROCKETLAB · ADMIN
          </p>

          <h1>{movie.titulo}</h1>

          <div className="details-meta">
            <span>
              {movie.ano_lancamento ??
                "Ano desconhecido"}
            </span>

            {movie.duracao_minutos && (
              <span>
                {movie.duracao_minutos} min
              </span>
            )}

            {movie.status_filme && (
              <span>
                {movie.status_filme}
              </span>
            )}
          </div>

          <div className="genre-list">
            {(movie.genres ?? []).map((genre) => (
              <span
                className="genre-tag"
                key={genre}
              >
                {genre}
              </span>
            ))}
          </div>

          <div className="rating-summary">
            <strong>
              {movie.nota_media != null
                ? formatRating(movie.nota_media)
                : "Ainda sem nota"}
            </strong>

            <span>
              {movie.total_avaliacoes} avaliações
            </span>
          </div>

          {user && (
            <button
              type="button"
              className={
                watched
                  ? "watched-button watched"
                  : "watched-button"
              }
              onClick={handleWatchToggle}
              disabled={watchLoading}
            >
              {watchLoading
                ? "Salvando..."
                : watched
                  ? "Assistido"
                  : "Marcar como assistido"}
            </button>
          )}

          <div className="movie-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={onEdit}
              title="Editar informações do filme"
            >
              Editar filme
            </button>

            <button
              type="button"
              className="danger-button"
              onClick={() => onDelete(movie)}
              title="Excluir filme do catálogo"
            >
              Excluir
            </button>
          </div>

          <section className="details-synopsis">
            <h2>Sinopse</h2>

            <p>
              {movie.sinopse ||
                "Sinopse indisponível."}
            </p>
          </section>

          <section>
            <h2>Direção</h2>

            <p>
              {directors.length > 0
                ? directors
                    .map(
                      (director) =>
                        director.nome_pessoa
                    )
                    .join(", ")
                : "Diretor não informado."}
            </p>
          </section>

          {(movie.companies ?? []).length > 0 && (
            <section>
              <h2>Produtoras</h2>

              <p>
                {movie.companies.join(", ")}
              </p>
            </section>
          )}
        </div>
      </div>

      <section className="reviews-section">
        <h2>Avaliações</h2>

        {user ? (
          <ReviewForm
            movieId={movie.sk_movie_id}
            onSaved={() =>
              setReviewsRefreshKey(
                (value) => value + 1
              )
            }
          />
        ) : (
          <div className="review-login-prompt">
            <div className="review-login-icon">
              ★
            </div>

            <div className="review-login-copy">
              <h3>
                O que você achou deste filme?
              </h3>

              <p>
                Entre na sua conta para dar
                uma nota e compartilhar sua
                opinião.
              </p>
            </div>

            <div className="review-login-actions">
              <button
                type="button"
                className="primary-button"
                onClick={onLogin}
              >
                Entrar para avaliar
              </button>

              <button
                type="button"
                className="secondary-button"
                onClick={onRegister}
              >
                Criar conta
              </button>
            </div>
          </div>
        )}

        <div className="reviews-list">
          {reviews.length === 0 ? (
            <p>
              Este filme ainda não possui
              avaliações.
            </p>
          ) : (
            reviews.map((review) => (
              <article
                key={
                  review.sk_movie_review_id
                }
                className="review-card"
              >
                <div className="review-header">
                  <strong>
                    {review.nome}
                  </strong>

                  <span>
                    {formatRating(
                      review.nota
                    )}
                  </span>
                </div>

                <p>
                  {review.comentario}
                </p>

                <small>
                  {new Date(
                    review.created_at
                  ).toLocaleDateString(
                    "pt-BR"
                  )}
                </small>
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  );
}

export default MovieDetails;
