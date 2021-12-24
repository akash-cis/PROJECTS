import React, { useEffect, useState, useContext } from "react"
import { Input, Button, Modal, Alert, message, Row, Col, Select } from "antd"
import { useMutation, useQuery, useLazyQuery } from "@apollo/react-hooks"
import isEmpty from "lodash/isEmpty"
import { GET_LEAD_STATUS_TYPES, GET_LEAD_SOURCES } from "../../../graphql/query"
import styled from "styled-components"
import { Countries } from "../../../library/countries"
import { USStates } from "../../../library/usStates"
import {
  UPDATE_LEAD,
  UPDATE_LEAD_EMAIL,
  UPDATE_LEAD_PHONE,
  UPDATE_LEAD_ADDRESS,
  UPDATE_LEAD_VEHICLE_OF_INTEREST,
  CREATE_LEAD_EMAIL,
  CREATE_LEAD_PHONE,
  CREATE_LEAD,
  CREATE_LEAD_ADDRESS,
  CREATE_LEAD_VEHICLE_OF_INTEREST,
  DELETE_LEAD_VEHICLE_OF_INTEREST,
  CREATE_LEAD_VEHICLES,
  SAVE_LEAD_NOTE,
} from "../../../graphql/mutation"
import { UserContext } from "../../../amplify/authenticator-provider"
import PhoneInput from "react-phone-number-input"
import AddVehicleForm from "./AddVehicle"
import { showConfirmationModal } from "../../../library/helpers"
import { ContainerNavigation } from "../../../library/basicComponents"
import Typography from "../../../library/typography"

import "react-phone-number-input/style.css"

const MODAL_TITLE = `Do you want to continue?`
const MODAL_CONTENT = `When clicked the OK button, it cannot be recovered`

const { TextArea } = Input

const ContainerNavigationWrap = styled(ContainerNavigation)`
  padding: 16px 0;
`

const PhoneDiv = styled.div`
  input {
    border: 1px solid #d9d9d9;
    width: 373px;
    padding: 5px;
    border-radius: 4px;
  }
`

const LabelWrap = styled.label`
  margin-bottom: 5px;
`
const SpanWrap = styled.span`
  color: red;
  margin-left: 2px;
`
const SelectWrap = styled(Select)`
  width: 100%;
`
const { Option } = Select

