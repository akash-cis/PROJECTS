import React, { useEffect, useRef, useState } from "react"
import PanelHeader from "../../library/panelHeader"
import UserForm from "./userForm"
import { useMutation, useQuery, useLazyQuery } from "@apollo/react-hooks"
import { GET_COMPANY_USERS, ROLES, GET_USER_BY_ID } from "../../graphql/query"
import {
  ADD_USER,
  UPDATE_USER,
  UPDATE_USER_DISABLED_COMPANY_STATUS,
  RESEND_INVITE,
  UPDATE_USER_ROLES,
  ADD_USER_ACCOUNT,
} from "../../graphql/mutation"
import {
  Button,
  Switch,
  Table,
  Modal,
  Icon,
  Select,
  message,
  Alert,
} from "antd"
import TextInput from "../../library/textInput"
import styled from "styled-components"
import Typography from "../../library/typography"
import PhoneInput from "react-phone-number-input"
import "react-phone-number-input/style.css"
import { Separators, Colors } from "../../library/constants"
import { formatPhoneNumber } from "react-phone-number-input"
import isUndefined from "lodash/isUndefined"
const SelectCntr = styled.div`
  padding: 16px 10px;
`
const PhoneDiv = styled.div`
  padding: 8px 0;
  padding-left: 5px;
  input {
    border: ${Separators("thin", "lightGray")};
    width: 100%;
    padding: 10px 12px;
    border-radius: 4px;
    &:hover {
      border-color: ${Colors.gray};
    }
    &:focus {
      outline: none;
      border-color: ${Colors.primaryBrandBlue};
    }
    &:disabled {
      background-color: ${Colors.disabledGray};
      cursor: not-allowed;
    }
    &::placeholder {
      color: ${Colors.gray};
    }
  }
`

const Users = ({ company, setCompany, setActiveTab, newCoSetup }) => {
  const [editableUser, setEditableUser] = useState(null)
  const [userEmail, setUserEmail] = useState(null)
  const [newUserStatus, setNewUserStatus] = useState(false)
  const { data: userData, refetch: refreshUsers } = useQuery(
    GET_COMPANY_USERS,
    {
      variables: { id: company.id },
    }
  )

  const [createUser, { data: newUser }] = useMutation(ADD_USER, {
    onCompleted: res => refreshUsers(),
  })
  const [addUserAccount, addUserAccountResponse] = useMutation(
    ADD_USER_ACCOUNT,
    {
      onCompleted: res => refreshUsers(),
    }
  )
  const [updateUserDisabledStatus, response] = useMutation(
    UPDATE_USER_DISABLED_COMPANY_STATUS,
    {
      onCompleted: data => refreshUsers(),
    }
  )

  const { data: rolesData } = useQuery(ROLES, {
    variables: { companyId: company.id },
  })

  const [resendInvite] = useMutation(RESEND_INVITE)
  function setUserFormEmail(email) {
    setUserEmail(email)
  }
  return (
    <React.Fragment>
      <PanelHeader title={"Users"}>
        {!newCoSetup ? (
          <Button onClick={() => setCompany(null)}>Close</Button>
        ) : (
          <Button type={"primary"} onClick={() => setActiveTab("User filters")}>
            Continue
          </Button>
        )}
      </PanelHeader>
      <UserForm
        createUser={createUser}
        company={company}
        rolesData={rolesData}
        //userDataByEmail={userDataByEmail}
        setUserFormEmail={setUserFormEmail}
        //newUserStatus={newUserStatus}
        addUserAccount={addUserAccount}
      />
      <div>
        {userData && (
          <UsersTable
            company={company}
            users={userData}
            newCoSetup={newCoSetup}
            updateUserDisabledStatus={updateUserDisabledStatus}
            setEditableUser={setEditableUser}
            resendInvite={resendInvite}
          />
        )}
      </div>
      <UpdateUserForm
        company={company}
        user={editableUser}
        rolesData={rolesData}
        setEditableUser={setEditableUser}
        refreshUsers={refreshUsers}
      />
    </React.Fragment>
  )
}

export default Users

