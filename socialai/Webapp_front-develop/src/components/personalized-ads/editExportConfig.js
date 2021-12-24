import { useMutation, useLazyQuery } from "@apollo/react-hooks"
import { navigate } from "@reach/router"
import { Button, message } from "antd"
import React, { useState, useEffect } from "react"
import { UPDATE_EXPORT_CONFIG } from "../../graphql/mutation"
import { GET_EXPORT_CONFIG } from "../../graphql/query"
import {
  Container,
  ContainerNavigation,
  LoadingCircle,
  Error,
} from "../../library/basicComponents"
import { Spacer } from "../../library/utils"
import { Fields } from "./fields"
import { normalizeFilters } from "./helpers"

export const EditExportConfig = ({ id, uri, location }) => {
  const [loadExport, { data: networkData, loading, error }] = useLazyQuery(
    GET_EXPORT_CONFIG,
    {
      fetchPolicy: "network-only",
      errorPolicy: "all",
      variables: {
        id,
      },
    }
  )
  const [updateExportConfig] = useMutation(UPDATE_EXPORT_CONFIG)
  const back = `/${uri.split("/")[1]}`
  const [data, setData] = useState(null)

  useEffect(() => {
    const currentExport = location?.state?.currentExport
    if (!currentExport) {
      return loadExport()
    }
    setData(currentExport)
  }, [])

  useEffect(() => {
    const savedFields = networkData?.exportConfig
    if (savedFields) setData(savedFields)
 }, [networkData])

  const onEdit = async ({ fields, filters }) => {
    const key = "update"
    try {
      message.loading({ content: "Saving...", key, duration: 10 })
      await updateExportConfig({
        variables: { ...fields, id, filters: normalizeFilters(filters) },
      })
      navigate(back)
      message.success({ content: "Saved!", key })
    } catch (e) {
      return message.error({ content: "Error", key })
    }
  }

  return (
    <Container>
      <ContainerNavigation>
        Edit Schedule Export
        <Spacer>
          <Button onClick={() => navigate(back)}>Back</Button>
          <Button type={"primary"} htmlType="submit" form="form">
            Save Edit
          </Button>
        </Spacer>
      </ContainerNavigation>
      {!loading && data && <Fields savedFields={data} onSubmit={onEdit} />}
      {loading && !data && <LoadingCircle />}
      {error && !loading && <Error />}
    </Container>
  )
}
