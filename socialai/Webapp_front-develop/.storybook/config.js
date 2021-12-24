import React from "react"
import { addDecorator, configure, addParameters } from "@storybook/react"
import "antd/dist/antd.css"

addParameters({
  isFullScreen: false,
  showNav: true,
  showPanel: true,
  panelPosition: "right",
  sortStoriesByKind: true,
  hierarchySeparator: /\/|\./,
  hierarchyRootSeparator: /\|/,
  sidebarAnimations: false,
  enableShortcuts: true,
  isToolshown: true,
})

const storyWrapper = story => <div style={{ margin: "20px 20px" }}>{story()}</div>

addDecorator(storyWrapper)

// automatically import all files ending in *.stories.js
configure(require.context("../src/__stories__", true, /\.stories\.js$/), module)
// Gatsby's Link overrides:
// Gatsby defines a global called ___loader to prevent its method calls from creating console errors you override it here
global.___loader = {
  enqueue: () => {},
  hovering: () => {},
}
// Gatsby internal mocking to prevent unnecessary errors in storybook testing environment
global.__PATH_PREFIX__ = ""
// This is to utilized to override the window.___navigate method Gatsby defines and uses to report what path a Link would be taking us to if it wasn't inside a storybook
window.___navigate = pathname => {
  action("NavigateTo:")(pathname)
}
