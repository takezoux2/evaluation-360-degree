import { PersonalSkillList, Term, User } from "@prisma/client";
import { prisma } from "~/db.server";

export const getPersonalSkillList = async (user: User, term: Term) => {
  const skillList = await prisma.personalSkillList.findUnique({
    where: {
      userId_termId: {
        userId: user.id,
        termId: term.id,
      },
    },
    include: {
      personalSkills: {
        include: {
          skill: true,
        },
      },
    },
  });
  return skillList;
};

export const createPersonalSkillList = async (user: User, term: Term) => {
  return await prisma.personalSkillList.create({
    data: {
      user: { connect: { id: user.id } },
      term: { connect: { id: term.id } },
    },
  });
};

export const getLatestPersonalSkillListSkills = async (user: User) => {
  const skillList = await prisma.personalSkillList.findFirst({
    where: {
      userId: user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      personalSkills: true,
    },
  });
  return skillList;
};

export const copySkills = async (
  from: PersonalSkillList,
  to: PersonalSkillList
) => {
  const skills = await prisma.personalSkill.findMany({
    where: {
      personalSkillListId: from.id,
    },
  });
  await prisma.personalSkill.createMany({
    data: skills.map((skill) => ({
      personalSkillListId: to.id,
      skillId: skill.skillId,
      experienceYear: skill.experienceYear,
    })),
  });
};

export const updatePersonalSkill = async (args: {
  personalSkillId: number;
  skillId: number;
  experienceYear: number;
}) => {
  await prisma.personalSkill.update({
    where: {
      id: args.personalSkillId,
    },
    data: {
      skillId: args.skillId,
      experienceYear: args.experienceYear,
    },
  });
};
