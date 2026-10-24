import { useEffect, useState } from "react";
import { api } from "../../api/client";
import { Review } from "../../types/software";
import "./ReviewList.css";

const PAGE_SIZE = 5;
const sortOptions: Array<{ value: "newest" | "highest" | "lowest" | "helpful"; label: string }> = [
  { value: "newest", label: "Newest" },
  { value: "highest", label: "Highest rated" },
  { value: "lowest", label: "Lowest rated" },
  { value: "helpful", label: "Most helpful" },
];

const verifiedLabel: Record<Review["verifiedStatus"], string | null> = {
  UNVERIFIED: null,
  VERIFIED_USER: "Verified user",
  VERIFIED_PURCHASE: "Verified purchase",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value));
}

export function ReviewList({ slug }: { slug: string }) {
  const [sort, setSort] = useState<(typeof sortOptions)[number]["value"]>("newest");
  const [page, setPage] = useState(1);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    api
      .listReviews(slug, { sort, page, limit: PAGE_SIZE })
      .then((result) => {
        if (!active) return;
        setReviews((previous) => (page === 1 ? result.items : [...previous, ...result.items]));
        setTotal(result.total);
        setLoading(false);
      })
      .catch(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [slug, sort, page]);

  return (
    <div>
      <div className="review-toolbar">
        <label className="sort-control">
          <span>Sort by</span>
          <select
            value={sort}
            onChange={(event) => {
              setSort(event.target.value as typeof sort);
              setPage(1);
            }}
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="review-list">
        {reviews.map((review) => (
          <article className="review-card" key={review.id}>
            <div className="review-card-heading">
              <strong>{review.displayName ?? "Anonymous"}</strong>
              <span className="review-stars" aria-hidden="true">
                {"★".repeat(review.rating)}
                {"☆".repeat(5 - review.rating)}
              </span>
              {verifiedLabel[review.verifiedStatus] && (
                <span className="capability-badge">{verifiedLabel[review.verifiedStatus]}</span>
              )}
            </div>
            {review.title && <h3>{review.title}</h3>}
            <p>{review.body}</p>
            {(review.pros || review.cons) && (
              <div className="review-pros-cons">
                {review.pros && (
                  <p>
                    <strong>Pros: </strong>
                    {review.pros}
                  </p>
                )}
                {review.cons && (
                  <p>
                    <strong>Cons: </strong>
                    {review.cons}
                  </p>
                )}
              </div>
            )}
            {review.publisherResponse && (
              <div className="review-response">
                <strong>Response from the team</strong>
                <p>{review.publisherResponse}</p>
              </div>
            )}
            <div className="review-meta">
              <span>{formatDate(review.reviewDate)}</span>
              {review.userRole && <span>{review.userRole}</span>}
              <span>{review.helpfulVotes} found this helpful</span>
            </div>
          </article>
        ))}
      </div>
      {reviews.length < total && (
        <button
          className="button button-secondary review-load-more"
          disabled={loading}
          onClick={() => setPage((value) => value + 1)}
        >
          {loading ? "Loading…" : "Load more reviews"}
        </button>
      )}
    </div>
  );
}
