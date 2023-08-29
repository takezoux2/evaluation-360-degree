import type { Password, User } from "@prisma/client";
import bcrypt from "bcryptjs";

import { prisma } from "~/db.server";
import { StripReturnType } from "./type_util";

export type LoginUser = NonNullable<StripReturnType<typeof getUserById>>;

export async function getUserById(id: User["id"]) {
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      roles: true,
      Job: true,
    },
  });
  if (user) {
    return Object.assign(user, {
      isAdmin: user.roles.some(
        (role) => role.name.toLocaleLowerCase() === "admin"
      ),
    });
  } else {
    return null;
  }
}

export async function getUserByEmail(email: User["email"]) {
  return prisma.user.findUnique({ where: { email } });
}

export async function createUser(email: User["email"], password: string) {
  const hashedPassword = await bcrypt.hash(password, 10);

  return prisma.user.create({
    data: {
      email,
      password: {
        create: {
          hash: hashedPassword,
        },
      },
      name: "",
      jobId: 1,
    },
  });
}

export async function deleteUserByEmail(email: User["email"]) {
  return prisma.user.delete({ where: { email } });
}

export async function verifyLogin(
  email: User["email"],
  password: Password["hash"]
) {
  const userWithPassword = await prisma.user.findUnique({
    where: { email },
    include: {
      password: true,
    },
  });

  if (!userWithPassword || !userWithPassword.password) {
    return null;
  }

  const isValid = await bcrypt.compare(
    password,
    userWithPassword.password.hash
  );

  if (!isValid) {
    return null;
  }

  const { password: _password, ...userWithoutPassword } = userWithPassword;

  return userWithoutPassword;
}

export async function upsertUsers(
  users: {
    email: string;
    name: string;
    job: string;
  }[]
) {
  const jobs = await prisma.job.findMany({
    where: {
      name: {
        in: users.map((user) => user.job),
      },
    },
  });

  const jobMap = new Map(jobs.map((job) => [job.name, job.id]));

  const errors = [] as { email: string; row: number; message: string }[];
  let affectedRows = 0;
  let rowIndex = 1;
  for (const user of users) {
    rowIndex += 1;

    if (!user.email) {
      errors.push({
        email: user.email,
        row: rowIndex,
        message: `Email is required`,
      });
      continue;
    }
    if (!user.name) {
      errors.push({
        email: user.email,
        row: rowIndex,
        message: `Name is required`,
      });
      continue;
    }
    if (!jobMap.has(user.job)) {
      errors.push({
        email: user.email,
        row: rowIndex,
        message: `Unknown job "${user.job}"`,
      });
      continue;
    }

    const jobId = jobMap.get(user.job) ?? 1;
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        jobId,
      },
      create: {
        email: user.email,
        name: user.name,
        jobId,
      },
    });
    affectedRows += 1;
  }
  return { affectedRows, errors };
}
