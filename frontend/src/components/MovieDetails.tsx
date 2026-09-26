
import { useEffect, useState } from "react";

import {
  getMovie,
  type MovieDetail,
} from "../services/movies";

interface MovieDetailsProps {
  movieId: string;
  onBack: () => void;
  onEdit: () => void;
}

function MovieDetails({
  movieId,
  onBack,
  onEdit,
}: MovieDetailsProps) {
  const [movie, setMovie] = useState<MovieDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
  }, [movieId]);

  if (loading) {
    return (
      <main className="container">
        <p>Carregando filme...</p>
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
          <p className="eyebrow">ROCKETLAB · ADMIN</p>

          <h1>{movie.titulo}</h1>

          <div className="details-meta">
            <span>
              {movie.ano_lancamento ?? "Ano desconhecido"}
            </span>

            {movie.duracao_minutos && (
              <span>{movie.duracao_minutos} min</span>
            )}

            {movie.status_filme && (
              <span>{movie.status_filme}</span>
            )}
          </div>

          <div className="genre-list">
            {movie.genres.map((genre) => (
              <span className="genre-tag" key={genre}>
                {genre}
              </span>
            ))}
          </div>

          <div className="rating-summary">
            <strong>
              {movie.nota_media !== null
                ? `${movie.nota_media.toFixed(1)} / 5 ★`
                : "Ainda sem nota"}
            </strong>

            <span>
              {movie.total_avaliacoes} avaliações
            </span>
          </div>

          <button
            type="button"
            className="primary-button"
            onClick={onEdit}
          >
            Editar filme
          </button>

          <section className="details-synopsis">
            <h2>Sinopse</h2>
            <p>
              {movie.sinopse || "Sinopse indisponível."}
            </p>
          </section>

          <section>
            <h2>Direção</h2>

            <p>
              {directors.length > 0
                ? directors
                    .map((director) => director.nome_pessoa)
                    .join(", ")
                : "Diretor não informado."}
            </p>
          </section>

          {movie.companies.length > 0 && (
            <section>
              <h2>Produtoras</h2>
              <p>{movie.companies.join(", ")}</p>
            </section>
          )}
        </div>
      </div>

      <section className="reviews-section">
        <h2>Avaliações</h2>

        {movie.reviews.length === 0 ? (
          <p>Este filme ainda não possui avaliações.</p>
        ) : (
          <div className="reviews-list">
            {movie.reviews.map((review) => (
              <article
                className="review-card"
                key={review.sk_movie_review_id}
              >
                <div className="review-header">
                  <strong>{review.nome}</strong>

                  <span>
                    {review.nota.toFixed(1)} / 5 ★
                  </span>
                </div>

                <p>{review.comentario}</p>

                {review.created_at && (
                  <small>
                    {new Date(
                      review.created_at
                    ).toLocaleDateString("pt-BR")}
                  </small>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default MovieDetails;
