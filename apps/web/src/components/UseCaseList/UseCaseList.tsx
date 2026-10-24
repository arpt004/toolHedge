import { UseCase } from "../../types/software";
import "./UseCaseList.css";

const difficultyLabel: Record<UseCase["difficultyLevel"], string> = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
};

export function UseCaseList({ useCases }: { useCases: UseCase[] }) {
  if (!useCases.length) return null;
  return (
    <div className="use-case-grid">
      {useCases.map((useCase) => (
        <article className="use-case-card" key={useCase.slug}>
          <h3>{useCase.name}</h3>
          <p>{useCase.description}</p>
          {useCase.problem && (
            <p className="use-case-problem">
              <strong>Problem solved: </strong>
              {useCase.problem}
            </p>
          )}
          <div className="use-case-meta">
            <span className="capability-badge">{difficultyLabel[useCase.difficultyLevel]}</span>
            {useCase.industry && <span className="capability-badge">{useCase.industry}</span>}
            {useCase.suggestedPlan && (
              <span className="capability-badge capability-plan">
                {useCase.suggestedPlan.name} plan
              </span>
            )}
            {useCase.estimatedEffort && <span className="capability-badge">{useCase.estimatedEffort}</span>}
          </div>
        </article>
      ))}
    </div>
  );
}
