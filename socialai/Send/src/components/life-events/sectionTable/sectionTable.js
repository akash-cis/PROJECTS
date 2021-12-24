import gql from "graphql-tag"
import { Button, Table, Modal } from "antd"
import moment from "moment"
import PropTypes from "prop-types"
import React, { useContext, useState } from "react"
import VehicleModal from "../customerList/VehicleModal"
// import { PERSON_MUTATION } from "../../../graphql/mutation"
import {
  CREATE_LEAD_ADDRESS,
  CREATE_LEAD_EMAIL,
  CREATE_LEAD_PHONE,
  CREATE_LEAD_VEHICLE_OF_INTEREST,
  UPDATE_LEAD_ADDRESS,
  UPDATE_LEAD_EMAIL,
  UPDATE_LEAD_PHONE,
  UPDATE_LEAD_VEHICLE_OF_INTEREST,
  DELETE_LEAD_ADDRESS,
  DELETE_LEAD_EMAIL,
  DELETE_LEAD_PHONE,
  DELETE_LEAD_VEHICLE_OF_INTEREST,
} from "../../../graphql/mutation"
import { CenteredContainer, IconCustom } from "../../../library/basicComponents"
import {
  getColumnsFromDataSource,
  toCamel,
  toKebabCase,
  toSnake,
} from "../../../utils"
import { DetailsContext } from "../customerDetails/context"
import { Container, TableContainer, TitleContainer } from "./elements"
import { SectionModal, modalStatuses } from "./sectionModal"
import ModifyButtons from "../../../library/modifyButtons"
import { useMutation } from "@apollo/react-hooks"
import { formatPhoneNumber, parsePhoneNumber } from "react-phone-number-input"
// This component renders a table and a form based on the dataSource and columns
// If the above is not passed, it expects to have available a `person` object
// That object will live in the Details Context
// That object is expected to have a key with the same name as the sectionName prop

// If columns are not pased, it expects to have available a `fields` object
// That object will live in Details Context
// That object is expected to have a key with the same name as sectionName

