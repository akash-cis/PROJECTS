import React, { useEffect, useState } from "react"
import { useQuery } from "@apollo/react-hooks"
import { GET_CURRENT_USER_COMPANY_USERS } from "../graphql/query"
import UserRoleProtected from "../components/userRoleProtected"
import SettingsNav from "../components/settings/settingsNav"
import Users from "../components/settings/users"
import Teams from "../components/settings/teams"
import UserProfile from "../components/settings/userProfile"
import CompanyProfile from "../components/settings/companyProfile"
import CrmIntegration from "../components/settings/crmIntegration"
import { Container, Content, ContentBody } from "../library/basicComponents"
import ScreenName from "../components/settings/screenName"
import ResponseTemplates from "../components/settings/responseTemplates"
import Notifications from "../components/settings/notifications"
import FAQ from "../components/settings/faq"
import PhoneBots from "../components/admin-dashboard/phoneBots"
import EngagementMessageTemplates from "../components/admin-dashboard/enagementMessageTemplate"
import NudgeSettings from "../components/admin-dashboard/nudgeSettings"

const Settings = () => {
  const [activeTab, setActiveTab] = useState("1")
  const [company, setCompany] = useState(null)
  const { data: userData, refetch: refreshUsers } = useQuery(
    GET_CURRENT_USER_COMPANY_USERS,
    {
      onCompleted: res => {
        setCompany(res.me.company)
      },
    }
  )

  const TabReducer = ({ activeTab, ...props }) => {
    switch (activeTab) {
      case "1":
        return (
          <UserProfile
            userData={userData && userData.me}
            refreshUsers={refreshUsers}
            {...props}
          />
        )
      case "2":
        return <CompanyProfile companyData={company} {...props} />
      case "4":
        return <CrmIntegration companyData={company} {...props} />
      case "5":
        return company ? (
          <UserRoleProtected
            component={Users}
            userRole={"canCreateUsers"}
            refreshIndexUsers={refreshUsers}
            company={company}
            {...props}
          />
        ) : (
          <h1>User doesn't have company set</h1>
        )
      case "6":
        return company ? (
          <UserRoleProtected
            component={Teams}
            users={userData.me.company.users}
            refreshUsers={refreshUsers}
            company={company}
            {...props}
            userRole={"canCreateTeams"}
          />
        ) : (
          <h1>User doesn't have company set</h1>
        )
      case "8":
        return <ScreenName />
      case "9":
        return <ResponseTemplates />
      case "10":
        return <Notifications />
      case "11":
        return <PhoneBots viewOnly={true} company={company} />
      case "12":
        return <FAQ />
      case "13":
        return <EngagementTemplates company={company} />
      case "14":
        return <NudgeSettingView company={company} />

      default:
        return <h1>Coming Soon...</h1>
    }
  }

  return (
    <div style={{ display: "flex" }}>
      <SettingsNav activeTab={activeTab} setActiveTab={setActiveTab} />
      <Container style={{ flexGrow: 1, height: "auto" }}>
        <TabReducer activeTab={activeTab} setActiveTab={setActiveTab} />
      </Container>
    </div>
  )
}

export default Settings

const EngagementTemplates = ({ company }) => {
  return (
    <React.Fragment>
      <Content style={{ margin: 12 }}>
        <ContentBody>
          <EngagementMessageTemplates company={company} showTitle={true} />
        </ContentBody>
      </Content>
    </React.Fragment>
  )
}
const NudgeSettingView = ({ company }) => {
  return (
    <React.Fragment>
      <Content style={{ margin: 12 }}>
        <ContentBody>
          <NudgeSettings company={company} showCloseBtn={true} />
        </ContentBody>
      </Content>
    </React.Fragment>
  )
}
