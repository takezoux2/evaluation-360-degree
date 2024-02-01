import { Term, User } from "@prisma/client";
import {
  copySkills,
  createPersonalSkillList,
  deletePersonalSkill,
  getLatestPersonalSkillListSkills,
  getPersonalSkillList,
  insertPersonalSkill,
  upsertPersonalSkill,
} from "~/models/personal_skill.server";
import { getAllSkills, upsertSkill } from "~/models/skill.server";

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
      return Object.assign(skill, {
        lowerName: skill.name.toLowerCase().replace(/\s/g, ""),
      });
    });
  });
};

export const updateOrCreatePersonalSkill = async (args: {
  personalSkillListId: number;
  skillId: number;
  experienceYear: number;
}) => {
  return await upsertPersonalSkill(args);
};
export const createPersonalSkill = (args: { user: User; term: Term }) => {
  return insertPersonalSkill({
    userId: args.user.id,
    termId: args.term.id,
  });
};
export const removePersonalSkill = (personalSkillId: number) => {
  return deletePersonalSkill(personalSkillId);
};

export const registerSkill = (skillName: string, registeredUser: User) => {
  return upsertSkill(skillName, registeredUser.id);
};
