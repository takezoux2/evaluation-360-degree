import { AnswerSelection, AskItem } from "@prisma/client"
import { useState } from "react"
import { FullAskSection } from "~/models/term.server"
import { AskItemComponent } from "./AskItem"



export const AskSectionComponent = ({section}: {section: FullAskSection}) => {
  
  return (
    <div>
      <div>{section.label}</div>
      {section.askItems.map((askItem) => {
        return <AskItemComponent key={askItem.id} askItem={askItem}></AskItemComponent>
      })
    }
  </div>)
}
