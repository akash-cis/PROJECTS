import React from "react"
import { SectionTable } from "../sectionTable"
import { TablesContainer } from "./elements"

// We get the data from parent sectionsWithSidebar
export const Accomplishments = ({ data, fields }) => {
  // const accomplishmentsData = data?.accomplishments
  // const publicationsData = data?.publications
  // const awardsData = data?.awards

  return (
    <TablesContainer>
      <SectionTable
        modelName="accomplishment"
        sectionName="accomplishments"
        withModifyButtons
      />
      <SectionTable
        modelName="publication"
        sectionName="publications"
        withModifyButtons
        forceFields={{
          name: { placeholder: "Enter publication name" },
        }}
      />
      <SectionTable
        modelName="award"
        sectionName="awards"
        withModifyButtons
        forceFields={{
          name: { placeholder: "Enter award name" },
        }}
      />
    </TablesContainer>
  )
}