const UsersTable = ({
  company,
  users,
  newCoSetup,
  updateUserDisabledStatus,
  setEditableUser,
  resendInvite,
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

  const userArray = users.company.userAccounts.map(res => {
    res.user.isDisabled = res.isDisabled
    return res.user
  })
  console.log(`userArray`, userArray)
  return (
    <Table dataSource={userArray} rowKey={"id"} pagination={false}>
      <Column
        title={"Name"}
        dataIndex={"fullName"}
        key={"fullName"}
        defaultSortOrder={"ascend"}
        sorter={(a, b) => a.firstName.localeCompare(b.firstName)}
      />
      <Column
        title={"Phone"}
        dataIndex={"phone"}
        key={"phone"}
        render={(text, record) => {
          return record?.phone ? formatPhoneNumber(record?.phone) : ""
        }}
      />
      <Column title={"Email"} dataIndex={"email"} key={"email"} />
      <Column
        title={"Created At"}
        dataIndex={"dateCreated"}
        key={"dateCreated"}
        render={value => {
          const d = new Date(value)
          return value
            ? `${d.getMonth() + 1}.${d.getDate()}.${d.getFullYear()}`
            : "null"
        }}
      />
      <Column
        title={"Role"}
        dataIndex={"role"}
        key={"role"}
        render={(status, record) => {
          let thisCompanyId = users.company.id
          // var thisUserId=record.id
          const thisUserObj = record.userRoles.filter(res => {
            if (res.companyId == thisCompanyId) {
              return res.role.name
            } else {
              return false
            }
          })

          //var roleName='--'

          if (typeof thisUserObj[0] === "undefined") {
            return "--"
          } else {
            return thisUserObj[0].role.name
          }
        }}
      />
      <Column
        title={"Status"}
        dataIndex={"status"}
        key={"Status"}
        render={status => (status ? status : "Null")}
      />
      <Column
        title={"Resend Invite"}
        dataIndex={"status"}
        key={"resend"}
        render={(status, record) => (
          <Button
            size={"small"}
            disabled={status === "Activated"}
            onClick={() => {
              resendInvite({ variables: { userId: record.id } }).then(() => {
                message.success("Invite Sent")
              })
            }}
          >
            Resend
          </Button>
        )}
      />
      <Column
        title={"Edit"}
        key={"edit"}
        render={(text, record) => (
          <Icon type={"edit"} onClick={() => setEditableUser(record)} />
        )}
      />
      {!newCoSetup && (
        <Column
          title={"Active"}
          dataIndex={"isDisabled"}
          key={"isDisabled"}
          align={"center"}
          render={(value, record) => (
            <Switch
              defaultChecked={value !== null && !value}
              onChange={handleActiveToggle}
              id={record.id}
            />
          )}
        />
      )}
    </Table>
  )
}

const validateUserInputs = (user, setError) => {
  let requirmentsSatisfied = false

  if (
    user.phone.trim() !== "" &&
    user.firstName.trim() != "" &&
    user.lastName.trim() != "" &&
    !isUndefined(user.roleId)
  ) {
    requirmentsSatisfied = true
  } else {
    setError("All fields required")
  }
  return requirmentsSatisfied
}

const UpdateUserForm = ({
  user,
  rolesData,
  setEditableUser,
  refreshUsers,
  company,
}) => {
  const [error, setError] = useState("")
  let thisRoleObj = []
  let thisCompanyId = company.id
  if (user) {
    thisRoleObj = user.userRoles.filter(res => {
      if (res.companyId == thisCompanyId) {
        return res.role.id
      } else {
        return false
      }
    })
  }
  const [role, setRole] = useState(
    user &&
      thisRoleObj &&
      (thisRoleObj.length > 0 ? thisRoleObj[0].role.id : undefined)
  )
  const firstNameRef = useRef()
  const lastNameRef = useRef()
  const [phone, setPhone] = useState("")
  const { Option } = Select
  const [updateUser, response] = useMutation(UPDATE_USER, {
    onCompleted: data => {
      refreshUsers()
      setEditableUser(null)
    },
  })

  const handleUpdateClick = () => {
    const updatedUser = {
      userId: user.id,
      firstName: firstNameRef.current.value,
      lastName: lastNameRef.current.value,
      roleId: role,
      companyId: company.id,
      phone: phone,
    }
    if (validateUserInputs(updatedUser, setError)) {
      updateUser({ variables: updatedUser })
    }
  }

  useEffect(() => {
    if (user) {
      setRole(
        user && thisRoleObj.length > 0 ? thisRoleObj[0].role.id : undefined
      )
      setPhone((user && user?.phone) || "")
    }
  }, [user])

  return (
    <Modal
      title={"Update user"}
      visible={user !== null}
      onCancel={() => setEditableUser(null)}
      okText={"Update"}
      onOk={handleUpdateClick}
    >
      {user && (
        <React.Fragment>
          {error && (
            <Alert
              message={error}
              type={"error"}
              banner
              style={{ margin: "0 -24px" }}
            />
          )}
          <TextInput
            label={"First name"}
            defaultValue={user.firstName}
            placeholder={"First name"}
            name={"firstName"}
            reference={firstNameRef}
          />
          <TextInput
            label={"Last name"}
            defaultValue={user.lastName}
            placeholder={"Last name"}
            name={"lastName"}
            reference={lastNameRef}
          />
          <SelectCntr>
            <label>
              <Typography>Role</Typography>
              <Select
                style={{ width: "100%" }}
                onChange={setRole}
                value={role}
                placeholder={"Select a role"}
                showArrow={true}
              >
                {rolesData &&
                  rolesData.roles.map(role => (
                    <Option key={role.id}>{role.name}</Option>
                  ))}
              </Select>
            </label>
          </SelectCntr>
          <div style={{ padding: "13px 10px" }}>
            <Typography variant={"regular"} weight={"medium"}>
              Phone
            </Typography>
            <PhoneDiv>
              <PhoneInput
                international
                withCountryCallingCode
                countryCallingCodeEditable={false}
                defaultCountry="US"
                value={phone}
                placeholder="Phone number"
                onChange={e => setPhone(e)}
              />
            </PhoneDiv>
          </div>
        </React.Fragment>
      )}
    </Modal>
  )
}
