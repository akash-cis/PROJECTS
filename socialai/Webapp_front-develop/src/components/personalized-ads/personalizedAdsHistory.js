import { useMutation } from "@apollo/react-hooks"
import { navigate } from "@reach/router"
import { Button, Table } from "antd"
import React, { useEffect, useState } from "react"
import { DELETE_EXPORT } from "../../graphql/mutation"
import {
  ButtonCustom,
  Container,
  ContainerNavigation,
  Content,
  ContentBody,
  Error,
  IconCustom,
  LoadingCircle,
} from "../../library/basicComponents"
import { ALL } from "../../library/constants"
import { formatDate } from "../../library/helpers"
import { showByTypeName } from "./helpers"
import { useDownloadExport, useExports } from "./hooks"
import ModifyButtons from "../../library/modifyButtons"

const { Column } = Table

export const PersonalizedAdsHistory = ({ uri }) => {
  const { dataSource, error, loading, networkStatus } = useExports()
  const back = `/${uri.split("/")[1]}`
  const [deleteExport] = useMutation(DELETE_EXPORT)
  const [downloadExport] = useDownloadExport()
  const [data, setData] = useState(dataSource || [])

  const deleteAndRemoveFromTable = async ({ variables: { id } }) => {
    await deleteExport({ variables: { id } })
    const newData = data.filter(row => row.id !== id)
    setData(newData)
  }

  useEffect(() => {
    setData(dataSource)
  }, [dataSource])

  return (
    <>
      <Container>
        <ContainerNavigation>
          Exports History
          <div>
            <ButtonCustom onClick={() => navigate(back)}>Back</ButtonCustom>
            <Button onClick={() => navigate("/personalized-ads/run/")}>
              Run Now
            </Button>
            <ButtonCustom
              type={"primary"}
              onClick={() => navigate("/personalized-ads/add/")}
            >
              Schedule Export
              <IconCustom type="plus-circle" />
            </ButtonCustom>
          </div>
        </ContainerNavigation>
        <Content>
          <ContentBody>
            {(loading || networkStatus === 4) && <LoadingCircle />}
            {error && <Error />}
            {!loading && networkStatus !== 4 && !error && (
              <Table dataSource={data} rowKey="id">
                <Column
                  title="Name"
                  key="name"
                  render={({ exportConfig }) =>
                    exportConfig.adHoc ? "Ad Hoc Run" : exportConfig.name
                  }
                />
                <Column
                  title="Created by"
                  key="user"
                  render={({ exportConfig }) =>
                    exportConfig.user.firstName + ' ' + exportConfig.user.lastName
                  }
                />
                <Column
                  title="Email"
                  dataIndex="exportConfig.email"
                  key="email"
                />
                <Column
                  title="Filters"
                  key="filters"
                  render={({ exportConfig }) => showByTypeName(exportConfig.filters)(ALL)}
                />
                <Column
                  title="Date"
                  dataIndex="createdAt"
                  key="createdAt"
                  render={value => formatDate(value)}
                />
                <Column
                  title="Count"
                  dataIndex="count"
                  key="count"
                />
                <Column
                  key="buttons"
                  render={({ id }) => (
                    <ModifyButtons
                      id={id}
                      remove={deleteAndRemoveFromTable}
                      download={downloadExport}
                    />
                  )}
                />
              </Table>
            )}
          </ContentBody>
        </Content>
      </Container>
    </>
  )
}
