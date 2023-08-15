import * as Papa from "papaparse";
import { upsertEvaluations } from "~/models/evaluation.server";
import fs from "fs";
import { NodeOnDiskFile } from "@remix-run/node";
const Headers = new Map([
  ["evaluator", "評価者"],
  ["evaluatee", "被評価者"],
]);
// reverse Headers
const HeaderMapping = new Map([...Headers.entries()].map(([k, v]) => [v, k]));

type Row = {
  evaluator: string;
  evaluatee: string;
};

export async function registerEvaluations(
  termId: number,
  csvFile: NodeOnDiskFile,
  autoCreate: boolean
) {
  const rawCsv = fs.readFileSync(csvFile.getFilePath(), "utf-8");
  const csv = Papa.parse(rawCsv, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h, index) => HeaderMapping.get(h) ?? h,
  });

  return upsertEvaluations(termId, csv.data as Row[], autoCreate);
}

export function getSampleCsv() {
  return Papa.unparse(
    [
      {
        [HeaderMapping.get("evaluator") ?? "評価者"]: "Yamada Taro",
        [HeaderMapping.get("evaluatee") ?? "被評価者"]: "スズキイチロウ",
      },
    ],
    { header: true }
  );
}
