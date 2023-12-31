import {
  json,
  LinksFunction,
  LoaderArgs,
  type V2_MetaFunction,
} from "@remix-run/node";
import { Link, Outlet, useLoaderData, useMatches } from "@remix-run/react";
import { requireAdminUser, requireUser } from "~/session.server";

export const meta: V2_MetaFunction = () => [{ title: "管理Top" }];

export const loader = async ({ params, request }: LoaderArgs) => {
  const user = await requireAdminUser(request);

  return json({ user });
};

export const handle = {
  breadcrumb: () => <Link to="/admin">Admin Top</Link>,
};
export default function Index() {
  const { user } = useLoaderData<typeof loader>();
  const matches = useMatches();
  return (
    <>
      <header>
        <div className="flex">
          <div className="w-3/4">
            <nav className="flex p-3" aria-label="Breadcrumb">
              <a href="/">管理ページ</a>
            </nav>
          </div>
          <div className="w-1/4 p-3 text-right">{user.name}</div>
        </div>
      </header>
      <main className="items-left flex min-h-screen flex-row bg-white p-3">
        <div className="mr-4 w-1/4">
          <div className="flex flex-col">
            <div className="w-full rounded-t-lg border border-gray-300 bg-yellow-100 p-2">
              CSV入出力
            </div>
            <div className="border border-gray-300 p-2">
              <Link
                className="text-blue-500 hover:text-blue-800"
                to="/admin/import/users"
              >
                ユーザー一括登録
              </Link>
            </div>
            <div className="border border-gray-300 p-2">
              <Link
                className="text-blue-500 hover:text-blue-800"
                to="/admin/import/evaluation"
              >
                評価対象一括登録
              </Link>
            </div>
            <div className="border border-gray-300 p-2">
              <Link
                className="text-blue-500 hover:text-blue-800"
                to="/admin/export/evaluation"
              >
                評価結果一括出力
              </Link>
            </div>
            <div className="border border-gray-300 p-2">
              <Link
                className="text-blue-500 hover:text-blue-800"
                to="/admin/export/exam"
              >
                試験結果一括出力
              </Link>
            </div>
          </div>
          <div className="mt-5 flex flex-col">
            <div className="w-full rounded-t-lg border border-gray-300 bg-yellow-50 p-2">
              エラー確認
            </div>
            <div className="border border-gray-300 p-2">
              <Link
                className="text-blue-500 hover:text-blue-800"
                to="/admin/check/eval_count"
              >
                被評価者数/評価者数確認
              </Link>
            </div>
          </div>
          <div className="mt-5 flex flex-col">
            <div className="w-full rounded-t-lg border border-gray-300 bg-yellow-50 p-2">
              データ登録/編集
            </div>
            <div className="border border-gray-300 p-2">
              <Link
                className="text-blue-500 hover:text-blue-800"
                to="/admin/term"
              >
                評価期間編集
              </Link>
            </div>
            <div className="border border-gray-300 p-2">
              <Link
                className="text-blue-500 hover:text-blue-800"
                to="/admin/users"
              >
                ユーザー一覧
              </Link>
            </div>
          </div>
        </div>
        <div className="w-3/4">
          <Outlet />
        </div>
      </main>
    </>
  );
}
