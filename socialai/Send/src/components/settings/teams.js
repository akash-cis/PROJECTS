import React, { useState } from "react"
import { useMutation, useQuery } from "@apollo/react-hooks"
import { GET_ALL_TEAMS } from "../../graphql/query"
import { CREATE_TEAM, UPDATE_TEAM, DELETE_TEAM } from "../../graphql/mutation"
import {
  Button,
  Switch,
  Table,
  Modal,
  Tabs,
  Select,
  Input,
  message,
} from "antd"
import {
  ContainerNavigation,
  Content,
  ContentBody,
  IconCustom,
  SettingsSectionTitle,
  ActionGroup,
  ButtonCustom,
  TooltipButton,
  Search,
  Label,
} from "../../library/basicComponents"
import EditIcon from "../../../static/icons/EditIcon.svg"
import DeleteIcon from "../../../static/icons/RemoveIcon.svg"

const { TabPane } = Tabs
const { Option } = Select

const Teams = ({ users, company }) => {
  const [pageSize, setPageSize] = useState(5)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [team, setTeam] = useState({ companyId: company.id, members: [] })
  const [formVisible, setFormVisible] = useState(false)

  const { data, refetch: refreshTeams } = useQuery(GET_ALL_TEAMS, {
    variables: {
      page: page,
      pageSize: pageSize,
      companyId: company.id,
      search: search,
    },
  })

  const [createTeam, { data: newTeam }] = useMutation(CREATE_TEAM, {
    onCompleted: res => refreshTeams(),
  })

  const [updateTeam, { data: updatedTeam }] = useMutation(UPDATE_TEAM, {
    onCompleted: data => refreshTeams(),
  })

  const [deleteTeam, response] = useMutation(DELETE_TEAM, {
    onCompleted: data => refreshTeams(),
  })

  const resetTeam = () => {
    setTeam({ companyId: company.id, members: [] })
  }

  const onChangePage = (currentPage, currentPageSize) => {
    setPage(currentPage)
    setPageSize(currentPageSize)
  }

  return (
    <React.Fragment>
      <ContainerNavigation>
        <SettingsSectionTitle>Manage Teams</SettingsSectionTitle>
        <Search>
          <Input
            style={{ margin: "8px", maxWidth: "300px" }}
            placeholder="search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <Button
            type={"primary"}
            onClick={() => {
              setFormVisible(true)
            }}
          >
            Add a team
            <IconCustom type={"plus-circle"} />
          </Button>
        </Search>
      </ContainerNavigation>
      <Content>
        <ContentBody>
          {data && data.getTeams && (
            <TeamsTable
              teams={data.getTeams.data}
              total={data.getTeams.count}
              page={page}
              pageSize={pageSize}
              onChangePage={onChangePage}
              deleteTeam={deleteTeam}
              setTeam={setTeam}
              setFormVisible={setFormVisible}
            />
          )}
        </ContentBody>
      </Content>
      <ModalTeamForm
        formVisible={formVisible}
        setFormVisible={setFormVisible}
        users={users}
        team={team}
        setTeam={setTeam}
        createTeam={createTeam}
        updateTeam={updateTeam}
        resetTeam={resetTeam}
      />
    </React.Fragment>
  )
}

export default Teams

