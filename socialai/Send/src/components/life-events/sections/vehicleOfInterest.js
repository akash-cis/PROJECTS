import React from "react"
import { SectionTable } from "../sectionTable"

// We get the data from parent sectionsWithSidebar
export const VehicleOfInterest = ({ data }) => {
  return <SectionTable modelName="vehicleOfInterest" sectionName="vehicleOfInterest" withModifyButtons />
}