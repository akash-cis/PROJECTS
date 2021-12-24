import React from "react"
import { SectionTable } from "../sectionTable"

// We get the data from parent sectionsWithSidebar
export const Possessions = ({ data }) => {
  return <SectionTable modelName="possession" sectionName="possessions" withModifyButtons />
}