const ModalTeamForm = ({
  formVisible,
  setFormVisible,
  users,
  team,
  setTeam,
  createTeam,
  updateTeam,
  resetTeam,
}) => {
  const updateTeamField = (field, value) => {
    setTeam(prevState => {
      const newState = { ...prevState }
      newState[field] = value
      // Improve this line
      if (field === "leaderId") {
        newState.leader = { id: value }
      }
      return newState
    })
  }

  const submitTeam = () => {
    const toSaveTeam = { ...team }
    // Improve this line
    toSaveTeam.members.forEach(m => {
      delete m.__typename
      delete m.member
    })
    if (validateTeamInputs(toSaveTeam)) {
      if (toSaveTeam.id) {
        updateTeam({ variables: toSaveTeam })
      } else {
        createTeam({ variables: toSaveTeam })
      }
      setFormVisible(false)
      resetTeam()
      message.success("Team created")
    } else {
      message.error("Invalid fields")
    }
  }

  const { Column } = Table
  const [activePane, setActivePane] = useState("1")

  const handleActiveToggle = (checked, e, id) => {
    let currentMembers = team.members
    if (checked) {
      // add to list
      currentMembers.push({ memberId: id })
    } else {
      // remove from list
      currentMembers = currentMembers.filter(u => u.memberId !== id)
    }

    setTeam(prevState => {
      const newState = { ...prevState }
      newState.members = currentMembers
      return newState
    })
  }

  return (
    <Modal
      title={
        <Tabs
          // defaultActiveKey="1"
          activeKey={activePane}
          onChange={key => setActivePane(key)}
          size="small"
          tabPosition="top"
          animated={false}
        >
          <TabPane
            tab={<SettingsSectionTitle>Team info</SettingsSectionTitle>}
            key="1"
          >
            <Label>Team Name</Label>
            <Input
              placeholder="Enter a value"
              value={team.name}
              onChange={e => updateTeamField("name", e.target.value)}
            />
            <br />
            <br />
            <Label>Team Leader</Label>
            <Select
              style={{ width: "100%" }}
              placeholder="Chose an user"
              value={team.leader && team.leader.id}
              onChange={value => updateTeamField("leaderId", value)}
            >
              {users.map(u => (
                <Option key={u.id} value={u.id}>
                  {u.fullName}
                </Option>
              ))}
            </Select>
            <br />
            <br />
            {/* <ActionGroup style={{ justifyContent: "center" }}>
              <ButtonCustom type="primary" onClick={() => submitTeam()}>
                {team.id ? "Save changes" : "Create team"}
              </ButtonCustom>
            </ActionGroup> */}
            <ActionGroup style={{ justifyContent: "center" }}>
              <ButtonCustom type="primary" onClick={() => setActivePane("2")}>
                {"Next"}
              </ButtonCustom>
            </ActionGroup>
          </TabPane>
          <TabPane
            tab={<SettingsSectionTitle>Members</SettingsSectionTitle>}
            key="2"
          >
            {users && (
              <Table dataSource={users} rowKey={"id"} pagination={false}>
                <Column
                  title={"Name"}
                  dataIndex={"fullName"}
                  key={"fullName"}
                />
                <Column
                  title={"Active"}
                  dataIndex={"isDisabled"}
                  key={"isDisabled"}
                  align={"center"}
                  render={(value, record) => (
                    <>
                      {team.id ? (
                        <Switch
                          checked={
                            team.members.filter(
                              u => u.memberId === parseInt(record.id)
                            ).length > 0
                          }
                          onChange={(checked, e) =>
                            handleActiveToggle(checked, e, parseInt(record.id))
                          }
                          id={record.id}
                        />
                      ) : (
                        <Switch
                          defaultChecked={
                            team.members.filter(
                              u => u.memberId === parseInt(record.id)
                            ).length > 0
                          }
                          onChange={(checked, e) =>
                            handleActiveToggle(checked, e, parseInt(record.id))
                          }
                          id={record.id}
                        />
                      )}
                    </>
                  )}
                />
              </Table>
            )}
            <br />
            <ActionGroup style={{ justifyContent: "center" }}>
              <ButtonCustom type="primary" onClick={() => submitTeam()}>
                {team.id ? "Save changes" : "Create team"}
              </ButtonCustom>
            </ActionGroup>
          </TabPane>
        </Tabs>
      }
      visible={formVisible}
      onOk={() => {
        setFormVisible(false)
        resetTeam()
      }}
      onCancel={() => {
        setFormVisible(false)
        resetTeam()
      }}
      bodyStyle={{ padding: 0 }}
      footer={null}
    ></Modal>
  )
}

const validateTeamInputs = team => {
  return (
    team.name !== "" &&
    team.leaderId !== "" &&
    team.members &&
    team.members.length
  )
}

const TeamsTable = ({
  teams,
  total,
  page,
  pageSize,
  onChangePage,
  deleteTeam,
  setTeam,
  setFormVisible,
}) => {
  const { Column } = Table

  const deleteTeamById = id => {
    deleteTeam({
      variables: { id },
    })
  }

  return (
    <Table
      style={{ overflow: "auto", maxHeight: "85%" }}
      dataSource={teams}
      rowKey={"id"}
      pagination={{
        defaultCurrent: page,
        defaultPageSize: pageSize,
        pageSize: pageSize,
        total: total,
        showTotal: (total, range) => `Total: ${total} teams`,
        onChange: (page, pageSize) => onChangePage(page, pageSize),
      }}
    >
      {/* <Column title={"ID"} dataIndex={"id"} key={"id"} /> */}
      <Column title={"Name"} dataIndex={"name"} key={"name"} />
      <Column
        title={"Leader"}
        dataIndex={"leader.fullName"}
        key={"leader.id"}
      />
      <Column
        title={"Members"}
        dataIndex={"members"}
        key={"members"}
        render={(value, record) => value.length}
      />
      <Column
        title={"Status"}
        dataIndex={"status"}
        key={"status"}
        align={"center"}
      />
      <Column
        align={"center"}
        render={(value, record) => (
          <>
            <TooltipButton
              tooltip="Edit"
              shape="circle"
              onClick={() => {
                setTeam(record)
                setFormVisible(true)
              }}
              component={EditIcon}
              alt="Edit"
            />
            <TooltipButton
              tooltip="Delete"
              shape="circle"
              onClick={() => deleteTeamById(record.id)}
              component={DeleteIcon}
              alt="Delete"
            />
          </>
        )}
      />
    </Table>
  )
}
