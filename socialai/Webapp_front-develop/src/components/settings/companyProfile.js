import React, { useContext, useEffect, useState, useRef } from "react"
import { useQuery, useMutation } from "@apollo/react-hooks"
import { GET_MY_COMPANY } from "../../graphql/query"
import { UPDATE_COMPANY } from "../../graphql/mutation"
import {
  Button,
  Input,
  message,
  Divider,
  Avatar,
  Select,
  Upload,
  Descriptions,
  Row,
  Col,
} from "antd"
import {
  ContainerNavigation,
  IconCustom,
  SettingsSectionTitle,
  Label,
} from "../../library/basicComponents"
import { Countries } from "../../library/countries"
import { getBase64, beforeUpload } from "../../library/upload"
import { UserContext } from "../../amplify/authenticator-provider"
import styled from "styled-components"
import Typography from "../../library/typography"
import WorkHours from "./workHours"
import { timezones } from "../../library/constants"
const { Option } = Select

const InfoCntr = styled.div`
  padding: 24px;
  margin: 12px 21px;
`

const InfoSection = styled.div`
  /*margin: 12px auto;*/
  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
  .ant-descriptions-title {
    margin-top: 1rem;
  }
`

const CompanyProfile = ({ companyData }) => {
  const { user } = useContext(UserContext)
  const workHoursRef = useRef(null)

  const [company, setCompany] = useState(null)
  const [editCompany, setEditCompany] = useState(null)
  const [isCompanyAdmin, setIsCompanyAdmin] = useState(
    user && user.role ? user.role.isCompanyAdmin : false
  )

  const { data, refetch: refreshCompany } = useQuery(GET_MY_COMPANY, {
    onCompleted: res => setCompany(res?.me?.company || {}),
  })
  const [updateCompany, { data: updatedCompany }] = useMutation(
    UPDATE_COMPANY,
    {
      onCompleted: resp => {
        if (refreshCompany) {
          try {
            refreshCompany()
          } catch (err) {}
        }
      },
    }
  )

  const submitCompany = () => {
    if (validateInputs(company)) {
      updateCompany({ variables: { ...company } })
      if (workHoursRef.current) {
        workHoursRef.current.saveWorkHours()
      }
      message.success("Company updated")
      setEditCompany(null)
    } else {
      message.error("Invalid fields")
    }
  }

  useEffect(() => {
    if (user && user.role) {
      setIsCompanyAdmin(user.role.isCompanyAdmin)
    }
  }, [user])

  return (
    <React.Fragment>
      <ContainerNavigation>
        <SettingsSectionTitle>Company Profile</SettingsSectionTitle>
        {editCompany ? (
          <Button
            type={"primary"}
            onClick={() => submitCompany()}
            disabled={!isCompanyAdmin}
          >
            Save changes
            <IconCustom type={"check"} />
          </Button>
        ) : (
          <Button
            icon={"edit"}
            onClick={() => setEditCompany(true)}
            disabled={!isCompanyAdmin}
          >
            Edit Company Info
          </Button>
        )}
      </ContainerNavigation>
      <Row>
        <Col xs={24} sm={24} md={12} lg={12} xl={12}>
          {company ? (
            editCompany ? (
              <CompanyProfileForm company={company} setCompany={setCompany} />
            ) : (
              <CompanyProfileInfo company={company} />
            )
          ) : null}
        </Col>
        <Col xs={24} sm={24} md={12} lg={12} xl={12}>
          <WorkHours
            showTitle={true}
            isCompanyAdmin={isCompanyAdmin}
            ref={workHoursRef}
            isEdit={editCompany ? true : false}
            company={user?.company || null}
          />
        </Col>
      </Row>
    </React.Fragment>
  )
}

export default CompanyProfile

