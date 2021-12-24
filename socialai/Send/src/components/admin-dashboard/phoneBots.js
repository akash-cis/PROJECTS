import React, { useEffect, useRef, useState } from "react"
import { useQuery, useMutation } from "@apollo/react-hooks"
import PanelHeader from "../../library/panelHeader"
import {
  Button,
  Switch,
  Table,
  Row,
  Col,
  Icon,
  Select,
  Modal,
  Alert,
  Input,
  message,
} from "antd"
import TextInput from "../../library/textInput"
import styled from "styled-components"
import Typography from "../../library/typography"
import { Separators, Colors } from "../../library/constants"
import isEmpty from "lodash/isEmpty"
import PhoneInput from "react-phone-number-input"
import "react-phone-number-input/style.css"
import { formatPhoneNumber } from "react-phone-number-input"
import { GET_COMPANY_PHONE_BOTS } from "../../graphql/query"
import {
  CREATE_CAMPANY_PHONE_BOT,
  UPDATE_CAMPANY_PHONE_BOT,
  DELETE_PHONE_BOT,
} from "../../graphql/mutation"
import { showConfirmationModal } from "../../library/helpers"
const MODAL_TITLE = `Do you want to continue?`
const MODAL_CONTENT = `When clicked the OK button, it cannot be recovered`

const SelectCntr = styled.div`
  width: 100%;
  margin-top: 9px;
  & > div > div {
    height: 37px;
    border-color: ${Colors.lightGray};
  }
`
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
const StyledInputArea = styled(Input.TextArea)`
  ${props => (props.noBorder ? "padding: 0;" : `padding: 8px 12px;`)}
  ${props =>
    props.noBorder
      ? "border: none;"
      : `border: ${Separators("thin", "lightGray")};`}
  border-radius: 4px;
  width: 100%;
  color: ${Colors.darkGray};
  box-sizing: border-box;
  font-size: ${({ size }) =>
    size === "small" ? "12px" : size === "big" ? "18px" : "14px"};
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
`
const Require = styled.span`
  color: red;
  margin-left: 2px;
`
const PhoneBotDiv = styled.div`
  padding: ${props => (props.padding ? props.padding : `0`)};
  .ant-table {
    margin-top: 10px;
  }
`
const EllipsDiv = styled.div`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 400px;
`

const ServiceTypes = [
  { name: "GENERAL", value: "GENERAL" },
  { name: "ACTIVITY CENTER", value: "ACTIVITY_CENTER" },
  { name: "CAMPAIGN", value: "CAMPAIGN" },
  { name: "APPOINTMENT", value: "APPOINTMENT" },
]

