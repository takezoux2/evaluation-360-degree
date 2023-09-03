import { AnswerSelection, AnswerSelectionSet, AskItem } from "@prisma/client";
import { ActionArgs } from "@remix-run/node";
import {
  Form,
  isRouteErrorResponse,
  useFetcher,
  useRouteError,
  useSubmit,
} from "@remix-run/react";
import { useState } from "react";
import {
  FullAnswerSelectionSet,
  FullAskItem,
} from "~/models/evaluation.server";

type Args = {
  askItem: FullAskItem;
  answerSelectionSet: FullAnswerSelectionSet;
  evaluationId: number;
};

export const AskItemComponent = ({
  askItem,
  answerSelectionSet,
  evaluationId,
}: Args) => {
  const [selected, setSelected] = useState(
    askItem.answerItem
      ? answerSelectionSet?.answerSelections.findIndex((s) => {
          return s.value === askItem.answerItem?.value;
        })
      : -1
  );
  const [noConfidence, setNoConfidence] = useState(
    askItem.answerItem?.noConfidence || false
  );
  const [submitted, setSubmitted] = useState(false);
  const fetcher = useFetcher();

  const [showTooltip, setShowTooltip] = useState(false);

  const updateAnswer = (value: string, noConfidence: boolean) => {
    const formData = new FormData();
    formData.append("askItemId", askItem.id.toString());
    formData.append("value", value);
    formData.append("noConfidence", noConfidence.toString());
    formData.append("evaluationId", evaluationId.toString());
    fetcher.submit(formData, {
      method: "post",
      action: "/evaluation_post/update_answer",
      replace: false,
    });
  };

  const selections = answerSelectionSet?.answerSelections.map(
    (selection, index) => {
      return (
        <div className="basis-1/6" key={index}>
          <button
            className={
              "w-full items-center rounded-sm border border-gray-400 px-6 py-2" +
              (selected === index ? " bg-blue-500" : "") +
              " whitespace-pre-wrap break-all text-sm"
            }
            onClick={() => {
              console.log("On click");
              askItem.answerItem = {
                value: selection.value,
                noConfidence: askItem.answerItem?.noConfidence || false,
              };
              setSelected(index);
              setSubmitted(true);
              updateAnswer(selection.value.toString(), noConfidence);
            }}
          >
            {selection.label}
          </button>
        </div>
      );
    }
  );

  return (
    <div>
      <div className="flex flex-row">
        <div className="basis-2/4">{askItem.askText}</div>
        <div className="basis-1/4">
          <div className="relative flex items-center">
            <input
              checked={noConfidence}
              onChange={(e) => {
                askItem.answerItem = {
                  value: askItem.answerItem?.value ?? 1,
                  noConfidence: askItem.answerItem?.noConfidence || false,
                };
                setNoConfidence(!noConfidence);
                setSubmitted(true);
                updateAnswer(
                  askItem.answerItem?.value + "",
                  !askItem.answerItem?.noConfidence
                );
              }}
              id="checked-checkbox"
              type="checkbox"
              value=""
              className="h-4 w-4 rounded border-gray-300 bg-gray-100 text-blue-600 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800 dark:focus:ring-blue-600"
            />
            <label
              htmlFor="checked-checkbox"
              className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300"
            >
              回答に自信がない
            </label>
            <div
              className=" ml-1 rounded-lg border border-gray-700 text-sm hover:cursor-pointer"
              onPointerOut={() => setShowTooltip(false)}
              onPointerEnter={() => setShowTooltip(true)}
            >
              ❔
            </div>

            {showTooltip && (
              <div
                role="tooltip"
                className="tooltip absolute bottom-6 z-10 inline-block w-[300px] rounded-lg bg-gray-900 px-1 text-sm font-medium text-white opacity-100 shadow-sm transition-opacity duration-300 dark:bg-gray-700"
              >
                評価する人とあまり接点がなかったり、業務上で質問項目に関して関わったことがないなど、回答に自信がない場合にこちらにチェックをお願いします。
                <br />
                <span className="text-red-600">
                  チェックを入れた場合もいずれかの選択肢は選んでください。
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="basis-1/4 text-right">
          {submitted &&
            (fetcher.state === "loading" ? (
              <div>Saving...</div>
            ) : (
              <div className="text-green-500">✅Saved</div>
            ))}
        </div>
      </div>
      <div className="flex w-full flex-row items-center rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
        {selections}
      </div>
    </div>
  );
};
