import { ActionArgs, json } from "@remix-run/node";
import {
  addExamCheatLog,
  startExamination,
  updateAnswer,
} from "~/models/exam.server";
import { requireUser } from "~/session.server";

type ActionType = "startExam" | "cheat" | "answer";

type StartExamArgs = {
  examinationId: number;
};
type AnswerArgs = {
  examQuestionSelectionId: number;
  examAnswerId: number;
};
type CheatArgs = {
  examAnswerId: number;
  cheatType: string;
  message: string;
};

export async function action({ request }: ActionArgs) {
  const user = await requireUser(request);
  const formData = await request.formData();
  const actionType = formData.get("action") as ActionType;
  if (actionType === "startExam") {
    const args = JSON.parse(formData.get("data") as string) as StartExamArgs;
    const answer = await startExamination(user.id, args.examinationId);
    return json({ action: actionType, message: "Start examination", answer });
  }
  if (actionType === "answer") {
    const args = JSON.parse(formData.get("data") as string) as AnswerArgs;
    await updateAnswer({
      userId: user.id,
      examAnswerId: args.examAnswerId,
      examQuestionSelectionId: args.examQuestionSelectionId,
    });
    return json({ action: actionType, message: "Answer" });
  }
  if (actionType === "cheat") {
    const args = JSON.parse(formData.get("data") as string) as CheatArgs;
    await addExamCheatLog({
      userId: user.id,
      examAnswerId: args.examAnswerId,
      cheatType: args.cheatType,
      message: args.message,
    });
    return json({ action: actionType, message: "Cheat" });
  }
  return json({ action: actionType, message: "Unknown action:" + actionType });
}
