import { LoaderArgs } from "@remix-run/node";
import { getSampleCsv } from "./admin.import.evaluation/upload_csv.server";
import { requireAdminUser } from "~/session.server";
import { getTermById } from "~/models/term.server";
import invariant from "tiny-invariant";
import Papa from "papaparse";
import { getAllEvaluationsInTerm } from "~/models/evaluation.server";

export async function action({ params, request }: LoaderArgs) {
  console.log("Export evaluations");
  requireAdminUser(request);
  const formData = await request.formData();
  const term = await getTermById(Number(formData.get("term_id")));
  invariant(term, `Term:${formData.get("term_id")} not found`);

  const allEvaluations = await getAllEvaluationsInTerm(term.id);

  const askItemIdToColIndex = new Map(
    term.askSections
      .flatMap((section) => section.askItems)
      .map((item, i) => [item.id, i + 4])
  );

  const now = new Date();
  const exportTime = `${now.getFullYear()}/${
    now.getMonth() + 1
  }/${now.getDate()} ${now.getHours().toString().padStart(2, "0")}:${now
    .getMinutes()
    .toString()
    .padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;
  const a = 1;
  // zero padding
  const a2 = a.toString().padStart(2, "0");
  const rows = [
    ["評価期間", term.name],
    ["ファイル出力日", exportTime],
    [
      "被評価者",
      "被評価者 email",
      "被評価者 職種",
      "評価者",
      ...term.askSections.flatMap((section) =>
        section.askItems.map((a) => a.askText)
      ),
    ],
  ];
  for (const evaluation of allEvaluations) {
    const row = new Array(rows[2].length);
    row[0] = evaluation.evaluatee.name;
    row[1] = evaluation.evaluatee.email;
    row[2] = evaluation.evaluatee.Job.name;
    row[3] = evaluation.evaluator.name;
    for (const answer of evaluation.answerItems) {
      row[askItemIdToColIndex.get(answer.askItemId)!] = answer.value;
    }
    rows.push(row);
  }

  const csv = Papa.unparse(rows, {});

  const timestamp =
    now.getFullYear() * 100_00_00_00 +
    (now.getMonth() + 1) * 100_00_00 +
    now.getDate() * 100_00 +
    now.getHours() * 100 +
    now.getMinutes();
  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${term.name}_${timestamp}.csv"`,
    },
  });
}
