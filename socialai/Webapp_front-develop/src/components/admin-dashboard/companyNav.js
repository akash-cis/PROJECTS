import React from "react"
import styled, { css } from "styled-components"
import Panel from "../../library/panel"
import { Colors } from "../../library/constants"
import PanelHeader from "../../library/panelHeader"
const NavCntr = styled.div`
  width: 300px;
  min-width: 260px;
  height: 100vh;
`

const FixedPanel = styled(Panel)`
  position: fixed;
  width: 240px;
  padding: 0;
`

const NavItem = styled.div`
  width: 100%;
  padding: 8px 16px;
  cursor: ${({ disabled }) => (disabled ? "not-allowed" : "pointer")};
  background-color: ${({ disabled }) =>
    disabled ? Colors.veryLightGray : "inherit"};
  &:hover {
    background-color: ${Colors.lightGray};
  }
  ${props =>
    props.active &&
    css`
      background-color: ${Colors.lightBrandBlue};
      color: ${Colors.primaryBrandBlue};
      &:hover {
        background-color: ${Colors.lightBrandBlue};
      }
    `};
`

const CompanyNav = ({ activeTab, setActiveTab, newCoSetup, companyName }) => {
  const navMenuItems = [
    "Company details",
    "Working Hours",
    "Subscription plan",
    "Company filters",
    "Roles",
    "Users",
    "User filters",
    "Response templates",
    "Manage Phone Bots",
    "Engagement Templates",
    "Manage Nudge Settings",
    "CRM Integration",
  ]
  return (
    <NavCntr>
      <FixedPanel>
        <h3
          style={{
            color: "#00648d",
            marginBottom: "0px",
            backgroundColor: "#E1E4EA",
            padding: "14px",
          }}
        >
          {companyName}
        </h3>
        {navMenuItems.map(item => {
          const disabled =
            newCoSetup &&
            navMenuItems.indexOf(activeTab) < navMenuItems.indexOf(item)
          return (
            <NavItem
              key={item}
              active={activeTab === item}
              onClick={() => !disabled && setActiveTab(item)}
              disabled={disabled}
            >
              {item}
            </NavItem>
          )
        })}
      </FixedPanel>
    </NavCntr>
  )
}

export default CompanyNav
