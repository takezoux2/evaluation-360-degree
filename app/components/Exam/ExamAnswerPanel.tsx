import { FullExam } from "~/models/exam.server";
import { ExamQuestionPanel } from "./ExamQuestionPanel";
import { useFetcher } from "@remix-run/react";
import ExamProgressBar from "./ExamProgressBar";
import { useState } from "react";
import { DateTime } from "luxon";
import ExamTimeBar from "./ExamTimeBar";

export function ExamAnswerPanel({ selectedExam }: { selectedExam: FullExam }) {
  const fetcher = useFetcher();
  const [questionIndex, setQuestionIndex] = useState(0);

  return (
    <div className="flex flex-col">
      <div className="p-1">
        <ExamTimeBar
          start={DateTime.fromISO(selectedExam.answer?.startedAt ?? "")}
          end={DateTime.fromISO(selectedExam.answer?.endedAt ?? "")}
          onFinish={() => {
            console.log("Finished");
          }}
        />
      </div>
      <div className="p-1">
        <ExamProgressBar
          onChangePage={(page) => setQuestionIndex(page - 1)}
          current={questionIndex + 1}
          max={selectedExam.exam.examQuestions.length}
        />
      </div>
      <div>
        <ExamQuestionPanel
          examQuestion={selectedExam.exam.examQuestions[0]}
          onCheeted={(e) => {
            const formData = new FormData();
            formData.append("cheatType", e.type);
            formData.append("message", e.message);
            formData.append(
              "examAnswerId",
              (selectedExam.answer?.id ?? 0).toString()
            );
            fetcher.submit(formData, {
              method: "post",
              action: "/exam",
              replace: true,
            });
          }}
          onSelectedAnswer={(e) => {
            const formData = new FormData();
            formData.append(
              "examQuestionSelectionId",
              e.examQuestionSelectionId.toString()
            );
            formData.append(
              "examAnswerId",
              (selectedExam.answer?.id ?? 0).toString()
            );
            fetcher.submit(formData, {
              method: "post",
              action: "/exam",
              replace: true,
            });
          }}
        />
      </div>
    </div>
  );
}

export default ExamAnswerPanel;
