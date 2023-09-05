import {
  ActionArgs,
  json,
  LoaderArgs,
  type V2_MetaFunction,
} from "@remix-run/node";
import * as yaml from "yaml";
import {
  Form,
  Link,
  Outlet,
  useActionData,
  useLoaderData,
} from "@remix-run/react";
import invariant from "tiny-invariant";
import { getLatestTerms, getTermById } from "~/models/term.server";
import { toInputDateTimeLocal } from "~/time_util";
import { upsertAskSelectionSet } from "~/models/term_update.server";
import Editor from "@monaco-editor/react";
import { useState } from "react";

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
        label: sec.label,
        questions: sec.askItems.map((item) => {
          if (item.targetJobs.length === 0) {
            return item.askText;
          } else {
            return {
              label: item.askText,
              jobs: item.targetJobs.map((job) => job.name),
            };
          }
        }),
        selectionSet: {
          id: sec.answerSelectionSetId,
          name: sec.answerSelectionSet.name,
          selections: sec.answerSelectionSet.answerSelections.map(
            (selection) => {
              return {
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
  try {
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
    return json({ hasError: false, message: "Saved!" });
  } catch (e) {
    return json({
      hasError: true,
      message: e instanceof Error ? e.message : "Unknown error",
    });
  }
};

export default function EditTerm() {
  const { term, sectionYaml } = useLoaderData<typeof loader>();
  const actionResult = useActionData<typeof action>();

  const [sectionYamlValue, setSectionYaml] = useState<string>(sectionYaml);

  const errors = [] as string[];
  try {
    yaml.parse(sectionYamlValue, { prettyErrors: true });
  } catch (e: any) {
    if (e instanceof yaml.YAMLParseError) {
      errors.push(e.message);
    }
  }

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
        <input type="hidden" value={sectionYamlValue} name="sectionYaml" />
        {/* <textarea
          name="sectionYaml"
          className="h-96 w-full rounded-sm border border-black bg-cyan-50 p-1"
          defaultValue={sectionYaml}
        ></textarea> */}
        <Editor
          className="h-96 w-full rounded-sm border border-black "
          defaultValue={sectionYaml}
          language="yaml"
          onChange={(value) => {
            setSectionYaml(value ?? "");
          }}
        />
      </div>
      {errors.length > 0 && (
        <div className="p-1">
          {errors.map((e, i) => (
            <div className=" text-red-500" key={i}>
              {e}
            </div>
          ))}
        </div>
      )}
      <div className="flex flex-row place-content-center items-center">
        <div className="basis-1/6">
          <button
            disabled={errors.length > 0}
            type="submit"
            className=" rounded-lg bg-green-500 px-4 py-2 disabled:bg-gray-400"
          >
            更新
          </button>
        </div>
        <div className="basis-5/6">
          {actionResult && (
            <div
              className={
                actionResult.hasError ? "text-red-500" : "text-green-500"
              }
            >
              {actionResult.message}
            </div>
          )}
        </div>
      </div>
    </Form>
  );
}
