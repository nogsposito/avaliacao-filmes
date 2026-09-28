import {
  useEffect,
  useState,
} from "react";

import MovieLoader from "./MovieLoader";

import {
  getMovies,
  type Movie,
} from "../services/movies";

interface FullCatalogPageProps {
  onBack: () => void;
  onOpenMovie: (movieId: string) => void;
  initialSearch?: string;
}

function FullCatalogPage({
  onBack,
  onOpenMovie,
  initialSearch = "",
}: FullCatalogPageProps) {
  const [movies, setMovies] =
    useState<Movie[]>([]);

  const [search, setSearch] =
    useState(initialSearch);

  const [page, setPage] =
    useState(1);

  const [totalPages, setTotalPages] =
    useState(0);

  const [total, setTotal] =
    useState(0);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [catalogSeed] =
    useState(() =>
      Math.floor(
        Math.random() * 100000
      )
    );

  useEffect(() => {
    let active = true;

    async function loadMovies() {
      setLoading(true);
      setError("");

      try {
        const data =
          await getMovies(
            page,
            30,
            search,
            catalogSeed
          );

        if (!active) {
          return;
        }

        setMovies(data.items);
        setTotal(data.total);
        setTotalPages(
          data.total_pages
        );
      } catch (err) {
        if (!active) {
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : "Não foi possível carregar o catálogo."
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadMovies();

    return () => {
      active = false;
    };
  }, [
    page,
    search,
    catalogSeed,
  ]);

  return (
    <>
      <button
        type="button"
        className="back-button"
        onClick={onBack}
      >
        ← Voltar para início
      </button>

      <header className="full-catalog-header">
        <p className="eyebrow">
          EXPLORE
        </p>

        <h1>
          Catálogo completo
        </h1>

        <p>
          Todos os filmes disponíveis
          no RocketLab Filmes.
        </p>
      </header>

      <section className="toolbar">
        <input
          type="search"
          aria-label="Pesquisar filmes"
          placeholder="Pesquisar por título..."
          value={search}
          onChange={(event) => {
            setSearch(
              event.target.value
            );

            setPage(1);
          }}
        />

        <span>
          {loading
            ? "Pesquisando..."
            : `${total} filmes encontrados`}
        </span>
      </section>

      {loading && <MovieLoader />}

      {error && (
        <p
          className="error"
          role="alert"
        >
          {error}
        </p>
      )}

      {!loading &&
        !error &&
        movies.length === 0 && (
          <p>
            Nenhum filme encontrado.
          </p>
        )}

      {!loading &&
        !error &&
        movies.length > 0 && (
          <section className="movie-grid">
            {movies.map(
              (movie) => (
                <button
                  type="button"
                  className="movie-card"
                  key={
                    movie.sk_movie_id
                  }
                  onClick={() =>
                    onOpenMovie(
                      movie.sk_movie_id
                    )
                  }
                >
                  <div className="poster">
                    {movie.url_poster ? (
                      <img
                        src={
                          movie.url_poster
                        }
                        alt={`Pôster de ${movie.titulo}`}
                        loading="lazy"
                      />
                    ) : (
                      <span>
                        Sem pôster
                      </span>
                    )}
                  </div>

                  <div className="movie-info">
                    <h2>
                      {movie.titulo}
                    </h2>

                    <span>
                      {movie.ano_lancamento ??
                        "Ano desconhecido"}
                    </span>
                  </div>
                </button>
              )
            )}
          </section>
        )}

      {!loading &&
        !error &&
        totalPages > 1 && (
          <nav
            className="pagination"
            aria-label="Paginação dos filmes"
          >
            <button
              type="button"
              disabled={page === 1}
              onClick={() => {
                setPage(
                  (value) =>
                    value - 1
                );

                window.scrollTo({
                  top: 0,
                  behavior: "smooth",
                });
              }}
            >
              Anterior
            </button>

            <span>
              Página {page} de{" "}
              {totalPages}
            </span>

            <button
              type="button"
              disabled={
                page >= totalPages
              }
              onClick={() => {
                setPage(
                  (value) =>
                    value + 1
                );

                window.scrollTo({
                  top: 0,
                  behavior: "smooth",
                });
              }}
            >
              Próxima
            </button>
          </nav>
        )}
    </>
  );
}

export default FullCatalogPage;