const LeadEditModal = ({ lead, visibleModal, setModelVisible, refetch }) => {
  const { user } = useContext(UserContext)
  const [error, setError] = useState("")
  const [vehicles, setVehicles] = useState(lead?.vehicleOfInterest || [])
  const [firstName, setFirstName] = useState(lead?.firstName || "")
  const [lastName, setLastName] = useState(lead?.lastName || "")
  const [phone, setPhone] = useState(lead?.phoneNumbers[0]?.phone || "")
  const [email, setEmail] = useState(lead?.emails[0]?.email || "")
  const [source, setSource] = useState(String(lead?.leadSourceOriginalId || ""))
  const [otherSource, setOtherSource] = useState(lead?.otherSource || "")

  const [leadDescription, setLeadDescription] = useState("")
  const [leadNote, setLeadNote] = useState(
    (lead?.leadNoteslead || []).length > 0 ? lead?.leadNotes[0]?.note || "" : ""
  )
  const [leadStatus, setLeadStatus] = useState(lead?.leadStatusType?.id || "")

  const [address, setAddress] = useState(lead?.addresses[0]?.addressLine1 || "")
  const [city, setCity] = useState(lead?.addresses[0]?.city || "")
  const [state, setState] = useState(lead?.addresses[0]?.state || "")
  const [country, setCountry] = useState(
    lead?.addresses[0]?.country || "United States"
  )

  const { data: resp } = useQuery(GET_LEAD_STATUS_TYPES)
  const leadStatusList = resp?.leadStatusTypes || []

  // useEffect(() => {
  //   if (lead && !isEmpty(lead)) {
  //     setFirstName(lead?.firstName || "")
  //     setLastName(lead?.lastName || "")
  //     setPhone(lead?.phoneNumbers[0]?.phone || "")
  //     setEmail(lead?.emails[0]?.email || "")
  //     setLeadStatus(lead?.leadStatusType?.id || "")
  //     setSource(String(lead?.leadSourceOriginalId || ""))
  //   }
  // }, [])

  const { data: sourcesData } = useQuery(GET_LEAD_SOURCES)
  let sourceList = (sourcesData?.leadSources || []).map(el => ({
    text: el?.name,
    value: el?.id,
    isSource: el?.isSource,
  }))
  if (isEmpty(lead)) {
    sourceList = (sourceList || []).filter(el => !el.isSource)
  }
  sourceList = _.orderBy(sourceList, ["text"], ["asc"])

  const getLoading = () => {
    return (
      updateLoading ||
      createLoading ||
      updatePhoneLoading ||
      phoneLoading ||
      updateEmailLoading ||
      createEmailLoading ||
      updateAddressLoading ||
      createAddressLoading ||
      saveNoteLoading
    )
  }

  const [createLead, { loading: updateLoading }] = useMutation(CREATE_LEAD)
  const [updateLead, { loading: createLoading }] = useMutation(UPDATE_LEAD)

  const [updateLeadPhone, { loading: updatePhoneLoading }] = useMutation(
    UPDATE_LEAD_PHONE
  )
  const [createLeadPhone, { loading: phoneLoading }] = useMutation(
    CREATE_LEAD_PHONE
  )
  const [updateLeadEmail, { loading: updateEmailLoading }] = useMutation(
    UPDATE_LEAD_EMAIL
  )
  const [createLeadEmail, { loading: createEmailLoading }] = useMutation(
    CREATE_LEAD_EMAIL
  )

  const [updateLeadAddress, { loading: updateAddressLoading }] = useMutation(
    UPDATE_LEAD_ADDRESS
  )
  const [createLeadAddress, { loading: createAddressLoading }] = useMutation(
    CREATE_LEAD_ADDRESS
  )

  const [updateLeadVehicle, { loading: updateVehicleLoading }] = useMutation(
    UPDATE_LEAD_VEHICLE_OF_INTEREST
  )
  const [createLeadVehicle, { loading: createVehicleLoading }] = useMutation(
    CREATE_LEAD_VEHICLE_OF_INTEREST
  )
  const [deleteLeadVehicle, { loading: deleteLoading }] = useMutation(
    DELETE_LEAD_VEHICLE_OF_INTEREST
  )

  const [createVehicles, { loading: vehicleLoading }] = useMutation(
    CREATE_LEAD_VEHICLES
  )

  const [saveLeadNote, { loading: saveNoteLoading }] = useMutation(
    SAVE_LEAD_NOTE
  )

  const handleSaveLead = async e => {
    if (e) {
      if (isEmpty(firstName)) {
        setError("Please enter first name")
        return
      } else if (isEmpty(lastName)) {
        setError("Please enter last name")
        return
      } else if (isEmpty(phone)) {
        setError("Please enter lead phone")
        return
      } else if (isEmpty(leadStatus)) {
        setError("Please select lead status")
        return
      } else if (isEmpty(source)) {
        setError("Please select lead source")
        return
      }
      let leadId = lead?.id || null
      let leadResp = null
      let _message = ""
      let newLead = lead ? { ...lead } : {}

      if (lead) {
        leadResp = await updateLead({
          variables: {
            id: lead.id,
            fullName: firstName + " " + lastName,
            firstName: firstName,
            lastName: lastName,
            leadSourceOriginal: parseInt(source),
            leadStatusTypeId: parseInt(leadStatus),
            leadStatusDescription: leadDescription,
            phone: phone,
            otherSource: otherSource || "",
          },
        })
        if (leadResp?.data?.updateLead?.statusCode != 200) {
          message.error(leadResp?.data?.updateLead?.message)
          return
        } else {
          _message = leadResp?.data?.updateLead?.message
          newLead = { ...newLead, ...leadResp?.data?.updateLead?.lead }
        }
      } else {
        leadResp = await createLead({
          variables: {
            fullName: firstName + " " + lastName,
            firstName: firstName,
            lastName: lastName,
            leadSourceOriginalId: parseInt(source),
            leadStatusTypeId: parseInt(leadStatus),
            leadStatusDescription: leadDescription,
            phone: phone,
            otherSource: otherSource || "",
            leadSourceType: "MANUAL",
          },
        })
        if (leadResp?.data?.createLead?.statusCode == 200) {
          leadId = parseInt(leadResp?.data?.createLead?.lead?.id)
          _message = leadResp?.data?.createLead?.message
          newLead = { ...newLead, ...leadResp?.data?.updateLead?.lead }
        } else {
          message.error(leadResp?.data?.createLead?.message)
          return
        }
        if (vehicles.length > 0) {
          const voiObject = vehicles.map(e => ({
            make: e.make,
            model: e.model,
            year: e.year,
            isCurrent: e.isCurrent,
            customerInterest: e.customerInterest,
            isPrimary: e?.isPrimary || false,
          }))
          await createVehicles({
            variables: {
              leadId: leadId,
              voiObject: voiObject,
            },
          })
        }
      }

      if (leadId) {
        //update or create phone
        let phoneResp = null
        if (
          (lead?.phoneNumbers || []).length > 0 &&
          lead?.phoneNumbers[0] != null
        ) {
          phoneResp = await updateLeadPhone({
            variables: {
              id: parseInt(lead?.phoneNumbers[0].id),
              phone: phone,
            },
          })
          if (phoneResp?.data?.updateLeadPhone?.statusCode != 200) {
            message.error(phoneResp?.data?.updateLeadPhone?.message)
          } else {
            newLead.phoneNumbers[0] = {
              ...phoneResp?.data?.updateLeadPhone?.leadPhone,
            }
          }
        } else {
          phoneResp = await createLeadPhone({
            variables: {
              leadId: parseInt(leadId),
              phone: phone,
            },
          })
          if (phoneResp?.data?.createLeadPhone?.statusCode != 200) {
            message.error(phoneResp?.data?.createLeadPhone?.message)
          } else {
            newLead = {
              ...newLead,
              phoneNumbers: [
                { ...phoneResp?.data?.createLeadPhone?.leadPhone },
              ],
            }
          }
        }
        //update or create email
        let emailResp = null
        if ((lead?.emails || []).length > 0 && lead?.emails[0] != null) {
          emailResp = await updateLeadEmail({
            variables: {
              id: parseInt(parseInt(lead?.emails[0].id)),
              email: email,
            },
          })
          if (!emailResp?.data?.updateLeadEmail?.ok) {
            message.error("Lead email couldn't update due to internal error")
          } else {
            console.log(
              `emailResp?.data?.updateLeadEmail?.leadEmail`,
              emailResp?.data?.updateLeadEmail?.leadEmail
            )
            newLead.emails[0] = {
              ...emailResp?.data?.updateLeadEmail?.leadEmail,
            }
          }
        } else {
          emailResp = await createLeadEmail({
            variables: {
              leadId: parseInt(leadId),
              email: email,
            },
          })
          if (!emailResp?.data?.createLeadEmail?.leadEmail) {
            message.error("Lead email couldn't create due to internal error")
          } else {
            newLead = {
              ...newLead,
              emails: [{ ...emailResp?.data?.createLeadEmail?.leadEmail }],
            }
          }
        }
        //update or create address
        let addressResp = null
        if ((lead?.addresses || []).length > 0 && lead?.addresses[0] != null) {
          addressResp = await updateLeadAddress({
            variables: {
              id: parseInt(parseInt(lead?.addresses[0].id)),
              addressLine1: address,
              city: city,
              country: country,
              state: state,
            },
          })
          if (!addressResp?.data?.updateLeadAddress?.ok) {
            message.error("Lead address couldn't update due to internal error")
            return
          } else {
            newLead.addresses[0] = {
              ...addressResp?.data?.updateLeadAddress?.leadAddress,
            }
          }
        } else {
          addressResp = await createLeadAddress({
            variables: {
              leadId: parseInt(leadId),
              addressLine1: address,
              city: city,
              country: country,
              state: state,
            },
          })
          if (!addressResp?.data?.createLeadAddress?.leadAddress) {
            message.error("Lead address couldn't create due to internal error")
          } else {
            newLead = {
              ...newLead,
              addresses: [
                { ...addressResp?.data?.createLeadAddress?.leadAddress },
              ],
            }
          }
        }

        if (!isEmpty(leadNote)) {
          saveLeadNote({
            variables: {
              leadId: parseInt(leadId),
              note: leadNote,
            },
          })
        }
        message.success(_message)
        if (refetch) {
          refetch(newLead)
        }
        setModelVisible(false)
      }
    }
  }

  const handleRemoveVehicle = id => {
    showConfirmationModal(MODAL_TITLE, MODAL_CONTENT, () =>
      deleteLeadVehicle({
        variables: {
          id: id,
        },
      })
        .then(resp => {
          if (resp?.data?.deleteLeadVehicleOfInterest?.ok) {
            message.success("Vehicle successfully deleted!")
            setVehicles(prevState => {
              let newState = [...prevState]
              const index = newState.findIndex(el => el.id == id)
              newState.splice(index, 1)
              return newState
            })
          }
        })
        .catch(mutationError => {
          const error = JSON.parse(JSON.stringify(mutationError))
          message.error(
            error?.graphQLErrors && error?.graphQLErrors[0]?.message
          )
        })
    )
  }

  const saveVehicle = payload => {
    if (payload) {
      if (payload?.id) {
        if (lead) {
          updateLeadVehicle({
            variables: {
              id: payload?.id,
              make: payload?.make,
              model: payload?.model,
              year: payload?.year,
              isCurrent: payload.isCurrent,
              isPrimary: payload.isPrimary,
              customerInterest: payload?.customerInterest,
            },
          }).then(resp => {
            if (resp?.data?.updateLeadVehicleOfInterest?.ok) {
              message.success("Vehicle successfully updated!")
            }
          })
        }
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
        if (lead) {
          createLeadVehicle({
            variables: {
              leadId: lead.id,
              make: payload?.make,
              model: payload?.model,
              year: payload?.year,
              isCurrent: payload.isCurrent,
              isPrimary: payload.isPrimary,
              customerInterest: payload?.customerInterest,
            },
          }).then(resp => {
            if (
              resp?.data?.createLeadVehicleOfInterest?.leadVehicleOfInterest
            ) {
              message.success("Vehicle successfully created!")
            }
          })
        }
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

  let sourceText = (sourceList || []).find(el => el.value == source)?.text

  return (
    <Modal
      title={lead ? "Edit Lead" : "Add New Lead"}
      maskClosable={false}
      destroyOnClose={true}
      visible={visibleModal}
      onOk={() => setModelVisible(false)}
      onCancel={() => setModelVisible(false)}
      width={"85%"}
      footer={
        <FooterComponent
          setVisible={() => {
            setModelVisible()
            if (refetch) {
              refetch({ ...lead, vehicleOfInterest: vehicles })
            }
          }}
          saveLead={handleSaveLead}
          loading={getLoading()}
        />
      }
    >
      {error && (
        <Row gutter={[4, 16]}>
          <Col>
            <Alert message={error} type={"error"} showIcon />
          </Col>
        </Row>
      )}
      <Row gutter={[4, 16]}>
        <Col
          xs={{ span: 24 }}
          sm={{ span: 24 }}
          md={{ span: 12 }}
          xl={{ span: 12 }}
          lg={{ span: 12 }}
        >
          <LabelWrap>
            First Name<SpanWrap>*</SpanWrap>
          </LabelWrap>
          <Input
            value={firstName}
            onChange={e => setFirstName(e.target.value)}
          />
        </Col>
        <Col
          xs={{ span: 24 }}
          sm={{ span: 24 }}
          md={{ span: 12 }}
          xl={{ span: 12 }}
          lg={{ span: 12 }}
        >
          <LabelWrap>
            Last Name<SpanWrap>*</SpanWrap>
          </LabelWrap>
          <Input value={lastName} onChange={e => setLastName(e.target.value)} />
        </Col>
      </Row>
      <Row gutter={[4, 16]}>
        <Col
          xs={{ span: 24 }}
          sm={{ span: 24 }}
          md={{ span: 12 }}
          xl={{ span: 12 }}
          lg={{ span: 12 }}
        >
          <LabelWrap>
            Phone<SpanWrap>*</SpanWrap>
          </LabelWrap>
          <PhoneDiv>
            <PhoneInput
              defaultCountry="US"
              value={phone}
              placeholder="Enter phone number"
              onChange={e => {
                setPhone(e)
              }}
            />
          </PhoneDiv>
        </Col>
        <Col
          xs={{ span: 24 }}
          sm={{ span: 24 }}
          md={{ span: 12 }}
          xl={{ span: 12 }}
          lg={{ span: 12 }}
        >
          <LabelWrap>Email</LabelWrap>
          <Input value={email} onChange={e => setEmail(e.target.value)} />
        </Col>
      </Row>
      <Row gutter={[4, 16]}>
        <Col
          xs={{ span: 24 }}
          sm={{ span: 24 }}
          md={{ span: 12 }}
          xl={{ span: 6 }}
          lg={{ span: 6 }}
        >
          <LabelWrap>Address</LabelWrap>
          <Input value={address} onChange={e => setAddress(e.target.value)} />
        </Col>
        <Col
          xs={{ span: 24 }}
          sm={{ span: 24 }}
          md={{ span: 12 }}
          xl={{ span: 6 }}
          lg={{ span: 6 }}
        >
          <LabelWrap>City</LabelWrap>
          <Input value={city} onChange={e => setCity(e.target.value)} />
        </Col>
        <Col
          xs={{ span: 24 }}
          sm={{ span: 24 }}
          md={{ span: 12 }}
          xl={{ span: 6 }}
          lg={{ span: 6 }}
        >
          <LabelWrap>State</LabelWrap>
          <SelectWrap
            showSearch
            value={state}
            placeholder="Select state"
            style={{ width: "100%" }}
            onChange={value => setState(value)}
          >
            {USStates.map((el, i) => (
              <Select.Option key={`key__${i}`} value={el.code}>
                {el.name}
              </Select.Option>
            ))}
          </SelectWrap>
        </Col>
        <Col
          xs={{ span: 24 }}
          sm={{ span: 24 }}
          md={{ span: 12 }}
          xl={{ span: 6 }}
          lg={{ span: 6 }}
        >
          <LabelWrap>Country</LabelWrap>
          <SelectWrap
            value={country || "United States"}
            placeholder="Select country"
            onChange={value => setCountry(value)}
            disabled={country != null}
            style={{ width: "100%" }}
          >
            {Countries.map((el, i) => (
              <Select.Option key={`key__${i}`} value={el.name}>
                {el.name}
              </Select.Option>
            ))}
          </SelectWrap>
        </Col>
      </Row>
      <Row gutter={[4, 16]}>
        <Col
          xs={{ span: 24 }}
          sm={{ span: 24 }}
          md={{ span: 12 }}
          xl={{ span: 12 }}
          lg={{ span: 12 }}
        >
          <LabelWrap>
            Lead Source<SpanWrap>*</SpanWrap>
          </LabelWrap>
          <SelectWrap
            value={source}
            showSearch
            placeholder="Select source"
            onChange={value => setSource(value)}
          >
            {sourceList.map(el => (
              <Select.Option key={el.value} value={el.value}>
                {el.text}
              </Select.Option>
            ))}
          </SelectWrap>
        </Col>
        {sourceText == "Other" && (
          <Col
            xs={{ span: 24 }}
            sm={{ span: 24 }}
            md={{ span: 12 }}
            xl={{ span: 12 }}
            lg={{ span: 12 }}
          >
            <LabelWrap>Other Source</LabelWrap>
            <Input
              value={otherSource}
              onChange={e => setOtherSource(e.target.value)}
            />
          </Col>
        )}
      </Row>
      <Row gutter={[4, 16]}>
        <Col
          xs={{ span: 24 }}
          sm={{ span: 24 }}
          md={{ span: 12 }}
          xl={{ span: 12 }}
          lg={{ span: 12 }}
        >
          <LabelWrap>
            Lead Status<SpanWrap>*</SpanWrap>
          </LabelWrap>
          <SelectWrap
            showSearch
            value={leadStatus}
            placeholder="Select status"
            onChange={value => setLeadStatus(value)}
          >
            {leadStatusList.map(el => (
              <Select.Option key={el.status} value={el.id}>
                {el?.type + " / " + el.status.replace(/_/g, " ")}
              </Select.Option>
            ))}
          </SelectWrap>
        </Col>
        <Col
          xs={{ span: 24 }}
          sm={{ span: 24 }}
          md={{ span: 12 }}
          xl={{ span: 12 }}
          lg={{ span: 12 }}
        >
          <LabelWrap>Reason for status change</LabelWrap>
          <TextArea
            rows={2}
            placeholder={"Type description here"}
            name={"leadDescription"}
            value={leadDescription}
            onChange={e => setLeadDescription(e.target.value)}
          />
        </Col>
      </Row>
      <Row gutter={[4, 16]}>
        <Col
          xs={{ span: 24 }}
          sm={{ span: 24 }}
          md={{ span: 24 }}
          xl={{ span: 24 }}
          lg={{ span: 24 }}
        >
          <LabelWrap>Note</LabelWrap>
          <TextArea
            rows={3}
            placeholder={"Type note here"}
            name={"leadNote"}
            value={leadNote}
            onChange={e => setLeadNote(e.target.value)}
          />
        </Col>
      </Row>
      <Row>
        <Col span={24}>
          <ContainerNavigationWrap>
            <Typography variant={"h4"} weight={"medium"}>
              Vehicles
            </Typography>
          </ContainerNavigationWrap>
        </Col>
      </Row>
      <Row>
        <Col span={24}>
          <AddVehicleForm
            vehicles={vehicles}
            saveVehicle={saveVehicle}
            removeVehicle={handleRemoveVehicle}
            loading={updateVehicleLoading || createVehicleLoading}
            lead={lead}
          />
        </Col>
      </Row>
    </Modal>
  )
}
export default LeadEditModal

const FooterComponent = ({ setVisible, saveLead, loading = false }) => {
  let buttons = [
    <Button key="submit" type="primary" onClick={saveLead} loading={loading}>
      Save
    </Button>,
    <Button key="back" onClick={() => setVisible(false)}>
      Cancel
    </Button>,
  ]

  return buttons
}
