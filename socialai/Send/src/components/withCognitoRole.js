import React from "react"
import { getCognitoRoles } from "../hooks/utils"
import { navigate } from "gatsby"

const withCognitoRole = (RoleElement, allowedRole) => {
  return class extends React.Component {
    render() {
      const userRoles = getCognitoRoles(
        this.props.authData.signInUserSession.accessToken.payload
      )
      if (userRoles && userRoles.includes(allowedRole)) {
        return <RoleElement />
      } else {
        navigate("/404.html")
        return null
      }
    }
  }
}

export default withCognitoRole
