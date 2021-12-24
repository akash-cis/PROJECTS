import React, { useEffect, useState } from "react"
import styled, { css } from "styled-components"
import FixedPanel from "../../library/fixed-panel"
import { Colors } from "../../library/constants"
import UserRoleProtected from "../userRoleProtected"
import { Divider, Icon, Tooltip } from "antd"
import { SVGIcon } from "../../library/basicComponents"
import ContactIcon from "../../../static/icons/ContactIcon.svg"
import CompanyIcon from "../../../static/icons/CompanyIcon.svg"
import BillingIcon from "../../../static/icons/BillingIcon.svg"
import CRMIcon from "../../../static/icons/CRMIcon.svg"
import UserRolesIcon from "../../../static/icons/UserRolesIcon.svg"
import ManageTeamIcon from "../../../static/icons/ManageTeamIcon.svg"
import SocialMediaIcon from "../../../static/icons/SocialMediaIcon.svg"
import ScreenNameIcon from "../../../static/icons/ScreenNameIcon.svg"
import ResponseIcon from "../../../static/icons/ResponseIcon.svg"
import BellIcon from "../../../static/icons/BellIcon.svg"
import ExploreIcon from "../../../static/icons/ExploreIcon.svg"

const NavCntr = styled.div`
  flex: ${props => (props.closed ? "0 0px" : "0 250px")};
  transition: flex 300ms ease-in-out;
  z-index: 2;
  /*width: 300px;*/
`

const FixedPanelCustom = styled(FixedPanel)`
  position: fixed;
  width: ${props => (props.closed ? "0px" : "220px")};
  height: 100%;
  padding: 0;
  box-shadow: none;
  margin-left: -1em;
  margin-top: -0.5em;
  margin-bottom: 0;
  margin-right: 1em;
  transition: width 300ms ease-in-out;
`

const NavItem = styled.div`
  width: 100%;
  min-width: 220px;
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

const SidebarArrow = styled.div`
  position: absolute;
  padding: 10px 5px;
  top: 40%;
  right: ${props => (props.closed ? "-26px" : "0")};
  background-color: #fff;
  border: 1px solid #eeeef1;
  border-radius: 4px;
  z-index: 1;
  cursor: pointer;
  ${props =>
    props.closed &&
    css`
      background-color: ${Colors.lightBrandBlue};
    `}
`

const SettingsNav = ({ activeTab, setActiveTab }) => {
  const [showSidebar, setShowSideBar] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  const updateMobileResponsive = () => {
    setIsMobile(window.innerWidth < 1120)
  }

  useEffect(() => {
    updateMobileResponsive()
    window.addEventListener("resize", updateMobileResponsive)
    return () => {
      window.removeEventListener("resize", updateMobileResponsive)
    }
  }, [])

  useEffect(() => {
    setShowSideBar(!isMobile)
  }, [isMobile, activeTab])

  return (
    <NavCntr closed={!showSidebar}>
      <FixedPanelCustom closed={!showSidebar}>
        <SidebarArrow
          closed={!showSidebar}
          onClick={() => setShowSideBar(!showSidebar)}
        >
          <Icon type={showSidebar ? "left" : "right"} />
        </SidebarArrow>
        <div style={{ overflow: "hidden" }}>
          <br />
          <NavItem
            key="1"
            active={activeTab === "1"}
            onClick={() => setActiveTab("1")}
          >
            <SVGIcon component={ContactIcon} /> Personal Profile
          </NavItem>
          <NavItem
            key="2"
            active={activeTab === "2"}
            onClick={() => setActiveTab("2")}
          >
            <SVGIcon component={CompanyIcon} /> Company Information
          </NavItem>
          {/*<NavItem*/}
          {/*  key="3"*/}
          {/*  active={activeTab === "3"}*/}
          {/*  onClick={() => setActiveTab("3")}*/}
          {/*>*/}
          {/*  <SVGIcon component={BillingIcon} /> Billing*/}
          {/*</NavItem>*/}
          <NavItem
            key="4"
            active={activeTab === "4"}
            onClick={() => setActiveTab("4")}
          >
            <SVGIcon component={CRMIcon} /> CRM Integration
          </NavItem>
          <Divider />
          <UserRoleProtected
            component={NavItem}
            userRole={"canCreateUsers"}
            key="5"
            active={activeTab === "5"}
            onClick={() => setActiveTab("5")}
          >
            <SVGIcon component={UserRolesIcon} /> User & Roles
          </UserRoleProtected>
          <UserRoleProtected
            component={NavItem}
            userRole={"canCreateTeams"}
            key="6"
            active={activeTab === "6"}
            onClick={() => setActiveTab("6")}
          >
            <SVGIcon component={ManageTeamIcon} /> Manage Teams
          </UserRoleProtected>
          <Divider />
          {/*<NavItem*/}
          {/*  key="7"*/}
          {/*  active={activeTab === "7"}*/}
          {/*  onClick={() => setActiveTab("7")}*/}
          {/*>*/}
          {/*  <SVGIcon component={SocialMediaIcon} /> Social Media*/}
          {/*</NavItem>*/}
          <NavItem
            key="8"
            active={activeTab === "8"}
            onClick={() => setActiveTab("8")}
          >
            <SVGIcon component={ScreenNameIcon} /> Screen Names
          </NavItem>
          <NavItem
            key="9"
            active={activeTab === "9"}
            onClick={() => setActiveTab("9")}
          >
            <SVGIcon component={ResponseIcon} /> Response Templates
          </NavItem>
          <UserRoleProtected
            component={NavItem}
            userRole={"canViewEngagements"}
            key="13"
            active={activeTab === "13"}
            onClick={() => setActiveTab("13")}
          >
            <Icon
              type={"profile"}
              style={{ fontSize: 20, verticalAlign: "-0.25em" }}
            />{" "}
            Engagement Templates
          </UserRoleProtected>
          <Divider />
          <NavItem
            key="10"
            active={activeTab === "10"}
            onClick={() => setActiveTab("10")}
          >
            <SVGIcon component={BellIcon} /> Notifications
          </NavItem>
          <Divider />
          <UserRoleProtected
            component={NavItem}
            userRole={"isCompanyAdmin"}
            key="11"
            active={activeTab === "11"}
            onClick={() => setActiveTab("11")}
          >
            <SVGIcon component={SocialMediaIcon} /> Manage Phone Bots
          </UserRoleProtected>

          <UserRoleProtected
            component={NavItem}
            userRole={"isCompanyAdmin"}
            key="14"
            active={activeTab === "14"}
            onClick={() => setActiveTab("14")}
          >
            <SVGIcon component={ExploreIcon} /> Manage Nudge Settings
          </UserRoleProtected>
          <Divider />

          <NavItem
            key="12"
            active={activeTab === "12"}
            onClick={() => setActiveTab("12")}
          >
            <SVGIcon type="question-circle" /> FAQs
          </NavItem>
        </div>
      </FixedPanelCustom>
    </NavCntr>
  )
}

export default SettingsNav
