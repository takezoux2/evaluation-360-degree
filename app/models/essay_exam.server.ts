import { EssayExam } from "@prisma/client";
import { prisma } from "~/db.server";

export const findEssayExam = async (id: number) => {
  const essayExam = await prisma.essayExam.findUnique({
    where: { id },
    include: {
      EssayQuestionSection: {
        include: {
          essayQuestions: true,
        },
      },
    },
  });
  return essayExam;
};

export const findEssayExamAnswer = async (args: {
  userId: number;
  essayExamId: number;
}) => {
  const essayExamAnswer = await prisma.essayExamAnswer.findUnique({
    where: {
      userId_essayExamId: {
        userId: args.userId,
        essayExamId: args.essayExamId,
      },
    },
    include: {
      EssayQuestionAnswer: true,
    },
  });
  return essayExamAnswer;
};
export const createEssayExamAnswer = async (args: {
  userId: number;
  essayExamId: number;
}) => {
  return await prisma.essayExamAnswer.create({
    data: {
      userId: args.userId,
      essayExamId: args.essayExamId,
    },
    include: {
      EssayQuestionAnswer: true,
    },
  });
};

export const upsertEssayQuestionAnswer = async (args: {
  essayExamAnswerId: number;
  essayQuestionId: number;
  text: string;
}) => {
  const essayQuestionAnswer = await prisma.essayQuestionAnswer.upsert({
    where: {
      essayExamAnswerId_essayQuestionId: {
        essayExamAnswerId: args.essayExamAnswerId,
        essayQuestionId: args.essayQuestionId,
      },
    },
    update: {
      text: args.text,
    },
    create: {
      essayExamAnswerId: args.essayExamAnswerId,
      essayQuestionId: args.essayQuestionId,
      text: args.text,
    },
  });
  return essayQuestionAnswer;
};
