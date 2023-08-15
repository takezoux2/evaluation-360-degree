import {
  ActionArgs,
  json,
  LoaderArgs,
  type V2_MetaFunction,
} from "@remix-run/node";
import * as yaml from "yaml";
import { Form, Link, Outlet, useLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";
import { getLatestTerms, getTermById } from "~/models/term.server";
import { toInputDateTimeLocal } from "~/time_util";
import { upsertAskSelectionSet } from "~/models/term_update.server";

export const meta: V2_MetaFunction = () => [{ title: "Remix Notes" }];

export const handle = {
  breadcrumb: () => <span>評価期間編集</span>,
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const term = await getTermById(Number(params["termId"] ?? "0"));
  invariant(term, "term not found");

  const sectionYaml = yaml.stringify(
    term.askSections.map((sec) => {
      return {
        id: sec.id,
        label: sec.label,
        questions: sec.askItems.map((item) => {
          return item.askText;
        }),
        selectionSet: {
          id: sec.answerSelectionSetId,
          selections: sec.answerSelectionSet.answerSelections.map(
            (selection) => {
              return {
                id: selection.id,
                label: selection.label,
                value: selection.value,
              };
            }
          ),
        },
      };
    })
  );

  return json({ term, sectionYaml });
};

export const action = async ({ request }: ActionArgs) => {
  const formData = await request.formData();
  const termId = Number(formData.get("termId") ?? "0");
  const name = formData.get("name");
  invariant(name, "name is required");
  const startAt = formData.get("startAt");
  invariant(startAt, "startAt is required");
  const endAt = formData.get("endAt");
  invariant(endAt, "endAt is required");
  const sectionYaml = formData.get("sectionYaml");
  invariant(sectionYaml, "sectionYaml is required");
  await upsertAskSelectionSet(
    termId,
    {
      name: name as string,
      startAt: new Date(startAt as string),
      endAt: new Date(endAt as string),
    },
    sectionYaml as string
  );
  return json({ aaa: "a" });
};

export default function EditTerm() {
  const { term, sectionYaml } = useLoaderData<typeof loader>();

  return (
    <Form method="post">
      <input type="hidden" name="termId" value={term.id} />
      <div className="p-1">
        <label htmlFor="name" className="block text-sm">
          期間
        </label>
        <input
          type="text"
          className="w-full rounded-sm border border-black bg-cyan-50 p-1"
          name="name"
          defaultValue={term.name}
        />
      </div>
      <div className="flex flex-row p-1">
        <div className="basis-2/5">
          <label htmlFor="startAt" className="block text-sm">
            開始
          </label>
          <input
            type="datetime-local"
            className="w-full rounded-sm border border-black bg-cyan-50 p-1"
            name="startAt"
            defaultValue={toInputDateTimeLocal(term.startAt)}
          />
        </div>
        <div className="basis-1/5 text-center">~</div>
        <div className="basis-2/5">
          <label htmlFor="endAt" className="block text-sm">
            終了
          </label>
          <input
            type="datetime-local"
            className="w-full rounded-sm border border-black bg-cyan-50 p-1"
            name="endAt"
            defaultValue={toInputDateTimeLocal(term.endAt)}
          />
        </div>
      </div>
      <div className="p-1">
        <label htmlFor="sectionYaml" className="block text-sm">
          セクション/設問/選択肢
        </label>
        <textarea
          name="sectionYaml"
          className="h-64 w-full rounded-sm border border-black bg-cyan-50 p-1"
          defaultValue={sectionYaml}
        ></textarea>
      </div>
      <button type="submit" className=" rounded-lg bg-green-500 px-4 py-2">
        更新
      </button>
    </Form>
  );
}
