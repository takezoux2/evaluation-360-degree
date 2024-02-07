import { ListEvaluation } from "~/models/evaluation.server";
import { ListTerm, SimpleTerm } from "~/models/term.server";
import { EvaluationList } from "./EvaluationList";
import { DateTime } from "luxon";
import { toUntil } from "~/time_util";

type TermListProps = {
  term: SimpleTerm;
  evaluations: ListEvaluation[];
  onSelectEvaluation: (evaluation: ListEvaluation) => void;
};

export const TermList = ({
  term,
  evaluations,
  onSelectEvaluation,
}: TermListProps) => {
  const evals = evaluations.filter((e) => e.termId === term.id);
  const endAt = DateTime.fromISO(term.endAt);
  const endAtLabel = toUntil(endAt.toJSDate());
  const termBlock = (
    <div className="w-full">
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

  return <div className="flex flex-col">{termBlock}</div>;
};
