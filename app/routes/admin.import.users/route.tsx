import {
  ActionArgs,
  json,
  NodeOnDiskFile,
  unstable_composeUploadHandlers,
  unstable_createFileUploadHandler,
  unstable_createMemoryUploadHandler,
  unstable_parseMultipartFormData,
  type V2_MetaFunction,
} from "@remix-run/node";
import { Link, useActionData, useLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";
import { regiterUsers } from "./upload_csv.server";
import { getJobs } from "~/models/job.server";

export const meta: V2_MetaFunction = () => [{ title: "Remix Notes" }];

export const handle = {
  breadcrumb: () => <Link to="/admin/import/users">Import Users</Link>,
};

export const loader = async () => {
  const jobs = await getJobs();
  return json({
    jobs: jobs.map((j) => j.name),
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
  invariant(rawCsv, "csv is required");
  invariant(rawCsv instanceof NodeOnDiskFile, "csv is required");

  const result = await regiterUsers(rawCsv);

  return json(result);
};

export default function ImportUserCsv() {
  const { jobs } = useLoaderData<typeof loader>();
  const result = useActionData<typeof action>();
  const GridClass = "p-1 border border-gray-100";
  const uploadResult = result ? (
    <div>
      <div>登録件数: {result.affectedRows}</div>
      <div className="grid grid-flow-row-dense grid-cols-3 border border-gray-200">
        <div className={GridClass}>行</div>
        <div className={GridClass}>Email</div>
        <div className={GridClass}>エラー</div>
        {result.errors.map((e) => (
          <>
            <div className={GridClass}>{e.row}</div>
            <div className={GridClass}>{e.email}</div>
            <div className={GridClass}>{e.message}</div>
          </>
        ))}
      </div>
    </div>
  ) : (
    <></>
  );

  return (
    <div className="flex flex-col">
      <div className="rounded-md border border-gray-300 p-4">
        <form method="post" encType="multipart/form-data">
          <div>
            <label htmlFor="csv">登録用CSV</label>
            <input type="file" id="csv" name="csv" />
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
      <div className="rounded-md border border-gray-300 p-3">
        email,氏名,職種のカラムを持ったCSVをアップロードしてください。
        <div className="bg-blue-50">
          <div className="ml-1 mt-1 inline-block bg-blue-100 px-1 text-sm">
            sample.csv
          </div>

          <pre className="block">{`email,氏名,職種
hoge@example.com,山田太郎,Engineer`}</pre>
        </div>
        <Link to="sample_csv" reloadDocument>
          <button className="rounded bg-green-400 p-2 hover:bg-green-500">
            サンプルのCSVをダウンロード
          </button>
        </Link>
      </div>
      <div className="rounded-md border border-gray-300 p-3">
        <div className="flex flex-col">
          <div className="bg-yellow-100 p-2">指定可能な職種一覧</div>
          {jobs.map((job, index) => (
            <div
              className="border border-gray-100 bg-yellow-50 p-2"
              key={index}
            >
              {job}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
