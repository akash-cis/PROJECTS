import React from "react"
import { SectionTable } from "../sectionTable"
import { modalStatuses } from "../sectionTable/sectionModal"
import { STRING, ENUM } from "../../../library/formGen"
import {
  CREATE_PERSON_USER_ACCOUNT,
  UPDATE_USER_ACCOUNT,
  UNASSIGN_USER_ACCOUNT,
} from "../../../graphql/mutation"
import { ALL_UNIQUE_SOURCES } from "../../../graphql/query"
import { actionsWithLoading } from "../../../utils"
import { useQuery, useMutation } from "@apollo/react-hooks"

// This is for the form and table to know how to display/ask data
const personFields = [
  {
    dataIndex: "username",
    key: "username",
    title: "User name",
    type: STRING,
  },
  {
    dataIndex: "profileUrl",
    key: "profileUrl",
    title: "Profile URL",
    type: STRING,
  render: (data) => <a target="_blank" href={data}>{data}</a>
  },
]

const personSubmitHandler = async (
  data,
  { mutate, id, refetch, status, initialData, onCancel }
) => {
  let variables

  if (status === modalStatuses.EDITING) {
    // Added this condition to undo the hack that was made in communication.js.
    if (initialData.source.name === data.sourceId) {
      data.sourceId = initialData.source.id
    }
    variables = { personData: { ...data, id: initialData.id } }
  } else {
    variables = { personData: { ...data }, personId: id }
  }

  const mutationCallback = () => mutate({ variables })

  actionsWithLoading([mutationCallback, refetch, onCancel])
}

const removeHandler = async ({ mutate, refetch, person, row }) => {
  const mutationCallback = () =>
    mutate({ variables: { personId: person.id, accountId: row.id } })
  actionsWithLoading([mutationCallback, refetch])
}

export const SocialAccounts = ({ dataSource }) => {
  const { data } = useQuery(ALL_UNIQUE_SOURCES, {
    variables: { exclude: ["DEALER", "FORUM", "COMPANY_SOURCE", "CRAIGSLIST"] },
  })

  const sources = data?.allUniqueSources?.map(source => [
    source?.sourceType,
    source?.id,
  ])
  const sourcesEnum = {
    dataIndex: "sourceId",
    key: "sourceId",
    title: "Source",
    type: ENUM,
    options: sources,
  }
  const personFieldsWithSources = [...personFields, sourcesEnum]

  return (
    <SectionTable
      modelName="socialAccount"
      sectionName="socialAccounts"
      dataSource={dataSource}
      columns={personFieldsWithSources}
      mutation={CREATE_PERSON_USER_ACCOUNT}
      updateMutation={UPDATE_USER_ACCOUNT}
      removeMutation={UNASSIGN_USER_ACCOUNT}
      removeHandler={removeHandler}
      submitHandler={personSubmitHandler}
      withModifyButtons
      forceFields={{
        sourceId: {
          placeholder: "Select source",
        },
      }}
    />
  )
}
