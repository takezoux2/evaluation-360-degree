import {
  ActionArgs,
  json,
  LoaderArgs,
  type V2_MetaFunction,
} from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import { useEffect, useState } from "react";
import { requireUser } from "~/session.server";
import { getEssayExamAnswer, updateEssayExamAnswers } from "./effect.server";
import { countHalfWidthAsHalf } from "~/utils";
import { AnswerPanel } from "./component";
import { StripReturnType } from "~/models/type_util";

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
  type Section = NonNullable<
    StripReturnType<typeof getEssayExamAnswer>["essayExam"]
  >["EssayQuestionSection"][0];
  const AnswerAllSection = (section: Section) => {
    return (
      <div>
        {section.essayQuestions.map((question) => {
          return AnswerPanel(
            question,
            essayExamAnswer?.EssayQuestionAnswer.find(
              (a) => a.essayQuestionId === question.id
            ),
            (value) => {
              const c = countHalfWidthAsHalf(value);
              const errorLabel = `文字数が超過しています - ${question.text}`;
              if (c > question.maxAnswerTextLength) {
                addError(errorLabel);
              } else {
                removeError(errorLabel);
                setIsChanged(true);
              }
            }
          );
        })}
      </div>
    );
  };

  const ChoiceOneSection = (section: Section) => {
    const [selectedTabIndex, setSelectedTabIndex] = useState(0);
    const question = section.essayQuestions[selectedTabIndex];
    return (
      <div>
        <div className="flex flex-row">
          {section.essayQuestions.map((q, index) => {
            if (selectedTabIndex === index) {
              return (
                <div key={index} className="rounded-t-lg bg-green-400 px-3">
                  <span className="border-b border-black">{q.text}</span>
                </div>
              );
            } else {
              return (
                <button
                  key={index}
                  className="rounded-t-lg px-3 focus:cursor-pointer"
                  onClick={() => setSelectedTabIndex(index)}
                >
                  <span className=" border-black">{q.text}</span>
                </button>
              );
            }
          })}
        </div>
        <div>
          {AnswerPanel(
            question,
            essayExamAnswer?.EssayQuestionAnswer.find(
              (a) => a.essayQuestionId === question.id
            ),
            (value) => {
              const c = countHalfWidthAsHalf(value);
              const errorLabel = `文字数が超過しています - ${question.text}`;
              if (c > question.maxAnswerTextLength) {
                addError(errorLabel);
              } else {
                removeError(errorLabel);
                setIsChanged(true);
              }
            }
          )}
        </div>
      </div>
    );
  };

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
                {section.answerType === "ANSWER_ALL"
                  ? AnswerAllSection(section)
                  : ChoiceOneSection(section)}
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
