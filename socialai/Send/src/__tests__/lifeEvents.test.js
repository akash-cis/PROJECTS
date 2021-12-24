import React from "react"
import { render } from "@testing-library/react"
import { AddPreset } from "../components/life-events/lifeEvents/addPreset"

test("Add Preset component", () => {
  const { debug } = render(<AddPreset />)
  debug()
})
