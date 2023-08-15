import { json, LoaderArgs, type V2_MetaFunction } from "@remix-run/node";
import { Link, Outlet, useLoaderData } from "@remix-run/react";
import { getLatestTerms } from "~/models/term.server";
import { toHumanFriendly } from "~/time_util";

export const meta: V2_MetaFunction = () => [{ title: "Remix Notes" }];

export const loader = async ({ request }: LoaderArgs) => {
  const terms = await getLatestTerms(30);
  return json({ terms });
};

export default function TermList() {
  const { terms } = useLoaderData<typeof loader>();
  return (
    <div>
      <table>
        <thead>
          <tr>
            <th className="border border-gray-200">id</th>
            <th className="border border-gray-200">期間</th>
            <th className="border border-gray-200">開始</th>
            <th className="border border-gray-200">終了</th>
          </tr>
        </thead>
        <tbody>
          {terms.map((t, index) => (
            <tr key={index}>
              <td className="border border-gray-200">
                <Link to={t.id + ""} className="text-blue-600">
                  {t.id}
                </Link>
              </td>
              <td className="border border-gray-200">{t.name}</td>
              <td className="border border-gray-200">
                {toHumanFriendly(t.startAt)}
              </td>
              <td className="border border-gray-200">
                {toHumanFriendly(t.endAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
