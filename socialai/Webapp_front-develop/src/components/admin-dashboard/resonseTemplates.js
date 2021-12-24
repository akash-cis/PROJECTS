import React, { useEffect, useState } from "react"
import Tabs from "../../library/tabs"
import SelectUserTable from "./selectUserTable"
import { useQuery, useMutation } from "@apollo/react-hooks"
import { GET_COMPANY_USERS } from "../../graphql/query"
import {
  SAVE_RESPONSE_TEMPLATE,
  DELETE_REPONSE_TEMPLATE,
} from "../../graphql/mutation"
import TabPanelHeader from "../../library/tabHeader"
import { Button, Input, Alert, Switch, Table, Icon, message } from "antd"
import styled from "styled-components"
import Typography from "../../library/typography"

const BtnCntr = styled.div`
  margin: 18px auto 0 auto;
  text-align: center;
`

const ToggleGroupCntr = styled.div`
  margin-bottom: 18px;
`

const TableIcon = styled(Icon)`
  margin: 0 4px;
  font-size: 18px;
`

const ResponseTemplates = ({
  company,
  setCompany,
  setActiveTab,
  newCoSetup,
}) => {
  const [selectedUsers, setSelectedUsers] = useState([])
  const [error, setError] = useState("")
  const [userArray, setUserArray] = useState([])
  const { data: userData, refetch: refreshUserData } = useQuery(
    GET_COMPANY_USERS,
    {
      variables: { id: company.id },
      onCompleted: data => {
        const userIds = data.company.userAccounts.map(x => x.user.id)
        setSelectedUsers(userIds)
        const userArray = data.company.userAccounts.map(res => {
          return res.user
        })
        setUserArray(userArray)
      },
    }
  )

  const [saveResponseTemplate, response] = useMutation(SAVE_RESPONSE_TEMPLATE)

  const addResponseTemplate = (responseMessage, isInitialResponse) => {
    selectedUsers.forEach((user, idx) => {
      saveResponseTemplate({
        variables: {
          userId: parseInt(user),
          message: responseMessage,
          isInitialResponse: isInitialResponse,
        },
      }).then(() => {
        if (idx + 1 === selectedUsers.length) {
          refreshUserData()
          message.success("Response template successfully added")
        }
      })
    })
  }

  const ContiniueButton = () =>
    newCoSetup ? (
      <Button
        type={"primary"}
        onClick={() => setActiveTab("Manage Phone Bots")}
      >
        Continue
      </Button>
    ) : (
      <Button onClick={() => setCompany(null)}>Close</Button>
    )

  return (
    <Tabs.Cntr defaultTab={"new"}>
      <TabPanelHeader>
        <div>
          <Tabs.Nav
            name={"new"}
            typography={{ variant: "big", weight: "normal" }}
          >
            New response template
          </Tabs.Nav>
          <Tabs.Nav
            name={"all"}
            typography={{ variant: "big", weight: "normal" }}
          >
            All response templates
          </Tabs.Nav>
        </div>
        <ContiniueButton />
      </TabPanelHeader>
      {error && (
        <Alert
          message={error}
          type={"error"}
          banner
          style={{ margin: "0 -24px" }}
        />
      )}
      <Tabs.Panel name={"new"}>
        {userData && (
          <SelectUserTable
            users={userArray}
            setSelectedUsers={setSelectedUsers}
            selectedUsers={selectedUsers}
            newCoSetup={true}
          />
        )}
        <ResponseForm
          addResponse={addResponseTemplate}
          hasUsersSelected={selectedUsers.length > 0}
          setError={setError}
        />
      </Tabs.Panel>
      <Tabs.Panel name={"all"}>
        <AllResponseTemplates
          userData={userArray}
          setError={setError}
          saveResponseTemplate={saveResponseTemplate}
          refreshUserData={refreshUserData}
        />
      </Tabs.Panel>
    </Tabs.Cntr>
  )
}

export default ResponseTemplates

