import {
  ActionArgs,
  json,
  LoaderArgs,
  type V2_MetaFunction,
} from "@remix-run/node";
import * as yaml from "yaml";
import { Form, useLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";
import { getLatestTerms, getTermById } from "~/models/term.server";
import { toInputDateTimeLocal, toUntil } from "~/time_util";
import { upsertAskSelectionSet } from "~/models/term_update.server";
import Editor from "@monaco-editor/react";
import { useState } from "react";
import {
  addExamCheatLog,
  ExamState,
  FullExam,
  getNotAnsweredExamsInTerm,
  startExamination,
  updateAnswer,
} from "~/models/exam.server";
import { requireUser } from "~/session.server";
import ExamPanel from "~/components/Exam/ExamPanel";

export const meta: V2_MetaFunction = () => [{ title: "スキルテスト" }];

export const action = async ({ request }: ActionArgs) => {
  const user = await requireUser(request);
  const formData = await request.formData();

  const cheatType = formData.get("cheatType");
  const examAnswerId = Number(formData.get("examAnswerId") ?? "0");
  // チートログの追記
  if (cheatType) {
    const message = formData.get("message") ?? "Unknown cheat type";
    await addExamCheatLog({
      userId: user.id,
      examAnswerId: examAnswerId as number,
      cheatType: cheatType as string,
      message: message as string,
    });
    return {
      message: "Cheat log is added",
    };
  }
  // 試験の開始
  const startExam = formData.get("startExam");
  if (startExam) {
    const examinationId = Number(formData.get("examinationId") ?? "0");
    const answer = await startExamination(user.id, examinationId);
    console.log(answer);
    return json({
      message: "Start examination",
      answer: answer,
    });
  }

  // 試験の回答
  const examQuestionSelectionId = Number(
    formData.get("examQuestionSelectionId") ?? "0"
  );
  if (examQuestionSelectionId) {
    const examAnswerId = Number(formData.get("examAnswerId") ?? "0");
    await updateAnswer({
      userId: user.id,
      examAnswerId: examAnswerId,
      examQuestionSelectionId: examQuestionSelectionId,
    });
    return {
      message: "Update answer",
    };
  }

  return {
    message: "No effect",
  };
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const user = await requireUser(request);

  const exams = await getNotAnsweredExamsInTerm(user.id);
  return json({
    user,
    exams: exams.map((exam) => {
      return {
        termName: exam.term.name,
        until: toUntil(exam.term.endAt),
        examName: exam.exam.name,
        timeLimitInMinutes: exam.exam.timeLimitInMinutes,
        ...exam,
      };
    }),
  });
};

export default function Exam() {
  const { exams, user } = useLoaderData<typeof loader>();
  const [selectedExam, setSelectedExam] = useState<FullExam | null>(null);

  const examList =
    exams.length > 0 ? (
      exams.map((exam, index) => {
        const className =
          exam.exam.state === "回答済"
            ? "bg-gray-200"
            : "hover:bg-green-200 hover:cursor-pointer";
        return (
          <div
            key={index}
            onClick={() => {
              if (exam.exam.state === "回答済") return;
              setSelectedExam(exam);
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
              <div className="w-2/3 border pl-2">{exam.exam.state}</div>
            </div>
          </div>
        );
      })
    ) : (
      <span>現在受験可能なスキルテストはありません</span>
    );

  return (
    <>
      <header>
        <div className="flex flex-row items-center justify-between p-1">
          <div className="basis-3/6">
            <h2 className="px-2 text-2xl">
              <a href="/">スキルテスト</a>
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
          <div className="w-1/4">{examList}</div>
          <div className="w-3/4 p-5">
            <ExamPanel selectedExam={selectedExam} />
          </div>
        </div>
      </main>
    </>
  );
}
