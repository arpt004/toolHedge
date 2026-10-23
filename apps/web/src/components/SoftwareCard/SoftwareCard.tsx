import { Software } from "../../types/software";
import { SoftwareLogo } from "../SoftwareLogo/SoftwareLogo";
import { PricingBadge } from "../PricingBadge/PricingBadge";
import { PlatformList } from "../PlatformList/PlatformList";
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
  return (
    <article className="software-card">
      <button
        className="software-card-main"
        onClick={() => onSelect(software)}
        aria-label={`View ${software.name}`}
      >
        <div className="card-top">
          <SoftwareLogo software={software} />
          <PricingBadge pricingType={software.pricingType} />
        </div>
        <div className="card-copy">
          <h2>{software.name}</h2>
          <p>{software.tagline}</p>
        </div>
        <PlatformList platforms={software.platforms} limit={3} />
      </button>
      {onToggleCompare && (
        <button
          className={`card-compare-toggle${isCompared ? " is-selected" : ""}`}
          aria-pressed={isCompared}
          onClick={() => onToggleCompare(software)}
        >
          <span className="compare-check" aria-hidden="true">
            {isCompared ? "✓" : "+"}
          </span>
          {isCompared ? "Added" : "Compare"}
        </button>
      )}
      {/* Future Like and Review controls belong here; intentionally not rendered in browse-only scope. */}
    </article>
  );
}
