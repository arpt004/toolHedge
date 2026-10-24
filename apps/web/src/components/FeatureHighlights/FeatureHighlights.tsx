import { Capability } from "../../types/software";
import "./FeatureHighlights.css";

export function FeatureHighlights({
  capabilities,
  limit = 3,
}: {
  capabilities: Capability[];
  limit?: number;
}) {
  if (!capabilities.length) return null;
  const visible = capabilities.slice(0, limit);
  const remaining = capabilities.length - visible.length;
  return (
    <ul className="feature-highlights">
      {visible.map((capability) => (
        <li key={capability.slug} title={capability.shortDescription}>
          {capability.name}
        </li>
      ))}
      {remaining > 0 && <li className="feature-highlights-more">+{remaining} more</li>}
    </ul>
  );
}
