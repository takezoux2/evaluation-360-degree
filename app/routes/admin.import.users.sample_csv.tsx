import { LoaderArgs } from "@remix-run/node";
import { getSampleCsv } from "./admin.import.users/upload_csv.server";
import { requireAdminUser } from "~/session.server";

export async function loader({ request, params }: LoaderArgs) {
  await requireAdminUser(request);
  console.log("Download!");
  const csv = getSampleCsv();
  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="register_user.csv"',
    },
  });
}
