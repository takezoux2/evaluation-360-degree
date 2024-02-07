import { prisma } from "~/db.server";

export const getAllSkills = () => {
  return prisma.skill.findMany({});
};

export const upsertSkill = (skillName: string, registeredUserId: number) => {
  return prisma.skill.upsert({
    where: { name: skillName },
    create: { name: skillName, registeredUserId, usedInCompany: false },
    update: {},
  });
};
