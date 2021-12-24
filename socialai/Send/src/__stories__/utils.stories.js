import React from "react"
import { Spacer } from "../library/utils"
import { Button } from "antd"

export default {
  title: "Utils",
}

/*
 * Add right margin to items, the last item do not have right margin, default = 1rem
 * @prop {String}  size
 */
export const spacer = () => (
  <Spacer size="0.5rem">
    <Button>First</Button>
    <Button>Second</Button>
  </Spacer>
)
