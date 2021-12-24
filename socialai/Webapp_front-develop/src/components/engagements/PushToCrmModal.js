import React, { useState, useRef, useEffect } from "react"
import {
  Input,
  Button,
  Select,
  Modal,
  Alert,
  message,
  Row,
  Col,
  Spin,
  Collapse,
  Icon,
} from "antd"
import { useMutation, useQuery } from "@apollo/react-hooks"
import { PUSH_DEAL_TO_CRM } from "../../graphql/mutation"
import { GET_ALL_VEHICLES } from "../../graphql/query"
import moment from "moment"
import styled from "styled-components"
import { Countries } from "../../library/countries"
import { USStates } from "../../library/usStates"
import PhoneInput from "react-phone-number-input"
import "react-phone-number-input/style.css"
import isEmpty from "lodash/isEmpty"
import Typography from "../../library/typography"
import { filterAndSortingData } from "../../library/helpers"
import { showConfirmationModal } from "../../library/helpers"
import AddVehicle from "../life-events/customerList/AddVehicle"

const MODAL_TITLE = `Do you want to continue?`
const MODAL_CONTENT = `When clicked the OK button, it cannot be recovered`

const PhoneDiv = styled.div`
  input {
    border: 1px solid #d9d9d9;
    width: 373px;
    padding: 5px;
    border-radius: 4px;
  }
`
const SelectWrap = styled(Select)`
  width: 100%;
`
const LabelWrap = styled.label`
  margin-bottom: 5px;
`
const SpanWrap = styled.span`
  color: red;
  margin-left: 2px;
`

const ModalWrap = styled(Modal)`
  .ant-modal-body {
    padding: 0;
    .ant-collapse-content-box {
      background: #fff;
    }
  }
`
export const getAuthor = (conversation, selectedLead, users) => {
  let author = selectedLead.firstName + " " + selectedLead.lastName
  if (conversation.dateSent) {
    author = selectedLead?.systemUserId
      ? "Otto"
      : users
      ? users[conversation?.userId] || "Otto"
      : "Me"
  }
  return author
}

