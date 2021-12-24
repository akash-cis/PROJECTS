import React, { useState } from "react"
import { useMutation, useQuery } from "@apollo/react-hooks"
import { GET_ALL_USERS, GET_ALL_ROLES } from "../../graphql/query"
import {
  ADD_USER,
  UPDATE_USER_DISABLED_STATUS,
  UPDATE_USER_DISABLED_COMPANY_STATUS,
  UPDATE_USER,
} from "../../graphql/mutation"
import {
  Button,
  Switch,
  Table,
  Modal,
  Input,
  message,
  Divider,
  Alert,
} from "antd"
import styled from "styled-components"
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
import { Colors } from "../../library/constants"

const RolTitle = styled.div`
  font-size: 13px;
  color: #5e5e5e;
  letter-spacing: 0;
  line-height: 16px;
  padding: 8px 0;
  font-weight: 500;
  text-transform: uppercase;
`

const PermissionList = styled.ul`
  list-style: circle;
  padding-left: 14px;
  font-size: 12px;
  color: ${Colors.medDarkgray};
  & span {
    color: ${Colors.darkGray};
    font-size: 13px;
    font-weight: 500;
  }
`

const Permisions = styled.span`
  font-size: 12px;
  color: ${Colors.medDarkgray};
`
const ContentWrap = styled(Content)`
  @media (max-width: 1024px) {
    width: auto;
    max-width: auto !important;
  }
`

const Users = ({ company, refreshIndexUsers }) => {
  const [pageSize, setPageSize] = useState(5)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [user, setUser] = useState({ companyId: company.id, rolId: null })
  const [formVisible, setFormVisible] = useState(false)

  const { data, refetch: refreshUsers } = useQuery(GET_ALL_USERS, {
    variables: {
      page: page,
      pageSize: pageSize,
      companyId: company.id,
      search: search,
    },
    fetchPolicy: "network-only",
  })

  const { data: roles } = useQuery(GET_ALL_ROLES, {
    variables: { companyId: company.id },
  })

  const [createUser, { data: newUser }] = useMutation(ADD_USER, {
    onCompleted: res => {
      refreshUsers()
      refreshIndexUsers()
    },
  })

  const [updateUserDisabledStatus, response] = useMutation(
    UPDATE_USER_DISABLED_COMPANY_STATUS,
    {
      onCompleted: data => refreshUsers(),
    }
  )

  const [updateUser, { data: updatedUser }] = useMutation(UPDATE_USER, {
    onCompleted: data => {
      refreshUsers()
      refreshIndexUsers()
    },
  })

  const resetUser = () => {
    setUser({ companyId: company.id, roleId: null, role: null })
  }

  const onChangePage = (currentPage, currentPageSize) => {
    setPage(currentPage)
    setPageSize(currentPageSize)
  }

  return (
    <React.Fragment>
      <ContainerNavigation>
        <SettingsSectionTitle>Users & Roles</SettingsSectionTitle>
        <Search>
          <Input
            style={{ marginRight: "8px" }}
            placeholder="search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <Button type={"primary"} onClick={() => setFormVisible(true)}>
            Add a user
            <IconCustom type={"plus-circle"} />
          </Button>
        </Search>
      </ContainerNavigation>
      <ContentWrap>
        <ContentBody>
          {data && data.getUsers && (
            <UsersTable
              users={data.getUsers.data}
              company={company}
              total={data.getUsers.count}
              page={page}
              pageSize={pageSize}
              onChangePage={onChangePage}
              // deleteUser={deleteUser}
              setUser={setUser}
              setFormVisible={setFormVisible}
              updateUserDisabledStatus={updateUserDisabledStatus}
            />
          )}
        </ContentBody>
      </ContentWrap>
      {/* { dataRoles &&  */}
      <ModalUserForm
        formVisible={formVisible}
        setFormVisible={setFormVisible}
        company={company}
        user={user}
        setUser={setUser}
        createUser={createUser}
        updateUser={updateUser}
        resetUser={resetUser}
        roles={roles}
      />
      {/* } */}
    </React.Fragment>
  )
}

