import { Router } from "@reach/router"
import React from "react"
import {
  CustomerList,
  AddCustomer,
  EditCustomer,
  CustomerDetails,
  LifeEvents,
} from "../components/life-events"
import UserRoleProtected from "../components/userRoleProtected"
import NoPermissionAlert from "./no-permission"

const LifeEventsPage = () => {
  return (
    <UserRoleProtected
      component={props => {
        console.log("props.basepath :>> ", props.basepath)
        return (
          <Router basepath={props.basepath}>
            <LifeEvents path="/" />
            {props.user.role.canViewClm && (
              <React.Fragment>
                <CustomerList path="/customers" />
                <AddCustomer path="/customers/add" />
                <EditCustomer path="/custoners/edit/:id" />
                <CustomerDetails path="/customers/:id" />
                <CustomerDetails path="/customers/:id/:section" />
              </React.Fragment>
            )}
            <NoPermissionAlert default />
          </Router>
        )
      }}
      userRoles={["canViewClm", "canViewGle"]}
      basepath="/life-events"
      defaultComponent={NoPermissionAlert}
    />
  )
}

export default LifeEventsPage
