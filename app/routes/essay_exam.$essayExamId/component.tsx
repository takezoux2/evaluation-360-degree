import { EssayQuestion, EssayQuestionAnswer } from "@prisma/client";
import { useState } from "react";
import { countHalfWidthAsHalf } from "~/utils";
import { SerializeFrom } from "@remix-run/node";

export const AnswerPanel = (
  essayQuestion: SerializeFrom<EssayQuestion>,
  essayQuestionAnswer: SerializeFrom<EssayQuestionAnswer> | undefined,
  onChange: (value: string) => void
) => {
  const hLines = Math.max(2, Math.ceil(essayQuestion.maxAnswerTextLength / 60));
  const answerText = essayQuestionAnswer?.text;
  const [input, setInput] = useState(answerText ?? "");

  return (
    <div key={essayQuestion.id}>
      <label htmlFor={`q${essayQuestion.id}`}>
        {essayQuestion.text + " : " + essayQuestion.detail}
      </label>
      <textarea
        className="w-full border-2 border-gray-500"
        id={`q${essayQuestion.id}`}
        name={`q${essayQuestion.id}`}
        value={input}
        rows={hLines}
        onChange={(e) => {
          onChange(e.target.value);
          setInput(e.target.value);
        }}
      ></textarea>
      <div>
        文字数:{" "}
        {countHalfWidthAsHalf(input) + "/" + essayQuestion.maxAnswerTextLength}
      </div>
    </div>
  );
};
