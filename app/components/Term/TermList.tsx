import { ListEvaluation } from "~/models/evaluation.server";
import { ListTerm } from "~/models/term.server";
import { EvaluationList } from "./EvaluationList";
import { DateTime } from "luxon";
import { toUntil } from "~/time_util";

type TermListProps = {
  terms: ListTerm[];
  evaluations: ListEvaluation[];
  onSelectEvaluation: (evaluation: ListEvaluation) => void;
};

export const TermList = ({
  terms,
  evaluations,
  onSelectEvaluation,
}: TermListProps) => {
  const list = terms.map((term, index) => {
    const evals = evaluations.filter((e) => e.termId === term.id);
    const endAt = DateTime.fromISO(term.endAt);
    const endAtLabel = toUntil(endAt.toJSDate());
    return (
      <div key={"t" + index} className="w-full">
        <div className="flex flex-col rounded-lg border">
          <div className="flex w-full flex-col rounded-t-lg bg-sky-600 p-2">
            <div>{term.name}</div>
            <div>回答期限: {endAtLabel}まで</div>
          </div>
          <div>
            <EvaluationList
              evaluations={evals}
              onSelectEvaluation={onSelectEvaluation}
            />
          </div>
        </div>
      </div>
    );
  });

  return <div className="flex flex-col">{list}</div>;
};
