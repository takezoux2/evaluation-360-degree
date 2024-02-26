import { Form } from "@remix-run/react";

export function ExamPageHader({
  user,
  term,
}: {
  user: { name: string };
  term: { id: number };
}) {
  return (
    <header>
      <div className="flex flex-row items-center justify-between p-1">
        <div className="basis-3/6">
          <h2 className="text-l px-2">
            <a
              href={`/term/${term.id}`}
              className="rounded-md border bg-slate-300 px-2 py-1"
            >
              &lt;試験選択へ戻る
            </a>
          </h2>
        </div>
        <div className="basis-2/6 p-2 text-right">{user.name}</div>

        <div className="basis-1/6 text-right">
          <Form reloadDocument action="/logout" method="post">
            <button
              type="submit"
              className=" rounded-lg bg-blue-500 p-2 text-white"
            >
              ログアウト
            </button>
          </Form>
        </div>
      </div>
    </header>
  );
}
