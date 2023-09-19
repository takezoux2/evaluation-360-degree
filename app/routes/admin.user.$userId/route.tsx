import {
  ActionArgs,
  json,
  LoaderArgs,
  type V2_MetaFunction,
} from "@remix-run/node";
import * as yaml from "yaml";
import {
  Form,
  useActionData,
  useFetcher,
  useLoaderData,
  useSubmit,
} from "@remix-run/react";
import { getTerms } from "~/models/term.server";
import { useState } from "react";
import { getEvaluatees, getEvaluators, getUser } from "./user_detail.server";

export const meta: V2_MetaFunction = () => [{ title: "ユーザー一覧" }];

export const action = async ({ request, params }: ActionArgs) => {
  const userId = Number(params.userId);
  const body = await request.formData();
  const termId = Number(body.get("termId"));
  const evaluatees = await getEvaluatees({ userId, termId });
  const evaluators = await getEvaluators({ userId, termId });
  return json({
    evaluatees,
    evaluators,
  });
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const userId = Number(params.userId);
  const terms = await getTerms();
  const showUser = await getUser(userId);
  return json({
    terms,
    showUser,
  });
};

export default function Users() {
  const { showUser, terms } = useLoaderData<typeof loader>();
  const [termId, setTermId] = useState<string | null>(null);

  const submit = useSubmit();
  const actionResult = useActionData<typeof action>();
  const { evaluatees, evaluators } = actionResult ?? {
    evaluatees: [],
    evaluators: [],
  };

  return (
    <div className="flex flex-col">
      <div className="flex flex-row">
        <div className="w-1/4">
          <a
            href="/admin/users"
            className="rounded-lg border bg-sky-300 px-3 py-2"
          >
            一覧に戻る
          </a>
        </div>
      </div>
      <div className="my-3 flex flex-col">
        <div>基本情報</div>
        <div className="flex flex-row">
          <div className="w-1/4 border p-2">氏名</div>
          <div className="w-3/4 border p-2">{showUser?.name}</div>
        </div>
        <div className="flex flex-row">
          <div className="w-1/4 border p-2">email</div>
          <div className="w-3/4 border p-2">{showUser?.email}</div>
        </div>
        <div className="flex flex-row">
          <div className="w-1/4 border p-2">職種</div>
          <div className="w-3/4 border p-2">{showUser?.Job.name}</div>
        </div>
        <div className="flex flex-row">
          <div className="w-1/4 border p-2">ロール</div>
          <div className="w-3/4 border p-2">
            {showUser?.roles.map((role) => {
              return (
                <span className="rounded-xl bg-gray-200 px-3 text-sm">
                  {role.name}
                </span>
              );
            })}
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <select
          className="rounded-lg border p-2"
          value={termId ?? "empty"}
          onChange={(e) => {
            setTermId(e.target.value);
            const formData = new FormData();
            if (e.target.value !== "empty") {
              formData.set("termId", e.target.value);
              submit(formData, { method: "post", replace: true });
            }
          }}
        >
          <option value="empty">期間を選択してください</option>
          {terms.map((term) => {
            return <option value={term.id}>{term.name}</option>;
          })}
        </select>
      </div>
      <div className="flex flex-col rounded-md border p-1">
        <div>評価する対象</div>
        <div>
          <ol className="list-decimal pl-4">
            {evaluatees.map((evaluation) => {
              return (
                <li>
                  {evaluation.evaluatee.name}
                  {evaluation.answerItems.length + "回答済み"}
                </li>
              );
            })}
          </ol>
        </div>
      </div>
      <div className="flex flex-col rounded-md border p-1">
        <div>評価者</div>
        <div>
          <ol className="list-decimal pl-4">
            {evaluators.map((evaluation) => {
              return (
                <li>
                  {evaluation.evaluator.name}
                  {evaluation.answerItems.length + "回答済み"}
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </div>
  );
}
