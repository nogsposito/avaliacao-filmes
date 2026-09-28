import {
  useEffect,
  useState,
} from "react";

import { useAuth } from "./auth/AuthContext";

import AccountPage from "./components/AccountPage";
import DeleteMovieDialog from "./components/DeleteMovieDialog";
import FullCatalogPage from "./components/FullCatalogPage";
import HomePage from "./components/HomePage";
import LoginPage from "./components/LoginPage";
import MovieDetails from "./components/MovieDetails";
import MovieForm from "./components/MovieForm";
import MovieLoader from "./components/MovieLoader";
import RegisterPage from "./components/RegisterPage";

import {
  deleteMovie,
  getMovie,
  type MovieDetail,
} from "./services/movies";

import "./App.css";

type AuthScreen =
  | "login"
  | "register"
  | null;

type AppScreen =
  | "home"
  | "catalog"
  | "account"
  | "movie";

function getScreenFromPath(): AppScreen {
  const path =
    window.location.pathname;

  if (path === "/catalog") {
    return "catalog";
  }

  if (path === "/account") {
    return "account";
  }

  if (
    /^\/movies\/([^/]+)\/?$/.test(
      path
    )
  ) {
    return "movie";
  }

  return "home";
}

function getMovieIdFromPath():
  | string
  | null {
  const match =
    window.location.pathname.match(
      /^\/movies\/([^/]+)\/?$/
    );

  return match
    ? decodeURIComponent(match[1])
    : null;
}

