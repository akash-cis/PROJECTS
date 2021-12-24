import React from "react"
import { Alert } from "antd"
const NoPermissionAlert = () => {
  return (
    <div style={{ marginTop: 10 }}>
      <Alert
        message="Forbidden"
        description="You don't have permission to access this page."
        type="error"
      />
    </div>
  )
}

export default NoPermissionAlert
