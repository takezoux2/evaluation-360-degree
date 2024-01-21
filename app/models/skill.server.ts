import { prisma } from "~/db.server";

export const getAllSkills = () => {
  return prisma.skill.findMany({});
};
