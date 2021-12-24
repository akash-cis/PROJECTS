import React, { useState } from "react"
import { useQuery, useMutation } from "@apollo/react-hooks"
import { GET_USER_RESPONSE_TEMPLATES } from "../../graphql/query"
import {
  SAVE_RESPONSE_TEMPLATE,
  DELETE_REPONSE_TEMPLATE,
} from "../../graphql/mutation"
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
import RemoveIcon from "../../../static/icons/RemoveIcon.svg"

const ResponseTemplates = () => {
  const [formVisible, setFormVisible] = useState(false)
  const [editableResponseTemplate, setEditableResponseTemplate] = useState(null)

  const {
    data: responseTemplateData,
    refetch: refreshResponseTemplates,
  } = useQuery(GET_USER_RESPONSE_TEMPLATES)

  const [addResponseTemplate] = useMutation(SAVE_RESPONSE_TEMPLATE)

  const [deleteResponseTemplate] = useMutation(DELETE_REPONSE_TEMPLATE)

  const handleDeleteResponseTemplate = responseId => {
    deleteResponseTemplate({
      variables: {
        id: responseId,
      },
    }).then(d => refreshResponseTemplates())
  }

  const submitResponseTemplate = input => {
    if (editableResponseTemplate) {
      addResponseTemplate({
        variables: {
          id: editableResponseTemplate.id,
          message: input.message,
          isInitialResponse: true,
        },
      }).then(d => {
        setFormVisible(false)
        setEditableResponseTemplate(null)
        refreshResponseTemplates()
      })
    } else {
      addResponseTemplate({
        variables: {
          message: input.message,
          isInitialResponse: true,
        },
      }).then(d => {
        setFormVisible(false)
        setEditableResponseTemplate(null)
        refreshResponseTemplates()
      })
    }
  }

  return (
    <React.Fragment>
      <ContainerNavigation>
        <SettingsSectionTitle>Response templates</SettingsSectionTitle>
        <Button type={"primary"} onClick={() => setFormVisible(true)}>
          Add a response template <IconCustom type={"plus-circle"} />
        </Button>
      </ContainerNavigation>
      <Content>
        <ContentBody>
          {responseTemplateData && (
            <ResponseTemplateTable
              responseTemplates={responseTemplateData.me.responseTemplates}
              setFormVisible={setFormVisible}
              setEditableResponseTemplate={setEditableResponseTemplate}
              handleDeleteResponseTemplate={handleDeleteResponseTemplate}
            />
          )}
        </ContentBody>
      </Content>
      {formVisible && (
        <AddResponseTemplateForm
          formVisible={formVisible}
          setFormVisible={setFormVisible}
          editableResponseTemplate={editableResponseTemplate}
          setEditableResponseTemplate={setEditableResponseTemplate}
          submitResponseTemplate={submitResponseTemplate}
        />
      )}
    </React.Fragment>
  )
}

export default ResponseTemplates

const ResponseTemplateTable = ({
  responseTemplates,
  setFormVisible,
  setEditableResponseTemplate,
  handleDeleteResponseTemplate,
}) => {
  const { Column } = Table
  return (
    <Table
      dataSource={responseTemplates}
      rowKey={"id"}
      pagination={{ showTotal: total => `Total: ${total} response templates` }}
    >
      <Column
        title={"Response Message"}
        dataIndex={"message"}
        key={"message"}
      />
      <Column
        title={""}
        dataIndex={"id"}
        key={"id"}
        align={"center"}
        width={128}
        render={(value, record) => (
          <>
            <TooltipButton
              tooltip="Edit"
              shape="circle"
              onClick={() => {
                setEditableResponseTemplate(record)
                setFormVisible(true)
              }}
              component={EditIcon}
              alt="Edit"
            />
            <TooltipButton
              tooltip="Delete"
              shape="circle"
              onClick={() => {
                handleDeleteResponseTemplate(value)
              }}
              component={RemoveIcon}
              alt="Delete"
            />
          </>
        )}
      />
    </Table>
  )
}

const AddResponseTemplateForm = ({
  formVisible,
  setFormVisible,
  editableResponseTemplate,
  setEditableResponseTemplate,
  submitResponseTemplate,
}) => {
  const [message, setMessage] = useState(
    editableResponseTemplate ? editableResponseTemplate.message : ""
  )
  const [error, setError] = useState("")

  const handleSubmitForm = () => {
    const inputs = {
      message,
    }
    if (validateInputs(inputs)) {
      setError("")
      submitResponseTemplate(inputs)
    } else {
      setError("Please enter a message")
    }
  }

  return (
    <Modal
      title={
        editableResponseTemplate
          ? "Update Response template"
          : "Add Response Template"
      }
      visible={formVisible}
      onCancel={() => {
        setEditableResponseTemplate(null)
        setFormVisible(false)
      }}
      okText={editableResponseTemplate ? "Update" : "Add"}
      onOk={handleSubmitForm}
    >
      {error && <Alert type={"error"} message={error} />}

      <Label>Response Message</Label>
      <Input.TextArea
        placeholder={"Enter a response template message"}
        onChange={e => setMessage(e.target.value)}
        rows={5}
        defaultValue={
          editableResponseTemplate
            ? editableResponseTemplate.message
            : undefined
        }
      />
      <br />
      <br />
    </Modal>
  )
}

const validateInputs = inputs => {
  return inputs.message.trim().length > 0
}
