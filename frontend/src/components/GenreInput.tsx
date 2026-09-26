
import { useState, type KeyboardEvent } from "react";

interface GenreInputProps {
  value: string[];
  onChange: (genres: string[]) => void;
}

function GenreInput({ value, onChange }: GenreInputProps) {
  const [input, setInput] = useState("");

  function addGenre() {
    const genre = input.trim();

    if (!genre) return;

    const exists = value.some(
      (item) => item.toLowerCase() === genre.toLowerCase()
    );

    if (!exists) {
      onChange([...value, genre]);
    }

    setInput("");
  }

  function removeGenre(genre: string) {
    onChange(value.filter((item) => item !== genre));
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addGenre();
    }

    if (
      event.key === "Backspace" &&
      input === "" &&
      value.length > 0
    ) {
      removeGenre(value[value.length - 1]);
    }
  }

  return (
    <div className="genre-field">
      <label htmlFor="genre-input">Gêneros *</label>

      <div className="genre-input-container">
        {value.map((genre) => (
          <span className="genre-chip" key={genre}>
            {genre}

            <button
              type="button"
              onClick={() => removeGenre(genre)}
              aria-label={`Remover ${genre}`}
            >
              ×
            </button>
          </span>
        ))}

        <input
          id="genre-input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Digite um gênero..."
          maxLength={50}
        />
      </div>

      <small>Pressione Enter para adicionar um gênero.</small>
    </div>
  );
}

export default GenreInput;