const PushToCrmModal = ({
  pushToCrmModalVisible,
  setPushToCrmModalVisible,
  conversations,
  selectedLead,
  users,
}) => {
  const combinedConversation = conversations.reduce(
    (accumulator, conversation) => {
      let author = getAuthor(conversation, selectedLead, users)
      let postTime = conversation.dateSent
        ? conversation.dateSent
        : conversation.dateReceived
      return `${accumulator}${
        accumulator != null && !isEmpty(accumulator) ? "\n" : ""
      }[${author} @ ${moment(postTime).format("HH:mm MM.DD.YYYY")}] ${
        conversation.content != null
          ? conversation.content.trim().replace(/\s\s+/g, " ")
          : ""
      }`
    },
    ""
  )
  const getStateCode = state => {
    if (state && state.length > 2) {
      return USStates.find(el => el.name == state)?.code
    } else {
      return state
    }
  }

  const pushToCrmFormInitialValues = {
    companyId: selectedLead.companyId,
    dealId: selectedLead.id,
    aingineDataId: null,
    typeOfLead: "",
    status: "",
    interest: "",
    year:
      (selectedLead?.vehicleOfInterest || []).length > 0
        ? selectedLead?.vehicleOfInterest[0]?.year || "0000"
        : "0000",
    make:
      (selectedLead?.vehicleOfInterest || []).length > 0
        ? selectedLead?.vehicleOfInterest[0]?.make || "N/A"
        : "N/A",
    model:
      (selectedLead?.vehicleOfInterest || []).length > 0
        ? selectedLead?.vehicleOfInterest[0]?.model || "N/A"
        : "N/A",
    contactFirstName: selectedLead.firstName ? selectedLead.firstName : "",
    contactLastName: selectedLead.lastName ? selectedLead.lastName : "",
    contactFullName: `${(selectedLead.firstName ? selectedLead.firstName : "") +
      " " +
      (selectedLead.lastName ? selectedLead.lastName : "")}`,
    contactEmail:
      (selectedLead?.emails || []).length > 0
        ? selectedLead?.emails[0]?.email || "N/A"
        : "",
    contactPhoneNumber:
      (selectedLead?.phoneNumbers || []).length > 0
        ? selectedLead?.phoneNumbers[0]?.phone || ""
        : "",
    contactAddressLine1:
      (selectedLead?.addresses || []).length > 0
        ? selectedLead?.addresses[0]?.addressLine1 || ""
        : "",
    contactAddressLine2:
      (selectedLead?.addresses || []).length > 0
        ? selectedLead?.addresses[0].addressLine2
        : "",
    city:
      (selectedLead?.addresses || []).length > 0
        ? selectedLead?.addresses[0].city
        : "",
    state:
      (selectedLead?.addresses || []).length > 0
        ? getStateCode(selectedLead?.addresses[0].state)
        : "",
    zip:
      (selectedLead?.addresses || []).length > 0
        ? selectedLead?.addresses[0].postalCode
        : "",
    country:
      (selectedLead?.addresses || []).length > 0
        ? selectedLead?.addresses[0].country || "United States"
        : "",
    comments: combinedConversation,
    additionalComments: "",
  }

  const [error, setError] = useState("")
  const [pushToCrmForm, setPushToCrmForm] = useState(pushToCrmFormInitialValues)
  const [yearData, setYearData] = useState([])
  const [modelData, setModelData] = useState([])
  const [makeData, setMakeData] = useState([])
  const contactFirstName = useRef(pushToCrmFormInitialValues.firstName || "")
  const contactLastName = useRef(pushToCrmFormInitialValues.lastName || "")
  const contactFullName = useRef(
    pushToCrmFormInitialValues.contactFullName || ""
  )
  const contactEmail = useRef(`${pushToCrmFormInitialValues.email}`)
  const contactPhoneNumber = useRef(`${pushToCrmFormInitialValues.phone}`)
  const contactAddressLine1 = useRef(
    `${pushToCrmFormInitialValues.addressLine1}`
  )
  const contactAddressLine2 = useRef("")
  const city = useRef("")
  const state = useRef("")
  const zip = useRef("")
  const country = useRef("")
  const comments = useRef(combinedConversation)
  const additionalComments = useRef("")

  const [vehicles, setVehicles] = useState(
    selectedLead?.vehicleOfInterest || []
  )

  const [
    pushDealToCrm,
    {
      data: pushDealToCrmData,
      loading: pushDealToCrmLoading,
      error: pushDealToCrmError,
      called: pushDealToCrmCalled,
    },
  ] = useMutation(PUSH_DEAL_TO_CRM)

  const { data } = useQuery(GET_ALL_VEHICLES, {
    onCompleted: resp => {
      let _yearData = filterAndSortingData(
        resp?.vehicleOfInterest || [],
        "year"
      )
      let _modelData = filterAndSortingData(
        resp?.vehicleOfInterest || [],
        "model"
      )
      let _makeData = filterAndSortingData(
        resp?.vehicleOfInterest || [],
        "make"
      )
      setYearData(_yearData)
      setModelData(_modelData)
      setMakeData(_makeData)
    },
  })

  useEffect(() => {
    if (pushDealToCrmCalled) {
      if (!pushDealToCrmError) {
        setPushToCrmModalVisible(false)
        //message.success(`Lead has been pushed to CRM successfully`)
      } else if (String(pushDealToCrmError).includes("403")) {
        message.error(
          "Not Authorized to pushing lead to CRM, Please try again later."
        )
      } else {
        message.error(`Something went wrong to pushing lead to CRM`)
      }
    }
  }, [pushDealToCrmError])

  const updatePushToCrmForm = (field, value) => {
    setPushToCrmForm(prevState => {
      const newState = { ...prevState }
      newState[field] = value
      return newState
    })
  }
  const validatePushToCrmSubmitValues = (pushToCrmSubmitValues, setError) => {
    let requirmentsSatisfied = true
    if (
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(
        pushToCrmSubmitValues.contactEmail
      ) == false
    ) {
      setError("You have entered an invalid email address")
      requirmentsSatisfied = false
    }
    if (
      !pushToCrmSubmitValues.contactPhoneNumber ||
      pushToCrmSubmitValues.contactPhoneNumber == ""
    ) {
      requirmentsSatisfied = false
      setError("Phone number must be entered")
    }
    if (
      !pushToCrmSubmitValues.contactLastName ||
      pushToCrmSubmitValues.contactLastName == ""
    ) {
      requirmentsSatisfied = false
      setError("Last name must be entered")
    }
    if (
      !pushToCrmSubmitValues.contactFirstName ||
      pushToCrmSubmitValues.contactFirstName == ""
    ) {
      requirmentsSatisfied = false
      setError("First name must be entered")
    }
    if (
      !pushToCrmSubmitValues.interest ||
      pushToCrmSubmitValues.interest == ""
    ) {
      requirmentsSatisfied = false
      setError("Interest (Buy/Sell) must be selected")
    }

    if (
      !pushToCrmSubmitValues.typeOfLead ||
      pushToCrmSubmitValues.typeOfLead == ""
    ) {
      requirmentsSatisfied = false
      setError("Type of lead must be selected")
    }
    if (
      !pushToCrmSubmitValues.contactAddressLine1 ||
      pushToCrmSubmitValues.contactAddressLine1 == ""
    ) {
      requirmentsSatisfied = false
      setError("Address line1 must be entered")
    }
    if (
      pushToCrmSubmitValues.state == null ||
      pushToCrmSubmitValues.state == ""
    ) {
      requirmentsSatisfied = false
      setError("State must be entered")
    }
    if (
      pushToCrmSubmitValues.country == null ||
      pushToCrmSubmitValues.country == ""
    ) {
      requirmentsSatisfied = false
      setError("Country must be entered")
    }
    return requirmentsSatisfied
  }
  const handlePushToCrm = () => {
    let formValues = { ...pushToCrmForm }
    if (pushToCrmForm.additionalComments != "") {
      formValues.comments =
        pushToCrmForm.comments + "\n" + pushToCrmForm.additionalComments
    }
    let _vehicles = []
    if (vehicles.length > 0) {
      vehicles.forEach(el => {
        _vehicles.push({
          vehicleId: el?.id || 0,
          year: el.year,
          model: el.model,
          make: el.make,
          interest: el.customerInterest,
          isPrimary: el?.isPrimary || false,
        })
      })
    }

    const pushToCrmSubmitValues = {
      ...formValues,
      year: pushToCrmForm.year ? pushToCrmForm.year : "0000",
      make: pushToCrmForm.make ? pushToCrmForm.make : "N/A",
      model: pushToCrmForm.model ? pushToCrmForm.model : "N/A",
      contactEmailType:
        (selectedLead?.emails || []).length > 0
          ? selectedLead?.emails[0]?.emailType
          : "",
      contactPhoneNumberType:
        (selectedLead?.phoneNumbers || []).length > 0
          ? selectedLead?.phoneNumbers[0]?.phoneType
          : "",
      vehicles: _vehicles,
    }
    if (validatePushToCrmSubmitValues(pushToCrmSubmitValues, setError)) {
      setError("")
      pushDealToCrm({
        variables: pushToCrmSubmitValues,
      }).then(resp => {
        if (resp?.data?.pushDealToCrm?.statusCode == 200) {
          message.success(resp?.data?.pushDealToCrm?.message)
          setPushToCrmModalVisible(false)
        } else {
          message.error(resp?.data?.pushDealToCrm?.message)
        }
      })
    }
  }
  const handleCancel = () => {
    setPushToCrmModalVisible(false)
  }

  const saveVehicle = payload => {
    if (payload) {
      if (payload?.id) {
        setVehicles(prevState => {
          let newState = [...prevState]
          const index = newState.findIndex(el => el.id == payload?.id)
          if (index > -1) {
            newState[index].make = payload?.make
            newState[index].model = payload?.model
            newState[index].year = payload?.year
            newState[index].isCurrent = payload?.isCurrent
            newState[index].isPrimary = payload?.isPrimary
            newState[index].customerInterest = payload?.customerInterest
          }
          return newState
        })
      } else {
        setVehicles(prevState => {
          let newState = [...prevState]
          newState.push({
            id: new Date().valueOf(),
            make: payload?.make,
            model: payload?.model,
            year: payload?.year,
            isCurrent: payload.isCurrent,
            isPrimary: payload.isPrimary,
            customerInterest: payload?.customerInterest,
          })
          return newState
        })
      }
    }
  }

  const removeVehicle = id => {
    showConfirmationModal(MODAL_TITLE, MODAL_CONTENT, () => {
      const findIndex = vehicles.findIndex(el => el.id == id)
      if (findIndex > -1) {
        setVehicles(prevState => {
          let newState = [...prevState]
          newState.splice(findIndex, 1)
          return newState
        })
      }
    })
  }

  const { Option } = Select
  const { TextArea } = Input

  return (
    <ModalWrap
      title="Push To CRM"
      maskClosable={false}
      visible={pushToCrmModalVisible}
      onOk={() => setPushToCrmModalVisible(false)}
      onCancel={() => setPushToCrmModalVisible(false)}
      width={"85%"}
      footer={[
        <Button key="back" onClick={handleCancel}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          onClick={handlePushToCrm}
          loading={pushDealToCrmLoading}
        >
          Send
        </Button>,
      ]}
    >
      {error && (
        <Row gutter={[4, 16]}>
          <Col>
            <Alert
              message={error}
              type={"error"}
              style={{ margin: "0 19px" }}
              showIcon
            />
          </Col>
        </Row>
      )}

      {pushDealToCrmLoading && (
        <div style={{ textAlign: "center", width: "100%" }}>
          <Spin spinning={true} />
        </div>
      )}
      <Collapse
        bordered={false}
        expandIconPosition={"right"}
        defaultActiveKey={["1"]}
        expandIcon={({ isActive }) => (
          <Icon type="caret-right" rotate={isActive ? 90 : 0} />
        )}
      >
        <Collapse.Panel
          header={
            <Typography variant={"h4"} weight={"medium"} inline>
              Lead Info
            </Typography>
          }
          key="1"
        >
          <Row gutter={[4, 16]}>
            <Col xs={24} sm={24} md={12} lg={8} xl={8}>
              <LabelWrap>
                Type of Lead<SpanWrap>*</SpanWrap>
              </LabelWrap>
              <SelectWrap
                placeholder="Select the type of lead"
                onChange={value => updatePushToCrmForm("typeOfLead", value)}
              >
                <Option key={""} value={""} disabled>
                  Select the type of lead
                </Option>
                <Option key={"sales"} value={"sales"}>
                  Sales
                </Option>
                <Option key={"parts"} value={"parts"}>
                  Parts
                </Option>
                <Option key={"service"} value={"service"}>
                  Service
                </Option>
              </SelectWrap>
            </Col>
            <Col xs={24} sm={24} md={12} lg={8} xl={8}>
              <LabelWrap>Condition</LabelWrap>
              <SelectWrap
                placeholder="Select the condition"
                onChange={value => updatePushToCrmForm("status", value)}
              >
                <Option key={""} value={""} disabled>
                  Select the condition
                </Option>
                <Option key={"new"} value={"new"}>
                  New
                </Option>
                <Option key={"used"} value={"used"}>
                  Used
                </Option>
              </SelectWrap>
            </Col>
            <Col xs={24} sm={24} md={12} lg={8} xl={8}>
              <LabelWrap>
                Interest<SpanWrap>*</SpanWrap>
              </LabelWrap>
              <SelectWrap
                placeholder="Select the interest"
                onChange={value => updatePushToCrmForm("interest", value)}
              >
                <Option key={""} value={""} disabled>
                  Select the interest
                </Option>
                <Option key={"buy"} value={"buy"}>
                  Buy
                </Option>
                <Option key={"sell"} value={"sell"}>
                  Sell
                </Option>
              </SelectWrap>
            </Col>
          </Row>

          <Row gutter={[4, 16]}>
            <Col xs={24} sm={24} md={12} lg={12} xl={12}>
              <LabelWrap>
                First Name<SpanWrap>*</SpanWrap>
              </LabelWrap>
              <Input
                reference={contactFirstName}
                placeholder={"Contact First Name"}
                name={"contactFirstName"}
                value={pushToCrmForm.contactFirstName}
                onChange={e =>
                  updatePushToCrmForm("contactFirstName", e.target.value)
                }
              />
            </Col>
            <Col xs={24} sm={24} md={12} lg={12} xl={12}>
              <LabelWrap>
                Last Name<SpanWrap>*</SpanWrap>
              </LabelWrap>
              <Input
                reference={contactLastName}
                placeholder={"Contact Last Name"}
                name={"contactLastName"}
                value={pushToCrmForm.contactLastName}
                onChange={e =>
                  updatePushToCrmForm("contactLastName", e.target.value)
                }
              />
            </Col>
          </Row>
          <Row gutter={[4, 16]}>
            <Col xs={24} sm={24} md={12} lg={12} xl={12}>
              <LabelWrap>Full Name</LabelWrap>
              <Input
                reference={contactFullName}
                placeholder={"Contact Full Name"}
                name={"contactFullName"}
                value={pushToCrmForm.contactFullName}
                onChange={e =>
                  updatePushToCrmForm("contactFullName", e.target.value)
                }
              />
            </Col>
          </Row>
          <Row gutter={[4, 16]}>
            <Col xs={24} sm={24} md={12} lg={12} xl={12}>
              <LabelWrap>Contact Email</LabelWrap>
              <Input
                reference={contactEmail}
                placeholder={"Contact Email"}
                name={"contactEmail"}
                value={pushToCrmForm.contactEmail}
                onChange={e =>
                  updatePushToCrmForm("contactEmail", e.target.value)
                }
              />
            </Col>
            <Col xs={24} sm={24} md={12} lg={12} xl={12}>
              <LabelWrap>
                Contact Phone Number<SpanWrap>*</SpanWrap>
              </LabelWrap>
              <PhoneDiv>
                <PhoneInput
                  reference={contactPhoneNumber}
                  international
                  withCountryCallingCode
                  countryCallingCodeEditable={false}
                  defaultCountry="US"
                  value={pushToCrmForm.contactPhoneNumber}
                  placeholder="Enter phone number"
                  onChange={e => updatePushToCrmForm("contactPhoneNumber", e)}
                />
              </PhoneDiv>
            </Col>
          </Row>
          <Row gutter={[4, 16]}>
            <Col xs={24} sm={24} md={12} lg={12} xl={12}>
              <LabelWrap>
                Contact Address Line 1<SpanWrap>*</SpanWrap>
              </LabelWrap>
              <Input
                reference={contactAddressLine1}
                placeholder={"Contact Address Line 1"}
                name={"contactAddressLine1"}
                value={pushToCrmForm.contactAddressLine1}
                onChange={e =>
                  updatePushToCrmForm("contactAddressLine1", e.target.value)
                }
              />
            </Col>
            <Col xs={24} sm={24} md={12} lg={12} xl={12}>
              <LabelWrap>Contact Address Line 2</LabelWrap>
              <Input
                reference={contactAddressLine2}
                placeholder={"Contact Address Line 2"}
                name={"contactAddressLine2"}
                value={pushToCrmForm.contactAddressLine2}
                onChange={e =>
                  updatePushToCrmForm("contactAddressLine2", e.target.value)
                }
              />
            </Col>
          </Row>
          <Row gutter={[4, 16]}>
            <Col xs={24} sm={24} md={12} lg={6} xl={6}>
              <LabelWrap>City</LabelWrap>
              <Input
                reference={city}
                placeholder={"City"}
                name={"city"}
                value={pushToCrmForm.city}
                onChange={e => updatePushToCrmForm("city", e.target.value)}
              />
            </Col>
            <Col xs={24} sm={24} md={12} lg={6} xl={6}>
              <LabelWrap>
                State<SpanWrap>*</SpanWrap>
              </LabelWrap>
              <Select
                showSearch
                reference={state}
                style={{ width: "100%" }}
                placeholder="State"
                value={pushToCrmForm.state}
                onChange={e => updatePushToCrmForm("state", e)}
              >
                {USStates.map((el, i) => (
                  <Option key={`key__${i}`} value={el.code}>
                    {el.name}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={24} md={12} lg={6} xl={6}>
              <LabelWrap>ZIP</LabelWrap>
              <Input
                reference={zip}
                placeholder={"ZIP"}
                name={"zip"}
                value={pushToCrmForm.zip}
                onChange={e => updatePushToCrmForm("zip", e.target.value)}
              />
            </Col>
            <Col xs={24} sm={24} md={12} lg={6} xl={6}>
              <LabelWrap>
                Country<SpanWrap>*</SpanWrap>
              </LabelWrap>
              <Select
                reference={country}
                style={{ width: "100%" }}
                placeholder="Country"
                value={pushToCrmForm?.country || "United States"}
                disabled={pushToCrmForm.country != null}
                onChange={e => updatePushToCrmForm("country", e)}
              >
                {Countries.map((el, i) => (
                  <Option key={`key__${i}`} value={el.name}>
                    {el.name}
                  </Option>
                ))}
              </Select>
            </Col>
          </Row>
        </Collapse.Panel>
        <Collapse.Panel
          header={
            <Typography variant={"h4"} weight={"medium"} inline>
              Vehicles
            </Typography>
          }
          key="2"
        >
          <AddVehicle
            vehicles={vehicles || []}
            saveVehicle={saveVehicle}
            removeVehicle={removeVehicle}
            showPreviousVechile={false}
          />
        </Collapse.Panel>
        <Collapse.Panel
          header={
            <Typography variant={"h4"} weight={"medium"} inline>
              Comments
            </Typography>
          }
          key="3"
        >
          <Row gutter={[4, 16]}>
            <Col xs={24} sm={24} md={24} lg={24} xl={24}>
              <LabelWrap>Comments</LabelWrap>
              <TextArea
                rows={5}
                readOnly={true}
                reference={comments}
                placeholder={"Comments"}
                name={"comments"}
                defaultValue={`${combinedConversation}`}
                //onChange={e => updatePushToCrmForm("comments", e.target.value)}
              />
            </Col>
          </Row>
          <Row gutter={[4, 16]}>
            <Col xs={24} sm={24} md={24} lg={24} xl={24}>
              <LabelWrap>Additional Comments</LabelWrap>
              <TextArea
                rows={5}
                reference={additionalComments}
                placeholder={"Additional Comments"}
                name={"additionalComments"}
                value={`${pushToCrmForm.additionalComments}`}
                onChange={e =>
                  updatePushToCrmForm("additionalComments", e.target.value)
                }
              />
            </Col>
          </Row>
        </Collapse.Panel>
      </Collapse>
    </ModalWrap>
  )
}
export default PushToCrmModal
