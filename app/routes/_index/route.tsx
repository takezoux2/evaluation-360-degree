import { json, type LoaderArgs, type V2_MetaFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { getUser, requireUser } from "~/session.server";
import { getTerms } from "./effect.server";

export const meta: V2_MetaFunction = () => [{ title: "職能給テストサービス" }];

export const loader = async ({ request }: LoaderArgs) => {
  const user = await requireUser(request);
  const terms = await getTerms(user.id);
  return json({ isAdmin: user?.isAdmin ?? false, terms, user });
};

export default function Index() {
  const { isAdmin, terms, user } = useLoaderData<typeof loader>();
  return (
    <main className="relative flex min-h-screen flex-col bg-white p-2">
      <div className="flex w-64 flex-col">
        <div className=" rounded-t-lg bg-blue-100 p-3 text-lg font-bold">
          受験可能なテスト
        </div>
        <div>
          <ul className="list-inside list-none">
            {terms.length > 0 ? (
              terms.map((term, index) => (
                <li className="border p-2 hover:bg-orange-100">
                  <a
                    className="block w-full text-lg"
                    href={`/term/${term.id}`}
                    key={index}
                  >
                    {term.name}
                  </a>
                </li>
              ))
            ) : (
              <li>現在受験可能なテストは有りません</li>
            )}
          </ul>
        </div>
      </div>
      {isAdmin && (
        <div className="mt-5 flex w-64 flex-col">
          <div className="rounded-t-lg bg-blue-100 p-3 text-lg font-bold">
            管理者用
          </div>
          <div className="border p-2 hover:bg-orange-100">
            <a className="block w-full text-lg" href="/admin">
              管理ページ
            </a>
          </div>
        </div>
      )}
    </main>
  );
}
