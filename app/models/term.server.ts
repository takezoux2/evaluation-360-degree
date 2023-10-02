import { Term } from "@prisma/client";
import { prisma } from "~/db.server";
import { StripReturnType } from "./type_util";

export type ListTerm = StripReturnType<typeof getAllTerms> & {
  isInTerm: boolean;
};

/**
 * 有効期限内のTermを取得する
 * @returns
 */
export async function getAllTerms(userId: number) {
  const terms = await prisma.term.findMany({
    orderBy: { startAt: "desc" },
  });
  // 個人延長を取得
  const personalTerms = await prisma.personalTermOverride
    .findMany({
      where: {
        userId,
      },
      orderBy: { endAt: "desc" },
      include: {
        term: true,
      },
    })
    .then((r) =>
      r.map((r) => r.term).filter((t) => !terms.some((t2) => t2.id === t.id))
    );

  const now = new Date();
  return [...terms, ...personalTerms].map((term) => {
    const start = term.startAt.getTime();
    const end = term.endAt.getTime();
    return Object.assign(term, {
      isInTerm: start <= now.getTime() && now.getTime() <= end,
    });
  });
}
/**
 * 指定ユーザーの有効期限内のTermを取得する
 * @param userId
 * @returns
 */
export async function getTermsInTerm(userId: number) {
  const now = new Date();

  const terms = await prisma.term.findMany({
    where: {
      startAt: { lte: now },
      endAt: { gte: now },
    },
    orderBy: { startAt: "desc" },
  });
  // 個人延長を取得
  const personalTerms = await prisma.personalTermOverride
    .findMany({
      where: {
        userId,
        endAt: { gte: now },
      },
      orderBy: { endAt: "desc" },
      include: {
        term: true,
      },
    })
    .then((r) =>
      r.map((r) => r.term).filter((t) => !terms.some((t2) => t2.id === t.id))
    );

  return [...terms, ...personalTerms].map((term) => {
    const start = term.startAt.getTime();
    const end = term.endAt.getTime();
    return Object.assign(term, {
      isInTerm: start <= now.getTime() && now.getTime() <= end,
    });
  });
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
