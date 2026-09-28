import {
  useEffect,
  useState,
} from "react";

import MovieCarousel from "./MovieCarousel";
import MovieCarouselCard from "./MovieCarouselCard";
import MovieLoader from "./MovieLoader";

import {
  getFeaturedMovies,
  getHomeCategories,
  getRecentReviews,
  type HomeCategory,
  type Movie,
  type RecentReview,
} from "../services/movies";

const CATEGORY_TRANSLATIONS: Record<
  string,
  string
> = {
  Action: "Ação",
  Adventure: "Aventura",
  Animation: "Animação",
  Comedy: "Comédia",
  Crime: "Crime",
  Documentary: "Documentário",
  Drama: "Drama",
  Family: "Família",
  Fantasy: "Fantasia",
  History: "História",
  Horror: "Terror",
  Music: "Música",
  Mystery: "Mistério",
  Romance: "Romance",
  "Science Fiction": "Ficção científica",
  "TV Movie": "Filme para TV",
  Thriller: "Suspense",
  War: "Guerra",
  Western: "Faroeste",

  Classics: "Clássicos",
  Recent: "Filmes recentes",
};

function translateCategory(
  category: string
) {
  return (
    CATEGORY_TRANSLATIONS[category] ??
    category
  );
}

interface HomePageProps {
  onOpenMovie: (movieId: string) => void;
  onOpenCatalog: () => void;
  onCreateMovie: () => void;
}

function HomePage({
  onOpenMovie,
  onOpenCatalog,
  onCreateMovie,
}: HomePageProps) {
  const [featuredMovies, setFeaturedMovies] =
    useState<Movie[]>([]);

  const [recentReviews, setRecentReviews] =
    useState<RecentReview[]>([]);

  const [categories, setCategories] =
    useState<HomeCategory[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    let active = true;

    async function loadHome() {
      setLoading(true);
      setError("");

      try {
        const [
          featured,
          reviews,
          homeCategories,
        ] = await Promise.all([
          getFeaturedMovies(18),
          getRecentReviews(18),
          getHomeCategories(10),
        ]);

        if (!active) {
          return;
        }

        setFeaturedMovies(featured);
        setRecentReviews(reviews);
        setCategories(homeCategories);
      } catch (err) {
        if (!active) {
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : "Não foi possível carregar a página inicial."
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadHome();

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return <MovieLoader />;
  }

  return (
    <>
      <header className="header">
        <div>
          <p className="eyebrow">
            DESCUBRA · AVALIE · COMPARTILHE
          </p>

          <h1>
            Seu universo de filmes.
          </h1>

          <p className="subtitle">
            Explore o catálogo, encontre novas
            histórias e compartilhe o que achou.
          </p>
        </div>

        <div className="header-actions">
          <button
            type="button"
            className="primary-button"
            onClick={onCreateMovie}
          >
            + Novo filme
          </button>
        </div>
      </header>

      {error && (
        <p
          className="error"
          role="alert"
        >
          {error}
        </p>
      )}

      {/* EM DESTAQUE */}

      {featuredMovies.length > 0 && (
        <MovieCarousel
          eyebrow="PARA DESCOBRIR"
          title="Em destaque"
        >
          {featuredMovies.map(
            (movie) => (
              <MovieCarouselCard
                key={movie.sk_movie_id}
                movie={movie}
                onOpen={onOpenMovie}
              />
            )
          )}
        </MovieCarousel>
      )}

      {/* AVALIAÇÕES RECENTES */}

      {recentReviews.length > 0 && (
        <MovieCarousel
          eyebrow="DA COMUNIDADE"
          title="Avaliações recentes"
        >
          {recentReviews.map(
            (review) => (
              <button
                type="button"
                className="carousel-review-card"
                key={
                  review.sk_movie_review_id
                }
                onClick={() =>
                  onOpenMovie(
                    review.sk_movie_id
                  )
                }
              >
                <div className="carousel-review-poster">
                  {review.url_poster ? (
                    <img
                      src={
                        review.url_poster
                      }
                      alt={`Pôster de ${review.titulo}`}
                      loading="lazy"
                    />
                  ) : (
                    <span>
                      Sem pôster
                    </span>
                  )}
                </div>

                <div className="carousel-review-info">
                  <h3>
                    {review.titulo}
                  </h3>

                  <div className="carousel-review-meta">
                    <strong>
                      ★ {review.nota}/5
                    </strong>

                    <span>
                      {review.nome}
                    </span>
                  </div>

                  <p>
                    {review.comentario}
                  </p>
                </div>
              </button>
            )
          )}
        </MovieCarousel>
      )}

      {/* CATEGORIAS */}

      {categories.map(
        (category) => (
          <MovieCarousel
            key={category.id}
            eyebrow="EXPLORE"
            title={translateCategory(
              category.title
            )}
          >
            {category.movies.map(
              (movie) => (
                <MovieCarouselCard
                  key={
                    movie.sk_movie_id
                  }
                  movie={movie}
                  onOpen={
                    onOpenMovie
                  }
                />
              )
            )}
          </MovieCarousel>
        )
      )}

      {/* CATÁLOGO COMPLETO */}

      <button
        type="button"
        className="full-catalog-link"
        onClick={onOpenCatalog}
      >
        <div>
          <p className="eyebrow">
            EXPLORE TUDO
          </p>

          <h2>
            Catálogo completo
          </h2>
        </div>

        <span
          className="full-catalog-arrow"
          aria-hidden="true"
        >
          →
        </span>
      </button>
    </>
  );
}

export default HomePage;