import { useEffect } from "react";
import { FullExamQuestion } from "~/models/exam.server";

const searchBlockWords = [
  "メモリ",
  "を",
  "リーク",
  "が",
  "const",
  "と",
  "GC",
  "の",
  "Heap",
  "Web",
  "は",
  "または",
  "http",
  "slack",
  "スクラム",
  "から",
  "スプリント",
  "天安門",
  "スプリントレビュー",
];

type CheatType = "SelectQuestionText" | "OpenDebugConsole";

export const ExamQuestionPanel = ({
  onCheeted,
  examQuestion,
  onSelectedAnswer,
}: {
  onCheeted: (e: { type: CheatType; message: string }) => void;
  onSelectedAnswer: (e: { examQuestionSelectionId: number }) => void;
  examQuestion: FullExamQuestion;
}) => {
  const QuestionTextId = "8cjwao3lqauj";

  useEffect(() => {
    // 右クリック禁止
    document.oncontextmenu = function () {
      return false;
    };

    // selectionchangeイベントリスナーを追加する関数
    const handleSelectionChange = () => {
      const selection = document.getSelection();
      if (!selection) return;
      const id =
        selection.anchorNode?.parentElement?.parentElement?.getAttribute("id");
      if (id === QuestionTextId) {
        onCheeted({
          type: "SelectQuestionText",
          message: "問題文の選択:" + selection.toString(),
        });
      }
    };

    // documentにイベントリスナーを追加
    document.addEventListener("selectionchange", handleSelectionChange);

    // スクリーンサイズの監視
    const handler = setInterval(() => {
      const heightRate = window.innerHeight / window.outerHeight;
      const widthRate = window.innerWidth / window.outerWidth;
      // console.log(heightRate + " : " + widthRate);
      if (heightRate < 0.7 || widthRate < 0.8) {
        onCheeted({
          type: "OpenDebugConsole",
          message: "デバッグコンソールを開いている可能性あり",
        });
      }
    }, 5000);

    // クリーンアップ関数としてイベントリスナーを削除
    return () => {
      clearInterval(handler);
      document.oncontextmenu = function () {
        return true;
      };
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, []);

  const text = examQuestion.text;
  const redundantText = text.split("").map((c, index) => {
    if (c === "\n") return <br key={"br" + index} />;
    else
      return (
        <>
          <span key={"c" + index}>{c}</span>
          <span key={"h" + index} hidden>
            {searchBlockWords[index % searchBlockWords.length]}
          </span>
        </>
      );
  });

  const selections = examQuestion.examQuestionSelections.map(
    (selection, index) => {
      const label = selection.label.split("\n").map((line, index, arr) => {
        if (index === arr.length - 1) return line;
        else
          return (
            <>
              {line} <br />
            </>
          );
      });
      const bgColor =
        selection.id === examQuestion.examQuestionSelectionId
          ? "bg-green-400 hover:bg-green-500 "
          : "hover:bg-green-100 ";
      return (
        <div
          key={index}
          className={
            bgColor +
            "w-full items-center border border-black p-2 hover:cursor-pointer "
          }
          onClick={() => {
            onSelectedAnswer({ examQuestionSelectionId: selection.id });
            examQuestion.examQuestionSelectionId = selection.id;
          }}
        >
          {label}
        </div>
      );
    }
  );
  return (
    <div>
      {text.length > 0 && (
        <div id={QuestionTextId} className="select-none">
          {redundantText}
        </div>
      )}
      {examQuestion.imagePath.length > 0 && <img src={examQuestion.imageUrl} />}
      <div className="items.center flex w-full flex-row">{selections}</div>
    </div>
  );
};
