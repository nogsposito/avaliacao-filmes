import {
  useEffect,
  useState,
  type FormEvent,
  type MouseEvent,
} from "react";

import { useAuth } from "../auth/AuthContext";

import {
  createReview,
  updateReview,
  type ReviewCreate,
} from "../services/movies";

interface ExistingReview {
  sk_movie_review_id: string;
  nota: number;
  comentario: string;
}

interface ReviewFormProps {
  movieId: string;
  existingReview?: ExistingReview | null;
  onSaved: () => void;
}

function ReviewForm({
  movieId,
  existingReview = null,
  onSaved,
}: ReviewFormProps) {
  const { user, token } = useAuth();

  const [nota, setNota] = useState(
    existingReview?.nota ?? 0
  );

  const [hoverNota, setHoverNota] =
    useState<number | null>(null);

  const [comentario, setComentario] = useState(
    existingReview?.comentario ?? ""
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isEditing = existingReview !== null;

  const notaExibida = hoverNota ?? nota;

  useEffect(() => {
    setNota(existingReview?.nota ?? 0);

    setComentario(
      existingReview?.comentario ?? ""
    );

    setHoverNota(null);
    setError("");
    setSuccess("");
  }, [existingReview]);

  function getStarRating(
    event: MouseEvent<HTMLButtonElement>,
    star: number
  ): number {
    const rect =
      event.currentTarget.getBoundingClientRect();

    const mouseX =
      event.clientX - rect.left;

    return mouseX < rect.width / 2
      ? star - 0.5
      : star;
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!token) {
      setError(
        "Entre na sua conta para avaliar este filme."
      );
      return;
    }

    if (nota < 0.5 || nota > 5) {
      setError(
        "Selecione uma nota de 0,5 a 5 estrelas."
      );
      return;
    }

    if (!comentario.trim()) {
      setError("Escreva um comentário.");
      return;
    }

    const data: ReviewCreate = {
      nota,
      comentario: comentario.trim(),
    };

    setSaving(true);

    try {
      if (existingReview) {
        await updateReview(
          movieId,
          existingReview.sk_movie_review_id,
          data,
          token
        );

        setSuccess(
          "Avaliação atualizada com sucesso!"
        );
      } else {
        await createReview(
          movieId,
          data,
          token
        );

        setSuccess(
          "Avaliação publicada com sucesso!"
        );
      }

      onSaved();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : isEditing
            ? "Não foi possível atualizar a avaliação."
            : "Não foi possível publicar a avaliação."
      );
    } finally {
      setSaving(false);
    }
  }

  if (!user || !token) {
    return (
      <div className="review-form">
        <h3>Escrever avaliação</h3>

        <p>
          Entre na sua conta para avaliar este filme.
        </p>
      </div>
    );
  }

  return (
    <form
      className="review-form"
      onSubmit={handleSubmit}
    >
      <h3>
        {isEditing
          ? "Editar sua avaliação"
          : "Escrever avaliação"}
      </h3>

      <p className="review-author">
        Avaliando como{" "}
        <strong>{user.username}</strong>
      </p>

      <div className="rating-field">
        <span className="rating-label">
          Sua nota *
        </span>

        <div
          className="star-input"
          role="group"
          aria-label="Selecione sua nota"
          onMouseLeave={() =>
            setHoverNota(null)
          }
        >
          {[1, 2, 3, 4, 5].map((star) => {
            const preenchimento =
              Math.max(
                0,
                Math.min(
                  1,
                  notaExibida - (star - 1)
                )
              ) * 100;

            return (
              <button
                key={star}
                type="button"
                className="star-button"
                disabled={saving}
                onMouseMove={(event) => {
                  setHoverNota(
                    getStarRating(
                      event,
                      star
                    )
                  );
                }}
                onClick={(event) => {
                  setNota(
                    getStarRating(
                      event,
                      star
                    )
                  );
                }}
                onFocus={() =>
                  setHoverNota(null)
                }
                onKeyDown={(event) => {
                  if (
                    event.key ===
                      "ArrowRight" ||
                    event.key ===
                      "ArrowUp"
                  ) {
                    event.preventDefault();

                    setNota((value) =>
                      Math.min(
                        5,
                        value + 0.5
                      )
                    );
                  }

                  if (
                    event.key ===
                      "ArrowLeft" ||
                    event.key ===
                      "ArrowDown"
                  ) {
                    event.preventDefault();

                    setNota((value) =>
                      Math.max(
                        0.5,
                        value - 0.5
                      )
                    );
                  }
                }}
                aria-label={`${star}ª estrela`}
                aria-pressed={
                  nota === star ||
                  nota === star - 0.5
                }
              >
                <span
                  className="star-fill"
                  style={{
                    backgroundImage:
                      `linear-gradient(
                        to right,
                        #f47a31 ${preenchimento}%,
                        #68716e ${preenchimento}%
                      )`,
                  }}
                >
                  ★
                </span>
              </button>
            );
          })}
        </div>

        <small>
          {notaExibida === 0
            ? "Selecione de 0,5 a 5 estrelas."
            : `${notaExibida.toLocaleString(
                "pt-BR"
              )} de 5 estrelas`}
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
            setComentario(
              event.target.value
            )
          }
          placeholder="O que você achou do filme?"
        />
      </label>

      {error && (
        <p
          className="error"
          role="alert"
        >
          {error}
        </p>
      )}

      {success && (
        <p
          className="success"
          role="status"
        >
          {success}
        </p>
      )}

      <button
        type="submit"
        className="primary-button"
        disabled={saving}
      >
        {saving
          ? isEditing
            ? "Salvando..."
            : "Publicando..."
          : isEditing
            ? "Salvar alterações"
            : "Publicar avaliação"}
      </button>
    </form>
  );
}

export default ReviewForm;