function App() {
  const {
    user,
    token,
    loading: authLoading,
    signOut,
  } = useAuth();

  const [screen, setScreen] =
    useState<AppScreen>(
      getScreenFromPath
    );

  const [
    selectedMovieId,
    setSelectedMovieId,
  ] = useState<string | null>(
    getMovieIdFromPath
  );

  const [
    authScreen,
    setAuthScreen,
  ] =
    useState<AuthScreen>(null);

  const [
    accountMenuOpen,
    setAccountMenuOpen,
  ] = useState(false);

  const [
    editingMovie,
    setEditingMovie,
  ] =
    useState<MovieDetail | null>(
      null
    );

  const [
    movieToDelete,
    setMovieToDelete,
  ] =
    useState<MovieDetail | null>(
      null
    );

  const [
    showCreateForm,
    setShowCreateForm,
  ] = useState(false);

  const [
    deleting,
    setDeleting,
  ] = useState(false);

  const [
    deleteError,
    setDeleteError,
  ] = useState("");

  const [
    appError,
    setAppError,
  ] = useState("");

  const [
    refreshKey,
    setRefreshKey,
  ] = useState(0);

  const [
    catalogSearch,
    setCatalogSearch,
  ] = useState("");

  function navigate(
    path: string,
    nextScreen: AppScreen
  ) {
    window.history.pushState(
      {},
      "",
      path
    );

    setScreen(nextScreen);

    setSelectedMovieId(
      nextScreen === "movie"
        ? getMovieIdFromPath()
        : null
    );

    setAccountMenuOpen(false);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function openHome() {
    setAuthScreen(null);
    setEditingMovie(null);
    setShowCreateForm(false);
    setCatalogSearch("");

    navigate(
      "/",
      "home"
    );
  }

  function openCatalog() {
    setAuthScreen(null);
    setEditingMovie(null);
    setShowCreateForm(false);
    setCatalogSearch("");

    navigate(
      "/catalog",
      "catalog"
    );
  }

  function searchCatalog(
    search: string
  ) {
    setCatalogSearch(search);

    navigate(
      "/catalog",
      "catalog"
    );
  }

  function openAccount() {
    navigate(
      "/account",
      "account"
    );
  }

  function openMovie(
    movieId: string
  ) {
    window.history.pushState(
      {},
      "",
      `/movies/${encodeURIComponent(
        movieId
      )}`
    );

    setSelectedMovieId(movieId);
    setScreen("movie");
    setAccountMenuOpen(false);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  useEffect(() => {
    function handlePopState() {
      const nextScreen =
        getScreenFromPath();

      setScreen(nextScreen);

      setSelectedMovieId(
        getMovieIdFromPath()
      );

      setAuthScreen(null);
      setEditingMovie(null);
      setShowCreateForm(false);
      setAccountMenuOpen(false);
    }

    window.addEventListener(
      "popstate",
      handlePopState
    );

    return () => {
      window.removeEventListener(
        "popstate",
        handlePopState
      );
    };
  }, []);

  async function handleEdit(
    movieId: string
  ) {
    setAppError("");

    try {
      const movie =
        await getMovie(movieId);

      if (
        !user ||
        movie.created_by_user_id !==
          user.id
      ) {
        setAppError(
          "Você só pode editar filmes adicionados por você."
        );
        return;
      }

      setEditingMovie(movie);
    } catch (err) {
      setAppError(
        err instanceof Error
          ? err.message
          : "Erro ao carregar o filme."
      );
    }
  }

  function handleSaved(
    movie: MovieDetail
  ) {
    setEditingMovie(null);
    setShowCreateForm(false);

    openMovie(
      movie.sk_movie_id
    );

    setRefreshKey(
      (value) => value + 1
    );
  }

  function openDeleteDialog(
    movie: MovieDetail
  ) {
    if (
      !user ||
      movie.created_by_user_id !==
        user.id
    ) {
      setAppError(
        "Você só pode excluir filmes adicionados por você."
      );
      return;
    }

    setMovieToDelete(movie);
    setDeleteError("");
  }

  function closeDeleteDialog() {
    if (deleting) {
      return;
    }

    setMovieToDelete(null);
    setDeleteError("");
  }

  async function handleDelete() {
    if (
      !movieToDelete ||
      deleting
    ) {
      return;
    }

    if (!token) {
      setDeleteError(
        "Entre na sua conta para excluir este filme."
      );
      return;
    }

    setDeleting(true);
    setDeleteError("");

    try {
      await deleteMovie(
        movieToDelete.sk_movie_id,
        token
      );

      setMovieToDelete(null);
      setSelectedMovieId(null);

      navigate(
        "/catalog",
        "catalog"
      );
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

    if (screen === "account") {
      openHome();
    }
  }

  if (authLoading) {
    return (
      <main className="container">
        <MovieLoader />
      </main>
    );
  }

  if (!user && authScreen === null) {
    return (
      <LoginPage
        onBack={() => {}}
        onRegister={() =>
          setAuthScreen("register")
        }
        onSuccess={
          handleAuthSuccess
        }
      />
    );
  }

  if (authScreen === "login") {
    return (
      <LoginPage
        onBack={() =>
          setAuthScreen(null)
        }
        onRegister={() =>
          setAuthScreen(
            "register"
          )
        }
        onSuccess={
          handleAuthSuccess
        }
      />
    );
  }

  if (
    authScreen === "register"
  ) {
    return (
      <RegisterPage
        onBack={() =>
          setAuthScreen(null)
        }
        onLogin={() =>
          setAuthScreen("login")
        }
        onSuccess={
          handleAuthSuccess
        }
      />
    );
  }

  if (editingMovie) {
    return (
      <MovieForm
        key={
          editingMovie.sk_movie_id
        }
        movie={editingMovie}
        onCancel={() =>
          setEditingMovie(null)
        }
        onSaved={handleSaved}
      />
    );
  }

  if (showCreateForm) {
    return (
      <MovieForm
        onCancel={() =>
          setShowCreateForm(false)
        }
        onSaved={handleSaved}
      />
    );
  }

  if (
    screen === "account"
  ) {
    return (
      <AccountPage
        onBack={openHome}
        onOpenMovie={openMovie}
      />
    );
  }

  if (
    screen === "movie" &&
    selectedMovieId
  ) {
    return (
      <>
        <MovieDetails
          key={refreshKey}
          movieId={
            selectedMovieId
          }
          onBack={openHome}
          onEdit={() =>
            handleEdit(
              selectedMovieId
            )
          }
          onDelete={
            openDeleteDialog
          }
          onLogin={() =>
            setAuthScreen(
              "login"
            )
          }
          onRegister={() =>
            setAuthScreen(
              "register"
            )
          }
        />

        {movieToDelete && (
          <DeleteMovieDialog
            movieTitle={
              movieToDelete.titulo
            }
            deleting={deleting}
            error={deleteError}
            onCancel={
              closeDeleteDialog
            }
            onConfirm={
              handleDelete
            }
          />
        )}
      </>
    );
  }

  return (
    <main className="container">
      <nav
        className="site-nav"
        aria-label="Navegação principal"
      >
        <button
          type="button"
          className="site-brand"
          onClick={openHome}
        >
          <span className="site-brand-mark">
            ▶
          </span>

          <span>
            ROCKETLAB FILMES
          </span>
        </button>

        <form
          className="nav-search"
          onSubmit={(event) => {
            event.preventDefault();

            const form =
              event.currentTarget;

            const input =
              form.elements.namedItem(
                "movie-search"
              ) as HTMLInputElement;

            const value =
              input.value.trim();

            if (value) {
              searchCatalog(value);
            }
          }}
        >
          <input
            type="search"
            name="movie-search"
            aria-label="Pesquisar filmes"
            placeholder="Pesquisar filmes..."
          />

          <button
            type="submit"
            aria-label="Pesquisar"
          >
            →
          </button>
        </form>

        <div className="site-nav-actions">
          {user ? (
            <div className="account-menu-wrapper">
              <button
                type="button"
                className="account-trigger"
                aria-expanded={
                  accountMenuOpen
                }
                aria-haspopup="true"
                onClick={() =>
                  setAccountMenuOpen(
                    (value) =>
                      !value
                  )
                }
              >
                <span className="account-avatar">
                  {user.username
                    .charAt(0)
                    .toUpperCase()}
                </span>

                <span className="account-trigger-name">
                  {user.username}
                </span>
              </button>

              {accountMenuOpen && (
                <div className="account-dropdown">
                  <div className="account-dropdown-header">
                    <span className="account-avatar account-avatar-large">
                      {user.username
                        .charAt(0)
                        .toUpperCase()}
                    </span>

                    <div>
                      <strong>
                        {user.username}
                      </strong>

                      <small>
                        {user.email}
                      </small>
                    </div>
                  </div>

                  <div className="account-dropdown-divider" />

                  <button
                    type="button"
                    className="account-logout"
                    onClick={
                      openAccount
                    }
                  >
                    Minha conta
                  </button>

                  <button
                    type="button"
                    className="account-logout"
                    onClick={
                      handleSignOut
                    }
                  >
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
                onClick={() =>
                  setAuthScreen(
                    "login"
                  )
                }
              >
                Entrar
              </button>

              <button
                type="button"
                className="nav-register"
                onClick={() =>
                  setAuthScreen(
                    "register"
                  )
                }
              >
                Criar conta
              </button>
            </>
          )}
        </div>
      </nav>

      {appError && (
        <p
          className="error"
          role="alert"
        >
          {appError}
        </p>
      )}

      {screen === "catalog" ? (
        <FullCatalogPage
          onBack={openHome}
          onOpenMovie={openMovie}
          initialSearch={
            catalogSearch
          }
        />
      ) : (
        <HomePage
          onOpenMovie={openMovie}
          onOpenCatalog={openCatalog}
          onCreateMovie={() =>
            setShowCreateForm(
              true
            )
          }
        />
      )}
    </main>
  );
}

export default App;