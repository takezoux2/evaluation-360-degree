import {
  ActionArgs,
  json,
  LoaderArgs,
  type V2_MetaFunction,
} from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import { useEffect, useState } from "react";
import { EvaluationComponent } from "~/components/Evaluation/EvaluationComponent";
import { TermList } from "~/components/Term/TermList";
import { getListEvaluations, ListEvaluation } from "~/models/evaluation.server";
import { requireUser } from "~/session.server";
import {
  getEssayExamAnswer,
  getTerms,
  updateEssayExamAnswers,
} from "./effect.server";
import { countHalfWidthAsHalf } from "~/utils";

export const meta: V2_MetaFunction = () => [{ title: "記述式試験" }];

export const action = async ({ request, params }: ActionArgs) => {
  const formData = await request.formData();
  const user = await requireUser(request);
  const essayExamId = Number(params.essayExamId);
  const mode = formData.get("mode") as string;
  if (mode === "save") {
    // filter key starts with "q" and map to [essayQuestionId, answer]
    const answers = Array.from(formData.entries())
      .filter(([key, value]) => {
        return key.startsWith("q");
      })
      .map(([key, value]) => {
        const essayQuestionId = Number(key.slice(1));
        return { essayQuestionId, text: String(value) };
      });
    await updateEssayExamAnswers({
      essayExamId,
      userId: user.id,
      answers: answers,
    });
  }
  return json({ success: true });
};

export const loader = async ({ params, request }: LoaderArgs) => {
  const user = await requireUser(request);
  const { essayExamAnswer, essayExam } = await getEssayExamAnswer({
    user: user,
    essayExamId: Number(params.essayExamId),
  });
  return json({ essayExamAnswer, essayExam });
};
export default function Index() {
  const { essayExamAnswer, essayExam } = useLoaderData<typeof loader>();
  const postResult = useActionData<typeof action>();

  const [errors, setErrors] = useState<string[]>([]);
  const addError = (e: string) => {
    if (errors.includes(e)) return;
    setErrors([...errors, e]);
  };
  const removeError = (e: string) => {
    if (!errors.includes(e)) return;
    setErrors(errors.filter((s) => s !== e));
  };
  const errorLabel =
    errors.length > 0 ? (
      <div className="rounded-md bg-red-100 p-2 text-red-600">
        {errors.map((e) => (
          <div key={e}>{e}</div>
        ))}
      </div>
    ) : (
      <></>
    );

  const [isChanged, setIsChanged] = useState(false);

  const buttonLabel = postResult?.success === true ? "保存完了" : "提出する";
  const submitButton =
    errors.length > 0 ? (
      <input
        type="submit"
        className="rounded-md border-black bg-gray-300 p-2"
        value="提出する"
        disabled={true}
      />
    ) : !isChanged ? (
      <input
        type="submit"
        className="rounded-md border-black bg-gray-300 p-2"
        value={buttonLabel}
        disabled={true}
      />
    ) : (
      <input
        type="submit"
        className="rounded-md border-black bg-green-300 p-2"
        value="提出する"
        disabled={false}
      />
    );

  return (
    <main className="min-h-screen bg-white p-3">
      <form method="POST">
        <input type="hidden" name="mode" value="save" />
        <div className="flex justify-between p-2">
          <div>記述問題</div>
        </div>
        {essayExam?.EssayQuestionSection.map((section) => {
          return (
            <div key={section.id}>
              <div>{section.name}</div>
              <div>
                {section.essayQuestions.map((question) => {
                  const hLines = Math.max(
                    2,
                    Math.ceil(question.maxAnswerTextLength / 100)
                  );
                  const answerText = essayExamAnswer?.EssayQuestionAnswer.find(
                    (a) => a.essayQuestionId === question.id
                  )?.text;
                  const [input, setInput] = useState(answerText ?? "");

                  return (
                    <div key={question.id}>
                      <label htmlFor={`q${question.id}`}>{question.text}</label>
                      <textarea
                        className="w-full border-2 border-gray-500"
                        id={`q${question.id}`}
                        name={`q${question.id}`}
                        value={input}
                        rows={hLines}
                        onChange={(e) => {
                          const c = countHalfWidthAsHalf(e.target.value);
                          const errorLabel = `文字数が超過しています - ${question.text}`;
                          if (c > question.maxAnswerTextLength) {
                            addError(errorLabel);
                          } else {
                            removeError(errorLabel);
                            setIsChanged(true);
                          }
                          setInput(e.target.value);
                        }}
                      ></textarea>
                      <div>
                        文字数:{" "}
                        {countHalfWidthAsHalf(input) +
                          "/" +
                          question.maxAnswerTextLength}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        <div className="mt-3 flex flex-row">{submitButton}</div>

        {errors.length > 0 && errorLabel}
      </form>
    </main>
  );
}
