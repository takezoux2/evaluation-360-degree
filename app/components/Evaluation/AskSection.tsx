import { AnswerSelection, AskItem } from "@prisma/client";
import { useState } from "react";
import { FullAskSection } from "~/models/evaluation.server";
import { AskItemComponent } from "./AskItem";

export const AskSectionComponent = ({
  section,
  evaluationId,
}: {
  evaluationId: number;
  section: FullAskSection;
}) => {
  return (
    <div className="flex flex-col">
      <div>{section.label}</div>
      {section.askItems.map((askItem) => {
        return (
          <AskItemComponent
            key={askItem.id}
            askItem={askItem}
            answerSelectionSet={section.answerSelectionSet}
            evaluationId={evaluationId}
          ></AskItemComponent>
        );
      })}
    </div>
  );
};
