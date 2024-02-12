import { EssayQuestion, EssayQuestionAnswer } from "@prisma/client";
import { useState } from "react";
import { countHalfWidthAsHalf } from "~/utils";
import { SerializeFrom } from "@remix-run/node";
import { toNodeWithBr } from "~/node_util";

export function AnswerPanel({
  essayQuestion,
  essayQuestionAnswer,
  onChange,
}: {
  essayQuestion: SerializeFrom<EssayQuestion>;
  essayQuestionAnswer: SerializeFrom<EssayQuestionAnswer> | undefined;
  onChange: (value: string) => void;
}) {
  const hLines = Math.max(2, Math.ceil(essayQuestion.maxAnswerTextLength / 60));
  const answerText = essayQuestionAnswer?.text;
  const [input, setInput] = useState(answerText || "");

  const color =
    countHalfWidthAsHalf(input) > essayQuestion.maxAnswerTextLength
      ? "text-red-600"
      : "text-black";

  return (
    <div className="my-3 rounded-lg border p-1" key={essayQuestion.id}>
      <label htmlFor={`q${essayQuestion.id}`} className={color}>
        {toNodeWithBr(essayQuestion.text + " : " + essayQuestion.detail)}
      </label>
      <textarea
        className="my-1 w-full border-2 border-gray-500"
        id={`q${essayQuestion.id}`}
        name={`q${essayQuestion.id}`}
        value={input}
        rows={hLines}
        onChange={(e) => {
          onChange(e.target.value);
          setInput(e.target.value);
        }}
      ></textarea>
      <div className={"px-5 text-right " + color}>
        文字数:{" "}
        {countHalfWidthAsHalf(input) + "/" + essayQuestion.maxAnswerTextLength}
      </div>
    </div>
  );
}
