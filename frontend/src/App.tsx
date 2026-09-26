
import { useEffect, useState } from "react";

import DeleteMovieDialog from "./components/DeleteMovieDialog";
import MovieDetails from "./components/MovieDetails";
import MovieForm from "./components/MovieForm";

import {
  deleteMovie,
  getMovie,
  getMovies,
  type Movie,
  type MovieDetail,
} from "./services/movies";

import "./App.css";

function App() {
  const [movies, setMovies] = useState<Movie[]>([]);

  const [selectedMovieId, setSelectedMovieId] =
    useState<string | null>(null);

  const [editingMovie, setEditingMovie] =
    useState<MovieDetail | null>(null);

  const [movieToDelete, setMovieToDelete] =
    useState<MovieDetail | null>(null);

  const [showCreateForm, setShowCreateForm] =
    useState(false);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const [refreshKey, setRefreshKey] = useState(0);

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
  }, [page, search, refreshKey]);

  async function handleEdit(movieId: string) {
    try {
      const movie = await getMovie(movieId);
      setEditingMovie(movie);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Erro ao carregar o filme."
      );
    }
  }

  function handleSaved(movie: MovieDetail) {
    setEditingMovie(null);
    setShowCreateForm(false);
    setSelectedMovieId(movie.sk_movie_id);
    setRefreshKey((value) => value + 1);
  }

  function openDeleteDialog(movie: MovieDetail) {
    setMovieToDelete(movie);
    setDeleteError("");
  }

  function closeDeleteDialog() {
    if (deleting) return;

    setMovieToDelete(null);
    setDeleteError("");
  }

  async function handleDelete() {
    if (!movieToDelete || deleting) return;

    setDeleting(true);
    setDeleteError("");

    try {
      await deleteMovie(movieToDelete.sk_movie_id);

      setMovieToDelete(null);
      setSelectedMovieId(null);

      if (page !== 1) {
        setPage(1);
      } else {
        setRefreshKey((value) => value + 1);
      }
    } catch (error) {
      setDeleteError(
        error instanceof Error
          ? error.message
          : "Não foi possível excluir o filme."
      );
    } finally {
      setDeleting(false);
    }
  }

  if (editingMovie) {
    return (
      <MovieForm
        key={editingMovie.sk_movie_id}
        movie={editingMovie}
        onCancel={() => setEditingMovie(null)}
        onSaved={handleSaved}
      />
    );
  }

  if (showCreateForm) {
    return (
      <MovieForm
        onCancel={() => setShowCreateForm(false)}
        onSaved={handleSaved}
      />
    );
  }

  if (selectedMovieId) {
    return (
      <>
        <MovieDetails
          key={refreshKey}
          movieId={selectedMovieId}
          onBack={() => setSelectedMovieId(null)}
          onEdit={() => handleEdit(selectedMovieId)}
          onDelete={openDeleteDialog}
        />

        {movieToDelete && (
          <DeleteMovieDialog
            movieTitle={movieToDelete.titulo}
            deleting={deleting}
            error={deleteError}
            onCancel={closeDeleteDialog}
            onConfirm={handleDelete}
          />
        )}
      </>
    );
  }

  return (
    <main className="container">
      <header className="header">
        <div>
          <p className="eyebrow">ROCKETLAB · ADMIN</p>
          <h1>Catálogo de filmes</h1>
          <p className="subtitle">
            Consulte e gerencie os filmes cadastrados.
          </p>
        </div>

        <button
          type="button"
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

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

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
              onClick={() =>
                setSelectedMovieId(movie.sk_movie_id)
              }
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
                  {movie.ano_lancamento ??
                    "Ano desconhecido"}
                </p>

                <p className="synopsis">
                  {movie.sinopse ||
                    "Sinopse indisponível."}
                </p>
              </div>
            </button>
          ))}
        </section>
      )}

      {!loading && !error && totalPages > 1 && (
        <nav className="pagination">
          <button
            type="button"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            Anterior
          </button>

          <span>
            Página {page} de {totalPages}
          </span>

          <button
            type="button"
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