const PhoneBots = ({
  viewOnly = false,
  company,
  setCompany,
  setActiveTab,
  newCoSetup,
}) => {
  const [editablePhone, setEditablePhone] = useState(null)
  const [openModel, setOpenModel] = useState(false)

  const { data, refetch, loading } = useQuery(GET_COMPANY_PHONE_BOTS, {
    fetchPolicy: "network-only",
    variables: { companyId: company?.id || 0 },
  })

  const [createPhoneBot] = useMutation(CREATE_CAMPANY_PHONE_BOT)
  const [updatePhoneBot] = useMutation(UPDATE_CAMPANY_PHONE_BOT)
  const [deletePhoneBot] = useMutation(DELETE_PHONE_BOT)

  const handleDelete = payload => {
    deletePhoneBot({ ...payload }).then(resp => {
      if (resp?.data?.deleteTwilioPhoneService?.statusCode == 200) {
        refetch()
        message.success(resp?.data?.deleteTwilioPhoneService?.message)
      } else {
        message.error(resp?.data?.deleteTwilioPhoneService?.message)
      }
    })
  }
  const savePhoneBot = payload => {
    if (payload?.id) {
      //update
      updatePhoneBot({ variables: { ...payload } }).then(resp => {
        if (resp?.data?.updateTwilioPhoneService?.statusCode == 200) {
          setEditablePhone(null)
          setOpenModel(false)
          refetch()
          message.success(resp?.data?.updateTwilioPhoneService?.message)
        } else {
          message.error(resp?.data?.updateTwilioPhoneService?.message)
        }
      })
    } else {
      //create
      createPhoneBot({ variables: { ...payload, companyId: company.id } }).then(
        resp => {
          if (resp?.data?.createTwilioPhoneService?.statusCode == 200) {
            setEditablePhone(null)
            setOpenModel(false)
            refetch()
            message.success(resp?.data?.createTwilioPhoneService?.message)
          } else {
            message.error(resp?.data?.createTwilioPhoneService?.message)
          }
        }
      )
    }
  }

  return (
    <PhoneBotDiv padding={viewOnly ? "24px" : "0"}>
      <PanelHeader title={"Manage Phone Bots"}>
        {!viewOnly && (
          <>
            {!newCoSetup ? (
              <Button onClick={() => setCompany(null)}>Close</Button>
            ) : (
              <Button
                type={"primary"}
                onClick={() => setActiveTab("Engagement Templates")}
              >
                Continue
              </Button>
            )}
          </>
        )}
      </PanelHeader>
      {!viewOnly && (
        <PanelHeader title={""} style={{ padding: "10px 24px" }}>
          <Button
            onClick={() => {
              setEditablePhone(null)
              setOpenModel(true)
            }}
            type={"primary"}
          >
            Add Phone Bot
          </Button>
        </PanelHeader>
      )}
      <PhoneBotTable
        data={data?.getTwilioPhoneServices?.data || []}
        newCoSetup={newCoSetup}
        setEditablePhone={setEditablePhone}
        updateDisabledStatus={savePhoneBot}
        deletePhoneBot={handleDelete}
        viewOnly={viewOnly}
        loading={loading}
        setVisible={setOpenModel}
      />
      {openModel && (
        <PhoneBotForm
          visible={openModel}
          editablePhone={editablePhone}
          setVisible={setOpenModel}
          saveData={savePhoneBot}
        />
      )}
    </PhoneBotDiv>
  )
}
export default PhoneBots

