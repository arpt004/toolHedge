import { PricingType } from "../../types/software";
import { pricingLabel } from "../../utils/pricing";
import "./PricingBadge.css";

export function PricingBadge({ pricingType }: { pricingType: PricingType }) {
  return (
    <span className={`pricing-badge pricing-${pricingType.toLowerCase()}`}>
      {pricingLabel(pricingType)}
    </span>
  );
}
