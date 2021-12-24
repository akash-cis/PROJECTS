import React from "react"
import { render, fireEvent } from "@testing-library/react"
import { SectionTable } from "../components/life-events/sectionTable"
import {
  getColumnsFromDataSource,
  getColumnsFromFields,
} from "../utils/getColumnsFromDataSource"
import {
  dataSource,
  columns,
  displayedData,
} from "./__fixtures__/customerDetail"
import ModifyButtons from "../library/modifyButtons"
import { createObjectFromDescriptorArray, createColumnsFromDescriptorArray } from "../components/life-events/customerDetails/helpers"

test.skip("Get columns from dataSource structure", () => {
  const modifyButtons = {
    key: "buttons",
    render: ({ id }) => <ModifyButtons />,
  }
  const columnsWithButtons = [...columns, modifyButtons]

  expect(getColumnsFromDataSource(dataSource)).toEqual(columnsWithButtons)
})

test.skip("SectionDetail layout", () => {
  const sectionName = "Customer"
  const { getByTestId, getByText } = render(
    <SectionTable sectionTitle={sectionName} sectionData={dataSource} />
  )

  // Title
  expect(getByTestId("name")).toHaveTextContent(sectionName)
  // Add new Button
  expect(getByText(`Add ${sectionName.toLowerCase()}`))
})

test.skip("Table renders columns by dataSource", () => {
  const sectionName = "Customer"
  const { getByText } = render(
    <SectionTable sectionTitle={sectionName} sectionData={dataSource} />
  )

  // Table Generation
  // It needs to show all the tables with the capitalized key
  for (let column of columns) {
    if (!column.title)
      throw new Error(
        "Fixture broken, please add a fixture that contains a name"
      )
    expect(getByText(column.title))
  }
})

test.skip("Table renders data by dataSource", () => {
  const sectionName = "Customer"
  const { getByText } = render(
    <SectionTable sectionTitle={sectionName} sectionData={dataSource} />
  )

  // Table Generation
  // Check if all values from data are shown
  displayedData
    .map(data => Object.values(data))
    .reduce((acc, curr) => [...acc, ...curr], [])
    .forEach(value => expect(getByText(String(value))))
})

test.skip("Shows not enough data message when passed null", () => {
  const sectionName = "Customer"
  const { getByText } = render(<SectionTable sectionTitle={sectionName} />)

  expect(getByText("Not enough data to display"))
})

test.skip("Shows not enough data message when passed an empty list", () => {
  const sectionName = "Customer"
  const { getByText } = render(
    <SectionTable sectionTitle={sectionName} sectionData={[]} />
  )

  expect(getByText("Not enough data to display"))
})

test.skip("Click on Add button displays modal", async () => {
  const sectionName = "Customer"
  const { getByText, getByTestId } = render(
    <SectionTable sectionTitle={sectionName} sectionData={dataSource} />
  )

  const addButton = getByText(`Add ${sectionName.toLowerCase()}`)
  // Add new Button
  expect(addButton)
  // Click new button
  await fireEvent.click(addButton)
  expect(getByText("Save"))

  for (let column of columns) {
    // Input
    expect(getByTestId(`form_field__${column?.dataIndex}`))
    // Label
    expect(column?.title)
  }
})

const fields = [
  {
    modelName: "sources_detail",
    fields: [],
  },
  {
    modelName: "addresses",
    fields: [
      {
        name: "type",
        nullable: false,
        type: "String",
      },
      {
        name: "current",
        nullable: false,
        type: "Boolean",
      },
      {
        name: "line1",
        nullable: true,
        type: "String",
      },
      {
        name: "line2",
        nullable: true,
        type: "String",
      },
      {
        name: "locality",
        nullable: true,
        type: "String",
      },
      {
        name: "region",
        nullable: true,
        type: "String",
      },
      {
        name: "country",
        nullable: true,
        type: "String",
      },
      {
        name: "latitude",
        nullable: true,
        type: "String",
      },
      {
        name: "longitude",
        nullable: true,
        type: "String",
      },
      {
        name: "location",
        nullable: true,
        type: "String",
      },
    ],
  },
  {
    modelName: "images",
    fields: [
      {
        name: "type",
        nullable: false,
        type: "String",
      },
      {
        name: "url",
        nullable: false,
        type: "String",
      },
    ],
  },
  {
    modelName: "emails",
    fields: [
      {
        name: "type",
        nullable: false,
        type: "String",
      },
      {
        name: "address",
        nullable: false,
        type: "String",
      },
    ],
  },
  {
    modelName: "phone_numbers",
    fields: [
      {
        name: "type",
        nullable: false,
        type: "String",
      },
      {
        name: "number",
        nullable: false,
        type: "String",
      },
    ],
  },
  {
    modelName: "experience",
    fields: [
      {
        name: "title",
        nullable: true,
        type: "String",
      },
      {
        name: "company",
        nullable: true,
        type: "String",
      },
      {
        name: "start_date",
        nullable: true,
        type: "DateTime",
      },
      {
        name: "end_date",
        nullable: true,
        type: "DateTime",
      },
      {
        name: "location",
        nullable: true,
        type: "String",
      },
      {
        name: "description",
        nullable: true,
        type: "Text",
      },
    ],
  },
  {
    modelName: "education",
    fields: [
      {
        name: "school_name",
        nullable: false,
        type: "String",
      },
      {
        name: "level",
        nullable: true,
        type: "String",
      },
      {
        name: "degree",
        nullable: true,
        type: "String",
      },
      {
        name: "start_date",
        nullable: true,
        type: "DateTime",
      },
      {
        name: "end_date",
        nullable: true,
        type: "DateTime",
      },
      {
        name: "location",
        nullable: true,
        type: "String",
      },
      {
        name: "description",
        nullable: true,
        type: "Text",
      },
    ],
  },
]

test("Get columns from fields", () => {
  console.log(createColumnsFromDescriptorArray(fields))
})
