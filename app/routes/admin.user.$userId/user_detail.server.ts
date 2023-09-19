import { prisma } from "~/db.server";

export const getUser = async (userId: number) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { Job: true, roles: true },
  });
  return user;
};

export const getEvaluatees = async (args: {
  userId: number;
  termId: number;
}) => {
  const evaluations = await prisma.evaluation.findMany({
    where: {
      evaluatorId: args.userId,
      termId: args.termId,
    },
    include: {
      evaluatee: true,
      answerItems: true,
    },
  });
  return evaluations;
};

export const getEvaluators = async (args: {
  userId: number;
  termId: number;
}) => {
  const evaluations = await prisma.evaluation.findMany({
    where: {
      evaluateeId: args.userId,
      termId: args.termId,
    },
    include: {
      evaluator: true,
      answerItems: true,
    },
  });
  return evaluations;
};