export default Users

const ModalUserForm = ({
  formVisible,
  setFormVisible,
  user,
  setUser,
  createUser,
  updateUser,
  resetUser,
  roles,
  company,
}) => {
  const [error, setError] = useState("")
  const updateUserField = (field, value) => {
    setUser(prevState => {
      const newState = { ...prevState }
      newState[field] = value
      return newState
    })
  }

  const submitUser = () => {
    if (validateUserInputs(user, setError)) {
      setError("")
      if (user.id) {
        updateUser({
          variables: {
            userId: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            roleId: user.roleId,
            companyId: company.id,
          },
        })
      } else {
        createUser({ variables: user })
      }
      setFormVisible(false)
      resetUser()
      message.success("User created")
    }
  }

  const hasRole = (roles, role) => {
    const hasSpecificRole = roles.find(x => x[role])
    return hasSpecificRole !== undefined
  }

  const handleActiveToggle = id => {
    setUser(prevState => {
      const newState = { ...prevState }
      newState.roleId = id
      newState.role = { id }
      return newState
    })
  }

  return (
    <Modal
      title={
        <SettingsSectionTitle>
          {user.id ? "Edit User" : "Create User"}
        </SettingsSectionTitle>
      }
      visible={formVisible}
      onOk={() => {
        setFormVisible(false)
        resetUser()
      }}
      onCancel={() => {
        setFormVisible(false)
        resetUser()
      }}
      footer={null}
    >
      {error && (
        <Alert
          message={error}
          type={"error"}
          banner
          style={{ margin: "0 -24px" }}
        />
      )}
      <Label>Email</Label>
      <Input
        disabled={user.id}
        placeholder="Enter a value"
        value={user.email}
        onChange={e => updateUserField("email", e.target.value)}
      />
      <br />
      <br />
      <Label>First Name</Label>
      <Input
        placeholder="Enter a value"
        value={user.firstName}
        onChange={e => updateUserField("firstName", e.target.value)}
      />
      <br />
      <br />
      <Label>Last Name</Label>
      <Input
        placeholder="Enter a value"
        value={user.lastName}
        onChange={e => updateUserField("lastName", e.target.value)}
      />
      <Divider />
      <PermissionsInfo
        hasAutoAnalytics={hasRole(
          roles ? roles.roles : [],
          "canViewAutoAnalytics"
        )}
        hasAdExport={hasRole(roles ? roles.roles : [], "canViewAdExport")}
        hasClm={hasRole(roles ? roles.roles : [], "canViewClm")}
      />
      <RolTitle>ROLES</RolTitle>
      {roles &&
        roles.roles.map(role => (
          <React.Fragment key={role.id}>
            <Switch
              defaultChecked={false}
              checked={user.role && user.role.id === role.id}
              onChange={() => handleActiveToggle(role.id)}
              id={role.id}
            />{" "}
            {role.name} - <Permisions>{parsePermissions(role)}</Permisions>
            <br />
            <br />
          </React.Fragment>
        ))}
      <ActionGroup style={{ justifyContent: "center" }}>
        <ButtonCustom type="primary" onClick={() => submitUser()}>
          {user.id ? "Save changes" : "Create user"}
        </ButtonCustom>
      </ActionGroup>
    </Modal>
  )
}

const validateUserInputs = (user, setError) => {
  let emailValidated = false
  let requirmentsSatisfied = false
  if (
    user.email &&
    user.email.trim() !== "" &&
    user.firstName &&
    user.firstName.trim() !== "" &&
    user.lastName &&
    user.lastName.trim() !== ""
  ) {
    requirmentsSatisfied = true
  } else {
    setError("All fields required")
  }
  if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(user.email)) {
    emailValidated = true
  } else {
    setError("You have entered an invalid email address")
  }
  return emailValidated && requirmentsSatisfied
}

