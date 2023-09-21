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
import {
  getEvaluatees,
  getEvaluators,
  getUser,
  deleteEvaluation,
  getExamAnswers,
  extendExamTime,
  getTerm,
  extendTermEnd,
} from "./user_detail.server";
import { requireAdminUser } from "~/session.server";
import { DateTime, Zone } from "luxon";

export const meta: V2_MetaFunction = () => [{ title: "ユーザー一覧" }];

const ActionTypes = {
  delete: "delete",
  extendExamTime: "extendExamTime",
  extendTermEnd: "extendTermEnd",
} as const;
export const action = async ({ request, params }: ActionArgs) => {
  await requireAdminUser(request);
  const userId = Number(params.userId);
  const body = await request.formData();
  const type = body.get("type");
  if (type === ActionTypes.delete) {
    await deleteEvaluation(Number(body.get("evaluationId")));
  } else if (type === ActionTypes.extendExamTime) {
    const examinationId = Number(body.get("examId"));
    const extendMinutes = Number(body.get("extendMinutes"));
    await extendExamTime({ userId, examinationId, extendMinutes });
  } else if (type === ActionTypes.extendTermEnd) {
    const timeZone = body.get("timeZone") as string;
    const termEndAt = DateTime.fromISO(body.get("termEndAt") as string, {
      zone: timeZone,
    });
    const termId = Number(body.get("termId"));
    await extendTermEnd({ userId, termId, endAt: termEndAt });
  }
  return {
    type,
  };
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const userId = Number(params.userId);
  // get termId from query
  const termId = Number(request.url.split("?")[1]?.split("=")[1] ?? "0");
  const terms = await getTerms();
  const showUser = await getUser(userId);
  const { term, termOverride } = await getTerm({ userId, termId });
  const termData = {
    termId: termId,
    term,
    termOverride,
    evaluatees: await getEvaluatees({ userId, termId }),
    evaluators: await getEvaluators({ userId, termId }),
    examAnswers: await getExamAnswers({ userId, termId }),
  };
  return json({
    terms,
    showUser,
    termData,
  });
};

