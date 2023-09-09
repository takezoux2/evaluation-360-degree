import { json, LoaderArgs, type V2_MetaFunction } from "@remix-run/node";
import { Link, Outlet, useLoaderData } from "@remix-run/react";
import { getLatestTerms } from "~/models/term.server";

export const meta: V2_MetaFunction = () => [{ title: "評価期間" }];

export default function Term() {
  return <Outlet></Outlet>;
}
