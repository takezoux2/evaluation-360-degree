import { json, type V2_MetaFunction } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";
import { AskItemComponent } from "~/components/Evaluation/AskItem";
import { AskSectionComponent } from "~/components/Evaluation/AskSection";
import { SectionTab } from "~/components/Evaluation/SectionTab";
import { getEvaluation } from "~/models/term.server";


export const meta: V2_MetaFunction = () => [{ title: "Remix Notes" }];

export const loader = async () => {
  const evaluation = await getEvaluation({
    termId: 1,
    evaluatorId: 1,
    evaluateeId: 2,
  })

  invariant(evaluation, 'evaluation not found')

  return json({evaluation})
}


export default function Index() {
  const {evaluation} = useLoaderData<typeof loader>();

  return (
    <main className="relative min-h-screen bg-white sm:flex sm:items-center sm:justify-center">
      <div className="relative sm:pb-16 sm:pt-8">
        {evaluation.name}
        <SectionTab sections={evaluation.askSections}></SectionTab>
      </div>
    </main>
  );
}
