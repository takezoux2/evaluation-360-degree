import { AnswerSelection, AnswerSelectionSet, AskItem } from "@prisma/client"
import { useState } from "react"
import { FullAnswerSelectionSet, FullAskItem } from "~/models/term.server"

type Args = {
  askItem: FullAskItem, 
  answerSelectionSet: FullAnswerSelectionSet
}

export const AskItemComponent = ({askItem, answerSelectionSet}: Args) => {
  const [selected, setSelected] = useState(
    askItem.answerItem ? askItem.answerItem.value : -1
  )
  const selections = answerSelectionSet?.answerSelections.map((selection, index) => {
    return <div 
        className={"w-full rounded-sm border border-gray-400 flex items-center py-2 px-6 text-xl" + (selected === index ? " bg-blue-500" : "") }
        onClick={() => {
          askItem.answerItem = { value: index, noConfidence: askItem.answerItem?.noConfidence || false }
          setSelected(index)
        }}>
         {selection.value}
      </div>
  })

  return (
    <div>
      <div>{askItem.askText}</div>
  <div className="items-center w-full text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-lg sm:flex dark:bg-gray-700 dark:border-gray-600 dark:text-white">
      {selections}
  </div>
  </div>)
}
