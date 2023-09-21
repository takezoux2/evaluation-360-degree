import {
  ActionArgs,
  json,
  LoaderArgs,
  type V2_MetaFunction,
} from "@remix-run/node";
import * as yaml from "yaml";
import { Form, useLoaderData } from "@remix-run/react";
import { getUsers, searchUser } from "./user_search.server";

export const meta: V2_MetaFunction = () => [{ title: "ユーザー一覧" }];

const ItemsPerPage = 50;

export const loader = async ({ request, params }: LoaderArgs) => {
  const url = new URL(request.url);
  // get query params
  const page = Number(url.searchParams.get("page") ?? "1");
  const keyword = url.searchParams.get("keyword") ?? "";

  const users = await searchUser(keyword.split(" "), {
    limit: ItemsPerPage,
    offset: (page - 1) * ItemsPerPage,
  });
  return json({
    users,
    page,
    keyword,
  });
};

export default function Users() {
  const { users, page, keyword } = useLoaderData<typeof loader>();
  return (
    <div className="flex flex-col">
      <Form method="GET">
        <label
          htmlFor="default-search"
          className="sr-only mb-2 text-sm font-medium text-gray-900 dark:text-white"
        >
          Search
        </label>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <svg
              className="h-4 w-4 text-gray-500 dark:text-gray-400"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 20 20"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
              />
            </svg>
          </div>
          <input
            type="search"
            id="default-search"
            name="keyword"
            className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-3 pl-10 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 "
            placeholder="Search by name or email"
          />
          <button
            type="submit"
            className="absolute bottom-1.5 right-1.5 rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
          >
            検索
          </button>
        </div>
      </Form>
      <div className="flex flex-col p-3">
        <div className="flex flex-row">
          <div className="w-1/4 border bg-yellow-100 px-3 py-1">氏名</div>
          <div className="w-1/4 border bg-yellow-100 px-3 py-1">email</div>
          <div className="w-1/4 border bg-yellow-100 px-3 py-1">職種</div>
          <div className="w-1/4 border bg-yellow-100 px-3 py-1">退職済み</div>
        </div>
        {users.map((user) => {
          return (
            <div key={user.id} className="flex flex-row">
              <div className="w-1/4 border px-3 py-1 text-blue-700">
                <a href={"/admin/user/" + user.id}>{user.name}</a>{" "}
              </div>
              <div className="w-1/4 border px-3 py-1">{user.email}</div>
              <div className="w-1/4 border px-3 py-1">{user.Job.name}</div>
              <div className="w-1/4 border px-3 py-1">
                {user.isRetired ? "退職済み" : ""}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex flex-row">
        {page > 1 ? (
          <div className="w-1/4">
            <a
              href={
                "/admin/users?page=" +
                (page - 1) +
                (keyword.length > 0 ? "&keyword=" + keyword : "")
              }
              className="rounded-lg border bg-sky-300 px-3 py-2"
            >
              前のページ
            </a>
          </div>
        ) : (
          <div className="w-1/4"></div>
        )}
        <div className="w-2/4" />
        {users.length === ItemsPerPage && (
          <div className="w-1/4 place-content-end">
            <a
              href={
                "/admin/users?page=" +
                (page + 1) +
                (keyword.length > 0 ? "&keyword=" + keyword : "")
              }
              className="rounded-lg border bg-sky-300 px-3 py-2"
            >
              次のページ
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
