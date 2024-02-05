import { json, type LoaderArgs, type V2_MetaFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { getUser, requireUser } from "~/session.server";
import { TermPanel } from "./TermPanel";
import { getTermData } from "./effect.server";
import { toUntil } from "~/time_util";

export const meta: V2_MetaFunction = () => [{ title: "アンケートシステム" }];

export const loader = async ({ request, params }: LoaderArgs) => {
  const user = await requireUser(request);
  const termId = Number(params.termId);
  const termData = await getTermData(user.id, termId);
  return json({ user, termData });
};

export default function Index() {
  const { user, termData } = useLoaderData<typeof loader>();
  const buttonClassName =
    "bg-green-300 border border-black p-2 rounded-md w-64";
  const essayExams = termData.essayExams.map((e) => {
    return (
      <div key={e.id}>
        <a className={buttonClassName} href={`/essay_exam/${e.id}`}>
          {e.name}
        </a>
      </div>
    );
  });
  const exams = termData.exams.map((e) => {
    return (
      <div key={e.id}>
        <div>{e.name}</div>
        <div>受験時間:{e.timeLimitInMinutes}分</div>
        <div>状態:{e.state}</div>
        <div>
          {e.state === "回答済" ? (
            <span
              className={buttonClassName.replace("bg-green-300", "bg-gray-300")}
            >
              回答済
            </span>
          ) : (
            <a href={`/exam/${e.id}`} className={buttonClassName}>
              回答する
            </a>
          )}
        </div>
      </div>
    );
  });
  return (
    <main className="relative flex min-h-screen flex-col bg-white p-2">
      <div className="flex flex-col rounded-md bg-blue-100">
        <div className="rounded-t-md bg-blue-300 p-2">受験期間情報</div>

        <div className="flex flex-col p-2">
          <div className="flex flex-row">
            <div className="w-32 border border-black px-3 text-right">名前</div>
            <div className="w-64 border border-black  px-2">
              {termData.term.name}
            </div>
          </div>
          <div className="flex flex-row">
            <div className=" w-32 border border-black px-3 text-right">
              受験期間
            </div>
            <div className="w-64 border border-black px-2">
              ～{toUntil(new Date(termData.term.endAt))}まで
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-col rounded-md bg-indigo-100">
        <div className="rounded-t-md bg-indigo-300 p-2">180度評価</div>
        <div className="flex flex-col p-2">
          <div>
            <a
              className={buttonClassName}
              href={`/evaluation/${termData.term.id}`}
            >
              評価する
            </a>
          </div>
        </div>
      </div>
      <div className="mt-3 flex flex-col rounded-md bg-indigo-100">
        <div className="rounded-t-md bg-indigo-300 p-2">スキルテスト</div>
        <div className="flex flex-col p-2">{exams}</div>
      </div>
      <div className="mt-3 flex flex-col rounded-md bg-indigo-100">
        <div className="rounded-t-md bg-indigo-300 p-2">記述試験</div>
        <div className="flex flex-col p-2">{essayExams}</div>
      </div>
      <div className="mt-3 flex flex-col rounded-md bg-indigo-100">
        <div className="rounded-t-md bg-indigo-300 p-2">スキルシート入力</div>
        <div className="flex flex-col p-2">
          <div>
            <a
              className={buttonClassName}
              href={`/skill_sheet/${termData.term.id}`}
            >
              入力
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
