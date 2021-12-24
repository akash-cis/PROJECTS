import React, { useContext } from "react"
import { UserContext } from "../amplify/authenticator-provider"

const UserRoleProtected = ({ component: Component, defaultComponent : DefaultComponent, userRole=null, userRoles=[], ...rest }) => {
  const { user } = useContext(UserContext)

  let hasRole = false;
  
  if (userRole && user.role) {
    hasRole = user.role[userRole]
  } else if(userRoles.length > 0) {
    hasRole = userRoles.some(x => user.role[x])
  }

  if (user && user.role && hasRole) {
    return <Component {...rest} user={user} />
  } else if (user && user.role?.name !== "default" && DefaultComponent) {
    return <DefaultComponent />
  } else {
    return null;
  }
}

export default UserRoleProtected
