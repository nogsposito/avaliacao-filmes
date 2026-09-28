import {
  useRef,
  type ReactNode,
} from "react";

interface MovieCarouselProps {
  title: string;
  eyebrow?: string;
  children: ReactNode;
}

function MovieCarousel({
  title,
  eyebrow,
  children,
}: MovieCarouselProps) {
  const carouselRef =
    useRef<HTMLDivElement | null>(null);

  function scroll(direction: number) {
    const carousel = carouselRef.current;

    if (!carousel) return;

    carousel.scrollBy({
      left:
        direction *
        Math.min(
          carousel.clientWidth * 0.8,
          850
        ),
      behavior: "smooth",
    });
  }

  return (
    <section className="movie-carousel-section">
      <div className="movie-carousel-heading">
        <div>
          {eyebrow && (
            <p className="eyebrow">
              {eyebrow}
            </p>
          )}

          <h2>{title}</h2>
        </div>
      </div>

      <div className="movie-carousel-wrapper">
        <button
          type="button"
          className="carousel-arrow carousel-arrow-left"
          aria-label={`Voltar em ${title}`}
          onClick={() => scroll(-1)}
        >
          ‹
        </button>

        <div
          ref={carouselRef}
          className="movie-carousel"
        >
          {children}
        </div>

        <button
          type="button"
          className="carousel-arrow carousel-arrow-right"
          aria-label={`Avançar em ${title}`}
          onClick={() => scroll(1)}
        >
          ›
        </button>
      </div>
    </section>
  );
}

export default MovieCarousel;