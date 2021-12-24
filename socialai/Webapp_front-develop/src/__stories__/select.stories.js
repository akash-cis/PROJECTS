import React from "react"
import SelectDropdown from "../library/select"
import TextInput from "../library/textInput"

export default {
  title: "Select",
}

export const select = () => (
  <SelectDropdown title={"Select a Field"}>
    <option>Option</option>
  </SelectDropdown>
)

export const input = () => <TextInput />
