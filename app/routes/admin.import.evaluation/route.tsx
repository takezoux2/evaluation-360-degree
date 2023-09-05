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
import { Link, Outlet, useActionData, useLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";
import { getNotEndTerms } from "~/models/term.server";
import { registerEvaluations } from "./upload_csv.server";
import { useState } from "react";

export const meta: V2_MetaFunction = () => [{ title: "Remix Notes" }];

export const handle = {
  breadcrumb: () => (
    <Link to="/admin/import/evaluation">Import Evaluation</Link>
  ),
};

export const loader = async () => {
  const terms = await getNotEndTerms();
  return json({
    terms: terms.map((t) => ({
      id: t.id,
      name: t.name,
    })),
  });
};

export const action = async ({ request, params }: ActionArgs) => {
  const uploadHandler = unstable_composeUploadHandlers(
    unstable_createFileUploadHandler({
      maxPartSize: 5_000_000,
      file: ({ filename }) => filename,
    }),
    // parse everything else into memory
    unstable_createMemoryUploadHandler()
  );
  const formData = await unstable_parseMultipartFormData(
    request,
    uploadHandler
  );

  const rawCsv = formData.get("csv");
  if (rawCsv) {
    invariant(rawCsv, "csv is required");
    invariant(rawCsv instanceof NodeOnDiskFile, "csv is required");

    const termId = Number(formData.get("term_id"));
    invariant(termId, "term_id is required");
    const autoCreate = formData.get("create-user") === "on";
    const result = await registerEvaluations(termId, rawCsv, autoCreate);

    return json(result);
  } else {
    const csvStr = formData.get("csv_str");
    invariant(csvStr, "csv_str is required");
    invariant(typeof csvStr === "string", "csv_str is required");
    const termId = Number(formData.get("term_id"));
    invariant(termId, "term_id is required");
    const autoCreate = formData.get("create-user") === "on";
    const result = await registerEvaluations(
      termId,
      csvStr as string,
      autoCreate
    );

    return json(result);
  }
};

export default function ImportEvaluationCsv() {
  const [createUser, setCreateUser] = useState(true);
  const { terms } = useLoaderData<typeof loader>();
  const result = useActionData<typeof action>();
  const GridClass = "p-1 border border-gray-100";
  const uploadResult = result ? (
    <div>
      <div>登録件数: {result.affectedRows}</div>
      {result.events.length > 0 && (
        <div className="my-2 flex flex-col border border-gray-200">
          <div className=" bg-yellow-200">イベント</div>
          {result.events.map((e, index) => (
            <div key={index} className="border border-gray-200">
              {e}
            </div>
          ))}
        </div>
      )}
      {result.errors.length > 0 ? (
        <div className="flex flex-col border border-gray-200">
          <div className="flex flex-row bg-red-200">
            <div className={GridClass + " w-1/5"}>行</div>
            <div className={GridClass + " w-4/5"}>エラー</div>
          </div>
          {result.errors.map((e, index) => (
            <div key={index} className="flex flex-row">
              <div className={GridClass + " w-1/5"}>{e.row}</div>
              <div className={GridClass + " w-4/5"}>{e.message}</div>
            </div>
          ))}
        </div>
      ) : (
        <span>エラー無し</span>
      )}
    </div>
  ) : (
    <></>
  );

  return (
    <div className="flex flex-col">
      <div className="rounded-md border border-gray-300 p-4">
        <form method="post" encType="multipart/form-data">
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
          <div className="my-1">
            <label htmlFor="csv" className="block text-sm">
              登録用CSV
            </label>
            <input type="file" id="csv" name="csv" />
          </div>
          <div className="my-1">
            <input
              type="checkbox"
              id="create-user"
              checked={createUser}
              onChange={() => setCreateUser(!createUser)}
              name="create-user"
            />{" "}
            未登録のユーザーを作成する
          </div>
          <div>
            <button
              className="mt-3 rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-600"
              type="submit"
            >
              CSVをアップロードして登録
            </button>
          </div>
        </form>
      </div>
      {uploadResult}
      <div className="rounded-md border border-gray-300 p-4">
        <form method="post" encType="multipart/form-data">
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
          <div className="my-1">
            <label htmlFor="csv_str" className="block text-sm">
              CSV文字列
            </label>
            <textarea
              name="csv_str"
              className="h-40 w-full rounded-lg bg-blue-100 px-2 py-1"
            ></textarea>
          </div>
          <div className="my-1">
            <input
              type="checkbox"
              id="create-user"
              checked={createUser}
              onChange={() => setCreateUser(!createUser)}
              name="create-user"
            />{" "}
            未登録のユーザーを作成する
          </div>
          <div>
            <button
              className="mt-3 rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-600"
              type="submit"
            >
              CSV文字列で登録
            </button>
          </div>
        </form>
      </div>
      <div className="rounded-md border border-gray-300 p-3">
        評価者,被評価者,被評価者2,...のカラムを持ったCSVをアップロードしてください。
        <br />
        emailまたは、氏名で指定できます。
        <br />
        emailで登録の場合は、自動でユーザーレコード作成が可能です
        <br />
        被評価者数は1行で複数同時登録できます。また、評価者毎に登録する人数が違っても問題ありません。
        <div className="bg-blue-50">
          <div className="ml-1 mt-1 inline-block bg-blue-100 px-1 text-sm">
            sample.csv
          </div>

          <pre className="block">{`評価者,被評価者,被評価者2, ...
hoge@example.com,fuga@example.com, bbb@example.com, ccc@example.com, ddd@example.com
山田太郎,鈴木花子, bbb@example.com
`}</pre>
        </div>
        <Link to="sample_csv" reloadDocument>
          <button className="rounded bg-green-400 p-2 hover:bg-green-500">
            サンプルのCSVをダウンロード
          </button>
        </Link>
      </div>
    </div>
  );
}