const PhoneBotTable = ({
  data,
  newCoSetup,
  setEditablePhone,
  updateDisabledStatus,
  viewOnly = false,
  loading = false,
  setVisible,
  deletePhoneBot,
}) => {
  const { Column } = Table
  const handleActiveToggle = (checked, record) => {
    showConfirmationModal(MODAL_TITLE, MODAL_CONTENT, () =>
      updateDisabledStatus({
        phone: record?.user?.phone || "",
        id: parseInt(record.id),
        isActive: checked,
        serviceName: record.serviceName,
        type: record.type,
        description: record.description,
      })
    )
  }

  const handleRemove = (e, record) => {
    showConfirmationModal(MODAL_TITLE, MODAL_CONTENT, () =>
      deletePhoneBot({ variables: { id: parseInt(record.id) } })
    )
  }

  return (
    <Table dataSource={data} rowKey={"id"} pagination={false} loading={loading}>
      <Column
        title={"Service Name"}
        dataIndex={"serviceName"}
        key={"serviceName"}
        defaultSortOrder={"ascend"}
        sorter={(a, b) => a.serviceName.localeCompare(b.serviceName)}
      />
      <Column
        title={"Type "}
        dataIndex={"type "}
        key={"type"}
        render={(text, record) => {
          const obj = ServiceTypes.find(el => el.value == record?.type)
          return obj ? obj?.name : ""
        }}
      />
      <Column
        title={"Phone"}
        dataIndex={"phoneNumber"}
        key={"phoneNumber"}
        render={(text, record) => {
          return record?.user?.phone
            ? formatPhoneNumber(record?.user?.phone)
            : ""
        }}
      />

      <Column
        title={"Description "}
        dataIndex={"description"}
        key={"description"}
        width={400}
        render={(text, record) => {
          return record?.description ? (
            <EllipsDiv>{record?.description}</EllipsDiv>
          ) : (
            ""
          )
        }}
      />
      {!newCoSetup && (
        <Column
          title={"Active"}
          dataIndex={"isActive"}
          key={"isActive"}
          align={"center"}
          render={(value, record) => {
            return (
              <Switch
                checked={record?.isActive}
                onChange={e => handleActiveToggle(e, record)}
                id={record.id}
                disabled={viewOnly}
              />
            )
          }}
        />
      )}
      {!viewOnly && (
        <Column
          title={"Edit"}
          key={"edit"}
          render={(text, record) => (
            <Icon
              type={"edit"}
              onClick={() => {
                setEditablePhone(record)
                setVisible(true)
              }}
            />
          )}
        />
      )}
      {/* {!viewOnly && (
        <Column
          title={"Delete"}
          key={"delete"}
          width={"6%"}
          render={(text, record) => (
            <Icon type={"delete"} onClick={e => handleRemove(e, record)} />
          )}
        />
      )} */}
    </Table>
  )
}
const PhoneBotForm = ({
  visible,
  editablePhone = null,
  setVisible,
  saveData,
}) => {
  const [error, setError] = useState("")

  const [description, setDescription] = useState("")
  const [serviceName, setServiceName] = useState("")
  const [type, setType] = useState("")
  const [phone, setPhone] = useState("")

  useEffect(() => {
    if (editablePhone) {
      setServiceName(editablePhone?.serviceName || "")
      setDescription(editablePhone?.description || "")
      setPhone(editablePhone?.user?.phone || "")
      setType(editablePhone?.type)
    }
  }, [editablePhone])

  const handleUpdateClick = () => {
    if (isEmpty(serviceName)) {
      setError("Please enter service name")
      return
    }
    if (isEmpty(phone)) {
      setError("Please enter phone number")
      return
    }
    if (isEmpty(type)) {
      setError("Please select type")
      return
    }
    saveData({
      id: parseInt(editablePhone?.id) || null,
      serviceName: serviceName,
      phone: phone,
      type: type,
      description: description,
    })
  }
  return (
    <Modal
      title={`${editablePhone ? "Update" : "Add"} phone bot`}
      visible={visible}
      onCancel={() => setVisible(false)}
      okText={editablePhone ? "Update" : "Save"}
      onOk={handleUpdateClick}
      width={600}
      maskClosable={false}
    >
      <React.Fragment>
        {error && (
          <Row gutter={[4, 16]}>
            <Col span={24}>
              <Alert message={error} type={"error"} banner />
            </Col>
          </Row>
        )}
        <Row gutter={[4, 16]}>
          <Col span={12}>
            <TextInput
              placeholder={"Service Name"}
              name={"serviceName"}
              label={"Service Name"}
              require={true}
              defaultValue={serviceName}
              onChange={e => {
                setServiceName(e.target.value)
              }}
              maxLength={50}
            />
          </Col>
          <Col span={12}>
            <div style={{ padding: "13px 8px" }}>
              <Typography variant={"regular"} weight={"medium"}>
                Phone Number<Require>*</Require>
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
          </Col>
        </Row>
        <Row gutter={[4, 16]}>
          <Col span={24} style={{ padding: "8px" }}>
            <Typography variant={"regular"} weight={"medium"}>
              Type<Require>*</Require>
            </Typography>
            <SelectCntr>
              <Select
                style={{ width: "100%" }}
                onChange={setType}
                value={type}
                placeholder={"Select a type"}
                showArrow={true}
              >
                {ServiceTypes.map(e => (
                  <Option key={e.value} value={e.value}>
                    {e.name}
                  </Option>
                ))}
              </Select>
            </SelectCntr>
          </Col>
        </Row>
        <Row gutter={[4, 16]}>
          <Col span={24} style={{ padding: "8px" }}>
            <Typography variant={"regular"} weight={"medium"}>
              Description
            </Typography>
            <StyledInputArea
              placeholder={"Description"}
              rows={6}
              value={description}
              onChange={e => setDescription(e.target.value)}
              maxLength={300}
            />
          </Col>
        </Row>
      </React.Fragment>
    </Modal>
  )
}
