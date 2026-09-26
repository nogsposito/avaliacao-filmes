
function MovieLoader() {
  return (
    <div
      className="loading-screen"
      role="status"
      aria-label="Carregando filmes"
    >
      <div
        className="loading-symbol"
        aria-hidden="true"
      />

      <p>Preparando sua próxima sessão...</p>
    </div>
  );
}

export default MovieLoader;
