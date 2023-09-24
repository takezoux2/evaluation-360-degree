import { prisma } from "~/db.server";
export const getAnswerSelectionSet = async (answerSelectionSetId: number) => {
  const answerSelectionSet = await prisma.answerSelectionSet.findUnique({
    where: { id: answerSelectionSetId },
  });
  return answerSelectionSet;
};
