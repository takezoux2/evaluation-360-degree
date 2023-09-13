import { json, LoaderArgs, type V2_MetaFunction } from "@remix-run/node";

export const meta: V2_MetaFunction = () => [{ title: "管理ページ" }];

export default function Admin() {
  return <div>180度評価システムです。</div>;
}
