import React, { useRef, useState, useMemo } from "react"
import TextInput from "../../library/textInput"
import styled from "styled-components"
import { Button, Icon, Select, Alert } from "antd"
import { Separators, Colors } from "../../library/constants"
import { GET_USER_BY_ID } from "../../graphql/query"
import { useMutation, useQuery, useLazyQuery } from "@apollo/react-hooks"
import { updateLocale } from "moment"
import PhoneInput from "react-phone-number-input"
import "react-phone-number-input/style.css"
import isUndefined from "lodash/isUndefined"

const FormCntr = styled.div`
  width: 100%;
  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
`

const InlineFormButton = styled(Button)`
  margin: 12px 0 0 16px;
`

const SelectCntr = styled.div`
  width: 100%;
  margin-top: 9px;
  margin-left: 10px;
  & > div > div {
    height: 37px;
    border-color: ${Colors.lightGray};
  }
`

const Permisions = styled.span`
  font-size: 12px;
  color: ${Colors.medDarkgray};
`
const PhoneDiv = styled.div`
  width: 45%;
  padding: 8px 10px;
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

const UserForm = ({
  createUser,
  company,
  rolesData,
  setUserFormEmail,
  addUserAccount,
}) => {
  const [error, setError] = useState("")
  const [role, setRole] = useState()
  const [formData, setFormData] = useState()
  const [flag, setFlag] = useState(false)
  const email = useRef("")
  const firstName = useRef("")
  const lastName = useRef("")
  const [phone, setPhone] = useState("")

  const resetForm = () => {
    email.current.value = ""
    firstName.current.value = ""
    lastName.current.value = ""
    setRole(undefined)
    setPhone("")
  }
  const [userDataByEmail1, { loading, data }] = useLazyQuery(GET_USER_BY_ID)
  //if (loading) return <p>Loading ...</p>;
  useMemo(() => {
    if (typeof data !== "undefined") {
      if (data.getUserByEmail.length == 0) {
        //debugger;
        createUser({ variables: formData })
      } else {
        //debugger
        setFlag(true)
        var existingRoles = data.getUserByEmail[0].userRoles.filter(function(
          obj
        ) {
          return (
            obj.roleId == formData.roleId &&
            obj.companyId == formData.companyId &&
            obj.userId == data.getUserByEmail[0].id
          )
        })
        var existingAccounts = data.getUserByEmail[0].userAccounts.filter(
          function(obj) {
            return (
              obj.companyId == formData.companyId &&
              obj.userId == data.getUserByEmail[0].id
            )
          }
        )
        if (existingAccounts.length == 0 && existingRoles.length == 0) {
          //updateUserRoles({ variables: {companyId:formData.companyId,userId:data.getUserByEmail[0].id,roleId:formData.roleId} })
          addUserAccount({
            variables: {
              companyId: formData.companyId,
              userId: data.getUserByEmail[0].id,
              status: "ACTIVATED",
              roleId: formData.roleId,
            },
          })
        }
      }
    }
  }, [data])

  const submitUser = () => {
    const user = {
      email: email.current.value,
      firstName: firstName.current.value,
      lastName: lastName.current.value,
      companyId: company.id,
      phone: phone,
    }
    setFormData(user)
    if (role) {
      user.roleId = role
    }
    if (validateUserInputs(user, setError)) {
      setError("")
      //createUser({ variables: user })
      setUserFormEmail(user.email)
      userDataByEmail1({ variables: { email: user.email } })
      if (flag) {
        setFlag(false)
      }
      resetForm()
    }
  }

  const { Option } = Select

  return (
    <React.Fragment>
      {error && (
        <Alert
          message={error}
          type={"error"}
          banner
          style={{ margin: "0 -24px" }}
        />
      )}
      <FormCntr>
        <TextInput reference={email} placeholder={"Email"} name={"email"} />
        <TextInput
          reference={firstName}
          placeholder={"First Name"}
          name={"firstName"}
        />
        <TextInput
          reference={lastName}
          placeholder={"Last Name"}
          name={"lastName"}
        />

        <InlineFormButton type={"primary"} onClick={submitUser}>
          Add
          <Icon type={"plus-circle"} />
        </InlineFormButton>
      </FormCntr>
      <FormCntr style={{ padding: "12px 0" }}>
        <PhoneDiv>
          <PhoneInput
            international
            withCountryCallingCode
            countryCallingCodeEditable={false}
            defaultCountry="US"
            value={""}
            placeholder="Phone number"
            onChange={e => setPhone(e)}
          />
        </PhoneDiv>
        <SelectCntr>
          <Select
            style={{ width: "45%" }}
            onChange={setRole}
            value={role}
            placeholder={"Select a role"}
            showArrow={true}
          >
            {rolesData &&
              rolesData.roles.map(role => (
                <Option key={role.id}>
                  {role.name} -{" "}
                  <Permisions>{parsePermissions(role)}</Permisions>
                </Option>
              ))}
          </Select>
        </SelectCntr>
      </FormCntr>
    </React.Fragment>
  )
}

export default UserForm

const validateUserInputs = (user, setError) => {
  let emailValidated = false
  let requirmentsSatisfied = false
  if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(user.email)) {
    emailValidated = true
  } else {
    setError("You have entered an invalid email address")
  }

  if (
    user.email.trim() !== "" &&
    user.firstName.trim() != "" &&
    user.lastName.trim() != "" &&
    !isUndefined(user.roleId)
  ) {
    requirmentsSatisfied = true
  } else {
    setError("All fields required")
  }
  return emailValidated && requirmentsSatisfied
}

const parsePermissions = role => {
  const permissions = {
    canCreateUsers: "Users",
    canCreateTeams: "Teams",
    canViewProspects: "Prospects",
    isCompanyAdmin: "Company Admin",
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
