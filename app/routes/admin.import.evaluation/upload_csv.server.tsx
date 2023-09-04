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


export async function registerEvaluations(
  termId: number,
  csvFile: NodeOnDiskFile,
  autoCreate: boolean
) {
  const rawCsv = fs.readFileSync(csvFile.getFilePath(), "utf-8");
  const csv = Papa.parse<string[]>(rawCsv, {
    header: false,
    skipEmptyLines: true
  });
  const evaluatees = new Map<string, string[]>()
  // loop foreach row for papaparse without header
  for(const row of csv.data.slice(1)) {
    if(row.length === 0 || row[0] === "評価者") continue;
    const tees = row.slice(1).filter((v) => v !== "");
    if(tees.length === 0) continue
    const list = evaluatees.get(row[0]) ?? [];
    list.push(...tees);
    evaluatees.set(row[0], list);
  }

  const pairs = Array.from(evaluatees.entries()).flatMap(([evaluator, evaluatees]) => {
    const uniqued = Array.from(new Set(evaluatees));
    return uniqued.map((evaluatee) => ({
      evaluator,
      evaluatee
    }));
  })

  return upsertEvaluations(termId, pairs, autoCreate);
}

export function getSampleCsv() {
  return Papa.unparse(
    [
      {
        [HeaderMapping.get("evaluator") ?? "評価者"]: "Yamada Taro",
        [HeaderMapping.get("evaluatee") ?? "被評価者"]: "スズキイチロウ",
        "被評価者2": "スズキ治郎",
        "被評価者3": "saburo.suzuki@leverages.jp",
      },
    ],
    { header: true }
  );
}
