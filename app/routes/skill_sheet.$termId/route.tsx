import {
  ActionArgs,
  json,
  LoaderArgs,
  type V2_MetaFunction,
} from "@remix-run/node";
import * as yaml from "yaml";
import {
  Form,
  useActionData,
  useLoaderData,
  useSubmit,
} from "@remix-run/react";
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
  removePersonalSkill,
  createPersonalSkill,
  registerSkill,
} from "./effect.server";
import { on } from "events";
import { insertPersonalSkill } from "~/models/personal_skill.server";

export const meta: V2_MetaFunction = () => [{ title: "スキルシート一覧" }];

type ActionType = "Delete" | "AddOrUpdate" | "RegisterSkillThenAdd";
type UpdatePersonalSkill = {
  skillId: number;
  experienceYear: number;
};
type DeletePersonalSkill = {
  personalSkillId: number;
};
type RegisterThenAddPersonalSkill = {
  skillName: string;
  experienceYear: number;
};

export const action = async ({ request, params }: ActionArgs) => {
  const formData = await request.formData();
  const user = await requireUser(request);
  const term = await getTermById(Number(params.termId));
  invariant(term, "Term not found");

  const actionType = formData.get("actionType") as ActionType;
  if (actionType === "RegisterSkillThenAdd") {
    const data: RegisterThenAddPersonalSkill = JSON.parse(
      formData.get("data") as string
    );
    const skill = await registerSkill(data.skillName);
    const personalSkillList = await getOrCreatePersonalSkillList(user, term);
    await updateOrCreatePersonalSkill({
      skillId: skill.id,
      experienceYear: data.experienceYear,
      personalSkillListId: personalSkillList.id,
    });
  } else if (actionType === "AddOrUpdate") {
    const data: UpdatePersonalSkill = JSON.parse(
      formData.get("data") as string
    );
    const personalSkillList = await getOrCreatePersonalSkillList(user, term);

    await updateOrCreatePersonalSkill({
      ...data,
      personalSkillListId: personalSkillList.id,
    });
  } else if (actionType === "Delete") {
    const data: DeletePersonalSkill = JSON.parse(
      formData.get("data") as string
    );
    await removePersonalSkill(data.personalSkillId);
  }
  const updated = await getOrCreatePersonalSkillList(user, term);

  return json({ personalSkillList: updated });
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

  const postResult = useActionData<typeof action>();
  const personalSkills = (
    postResult?.personalSkillList?.personalSkills ??
    personalSkillList.personalSkills
  ).sort((a, b) => b.experienceYear - a.experienceYear);

  const [skillInput, setSkillInput] = useState("");
  const [skillId, setSkillId] = useState(0);
  const [expYearInput, setExpYearInput] = useState(1);
  const [showCompletion, setShowCompletion] = useState(false);

  const floatingSkillList = (
    input: string,
    setSkillInput: (skill: { id: number; name: string }) => void
  ) => {
    const lowerInput = input.toLocaleLowerCase().replace(/\s/g, "");
    const skillList = input
      ? skills.filter((s) => s.lowerName.includes(lowerInput))
      : skills.slice(0, 10);
    const hasPerfectMatch = skills.some((s) => s.lowerName === lowerInput);
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
                setSkillInput(s);
              }}
            >
              {s.name}
            </div>
          );
        })}
        {skillInput.length > 1 && !hasPerfectMatch && (
          <div
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-green-100"
            role="menuitem"
            tabIndex={-1}
            key={-1}
            onClick={() => {
              setSkillInput({ id: 0, name: skillInput.trim() });
            }}
          >
            【新規】{skillInput}
          </div>
        )}
      </div>
    );
  };
  const submit = useSubmit();
  const skillListElements = personalSkills.map((p, index) => {
    return (
      <div key={p.id} className="flex flex-row">
        <div className="relative inline-block w-64 border p-2">
          {p.skill.name}
        </div>
        <div className="w-64 border p-2">{p.experienceYear}</div>
        <div className="w-32 border p-2">
          <button
            className="rounded-md bg-red-300 px-2"
            onClick={() => {
              const data = new FormData();
              data.set("actionType", "Delete");
              data.set(
                "data",
                JSON.stringify({
                  personalSkillId: Number(p.id),
                })
              );
              submit(data, { method: "post" });
            }}
          >
            削除
          </button>
        </div>
      </div>
    );
  });

  const needSkillRegistration = skillId === 0 && skillInput.length > 1;
  const addSkillButtonLabel = (() => {
    if (needSkillRegistration) return "スキルを登録して追加";
    if (showCompletion || skillId === 0) return "スキルを選択してください";

    return "追加";
  })();
  const addSkillButtonClass =
    showCompletion || skillId === 0 ? "bg-gray-300" : "bg-green-300";
  return (
    <div className="flex flex-col">
      <div>{term.name}</div>
      <div>{user.name}</div>

      <div>
        <div>スキル追加</div>
        <div className="flex flex-row">
          <div className="flex w-96 flex-row border bg-blue-100  p-2">
            <label className="w-24" htmlFor="skill_name">
              スキル名:
            </label>
            <div className="w-full">
              <input
                id="skill_name"
                type="text"
                className="w-full pl-1"
                onFocus={() => setShowCompletion(true)}
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                autoComplete="off"
              />
              {showCompletion &&
                floatingSkillList(skillInput, (skill) => {
                  setSkillId(skill.id);
                  setSkillInput(skill.name);
                  setShowCompletion(false);
                })}
            </div>
          </div>
          <div className="w-52 border bg-blue-100 p-2">
            <label htmlFor="expYear">経験年数:</label>
            <input
              id="expYear"
              type="number"
              className="ml-2 w-16 text-right"
              value={expYearInput}
              onChange={(e) => setExpYearInput(Number(e.target.value))}
            />
          </div>
          <div className=" bg-blue-100 p-2">
            <button
              className={"rounded-md px-2 " + addSkillButtonClass}
              disabled={showCompletion || skillInput.length <= 1}
              onClick={() => {
                if (needSkillRegistration) {
                  const data = new FormData();
                  data.set("actionType", "RegisterSkillThenAdd");
                  data.set(
                    "data",
                    JSON.stringify({
                      skillName: skillInput,
                      experienceYear: expYearInput,
                    })
                  );
                  submit(data, { method: "post", replace: true });
                } else {
                  const data = new FormData();
                  data.set("actionType", "AddOrUpdate");
                  data.set(
                    "data",
                    JSON.stringify({
                      skillId: skillId,
                      experienceYear: expYearInput,
                    })
                  );
                  submit(data, { method: "post", replace: true });
                }
                setSkillId(0);
                setSkillInput("");
              }}
            >
              {addSkillButtonLabel}
            </button>
          </div>
        </div>
      </div>
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
