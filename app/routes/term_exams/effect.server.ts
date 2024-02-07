import { User } from "@prisma/client";
import { getTermsInTerm } from "~/models/term.server";
import { requireUser } from "~/session.server";

export const getTerms = async (user: User) => {
  return await getTermsInTerm(user.id);
};
