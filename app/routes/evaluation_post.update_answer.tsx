import { ActionArgs } from "@remix-run/node";
import { updateAnswerItem } from "~/models/evaluation.server";
import { requireUser } from "~/session.server";

export const action = async ({ request }: ActionArgs) => {
  const formData = await request.formData();

  const user = await requireUser(request);

  const evaluationId = Number(formData.get("evaluationId"));
  const askItemId = Number(formData.get("askItemId"));
  const value = Number(formData.get("value"));
  const noConfidence = formData.get("noConfidence") === "true";
  const actionUserId = user.id;
  console.log("Update:", {
    actionUserId,
    evaluationId,
    askItemId,
    value,
    noConfidence,
  });

  await updateAnswerItem({
    actionUserId,
    evaluationId,
    askItemId,
    value,
    noConfidence,
  });
  return "OK";
};

export default function UpdateValue() {
  console.log("aaaaaaaa");
  return <>aaaa</>;
}
