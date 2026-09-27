
import { useEffect, useState } from "react";

import ReviewForm from "./ReviewForm";

import { useAuth } from "../auth/AuthContext";

import {
  getMovie,
  type MovieDetail,
} from "../services/movies";

import { formatRating } from "../utils/ratings";
import MovieLoader from "./MovieLoader";

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

  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
          ← Voltar ao catálogo
        </button>

        <p className="error">
          {error || "Filme não encontrado."}
        </p>
      </main>
    );
  }

  const directors = movie.people.filter(
    (person) => person.tipo_pessoa === "Diretor"
  );

  return (
    <main className="container">
      <button
        type="button"
        className="back-button"
        onClick={onBack}
      >
        ← Voltar ao catálogo
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
            {movie.genres.map((genre) => (
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
              {movie.nota_media !== null
                ? `${formatRating(movie.nota_media)} ★`
                : "Ainda sem nota"}
            </strong>

            <span>
              {movie.total_avaliacoes} avaliações
            </span>
          </div>

          <div className="movie-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={onEdit}
              title="Editar informações do filme"
            >
              <span aria-hidden="true">✎</span>
              Editar filme
            </button>

            <button
              type="button"
              className="danger-button"
              onClick={() => onDelete(movie)}
              title="Excluir filme do catálogo"
            >
              <span aria-hidden="true">⌫</span>
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

          {movie.companies.length > 0 && (
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
            onCreated={() =>
              setReviewsRefreshKey((value) => value + 1)
            }
          />
        ) : (
          <div className="review-login-prompt">
            <div className="review-login-icon">★</div>

            <div className="review-login-copy">
              <h3>O que você achou deste filme?</h3>
              <p>
                Entre na sua conta para dar uma nota e
                compartilhar sua opinião.
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
      </section>
    </main>
  );
}

export default MovieDetails;
