
import { useState, type FormEvent } from "react";

import {
  createReview,
  type ReviewCreate,
} from "../services/movies";

interface ReviewFormProps {
  movieId: string;
  onCreated: () => void;
}

function ReviewForm({
  movieId,
  onCreated,
}: ReviewFormProps) {
  const [nome, setNome] = useState("");
  const [nota, setNota] = useState(0);
  const [comentario, setComentario] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (nota < 1 || nota > 5) {
      setError("Selecione uma nota de 1 a 5 estrelas.");
      return;
    }

    if (!nome.trim() || !comentario.trim()) {
      setError("Preencha seu nome e o comentário.");
      return;
    }

    const data: ReviewCreate = {
      nome: nome.trim(),
      nota,
      comentario: comentario.trim(),
    };

    setSaving(true);

    try {
      await createReview(movieId, data);

      setNome("");
      setNota(0);
      setComentario("");
      setSuccess("Avaliação publicada com sucesso!");

      onCreated();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Não foi possível publicar a avaliação."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      className="review-form"
      onSubmit={handleSubmit}
    >
      <h3>Escrever avaliação</h3>

      <label>
        Seu nome *
        <input
          required
          maxLength={120}
          value={nome}
          onChange={(event) =>
            setNome(event.target.value)
          }
          placeholder="Como você gostaria de ser identificado?"
        />
      </label>

      <div className="rating-field">
        <span className="rating-label">
          Sua nota *
        </span>

        <div
          className="star-input"
          role="group"
          aria-label="Selecione sua nota"
        >
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className={
                star <= nota
                  ? "star-button selected"
                  : "star-button"
              }
              onClick={() => setNota(star)}
              aria-label={`${star} estrelas`}
              aria-pressed={nota === star}
              disabled={saving}
            >
              {star <= nota ? "★" : "☆"}
            </button>
          ))}
        </div>

        <small>
          {nota === 0
            ? "Selecione de 1 a 5 estrelas."
            : `${nota} de 5 estrelas`}
        </small>
      </div>

      <label>
        Comentário *
        <textarea
          required
          rows={5}
          maxLength={4000}
          value={comentario}
          onChange={(event) =>
            setComentario(event.target.value)
          }
          placeholder="O que você achou do filme?"
        />
      </label>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      {success && (
        <p className="success" role="status">
          {success}
        </p>
      )}

      <button
        type="submit"
        className="primary-button"
        disabled={saving}
      >
        {saving
          ? "Publicando..."
          : "Publicar avaliação"}
      </button>
    </form>
  );
}

export default ReviewForm;
