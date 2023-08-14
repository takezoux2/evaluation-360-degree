import { useState } from "react";
import { ListEvaluation } from "~/models/evaluation.server";
import { ListTerm } from "~/models/term.server";

type EvaluationListProps = {
  evaluations: ListEvaluation[];
  onSelectEvaluation: (evaluation: ListEvaluation) => void;
};

export const EvaluationList = ({
  evaluations,
  onSelectEvaluation,
}: EvaluationListProps) => {
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const list = evaluations.map((e, index) => {
    const status = (() => {
      if (e.answeredCount === 0) {
        return {
          text: "未回答",
          color: "text-red-500",
        };
      } else if (e.answeredCount >= e.totalAnswerCount) {
        return {
          text: "☑回答済み",
          color: "text-green-500",
        };
      } else {
        return {
          text: "回答中",
          color: "text-yellow-500",
        };
      }
    })();

    const bgColor = index === selectedIndex ? "bg-blue-200" : "bg-white";

    return (
      <button
        className="w-full rounded-sm border text-left text-sm"
        key={index}
      >
        <div
          className={"flex flex-col px-4 py-3 hover:bg-cyan-100 " + bgColor}
          onClick={() => {
            setSelectedIndex(index);
            onSelectEvaluation(e);
          }}
        >
          <div className={status.color}>{status.text}</div>
          <div>対象: {e.evaluatee.name}</div>
          <div>
            回答数: {e.answeredCount} / {e.totalAnswerCount}
          </div>
        </div>
      </button>
    );
  });

  return <div className="boder flex flex-col rounded-lg">{list}</div>;
};
