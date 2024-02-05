import invariant from "tiny-invariant";
import { prisma } from "~/db.server";
import { getEssayExamsInTerm } from "~/models/essay_exam.server";
import { getSkillExamsInTerm } from "~/models/exam.server";
import { getTermById, getTermsInTerm, isInTerm } from "~/models/term.server";

export const getTermData = async (userId: number, termId: number) => {
  const term = await getTermById(termId);
  invariant(term, "term not found");
  const inTerm = await isInTerm(userId, termId);
  invariant(inTerm, "not in term");

  const essayExams = await getEssayExamsInTerm(termId);
  const examsInTerm = await getSkillExamsInTerm(userId, termId);

  return {
    term,
    essayExams,
    exams: examsInTerm,
  };
};
