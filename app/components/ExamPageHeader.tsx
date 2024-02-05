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
          <h2 className="px-2 text-2xl">
            <a href={`/term/${term.id}`}>Term</a>
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
