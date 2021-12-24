import { useMutation } from "@apollo/react-hooks"
import { navigate } from "@reach/router"
import { Button, Modal, Icon } from "antd"
import React, { useContext, useState } from "react"
import { UserContext } from "../../amplify/authenticator-provider"
import { CREATE_EXPORT_CONFIG } from "../../graphql/mutation"
import {
  Container,
  ContainerNavigation,
  CenteredContainer,
} from "../../library/basicComponents"
import { displayGraphQLError, usePersistedState } from "../../library/helpers"
import { Spacer } from "../../library/utils"
import { Fields } from "./fields"
import { normalizeFilters } from "./helpers"
import { useDownloadExport } from "./hooks"
import { Colors } from "../../library/constants"

const Banner = ({ id, error, title, iconType, history, download }) => {
  const [downloadExport] = useDownloadExport()

  return (
    <>
      <Icon
        style={{ fontSize: 52, color: Colors.primaryBrandBlue }}
        type={iconType}
      />
      <br />
      <h3 style={{ margin: 10 }}>{title}</h3>
      <br />
      <Spacer>
        <Button
          disabled={!history}
          onClick={() => navigate("/personalized-ads/history")}
        >
          Go to History
        </Button>
        <Button
          type="primary"
          disabled={!download}
          onClick={() => downloadExport({ variables: { id } })}
        >
          Download
        </Button>
      </Spacer>
    </>
  )
}

const RunExportModal = ({ visible, status, onCancel }) => {
  const { loading, error, data } = status
  const id = data?.createExportConfig?.exportConfig?.exports[0]?.id

  return (
    <Modal
      title={false}
      visible={visible}
      onOk={onCancel}
      onCancel={onCancel}
      centered={true}
      footer={null}
    >
      <CenteredContainer minHeight="230px">
        {loading && (
          <Banner
            title="Looking for prospects matching your configuration..."
            iconType="loading"
          />
        )}
        {error && (
          <Banner
            title={displayGraphQLError(error)}
            iconType="exclamation-circle"
            id={id}
            history
          />
        )}
        {data && !loading && !error && (
          <Banner
            title="Your export is available!"
            iconType="check-circle"
            id={id}
            history
            download
          />
        )}
      </CenteredContainer>
    </Modal>
  )
}

export const RunExportConfig = ({ uri }) => {
  const [createExportConfig, status] = useMutation(CREATE_EXPORT_CONFIG)
  const { user } = useContext(UserContext)
  const back = `/${uri.split("/")[1]}`
  const [modal, setModal] = useState(false)
  const [persisted, setPersisted] = usePersistedState("addRun", {})

  const onCreate = async ({ fields, filters }) => {
    // get dates from range
    const {
      range: [startDate, endDate],
    } = fields
    // pass values
    const fieldsWithDates = {
      startDate,
      endDate,
      email: user?.email,
      name: "",
    }
    const data = { ...fieldsWithDates, filters: normalizeFilters(filters) }
    try {
      setModal(true)
      await createExportConfig({
        variables: data,
      })
      setPersisted({})
    } catch (e) {
      setPersisted(data)
    }
  }

  return (
    <Container>
      <ContainerNavigation>
        Ad Hoc Run
        <Spacer>
          <Button onClick={() => navigate(back)}>Back</Button>
          <Button form="form" htmlType="submit" type="primary">
            Run
          </Button>
        </Spacer>
      </ContainerNavigation>
      <Fields savedFields={persisted} range onSubmit={onCreate} />
      <RunExportModal
        visible={modal}
        onCancel={() => setModal(false)}
        status={status}
      />
    </Container>
  )
}
