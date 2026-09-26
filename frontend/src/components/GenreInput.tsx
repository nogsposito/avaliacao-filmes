
import { useState, type KeyboardEvent } from "react";

const GENRES = [
  "Ação",
  "Aventura",
  "Animação",
  "Comédia",
  "Crime",
  "Documentário",
  "Drama",
  "Família",
  "Fantasia",
  "Ficção científica",
  "Guerra",
  "História",
  "Mistério",
  "Musical",
  "Romance",
  "Suspense",
  "Terror",
  "Faroeste",
];

interface GenreInputProps {
  value: string[];
  onChange: (genres: string[]) => void;
}

function GenreInput({
  value,
  onChange,
}: GenreInputProps) {
  const [newGenre, setNewGenre] = useState("");
  const [error, setError] = useState("");

  function normalizeGenre(genre: string) {
    return genre.trim().toLocaleLowerCase("pt-BR");
  }

  const availableGenres = [
    ...GENRES,
    ...value.filter(
      (genre) =>
        !GENRES.some(
          (existing) =>
            normalizeGenre(existing) === normalizeGenre(genre)
        )
    ),
  ];

  function toggleGenre(genre: string) {
    const selected = value.some(
      (item) =>
        normalizeGenre(item) === normalizeGenre(genre)
    );

    if (selected) {
      onChange(
        value.filter(
          (item) =>
            normalizeGenre(item) !== normalizeGenre(genre)
        )
      );
    } else {
      onChange([...value, genre]);
    }

    setError("");
  }

  function addGenre() {
    setError("");

    const genre = newGenre.trim();

    if (!genre) return;

    const existingGenre = availableGenres.find(
      (item) =>
        normalizeGenre(item) === normalizeGenre(genre)
    );

    const genreToAdd = existingGenre ?? genre;

    const alreadySelected = value.some(
      (item) =>
        normalizeGenre(item) === normalizeGenre(genreToAdd)
    );

    if (alreadySelected) {
      setError("Esse gênero já está selecionado.");
      return;
    }

    onChange([...value, genreToAdd]);
    setNewGenre("");
  }

  function handleKeyDown(
    event: KeyboardEvent<HTMLInputElement>
  ) {
    if (event.key === "Enter") {
      event.preventDefault();
      addGenre();
    }
  }

  return (
    <fieldset className="genre-field">
      <legend>Gêneros *</legend>

      <p className="genre-hint">
        Selecione gêneros existentes ou crie um novo.
      </p>

      <div className="genre-options">
        {availableGenres.map((genre) => {
          const selected = value.some(
            (item) =>
              normalizeGenre(item) === normalizeGenre(genre)
          );

          return (
            <button
              key={genre}
              type="button"
              className={
                selected
                  ? "genre-option selected"
                  : "genre-option"
              }
              onClick={() => toggleGenre(genre)}
              aria-pressed={selected}
            >
              {selected ? "✓ " : ""}
              {genre}
            </button>
          );
        })}
      </div>

      <div className="custom-genre">
        <label htmlFor="new-genre">
          Não encontrou o gênero?
        </label>

        <div className="custom-genre-row">
          <input
            id="new-genre"
            type="text"
            value={newGenre}
            onChange={(event) => {
              setNewGenre(event.target.value);
              setError("");
            }}
            onKeyDown={handleKeyDown}
            placeholder="Digite um novo gênero..."
            maxLength={50}
          />

          <button
            type="button"
            className="secondary-button"
            onClick={addGenre}
            disabled={!newGenre.trim()}
          >
            + Adicionar
          </button>
        </div>

        {error && (
          <small className="error" role="alert">
            {error}
          </small>
        )}

        <small>
          Pressione Enter ou clique em Adicionar.
        </small>
      </div>

      {value.length > 0 && (
        <p className="genre-selected">
          Selecionados: {value.join(", ")}
        </p>
      )}
    </fieldset>
  );
}

export default GenreInput;
