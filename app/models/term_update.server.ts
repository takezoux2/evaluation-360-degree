import { Term } from "@prisma/client";
import { SerializeFrom } from "@remix-run/node";
import { prisma } from "~/db.server";
import { StripReturnType, UnwrapPromise } from "./type_util";
import * as yaml from "yaml";
type SectionType = {
  id?: string;
  label: string;
  questions: string[];
  selectionSet: {
    id?: string;
    name?: string;
    selections?: {
      label: string;
      value: string;
    }[];
  };
};

export const upsertAskSelectionSet = async (
  termId: number,
  args: {
    startAt: Date;
    endAt: Date;
    name: string;
  },
  selectionYaml: string
) => {
  const sections = yaml.parse(selectionYaml) as SectionType[];

  for (const section of sections) {
    // Create or Update AnswerSelectionSet
    const answerSelectionSetId = await (async () => {
      if (section.selectionSet?.id) {
        const answerSelectionSetId = Number(section.selectionSet.id) ?? 0;
        const selectionSet = await prisma.answerSelectionSet.findUnique({
          where: {
            id: Number(section.selectionSet.id),
          },
        });
        if (selectionSet) {
          return selectionSet.id;
        } else {
          const gen = await prisma.answerSelectionSet.create({
            data: {
              id: answerSelectionSetId,
              name: section.selectionSet.name ?? "Generated",
            },
          });
          return gen.id;
        }
      } else {
        return 1;
      }
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
      console.log(section);
      if (section.id) {
        const sec = await prisma.askSection.findFirst({
          where: {
            OR: [{ id: Number(section.id) }, { termId, label: section.label }],
          },
        });
        if (sec) return sec;
      }
      return await prisma.askSection.create({
        data: {
          termId,
          label: section.label,
          answerSelectionSetId,
        },
      });
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
      await prisma.askItem.update({
        where: {
          id: ask.id,
        },
        data: {
          askText: askText,
          ordering: i + 1,
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
        await prisma.askItem.create({
          data: {
            askSectionId: sectionRecord.id,
            askText: askText,
            ordering: i + 1,
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
