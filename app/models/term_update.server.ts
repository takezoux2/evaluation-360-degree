import { Term } from "@prisma/client";
import { SerializeFrom } from "@remix-run/node";
import { prisma } from "~/db.server";
import { StripReturnType, UnwrapPromise } from "./type_util";
import * as yaml from "yaml";

import { z } from "zod";
import invariant from "tiny-invariant";
export type SectionType = {
  id?: string;
  label: string;
  questions: (
    | string
    | {
        label: string;
        difficulty: number;
        jobs: string[];
      }
  )[];
  selectionSet: {
    id?: string;
    name?: string;
    selections?: {
      label: string;
      value: string;
    }[];
  };
};
// Use https://transform.tools/typescript-to-zod
const sectionTypeSchema = z.object({
  id: z.string().optional(),
  label: z.string(),
  questions: z.array(
    z.union([
      z.string(),
      z.object({
        label: z.string(),
        difficulty: z.number(),
        jobs: z.array(z.string()),
      }),
    ])
  ),
  selectionSet: z.object({
    id: z.string().optional(),
    name: z.string().optional(),
    selections: z
      .array(
        z.object({
          label: z.string(),
          value: z.string(),
        })
      )
      .optional(),
  }),
});

export const upsertAskSelectionSet = async (
  termId: number,
  args: {
    startAt: Date;
    endAt: Date;
    name: string;
  },
  selectionYaml: string
) => {
  const term = await prisma.term.findUnique({
    where: {
      id: termId,
    },
    include: {
      askSections: true,
    },
  });
  invariant(term, "term not found");
  const sections = yaml.parse(selectionYaml) as SectionType[];
  let index = 0;
  for (const section of sections) {
    const currentSection = term.askSections[index];
    index += 1;
    // Create or Update AnswerSelectionSet
    const answerSelectionSetId = await (async () => {
      if (section.selectionSet?.id) {
        const selectionSet = await prisma.answerSelectionSet.findUnique({
          where: {
            id: Number(section.selectionSet.id),
          },
        });
        if (selectionSet) {
          await prisma.answerSelectionSet.update({
            where: {
              id: selectionSet.id,
            },
            data: {
              name: section.selectionSet.name ?? "Generated",
            },
          });
          return selectionSet.id;
        }
      }
      const gen = await prisma.answerSelectionSet.create({
        data: {
          name: section.selectionSet.name ?? "Generated",
        },
      });
      return gen.id;
    })();
    // Create or Update AnswerSelection
    if (section.selectionSet?.selections) {
      const selections = section.selectionSet.selections;
      for (const selection of selections) {
        const record = await prisma.answerSelection.findFirst({
          where: {
            answerSelectionSetId,
            value: Number(selection.value),
          },
        });
        if (record && record.label !== selection.label) {
          await prisma.answerSelection.update({
            where: {
              id: record.id,
            },
            data: {
              label: selection.label,
            },
          });
        } else if (!record) {
          await prisma.answerSelection.create({
            data: {
              answerSelectionSetId,
              label: selection.label,
              value: Number(selection.value),
            },
          });
        }
      }
    }

    // Create Section
    const sectionRecord = await (async () => {
      if (currentSection) {
        await prisma.askSection.update({
          where: {
            id: currentSection.id,
          },
          data: {
            label: section.label,
            answerSelectionSetId,
          },
        });
        return currentSection;
      } else {
        return await prisma.askSection.create({
          data: {
            termId,
            label: section.label,
            answerSelectionSetId,
          },
        });
      }
    })();

    // Create AskItems
    const currentAsks = await prisma.askItem.findMany({
      where: {
        askSectionId: sectionRecord.id,
      },
    });
    for (
      let i = 0;
      i < Math.min(currentAsks.length, section.questions.length);
      i++
    ) {
      const askText = section.questions[i];
      const ask = currentAsks[i];
      const jobs =
        typeof askText === "string"
          ? []
          : await prisma.job.findMany({
              where: {
                name: {
                  in: askText.jobs,
                },
              },
            });
      await prisma.askItem.update({
        where: {
          id: ask.id,
        },
        data: {
          askText: typeof askText === "string" ? askText : askText.label,
          ordering: i + 1,
          targetJobs: {
            set: jobs.map((j) => ({ id: j.id })),
          },
        },
      });
    }
    if (currentAsks.length > section.questions.length) {
      await prisma.answerItem.deleteMany({
        where: {
          askItemId: {
            in: currentAsks
              .slice(section.questions.length)
              .map((ask) => ask.id),
          },
        },
      });
      await prisma.askItem.deleteMany({
        where: {
          id: {
            in: currentAsks
              .slice(section.questions.length)
              .map((ask) => ask.id),
          },
        },
      });
    } else if (currentAsks.length < section.questions.length) {
      for (let i = currentAsks.length; i < section.questions.length; i++) {
        const askText = section.questions[i];
        const jobs =
          typeof askText === "string"
            ? []
            : await prisma.job.findMany({
                where: {
                  name: {
                    in: askText.jobs,
                  },
                },
              });
        await prisma.askItem.create({
          data: {
            askSectionId: sectionRecord.id,
            askText: typeof askText === "string" ? askText : askText.label,
            ordering: i + 1,
            difficulty: typeof askText === "string" ? 1 : askText.difficulty,
            targetJobs: {
              connect: jobs.map((j) => ({ id: j.id })),
            },
          },
        });
      }
    }

    // Update Term
    await prisma.term.update({
      where: {
        id: termId,
      },
      data: {
        startAt: args.startAt,
        endAt: args.endAt,
        name: args.name,
      },
    });
  }
};
