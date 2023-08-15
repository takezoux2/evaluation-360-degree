import { LoaderArgs } from "@remix-run/node";
import { getSampleCsv } from "./admin.import.evaluation/upload_csv.server";

export async function loader({ params }: LoaderArgs) {
  console.log("Download!");
  const csv = getSampleCsv();
  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="register_evaluation.csv"',
    },
  });
}
