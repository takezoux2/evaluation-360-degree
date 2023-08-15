import { json, LoaderArgs, type V2_MetaFunction } from "@remix-run/node";
import { Link, Outlet, useLoaderData } from "@remix-run/react";
import { getLatestTerms } from "~/models/term.server";

export const meta: V2_MetaFunction = () => [{ title: "Remix Notes" }];

export const handle = {
  breadcrumb: () => <Link to="/admin/term">評価期間一覧</Link>,
};

export default function TermList() {
  return <Outlet></Outlet>;
}
