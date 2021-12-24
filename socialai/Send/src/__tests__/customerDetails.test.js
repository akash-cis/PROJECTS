import React from "react"
import { render, wait } from "@testing-library/react"
import { CustomerDetails } from "../components/life-events/customerDetails"
import { MockedProvider } from "@apollo/react-testing"
import { GET_PERSON } from "../graphql/query"
import { SectionsWithSidebar } from "../components/life-events/sectionsWithSidebar"
import { Communication, Background } from "../components/life-events/sections"
import { Divider } from "../library/basicComponents"

// If having troubles with MockedProvider, please check the current version
// of @apollo/react-testing
// It should match @apollo/react-hooks
// Somewhat related: https://github.com/apollographql/react-apollo/issues/3169
const mocks = [
  {
    request: {
      query: GET_PERSON,
      variables: { id: 1 },
    },
    result: {
      data: {
        person: {
          id: 1,
          addresses: [
            {
              id: 1,
              line1: "GQLand NW 1234",
            },
          ],
          emails: [
            {
              id: 1,
              address: "hi@ambros.io",
            },
          ],
        },
      },
    },
  },
]

// Mock hooks
jest.mock("../hooks", () => {
  return {
    useBasePath: () => "/clm/21",
  }
})

test.skip("Renders sidebar elements", async () => {
  const { getByText } = render(
    <SectionsWithSidebar data={mocks[0].result.data.person}>
      <Communication path="/communication" />
      <Background path="/background" />
    </SectionsWithSidebar>
  )

  // Sidebar renders the components' names as its elements
  expect(getByText("Communication"))
  expect(getByText("Background"))
})

test.skip("Renders first child component when currentSection is not provided", async () => {
  const { getByText } = render(
    <SectionsWithSidebar data={mocks[0].result.data.person}>
      <Communication path="/communication" />
      <Background path="/background" />
    </SectionsWithSidebar>
  )

  // Communication has emails and addresses
  expect(getByText("Emails"))
  expect(getByText("Addresses"))
})

test.skip("Renders currentSection", async () => {
  // Background is first so by default it should render Background
  // But if we pass currentSection it should render communication
  const { getByText } = render(
    <SectionsWithSidebar
      data={mocks[0].result.data.person}
      currentSection="communication"
    >
      <Background path="/background" />
      <Communication path="/communication" />
    </SectionsWithSidebar>
  )

  // Communication has emails and addresses
  expect(getByText("Emails"))
  expect(getByText("Addresses"))
})

// CustomerDetails wraps SectionsWithSidebar to provide routing and data
test.skip("Render section passed by router", async () => {
  const { getByText } = render(
    <MockedProvider mocks={mocks} addTypename={false}>
      <CustomerDetails id={1} section="communication" uri="/clm" />
    </MockedProvider>
  )

  // Apollo updates our component from the inside
  // we need to explicitely wait for for those updates
  // https://kentcdodds.com/blog/fix-the-not-wrapped-in-act-warning
  await wait()
  // Communication has emails and addresses
  expect(getByText("Emails"))
  expect(getByText("Addresses"))
})

test.skip("Renders dividers", () => {
  const { getByTestId } = render(
    <SectionsWithSidebar
      data={mocks[0].result.data.person}
      currentSection="communication"
    >
      <Divider divider data-testid="divider" />
    </SectionsWithSidebar>
  )

  // By testid added above
  expect(getByTestId("divider"))
})
