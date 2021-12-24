import React, { useState } from "react"
import { Modal, message, Button } from "antd"
import { useMutation } from "@apollo/react-hooks"
import AddVehicleForm from "../customerList/AddVehicle"
import {
  UPDATE_LEAD_VEHICLE_OF_INTEREST,
  DELETE_LEAD_VEHICLE_OF_INTEREST,
  CREATE_LEAD_VEHICLE_OF_INTEREST,
} from "../../../graphql/mutation"
import { showConfirmationModal } from "../../../library/helpers"

const MODAL_TITLE = `Do you want to continue?`
const MODAL_CONTENT = `When clicked the OK button, it cannot be recovered`

const VehicleModal = ({ visible, onCancel, lead, selectedVehicle }) => {
  const [vehicles, setVehicles] = useState(lead?.vehicleOfInterest || [])
  const [deleteLeadVehicle, { loading: deleteLoading }] = useMutation(
    DELETE_LEAD_VEHICLE_OF_INTEREST
  )

  const [createLeadVehicle, { loading: createVehicleLoading }] = useMutation(
    CREATE_LEAD_VEHICLE_OF_INTEREST
  )

  const [updateLeadVehicle, { loading: updateVehicleLoading }] = useMutation(
    UPDATE_LEAD_VEHICLE_OF_INTEREST
  )

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
              customerInterest: payload?.customerInterest,
              isPrimary: payload.isPrimary,
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
              if (index > -1) {
                newState.splice(index, 1)
              }
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

  return (
    <Modal
      title={`Vehicles`}
      visible={visible}
      onCancel={onCancel}
      width={900}
      footer={[
        <Button key="back" onClick={onCancel}>
          Cancel
        </Button>,
      ]}
    >
      <AddVehicleForm
        vehicles={vehicles}
        saveVehicle={saveVehicle}
        removeVehicle={handleRemoveVehicle}
        loading={updateVehicleLoading || createVehicleLoading}
        lead={lead}
        selectedVehicle={selectedVehicle}
      />
    </Modal>
  )
}
export default VehicleModal
