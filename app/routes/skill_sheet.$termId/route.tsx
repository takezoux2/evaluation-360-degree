import {
  ActionArgs,
  json,
  LoaderArgs,
  type V2_MetaFunction,
} from "@remix-run/node";
import * as yaml from "yaml";
import { Form, useLoaderData, useSubmit } from "@remix-run/react";
import invariant from "tiny-invariant";
import { getLatestTerms, getTermById } from "~/models/term.server";
import { toInputDateTimeLocal, toUntil } from "~/time_util";
import { upsertAskSelectionSet } from "~/models/term_update.server";
import Editor from "@monaco-editor/react";
import { useState } from "react";
import {
  addExamCheatLog,
  ExamState,
  FullExam,
  getNotAnsweredExamsInTerm,
  startExamination,
  updateAnswer,
} from "~/models/exam.server";
import { requireUser } from "~/session.server";
import ExamPanel from "~/components/Exam/ExamPanel";
import {
  getSkills,
  getOrCreatePersonalSkillList,
  updateOrCreatePersonalSkill,
} from "./effect.server";
import { on } from "events";

export const meta: V2_MetaFunction = () => [{ title: "スキルシート一覧" }];

export const action = async ({ request }: ActionArgs) => {
  const formData = await request.formData();

  const personalSkillId = Number(formData.get("personalSkillId") ?? "0");
  const skillId = Number(formData.get("skillId") ?? "0");
  const experienceYear = Number(formData.get("experienceYear") ?? "0");
  console.log("Send");
  await updateOrCreatePersonalSkill({
    personalSkillId,
    skillId,
    experienceYear,
  });
  return json({ hoge: "Hoge" });
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const user = await requireUser(request);
  const term = await getTermById(Number(params.termId));

  invariant(term, "Term not found");
  /*invariant(
    term.endAt.getTime() < new Date().getTime(),
    "Term is already ended"
  );*/
  const personalSkillList = await getOrCreatePersonalSkillList(user, term);
  const skills = await getSkills();
  return json({
    user,
    personalSkillList,
    term,
    skills,
  });
};

export default function SkillSheet() {
  const { user, personalSkillList, term, skills } =
    useLoaderData<typeof loader>();

  const floatingSkillList = (
    input: string,
    setSkillInput: (skill: { id: number; name: string }) => void
  ) => {
    const skillList = input
      ? skills.filter((s) => s.lowerName.includes(input.toLocaleLowerCase()))
      : skills;
    return (
      <div
        className="absolute left-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
        role="menu"
        aria-orientation="vertical"
        aria-labelledby="menu-button"
        tabIndex={-1}
      >
        {skillList.map((s, index) => {
          return (
            <div
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-green-100"
              role="menuitem"
              tabIndex={-1}
              key={index}
              onClick={() => {
                console.log("Click: " + s);
                setSkillInput(s);
              }}
            >
              {s.name}
            </div>
          );
        })}
      </div>
    );
  };
  const [completionIndex, setCompletionIndex] = useState(-1);
  const skillListElements = personalSkillList.personalSkills.map((p, index) => {
    const [skillInput, setSkillInput] = useState(p.skill.name);
    const [skillId, setSkillId] = useState(p.skill.id);
    const [expYearInput, setExpYearInput] = useState(p.experienceYear);
    const showCompletion = completionIndex === index;
    const submit = useSubmit();
    return (
      <div key={p.id} className="flex flex-row">
        <div className="relative inline-block w-64 border p-2">
          <input
            type="text"
            value={skillInput}
            onChange={(t) => setSkillInput(t.target.value)}
            onFocus={() => setCompletionIndex(index)}
          />
          {showCompletion &&
            floatingSkillList(skillInput, (skill) => {
              setCompletionIndex(-1);
              setSkillInput(skill.name);
              setSkillId(skill.id);

              const data = new FormData();
              data.set("personalSkillId", String(p.id));
              data.set("skillId", String(skill.id));
              data.set("experienceYear", String(expYearInput));
              submit(data, { method: "post" });
            })}
        </div>
        <div className="w-64 border p-2">
          <input
            type="number"
            value={expYearInput}
            onChange={(t) => {
              setExpYearInput(Number(t.target.value));
              const data = new FormData();
              data.set("personalSkillId", String(p.id));
              data.set("skillId", String(skillId));
              data.set("experienceYear", String(t.target.value));
              submit(data, { method: "post" });
            }}
          />
        </div>
        <div className="w-32 border p-2">
          <button className="rounded-md bg-red-300 px-2" onClick={() => {}}>
            削除
          </button>
        </div>
      </div>
    );
  });

  return (
    <div className="flex flex-col">
      <div>{term.name}</div>
      <div>{user.name}</div>
      <div>
        <div>スキル</div>
        <div className="flex flex-row">
          <div className="w-64 border bg-green-100 p-2">スキル名</div>
          <div className="w-64 border bg-green-100 p-2">経験年数</div>
          <div className="w-32 border bg-green-100 p-2">削除</div>
        </div>
        <div>{skillListElements}</div>
      </div>
    </div>
  );
}
