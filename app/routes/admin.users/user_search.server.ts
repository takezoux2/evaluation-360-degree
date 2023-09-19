import { prisma } from "~/db.server";

export const searchUser = async (
  keywords: string[],
  args: { offset: number; limit: number }
) => {
  const users = await prisma.user.findMany({
    where:
      keywords.length === 0
        ? undefined
        : {
            OR: [
              ...keywords.map((keyword) => ({
                name: { contains: keyword },
              })),
              ...keywords.map((keyword) => ({
                email: { contains: keyword },
              })),
            ],
          },
    skip: args.offset,
    take: args.limit,
  });
  return users;
};

export const getUsers = async (args: { offset: number; limit: number }) => {
  const users = await prisma.user.findMany({
    skip: args.offset,
    take: args.limit,
  });
  return users;
};
