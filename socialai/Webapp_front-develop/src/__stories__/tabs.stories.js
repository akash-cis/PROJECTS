import React from "react"
import Tabs from "../library/tabs"

export default {
  title: "Tabs",
}

export const tabs = () => <Tabs.Nav>Hola</Tabs.Nav>

export const tabPanel = () => (
  <Tabs.Cntr>
    <Tabs.Nav>Hola</Tabs.Nav>
  </Tabs.Cntr>
)
