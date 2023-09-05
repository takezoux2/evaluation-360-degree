import { LoaderArgs } from "@remix-run/node";
import { requireAdminUser } from "~/session.server";
import { getTermById } from "~/models/term.server";
import invariant from "tiny-invariant";
import Papa from "papaparse";
import { getAllEvaluationsInTerm } from "~/models/evaluation.server";
import { getExamScores } from "~/models/exam.server";
import { DateTime } from "luxon";

export async function action({ params, request }: LoaderArgs) {
  console.log("Export exam results");
  await requireAdminUser(request);
  const formData = await request.formData();
  const term = await getTermById(Number(formData.get("term_id")));
  invariant(term, `Term:${formData.get("term_id")} not found`);

  const examScores = await getExamScores(term.id);

  const now = DateTime.now();

  // zero padding
  const rows = [
    ["評価期間", term.name],
    ["ファイル出力日", now.toFormat("yyyy/MM/dd HH:mm:ss")],
  ];
  for (const exam of examScores) {
    rows.push(["試験", exam.exam.name, "満点", exam.exam.fullScore.toString()]);
    rows.push([
      "受験者",
      "受験者 email",
      "受験者 職種",
      "得点",
      ...exam.exam.examQuestions.map((q, index) => {
        return `第${index + 1}問 ${q.text.substring(0, 5)}...`;
      }),
    ]);
    exam.answers.forEach((answer) => {
      rows.push([
        answer.user.name,
        answer.user.email,
        answer.user.job,
        answer.totalScore.toString(),
        ...answer.scores.map((s) => s.toString()),
      ]);
    });
  }

  const csv = Papa.unparse(rows, {});

  const timestamp = now.toFormat("yyyyMMddHHmm");
  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${term.name}_exam_${timestamp}.csv"`,
    },
  });
}
