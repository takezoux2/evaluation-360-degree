import {
  ActionArgs,
  json,
  LoaderArgs,
  type V2_MetaFunction,
} from "@remix-run/node";
import * as yaml from "yaml";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";
import { getLatestTerms, getTermById } from "~/models/term.server";
import { toInputDateTimeLocal, toUntil } from "~/time_util";
import { upsertAskSelectionSet } from "~/models/term_update.server";
import Editor from "@monaco-editor/react";
import { useState } from "react";
import { getNotAnsweredExamsInTerm } from "~/models/exam.server";
import { requireUser } from "~/session.server";
import { DateTime } from "luxon";
import { StripReturnType } from "~/models/type_util";
import CountDownTimer from "~/components/CountDownTimer";
import { ExamStartPanel } from "~/components/Exam/ExamStartPanel";
import { ExamQuestionPanel } from "~/components/Exam/ExamQuestionPanel";

export const meta: V2_MetaFunction = () => [{ title: "Remix Notes" }];

export const loader = async ({ request, params }: LoaderArgs) => {
  const user = await requireUser(request);

  const exams = await getNotAnsweredExamsInTerm(
    Number(params["termId"] ?? "0")
  );
  const now = DateTime.local();
  return json({
    user,
    exams: exams.map((exam) => {
      const leftTime = exam.answer
        ? DateTime.fromJSDate(exam.answer.endedAt).diff(now).seconds
        : 0;
      return {
        termName: exam.term.name,
        until: toUntil(exam.term.endAt),
        examName: exam.exam.name,
        timeLimitInMinutes: exam.exam.timeLimitInMinutes,
        status: exam.answer
          ? leftTime > 0
            ? "開始済み"
            : "受験済み"
          : "未受験",
        exam: exam,
      };
    }),
  });
};

export default function Exam() {
  const { exams, user } = useLoaderData<typeof loader>();
  type Exam = StripReturnType<typeof getNotAnsweredExamsInTerm>;
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);

  const examList =
    exams.length > 0 ? (
      exams.map((exam) => {
        const className =
          exam.status === "受験済み"
            ? "bg-gray-200"
            : "hover:bg-green-200 hover:cursor-pointer";
        return (
          <div
            onClick={() => {
              setSelectedExam(exam.exam);
            }}
            className={className + " my-3 flex flex-col border-black"}
          >
            <div className="flex flex-row">
              <div className="w-1/3 border pl-2">期間</div>
              <div className="w-2/3 border pl-2">{exam.termName}</div>
            </div>
            <div className="flex flex-row">
              <div className="w-1/3 border pl-2">試験名</div>
              <div className="w-2/3 border pl-2">{exam.examName}</div>
            </div>
            <div className="flex flex-row">
              <div className="w-1/3 border pl-2">受験期限</div>
              <div className="w-2/3 border pl-2">{exam.until}まで</div>
            </div>
            <div className="flex flex-row">
              <div className="w-1/3 border pl-2">制限時間</div>
              <div className="w-2/3 border pl-2">
                {exam.timeLimitInMinutes}分
              </div>
            </div>
            <div className="flex flex-row">
              <div className="w-1/3 border pl-2">受験状況</div>
              <div className="w-2/3 border pl-2">{exam.status}</div>
            </div>
          </div>
        );
      })
    ) : (
      <span>現在受験可能な試験はありません</span>
    );

  const examComponent = selectedExam ? (
    // <div>
    //   ID:{selectedExam.exam.id} -{" "}
    //   <CountDownTimer
    //     end={DateTime.local().plus({ minutes: 1, seconds: 5 })}
    //   ></CountDownTimer>
    // </div>
    // <ExamStartPanel
    //   limitMinute={selectedExam.exam.timeLimitInMinutes}
    //   onStartExam={() => console.log("Start")}
    // />
    <ExamQuestionPanel
      examQuestion={selectedExam.exam.examQuestions[0]}
      onCheeted={(e) => console.log(e)}
      onSelectedAnswer={(e) => console.log(e)}
    />
  ) : (
    <div>試験を選択してください</div>
  );

  return (
    <>
      <header>
        <div className="flex flex-row items-center justify-between p-1">
          <div className="basis-3/6">
            <h2 className="px-2 text-2xl">情報科学 試験</h2>
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
          <div className="w-1/4">{examList}</div>
          <div className="w-3/4 p-5">{examComponent}</div>
        </div>
      </main>
    </>
  );
}
