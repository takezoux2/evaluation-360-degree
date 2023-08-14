import { FullAskSection } from "~/models/evaluation.server";
import { AskSectionComponent } from "./AskSection";
import { useState } from "react";

export const SectionTab = (props: {
  sections: FullAskSection[];
  evaluationId: number;
}) => {
  const [tabIndex, setTabIndex] = useState(0);
  const tabs = props.sections.map((section, index) => {
    const selected =
      "inline-block p-4 text-blue-600 border-b-2 border-blue-600 rounded-t-lg active dark:text-blue-500 dark:border-blue-500";
    const notSelected =
      "inline-block p-4 border-b-2 border-transparent rounded-t-lg hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300";

    return (
      <li className="mr-2" onClick={() => setTabIndex(index)}>
        <button className={tabIndex === index ? selected : notSelected}>
          {section.label}
        </button>
      </li>
    );
  });

  return (
    <div>
      <div className="border-b border-gray-200 text-center text-sm font-medium text-gray-500 dark:border-gray-700 dark:text-gray-400">
        <ul className="-mb-px flex flex-wrap">{tabs}</ul>
      </div>
      <AskSectionComponent
        section={props.sections[tabIndex]}
        evaluationId={props.evaluationId}
      ></AskSectionComponent>
    </div>
  );
};
