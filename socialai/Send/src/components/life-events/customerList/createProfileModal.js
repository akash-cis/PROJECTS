import { useMutation, useQuery } from "@apollo/react-hooks"
import { message, Modal } from "antd"
import React, { useEffect, useState } from "react"
import { GET_LEAD_SOURCES, GET_LEAD_STATUS_TYPES } from "../../../graphql/query"
import {
  CREATE_LEAD,
  CREATE_LEAD_EMAIL,
  CREATE_LEAD_PHONE,
  CREATE_LEAD_ADDRESS,
  CREATE_LEAD_VEHICLES,
} from "../../../graphql/mutation"
import { FormButtons, FormGen, STRING, ENUM } from "../../../library/formGen"
import AddVehicleForm from "./AddVehicle"
import { USStates } from "../../../library/usStates"
import isoCodes from "../../../../static/isoCodes.json"

const stateList = USStates.map(el => el.name)

let personFields = [
  {
    dataIndex: "firstName",
    key: "firstName",
    title: "First Name",
    type: STRING,
    nullable: false,
    isDisplay: true,
  },
  {
    dataIndex: "lastName",
    key: "lastName",
    title: "Last Name",
    type: STRING,
    nullable: false,
    isDisplay: true,
  },

  {
    dataIndex: "phone",
    key: "phone",
    title: "Mobile Number",
    type: STRING,
    nullable: false,
    isDisplay: true,
  },
  {
    dataIndex: "email",
    key: "email",
    title: "Email",
    type: STRING,
    nullable: false,
    isDisplay: true,
  },
  {
    dataIndex: "addressLine1",
    key: "addressLine1",
    title: "Address",
    type: STRING,
    nullable: true,
    isDisplay: true,
  },
  {
    dataIndex: "city",
    key: "city",
    title: "City",
    type: STRING,
    nullable: true,
    isDisplay: true,
  },
  {
    dataIndex: "state",
    key: "state",
    title: "State",
    type: ENUM,
    nullable: true,
    options: stateList,
    isDisplay: true,
  },
  {
    dataIndex: "country",
    key: "country",
    title: "Country",
    nullable: true,
    type: ENUM,
    options: isoCodes?.countryCodes,
    isDisplay: true,
  },
  {
    dataIndex: "leadStatusType",
    key: "leadStatusType",
    title: "Lead Status Type",
    type: ENUM,
    nullable: false,
    options: [],
    isDisplay: true,
  },
  {
    dataIndex: "leadSourceOriginalId",
    key: "leadSourceOriginalId",
    title: "Source",
    type: ENUM,
    nullable: true,
    options: [],
    isDisplay: true,
  },
  {
    dataIndex: "otherSource",
    key: "otherSource",
    title: "Other Source",
    type: STRING,
    nullable: true,
    isDisplay: false,
  },
]

export const CreateProfileModal = ({ visible, refetch, onCancel }) => {
  const [saveLoading, setLoading] = useState(false)
  const [vehicles, setVehicles] = useState([])
  const [createLead, { loading: leadLoading }] = useMutation(CREATE_LEAD)
  const [createLeadPhone, { loading: phoneLoading }] = useMutation(
    CREATE_LEAD_PHONE
  )
  const [createLeadEmail, { loading: emailLoading }] = useMutation(
    CREATE_LEAD_EMAIL
  )
  const [createLeadAddress, { loading: addressLoading }] = useMutation(
    CREATE_LEAD_ADDRESS
  )
  const [createVehicles, { loading: vehicleLoading }] = useMutation(
    CREATE_LEAD_VEHICLES
  )

  const { data: sourcesData } = useQuery(GET_LEAD_SOURCES)
  let sources = _.orderBy(sourcesData?.leadSources, ["name"], ["asc"])

  useEffect(() => {
    if (leadLoading) {
      setLoading(true)
    } else if (addressLoading) {
      setTimeout(() => {
        setLoading(false)
      }, 500)
    }
  }, [leadLoading, phoneLoading, emailLoading, addressLoading])

  sources = (sources || [])
    .filter(el => !el.isSource)
    .map(source => [source?.name, source?.id])

  const findIndex = personFields.findIndex(
    e => e.key === "leadSourceOriginalId"
  )
  if (findIndex > -1) {
    personFields[findIndex]["options"] = sources
  }

  const { data: resp } = useQuery(GET_LEAD_STATUS_TYPES)
  const leadStatusList = (resp?.leadStatusTypes || []).map(e => [
    e?.type + " / " + e?.status.replace(/_/g, " "),
    e?.id,
  ])
  const indx = personFields.findIndex(e => e.key === "leadStatusType")
  if (indx > -1) {
    personFields[indx]["options"] = leadStatusList
  }

  const key = "__KEY"
  const submitHandler = async data => {
    try {
      const res = await createLead({
        variables: {
          firstName: data?.firstName,
          lastName: data?.lastName,
          fullName: `${data.firstName} ${data.lastName}`,
          leadSourceType: "MANUAL",
          leadSourceOriginalId: parseInt(data?.leadSourceOriginalId),
          phone: data?.phone,
          leadStatusTypeId: parseInt(data?.leadStatusType),
          otherSource: data?.otherSource || "",
        },
      })
      if (res?.data?.createLead?.statusCode == 200) {
        const personId = parseInt(res?.data?.createLead?.lead?.id)
        await createLeadPhone({
          variables: {
            leadId: personId,
            phone: data?.phone,
          },
        })
        if ("email" in data)
          await createLeadEmail({
            variables: {
              leadId: personId,
              email: data?.email,
            },
          })
        if ("addressLine1" in data || "city" in data || "state" in data)
          await createLeadAddress({
            variables: {
              leadId: personId,
              addressLine1: data?.addressLine1,
              city: data?.city,
              state: data?.state || "",
              country: data?.country || "",
            },
          })
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
              leadId: personId,
              voiObject: voiObject,
            },
          })
        }
        message.loading({ content: "Saving", key, duration: 20 })
        await refetch()
        message.success({ content: "Sucess", key })
        onCancel()
      } else {
        message.error(res?.data?.createLead?.message)
        setLoading(false)
      }
    } catch (e) {
      console.error(e)
      message.error({ content: "Error", key })
      setLoading(false)
    }
  }
  const formId = "person_form"

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

  const handleRemoveVehicle = id => {
    setVehicles(prevState => {
      let newState = [...prevState]
      const index = newState.findIndex(el => el.id == id)
      if (index > -1) {
        newState.splice(index, 1)
      }
      return newState
    })
  }

  return (
    <Modal
      title={`Add Lead`}
      visible={visible}
      onCancel={onCancel}
      width={"50%"}
      footer={
        <FormButtons
          formId={formId}
          onCancel={onCancel}
          loading={saveLoading}
        />
      }
    >
      <>
        <FormGen
          submitHandler={submitHandler}
          formId={formId}
          fields={personFields}
          initialValue={{
            leadSourceOriginalId: sources.length > 0 ? sources[0][1] : "",
            leadStatusType:
              leadStatusList.length > 0 ? leadStatusList[0][1] : "",
          }}
        />

        <AddVehicleForm
          vehicles={vehicles}
          saveVehicle={saveVehicle}
          removeVehicle={handleRemoveVehicle}
        />
      </>
    </Modal>
  )
}
