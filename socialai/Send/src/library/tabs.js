import React, { useState, createContext, useContext } from "react"
import styled from "styled-components"
import { Colors } from "./constants"
import Typography from "./typography"
import { Link } from "gatsby"

const TabStyled = styled.div`
  display: inline-block;
  cursor: pointer;
  margin-right: 20px;
  border-bottom: 2px solid
    ${({ active }) => (active ? Colors.primaryBrandBlue : "transparent")};
  &:hover {
    border-bottom: 2px solid
      ${({ active }) =>
        active ? Colors.darkPrimaryBrandBlue : Colors.primaryBrandBlue};
    font-weight: 400;
  }
  padding: 10px;
`

export const TabContext = createContext({})

const TabCntr = ({ children, defaultTab, ...props }) => {
  const [activeTab, setActiveTab] = useState(defaultTab)
  return (
    <TabContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </TabContext.Provider>
  )
}

export const UnstatedTabNav = ({ active, children, to }) => {
  return (
    <Link to={to}>
      <TabStyled {...{ active }}>
        <Typography
          variant="huge"
          weight="weight"
          color={active ? "darkPrimaryBrandBlue" : "darkGray"}
          inline
        >
          {children}
        </Typography>
      </TabStyled>
    </Link>
  )
}

export const TabNav = ({
  children,
  name,
  typography = { variant: "huge", weight: "normal" },
  variant = "div",
  onClick = () => {},
  ...props
}) => {
  const tabContext = useContext(TabContext)
  const active = tabContext.activeTab === name
  const handleClick = event => {
    tabContext.setActiveTab(name)
    onClick(event)
  }
  return (
    <TabStyled {...{ ...props, active, variant }} onClick={handleClick}>
      <Typography
        variant={typography.variant}
        weight={typography.weight}
        color={active ? "darkPrimaryBrandBlue" : "darkGray"}
        inline
      >
        {children}
      </Typography>
    </TabStyled>
  )
}

const TabPanel = ({ children, name, className = "", ...props }) => {
  const tabsContext = useContext(TabContext)
  const active = tabsContext.activeTab === name
  return (
    active && (
      <div
        css={`
          margin-top: 10px;
        `}
        {...props}
      >
        {children}
      </div>
    )
  )
}

const Tabs = { Cntr: TabCntr, Nav: TabNav, Panel: TabPanel }

export default Tabs
