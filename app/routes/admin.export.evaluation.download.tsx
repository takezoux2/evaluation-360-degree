import { LoaderArgs } from "@remix-run/node";
import { requireAdminUser } from "~/session.server";
import { getTermById } from "~/models/term.server";
import invariant from "tiny-invariant";
import Papa from "papaparse";
import { getAllEvaluationsInTerm } from "~/models/evaluation.server";
import { DateTime } from "luxon";

export async function action({ params, request }: LoaderArgs) {
  console.log("Export evaluations");
  await requireAdminUser(request);
  const formData = await request.formData();
  const term = await getTermById(Number(formData.get("term_id")));
  invariant(term, `Term:${formData.get("term_id")} not found`);

  const allEvaluations = await getAllEvaluationsInTerm(term.id);

  const askItemIdToColIndex = new Map(
    term.askSections
      .flatMap((section) => section.askItems)
      .map((item, i) => [item.id, i + 4])
  );

  const now = DateTime.now();
  const exportTime = now.toFormat("yyyy/MM/dd HH:mm:ss");
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
      ...term.askSections.flatMap((section) =>
        section.askItems.map((a) => "自信なし:" + a.askText)
      ),
    ],
  ];
  const noConfidenceIndexOffset = askItemIdToColIndex.size;
  for (const evaluation of allEvaluations) {
    const row = new Array(rows[2].length);
    row[0] = evaluation.evaluatee.name;
    row[1] = evaluation.evaluatee.email;
    row[2] = evaluation.evaluatee.Job.name;
    row[3] = evaluation.evaluator.name;
    for (const answer of evaluation.answerItems) {
      row[askItemIdToColIndex.get(answer.askItemId)!] = answer.value;
      row[
        askItemIdToColIndex.get(answer.askItemId)! + noConfidenceIndexOffset
      ] = answer.noConfidence ? "1" : "0";
    }
    rows.push(row);
  }

  const csv = Papa.unparse(rows, {});

  const timestamp = now.toFormat("yyyyMMddHHmm");
  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="term${term.id}_evaluation_${timestamp}.csv"`,
    },
  });
}
