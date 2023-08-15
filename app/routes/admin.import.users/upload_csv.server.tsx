import * as Papa from "papaparse";
import { upsertUsers } from "~/models/user.server";
import fs from "fs";
import { NodeOnDiskFile } from "@remix-run/node";
const Headers = new Map([
  ["email", "email"],
  ["name", "氏名"],
  ["job", "職種"],
]);
// reverse Headers
const HeaderMapping = new Map([...Headers.entries()].map(([k, v]) => [v, k]));

type Row = {
  email: string;
  name: string;
  job: string;
};

export async function regiterUsers(csvFile: NodeOnDiskFile) {
  const rawCsv = fs.readFileSync(csvFile.getFilePath(), "utf-8");
  const csv = Papa.parse(rawCsv, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h, index) => HeaderMapping.get(h) ?? h,
  });

  return upsertUsers(csv.data as Row[]);
}

export function getSampleCsv() {
  return Papa.unparse(
    [
      {
        email: "hoge@example.com",
        [HeaderMapping.get("name") ?? "氏名"]: "Yamada Taro",
        [HeaderMapping.get("job") ?? "職種"]: "Engineer",
      },
    ],
    { header: true }
  );
}
