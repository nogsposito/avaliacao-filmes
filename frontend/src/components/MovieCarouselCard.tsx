import type {
  Movie,
} from "../services/movies";

interface MovieCarouselCardProps {
  movie: Movie;
  onOpen: (movieId: string) => void;
}

function MovieCarouselCard({
  movie,
  onOpen,
}: MovieCarouselCardProps) {
  return (
    <button
      type="button"
      className="carousel-movie-card"
      onClick={() =>
        onOpen(movie.sk_movie_id)
      }
    >
      <div className="carousel-movie-poster">
        {movie.url_poster ? (
          <img
            src={movie.url_poster}
            alt={`Pôster de ${movie.titulo}`}
            loading="lazy"
          />
        ) : (
          <span>Sem pôster</span>
        )}
      </div>

      <div className="carousel-movie-info">
        <h3>{movie.titulo}</h3>

        <span>
          {movie.ano_lancamento ??
            "Ano desconhecido"}
        </span>
      </div>
    </button>
  );
}

export default MovieCarouselCard;