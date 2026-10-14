import { Software } from "../types/software";

export function pricingLabel(pricingType: Software["pricingType"]) {
  return {
    FREE: "Free",
    FREEMIUM: "Freemium",
    PAID: "Paid",
    OPEN_SOURCE: "Open source",
  }[pricingType];
}

export function SoftwareLogo({
  software,
  large = false,
}: {
  software: Pick<Software, "logoUrl" | "name">;
  large?: boolean;
}) {
  return software.logoUrl ? (
    <img
      className={`software-logo${large ? " software-logo-large" : ""}`}
      src={software.logoUrl}
      alt=""
    />
  ) : (
    <span
      className={`software-logo software-logo-fallback${large ? " software-logo-large" : ""}`}
      aria-hidden="true"
    >
      {software.name.slice(0, 1).toUpperCase()}
    </span>
  );
}

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
          <span
            className={`pricing-badge pricing-${software.pricingType.toLowerCase()}`}
          >
            {pricingLabel(software.pricingType)}
          </span>
        </div>
        <div className="card-copy">
          <h2>{software.name}</h2>
          <p>{software.tagline}</p>
        </div>
        <div className="platform-list">
          {software.platforms.slice(0, 3).map((platform) => (
            <span key={platform} className="platform-chip">
              {platform}
            </span>
          ))}
          {software.platforms.length > 3 && (
            <span className="platform-chip">
              +{software.platforms.length - 3}
            </span>
          )}
        </div>
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
