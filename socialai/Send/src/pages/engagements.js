import React from "react"
import { EngagementLayout } from "./../components/engagements"
import UserRoleProtected from "./../components/userRoleProtected"
import NoPermissionAlert from "./no-permission"
import { Router } from "@reach/router"

const EngagementsPage = ({ location, authData }) => {
  return (
    <UserRoleProtected
      component={Router}
      userRole={"canViewEngagements"}
      basepath="/engagements"
      defaultComponent={NoPermissionAlert}
    >
      <EngagementLayout location={location} path="/" />
      <EngagementLayout path="/activity-center" />
      <EngagementLayout path="/activity-center/:id" />
    </UserRoleProtected>
  )
}

export default EngagementsPage
