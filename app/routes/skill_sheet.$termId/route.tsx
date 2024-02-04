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
import { useState } from "react";
import { requireUser } from "~/session.server";
import {
  getSkills,
  getOrCreatePersonalSkillList,
  updateOrCreatePersonalSkill,
  removePersonalSkill,
  registerSkill,
} from "./effect.server";
import { getSkillCategories } from "~/models/personal_skill.server";
import SkillCategoryPanel from "./SkillCategoryPanel";

export const meta: V2_MetaFunction = () => [{ title: "スキルシート一覧" }];

type ActionType = "Delete" | "AddOrUpdate" | "RegisterSkillThenAdd";
type UpdatePersonalSkill = {
  skillId: number;
  experienceYear: number;
  skillCategoryId: number;
};
type DeletePersonalSkill = {
  personalSkillId: number;
};
type RegisterThenAddPersonalSkill = {
  skillName: string;
  experienceYear: number;
  skillCategoryId: number;
};

export const action = async ({ request, params }: ActionArgs) => {
  const formData = await request.formData();
  const user = await requireUser(request);
  const term = await getTermById(Number(params.termId));
  const skillCategoryId = 1;
  invariant(term, "Term not found");

  const actionType = formData.get("actionType") as ActionType;
  if (actionType === "RegisterSkillThenAdd") {
    const data: RegisterThenAddPersonalSkill = JSON.parse(
      formData.get("data") as string
    );
    const skill = await registerSkill(data.skillName, user);
    const personalSkillList = await getOrCreatePersonalSkillList(user, term);
    await updateOrCreatePersonalSkill({
      skillId: skill.id,
      experienceYear: data.experienceYear,
      personalSkillListId: personalSkillList.id,
      skillCategoryId: data.skillCategoryId,
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
  const skillCategories = await getSkillCategories();
  return json({
    user,
    personalSkillList,
    term,
    skills,
    skillCategories,
  });
};

export default function SkillSheet() {
  const { user, personalSkillList, term, skills, skillCategories } =
    useLoaderData<typeof loader>();

  const postResult = useActionData<typeof action>();

  const allPersonalSkills = (
    postResult?.personalSkillList?.personalSkills ??
    personalSkillList.personalSkills
  ).sort((a, b) => b.experienceYear - a.experienceYear);

  const panels = skillCategories.map((category, index) => {
    const personalSkills = allPersonalSkills.filter(
      (skill) => skill.skillCategoryId === category.id
    );
    return (
      <SkillCategoryPanel
        key={index}
        skills={skills}
        skillCategory={category}
        personalSkills={personalSkills}
      />
    );
  });

  return (
    <div className="flex flex-col">
      <div>{term.name}</div>
      <div>{user.name}</div>
      {panels}
    </div>
  );
}
