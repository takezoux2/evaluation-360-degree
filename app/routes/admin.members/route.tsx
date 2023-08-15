import { json, LoaderArgs, type V2_MetaFunction } from "@remix-run/node";
import { Link, Outlet, useLoaderData } from "@remix-run/react";

export const meta: V2_MetaFunction = () => [{ title: "Remix Notes" }];

export const handle = {
  breadcrumb: () => <Link to="/admin/members">Members</Link>,
};

export default function Members() {
  return <div>members</div>;
}
