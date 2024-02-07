import { EssayExam, User } from "@prisma/client";
import invariant from "tiny-invariant";
import {
  createEssayExamAnswer,
  findEssayExam,
  findEssayExamAnswer,
  upsertEssayQuestionAnswer,
} from "~/models/essay_exam.server";
import { getTermsInTerm, isInTerm } from "~/models/term.server";
import { requireUser } from "~/session.server";

export const getTerms = async (user: User) => {
  return await getTermsInTerm(user.id);
};

export const getEssayExamAnswer = async (args: {
  user: User;
  essayExamId: number;
}) => {
  const essayExam = await findEssayExam(args.essayExamId);
  const essayExamAnswer = await findEssayExamAnswer({
    userId: args.user.id,
    essayExamId: args.essayExamId,
  });
  if (essayExamAnswer) {
    return {
      essayExam,
      essayExamAnswer,
    };
  } else {
    await createEssayExamAnswer({
      userId: args.user.id,
      essayExamId: args.essayExamId,
    });
    return {
      essayExam,
      essayExamAnswer: await findEssayExamAnswer({
        userId: args.user.id,
        essayExamId: args.essayExamId,
      }),
    };
  }
};

export const updateEssayExamAnswers = async (args: {
  essayExamId: number;
  userId: number;
  answers: {
    essayQuestionId: number;
    text: string;
  }[];
}) => {
  const essayExam = await findEssayExam(args.essayExamId);
  invariant(essayExam, "essayExam not found");
  const inTerm = await isInTerm(args.userId, essayExam.termId);
  invariant(inTerm, "not in term");

  const essayExamAnswer = await findEssayExamAnswer({
    userId: args.userId,
    essayExamId: essayExam.id,
  });
  invariant(essayExamAnswer, "essayExamAnswer not found");

  for (const answer of args.answers) {
    console.log(`Upserting answer ${answer.essayQuestionId}`);
    await upsertEssayQuestionAnswer({
      essayExamAnswerId: essayExamAnswer.id,
      essayQuestionId: answer.essayQuestionId,
      text: answer.text,
    });
  }
};
