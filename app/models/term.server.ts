
import { AnswerItem, Term, User } from "@prisma/client";
import { GetResult } from "@prisma/client/runtime";
import { SerializeFrom, TypedDeferredData, TypedResponse } from "@remix-run/node";
import invariant from "tiny-invariant";
import { prisma } from "~/db.server";

export type { Term } from "@prisma/client";

type GetEvaluationReturnType = ReturnType<typeof getEvaluation>extends Promise<infer T> ? T : never
export type FullEvaluation = GetEvaluationReturnType & {
  evaluationId: number
}
export type FullAskSection = SerializeFrom<
FullEvaluation["askSections"][number]
>
export type FullAnswerSelectionSet = SerializeFrom<
  FullAskSection["answerSelectionSet"]
>
export type FullAskItem = SerializeFrom<
  FullAskSection["askItems"][number] & {
    answerItem?: {
      value: number
      noConfidence: boolean
    }
  }
>


export async function getEvaluation(args : {
  termId: Term["id"], 
  evaluatorId: User["id"],
  evaluateeId: User["id"]
}) {
  console.log("Get term by id", args.termId)
  const term = await prisma.term.findUnique({ 
    where: { id: args.termId },
    include: {
      askSections: {
        include: {
          askItems: {
          },
          answerSelectionSet: {
            include: {
              answerSelections: true
            }
          }
        }
      }
    }
  })

  invariant(term, `Term not found: ${args.termId}`)

  const evaluation = await prisma.evaluation.findUnique({
    where: {
      termId_evaluatorId_evaluateeId : {
        termId: args.termId,
        evaluatorId: args.evaluatorId,
        evaluateeId: args.evaluateeId
      }
    },
    include: {
      answerItems: true
    }
  })
  invariant(evaluation, `Evaluation not found: ${args.termId} ${args.evaluatorId} ${args.evaluateeId}`)

  term.askSections.forEach(section => {
    section.askItems.forEach(item => {
      const answerItem = evaluation.answerItems.find(answerItem => {
        answerItem.askItemId === item.id
      })
      if(answerItem) {
        Object.assign(item, { answerItem: {
          value: answerItem.value,
          noConfidence: answerItem.noConfidence
          }
        })
      }
    })
  })

  return Object.assign(term, {evaluatioId: evaluation.id})
}

export async function updateAnswerItem(args: {
  evaluationId: number,
  askItemId: number,
  value: number,
  noConfidence: boolean
}) {
  const r = await prisma.answerItem.upsert({
    where: {
      askItemId_evaluationId: {
        evaluationId: args.evaluationId,
        askItemId: args.askItemId
      }
    },
    update: {
      value: args.value,
      noConfidence: args.noConfidence
    },
    create: {
      value: args.value,
      noConfidence: args.noConfidence,
      askItemId: args.askItemId,
      evaluationId: args.evaluationId
    }
  })
  return r
}