import type { V2_MetaFunction } from "@remix-run/node";
import { useOptionalUser } from "~/utils";

export const meta: V2_MetaFunction = () => [{ title: "Remix Notes" }];

export default function Index() {
  const user = useOptionalUser();
  return (
    <main className="relative flex min-h-screen bg-white">
      <ul className="p-10">
        <li>
          <a href="/evaluation">評価</a>
        </li>
        <li>
          <a href="/admin">管理ページ</a>
        </li>
      </ul>
    </main>
  );
}
