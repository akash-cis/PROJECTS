import React, { useState } from "react"
import { Avatar } from "antd"
import PropTypes from "prop-types"
import { navigate } from "gatsby"
import {
  ContentBody,
  Content,
  NavItemWithIcon,
  IconCustom,
  CenteredContainer,
  Heighter,
} from "../../../library/basicComponents"
import { capitalize } from "../../../library/helpers"
import { useBasePath } from "../../../hooks"
import { ContentSidebar } from "./elements"

const getIcon = icon => {
  if (typeof icon === "string") {
    return <IconCustom type={icon} />
  }

  return icon
}

const DIVIDER = "divider"
const getChildrenIdentifier = children =>
  children?.props.divider ? DIVIDER : children?.props?.path?.replace("/", "")

const convertReactChildrensToNamedObject = childrens => {
  let namedObject = {}

  for (let children of childrens) {
    namedObject = Object.assign(namedObject, {
      [getChildrenIdentifier(children)]: children,
    })
  }

  return namedObject
}

const SidebarElements = ({
  basePath,
  namedChildrens,
  sidebarElements,
  currentSection,
  onTablick,
  hasTabView,
}) => {
  return sidebarElements.map(name => {
    const children = namedChildrens[name]
    if (children?.props?.divider) {
      return namedChildrens[name]
    }
    const { icon, path, title } = children?.props

    return (
      <NavItemWithIcon
        icon={getIcon(icon)}
        key={path}
        onClick={() => {
          if (hasTabView) {
            onTablick(name)
          } else {
            navigate(`${basePath}${path}`)
          }
        }}
        active={currentSection === name}
      >
        {capitalize(title || name)}
      </NavItemWithIcon>
    )
  })
}

export const SectionsWithSidebar = ({
  children,
  data,
  currentSection,
  hasTabView,
}) => {
  const [currentTab, setTab] = useState(currentSection)
  let childrens = children
  if (!Array.isArray(children)) {
    childrens = [children]
  }

  // TODO: Add image
  let id = data?.id
  let base = useBasePath()
  let basePath = `${base}customers/${id}`
  let namedChildrens = convertReactChildrensToNamedObject(childrens)
  // TODO: Add path collision detection
  const sidebarElements = childrens.map(_children =>
    getChildrenIdentifier(_children)
  )

  const childrenToDisplay = currentTab
    ? namedChildrens[currentTab]
    : namedChildrens[sidebarElements[0]]

  return (
    <Content>
      <ContentSidebar>
        <CenteredContainer noHeight>
          <Avatar size={120} src={"/images/avatar1.png"} />
          <Heighter size="2em" />
        </CenteredContainer>
        <SidebarElements
          basePath={basePath}
          namedChildrens={namedChildrens}
          currentSection={currentTab}
          sidebarElements={sidebarElements}
          hasTabView={hasTabView}
          onTablick={e => setTab(e)}
        />
      </ContentSidebar>
      <ContentBody scroll margin="0">
        {childrenToDisplay &&
          React.cloneElement(childrenToDisplay, {
            data,
            ...childrenToDisplay?.props,
          })}
      </ContentBody>
    </Content>
  )
}

SectionsWithSidebar.propTypes = {
  data: PropTypes.object, // Details data
  currentSection: PropTypes.string, // One of the childrens' names
}
