import React, { useState } from "react"
import { useMutation } from "@apollo/react-hooks"
import { UPDATE_USER } from "../../graphql/mutation"
import { Button, Input, message, Divider, Avatar, Upload } from "antd"
import {
  ContainerNavigation,
  Content,
  ContentBody,
  IconCustom,
  SettingsSectionTitle,
  Label,
  // SVGIcon
} from "../../library/basicComponents"
import PhoneInput from "react-phone-number-input"
import "react-phone-number-input/style.css"
import { getBase64, beforeUpload } from "../../library/upload"
import styled from "styled-components"
import { Separators, Colors } from "../../library/constants"

const PhoneDiv = styled.div`
  input {
    border: ${Separators("thin", "lightGray")};
    width: 100%;
    padding: 8px 12px;
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

const UserProfile = ({ userData, refreshUsers }) => {
  const [user, setUser] = useState(userData)

  const [updateUser, { data: updatedUser }] = useMutation(UPDATE_USER, {
    onCompleted: res => refreshUsers(),
  })

  const submitUser = () => {
    if (user.newPass !== user.newPassRep) {
      message.error("New password and repeated new password are not equal")
    } else {
      if (validateUserInputs(user)) {
        updateUser({
          variables: {
            userId: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email !== userData.email ? user.email : null,
            oldPass: user.oldPass,
            newPass: user.newPass,
            phone: user.phone,
          },
        })
        message.success("User updated")
      } else {
        message.error("Invalid fields")
      }
    }
  }

  return (
    <React.Fragment>
      <ContainerNavigation>
        <SettingsSectionTitle>Personal Profile</SettingsSectionTitle>
        <Button type={"primary"} onClick={() => submitUser()}>
          Save changes
          <IconCustom type={"check"} />
        </Button>
      </ContainerNavigation>
      <Content>
        <ContentBody>
          {userData && <UserProfileForm user={user} setUser={setUser} />}
        </ContentBody>
      </Content>
    </React.Fragment>
  )
}

export default UserProfile

const UserProfileForm = ({ user, setUser }) => {
  const [loading, setLoading] = useState(false)

  const handleChange = info => {
    if (info.file.status === "uploading") {
      setLoading(true)
      return
    }
    if (info.file.status === "done") {
      // Get this url from response in real world.
      getBase64(info.file.originFileObj, imageUrl => {
        setLoading(false)
        updateUserField("profilePic", imageUrl)
      })
    }
  }

  const updateUserField = (field, value) => {
    setUser(prevState => {
      const newState = { ...prevState }
      newState[field] = value
      return newState
    })
  }

  return (
    <div>
      <Upload
        name="avatar"
        listType="picture"
        className="avatar-uploader"
        showUploadList={false}
        action="https://www.mocky.io/v2/5cc8019d300000980a055e76"
        beforeUpload={beforeUpload}
        onChange={handleChange}
      >
        {user.profilePic ? (
          <img src={user.profilePic} alt="avatar" style={{ width: "100px" }} />
        ) : (
          <div>
            <Avatar size={100} src="/icons/Avatar.svg"></Avatar>
          </div>
        )}
      </Upload>
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
      <Label>Email</Label>
      <Input
        placeholder="Enter a value"
        value={user.email}
        onChange={e => updateUserField("email", e.target.value)}
      />
      <br />
      <br />
      <Label>Phone Number</Label>
      <PhoneDiv>
        <PhoneInput
          international
          withCountryCallingCode
          countryCallingCodeEditable={false}
          defaultCountry="US"
          value={user?.phone}
          placeholder="Phone number"
          onChange={e => updateUserField("phone", e)}
        />
      </PhoneDiv>
      <Divider />

      <Label>Old password</Label>
      <Input.Password
        placeholder="Enter a value"
        value={user.oldPass}
        onChange={e => updateUserField("oldPass", e.target.value)}
      />
      <br />
      <br />
      <Label>New password</Label>
      <Input.Password
        placeholder="Enter a value"
        value={user.newPass}
        onChange={e => updateUserField("newPass", e.target.value)}
      />
      <br />
      <br />
      <Label>Repeat new password</Label>
      <Input.Password
        placeholder="Enter a value"
        value={user.newPassRep}
        onChange={e => updateUserField("newPassRep", e.target.value)}
      />
      <br />
      <br />
    </div>
  )
}

const validateUserInputs = user => {
  return user.firstName.trim() !== "" && user.lastName.trim() !== ""
}
