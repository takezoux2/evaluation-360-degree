import { ListEvaluation } from "~/models/evaluation.server";
import { SectionTab } from "./SectionTab";
import { useState } from "react";

export const EvaluationComponent = ({
  evaluation,
}: {
  evaluation: ListEvaluation;
}) => {
  const [showToolTip, setShowTooltip] = useState(false);

  const exp = evaluation.term.askSections[0].answerSelectionSet.explanation
    .split("\n")
    .map((s, index, arr) => {
      if (index === arr.length - 1) return s;
      else {
        return (
          <>
            {s}
            <br />
          </>
        );
      }
    });

  return (
    <div className="flex flex-col">
      <div className="flex flex-row justify-between">
        <div className="p-3">
          {evaluation.evaluatee.name}さんの180度アンケート
        </div>
        <div className="p-3">
          <button
            onClick={() => setShowTooltip((b) => !b)}
            className="rounded-lg bg-emerald-300 p-2 text-sm text-black"
          >
            選択項目の詳細📖
          </button>
          {showToolTip && (
            <div className="tooltip absolute right-5 z-10 w-[640px] rounded-lg border-green-800 bg-emerald-100 p-2">
              {exp}
            </div>
          )}
        </div>
      </div>
      <div>
        <SectionTab
          key={evaluation.id}
          sections={evaluation.term.askSections}
          evaluationId={evaluation.id}
        ></SectionTab>
      </div>
    </div>
  );
};
