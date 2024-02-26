import {
  ActionArgs,
  json,
  LoaderArgs,
  type V2_MetaFunction,
} from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import { memo, useEffect, useState } from "react";
import { requireUser } from "~/session.server";
import { getEssayExamAnswer, updateEssayExamAnswers } from "./effect.server";
import { countHalfWidthAsHalf } from "~/utils";
import { AnswerPanel } from "./component";
import { StripReturnType } from "~/models/type_util";
import { ExamPageHader } from "~/components/ExamPageHeader";
import invariant from "tiny-invariant";

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
  invariant(essayExam, "EssayExam not found");
  return json({ essayExamAnswer, essayExam, user });
};
export default function Index() {
  const { essayExamAnswer, essayExam, user } = useLoaderData<typeof loader>();
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

  const buttonLabel = postResult?.success === true ? "保存完了" : "保存する";
  const submitButton =
    errors.length > 0 ? (
      <input
        type="submit"
        className="rounded-md border-black bg-gray-300 p-2"
        value="保存する"
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
        value="保存する"
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
          return (
            <AnswerPanel
              key={question.id}
              essayQuestion={question}
              essayQuestionAnswer={essayExamAnswer?.EssayQuestionAnswer.find(
                (a) => a.essayQuestionId === question.id
              )}
              onChange={(value) => {
                const c = countHalfWidthAsHalf(value);
                const errorLabel = `文字数が超過しています - ${question.text}`;
                if (c > question.maxAnswerTextLength) {
                  addError(errorLabel);
                } else {
                  removeError(errorLabel);
                  setIsChanged(true);
                }
              }}
            />
          );
        })}
      </div>
    );
  };

  const ChoiceOneSection = (section: Section) => {
    const hasAnsweredIndex = section.essayQuestions.findIndex((q) => {
      return (
        essayExamAnswer?.EssayQuestionAnswer.some(
          (a) => a.essayQuestionId === q.id && a.text.length > 0
        ) === true
      );
    });
    const [selectedTabIndex, setSelectedTabIndex] = useState(
      hasAnsweredIndex >= 0 ? hasAnsweredIndex : 0
    );
    const question = section.essayQuestions[selectedTabIndex];
    const answer = essayExamAnswer?.EssayQuestionAnswer?.find(
      (a) => a.essayQuestionId === question.id
    );
    // 文字が入力された場合、タブを固定
    const [fixTab, setFixTab] = useState(answer && answer.text.length > 0);
    return (
      <div>
        <div className="flex flex-row">
          {section.essayQuestions.map((q, index) => {
            if (selectedTabIndex === index) {
              return (
                <div
                  key={index}
                  className="rounded-t-lg border border-gray-400 bg-green-400 px-3 py-1"
                >
                  <span>{q.text}</span>
                </div>
              );
            } else if (fixTab) {
              return (
                <div
                  key={index}
                  className="rounded-t-lg border border-gray-400 bg-gray-300 px-3 py-1 focus:cursor-pointer"
                >
                  {q.text}
                </div>
              );
            } else {
              return (
                <button
                  key={index}
                  className="rounded-t-lg border border-gray-400 px-3 py-1 focus:cursor-pointer"
                  onClick={() => setSelectedTabIndex(index)}
                >
                  <span>{q.text}</span>
                </button>
              );
            }
          })}
        </div>
        <div>
          <AnswerPanel
            key={question.id}
            essayQuestion={question}
            essayQuestionAnswer={answer}
            onChange={(value) => {
              const c = countHalfWidthAsHalf(value);
              const errorLabel = `文字数が超過しています - ${question.text}`;
              if (c > question.maxAnswerTextLength) {
                addError(errorLabel);
              } else {
                removeError(errorLabel);
                setIsChanged(true);
              }
              setFixTab(value.length > 0);
            }}
          />
        </div>
      </div>
    );
  };

  return (
    <>
      <ExamPageHader
        term={{
          id: essayExam.termId,
        }}
        user={user}
      />
      <main className="min-h-screen bg-white p-3">
        <form method="POST">
          <input type="hidden" name="mode" value="save" />
          <div className="flex justify-between rounded-lg bg-green-400 p-2">
            <div>記述問題</div>
          </div>
          {essayExam?.EssayQuestionSection.map((section) => {
            return (
              <div key={section.id}>
                <div className="bg-blue-200 p-2">{section.name}</div>
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
    </>
  );
}
