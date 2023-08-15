import { json, LoaderArgs, type V2_MetaFunction } from "@remix-run/node";
import { Link, Outlet, useLoaderData } from "@remix-run/react";
import { requireAdminUser, requireUser } from "~/session.server";

export const meta: V2_MetaFunction = () => [{ title: "Remix Notes" }];

export default function Admin() {
  return <div>360度評価システムです。</div>;
}
