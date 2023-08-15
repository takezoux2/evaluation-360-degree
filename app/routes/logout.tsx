import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";

import { logout } from "~/session.server";

export const action = async ({ request }: ActionArgs) => {
  return await logout(request);
};

export const loader = async ({ request }: LoaderArgs) => {
  return redirect("/");
};
