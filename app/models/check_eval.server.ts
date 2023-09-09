import { prisma } from "~/db.server";

export async function countUpEvaluattorAndEvaluatee() {
  // count evaluation table group by evaluatorId
  const evaluatorCounts = await prisma.evaluation
    .groupBy({
      by: ["evaluatorId"],
      _count: {
        evaluatorId: true,
      },
    })
    .then(
      (list) => new Map(list.map((l) => [l.evaluatorId, l._count.evaluatorId]))
    );
  // count evaluation table group by evaluateeId
  const evaluateeCounts = await prisma.evaluation
    .groupBy({
      by: ["evaluateeId"],
      _count: {
        evaluateeId: true,
      },
    })
    .then(
      (list) => new Map(list.map((l) => [l.evaluateeId, l._count.evaluateeId]))
    );
  // list up users where job is in [Engineer, PdM]
  const users = await prisma.user.findMany();

  return users
    .map((user) => {
      const evaluatorCount = evaluatorCounts.get(user.id) || 0;
      const evaluateeCount = evaluateeCounts.get(user.id) || 0;
      return {
        ...user,
        evaluatorCount,
        evaluateeCount,
      };
    })
    .filter((r) => {
      // 退職済み、かつ、対象がいなければ除外
      return !(r.isRetired && r.evaluatorCount === 0 && r.evaluateeCount === 0);
    })
    .sort((a, b) => {
      // sort by evaluatorCount asc
      if (a.evaluatorCount < b.evaluatorCount) return -1;
      if (a.evaluatorCount > b.evaluatorCount) return 1;
      return 0;
    });
}