const UsersTable = ({
  users,
  company,
  total,
  page,
  pageSize,
  onChangePage,
  updateUserDisabledStatus,
  setUser,
  setFormVisible,
}) => {
  const { Column } = Table

  const handleActiveToggle = (checked, e) => {
    updateUserDisabledStatus({
      variables: {
        userId: parseInt(e.target.id),
        isDisabled: !checked,
        companyId: parseInt(company.id),
      },
    })
  }

  return (
    <Table
      dataSource={users}
      rowKey={"id"}
      pagination={false}
      pagination={{
        defaultCurrent: page,
        defaultPageSize: pageSize,
        pageSize: pageSize,
        total: total,
        showTotal: (total, range) => `Total: ${total} users`,
        onChange: (page, pageSize) => onChangePage(page, pageSize),
      }}
    >
      {/* <Column title={"ID"} dataIndex={"id"} key={"id"} /> */}
      <Column title={"First Name"} dataIndex={"firstName"} key={"firstName"} />
      <Column title={"Last Name"} dataIndex={"lastName"} key={"lastName"} />
      <Column title={"Email"} dataIndex={"email"} key={"email"} />
      <Column
        title={"Role"}
        dataIndex={"role"}
        key={"role"}
        render={value => (value ? value.name : "None assigned")}
      />
      <Column
        title={"Invitation Status"}
        dataIndex={"status"}
        key={"status"}
        render={status => (status ? status : "Unknown")}
      />
      <Column
        title={"Active"}
        dataIndex={"isDisabled"}
        key={"isDisabled"}
        align={"center"}
        render={(value, record) => {
          let userAccountRecord = record.userAccounts.filter(res => {
            if (res.userId == record.id && res.companyId == record.companyId) {
              return true
            }
          })

          return (
            <Switch
              defaultChecked={
                userAccountRecord[0]?.isDisabled !== null &&
                !userAccountRecord[0]?.isDisabled
              }
              onChange={handleActiveToggle}
              id={record.id}
            />
          )
        }}
      />
      <Column
        align={"center"}
        render={(value, record) => (
          <>
            <TooltipButton
              tooltip="Edit"
              shape="circle"
              onClick={() => {
                setUser(record)
                setFormVisible(true)
              }}
              component={EditIcon}
              alt="Edit"
            />
            {/* <TooltipButton 
              tooltip="Delete" 
              shape="circle" 
              onClick={() => message.warning('Forbidden action')} 
              component={DeleteIcon} alt="Delete"
            /> */}
          </>
        )}
      />
    </Table>
  )
}

const PermissionsInfo = ({ hasAutoAnalytics, hasAdExport, hasClm }) => {
  return (
    <div>
      <RolTitle>Permissions</RolTitle>
      <PermissionList>
        <li>
          <span>Company Admin -</span> Can edit company info
        </li>
        <li>
          <span>Users -</span> Can create/manage users & roles
        </li>
        <li>
          <span>Teams -</span> Can create/ manage teams
        </li>
        <li>
          <span>Prospects -</span> Can view and act on Prospects
        </li>
        {hasAutoAnalytics && (
          <li>
            <span>Auto Analytics -</span> Can view auto analytics
          </li>
        )}
        {hasAdExport && (
          <li>
            <span>Ad Export -</span> Can view personalized ads export
          </li>
        )}
        {hasClm && (
          <>
            <li>
              <span>Life Events -</span> Can view life events
            </li>
            <li>
              <span>Engagements -</span> Can view Engagements
            </li>
          </>
        )}
      </PermissionList>
    </div>
  )
}

const parsePermissions = role => {
  const permissions = {
    canCreateUsers: "Users",
    canCreateTeams: "Teams",
    canViewProspects: "Prospects",
    isCompanyAdmin: "Company Admin",
    canViewAutoAnalytics: "Auto Analytics",
    canViewAdExport: "Personalized Ad Export",
    canViewClm: "Life Events",
    canViewGle: "Global Life Events",
  }
  let permissionString = ""
  Object.entries(role).map(([p, val]) => {
    permissionString +=
      permissions[p] && val === true ? permissions[p] + ", " : ""
  })
  return permissionString
    ? permissionString.substring(0, permissionString.length - 2)
    : "No Permissions"
}
