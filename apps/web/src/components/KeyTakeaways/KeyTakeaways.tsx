import { Takeaway } from "../../types/software";
import "./KeyTakeaways.css";

const fields: Array<{ key: keyof Takeaway; label: string }> = [
  { key: "mainValueProp", label: "Main value proposition" },
  { key: "biggestStrength", label: "Biggest strength" },
  { key: "bestUseCase", label: "Best use case" },
  { key: "bestFitAudience", label: "Best-fit audience" },
  { key: "standoutFeature", label: "Standout feature" },
  { key: "pricingTakeaway", label: "Pricing takeaway" },
  { key: "mainLimitation", label: "Main limitation" },
  { key: "bestReasonToChoose", label: "Best reason to choose it" },
  { key: "importantConsideration", label: "Before you buy" },
];

export function KeyTakeaways({ takeaway }: { takeaway: Takeaway }) {
  const items = fields.filter(({ key }) => takeaway[key]);
  if (!items.length) return null;
  return (
    <div className="takeaway-grid">
      {items.map(({ key, label }) => (
        <div className="takeaway-card" key={key}>
          <h3>{label}</h3>
          <p>{takeaway[key]}</p>
        </div>
      ))}
    </div>
  );
}
