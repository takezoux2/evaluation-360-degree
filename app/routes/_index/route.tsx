import { json, type LoaderArgs, type V2_MetaFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { getUser, requireUser } from "~/session.server";
import { getTerms } from "./effect.server";

export const meta: V2_MetaFunction = () => [{ title: "アンケートシステム" }];

export const loader = async ({ request }: LoaderArgs) => {
  const user = await requireUser(request);
  const terms = await getTerms(user.id);
  return json({ isAdmin: user?.isAdmin ?? false, terms, user });
};

export default function Index() {
  const { isAdmin, terms, user } = useLoaderData<typeof loader>();
  const buttonClassName = "bg-green-300 border-black p-2 rounded-md";
  return (
    <main className="relative flex min-h-screen flex-col bg-white p-2">
      {terms.map((term, index) => (
        <a className={buttonClassName} href={`/term/${term.id}`} key={index}>
          {term.name}
        </a>
      ))}
      {isAdmin && (
        <div className="flex flex-col p-2">
          <div>管理者用</div>
          <div className="p-1">
            <a className={buttonClassName} href="/admin">
              管理ページ
            </a>
          </div>
        </div>
      )}
    </main>
  );
}
