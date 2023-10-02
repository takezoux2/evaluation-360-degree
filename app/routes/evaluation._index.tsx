import { json, LoaderArgs, type V2_MetaFunction } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import { useState } from "react";
import { EvaluationComponent } from "~/components/Evaluation/EvaluationComponent";
import { TermList } from "~/components/Term/TermList";
import { getListEvaluations, ListEvaluation } from "~/models/evaluation.server";
import { getTermsInTerm } from "~/models/term.server";
import { requireUser } from "~/session.server";

export const meta: V2_MetaFunction = () => [{ title: "180度アンケート" }];

export const loader = async ({ params, request }: LoaderArgs) => {
  const user = await requireUser(request);

  const terms = await getTermsInTerm(user.id);
  const evaluations =
    terms.length > 0 && !params._data
      ? await getListEvaluations({
          termIds: terms.map((t) => t.id),
          userId: user.id,
        })
      : [];

  return json({ terms, evaluations, user });
};
export default function Index() {
  const { terms, evaluations, user } = useLoaderData<typeof loader>();
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
  const termComponent =
    terms.length > 0 ? (
      <div>
        <TermList
          terms={terms}
          evaluations={evaluations}
          onSelectEvaluation={(e) => setEvaluation(e)}
        />
      </div>
    ) : (
      <div>現在は評価期間外です</div>
    );

  return (
    <>
      <header>
        <div className="flex flex-row items-center justify-between p-1">
          <div className="basis-3/6">
            <h2 className="px-2 text-2xl">
              <a href="/">180度アンケートシステム</a>
            </h2>
          </div>
          <div className="basis-2/6 p-2 text-right">
            {user.name}:{user.Job.name}
          </div>

          <div className="basis-1/6 text-right">
            <Form reloadDocument action="/logout" method="post">
              <button
                type="submit"
                className=" rounded-lg bg-blue-500 p-2 text-white"
              >
                ログアウト
              </button>
            </Form>
          </div>
        </div>
      </header>
      <main className="min-h-screen bg-white p-3">
        <div className="items-left flex flex-row">
          <div className="w-1/4">{termComponent}</div>
          <div className="w-3/4 p-5">{evaluationComponent}</div>
        </div>
      </main>
    </>
  );
}
