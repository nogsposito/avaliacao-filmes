export function formatRating(
  rating: number | null | undefined
): string {
  if (rating == null) {
    return "Sem avaliações";
  }

  const formatted = Number.isInteger(rating)
    ? rating.toFixed(0)
    : rating.toFixed(1);

  return `${formatted}/5`;
}
