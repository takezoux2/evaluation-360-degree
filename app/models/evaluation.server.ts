import { AnswerItem, Term, User } from "@prisma/client";
import { GetResult } from "@prisma/client/runtime";
import {
  SerializeFrom,
  TypedDeferredData,
  TypedResponse,
} from "@remix-run/node";
import invariant from "tiny-invariant";
import { prisma } from "~/db.server";
import { StripReturnType, UnwrapPromise } from "./type_util";

export type { Term } from "@prisma/client";

type GetEvaluationReturnType = UnwrapPromise<ReturnType<typeof getEvaluation>>;
export type FullEvaluation = GetEvaluationReturnType & {
  evaluationId: number;
};
export type FullAskSection = SerializeFrom<
  FullEvaluation["askSections"][number]
>;
export type FullAnswerSelectionSet = SerializeFrom<
  FullAskSection["answerSelectionSet"]
>;
export type FullAskItem = SerializeFrom<
  FullAskSection["askItems"][number] & {
    answerItem?: {
      value: number;
      noConfidence: boolean;
    };
  }
>;
export type ListEvaluation = StripReturnType<typeof getListEvaluations>;

export async function getListEvaluations(args: {
  termIds: Term["id"][];
  userId: User["id"];
}) {
  const evaluations = await prisma.evaluation
    .findMany({
      where: {
        termId: { in: args.termIds },
        evaluatorId: args.userId,
      },
      include: {
        evaluatee: true,
        answerItems: true,
        term: {
          include: {
            askSections: {
              include: {
                askItems: true,
                answerSelectionSet: {
                  include: {
                    answerSelections: true,
                  },
                },
              },
            },
          },
        },
      },
    })
    .then((evaluations) =>
      evaluations.map((evaluation) => {
        evaluation.term = Object.assign(evaluation.term, {
          evaluationId: evaluation.id,
        });
        evaluation.term.askSections.forEach((section) => {
          section.askItems.forEach((item) => {
            const answerItem = evaluation.answerItems.find((answerItem) => {
              return answerItem.askItemId === item.id;
            });
            if (answerItem) {
              Object.assign(item, {
                answerItem: {
                  value: answerItem.value,
                  noConfidence: answerItem.noConfidence,
                },
              });
            }
          });
        });

        return Object.assign(evaluation, {
          answeredCount: evaluation.answerItems.length,
          totalAnswerCount: evaluation.term.askSections.reduce(
            (sum, section) => {
              return sum + section.askItems.length;
            },
            0
          ),
          isCompleted: false,
        });
      })
    );
  return evaluations;
}

export async function getEvaluation(args: {
  termId: Term["id"];
  evaluatorId: User["id"];
  evaluateeId: User["id"];
}) {
  console.log("Get term by id", args.termId);
  const term = await prisma.term.findUnique({
    where: { id: args.termId },
    include: {
      askSections: {
        include: {
          askItems: {},
          answerSelectionSet: {
            include: {
              answerSelections: true,
            },
          },
        },
      },
    },
  });

  invariant(term, `Term not found: ${args.termId}`);

  const evaluation = await prisma.evaluation.findUnique({
    where: {
      termId_evaluatorId_evaluateeId: {
        termId: args.termId,
        evaluatorId: args.evaluatorId,
        evaluateeId: args.evaluateeId,
      },
    },
    include: {
      answerItems: true,
    },
  });
  invariant(
    evaluation,
    `Evaluation not found: ${args.termId} ${args.evaluatorId} ${args.evaluateeId}`
  );

  term.askSections.forEach((section) => {
    section.askItems.forEach((item) => {
      const answerItem = evaluation.answerItems.find((answerItem) => {
        return answerItem.askItemId === item.id;
      });
      if (answerItem) {
        Object.assign(item, {
          answerItem: {
            value: answerItem.value,
            noConfidence: answerItem.noConfidence,
          },
        });
      }
    });
  });

  return Object.assign(term, { evaluatioId: evaluation.id });
}

