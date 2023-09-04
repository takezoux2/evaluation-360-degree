import { Term } from "@prisma/client";
import { prisma } from "~/db.server";
import { StripReturnType } from "./type_util";

export type ListTerm = StripReturnType<typeof getTerms> & {
  isInTerm: boolean;
};

/**
 * 有効期限内のTermを取得する
 * @returns 
 */
export async function getTerms() {
  const now = new Date();
  return prisma.term
    .findMany({
      where: {
        startAt: { lte: now },
        endAt: { gte: now },
      },
      orderBy: { startAt: "desc" },
    })
    .then((terms) =>
      terms.map((term) => {
        const start = term.startAt.getTime();
        const end = term.endAt.getTime();
        return Object.assign(term, {
          isInTerm: start <= now.getTime() && now.getTime() <= end,
        });
      })
    );
}

export async function getNotEndTerms() {
  const now = new Date();
  return prisma.term
    .findMany({
      where: {
        endAt: { gte: now },
      },
      orderBy: { startAt: "desc" },
    })
    .then((terms) =>
      terms.map((term) => {
        const start = term.startAt.getTime();
        const end = term.endAt.getTime();
        return Object.assign(term, {
          isInTerm: start <= now.getTime() && now.getTime() <= end,
        });
      })
    );
}

export async function getLatestTerms(limit: number = 10) {
  const now = new Date();
  return prisma.term
    .findMany({
      orderBy: { startAt: "desc" },
      take: limit,
    })
    .then((terms) =>
      terms.map((term) => {
        const start = term.startAt.getTime();
        const end = term.endAt.getTime();
        return Object.assign(term, {
          isInTerm: start <= now.getTime() && now.getTime() <= end,
        });
      })
    );
}

export async function getTermById(id: Term["id"]) {
  const now = new Date();
  return prisma.term.findUnique({
    where: { id },
    include: {
      askSections: {
        include: {
          askItems: {
            include: {
              targetJobs: true,
            },
          },
          answerSelectionSet: {
            include: {
              answerSelections: true,
            },
          },
        },
      },
    },
  });
}
