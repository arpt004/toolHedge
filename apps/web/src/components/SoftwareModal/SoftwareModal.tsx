import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client";
import { Review, Software } from "../../types/software";
import { SoftwareLogo } from "../SoftwareLogo/SoftwareLogo";
import { PricingBadge } from "../PricingBadge/PricingBadge";
import { MetadataLinks } from "../MetadataLinks/MetadataLinks";
import { VisitSiteLink } from "../VisitSiteLink/VisitSiteLink";
import { StatePanel } from "../StatePanel/StatePanel";
import { VerificationBadge } from "../VerificationBadge/VerificationBadge";
import { TrendingBadge } from "../TrendingBadge/TrendingBadge";
import { SoftwareRating } from "../SoftwareRating/SoftwareRating";
import { FeatureHighlights } from "../FeatureHighlights/FeatureHighlights";
import { ShareActions } from "../ShareActions/ShareActions";
import { getPricingDisplay } from "../../utils/pricing";
import "./SoftwareModal.css";

export function SoftwareModal({
  slug,
  onClose,
  isCompared = false,
  onToggleCompare,
}: {
  slug: string;
  onClose: () => void;
  isCompared?: boolean;
  onToggleCompare?: (software: Software) => void;
}) {
  const [software, setSoftware] = useState<Software | null>(null);
  const [error, setError] = useState("");
  const [reviewPreview, setReviewPreview] = useState<Review[]>([]);
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let active = true;
    api
      .getSoftware(slug)
      .then((item) => {
        if (active) setSoftware(item);
      })
      .catch((reason) => {
        if (active)
          setError(
            reason instanceof Error ? reason.message : "Software not found",
          );
      });
    return () => {
      active = false;
    };
  }, [slug]);
  // Lazy-loaded only when there's something to show — avoids a wasted
  // request for the many products that don't have reviews yet.
  useEffect(() => {
    let active = true;
    if (!software || (software.reviewSummary?.count ?? 0) === 0) return;
    api
      .listReviews(slug, { limit: 2, sort: "helpful" })
      .then((page) => {
        if (active) setReviewPreview(page.items);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [slug, software?.reviewSummary?.count]);
  useEffect(() => {
    const previouslyFocused =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          "a[href], button:not(:disabled)",
        ),
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus();
    };
  }, [onClose]);

  const stackFit = (software?.relationships ?? []).filter((item) =>
    ["COMPLEMENTARY", "INTEGRATION"].includes(item.type),
  );
  const pros = (software?.prosCons ?? []).filter((item) => item.type === "PRO").slice(0, 2);
  const cons = (software?.prosCons ?? []).filter((item) => item.type === "CON").slice(0, 1);

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="software-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        ref={dialogRef}
      >
        <button
          className="modal-close"
          aria-label="Close preview"
          onClick={onClose}
          ref={closeRef}
        >
          ×
        </button>
        {software ? (
          <>
            <div className="modal-heading">
              <SoftwareLogo software={software} large />
              <div className="modal-heading-info">
                <div className="modal-heading-badges">
                  {software.isTrending && <TrendingBadge />}
                  <PricingBadge pricingType={software.pricingType} />
                </div>
                <h2 id="modal-title">
                  {software.name}
                  {software.isVerified && <VerificationBadge verifiedAt={software.verifiedAt} />}
                </h2>
                <p>{software.tagline}</p>
                <div className="modal-rating-row">
                  <SoftwareRating reviewSummary={software.reviewSummary} ratings={software.ratings} />
                </div>
              </div>
            </div>
            {software.categories.length > 0 && (
              <MetadataLinks
                param="category"
                items={software.categories.map((category) => ({
                  slug: category.slug,
                  label: `${category.icon} ${category.name}`,
                }))}
              />
            )}
            <p className="modal-description">{software.description}</p>
            {software.takeaway?.mainValueProp && (
              <p className="modal-takeaway">{software.takeaway.mainValueProp}</p>
            )}
            {((software.capabilities?.length ?? 0) > 0 || (software.plans?.length ?? 0) > 0) && (
              <div className="modal-snapshot-grid">
                {(software.capabilities?.length ?? 0) > 0 && (
                  <div className="modal-snapshot-panel">
                    <h3>Key features</h3>
                    <FeatureHighlights capabilities={software.capabilities ?? []} limit={5} />
                  </div>
                )}
                <div className="modal-snapshot-panel">
                  <h3>Pricing</h3>
                  <p className="modal-price-line">{getPricingDisplay(software)}</p>
                  {software.plans && software.plans.length > 0 && (
                    <ul className="modal-plan-names">
                      {software.plans.slice(0, 3).map((plan) => (
                        <li key={plan.slug}>{plan.name}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
            {(pros.length > 0 || cons.length > 0 || reviewPreview.length > 0) && (
              <div className="modal-block modal-two-col">
                {(pros.length > 0 || cons.length > 0) && (
                  <div>
                    <h3 className="section-label">Pros & cons</h3>
                    <ul className="modal-pros-cons">
                      {pros.map((item, index) => (
                        <li key={`pro-${index}`} className="modal-pro">
                          + {item.description}
                        </li>
                      ))}
                      {cons.map((item, index) => (
                        <li key={`con-${index}`} className="modal-con">
                          − {item.description}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {reviewPreview.length > 0 && (
                  <div>
                    <h3 className="section-label">What people say</h3>
                    <div className="modal-review-preview">
                      {reviewPreview.map((review) => (
                        <blockquote key={review.id}>
                          <p>“{review.body}”</p>
                          <cite>{review.displayName ?? "Anonymous"}</cite>
                        </blockquote>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            {(software.platforms.length > 0 || stackFit.length > 0 || software.isOpenSource) && (
              <p className="modal-compat-note">
                {software.platforms.length > 0 && (
                  <span>Works on {software.platforms.join(", ")}. </span>
                )}
                {software.isOpenSource && <span>Open source. </span>}
                {stackFit.length > 0 && (
                  <span>Pairs well with {stackFit.map((item) => item.software.name).join(", ")}.</span>
                )}
              </p>
            )}
            <div className="modal-actions">
              <VisitSiteLink url={software.affiliateUrl || software.websiteUrl} />
              <Link className="button button-secondary" to={`/software/${software.slug}`}>
                Full details
              </Link>
            </div>
            <div className="modal-secondary-actions">
              {onToggleCompare && (
                <button
                  className="button button-secondary"
                  aria-pressed={isCompared}
                  onClick={() => onToggleCompare(software)}
                >
                  {isCompared ? "✓ Added to compare" : "Add to compare"}
                </button>
              )}
              <ShareActions name={software.name} tagline={software.tagline} />
            </div>
          </>
        ) : error ? (
          <StatePanel
            as="div"
            className="modal-message"
            icon="!"
            heading="Couldn’t load software"
            headingId="modal-title"
            message={error}
          />
        ) : (
          <div className="modal-message">
            <span className="spinner" />
            <p>Loading software…</p>
          </div>
        )}
      </div>
    </div>
  );
}
