import { prisma } from "~/db.server";
import { getTermsInTerm } from "./term.server";
import invariant from "tiny-invariant";
import { DateTime } from "luxon";


export async function getNotAnsweredExamsInTerm(userId: number) {
  const terms = await getTermsInTerm(userId)
  const exams = await prisma.examination.findMany({
    where: {
      termId: {
        in: terms.map(t => t.id)
      }
    }
  })
  const answers = new Map((await prisma.examAnswer.findMany({
    where: {
      userId,
      examinationId: {
        in: exams.map(e => e.id)
      }
    }
  })).map(a => [a.examinationId, a]))

  return exams.map(exam => {
    const answer = answers.get(exam.id)
    const term = terms.find(t => t.id === exam.termId)
    return {
      term: term!,
      exam,
      answer
    }
  })
}

export async function getFullExam(userId: number, examinationId: number) {
  const exam = await prisma.examination.findUnique({
    where: {
      id: examinationId
    },
    include: {
      examQuestions: {
        include: {
          examQuestionSelections: true
        }
      }
    }
  })
  invariant(exam, `examination:${examinationId} is not found`)
  const answer = await prisma.examAnswer.findUnique({
    where: {
      userId_examinationId: {
        userId,
        examinationId
      }
    },
    include: {
      examAnswerItem: true
    }
  })
  return {
    exam,
    answer
  }     
}

export async function startExam(userId: number, examinationId: number) {
  const now = DateTime.local()
  const exam = await prisma.examination.findUnique({
    where: {
      id: examinationId
    }
  })
  invariant(exam, `examination:${examinationId} is not found`)
  const answer = await prisma.examAnswer.create({
    data: {
      userId,
      examinationId,
      startedAt: now.toJSDate(),
      endedAt: now.plus({minute: exam.timeLimitInMinutes}).toJSDate()
    }
  })
  return answer
}


export async function updateAnswer(userId: number, examAnswerId: number, examQuestionId: number, examQuestionSelectionId: number) {
  const now = DateTime.local()
  const examAnswer = await prisma.examAnswer.findUnique({
    where: {
      id: examAnswerId
    }
  })
  invariant(examAnswer, `User:${userId} haven't start answering yet`)
  invariant(examAnswer.userId === userId, `User:${userId} can't answer to User:${examAnswer.userId}'s exam`)
  invariant(examAnswer.endedAt.getTime() < now.toMillis(), `User:${userId} can't answer to Exam:${examAnswer.examinationId} because it's already ended`)

  await prisma.examAnswerItem.upsert({
    where: {
      examAnswerId_examQuestionId: {
        examAnswerId,
        examQuestionId
      }
    },
    update: {
      examQuestionSelectionId
    },
    create: {
      examAnswerId,
      examQuestionId,
      examQuestionSelectionId
    }
  })

  return true

}