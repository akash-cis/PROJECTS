import React from "react"
import { Fields } from "./fields"
import { Layout } from "./layout"
import { navigate } from "gatsby"
import { Button } from "antd"
import { Spacer } from "../../library/utils"
import { useBasePath } from "../../hooks"

export const EditCustomer = ({ uri }) => {
  const back = useBasePath()

  return (
    <Layout
      title="Customer details"
      buttons={
        <Spacer>
          <Button onClick={() => navigate(back)}>Back</Button>
          <Button form="form" htmlType="submit" type="primary">
            Create
          </Button>
        </Spacer>
      }
    >
      <Fields />
    </Layout>
  )
}
