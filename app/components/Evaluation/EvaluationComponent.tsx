import { ListEvaluation } from "~/models/evaluation.server";
import { SectionTab } from "./SectionTab";
import { useState } from "react";

export const EvaluationComponent = ({
  evaluation,
}: {
  evaluation: ListEvaluation;
}) => {
  return (
    <div className="flex flex-col">
      <div className="flex flex-row justify-between">
        <div className="p-3">
          {evaluation.evaluatee.name}さんの180度アンケート
        </div>
        <div className="p-3">
          <button
            className="rounded-lg bg-emerald-300 p-2 text-sm text-black"
            onClick={() => {
              const selectionSetId =
                evaluation.term.askSections[0].answerSelectionSet.id;
              const url = "/evaluation/selection_help/" + selectionSetId;
              const windowName = "選択項目の詳細";
              const windowFeatures =
                "width=600,height=400,menubar=no,toolbar=no,location=no,resizable=yes,scrollbars=yes,status=no";
              window.open(url, windowName, windowFeatures);
            }}
          >
            選択項目の詳細📖
          </button>
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
