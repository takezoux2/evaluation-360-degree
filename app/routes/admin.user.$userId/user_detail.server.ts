import { DateTime } from "luxon";
import invariant from "tiny-invariant";
import { prisma } from "~/db.server";

export const getUser = async (userId: number) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { Job: true, roles: true },
  });
  return user;
};

export const getTerm = async ({
  userId,
  termId,
}: {
  userId: number;
  termId: number;
}) => {
  const term = await prisma.term.findUnique({
    where: { id: termId },
  });
  const termOverride = await prisma.personalTermOverride.findUnique({
    where: {
      userId_termId: {
        userId,
        termId,
      },
    },
  });
  return {
    term,
    termOverride,
  };
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
export const getExamAnswers = async (args: {
  userId: number;
  termId: number;
}) => {
  const exams = await prisma.examination.findMany({
    where: {
      termId: args.termId,
    },
  });
  const examAnswers = await prisma.examAnswer.findMany({
    where: {
      userId: args.userId,
      examinationId: {
        in: exams.map((exam) => exam.id),
      },
    },
    include: {
      examAnswerItem: true,
      examCheatLog: true,
    },
  });
  return exams.map((exam) => {
    return {
      exam,
      answer: examAnswers.find((answer) => answer.examinationId === exam.id),
    };
  });
};

export const deleteEvaluation = async (evaluationId: number) => {
  await prisma.evaluation.delete({
    where: { id: evaluationId },
  });
};
export const extendTermEnd = async (args: {
  userId: number;
  termId: number;
  endAt: DateTime;
}) => {
  console.log("extend term end time until ", args.endAt.toISO());
  await prisma.personalTermOverride.upsert({
    where: {
      userId_termId: {
        userId: args.userId,
        termId: args.termId,
      },
    },
    create: {
      userId: args.userId,
      termId: args.termId,
      endAt: args.endAt.toJSDate(),
    },
    update: {
      endAt: args.endAt.toJSDate(),
    },
  });
};
export const extendExamTime = async (args: {
  userId: number;
  examinationId: number;
  extendMinutes: number;
}) => {
  const examAnswer = await prisma.examAnswer.findUnique({
    where: {
      userId_examinationId: {
        userId: args.userId,
        examinationId: args.examinationId,
      },
    },
  });
  invariant(examAnswer, `Exam answer not found: ${args.examinationId}`);
  const endedAt = DateTime.local().plus({
    minutes: args.extendMinutes,
  });
  console.log("extend exam time until ", endedAt.toISO());
  await prisma.examAnswer.update({
    where: { id: examAnswer.id },
    data: {
      endedAt: endedAt.toJSDate(),
      finishedAt: null,
    },
  });
};
