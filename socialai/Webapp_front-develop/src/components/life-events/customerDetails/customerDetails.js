import React, { useContext } from "react"
import { navigate } from "gatsby"
import { useQuery, useMutation } from "@apollo/react-hooks"
import { Layout } from "../layout"
import { SectionsWithSidebar } from "../sectionsWithSidebar"
import { Communication, Profile, VehicleOfInterest } from "../sections"
import { GET_LEAD, GET_LEAD_DESCRIPTOR } from "../../../graphql/query"
import { Button } from "antd"
import { Spacer } from "../../../library/utils"
import { DetailsProvider } from "./context"
import { createColumnsFromDescriptorArray } from "./helpers"
import { TabContext } from "../../../library/tabs"
import isUndefined from "lodash/isUndefined"

const LayoutButtons = ({ uri }) => {
  return (
    <Spacer>
      <Button onClick={() => navigate(uri)}>Back</Button>
    </Spacer>
  )
}

const BackButton = ({ tabContext, onClick }) => {
  return (
    <Spacer>
      <Button
        onClick={e => {
          tabContext.setActiveTab("lead-center")
          onClick(e)
          navigate("/engagements")
        }}
      >
        Back
      </Button>
    </Spacer>
  )
}

// Id and section are injected by router
// /clm/:id/:section
// Dividers are rendered with divider prop
export const CustomerDetails = ({
  id: stringId,
  section,
  location,
  uri,
  onBackClick = () => {},
}) => {
  const tabContext = useContext(TabContext)
  const id = Number(stringId)
  // const { data, refetch } = useQuery(GET_PERSON, { variables: { id } })

  // const person = data?.person
  const { data, refetch } = useQuery(GET_LEAD, { variables: { id } })

  const lead = data?.lead

  const { data: descriptor } = useQuery(GET_LEAD_DESCRIPTOR, {
    variables: { id },
  })

  const fields = createColumnsFromDescriptorArray(descriptor?.leadDescriptor)

  const back = `${uri
    ?.split("/")
    .slice(0, 3)
    .join("/")}`

  return (
    <Layout
      title="Customer Details"
      buttons={
        !isUndefined(uri) ? (
          <LayoutButtons uri={back} />
        ) : (
          <BackButton tabContext={tabContext} onClick={onBackClick} />
        )
      }
    >
      <DetailsProvider refetch={refetch} lead={lead} fields={fields} id={id}>
        <SectionsWithSidebar
          data={lead}
          currentSection={section}
          hasTabView={isUndefined(uri)}
        >
          <Profile path="/profile" icon="user" />
          <Communication path="/communication" icon="mail" />
          <VehicleOfInterest
            title="Vehicles"
            path="/vehicle_of_interest"
            icon="car"
          />
        </SectionsWithSidebar>
      </DetailsProvider>
    </Layout>
  )
}

export default CustomerDetails
