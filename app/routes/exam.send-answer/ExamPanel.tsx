import { useFetcher, useSubmit } from "@remix-run/react";
import { useState } from "react";
import { FullExam } from "~/models/exam.server";
import { ExamStartPanel } from "./ExamStartPanel";
import ExamAnswerPanel from "./ExamAnswerPanel";
import { redirect } from "@remix-run/node";

export function ExamPanel({ exam }: { exam: FullExam }) {
  const [examAnswers, setExamAnswers] = useState(
    exam.examAnswer
      ? {
          startedAt: exam.examAnswer.startedAt,
          endedAt: exam.examAnswer.endedAt,
          examAnswerId: exam.examAnswer.id,
          answers: exam.examAnswer.examAnswerItem.map((s) => {
            return {
              questionId: s.examQuestionId,
              examQuestionSelectionId: s.id,
            };
          }),
        }
      : {
          startedAt: "",
          endedAt: "",
          examAnswerId: 0,
          answers: [],
        }
  );

  const fetcher = useFetcher();
  if (examAnswers.examAnswerId === 0 && fetcher.data) {
    if (fetcher.data.action === "startExam") {
      console.log(fetcher.data);
      const answer = fetcher.data.answer;
      setExamAnswers({
        startedAt: answer.startedAt,
        endedAt: answer.endedAt,
        examAnswerId: answer.id,
        answers: [],
      });
    }
  }
  return (() => {
    switch (exam.state) {
      case "未回答":
        return (
          <ExamStartPanel
            limitMinute={exam.timeLimitInMinutes}
            onStartExam={() => {
              const formData = new FormData();
              formData.set("action", "startExam");
              formData.set(
                "data",
                JSON.stringify({
                  examinationId: exam.id,
                })
              );
              fetcher.submit(formData, {
                method: "post",
                action: "/exam/send-answer",
              });
            }}
          />
        );
      case "回答中":
        return (
          <ExamAnswerPanel
            exam={exam}
            examAnswers={examAnswers}
            onFinish={() => {
              redirect(`/term/${exam.termId}`);
            }}
          />
        );
      case "回答済":
        return <div>スキルテストは終了しました。おつかれ様でした</div>;
      default:
        return <div>スキルテストを選択してください</div>;
    }
  })();
}

export default ExamPanel;
