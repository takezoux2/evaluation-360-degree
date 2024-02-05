import { FullExam } from "~/models/exam.server";
import { ExamQuestionPanel } from "./ExamQuestionPanel";
import { useFetcher, useSubmit } from "@remix-run/react";
import ExamProgressBar from "./ExamProgressBar";
import { useState } from "react";
import { DateTime } from "luxon";
import ExamTimeBar from "./ExamTimeBar";

export type ExamAnswers = {
  startedAt: string;
  endedAt: string;
  examAnswerId: number;
  answers: { questionId: number; examQuestionSelectionId: number }[];
};

export function ExamAnswerPanel({
  exam,
  examAnswers,
  onFinish,
}: {
  exam: FullExam;
  examAnswers: ExamAnswers;
  onFinish: () => void;
}) {
  const fetcher = useFetcher();
  const [questionIndex, setQuestionIndex] = useState(0);
  const question = exam.examQuestions[questionIndex];
  const [answers, setAnswers] = useState(examAnswers.answers);
  const updateAnswers = (
    questionId: number,
    examQuestionSelectionId: number
  ) => {
    setAnswers((answers) => {
      const newAnswers = answers.filter((a) => a.questionId !== questionId);
      newAnswers.push({ questionId, examQuestionSelectionId });
      return newAnswers;
    });
  };
  if (!question) {
    return (
      <div className="p-4">
        全問回答しました。
        <br />
        これでスキルテストは終了です。
        <br />
        お疲れ様でした。
      </div>
    );
  }
  return (
    <div className="flex flex-col">
      <div className="p-1">
        <ExamTimeBar
          start={DateTime.fromISO(examAnswers.startedAt)}
          end={DateTime.fromISO(examAnswers.endedAt)}
          onFinish={() => {
            onFinish();
          }}
        />
      </div>
      <div className="p-1">
        <ExamProgressBar
          onChangePage={(page) => setQuestionIndex(page - 1)}
          current={questionIndex + 1}
          max={exam.examQuestions.length}
        />
      </div>
      <div>
        <ExamQuestionPanel
          examQuestion={question}
          selectedSelectionId={
            answers.find((a) => a.questionId === question.id)
              ?.examQuestionSelectionId ?? -1
          }
          onCheeted={(e) => {
            const formData = new FormData();
            formData.set("action", "cheat");
            formData.set(
              "data",
              JSON.stringify({
                examAnswerId: examAnswers.examAnswerId,
                cheatType: e.type,
                message: e.message,
              })
            );
            fetcher.submit(formData, {
              method: "post",
              action: "/exam/send-answer",
              replace: true,
            });
          }}
          onSelectedAnswer={(e) => {
            const formData = new FormData();
            formData.set("action", "answer");
            formData.set(
              "data",
              JSON.stringify({
                examAnswerId: examAnswers.examAnswerId,
                examQuestionSelectionId: e.examQuestionSelectionId,
              })
            );
            fetcher.submit(formData, {
              method: "post",
              action: "/exam/send-answer",
              replace: true,
            });
            setQuestionIndex((i) => {
              return i + 1;
            });
            updateAnswers(question.id, e.examQuestionSelectionId);
          }}
        />
      </div>
    </div>
  );
}

export default ExamAnswerPanel;
