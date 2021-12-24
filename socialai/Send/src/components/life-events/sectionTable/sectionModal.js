import { useMutation } from "@apollo/react-hooks"
import { message, Modal } from "antd"
import React, { useContext } from "react"
import { GET_PERSON } from "../../../graphql/query"
import { FormButtons, FormGen } from "../../../library/formGen"
import { toKebabCase } from "../../../utils"
import { DetailsContext } from "../customerDetails/context"
import isUndefined from "lodash/isUndefined"
import isEmpty from "lodash/isEmpty"

const unsafeDirectCacheWrite = ({ id, client, modelName, newData }) => {
  const queryResult = client.readQuery({
    query: GET_PERSON,
    variables: { id },
  })

  if (queryResult) {
    const { person } = queryResult

    // Get current model data
    const modelData = person[modelName] ? person[modelName] : []

    const data = { person: { ...person, [modelName]: [...modelData, newData] } }
    client.writeQuery({ query: GET_PERSON, variables: { id }, data })
    return Promise.resolve(true)
  }

  return Promise.resolve(false)
}

export const modalStatuses = {
  HIDDEN: "hidden",
  CREATING: "creating",
  EDITING: "editing",
}

export const SectionModal = ({
  modelName,
  status,
  fields,
  onOk,
  onCancel,
  mutation,
  submitHandler,
  initialData,
  forceFields,
}) => {
  const title = toKebabCase(modelName)
  const { refetch, id } = useContext(DetailsContext)
  const formId = `form_${id}__${modelName}`

  // const client = useApolloClient()
  const [mutate] = useMutation(mutation)

  const key = "__key"
  // Check if has a submit handler, if not use default
  const _submitHandler = submitHandler
    ? submitHandler
    : async data => {
        // Function definition starts here!
        // Mutation
        try {
          message.loading({ content: "Saving", key, duration: 100 })
          // const personData = { ...data, personId: id }
          // if (status == modalStatuses.EDITING) {
          //   personData.id = initialData.id
          // }

          // await mutate({ variables: { personData: personData } })
          const leadData = { ...data, leadId: id }
          if (status == modalStatuses.EDITING) {
            leadData.id = initialData.id
          }
          await mutate({ variables: leadData })

          // Local cache write
          // await unsafeDirectCacheWrite({ id, client, data })

          await refetch()
          message.success({ content: "Sucess", key })
          onCancel()
        } catch (e) {
          console.error(e)
          message.error({ content: "Error", key })
        }
      }

  return (
    <Modal
      title={`${status == modalStatuses.EDITING ? "Edit" : "Add"} ${title ||
        ""}`}
      visible={status !== modalStatuses.HIDDEN}
      onCancel={onCancel}
      footer={<FormButtons onCancel={onCancel} formId={formId} />}
    >
      <FormGen
        formId={formId}
        fields={fields}
        forceFields={forceFields}
        submitHandler={data => {
          if (
            fields[0]?.key == "phone" &&
            (isUndefined(data?.phone) || isEmpty(data?.phone))
          ) {
            message.error("Please enter phone number.")
            return
          }
          if (
            fields[0]?.key == "email" &&
            (isUndefined(data?.email) || isEmpty(data?.email))
          ) {
            message.error("Please enter email.")
            return
          }
          _submitHandler(data, {
            mutate,
            id,
            refetch,
            onCancel,
            status,
            initialData,
          })
        }}
        initialValue={initialData}
      />
    </Modal>
  )
}
