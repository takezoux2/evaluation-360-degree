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

export const upsertPersonalSkill = async (args: {
  personalSkillListId: number;
  skillId: number;
  experienceYear: number;
}) => {
  return await prisma.personalSkill.upsert({
    where: {
      skillId_personalSkillListId: {
        personalSkillListId: args.personalSkillListId,
        skillId: args.skillId,
      },
    },
    update: {
      experienceYear: args.experienceYear,
    },
    create: {
      personalSkillListId: args.personalSkillListId,
      skillId: args.skillId,
      experienceYear: args.experienceYear,
    },
  });
};
export const insertPersonalSkill = async (args: {
  userId: number;
  termId: number;
}) => {
  const skillList = await prisma.personalSkillList.findUnique({
    where: {
      userId_termId: {
        userId: args.userId,
        termId: args.termId,
      },
    },
  });
  return await prisma.personalSkill.create({
    data: {
      personalSkillListId: skillList!.id,
      skillId: 1,
      experienceYear: 0,
    },
  });
};

export const deletePersonalSkill = async (personalSkillId: number) => {
  await prisma.personalSkill.delete({
    where: {
      id: personalSkillId,
    },
  });
};