export async function updateAnswerItem(args: {
  actionUserId: number;
  evaluationId: number;
  askItemId: number;
  value: number;
  noConfidence: boolean;
}) {
  const evaluation = await prisma.evaluation.findUnique({
    where: { id: args.evaluationId },
  });
  invariant(evaluation, `Evaluation not found: ${args.evaluationId}`);
  invariant(
    evaluation.evaluatorId === args.actionUserId,
    `You are not the evaluator of this evaluation`
  );

  const r = await prisma.answerItem.upsert({
    where: {
      askItemId_evaluationId: {
        evaluationId: args.evaluationId,
        askItemId: args.askItemId,
      },
    },
    update: {
      value: args.value,
      noConfidence: args.noConfidence,
    },
    create: {
      value: args.value,
      noConfidence: args.noConfidence,
      askItemId: args.askItemId,
      evaluationId: args.evaluationId,
    },
  });
  return r;
}

export async function upsertEvaluations(
  termId: number,
  params: {
    evaluator: string;
    evaluatee: string;
  }[],
  autoCreateUser: boolean
) {
  const term = await prisma.term.findUnique({
    where: { id: termId },
  });

  invariant(term, `Term not found: ${termId}`);

  params.forEach((p) => {
    p.evaluator = p.evaluator.trim();
    p.evaluatee = p.evaluatee.trim();
  });

  const userSet = Array.from(
    new Set([
      ...params.map((p) => p.evaluator),
      ...params.map((p) => p.evaluatee),
    ])
  );
  const users = await prisma.user.findMany({
    where: {
      OR: [{ email: { in: userSet } }, { name: { in: userSet } }],
    },
  });
  const userMap = new Map([
    ...(users.map((user) => [user.email, user.id]) as [string, number][]),
    ...(users.map((user) => [user.name, user.id]) as [string, number][]),
  ]);

  const defaultJobId =
    (
      await prisma.job.findUnique({
        where: { name: "Engineer" },
      })
    )?.id ?? 1;

  const events = [] as string[];
  const createNewUser = (maybeEmail: string) => {
    if (maybeEmail.includes("@")) {
      console.log("Create new user: " + maybeEmail);
      events.push("Create new user: " + maybeEmail);
      return prisma.user.create({
        data: {
          email: maybeEmail,
          name: maybeEmail.substring(0, maybeEmail.indexOf("@")),
          jobId: defaultJobId,
        },
      });
    }
  };

  const errors = [] as { row: number; message: string }[];
  let rowIndex = 1;
  for (const param of params) {
    rowIndex += 1;
    const evaluatorId = userMap.get(param.evaluator);
    if (!evaluatorId) {
      const user = autoCreateUser ? await createNewUser(param.evaluator) : null;
      if (user) {
        userMap.set(param.evaluator, user.id);
      } else {
        errors.push({
          row: rowIndex,
          message: `Evaluator not found: ${param.evaluator}`,
        });
        continue;
      }
    }

    const evaluateeId = userMap.get(param.evaluatee);
    if (!evaluateeId) {
      const user = autoCreateUser ? await createNewUser(param.evaluatee) : null;
      if (user) {
        userMap.set(param.evaluatee, user.id);
      } else {
        errors.push({
          row: rowIndex,
          message: `Evaluatee not found: ${param.evaluatee}`,
        });
        continue;
      }
    }

    const p = {
      termId,
      evaluatorId: userMap.get(param.evaluator) ?? 0,
      evaluateeId: userMap.get(param.evaluatee) ?? 0,
    };
    invariant(
      p.evaluateeId !== p.evaluatorId,
      `Evaluator and evaluatee are the same: ${param.evaluatee}`
    );
    await prisma.evaluation.upsert({
      where: {
        termId_evaluatorId_evaluateeId: p,
      },
      update: {},
      create: p,
    });
  }
  return {
    affectedRows: params.length - errors.length,
    errors,
    events,
  };
}

export async function getAllEvaluationsInTerm(termId: Term["id"]) {
  return prisma.evaluation.findMany({
    where: {
      termId,
    },
    include: {
      answerItems: true,
      evaluatee: {
        include: {
          Job: true,
        },
      },
      evaluator: true,
    },
    orderBy: {
      evaluateeId: "asc",
    },
  });
}
