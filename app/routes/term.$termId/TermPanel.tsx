import { Term } from "@prisma/client";
import { getTermsInTerm } from "~/models/term.server";
import { StripReturnType } from "~/models/type_util";
import { getTermDataList } from "./effect.server";

export function TermPanel({
  term,
}: {
  term: StripReturnType<typeof getTermDataList>;
}) {
  const skillSheet = (
    <div className="m-2">
      <a
        className="rounded-md border-black bg-green-300 p-2"
        href={`/skill_sheet/${term.id}`}
      >
        スキルシート
      </a>
    </div>
  );

  const essayExams = (
    <div className="m-2 block rounded-lg border border-gray-500 shadow">
      <h5 className="bg-blue-200 p-2">記述試験</h5>
      <p>
        {term.EssayExam.map((e) => {
          return (
            <a
              className="rounded-md border-black bg-green-300 p-2"
              href={`/essay_exam/${e.id}`}
            >
              {e.name}
            </a>
          );
        })}
      </p>
    </div>
  );

  return (
    <div>
      <div>{term.name}</div>
      {skillSheet}
      {essayExams}
    </div>
  );
}
