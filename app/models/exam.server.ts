import { prisma } from "~/db.server";
import { getTermsInTerm } from "./term.server";
import invariant from "tiny-invariant";
import { DateTime } from "luxon";
import { StripReturnType } from "./type_util";

export type FullExam = NonNullable<StripReturnType<typeof getSkillExam>>;
export type FullExamQuestion = FullExam["examQuestions"][0];

export type ExamState = "未回答" | "回答中" | "回答済";

export const ImageUrl = process.env.IMAGE_URL ?? "http://example.com";

const join = (path1: string, path2: string) => {
  // Slashを考慮してPathをつなぐ
  if (path1.endsWith("/")) {
    if (path2.startsWith("/")) {
      return path1 + path2.slice(1);
    } else {
      return path1 + path2;
    }
  } else {
    if (path2.startsWith("/")) {
      return path1 + path2;
    } else {
      return path1 + "/" + path2;
    }
  }
};

export const getSkillExamsInTerm = async (userId: number, termId: number) => {
  return (
    await prisma.examination.findMany({
      where: {
        termId,
      },
      include: {
        ExamAnswer: {
          where: {
            userId,
          },
        },
      },
    })
  ).map((exam) => {
    if (exam.ExamAnswer.length > 0) {
      const answer = exam.ExamAnswer[0];
      return Object.assign(exam, {
        answered: true,
        ExamAnswer: exam.ExamAnswer[0],
        state:
          answer.endedAt.getTime() < new Date().getTime() || answer.finishedAt
            ? ("回答済" as ExamState)
            : ("回答中" as ExamState),
      });
    } else {
      return Object.assign(exam, {
        answered: false,
        ExamAnswer: undefined,
        state: "未回答" as ExamState,
      });
    }
  });
};

export const getSkillExam = async (args: {
  userId: number;
  examinationId: number;
}) => {
  const exam = await prisma.examination.findUnique({
    where: {
      id: args.examinationId,
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
      ExamAnswer: {
        include: {
          examAnswerItem: true,
        },
        where: {
          userId: args.userId,
        },
      },
    },
  });

  if (!exam) return null;
  let exam2;
  if (exam.ExamAnswer.length > 0) {
    const answer = exam.ExamAnswer[0];
    exam2 = Object.assign(exam, {
      answered: true,
      examAnswer: exam.ExamAnswer[0],
      state:
        answer.endedAt.getTime() < new Date().getTime() || answer.finishedAt
          ? ("回答済" as ExamState)
          : ("回答中" as ExamState),
    });
  } else {
    exam2 = Object.assign(exam, {
      answered: false,
      examAnswer: null,
      state: "未回答" as ExamState,
    });
  }

  // ImageUrlの生成
  return Object.assign(exam2, {
    examQuestions: exam.examQuestions.map((q) => {
      const imageUrl = q.imagePath
        ? q.imagePath.startsWith("http")
          ? q.imagePath
          : join(ImageUrl, q.imagePath)
        : "";
      return Object.assign(q, {
        examQuestionSelectionId: exam.ExamAnswer[0]?.examAnswerItem.find(
          (a) => a.examQuestionId === q.id
        )?.examQuestionSelectionId,
        // pathをURL化しておく
        imageUrl: imageUrl,
      });
    }),
  });
};

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
        // pathをURL化しておく
        imageUrl: q.imagePath
          ? q.imagePath.startsWith("http")
            ? q.imagePath
            : join(ImageUrl, q.imagePath)
          : "",
      });
    });
    const state = (() => {
      if (!answer) return "未回答";
      if (answer.endedAt.getTime() < now.toJSDate().getTime()) {
        return "回答済";
      }
      if (answer.finishedAt) {
        return "回答済";
      }
      return "回答中";
    })();
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
          user: {
            include: {
              Job: true,
            },
          },
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
      return {
        exam: Object.assign(exam, { fullScore: fullScore }),
        answers: answers.map((answer) => {
          const scores = exam.examQuestions.map((q) => {
            const item = answer.examAnswerItem.find(
              (a) => a.examQuestionId === q.id
            );
            if (!item)
              return {
                score: 0,
                label: "--",
              };
            const score = item.examQuestionSelection.isCorrectAnswer
              ? q.score
              : 0;
            return {
              score,
              label: item.examQuestionSelection.label,
            };
          });
          const totalScore = scores.reduce((acc, cur) => acc + cur.score, 0);
          return {
            user: {
              id: answer.userId,
              name: answer.user.name,
              email: answer.user.email,
              job: answer.user.Job.name,
            },
            totalScore,
            fullScore,
            scores,
          };
        }),
      };
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
  const answerItemCount = await prisma.examAnswerItem.count({
    where: {
      examAnswerId,
    },
  });
  const questionCount = await prisma.examQuestion.count({
    where: {
      examinationId: examAnswer.examinationId,
    },
  });
  if (answerItemCount === questionCount) {
    await prisma.examAnswer.update({
      where: {
        id: examAnswerId,
      },
      data: {
        finishedAt: now.toJSDate(),
      },
    });
  }

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
