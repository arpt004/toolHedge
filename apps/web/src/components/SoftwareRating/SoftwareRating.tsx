import { Rating, ReviewSummary } from "../../types/software";
import "./SoftwareRating.css";

// Canonical single-line rating used by cards, the quick-view popup, and the
// comparison page. Prefers the real user-review aggregate; falls back to an
// editorial score only when no reviews exist yet, and labels it as such so
// the two sources are never presented as equivalent.
export function SoftwareRating({
  reviewSummary,
  ratings,
}: {
  reviewSummary?: ReviewSummary;
  ratings?: Rating[];
}) {
  if (reviewSummary && reviewSummary.count > 0 && reviewSummary.average !== null) {
    return (
      <span
        className="software-rating"
        aria-label={`Rated ${reviewSummary.average} out of 5 from ${reviewSummary.count} ${reviewSummary.count === 1 ? "review" : "reviews"}`}
      >
        <span aria-hidden="true">★</span>
        <strong>{reviewSummary.average.toFixed(1)}</strong>
        <span className="software-rating-count">
          · {reviewSummary.count} {reviewSummary.count === 1 ? "review" : "reviews"}
        </span>
      </span>
    );
  }
  const editorial = ratings?.find(
    (rating) => rating.dimension === "OVERALL" && rating.source === "EDITORIAL",
  );
  if (editorial) {
    return (
      <span
        className="software-rating"
        aria-label={`Editorial rating ${editorial.score} out of ${editorial.maxScore}`}
      >
        <span aria-hidden="true">★</span>
        <strong>{editorial.score.toFixed(1)}</strong>
        <span className="software-rating-count">· Editorial</span>
      </span>
    );
  }
  return (
    <span className="software-rating software-rating-empty" aria-label="No ratings yet">
      No ratings yet
    </span>
  );
}
