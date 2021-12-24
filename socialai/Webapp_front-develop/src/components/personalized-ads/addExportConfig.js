import { useMutation } from "@apollo/react-hooks"
import { navigate } from "@reach/router"
import { Button, message } from "antd"
import React from "react"
import { CREATE_EXPORT_CONFIG } from "../../graphql/mutation"
import { Container, ContainerNavigation } from "../../library/basicComponents"
import { Spacer } from "../../library/utils"
import { displayGraphQLError, usePersistedState } from "../../library/helpers"
import { Fields } from "./fields"
import { normalizeFilters } from "./helpers"

export const AddExportConfig = ({ uri }) => {
  const [createExportConfig] = useMutation(CREATE_EXPORT_CONFIG)
  const [persisted, setPersisted] = usePersistedState(
    "personalizedAdsFields",
    {}
  )
  // base path
  const back = `/${uri.split("/")[1]}`

  const onCreate = async ({ fields, filters }) => {
    const data = { ...fields, filters: normalizeFilters(filters) }
    const key = "update"
    message.loading({ content: "Creating...", key, duration: 10 })
    try {
      await createExportConfig({
        variables: data,
      })
      navigate(back)
      setPersisted({})
      message.success({ content: "Export config created", key })
    } catch (e) {
      setPersisted(data)
      return message.error({ content: displayGraphQLError(e), key })
    }
  }

  return (
    <Container>
      <ContainerNavigation>
        Schedule Export
        <Spacer>
          <Button onClick={() => navigate(back)}>Back</Button>
          <Button form="form" htmlType="submit" type="primary">
            Create
          </Button>
        </Spacer>
      </ContainerNavigation>
      <Fields onSubmit={onCreate} savedFields={persisted} />
    </Container>
  )
}
