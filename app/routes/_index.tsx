import { json, type LoaderArgs, type V2_MetaFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { getUser } from "~/session.server";

export const meta: V2_MetaFunction = () => [{ title: "アンケートシステム" }];

export const loader = async ({ request }: LoaderArgs) => {
  try {
    const user = await getUser(request);
    return json({ isAdmin: user?.isAdmin ?? false });
  } catch (e) {
    console.error(e);

    return json({ isAdmin: false });
  }
};

export default function Index() {
  const { isAdmin } = useLoaderData<typeof loader>();
  const buttonClassName = "bg-green-300 border-black p-2 rounded-md";
  return (
    <main className="relative flex min-h-screen flex-col bg-white p-2">
      <div className="m-2">
        <a className={buttonClassName} href="/evaluation">
          180度アンケート
        </a>
      </div>
      <div className="m-2">
        <a className={buttonClassName} href="/exam">
          スキルテスト
        </a>
      </div>
      <div className="m-2">
        <a className={buttonClassName} href="/term_exams">
          記述テスト
        </a>
      </div>
      {isAdmin && (
        <div className="m-2">
          <a className={buttonClassName} href="/admin">
            管理ページ
          </a>
        </div>
      )}
    </main>
  );
}
