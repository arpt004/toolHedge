import { Software } from "../../types/software";
import { SoftwareLogo } from "../SoftwareLogo/SoftwareLogo";
import { PricingBadge } from "../PricingBadge/PricingBadge";
import { VerificationBadge } from "../VerificationBadge/VerificationBadge";
import { TrendingBadge } from "../TrendingBadge/TrendingBadge";
import { SoftwareRating } from "../SoftwareRating/SoftwareRating";
import { FeatureHighlights } from "../FeatureHighlights/FeatureHighlights";
import { getPricingDisplay } from "../../utils/pricing";
import { isNewlyLaunched } from "../../utils/badges";
import "./SoftwareCard.css";

export function SoftwareCard({
  software,
  onSelect,
  isCompared = false,
  onToggleCompare,
}: {
  software: Software;
  onSelect: (software: Software) => void;
  isCompared?: boolean;
  onToggleCompare?: (software: Software) => void;
}) {
  const isNew = !software.isTrending && isNewlyLaunched(software);
  return (
    <article className="software-card">
      <button
        className="software-card-main"
        onClick={() => onSelect(software)}
        aria-label={`Quick view ${software.name}`}
      >
        <div className="card-header">
          <SoftwareLogo software={software} />
          <div className="card-header-text">
            <h2 title={software.name}>
              <span className="card-name-text">{software.name}</span>
              {software.isVerified && <VerificationBadge verifiedAt={software.verifiedAt} />}
            </h2>
            <p className="card-tagline" title={software.tagline}>
              {software.tagline}
            </p>
          </div>
        </div>
        {(software.isTrending || isNew) && (
          <div className="card-status-row">
            {software.isTrending ? <TrendingBadge /> : <span className="new-badge">New</span>}
          </div>
        )}
        <div className="card-pricing-row">
          <PricingBadge pricingType={software.pricingType} />
          <span className="card-pricing-line">{getPricingDisplay(software)}</span>
        </div>
        <SoftwareRating reviewSummary={software.reviewSummary} ratings={software.ratings} />
        {software.platforms.length > 0 && (
          <p className="card-platforms">{software.platforms.join(" · ")}</p>
        )}
        <p className="card-description" title={software.description}>
          {software.description}
        </p>
        {software.capabilities && software.capabilities.length > 0 && (
          <FeatureHighlights capabilities={software.capabilities} limit={4} />
        )}
      </button>
      <div className="card-footer">
        <button
          className="card-detail-link"
          onClick={(event) => {
            event.stopPropagation();
            onSelect(software);
          }}
        >
          Quick view
        </button>
        {onToggleCompare && (
          <button
            className={`card-compare-toggle${isCompared ? " is-selected" : ""}`}
            aria-pressed={isCompared}
            onClick={(event) => {
              event.stopPropagation();
              onToggleCompare(software);
            }}
          >
            <span className="compare-check" aria-hidden="true">
              {isCompared ? "✓" : "+"}
            </span>
            {isCompared ? "Added" : "Compare"}
          </button>
        )}
      </div>
    </article>
  );
}
