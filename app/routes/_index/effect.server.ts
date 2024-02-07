import { getTermsInTerm } from "~/models/term.server";

export const getTerms = (userId: number) => {
  const terms = getTermsInTerm(userId);

  return terms;
};
