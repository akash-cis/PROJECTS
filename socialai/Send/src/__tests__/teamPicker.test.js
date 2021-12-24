import React from "react"
import { render, fireEvent, waitForElement } from "@testing-library/react"
import TeamPicker, { Bubbles, convertToInitials } from "../library/teamPicker"

test("take name and convert to initials", () => {
  expect(convertToInitials("John Lennon")).toMatch("JL")
  expect(convertToInitials("Ludwig Wittgenstein")).toMatch("LW")
})

const teams = [
  { value: "1", text: "John Lennon" },
  { value: "2", text: "Paul McCartney" },
  { value: "3", text: "Ringo Starr" },
  { value: "4", text: "George Harrison" },
]

test("render bubbles", () => {
  const { container, getByText, debug } = render(<Bubbles selected={teams} />)
  expect(getByText("JL"))
})

test("team picker works correctly", async () => {
  const { debug, container, getByTestId, getByText } = render(
    <TeamPicker team={teams} />
  )

  //unselects all
  fireEvent.mouseOver(getByTestId("picker"))
  await waitForElement(() => fireEvent.click(getByText("Unselect All")))
  expect(getByTestId("picker")).toHaveTextContent("Please select one or more")

  // select one
  fireEvent.mouseOver(getByTestId("picker"))
  await waitForElement(() => fireEvent.click(getByText("John Lennon")))
  expect(getByTestId("picker")).toHaveTextContent("JL")

  // // selects all
  fireEvent.mouseOver(getByTestId("picker"))
  await waitForElement(() => fireEvent.click(getByText("Select all")))
  expect(getByTestId("picker")).toHaveTextContent("All of the team")
})

test("render plus sign when is more than max names", () => {
  const { getByTestId } = render(<TeamPicker team={teams} />)

  expect(getByTestId("picker")).toHaveTextContent("+")
})
