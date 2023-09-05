import { useFetcher } from "@remix-run/react";
import { useState } from "react";
import { FullExam } from "~/models/exam.server";
import { ExamStartPanel } from "./ExamStartPanel";
import ExamAnswerPanel from "./ExamAnswerPanel";

export function ExamPanel({ selectedExam }: { selectedExam: FullExam | null }) {
  const fetcher = useFetcher();
  // コンポーネントの再レンダリングを強制
  const [updateFlag, setUpdateFlag] = useState(1);
  const forceUpdate = () => setUpdateFlag((i) => i + 1);

  console.log(
    "//" + fetcher.state + " // " + JSON.stringify(fetcher.data?.answer)
  );
  if (fetcher.state === "idle" && fetcher.data) {
    if (selectedExam && fetcher.data.answer) {
      selectedExam.answer = fetcher.data.answer;
      selectedExam.exam.state = "回答中";
    }
  }

  return (() => {
    switch (selectedExam?.exam.state) {
      case "未回答":
        return (
          <ExamStartPanel
            limitMinute={selectedExam.exam.timeLimitInMinutes}
            onStartExam={() => {
              const formData = new FormData();
              formData.append("startExam", "true");
              formData.append("examinationId", selectedExam.exam.id.toString());
              fetcher.submit(formData, {
                method: "post",
                action: "/exam",
                replace: true,
              });

              // forceUpdate();
            }}
          />
        );
      case "回答中":
        return (
          <ExamAnswerPanel
            selectedExam={selectedExam}
            onFinish={() => {
              selectedExam.exam.state = "回答済";
              forceUpdate();
            }}
          />
        );
      case "回答済":
        return <div>試験は終了しました。おつかれ様でした</div>;
      default:
        return <div>試験を選択してください</div>;
    }
  })();
}

export default ExamPanel;
