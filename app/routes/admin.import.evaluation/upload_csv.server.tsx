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
  csvFile: NodeOnDiskFile | string,
  autoCreate: boolean
) {
  const rawCsv =
    typeof csvFile === "string"
      ? csvFile
      : fs.readFileSync(csvFile.getFilePath(), "utf-8");
  const csv = Papa.parse<string[]>(rawCsv, {
    header: false,
    skipEmptyLines: true,
  });
  const userToUsers = new Map<string, string[]>();
  // loop foreach row for papaparse without header
  for (const row of csv.data) {
    if (row.length === 0 || row[0].includes("評価者")) continue;
    const tees = row.slice(1).filter((v) => v !== "");
    if (tees.length === 0) continue;
    const list = userToUsers.get(row[0]) ?? [];
    list.push(...tees);
    userToUsers.set(row[0], list);
  }
  // デフォルトは１列目が被評価者
  // １列目が評価者と指定がある場合は、１列目が評価者になる
  const mode =
    csv.data.length > 0 && csv.data[0][0] === "評価者"
      ? "評価者ベース"
      : "被評価者ベース";
  const pairs = Array.from(userToUsers.entries()).flatMap(([user, users]) => {
    const uniqued = Array.from(new Set(users));
    if (mode === "評価者ベース") {
      return uniqued.map((evaluatee) => ({
        evaluator: user,
        evaluatee,
      }));
    } else {
      return uniqued.map((evaluator) => ({
        evaluator,
        evaluatee: user,
      }));
    }
  });

  return upsertEvaluations(termId, pairs, autoCreate);
}

export function getSampleCsv() {
  return Papa.unparse(
    [
      {
        [HeaderMapping.get("evaluator") ?? "被評価者"]: "Yamada Taro",
        [HeaderMapping.get("evaluatee") ?? "評価者"]: "スズキイチロウ",
        評価者2: "スズキ治郎",
        評価者3: "saburo.suzuki@leverages.jp",
      },
    ],
    { header: true }
  );
}
