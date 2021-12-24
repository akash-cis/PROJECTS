import React from "react"
import { SectionTable } from "../sectionTable"
import { TablesContainer } from "./elements"

// We get the data from parent sectionsWithSidebar
export const SkillsAndInterests = ({ data }) => {
  return (
    <TablesContainer>
      <SectionTable
        modelName="skill"
        sectionName="skills"
        withModifyButtons
        forceFields={{
          name: { placeholder: "Enter skill name" },
        }}
      />
      <SectionTable
        modelName="interest"
        sectionName="interests"
        withModifyButtons
        forceFields={{
          name: { placeholder: "Enter interest name" },
        }}
      />
    </TablesContainer>
  )
}
