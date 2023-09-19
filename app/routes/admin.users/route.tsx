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

export const loader = async ({ request, params }: LoaderArgs) => {
  const url = new URL(request.url);
  // get query params
  const limit = Number(url.searchParams.get("limit") ?? "20");
  const offset = Number(url.searchParams.get("offset") ?? "0");
  const keywords = url.searchParams.get("keyword")?.split(" ") ?? [];

  const users = await searchUser(keywords, { limit, offset });
  return json({
    users,
  });
};

export default function Users() {
  const { users } = useLoaderData<typeof loader>();
  return (
    <div className="flex flex-col">
      <div className="flex flex-row">
        <div className="w-1/4 border px-3 py-1">氏名</div>
        <div className="w-1/4 border px-3 py-1">email</div>
      </div>
      {users.map((user) => {
        return (
          <div className="flex flex-row">
            <div className="w-1/4 border px-3 py-1 text-blue-700">
              <a href={"/admin/user/" + user.id}>{user.name}</a>{" "}
            </div>
            <div className="w-1/4 border px-3 py-1">{user.email}</div>
          </div>
        );
      })}
    </div>
  );
}
