import {
  ActionArgs,
  json,
  LoaderArgs,
  type V2_MetaFunction,
} from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import { DateTime } from "luxon";
import { useState } from "react";
import invariant from "tiny-invariant";
import { AskItemComponent } from "~/components/Evaluation/AskItem";
import { EvaluationComponent } from "~/components/Evaluation/EvaluationComponent";
import { ExamPageHader } from "~/components/ExamPageHeader";
import { TermList } from "~/components/Term/TermList";
import {
  getEvaluation,
  getListEvaluations,
  ListEvaluation,
} from "~/models/evaluation.server";
import { getTermById, getTermsInTerm, isInTerm } from "~/models/term.server";
import { toNodeWithBr } from "~/node_util";
import { requireUser } from "~/session.server";
import { toUntil } from "~/time_util";

export const meta: V2_MetaFunction = () => [
  { title: "180度アンケート(項目別)" },
];

export const loader = async ({ params, request }: LoaderArgs) => {
  const user = await requireUser(request);
  const termId = Number(params.termId);
  const inTerm = await isInTerm(user.id, termId);
  invariant(inTerm, "Term is not in term");
  const term = await getTermById(termId);
  invariant(term, "Term not found");
  const evaluations = await getListEvaluations({
    termIds: [termId],
    userId: user.id,
  });
  // console.log(evaluations);

  return json({ term, evaluations, user });
};

export default function Index() {
  const { term, evaluations, user } = useLoaderData<typeof loader>();

  const [selectedAskItemId, setSelectedAskItemId] = useState<number>(
    term.askSections[0]?.askItems[0]?.id ?? 0
  );

  const cutStr = (str: string) => {
    if (str.length > 10) {
      return str.slice(0, 10) + "...";
    } else {
      return str;
    }
  };

  const [selectedSectionId, setSelectedSectionId] = useState<number>(
    term.askSections[0]?.id ?? 0
  );

  const askItemsList = term.askSections.flatMap((s) => {
    return (
      <span key={s.id}>
        <h2>
          <button
            type="button"
            className="flex w-full items-center justify-between border bg-sky-500 p-1 hover:bg-cyan-300"
            data-accordion-target={"#accordion-collapse-body-" + s.id}
            aria-expanded="true"
            aria-controls="accordion-collapse-body-1"
            onClick={() =>
              selectedSectionId === s.id
                ? setSelectedSectionId(-1)
                : setSelectedSectionId(s.id)
            }
          >
            <span>{s.label}</span>
            <svg
              data-accordion-icon
              className="h-3 w-3 shrink-0 rotate-180"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 10 6"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 5 5 1 1 5"
              />
            </svg>
          </button>
        </h2>
        <div className={s.id === selectedSectionId ? "" : "hidden"}>
          {s.askItems.map((askItem, index) => {
            const bgColor =
              askItem.id === selectedAskItemId ? "bg-green-100" : "";
            return (
              <div key={s.id + "_" + askItem.id}>
                <button
                  className={
                    "w-full border-2 border-gray-300 p-1 text-left hover:bg-green-200 " +
                    bgColor
                  }
                  onClick={() => setSelectedAskItemId(askItem.id)}
                >
                  {cutStr(askItem.askText)}
                </button>
              </div>
            );
          })}
        </div>
      </span>
    );
  });
  const section = term.askSections.find((s) =>
    s.askItems.some((i) => i.id === selectedAskItemId)
  );
  const askItem = section?.askItems.find((s) => s.id === selectedAskItemId);

  let persons;
  if (askItem && section) {
    persons = evaluations.map((e) => {
      const userAskItem = e.term.askSections
        .flatMap((s) => s.askItems)
        .find((i) => i.id === askItem.id);
      return (
        <AskItemComponent
          key={e.id + "_" + askItem.id}
          label={e.evaluatee.name}
          askItem={userAskItem ?? askItem}
          answerSelectionSet={section.answerSelectionSet}
          evaluationId={e.id}
        />
      );
    });
  } else {
    persons = (
      <div>
        アンケート項目を選択してください
        <br />
        <ul className="list-disc px-5">
          <li>評価期間中は、回答の修正可能です</li>
          <li>すべての項目に回答お願いします</li>
          <li>回答は自動で保存されます</li>
        </ul>
        <br />
      </div>
    );
  }
  const endAt = DateTime.fromISO(term.endAt);
  const endAtLabel = toUntil(endAt.toJSDate());

  return (
    <>
      <ExamPageHader term={term} user={user} />
      <main className="min-h-screen bg-white p-3">
        <div className="flex flex-row">
          <div className="flex flex-col p-2">
            <div className="flex w-full flex-col rounded-t-lg bg-sky-600 p-2">
              <div>{term.name}</div>
              <div>回答期限: {endAtLabel}まで</div>
            </div>
            <div>{askItemsList}</div>
          </div>
          <div className="flex w-full flex-col p-2">
            <div className="flex flex-row justify-between">
              <div>{askItem ? toNodeWithBr(askItem.askText) : ""}</div>
              {askItem && (
                <button
                  className="rounded-lg bg-gradient-to-r from-green-500 to-red-500  p-2 text-sm text-black"
                  onClick={() => {
                    const selectionSetId = section?.answerSelectionSet.id;
                    const url = "/evaluation/selection_help/" + selectionSetId;
                    const windowName = "選択項目の詳細";
                    const windowFeatures =
                      "width=600,height=400,menubar=no,toolbar=no,location=no,resizable=yes,scrollbars=yes,status=no";
                    window.open(url, windowName, windowFeatures);
                  }}
                >
                  選択項目の詳細📖
                </button>
              )}
            </div>
            <div>{persons}</div>
          </div>
        </div>
      </main>
    </>
  );
}
