import { Term } from "@prisma/client";
import { SerializeFrom } from "@remix-run/node";
import { prisma } from "~/db.server";
import { StripReturnType, UnwrapPromise } from "./type_util";

export type ListTerm = StripReturnType<typeof getTerms> & {
  isInTerm: boolean;
};

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
