import { json, type V2_MetaFunction } from "@remix-run/node";
import {
  Form,
  Link,
  Outlet,
  useActionData,
  useLoaderData,
} from "@remix-run/react";
import { useState } from "react";
import invariant from "tiny-invariant";
import { countUpEvaluattorAndEvaluatee } from "~/models/check_eval.server";

export const meta: V2_MetaFunction = () => [{ title: "被評価数チェック" }];

export const loader = async () => {
  const counts = await countUpEvaluattorAndEvaluatee();

  return json({
    counts: counts,
  });
};

export default function CheckEvalCount() {
  const { counts } = useLoaderData<typeof loader>();
  const [showRetired, setShowRetired] = useState(true);
  const [evaluatorThreshold, setEvaluatorThreshold] = useState(1);
  const [evaluateeThreshold, setEvaluateeThreshold] = useState(3);

  const rows = counts
    .map((c) => {
      return {
        id: c.id,
        name: c.name,
        evaluatorCount: c.evaluatorCount,
        evaluateeCount: c.evaluateeCount,
        isRetired: c.isRetired,
        className: {
          evaluatorCount:
            c.evaluatorCount < evaluatorThreshold ? "bg-red-200" : "",
          evaluateeCount:
            c.evaluateeCount < evaluateeThreshold ? "bg-red-200" : "",
          isRetired: c.isRetired ? "bg-red-200" : "",
        },
      };
    })
    .filter((c) => {
      if (showRetired) {
        return true;
      } else {
        return c.isRetired === false;
      }
    })
    .filter((c) => {
      return (
        c.evaluatorCount < evaluatorThreshold ||
        c.evaluateeCount < evaluateeThreshold
      );
    });
  return (
    <div className="flex flex-col">
      <div className="rounded-lg border">
        <div className="flex flex-col p-2">
          <div className="font-bold">エラー条件</div>
          <div className="flex w-64 flex-row border">
            <div className="w-2/4">評価される数が</div>
            <input
              type="number"
              className="w-1/4 px-2 text-right"
              value={evaluateeThreshold}
              onChange={(e) => {
                setEvaluateeThreshold(parseInt(e.target.value));
              }}
            />
            <div className="w-1/4">未満</div>
          </div>
          <div className="flex w-64 flex-row border">
            <div className="w-2/4">評価する数が</div>
            <input
              type="number"
              className="w-1/4 px-2 text-right"
              value={evaluatorThreshold}
              onChange={(e) => {
                setEvaluatorThreshold(parseInt(e.target.value));
              }}
            />
            <div className="w-1/4">未満</div>
          </div>
          <div className="flex w-64 flex-row border">
            <div className="w-2/4">退職者</div>
            <input
              type="checkbox"
              className="w-1/4 px-2 text-right"
              checked={showRetired}
              onChange={(e) => {
                setShowRetired(!showRetired);
              }}
            />
          </div>
        </div>
      </div>
      <div className="w-full py-3">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-yellow-200">
              <th className="border p-2">ユーザー</th>
              <th className="border p-2">評価される数</th>
              <th className="border p-2">評価する数</th>
              <th className="border p-2">退職済み</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c, index) => (
              <tr key={index}>
                <td className="border p-2">{c.name}</td>
                <td className={"border p-2 " + c.className.evaluateeCount}>
                  {c.evaluateeCount + ""}
                </td>
                <td className={"border p-2 " + c.className.evaluatorCount}>
                  {c.evaluatorCount + ""}
                </td>
                <td className={"border p-2 " + c.className.isRetired}>
                  {c.isRetired ? "はい" : "いいえ"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
