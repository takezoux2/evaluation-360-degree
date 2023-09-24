import { json, LoaderArgs, type V2_MetaFunction } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import { useState } from "react";
import { EvaluationComponent } from "~/components/Evaluation/EvaluationComponent";
import { TermList } from "~/components/Term/TermList";
import { getListEvaluations, ListEvaluation } from "~/models/evaluation.server";
import { getTerms } from "~/models/term.server";
import { requireUser } from "~/session.server";
import { getAnswerSelectionSet } from "./AnswerSelectionSet.server";

export const meta: V2_MetaFunction = () => [{ title: "180度アンケート" }];

export const loader = async ({ params, request }: LoaderArgs) => {
  const user = await requireUser(request);
  const selectionSetId = parseInt(params.selectionSetId ?? "0");
  const answerSelectionSet = await getAnswerSelectionSet(selectionSetId);

  return json({ answerSelectionSet });
};
export default function Index() {
  const { answerSelectionSet } = useLoaderData<typeof loader>();
  const exp = answerSelectionSet?.explanation
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
    <main className="min-h-screen bg-white p-3">
      <div>{exp}</div>
    </main>
  );
}