export default function Users() {
  const { showUser, terms, termData } = useLoaderData<typeof loader>();
  const { evaluatees, evaluators, examAnswers } = termData;
  const [termId, setTermId] = useState<string | null>(
    termData.termId.toString()
  );

  const submit = useSubmit();

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
            {showUser?.roles.map((role, index) => {
              return (
                <span
                  key={index}
                  className="rounded-xl bg-gray-200 px-3 text-sm"
                >
                  {role.name}
                </span>
              );
            })}
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <div>評価状況</div>
        <select
          className="rounded-lg border bg-cyan-100 p-2"
          value={termId ?? "empty"}
          onChange={(e) => {
            setTermId(e.target.value);
            const formData = new FormData();
            if (e.target.value !== "empty") {
              formData.set("termId", e.target.value);
              submit(formData, { method: "get", replace: true });
            }
          }}
        >
          <option value="empty">期間を選択してください</option>
          {terms.map((term) => {
            return (
              <option key={term.id} value={term.id}>
                {term.name}
              </option>
            );
          })}
        </select>
      </div>
      <div className="flex flex-col rounded-md border p-1">
        <div className="grid grid-cols-3">
          <div className="border bg-sky-100">評価する対象</div>
          <div className="border bg-sky-100">回答数</div>
          <div className="border bg-sky-100">削除</div>
          {evaluatees.map((evaluation, index) => {
            return (
              <>
                <div key={index + "-1"} className="border">
                  {evaluation.evaluatee.name}
                </div>
                <div key={index + "-2"} className="border">
                  {evaluation.answerItems.length}
                </div>
                <div key={index + "-3"} className="border">
                  <button
                    className="rounded-md border bg-gray-100"
                    onClick={() => {
                      if (confirm("削除しますか？\nこの操作は取り消せません")) {
                        const formData = new FormData();
                        formData.set("evaluationId", evaluation.id.toString());
                        formData.set("type", ActionTypes.delete);
                        submit(formData, { method: "post", replace: false });
                      }
                    }}
                  >
                    {evaluation.answerItems.length > 0 ? "☢Danger☢" : "🗑️"}
                  </button>
                </div>
              </>
            );
          })}
        </div>
      </div>
      <div className="flex flex-col rounded-md border p-1">
        <div className="grid grid-cols-3">
          <div className="border bg-sky-100">評価者</div>
          <div className="border bg-sky-100">回答数</div>
          <div className="border bg-sky-100">削除</div>
          {evaluators.map((evaluation, index) => {
            return (
              <>
                <div key={index + "-1"} className="border">
                  {evaluation.evaluator.name}
                </div>
                <div key={index + "-2"} className="border">
                  {evaluation.answerItems.length}
                </div>
                <div key={index + "-3"} className="border">
                  <button
                    className="rounded-md border bg-gray-100"
                    onClick={() => {
                      if (confirm("削除しますか？\nこの操作は取り消せません")) {
                        const formData = new FormData();
                        formData.set("evaluationId", evaluation.id.toString());
                        formData.set("type", ActionTypes.delete);
                        submit(formData, { method: "post", replace: false });
                      }
                    }}
                  >
                    {evaluation.answerItems.length > 0 ? "☢Danger☢" : "🗑️"}
                  </button>
                </div>
              </>
            );
          })}
        </div>
      </div>
      <div className="flex flex-col rounded-md border p-1">
        <div className="grid grid-cols-5">
          <div className="border bg-sky-100">スキルテスト</div>
          <div className="border bg-sky-100">回答開始/終了</div>
          <div className="border bg-sky-100">回答数</div>
          <div className="border bg-sky-100">チートログ</div>
          <div className="border bg-sky-100">試験時間延長</div>
          {examAnswers.map((examAnswer, index) => {
            return (
              <>
                <div key={index + "-1"} className="border">
                  {examAnswer.exam.name}
                </div>
                <div key={index + "-2"} className="border">
                  {examAnswer.answer &&
                    DateTime.fromISO(examAnswer.answer.startedAt).toFormat(
                      "MM/dd HH:mm:ss"
                    ) +
                      " ~ " +
                      (examAnswer.answer.finishedAt
                        ? DateTime.fromISO(
                            examAnswer.answer.finishedAt!
                          ).toFormat("MM/dd HH:mm:ss")
                        : "回答中")}
                </div>
                <div key={index + "-3"} className="border">
                  {examAnswer.answer
                    ? examAnswer.answer.examAnswerItem.length
                    : 0}
                </div>
                <div key={index + "-4"} className="border">
                  <ul>
                    {examAnswer.answer &&
                      examAnswer.answer.examCheatLog.map((log, index) => {
                        return (
                          <li key={index}>
                            {DateTime.fromISO(log.createdAt).toFormat(
                              "MM/dd HH:mm:ss"
                            ) +
                              "-" +
                              log.message}
                          </li>
                        );
                      })}
                  </ul>
                </div>
                <div key={index + "-5"} className="border">
                  {examAnswer.answer && examAnswer.answer.finishedAt && (
                    <>
                      <button
                        className="mx-1 rounded-md border bg-green-100 p-1"
                        onClick={() => {
                          const formData = new FormData();
                          formData.set("examId", examAnswer.exam.id.toString());
                          formData.set("type", ActionTypes.extendExamTime);
                          formData.set("extendMinutes", "10");
                          submit(formData, { method: "post", replace: false });
                        }}
                      >
                        10分延長
                      </button>
                      <button
                        className="mx-1 rounded-md border bg-green-200 p-1"
                        onClick={() => {
                          const formData = new FormData();
                          formData.set("examId", examAnswer.exam.id.toString());
                          formData.set("type", ActionTypes.extendExamTime);
                          formData.set("extendMinutes", "30");
                          submit(formData, { method: "post", replace: false });
                        }}
                      >
                        30分延長
                      </button>
                    </>
                  )}
                </div>
              </>
            );
          })}
        </div>
      </div>
      <div className="flex flex-col rounded-md border p-1">
        <div>評価期間</div>
        <form method="post">
          <input
            type="datetime-local"
            name="termEndAt"
            defaultValue={DateTime.fromISO(
              termData.termOverride?.endAt ??
                termData.term?.endAt ??
                "2000-01-01"
            ).toFormat("yyyy-MM-dd'T'HH:mm")}
          />
          <input
            type="hidden"
            name="timeZone"
            value={DateTime.local().zoneName ?? ""}
          />
          <input type="hidden" name="type" value={ActionTypes.extendTermEnd} />
          <input type="hidden" name="termId" value={termId + ""} />
          <button
            type="submit"
            className="rounded-md border bg-green-200 p-2 hover:bg-green-300"
          >
            評価期限延長
          </button>
        </form>
      </div>
    </div>
  );
}
