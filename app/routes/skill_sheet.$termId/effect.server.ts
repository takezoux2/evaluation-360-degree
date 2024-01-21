import { Term, User } from "@prisma/client";
import {
  copySkills,
  createPersonalSkillList,
  getLatestPersonalSkillListSkills,
  getPersonalSkillList,
  updatePersonalSkill,
} from "~/models/personal_skill.server";
import { getAllSkills } from "~/models/skill.server";
import { getTermById, getTermsInTerm } from "~/models/term.server";
import { requireUser } from "~/session.server";

export const getOrCreatePersonalSkillList = async (user: User, term: Term) => {
  const personalSkillList = await getPersonalSkillList(user, term);
  if (personalSkillList) {
    return personalSkillList;
  } else {
    const latest = await getLatestPersonalSkillListSkills(user);
    const skillList = await createPersonalSkillList(user, term);
    if (latest) {
      await copySkills(latest, skillList);
    }
    const p = await getPersonalSkillList(user, term);
    return p!;
  }
};

export const getSkills = () => {
  return getAllSkills().then((skills) => {
    return skills.map((skill) => {
      return Object.assign(skill, { lowerName: skill.name.toLowerCase() });
    });
  });
};

export const updateOrCreatePersonalSkill = (args: {
  personalSkillId: number;
  skillId: number;
  experienceYear: number;
}) => {
  return updatePersonalSkill(args);
};
