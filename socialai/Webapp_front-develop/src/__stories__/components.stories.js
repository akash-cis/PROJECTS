import React from "react"
import teamsMock from "./mocks/teams"
import TeamPicker from "../library/teamPicker"

export default {
  title: "Components",
}

export const teamPicker = () => <TeamPicker teams={teamsMock} />
