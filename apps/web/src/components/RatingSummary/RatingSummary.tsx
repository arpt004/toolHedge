import { Rating, ReviewSummary } from "../../types/software";
import "./RatingSummary.css";

const dimensionLabels: Record<string, string> = {
  OVERALL: "Overall",
  EASE_OF_USE: "Ease of use",
  FEATURES: "Features",
  VALUE: "Value for money",
  SUPPORT: "Support",
  PERFORMANCE: "Performance",
  USER_EXPERIENCE: "User experience",
  INTEGRATION: "Integrations",
};

function Stars({ score, maxScore }: { score: number; maxScore: number }) {
  const percent = Math.max(0, Math.min(100, (score / maxScore) * 100));
  return (
    <span className="rating-stars" aria-hidden="true">
      <span className="rating-stars-fill" style={{ width: `${percent}%` }} />
    </span>
  );
}

export function RatingSummary({
  ratings,
  reviewSummary,
}: {
  ratings: Rating[];
  reviewSummary?: ReviewSummary;
}) {
  const editorial = ratings.filter((rating) => rating.source === "EDITORIAL");
  const external = ratings.filter((rating) => rating.source === "EXTERNAL");
  const editorialOverall = editorial.find((rating) => rating.dimension === "OVERALL");
  const editorialDimensions = editorial.filter((rating) => rating.dimension !== "OVERALL");
  const externalBySource = new Map<string, Rating[]>();
  for (const rating of external) {
    const key = rating.sourceName ?? "External";
    externalBySource.set(key, [...(externalBySource.get(key) ?? []), rating]);
  }
  const hasReviews = Boolean(reviewSummary && reviewSummary.count > 0);
  const maxDistribution = reviewSummary
    ? Math.max(1, ...Object.values(reviewSummary.distribution))
    : 1;

  return (
    <div className="rating-summary">
      {editorialOverall && (
        <div className="rating-block rating-editorial">
          <div className="rating-headline">
            <strong>{editorialOverall.score.toFixed(1)}</strong>
            <span>/ {editorialOverall.maxScore}</span>
          </div>
          <div>
            <Stars score={editorialOverall.score} maxScore={editorialOverall.maxScore} />
            <p className="rating-source-label">Editorial rating</p>
          </div>
        </div>
      )}
      {editorialDimensions.length > 0 && (
        <ul className="rating-dimension-list">
          {editorialDimensions.map((rating) => (
            <li key={rating.dimension}>
              <span>{dimensionLabels[rating.dimension] ?? rating.dimension}</span>
              <Stars score={rating.score} maxScore={rating.maxScore} />
              <small>{rating.score.toFixed(1)}</small>
            </li>
          ))}
        </ul>
      )}
      {hasReviews && reviewSummary && (
        <div className="rating-block rating-reviews">
          <div className="rating-headline">
            <strong>{reviewSummary.average?.toFixed(1) ?? "—"}</strong>
            <span>/ 5</span>
          </div>
          <div>
            <p className="rating-source-label">
              From {reviewSummary.count} {reviewSummary.count === 1 ? "review" : "reviews"}
            </p>
            <ul className="rating-distribution">
              {([5, 4, 3, 2, 1] as const).map((star) => (
                <li key={star}>
                  <span>{star}★</span>
                  <span className="rating-distribution-track">
                    <span
                      className="rating-distribution-fill"
                      style={{
                        width: `${(reviewSummary.distribution[star] / maxDistribution) * 100}%`,
                      }}
                    />
                  </span>
                  <span className="rating-distribution-count">
                    {reviewSummary.distribution[star]}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      {[...externalBySource.entries()].map(([sourceName, items]) => (
        <ul className="rating-dimension-list rating-external" key={sourceName}>
          {items.map((rating) => (
            <li key={`${sourceName}-${rating.dimension}`}>
              <span>
                {sourceName} — {dimensionLabels[rating.dimension] ?? rating.dimension}
              </span>
              <Stars score={rating.score} maxScore={rating.maxScore} />
              <small>
                {rating.score.toFixed(1)}
                {rating.reviewCount ? ` (${rating.reviewCount})` : ""}
              </small>
            </li>
          ))}
        </ul>
      ))}
    </div>
  );
}
