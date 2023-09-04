import type { V2_MetaFunction } from "@remix-run/node";
import { useOptionalUser } from "~/utils";

export const meta: V2_MetaFunction = () => [{ title: "Remix Notes" }];

export default function Index() {
  const user = useOptionalUser();
  const buttonClassName = "bg-green-300 border-black p-2 rounded-md";
  return (
    <main className="relative flex min-h-screen flex-col bg-white p-2">
      <div className="m-2">
        <a className={buttonClassName} href="/evaluation">
          評価
        </a>
      </div>
      <div className="m-2">
        <a className={buttonClassName} href="/exam">
          試験
        </a>
      </div>
      <div className="m-2">
        <a className={buttonClassName} href="/admin">
          管理ページ
        </a>
      </div>
    </main>
  );
}
