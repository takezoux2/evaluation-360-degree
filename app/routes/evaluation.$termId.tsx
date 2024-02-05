import { json, LoaderArgs, type V2_MetaFunction } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import { useState } from "react";
import invariant from "tiny-invariant";
import { EvaluationComponent } from "~/components/Evaluation/EvaluationComponent";
import { ExamPageHader } from "~/components/ExamPageHeader";
import { TermList } from "~/components/Term/TermList";
import {
  getEvaluation,
  getListEvaluations,
  ListEvaluation,
} from "~/models/evaluation.server";
import { getTermById, getTermsInTerm, isInTerm } from "~/models/term.server";
import { requireUser } from "~/session.server";

export const meta: V2_MetaFunction = () => [{ title: "180度アンケート" }];

export const loader = async ({ params, request }: LoaderArgs) => {
  const user = await requireUser(request);
  const termId = Number(params.termId);
  const inTerm = await isInTerm(user.id, termId);
  invariant(inTerm, "Term is not in term");
  const term = await getTermById(termId);
  invariant(term, "Term not found");
  const evaluations = await getListEvaluations({
    termIds: [termId],
    userId: user.id,
  });

  return json({ term, evaluations, user });
};
export default function Index() {
  const { term, evaluations, user } = useLoaderData<typeof loader>();
  const [evaluation, setEvaluation] = useState<ListEvaluation | null>(null);

  const evaluationComponent = evaluation ? (
    <EvaluationComponent evaluation={evaluation}></EvaluationComponent>
  ) : (
    <div>
      アンケート対象を選択してください
      <br />
      <ul className="list-disc px-5">
        <li>評価期間中は、回答の修正可能です</li>
        <li>すべての項目に回答お願いします</li>
        <li>回答は自動で保存されます</li>
      </ul>
      <br />
    </div>
  );
  const termComponent = (
    <div>
      <TermList
        term={term}
        evaluations={evaluations}
        onSelectEvaluation={(e) => setEvaluation(e)}
      />
    </div>
  );

  return (
    <>
      <ExamPageHader term={term} user={user} />
      <main className="min-h-screen bg-white p-3">
        <div className="items-left flex flex-row">
          <div className="w-1/4">{termComponent}</div>
          <div className="w-3/4 p-5">{evaluationComponent}</div>
        </div>
      </main>
    </>
  );
}
