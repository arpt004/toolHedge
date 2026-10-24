import { useState } from "react";
import { Capability } from "../../types/software";
import "./CapabilityList.css";

const PREVIEW_COUNT = 6;

const availabilityLabel: Record<Capability["availabilityStatus"], string> = {
  AVAILABLE: "",
  PLANNED: "Planned",
  UNAVAILABLE: "Not available",
};

export function CapabilityList({ capabilities }: { capabilities: Capability[] }) {
  const [showAll, setShowAll] = useState(false);
  if (!capabilities.length) return null;
  const visible = showAll ? capabilities : capabilities.slice(0, PREVIEW_COUNT);
  return (
    <div>
      <div className="capability-grid">
        {visible.map((capability) => (
          <article className="capability-card" key={capability.slug}>
            <div className="capability-card-heading">
              <h3>{capability.name}</h3>
              {capability.isVerified && (
                <span className="capability-verified" title="Verified">
                  ✓
                </span>
              )}
            </div>
            <p>{capability.detailedDescription ?? capability.shortDescription}</p>
            {capability.benefits.length > 0 && (
              <ul className="capability-benefits">
                {capability.benefits.map((benefit, index) => (
                  <li key={index}>{benefit}</li>
                ))}
              </ul>
            )}
            <div className="capability-meta">
              {availabilityLabel[capability.availabilityStatus] && (
                <span className="capability-badge">
                  {availabilityLabel[capability.availabilityStatus]}
                </span>
              )}
              {capability.minPlan && (
                <span className="capability-badge capability-plan">
                  {capability.minPlan.name}+
                </span>
              )}
              {capability.docUrl && (
                <a href={capability.docUrl} target="_blank" rel="noopener noreferrer">
                  Docs ↗
                </a>
              )}
            </div>
          </article>
        ))}
      </div>
      {capabilities.length > PREVIEW_COUNT && (
        <button
          className="capability-toggle"
          onClick={() => setShowAll((value) => !value)}
        >
          {showAll ? "Show fewer features" : `Show all ${capabilities.length} features`}
        </button>
      )}
    </div>
  );
}
