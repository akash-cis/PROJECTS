import { Router } from "@reach/router"
import React from "react"
import {
  AddExportConfig,
  EditExportConfig,
  PersonalizedAdsHistory,
  PersonalizedAdsList,
  RunExportConfig,
} from "../components/personalized-ads"
import UserRoleProtected from "../components/userRoleProtected"
import NoPermissionAlert from "./no-permission"

const PersonalizedAds = () => {
  return (
    <UserRoleProtected
      component={Router}
      userRole={"canViewAdExport"}
      basepath="/personalized-ads"
      defaultComponent={NoPermissionAlert}
    >
      <PersonalizedAdsList path="/" />
      <PersonalizedAdsHistory path="/history" />
      <AddExportConfig path="/add" />
      <EditExportConfig path="/edit/:id" />
      <RunExportConfig path="/run" />
    </UserRoleProtected>
  )
}

export default PersonalizedAds
