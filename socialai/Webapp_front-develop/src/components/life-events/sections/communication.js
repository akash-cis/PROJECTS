import React, { useContext } from "react"
import { SectionTable } from "../sectionTable"
import { TablesContainer } from "./elements"
import { SocialAccounts } from "./socialAccounts"
import { STRING, ENUM } from "../../../library/formGen"
import isoCodes from "../../../../static/isoCodes.json"
import { DetailsContext } from "../customerDetails/context"
import { filterFieldsByDataIndex } from "../../../utils/filterFieldsByDataIndex"
import { USStates } from "../../../library/usStates"

// We get the data from parent sectionsWithSidebar
export const Communication = ({ data, onSaveNew }) => {
  // Map model in backend
  const accountsData = data?.accounts?.map(({ account }) => ({
    ...account,
    // Little hack because it has to match the columns things, see socialAccounts
    sourceId: account?.source?.name,
  }))

  const { fields } = useContext(DetailsContext)
  const stateList = USStates.map(el => el.name)

  return (
    <TablesContainer>
      <SectionTable
        modelName="address"
        sectionName="addresses"
        columns={filterFieldsByDataIndex(
          [
            "locationText",
            "addressLine1",
            "addressLine2",
            "city",
            "state",
            "postalCode",
            "country",
          ],
          fields.addresses
        )}
        modalFields={fields.addresses}
        forceFields={{
          state: {
            dataIndex: "state",
            key: "state",
            title: "State",
            nullable: false,
            type: ENUM,
            options: stateList,
          },
          country: {
            dataIndex: "country",
            key: "country",
            title: "Country",
            nullable: true,
            type: ENUM,
            options: isoCodes?.countryCodes,
          },
          addressLine_1: {
            dataIndex: "addressLine1",
            key: "addressLine_1",
            title: "Address Line 1",
            nullable: true,
            type: STRING,
            placeholder: "Enter first line",
          },
          addressLine_2: {
            dataIndex: "addressLine2",
            key: "addressLine_2",
            title: "Address Line 2",
            nullable: true,
            type: STRING,
            placeholder: "Enter another line",
          },
        }}
        withModifyButtons
      />
      <SectionTable
        modelName="email"
        sectionName="emails"
        modalFields={(fields.emails || []).filter(
          x => x.title !== "Email Type"
        )}
        columns={fields.emails}
        withModifyButtons
      />
      <SectionTable
        modelName="phone"
        sectionName="phoneNumbers"
        withModifyButtons
        modalFields={(fields.phoneNumbers || []).filter(
          x => x.title !== "Lookup Type" && x.title !== "Phone Type"
        )}
        columns={fields.phoneNumbers}
        forceFields={{
          number: {
            placeholder: "Enter phone number",
          },
        }}
      />
      {/* <SectionTable
        modelName="language"
        sectionName="languages"
        forceFields={{
          language: {
            dataIndex: "language",
            key: "language",
            title: "Language",
            nullable: true,
            type: ENUM,
            options: isoCodes?.langCodes,
          },
        }}
        withModifyButtons
      /> */}

      {/* <SocialAccounts dataSource={accountsData} /> */}
    </TablesContainer>
  )
}
export default Communication