// The objecs within `fields` have a special structure
// See `createColumnsFromDescriptorArray` here and `personDescriptor` in GraphQL backend
export const SectionTable = ({
  modelName,
  sectionName,
  dataSource,
  columns,
  mutation,
  submitHandler,
  removeHandler,
  removeMutation,
  updateMutation,
  withModifyButtons,
  forceFields,
  modalFields,
}) => {
  const { lead, fields, refetch } = useContext(DetailsContext)
  const key = toCamel(sectionName)

  // Get data and columns from context or props, fallback on an empty array
  const _dataSource = dataSource ? dataSource : lead ? lead[key] : []

  const [modalStatus, setModalStatus] = useState(modalStatuses.HIDDEN)
  const [editableRow, setEditableRow] = useState(null)
  const [vehicleModal, setVehicleModal] = useState(false)

  let _columns = columns // First check for explicit columns
    ? columns
    : dataSource
    ? getColumnsFromDataSource(dataSource) // Then dataSource columns
    : fields // Then fields context
    ? fields[key]
    : [] // If anything, fallback on array

  if (_columns) {
    _columns = [
      ..._columns.map(x => {
        if (x.type === "DateTime") {
          x.render = data => {
            try {
              return moment(data.split("T")[0], "YYYY-MM-DD").format("LL")
            } catch {
              console.log("Couldn't parse date ", data)
            }
            return data
          }
        }
        if (x.key === "phone") {
          x.render = data => {
            try {
              return formatPhoneNumber(data)
            } catch {
              console.log("Couldn't parse date ", data)
            }
            return data
          }
        }
        return x
      }),
    ]
  } else {
    _columns = []
  }

  const mutationKey = toSnake(modelName)?.toUpperCase()

  const LEAD_MUTATION = {
    CREATE_LEAD_ADDRESS,
    CREATE_LEAD_EMAIL,
    CREATE_LEAD_PHONE,
    CREATE_LEAD_VEHICLE_OF_INTEREST,
    UPDATE_LEAD_ADDRESS,
    UPDATE_LEAD_EMAIL,
    UPDATE_LEAD_PHONE,
    UPDATE_LEAD_VEHICLE_OF_INTEREST,
    DELETE_LEAD_ADDRESS,
    DELETE_LEAD_EMAIL,
    DELETE_LEAD_PHONE,
    DELETE_LEAD_VEHICLE_OF_INTEREST,
  }
  const mutationField = `CREATE_LEAD_${mutationKey}`
  const updateMutationField = `UPDATE_LEAD_${mutationKey}`
  const removeMutationField = `DELETE_LEAD_${mutationKey}`
  const _mutation = mutation ? mutation : LEAD_MUTATION[mutationField]
  const _updateMutation =
    (updateMutation ? updateMutation : LEAD_MUTATION[updateMutationField]) ||
    _mutation
  const _removeMutation = removeMutation || LEAD_MUTATION[removeMutationField]

  const [remove] = useMutation(
    _removeMutation ||
      gql`
        mutation {
          placeholder
        }
      `
  )

  if (withModifyButtons) {
    // Edit and delete buttons
    const modifyButtons = {
      key: "buttons",
      render: row => {
        return (
          <ModifyButtons
            id={row.id}
            edit={() => {
              setEditableRow(row)
              if (sectionName == "vehicleOfInterest") {
                setVehicleModal(true)
              } else {
                setModalStatus(modalStatuses.EDITING)
              }
            }}
            remove={
              removeHandler
                ? () => {
                    removeHandler({ mutate: remove, refetch, lead, row })
                  }
                : _removeMutation
                ? async () => {
                    await remove({ variables: { id: row.id } })
                    await refetch()
                  }
                : null
            }
          />
        )
      },
    }
    _columns.push(modifyButtons)
  }

  return (
    <>
      <Container>
        <TitleContainer>
          <p data-testid="name">
            {toKebabCase(
              sectionName == "vehicleOfInterest" ? "vehicles" : sectionName
            )}
          </p>
          {// If no mutation is found, do not render button neither modal
          _mutation && (
            <>
              <Button
                type="primary"
                onClick={() => {
                  if (sectionName == "vehicleOfInterest") {
                    setVehicleModal(true)
                  } else {
                    setModalStatus(modalStatuses.CREATING)
                  }
                  setEditableRow(null)
                }}
              >
                Add{" "}
                {toKebabCase(
                  sectionName == "vehicleOfInterest" ? "vehicle" : sectionName
                )}
                <IconCustom type="plus-circle" />
              </Button>
            </>
          )}

          {(_mutation || _updateMutation) &&
            modalStatus !== modalStatuses.HIDDEN && (
              <SectionModal
                key={modalStatus}
                status={modalStatus}
                modelName={modelName}
                fields={modalFields || _columns}
                onCancel={() => setModalStatus(modalStatuses.HIDDEN)}
                mutation={
                  modalStatus === modalStatuses.EDITING
                    ? _updateMutation
                    : _mutation
                }
                submitHandler={submitHandler}
                initialData={
                  modalStatus === modalStatuses.EDITING
                    ? editableRow
                    : { country: "USA", state: "Texas" }
                }
                forceFields={forceFields}
              />
            )}
        </TitleContainer>
        {sectionName && _dataSource && _dataSource?.length > 0 && (
          <TableContainer>
            <Table
              pagination={false}
              dataSource={_dataSource}
              columns={_columns}
              rowKey="id"
            />
          </TableContainer>
        )}
        {(!_dataSource || _dataSource?.length === 0) && (
          <CenteredContainer minHeight="100px">
            Not enough data to display
          </CenteredContainer>
        )}
      </Container>
      {vehicleModal && (
        <VehicleModal
          visible={vehicleModal}
          onCancel={() => {
            setVehicleModal(false)
            refetch()
          }}
          lead={lead}
          selectedVehicle={editableRow}
        />
      )}
    </>
  )
}

SectionTable.propTypes = {
  modelName: PropTypes.string,
  sectionName: PropTypes.string.isRequired,
}
