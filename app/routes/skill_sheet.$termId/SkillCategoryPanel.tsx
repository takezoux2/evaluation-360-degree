import { PersonalSkill, Skill, SkillCategory } from "@prisma/client";
import { StripReturnType } from "~/models/type_util";
import { getOrCreatePersonalSkillList, getSkills } from "./effect.server";
import { useState } from "react";
import { useSubmit } from "@remix-run/react";
import { SerializeFrom } from "@remix-run/node";

export default function ({
  personalSkills,
  skills,
  skillCategory,
}: {
  personalSkills: StripReturnType<
    typeof getOrCreatePersonalSkillList
  >["personalSkills"];
  skillCategory: SerializeFrom<SkillCategory>;
  skills: StripReturnType<typeof getSkills>[];
}) {
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
  const addSkillButtonStype = (() => {
    if (needSkillRegistration)
      return {
        label: "スキルを登録して追加",
        color: "bg-green-300",
      };
    if (showCompletion || skillId === 0)
      return {
        label: "スキルを選択してください",
        color: "bg-gray-300",
      };

    return { label: "追加", color: "bg-green-300" };
  })();
  return (
    <div className="flex flex-col rounded-md border px-2 py-5">
      <div>{skillCategory.name}</div>
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
            className={"rounded-md px-2 " + addSkillButtonStype.color}
            disabled={showCompletion || skillInput.length <= 1}
            onClick={() => {
              if (needSkillRegistration) {
                const r = confirm(
                  "スキルを新規に登録します。\nスペルミスがないか確認して登録してください。\n\n" +
                    skillInput +
                    "\n\n※変な登録した場合ペナルティーを受ける可能性があります。"
                );
                if (!r) {
                  return;
                }
                const data = new FormData();
                data.set("actionType", "RegisterSkillThenAdd");
                data.set(
                  "data",
                  JSON.stringify({
                    skillName: skillInput,
                    experienceYear: expYearInput,
                    skillCategoryId: skillCategory.id,
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
                    skillCategoryId: skillCategory.id,
                  })
                );
                submit(data, { method: "post", replace: true });
              }
              setSkillId(0);
              setSkillInput("");
            }}
          >
            {addSkillButtonStype.label}
          </button>
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
