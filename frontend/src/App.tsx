
import { useEffect, useState } from "react";

import MovieDetails from "./components/MovieDetails";
import MovieForm from "./components/MovieForm";
import { getMovies, type Movie } from "./services/movies";

import "./App.css";

function App() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [selectedMovieId, setSelectedMovieId] = useState<string | null>(
    null
  );
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadMovies() {
      setLoading(true);
      setError("");

      try {
        const data = await getMovies(page, 12, search);

        if (!active) return;

        setMovies(data.items);
        setTotalPages(data.total_pages);
        setTotal(data.total);
      } catch (error) {
        if (active) {
          setError(
            error instanceof Error
              ? error.message
              : "Erro ao carregar os filmes."
          );
        }
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
  }, [page, search]);


  if (showCreateForm) {
    return (
      <MovieForm
        onCancel={() => setShowCreateForm(false)}
        onCreated={(movie) => {
          setShowCreateForm(false);
          setSelectedMovieId(movie.sk_movie_id);
        }}
      />
    );
  }


  if (selectedMovieId) {
    return (
      <MovieDetails
        movieId={selectedMovieId}
        onBack={() => setSelectedMovieId(null)}
      />
    );
  }

  return (
    <main className="container">
      <header className="header">
        <div>
          <p className="eyebrow">ADMIN</p>
          <h1>Catálogo de filmes</h1>
          <p className="subtitle">
            Consulte e gerencie os filmes cadastrados.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={() => setShowCreateForm(true)}
        >
          + Novo filme
        </button>
        
      </header>

      <section className="toolbar">
        <input
          type="search"
          placeholder="Pesquisar por título..."
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
        />

        <span>{total} filmes encontrados</span>
      </section>

      {loading && <p>Carregando filmes...</p>}

      {error && <p className="error">{error}</p>}

      {!loading && !error && movies.length === 0 && (
        <p>Nenhum filme encontrado.</p>
      )}

      {!loading && !error && (
        <section className="movie-grid">
          {movies.map((movie) => (
            <button
              type="button"
              className="movie-card"
              key={movie.sk_movie_id}
              onClick={() => setSelectedMovieId(movie.sk_movie_id)}
            >
              <div className="poster">
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

              <div className="movie-info">
                <h2>{movie.titulo}</h2>
                <p>
                  {movie.ano_lancamento ?? "Ano desconhecido"}
                </p>
                <p className="synopsis">
                  {movie.sinopse || "Sinopse indisponível."}
                </p>
              </div>
            </button>
          ))}
        </section>
      )}

      {!loading && !error && totalPages > 1 && (
        <nav className="pagination">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            Anterior
          </button>

          <span>
            Página {page} de {totalPages}
          </span>

          <button
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            Próxima
          </button>
        </nav>
      )}
    </main>
  );
}

export default App;
