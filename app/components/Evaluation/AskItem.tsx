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
  const [submitted, setSubmitted] = useState(false);
  const fetcher = useFetcher();

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
              const formData = new FormData();
              formData.append("askItemId", askItem.id.toString());
              formData.append("value", selection.value.toString());
              formData.append("evaluationId", evaluationId.toString());
              fetcher.submit(formData, {
                method: "post",
                action: "/evaluation_post/update_answer",
              });
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
        <div className="basis-3/4">{askItem.askText}</div>
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
