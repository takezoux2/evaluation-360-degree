import { json, type LoaderArgs, type V2_MetaFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { getUser, requireUser } from "~/session.server";
import { TermPanel } from "./TermPanel";
import { getTermData } from "./effect.server";
import { toHumanFriendly, toUntil } from "~/time_util";

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

  const clickableItem = "block rounded border p-2 hover:bg-orange-300";
  const essayExams = termData.essayExams.map((e) => {
    return (
      <div key={e.id}>
        <a className={clickableItem} href={`/essay_exam/${e.id}`}>
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
            <span className="block rounded border bg-gray-300 p-2">回答済</span>
          ) : (
            <a href={`/exam/${e.id}`} className={clickableItem}>
              回答する
            </a>
          )}
        </div>
      </div>
    );
  });
  const pHeader = "bold rounded-t-md bg-indigo-300 p-2 text-lg";
  return (
    <main className="relative flex min-h-screen flex-col bg-white p-2">
      <div className="flex flex-col rounded-md bg-blue-100">
        <div className="rounded-t-md bg-blue-300 p-2 text-lg font-bold">
          受験期間情報
        </div>

        <div className="flex flex-col">
          <div className="flex flex-row">
            <div className="w-32 border border-gray-500 px-3 py-1 text-right">
              名前
            </div>
            <div className="w-full border border-gray-500 px-3 py-1">
              {termData.term.name}
            </div>
          </div>
          <div className="flex flex-row">
            <div className="w-32 border border-gray-500 px-3 py-1 text-right">
              受験期間
            </div>
            <div className="w-full border border-gray-500 px-3 py-1">
              {toHumanFriendly(termData.term.startAt)}～
              {toUntil(new Date(termData.term.endAt))}まで
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-col rounded-md bg-indigo-100">
        <div className={pHeader}>180度評価</div>
        <div className="flex flex-col">
          <a className={clickableItem} href={`/evaluation/${termData.term.id}`}>
            評価開始
          </a>
        </div>
      </div>
      <div className="mt-3 flex flex-col rounded-md bg-indigo-100">
        <div className={pHeader}>スキルテスト</div>
        <div className="flex flex-col">{exams}</div>
      </div>
      <div className="mt-3 flex flex-col rounded-md bg-indigo-100">
        <div className={pHeader}>記述試験</div>
        <div className="flex flex-col">{essayExams}</div>
      </div>
      <div className="mt-3 flex flex-col rounded-md bg-indigo-100">
        <div className={pHeader}>スキルシート入力</div>
        <div className="flex flex-col">
          <div>
            <a
              className={clickableItem}
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
