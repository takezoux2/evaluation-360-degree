import {
  ActionArgs,
  json,
  LoaderArgs,
  NodeOnDiskFile,
  unstable_composeUploadHandlers,
  unstable_createFileUploadHandler,
  unstable_createMemoryUploadHandler,
  unstable_parseMultipartFormData,
  type V2_MetaFunction,
} from "@remix-run/node";
import {
  Form,
  Link,
  Outlet,
  useActionData,
  useLoaderData,
} from "@remix-run/react";
import invariant from "tiny-invariant";
import { getLatestTerms, getNotEndTerms } from "~/models/term.server";
import { useState } from "react";

export const meta: V2_MetaFunction = () => [{ title: "Remix Notes" }];

export const loader = async () => {
  const terms = await getLatestTerms();
  return json({
    terms: terms.map((t) => ({
      id: t.id,
      name: t.name,
    })),
  });
};

export default function ImportEvaluationCsv() {
  const { terms } = useLoaderData<typeof loader>();

  return (
    <div className="flex flex-col">
      <div className="rounded-md border border-gray-300 p-4">
        <Form
          reloadDocument
          action="download"
          method="post"
          encType="multipart/form-data"
        >
          <div className="my-1">
            <label className="block p-1 text-sm" htmlFor="term_id">
              評価期間
            </label>
            <select name="term_id" className="rounded-lg bg-blue-100 px-2 py-1">
              {terms.map((t, index) => (
                <option key={index} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <button
              className="mt-3 rounded bg-green-500 px-4 py-2 font-bold text-white hover:bg-green-600"
              type="submit"
            >
              試験結果をダウンロード
            </button>
          </div>
        </Form>
      </div>
    </div>
  );
}
