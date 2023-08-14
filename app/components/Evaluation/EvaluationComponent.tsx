import { ListEvaluation } from "~/models/evaluation.server";
import { SectionTab } from "./SectionTab";

export const EvaluationComponent = ({
  evaluation,
}: {
  evaluation: ListEvaluation;
}) => {
  return (
    <div className="flex flex-col">
      <div className="p-3">{evaluation.evaluatee.name}さんの360度評価</div>
      <div>
        <SectionTab
          sections={evaluation.term.askSections}
          evaluationId={evaluation.id}
        ></SectionTab>
      </div>
    </div>
  );
};
