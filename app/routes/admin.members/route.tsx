import { json, LoaderArgs, type V2_MetaFunction } from "@remix-run/node";
import { Link, Outlet, useLoaderData } from "@remix-run/react";

export const meta: V2_MetaFunction = () => [{ title: "ユーザー一覧" }];

export default function Members() {
  return <div>members</div>;
}
