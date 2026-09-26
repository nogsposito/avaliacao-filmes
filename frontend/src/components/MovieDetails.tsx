
import { useEffect, useState } from "react";
import {
  getMovie,
  type MovieDetail,
} from "../services/movies";

interface MovieDetailsProps {
  movieId: string;
  onBack: () => void;
}

function MovieDetails({
  movieId,
  onBack,
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
              : "Erro ao carregar o filme."
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
        <p>Carregando detalhes...</p>
      </main>
    );
  }

  if (error || !movie) {
    return (
      <main className="container">
        <button className="back-button" onClick={onBack}>
          ← Voltar
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
      <button className="back-button" onClick={onBack}>
        Voltar ao catálogo
      </button>

      <section className="details-layout">
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
          <p className="eyebrow">DETALHES DO FILME</p>
          <h1>{movie.titulo}</h1>

          <p className="details-meta">
            {movie.ano_lancamento ?? "Ano desconhecido"}
            {movie.duracao_minutos
              ? ` · ${movie.duracao_minutos} min`
              : ""}
          </p>

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
                ? `★ ${movie.nota_media.toFixed(1)} / 5`
                : "Ainda sem avaliações"}
            </strong>

            <span>
              {movie.total_avaliacoes} avaliações
            </span>
          </div>

          <h2>Sinopse</h2>
          <p className="details-synopsis">
            {movie.sinopse || "Sinopse indisponível."}
          </p>

          <h2>Direção</h2>
          <p>
            {directors.length > 0
              ? directors
                  .map((director) => director.nome_pessoa)
                  .join(", ")
              : "Não informada"}
          </p>

          {movie.companies.length > 0 && (
            <>
              <h2>Produtoras</h2>
              <p>{movie.companies.join(", ")}</p>
            </>
          )}
        </div>
      </section>

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
                  <span>★ {review.nota.toFixed(1)} / 5</span>
                </div>

                <p>{review.comentario}</p>

                <small>
                  {new Date(
                    review.created_at
                  ).toLocaleDateString("pt-BR")}
                </small>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default MovieDetails;
