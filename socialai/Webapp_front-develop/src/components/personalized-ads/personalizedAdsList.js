import { useMutation } from "@apollo/react-hooks"
import { navigate } from "@reach/router"
import { Button, Table } from "antd"
import React, { useEffect, useState } from "react"
import { DELETE_EXPORT_CONFIG } from "../../graphql/mutation"
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
import { ProgressBar } from "../../library/teamLeaderboard/elements"
import { showByTypeName, showFilters } from "./helpers"
import { useExportConfigs } from "./hooks"
import ModifyButtons from "../../library/modifyButtons"

const { Column } = Table

export const PersonalizedAdsList = ({ uri }) => {
  const { dataSource, error, loading, networkStatus } = useExportConfigs()
  const [deleteExportConfig] = useMutation(DELETE_EXPORT_CONFIG)
  const [data, setData] = useState(dataSource || [])

  const deleteAndRemoveFromTable = async ({ variables: { id } }) => {
    await deleteExportConfig({ variables: { id } })
    const newData = data.filter(row => row.id !== id)
    setData(newData)
  }

  const navigateAndSetState = id => {
    const currentExport = data.find(({ id: itemId }) => itemId === id)
    navigate(`/personalized-ads/edit/${id}`, {
      state: { currentExport },
    })
  }

  useEffect(() => {
    setData(dataSource)
  }, [dataSource])

  return (
    <>
      <Container>
        <ContainerNavigation>
          Scheduled Exports
          <div>
            <ButtonCustom
              type={"default"}
              onClick={() => navigate("/personalized-ads/history/")}
            >
              History
            </ButtonCustom>
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
            {dataSource && !loading && networkStatus !== 4 && !error && (
              <Table dataSource={data} rowKey="id">
                <Column title="Name" dataIndex="name" key="name" />
                <Column
                  title="Created by"
                  key="user"
                  render={({ user }) =>
                    user.firstName + ' ' + user.lastName
                  }
                />
                <Column
                  title="Filters"
                  key="filters"
                  render={({ filters }) => showByTypeName(filters)(ALL)}
                />
                <Column title="Email" dataIndex="email" key="email" />
                <Column
                  title="Minimum size"
                  dataIndex="minimumCount"
                  key="minimumCount"
                />
                <Column
                  title="Last Checked Progress"
                  key="progress"
                  render={({ minimumCount, count }) => {
                    return <ProgressBar value={count} total={minimumCount} />
                  }}
                />
                <Column
                  title="Last Exported"
                  dataIndex="lastExported"
                  key="lastExported"
                  render={value =>
                    value ? formatDate(value) : "Not yet exported"
                  }
                />
                <Column
                  key="buttons"
                  render={({ id }) => (
                    <ModifyButtons
                      id={id}
                      remove={deleteAndRemoveFromTable}
                      edit={navigateAndSetState}
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
