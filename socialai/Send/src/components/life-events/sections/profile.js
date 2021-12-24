import React from "react"
import { SectionTable } from "../sectionTable"
import { TablesContainer } from "./elements"
import { useQuery } from "@apollo/react-hooks"

import { UPDATE_LEAD } from "../../../graphql/mutation"
import { message } from "antd"
import { GET_LEAD_SOURCES, GET_LEAD_STATUS_TYPES } from "../../../graphql/query"

import { DATE_FORMAT, STRING, DATETIME, ENUM } from "../../../library/formGen"

let personFields = [
  {
    dataIndex: "firstName",
    key: "firstName",
    title: "First Name",
    type: STRING,
    render: (text, record) =>
      record.id && record.firstName === "" ? "Unknown" : text,
  },
  {
    dataIndex: "lastName",
    key: "lastName",
    title: "Last Name",
    type: STRING,
    render: (text, record) =>
      record.id && record.lastName === "" ? "Unknown" : text,
  },
  {
    dataIndex: "dateOfBirth",
    key: "dateOfBirth",
    title: "Date of birth",
    type: DATETIME,
    nullable: true,
  },
  {
    dataIndex: "leadSource",
    key: "leadSource",
    title: "Lead Source",
    type: ENUM,
    nullable: true,
    options: [],
  },
  {
    dataIndex: "leadStatusType",
    key: "leadStatusType",
    title: "Lead Status Type",
    type: ENUM,
    nullable: true,
    options: [],
  },
]

export const Profile = ({ data }) => {
  const { data: sourcesData } = useQuery(GET_LEAD_SOURCES)
  let sources = _.orderBy(
    sourcesData?.leadSources,
    ["isSource", "id"],
    ["asc", "asc"]
  )
  sources = (sources || []).map(source => [source?.name, source?.id])
  const findIndex = personFields.findIndex(e => e.key === "leadSource")
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

  const profileData = [
    {
      firstName: data?.firstName,
      lastName: data?.lastName,
      dateOfBirth: data?.dateOfBirth,
      id: data?.id,
      leadSourceType: data?.leadSourceType,
      leadSource: data?.leadSource?.name || "",
      leadSourceOriginalId: data?.leadSourceOriginalId || 0,
      leadStatusType:
        data?.leadStatusType?.type +
        " / " +
        (data?.leadStatusType?.status || "").replace(/_/g, " "),
      leadStatusTypeId: data?.leadStatusType?.Id,
    },
  ]

  const submitHandler = async (data, { mutate, id, refetch, onCancel }) => {
    const key = "__KEY"
    try {
      message.loading({ content: "Saving", key, duration: 100 })
      const leadData = {
        id,
        firstName: data.firstName,
        lastName: data.lastName,
        fullName: `${data.firstName} ${data.lastName}`,
        dateOfBirth: data?.dateOfBirth
          ? data?.dateOfBirth.format(DATE_FORMAT)
          : null,
        leadSourceOriginal: parseInt(data.leadSource),
        leadStatusTypeId: parseInt(data.leadStatusType),
      }

      await mutate({ variables: leadData })

      await refetch()
      message.success({ content: "Sucess", key })
      onCancel()
    } catch (e) {
      console.error(e)
      message.error({ content: "Error", key })
    }
  }

  return (
    <>
      <TablesContainer>
        <SectionTable
          sectionName="profile"
          dataSource={profileData}
          withModifyButtons
          updateMutation={UPDATE_LEAD}
          submitHandler={submitHandler}
          modalFields={personFields}
          columns={personFields}
        />
      </TablesContainer>
    </>
  )
}
