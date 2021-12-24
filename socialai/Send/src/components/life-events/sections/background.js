import React from "react"
import { SectionTable } from "../sectionTable"
import { TablesContainer } from "./elements"

// We get the data from parent sectionsWithSidebar
export const Background = ({ data }) => {
  return (
    <TablesContainer>
      <SectionTable
        modelName="education"
        sectionName="education"
        withModifyButtons
      />
      <SectionTable
        modelName="experience"
        sectionName="experience"
        withModifyButtons
        forceFields={{
          company: { placeholder: "Enter company name" },
        }}
      />
      <SectionTable
        modelName="licenseCertificate"
        sectionName="certificates"
        withModifyButtons
        forceFields={{
          issuingAuthority: { placeholder: "Enter issuing authority name" },
        }}
      />
      <SectionTable
        modelName="volunteering"
        sectionName="volunteering"
        withModifyButtons
        forceFields={{
          entity: { placeholder: "Enter entity name" },
        }}
      />
    </TablesContainer>
  )
}