const CompanyProfileForm = ({ company, setCompany }) => {
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
        updateCompanyField("profilePic", imageUrl)
      })
    }
  }

  const updateCompanyField = (field, value) => {
    setCompany(prevState => {
      const newState = { ...prevState }
      newState[field] = value
      return newState
    })
  }
  return (
    <div style={{ height: "90%", overflow: "auto", padding: 24 }}>
      <Upload
        name="avatar"
        listType="picture"
        className="avatar-uploader"
        showUploadList={false}
        action="https://www.mocky.io/v2/5cc8019d300000980a055e76"
        beforeUpload={beforeUpload}
        onChange={handleChange}
      >
        {company.profilePic ? (
          <img
            src={company.profilePic}
            alt="avatar"
            style={{ width: "100px" }}
          />
        ) : (
          <div>
            <Avatar size={100} src="/icons/Avatar.svg"></Avatar>
          </div>
        )}
      </Upload>
      <br />
      <br />
      <Label>Company name</Label>
      <Input
        placeholder="Enter a value"
        value={company.name}
        onChange={e => updateCompanyField("name", e.target.value)}
      />
      <br />
      <br />
      <Label>Phone</Label>
      <Input
        placeholder="Enter a value"
        value={company.phone}
        onChange={e => updateCompanyField("phone", e.target.value)}
      />
      <br />
      <br />
      <Label>Web address</Label>
      <Input
        placeholder="Enter a value"
        value={company.website}
        onChange={e => updateCompanyField("website", e.target.value)}
      />
      <br />
      {/*<br />*/}
      {/*<Label>Industry</Label>*/}
      {/*<Select*/}
      {/*  style={{ width: "100%" }}*/}
      {/*  placeholder="Chose an industry"*/}
      {/*  value={company.industry}*/}
      {/*  onChange={value => updateCompanyField("industry", value)}*/}
      {/*>*/}
      {/*  {Industries.map(i => (*/}
      {/*    <Option key={i} value={i}>*/}
      {/*      {i}*/}
      {/*    </Option>*/}
      {/*  ))}*/}
      {/*</Select>*/}
      <Divider />
      <Label>Address Line 1</Label>
      <Input
        placeholder="Enter a value"
        value={company.address}
        onChange={e => updateCompanyField("address", e.target.value)}
      />
      <br />
      <br />
      <Label>Address Line 2</Label>
      <Input
        placeholder="Enter a value"
        value={company.addressDetail}
        onChange={e => updateCompanyField("addressDetail", e.target.value)}
      />
      <br />
      <br />
      <Label>City</Label>
      <Input
        placeholder="Enter a value"
        value={company.city}
        onChange={e => updateCompanyField("city", e.target.value)}
      />
      <br />
      <br />
      <Label>State/Province</Label>
      <Input
        placeholder="Enter a value"
        value={company.state}
        onChange={e => updateCompanyField("state", e.target.value)}
      />
      <br />
      <br />
      <Label>Postal code</Label>
      <Input
        placeholder="Enter a value"
        value={company.postalCode}
        onChange={e => updateCompanyField("postalCode", e.target.value)}
      />
      <br />
      <br />
      <Label>Country</Label>
      <Select
        style={{ width: "100%" }}
        placeholder="Chose a country"
        value={company.country}
        onChange={value => updateCompanyField("country", value)}
      >
        {Countries.map((el, i) => (
          <Option key={`key__${i}`} value={el.name}>
            {el.name}
          </Option>
        ))}
      </Select>
      <br />
      <br />
      <Label>Location URL</Label>
      <Input
        placeholder="Enter a location url"
        value={company.locationLink}
        onChange={e => updateCompanyField("locationLink", e.target.value)}
      />
      <br />
      <br />
      <Label>Timezone</Label>
      <Select
        style={{ width: "100%" }}
        placeholder="Chose a timezone"
        value={company.timezone}
        onChange={value => updateCompanyField("timezone", value)}
      >
        {timezones.map(timezone => (
          <Select.Option key={timezone.value} value={timezone.value}>
            {timezone.name}
          </Select.Option>
        ))}
      </Select>
    </div>
  )
}

const CompanyProfileInfo = ({ company }) => {
  const renderTimezone = e => {
    const obj = timezones.find(el => el.value == e)
    return obj ? obj.name : "N/A"
  }
  return (
    <InfoCntr>
      <InfoSection>
        <Avatar
          size={100}
          src={company.profile_pic ? company.profile_pic : "/icons/Avatar.svg"}
        />
      </InfoSection>
      <InfoSection>
        <Descriptions
          title={
            <Typography variant={"h4"} weight={"bold"}>
              Company Info
            </Typography>
          }
          column={1}
        >
          <Descriptions.Item label={"Company Name"}>
            {company.name}
          </Descriptions.Item>
          <Descriptions.Item label={"Phone"}>{company.phone}</Descriptions.Item>
          <Descriptions.Item label={"Web Address"}>
            {company.website}
          </Descriptions.Item>
        </Descriptions>
      </InfoSection>
      <InfoSection>
        <Descriptions
          title={
            <Typography variant={"h4"} weight={"bold"}>
              Company Address
            </Typography>
          }
          column={1}
        >
          <Descriptions.Item label={"Address"}>
            {company.address} {company.addressDetail}
          </Descriptions.Item>
          <Descriptions.Item label={"City"}>{company.city}</Descriptions.Item>
          <Descriptions.Item label={"State/Province"}>
            {company.state}
          </Descriptions.Item>
          <Descriptions.Item label={"Postal code"}>
            {company.postalCode}
          </Descriptions.Item>
          <Descriptions.Item label={"Country"}>
            {company.country}
          </Descriptions.Item>
          <Descriptions.Item label={"Location URL"}>
            {company.locationLink}
          </Descriptions.Item>
          <Descriptions.Item label={"Timezone"}>
            {renderTimezone(company.timezone)}
          </Descriptions.Item>
        </Descriptions>
      </InfoSection>
    </InfoCntr>
  )
}

const validateInputs = company => {
  return company.name.trim() !== ""
}