const AllResponseTemplates = ({
  userData,
  setError,
  saveResponseTemplate,
  refreshUserData,
}) => {
  const [editableResponse, setEditableResponse] = useState(null)

  const updateResponseTemplate = (responseMessage, isInitialResponse) => {
    saveResponseTemplate({
      variables: {
        userId: editableResponse.userId,
        id: editableResponse.id,
        message: responseMessage,
        isInitialResponse: isInitialResponse,
      },
    }).then(() => {
      setEditableResponse(null)
      refreshUserData()
    })
  }

  const [deleteResponseTemplate, response] = useMutation(
    DELETE_REPONSE_TEMPLATE
  )

  const deleteResponse = responseTemplate => {
    deleteResponseTemplate({
      variables: {
        id: responseTemplate.id,
        userId: responseTemplate.userId,
      },
    }).then(() => refreshUserData())
  }

  return (
    <React.Fragment>
      {userData && (
        <UserResponseTemplatesTable
          userData={userData}
          setEditableResponse={setEditableResponse}
          deleteResponse={deleteResponse}
        />
      )}
      {editableResponse && (
        <ResponseForm
          addResponse={updateResponseTemplate}
          hasUsersSelected={true}
          setError={setError}
          editableResponseTemplate={editableResponse}
        />
      )}
    </React.Fragment>
  )
}

const ResponseForm = ({
  addResponse,
  hasUsersSelected,
  setError,
  editableResponseTemplate = null,
}) => {
  const [message, setMessage] = useState(
    editableResponseTemplate ? editableResponseTemplate.message : ""
  )
  const [isInitialMessage, setIsInitialMessage] = useState(
    editableResponseTemplate ? editableResponseTemplate.isInitialResponse : true
  )

  const handleAddClick = () => {
    if (message.trim().length > 0 && hasUsersSelected) {
      addResponse(message, isInitialMessage)
      setMessage("")
      setError("")
    } else if (message.trim().length > 0 && !hasUsersSelected) {
      setError("You must select at least one user to add response template to")
    }
  }

  const handleInitialToggle = checked => {
    setIsInitialMessage(checked)
  }

  useEffect(() => {
    if (editableResponseTemplate) {
      setMessage(editableResponseTemplate.message)
      setIsInitialMessage(editableResponseTemplate.isInitialResponse)
    }
  }, [editableResponseTemplate])

  return (
    <div>
      <ToggleGroupCntr>
        <Typography variant={"small"} weight={"medium"}>
          INITIAL RESPONSE
        </Typography>
        <Switch
          onChange={handleInitialToggle}
          checked={isInitialMessage}
          defaultChecked={isInitialMessage}
        />
      </ToggleGroupCntr>
      <Typography variant={"small"} weight={"medium"}>
        MESSAGE
      </Typography>
      <Input.TextArea
        placeholder={"Type your response template here"}
        rows={6}
        onChange={e => setMessage(e.target.value)}
        defaultValue={message}
        value={message}
      />
      <BtnCntr>
        <Button type={"primary"} onClick={handleAddClick}>
          {editableResponseTemplate
            ? "Update Response Template"
            : "Add to selected users"}
        </Button>
      </BtnCntr>
    </div>
  )
}

const UserResponseTemplatesTable = ({
  userData,
  setEditableResponse,
  deleteResponse,
}) => {
  const { Column } = Table
  return (
    <Table
      dataSource={userData}
      rowKey={"id"}
      expandedRowRender={record => (
        <Table
          dataSource={record.responseTemplates}
          rowKey={"id"}
          showHeader={false}
          pagination={false}
        >
          <Column
            title={"Message"}
            key={"message"}
            dataIndex={"message"}
            render={val =>
              val.length < 100 ? val : val.substring(0, 100) + "..."
            }
          />
          <Column
            title={"Type"}
            key={"isInitialResponse"}
            dataIndex={"isInitialResponse"}
            width={"10%"}
            render={val => (val ? "Initial" : "Any")}
          />
          <Column
            title={"Edit"}
            key={"edit"}
            width={"6%"}
            render={responseRecord => (
              <TableIcon
                type={"edit"}
                onClick={() => {
                  setEditableResponse({
                    userId: record.id,
                    ...responseRecord,
                  })
                }}
              />
            )}
          />
          <Column
            title={"Delete"}
            key={"delete"}
            width={"6%"}
            render={responseRecord => (
              <TableIcon
                type={"delete"}
                onClick={() => {
                  deleteResponse({ userId: record.id, ...responseRecord })
                }}
              />
            )}
          />
        </Table>
      )}
    >
      <Column title={"Name"} key={"fullName"} dataIndex={"fullName"} />
      <Column title={"Email"} key={"email"} dataIndex={"email"} />
      <Column
        title={"Response Templates"}
        key={"responseTemplates"}
        dataIndex={"responseTemplates"}
        align={"center"}
        render={val => val.length}
      />
    </Table>
  )
}
