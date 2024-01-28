import { json, LoaderArgs, type V2_MetaFunction } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import { useState } from "react";
import { EvaluationComponent } from "~/components/Evaluation/EvaluationComponent";
import { TermList } from "~/components/Term/TermList";
import { getListEvaluations, ListEvaluation } from "~/models/evaluation.server";
import { requireUser } from "~/session.server";
import { getTerms } from "./effect.server";

export const meta: V2_MetaFunction = () => [{ title: "記述式試験" }];

export const loader = async ({ params, request }: LoaderArgs) => {
  const user = await requireUser(request);
  const terms = await getTerms(user);
  return json({ terms });
};
export default function Index() {
  const { terms } = useLoaderData<typeof loader>();
  const buttonClassName = "bg-green-300 border-black p-2 rounded-md";

  const termList = terms.map((t) => {
    const essayExams = t.EssayExam.map((e) => {
      return (
        <div key={e.id} className="m-2">
          <a className={buttonClassName} href={`/essay_exam/${e.id}`}>
            {e.name}
          </a>
        </div>
      );
    });
    return (
      <div key={t.id}>
        <div>{t.name}</div>
        <div className="flex flex-col">
          <div className="m-2">
            <a className={buttonClassName} href={`/skill_sheet/${t.id}`}>
              スキルシート
            </a>
          </div>
          {essayExams}
        </div>
      </div>
    );
  });

  return <main className="min-h-screen bg-white p-3">{termList}</main>;
}
