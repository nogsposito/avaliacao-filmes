
import { useState, type FormEvent } from "react";

import GenreInput from "./GenreInput";

import {
  createMovie,
  updateMovie,
  type MovieCreate,
  type MovieDetail,
} from "../services/movies";

interface MovieFormProps {
  onCancel: () => void;
  onSaved: (movie: MovieDetail) => void;
  movie?: MovieDetail;
}

function MovieForm({
  onCancel,
  onSaved,
  movie,
}: MovieFormProps) {
  const editing = Boolean(movie);

  const directors = movie?.people.filter(
    (person) => person.tipo_pessoa === "Diretor"
  );

  const [titulo, setTitulo] = useState(movie?.titulo ?? "");
  const [diretor, setDiretor] = useState(
    directors?.[0]?.nome_pessoa ?? ""
  );
  const [ano, setAno] = useState(
    movie?.ano_lancamento?.toString() ?? ""
  );
  const [generos, setGeneros] = useState<string[]>(
    movie?.genres ?? []
  );
  const [sinopse, setSinopse] = useState(
    movie?.sinopse ?? ""
  );
  const [duracao, setDuracao] = useState(
    movie?.duracao_minutos?.toString() ?? ""
  );
  const [poster, setPoster] = useState(
    movie?.url_poster ?? ""
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setError("");

    if (generos.length === 0) {
      setError("Adicione pelo menos um gênero.");
      return;
    }

    const data: MovieCreate = {
      titulo: titulo.trim(),
      diretor: diretor.trim(),
      ano_lancamento: Number(ano),
      generos,
      sinopse: sinopse.trim() || null,
      duracao_minutos: duracao ? Number(duracao) : null,
      url_poster: poster.trim() || null,
    };

    setSaving(true);

    try {
      const savedMovie = movie
        ? await updateMovie(movie.sk_movie_id, data)
        : await createMovie(data);

      onSaved(savedMovie);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar o filme."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="container">
      <button
        type="button"
        className="back-button"
        onClick={onCancel}
      >
        ← Voltar
      </button>

      <div className="form-heading">
        <p className="eyebrow">ROCKETLAB · ADMIN</p>

        <h1>
          {editing ? "Editar filme" : "Novo filme"}
        </h1>

        <p className="subtitle">
          {editing
            ? "Atualize as informações do filme."
            : "Preencha as informações para adicionar um filme."}
        </p>
      </div>

      <form className="movie-form" onSubmit={handleSubmit}>
        <label>
          Título *
          <input
            required
            maxLength={500}
            value={titulo}
            onChange={(event) =>
              setTitulo(event.target.value)
            }
            placeholder="Ex.: Central do Brasil"
          />
        </label>

        <div className="form-row">
          <label>
            Diretor *
            <input
              required
              maxLength={255}
              value={diretor}
              onChange={(event) =>
                setDiretor(event.target.value)
              }
              placeholder="Ex.: Walter Salles"
            />
          </label>

          <label>
            Ano de lançamento *
            <input
              required
              type="number"
              min={1888}
              max={2100}
              value={ano}
              onChange={(event) =>
                setAno(event.target.value)
              }
              placeholder="1998"
            />
          </label>
        </div>

        <GenreInput
          value={generos}
          onChange={setGeneros}
        />

        <label>
          Sinopse
          <textarea
            rows={5}
            maxLength={4000}
            value={sinopse}
            onChange={(event) =>
              setSinopse(event.target.value)
            }
            placeholder="Descreva o filme..."
          />
        </label>

        <div className="form-row">
          <label>
            Duração em minutos
            <input
              type="number"
              min={1}
              value={duracao}
              onChange={(event) =>
                setDuracao(event.target.value)
              }
              placeholder="113"
            />
          </label>

          <label>
            URL do pôster
            <input
              type="url"
              value={poster}
              onChange={(event) =>
                setPoster(event.target.value)
              }
              placeholder="https://..."
            />
          </label>
        </div>

        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}

        <div className="form-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={onCancel}
            disabled={saving}
          >
            Cancelar
          </button>

          <button
            type="submit"
            className="primary-button"
            disabled={saving}
          >
            {saving
              ? "Salvando..."
              : editing
                ? "Salvar alterações"
                : "Cadastrar filme"}
          </button>
        </div>
      </form>
    </main>
  );
}

export default MovieForm;
