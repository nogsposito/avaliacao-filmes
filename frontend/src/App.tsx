
import { useEffect, useState } from "react";

import { useAuth } from "./auth/AuthContext";

import DeleteMovieDialog from "./components/DeleteMovieDialog";
import LoginPage from "./components/LoginPage";
import MovieDetails from "./components/MovieDetails";
import MovieForm from "./components/MovieForm";
import MovieLoader from "./components/MovieLoader";
import RegisterPage from "./components/RegisterPage";

import {
  deleteMovie,
  getMovie,
  getMovies,
  type Movie,
  type MovieDetail,
} from "./services/movies";

import "./App.css";

type AuthScreen = "login" | "register" | null;

function App() {
  const { user, loading: authLoading, signOut } = useAuth();

  const [authScreen, setAuthScreen] =
    useState<AuthScreen>(null);

  const [accountMenuOpen, setAccountMenuOpen] =
    useState(false);

  const [movies, setMovies] = useState<Movie[]>([]);

  const [selectedMovieId, setSelectedMovieId] =
    useState<string | null>(() => {
      const match = window.location.pathname.match(
        /^\/movies\/([^/]+)\/?$/
      );

      return match
        ? decodeURIComponent(match[1])
        : null;
    });

  function openMovie(movieId: string) {
    window.history.pushState(
      {},
      "",
      `/movies/${encodeURIComponent(movieId)}`
    );

    setSelectedMovieId(movieId);
  }

  function closeMovie() {
    window.history.pushState({}, "", "/");
    setSelectedMovieId(null);
  }

  useEffect(() => {
    function handlePopState() {
      const match = window.location.pathname.match(
        /^\/movies\/([^/]+)\/?$/
      );

      setSelectedMovieId(
        match ? decodeURIComponent(match[1]) : null
      );
    }

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener(
        "popstate",
        handlePopState
      );
    };
  }, []);

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
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
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
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erro ao carregar o filme."
      );
    }
  }

  function handleSaved(movie: MovieDetail) {
    setEditingMovie(null);
    setShowCreateForm(false);
    openMovie(movie.sk_movie_id);
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
    } catch (err) {
      setDeleteError(
        err instanceof Error
          ? err.message
          : "Não foi possível excluir o filme."
      );
    } finally {
      setDeleting(false);
    }
  }

  function handleAuthSuccess() {
    setAuthScreen(null);
    setAccountMenuOpen(false);
  }

  function handleSignOut() {
    signOut();
    setAccountMenuOpen(false);
  }

  function goToCatalog() {
    setAuthScreen(null);
    closeMovie();
    setEditingMovie(null);
    setShowCreateForm(false);
  }

  if (authLoading) {
    return (
      <main className="container">
        <MovieLoader />
      </main>
    );
  }

  if (authScreen === "login") {
    return (
      <LoginPage
        onBack={() => setAuthScreen(null)}
        onRegister={() => setAuthScreen("register")}
        onSuccess={handleAuthSuccess}
      />
    );
  }

  if (authScreen === "register") {
    return (
      <RegisterPage
        onBack={() => setAuthScreen(null)}
        onLogin={() => setAuthScreen("login")}
        onSuccess={handleAuthSuccess}
      />
    );
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
          onBack={closeMovie}
          onEdit={() => handleEdit(selectedMovieId)}
          onDelete={openDeleteDialog}
          onLogin={() => setAuthScreen("login")}
          onRegister={() => setAuthScreen("register")}
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
      <nav className="site-nav" aria-label="Navegação principal">
        <button
          type="button"
          className="site-brand"
          onClick={goToCatalog}
        >
          <span className="site-brand-mark">▶</span>
          <span>ROCKETLAB FILMES</span>
        </button>

        <div className="site-nav-actions">
          {user ? (
            <div className="account-menu-wrapper">
              <button
                type="button"
                className="account-trigger"
                aria-expanded={accountMenuOpen}
                aria-haspopup="true"
                onClick={() =>
                  setAccountMenuOpen((value) => !value)
                }
              >
                <span className="account-avatar">
                  {user.username.charAt(0).toUpperCase()}
                </span>

                <span className="account-trigger-name">
                  {user.username}
                </span>

                <span
                  className="account-chevron"
                  aria-hidden="true"
                >
                  {accountMenuOpen ? "⌃" : "⌄"}
                </span>
              </button>

              {accountMenuOpen && (
                <div className="account-dropdown">
                  <div className="account-dropdown-header">
                    <span className="account-avatar account-avatar-large">
                      {user.username.charAt(0).toUpperCase()}
                    </span>

                    <div>
                      <strong>{user.username}</strong>
                      <small>{user.email}</small>
                    </div>
                  </div>

                  <div className="account-dropdown-divider" />

                  <button
                    type="button"
                    className="account-logout"
                    onClick={handleSignOut}
                  >
                    <span aria-hidden="true">↪</span>
                    Sair da conta
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <button
                type="button"
                className="nav-login"
                onClick={() => setAuthScreen("login")}
              >
                Entrar
              </button>

              <button
                type="button"
                className="nav-register"
                onClick={() => setAuthScreen("register")}
              >
                Criar conta
              </button>
            </>
          )}
        </div>
      </nav>

      <header className="header">
        <div>
          <p className="eyebrow">DESCUBRA · AVALIE · COMPARTILHE</p>

          <h1>Seu universo de filmes.</h1>

          <p className="subtitle">
            Explore o catálogo, encontre novas histórias
            e compartilhe o que achou.
          </p>
        </div>

        <div className="header-actions">
          <button
            type="button"
            className="primary-button"
            onClick={() => setShowCreateForm(true)}
          >
            + Novo filme
          </button>
        </div>
      </header>

      <section className="toolbar">
        <input
          type="search"
          aria-label="Pesquisar filmes"
          placeholder="Pesquisar por título..."
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
        />

        <span>{total} filmes encontrados</span>
      </section>

      {loading && <MovieLoader />}

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
              onClick={() => openMovie(movie.sk_movie_id)}
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
        <nav
          className="pagination"
          aria-label="Paginação dos filmes"
        >
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
