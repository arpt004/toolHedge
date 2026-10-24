import { PlanRecommendation } from "../../types/software";
import "./PlanRecommendationList.css";

const scenarioLabel = (scenario: string) =>
  scenario
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

export function PlanRecommendationList({
  recommendations,
}: {
  recommendations: PlanRecommendation[];
}) {
  if (!recommendations.length) return null;
  return (
    <div className="plan-rec-grid">
      {recommendations.map((rec) => (
        <article className="plan-rec-card" key={rec.scenario}>
          <div className="plan-rec-heading">
            <span className="plan-rec-scenario">{scenarioLabel(rec.scenario)}</span>
            <span className="capability-badge capability-plan">{rec.recommendedPlan.name}</span>
          </div>
          {rec.targetProfile && <p className="plan-rec-profile">{rec.targetProfile}</p>}
          <p>{rec.reasons}</p>
          {rec.confidenceLevel && (
            <small>Confidence: {rec.confidenceLevel.toLowerCase()}</small>
          )}
        </article>
      ))}
    </div>
  );
}
