import {
  ActionArgs,
  json,
  LoaderArgs,
  type V2_MetaFunction,
} from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";
import {
  addExamCheatLog,
  getSkillExam,
  startExamination,
  updateAnswer,
} from "~/models/exam.server";
import { requireUser } from "~/session.server";
import ExamPanel from "~/routes/exam.send-answer/ExamPanel";
import { ExamPageHader } from "~/components/ExamPageHeader";

export const meta: V2_MetaFunction = () => [{ title: "スキルテスト" }];

export const loader = async ({ request, params }: LoaderArgs) => {
  const user = await requireUser(request);
  const examinationId = Number(params.examId);

  const exam = await getSkillExam({
    userId: user.id,
    examinationId,
  });
  invariant(exam, "Exam not found");

  return json({
    user,
    exam,
  });
};

export default function Exam() {
  const { exam, user } = useLoaderData<typeof loader>();
  return (
    <>
      <ExamPageHader
        term={{
          id: exam.termId,
        }}
        user={user}
      />
      <main className="min-h-screen bg-white p-3">
        <ExamPanel exam={exam} />
      </main>
    </>
  );
}
