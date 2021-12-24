import React, { useState } from "react"
import { useQuery, useMutation } from "@apollo/react-hooks"
import { GET_USER_SCREENNAMES, GET_SOURCES } from "../../graphql/query"
import { ADD_SCREEN_NAME } from "../../graphql/mutation"
import {
  ContainerNavigation,
  Content,
  ContentBody,
  IconCustom,
  Label,
  SettingsSectionTitle,
  TooltipButton,
} from "../../library/basicComponents"
import { Button, Input, Table, Modal, AutoComplete, Alert } from "antd"
import EditIcon from "../../../static/icons/EditIcon.svg"

const ScreenName = () => {
  const [formVisible, setFormVisible] = useState(false)
  const [editableScreenName, setEditableScreenName] = useState(null)

  const { data: screenNameData, refetch: refreshScreenNames } = useQuery(
    GET_USER_SCREENNAMES
  )

  const { data: sourcesData } = useQuery(GET_SOURCES)

  const [addScreenName] = useMutation(ADD_SCREEN_NAME)

  const submitScreenName = input => {
    if (editableScreenName) {
      addScreenName({
        variables: {
          id: editableScreenName.id,
          screenName: input.screenName,
        },
      }).then(d => {
        setFormVisible(false)
        setEditableScreenName(null)
        refreshScreenNames()
      })
    } else {
      addScreenName({
        variables: {
          source: input.source,
          screenName: input.screenName,
          sourceUrl: input.sourceUrl,
          sourceId: input.sourceId,
        },
      }).then(d => {
        setFormVisible(false)
        setEditableScreenName(null)
        refreshScreenNames()
      })
    }
  }

  return (
    <React.Fragment>
      <ContainerNavigation>
        <SettingsSectionTitle>Screen names</SettingsSectionTitle>
        <Button
          type={"primary"}
          onClick={() => setFormVisible(true)}
          disabled={!sourcesData}
          loading={!sourcesData}
        >
          Add a screen name <IconCustom type={"plus-circle"} />
        </Button>
      </ContainerNavigation>
      <Content>
        <ContentBody>
          {screenNameData && (
            <ScreenNameTable
              screenNames={screenNameData.me.screenNames}
              setFormVisible={setFormVisible}
              setEditableScreenName={setEditableScreenName}
            />
          )}
        </ContentBody>
      </Content>
      {formVisible && (
        <AddScreenNameForm
          formVisible={formVisible}
          setFormVisible={setFormVisible}
          editableScreenName={editableScreenName}
          setEditableScreenName={setEditableScreenName}
          submitScreenName={submitScreenName}
          sources={sourcesData?.getSources}
        />
      )}
    </React.Fragment>
  )
}

export default ScreenName

const ScreenNameTable = ({
  screenNames,
  setFormVisible,
  setEditableScreenName,
}) => {
  const { Column } = Table
  return (
    <Table
      dataSource={screenNames}
      rowKey={"id"}
      pagination={{ showTotal: total => `Total: ${total} screen names` }}
    >
      <Column title={"Source Name"} dataIndex={"source"} key={"source"} />
      <Column
        title={"Screen Name"}
        dataIndex={"screenName"}
        key={"screenName"}
      />
      <Column title={"URL"} dataIndex={"sourceUrl"} key={"sourceUrl"} />
      <Column
        title={"Edit"}
        dataIndex={"id"}
        key={"id"}
        align={"center"}
        render={(value, record) => (
          <TooltipButton
            tooltip="Edit"
            shape="circle"
            onClick={() => {
              setEditableScreenName(record)
              setFormVisible(true)
            }}
            component={EditIcon}
            alt="Edit"
          />
        )}
      />
    </Table>
  )
}

const AddScreenNameForm = ({
  formVisible,
  setFormVisible,
  editableScreenName,
  setEditableScreenName,
  submitScreenName,
  sources,
}) => {
  const [screenName, setScreenName] = useState(
    editableScreenName ? editableScreenName.screenName : ""
  )
  const [source, setSource] = useState(
    editableScreenName ? editableScreenName.source : ""
  )
  const [sourceUrl, setSourceUrl] = useState(
    editableScreenName ? editableScreenName.sourceUrl : ""
  )
  const [sourceId, setSourceId] = useState(
    editableScreenName ? editableScreenName.sourceId : null
  )
  const [searchResults, setSearchResults] = useState([])
  const [error, setError] = useState("")

  const sourceOptions = sources ? sources.map(x => x.source) : []

  const onSearch = searchText =>
    setSearchResults(
      sourceOptions.filter(source =>
        source.toLowerCase().includes(searchText.toLowerCase())
      )
    )

  const handleAutoSelect = value => {
    const selectedFilter = sources.filter(source => source.source === value)
    setSource(selectedFilter[0].source)
    setSourceUrl(selectedFilter[0].sourceUrl)
    setSourceId(selectedFilter[0].sourceId)
  }

  const handleSubmitForm = () => {
    const inputs = {
      source,
      screenName,
      sourceUrl,
      sourceId,
    }
    if (validateInputs(inputs)) {
      setError("")
      submitScreenName(inputs)
    } else {
      setError("Please make sure all fields are completed")
    }
  }

  return (
    <Modal
      title={editableScreenName ? "Update Screen name" : "Add Screen name"}
      visible={formVisible}
      onCancel={() => {
        setEditableScreenName(null)
        setFormVisible(false)
      }}
      okText={editableScreenName ? "Update" : "Add"}
      onOk={handleSubmitForm}
    >
      {error && <Alert type={"error"} message={error} />}

      {editableScreenName ? (
        <>
          <Label>Source Name</Label>
          <Input
            placeholder={"Enter the name of the source"}
            disabled={!!editableScreenName}
            onChange={e => setSource(e.target.value)}
            defaultValue={
              editableScreenName ? editableScreenName.source : undefined
            }
          />
          <p>{sourceUrl}</p>
        </>
      ) : (
        <>
          <Label>Source</Label>
          <AutoComplete
            dataSource={searchResults}
            onSelect={handleAutoSelect}
            onSearch={onSearch}
            placeholder={"Search for forum or source"}
            style={{ width: "100%" }}
          />
          {sourceUrl ? <p>{sourceUrl}</p> : <br />}
        </>
      )}
      <br />
      <Label>Screen Name</Label>
      <Input
        placeholder={"Enter screen name here"}
        onChange={e => setScreenName(e.target.value)}
        defaultValue={
          editableScreenName ? editableScreenName.screenName : undefined
        }
      />
      <br />
      <br />
    </Modal>
  )
}

const validateInputs = inputs => {
  return (
    inputs.screenName.trim().length > 0 &&
    inputs.source.trim().length > 0 &&
    Number.isInteger(inputs.sourceId)
  )
}
