
import {
  useEffect,
  useState,
} from "react";

import {
  ArrowLeft,
  Clapperboard,
  Pencil,
  Star,
  UserRound,
} from "lucide-react";

import { useAuth } from "../auth/AuthContext";

import {
  getMyReviews,
  type MyReview,
} from "../services/auth";

import {
  formatRating,
} from "../utils/ratings";

interface AccountPageProps {
  onBack: () => void;
  onOpenMovie: (
    movieId: string
  ) => void;
}

function AccountPage({
  onBack,
  onOpenMovie,
}: AccountPageProps) {
  const { user, token } =
    useAuth();

  const [reviews, setReviews] =
    useState<MyReview[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    let active = true;

    async function loadReviews() {
      if (!token) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const data =
          await getMyReviews(
            token
          );

        if (active) {
          setReviews(
            data
          );
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Erro ao carregar seu histórico."
          );
        }
      } finally {
        if (active) {
          setLoading(
            false
          );
        }
      }
    }

    loadReviews();

    return () => {
      active = false;
    };
  }, [token]);

  if (!user) {
    return (
      <main className="container account-page">
        <p>Usuário não carregado.</p>

        <button
          type="button"
          className="back-button"
          onClick={onBack}
        >
          Voltar ao catálogo
        </button>
      </main>
    );
  }

  const uniqueMovies =
    new Set(
      reviews.map(
        (review) =>
          review.movie_id
      )
    ).size;

  return (
    <main className="container account-page">
      <button
        type="button"
        className="back-button"
        onClick={onBack}
      >
        <ArrowLeft
          size={18}
        />
        Voltar ao
        catálogo
      </button>

      <section className="account-profile">
        <div className="account-profile-avatar">
          <UserRound
            size={34}
          />
        </div>

        <div>
          <p className="eyebrow">
            MINHA CONTA
          </p>

          <h1>
            {
              user.username
            }
          </h1>

          <p>
            {
              user.email
            }
          </p>
        </div>
      </section>

      <div className="account-stats">
        <div>
          <Clapperboard
            size={21}
          />

          <strong>
            {
              uniqueMovies
            }
          </strong>

          <span>
            Filmes avaliados
          </span>
        </div>

        <div>
          <Star
            size={21}
          />

          <strong>
            {
              reviews.length
            }
          </strong>

          <span>
            Avaliações
            publicadas
          </span>
        </div>
      </div>

      <section className="account-history">
        <div className="account-section-heading">
          <p className="eyebrow">
            SEU HISTÓRICO
          </p>

          <h2>
            Últimas
            avaliações
          </h2>
        </div>

        {loading && (
          <p>
            Carregando
            seu histórico...
          </p>
        )}

        {error && (
          <p
            className="error"
            role="alert"
          >
            {error}
          </p>
        )}

        {!loading &&
          !error &&
          reviews.length ===
            0 && (
            <div className="account-empty">
              <Clapperboard
                size={35}
              />

              <h3>
                Seu diário
                começa com
                um filme.
              </h3>

              <p>
                Explore o
                catálogo e
                publique sua
                primeira
                avaliação.
              </p>

              <button
                type="button"
                className="primary-button"
                onClick={
                  onBack
                }
              >
                Explorar
                filmes
              </button>
            </div>
          )}

        <div className="account-review-list">
          {reviews.map(
            (review) => (
              <article
                className="account-review-card"
                key={
                  review.review_id
                }
              >
                <div className="account-review-poster">
                  {review.url_poster ? (
                    <img
                      src={
                        review.url_poster
                      }
                      alt={
                        `Pôster de ${review.titulo}`
                      }
                      loading="lazy"
                    />
                  ) : (
                    <Clapperboard
                      size={26}
                    />
                  )}
                </div>

                <div className="account-review-content">
                  <div className="account-review-top">
                    <div>
                      <h3>
                        {
                          review.titulo
                        }
                      </h3>

                      <small>
                        {review.ano_lancamento ??
                          "Ano desconhecido"}
                      </small>
                    </div>

                    <span className="account-review-rating">
                      <Star
                        size={
                          16
                        }
                        fill="currentColor"
                      />

                      {formatRating(
                        review.nota
                      )}
                    </span>
                  </div>

                  <p>
                    {
                      review.comentario
                    }
                  </p>

                  <div className="account-review-bottom">
                    <small>
                      {new Date(
                        review.created_at
                      ).toLocaleDateString(
                        "pt-BR"
                      )}
                    </small>

                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() =>
                        onOpenMovie(
                          review.movie_id
                        )
                      }
                    >
                      <Pencil
                        size={
                          15
                        }
                      />
                      Ver ou
                      editar
                    </button>
                  </div>
                </div>
              </article>
            )
          )}
        </div>
      </section>
    </main>
  );
}

export default AccountPage;
