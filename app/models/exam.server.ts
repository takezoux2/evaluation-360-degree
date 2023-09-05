import { prisma } from "~/db.server";
import { getTermsInTerm } from "./term.server";
import invariant from "tiny-invariant";
import { DateTime } from "luxon";
import { StripReturnType } from "./type_util";

export type FullExam = StripReturnType<typeof getNotAnsweredExamsInTerm>;
export type FullExamQuestion = FullExam["exam"]["examQuestions"][number];

export type ExamState = "未回答" | "回答中" | "回答済";

export async function getNotAnsweredExamsInTerm(userId: number) {
  const now = DateTime.local();
  const terms = await getTermsInTerm(userId);
  const exams = await prisma.examination.findMany({
    where: {
      termId: {
        in: terms.map((t) => t.id),
      },
    },
    include: {
      examQuestions: {
        include: {
          examQuestionSelections: {
            select: {
              id: true,
              label: true,
              isCorrectAnswer: false, // 回答情報は返さない。チート対策
            },
          },
        },
      },
    },
  });
  const answers = new Map(
    (
      await prisma.examAnswer.findMany({
        where: {
          userId,
          examinationId: {
            in: exams.map((e) => e.id),
          },
        },
        include: {
          examAnswerItem: true,
        },
      })
    ).map((a) => [a.examinationId, a])
  );
  return exams.map((exam) => {
    const answer = answers.get(exam.id);
    const term = terms.find((t) => t.id === exam.termId)!;

    const examQuestions = exam.examQuestions.map((q) => {
      return Object.assign(q, {
        examQuestionSelectionId: answer?.examAnswerItem.find(
          (a) => a.examQuestionId === q.id
        )?.examQuestionSelectionId,
      });
    });
    const state = answer
      ? answer.endedAt.getTime() < now.toJSDate().getTime()
        ? "回答済"
        : "回答中"
      : "未回答";
    return {
      term: term,
      exam: Object.assign(exam, {
        state,
        examQuestions: examQuestions,
      }),
      answer,
    };
  });
}

/**
 * 試験結果を取得
 * @param termId
 * @returns
 */
export async function getExamScores(termId: number) {
  const exams = await prisma.examination.findMany({
    where: {
      termId,
    },
    include: {
      examQuestions: true,
    },
  });

  return Promise.all(
    exams.map(async (exam) => {
      const answers = await prisma.examAnswer.findMany({
        where: {
          examinationId: exam.id,
        },
        include: {
          user: true,
          examAnswerItem: {
            include: {
              examQuestionSelection: true,
            },
          },
        },
      });
      const fullScore = exam.examQuestions.reduce(
        (acc, cur) => acc + cur.score,
        0
      );
      return [
        exam,
        answers.map((answer) => {
          const score = answer.examAnswerItem.reduce((acc, cur) => {
            const question = exam.examQuestions.find(
              (q) => q.id === cur.examQuestionId
            );
            return (
              acc +
              (cur.examQuestionSelection.isCorrectAnswer
                ? question?.score ?? 0
                : 0)
            );
          }, 0);
          return {
            userId: answer.userId,
            userName: answer.user.name,
            score,
            fullScore,
          };
        }),
      ];
    })
  );
}

export async function startExamination(userId: number, examinationId: number) {
  const now = DateTime.local();
  const exam = await prisma.examination.findUnique({
    where: {
      id: examinationId,
    },
  });
  invariant(exam, `examination:${examinationId} is not found`);
  const answer = await prisma.examAnswer.create({
    data: {
      userId,
      examinationId,
      startedAt: now.toJSDate(),
      endedAt: now.plus({ minute: exam.timeLimitInMinutes }).toJSDate(),
      isCheater: false,
    },
  });
  return answer;
}

export async function updateAnswer({
  userId,
  examAnswerId,
  examQuestionSelectionId,
}: {
  userId: number;
  examAnswerId: number;
  examQuestionSelectionId: number;
}) {
  const now = DateTime.local();
  const examAnswer = await prisma.examAnswer.findUnique({
    where: {
      id: examAnswerId,
    },
  });
  invariant(examAnswer, `User:${userId} haven't start answering yet`);
  invariant(
    examAnswer.userId === userId,
    `User:${userId} can't answer to User:${examAnswer.userId}'s exam`
  );
  invariant(
    now.toMillis() <= examAnswer.endedAt.getTime(),
    `User:${userId} can't answer to Exam:${examAnswer.examinationId} because it's already ended`
  );
  const examQuestionSelection = await prisma.examQuestionSelection.findUnique({
    where: {
      id: examQuestionSelectionId,
    },
    include: {
      examQuestion: {
        select: {
          id: true,
        },
      },
    },
  });
  invariant(
    examQuestionSelection,
    `examQuestionSelection:${examQuestionSelectionId} is not found`
  );
  const examQuestionId = examQuestionSelection.examQuestion.id;

  await prisma.examAnswerItem.upsert({
    where: {
      examAnswerId_examQuestionId: {
        examAnswerId,
        examQuestionId,
      },
    },
    update: {
      examQuestionSelectionId,
    },
    create: {
      examAnswerId,
      examQuestionId,
      examQuestionSelectionId,
    },
  });

  return true;
}

export function addExamCheatLog(params: {
  userId: number;
  examAnswerId: number;
  cheatType: string;
  message: string;
}) {
  return prisma.examCheatLog.create({
    data: {
      examAnswerId: params.examAnswerId,
      cheatType: params.cheatType,
      message: params.message,
    },
  });
}
