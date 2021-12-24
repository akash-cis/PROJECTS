import React from "react"
import Panel from "../library/panel"
import PanelHeader from "../library/panelHeader"

export default {
  title: "Panel",
}

export const panel = () => <Panel>Panel</Panel>

export const panelHeader = () => (
  <Panel>
    <PanelHeader>This is the header</PanelHeader>
    Content
  </Panel>
)
