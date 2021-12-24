import { DatePicker, Form as AntForm, Input, InputNumber, Select } from "antd"
import moment from "moment"
import React, { useContext, useEffect, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import styled from "styled-components"
import { UserContext } from "../../amplify/authenticator-provider"
import { Content, ContentBody } from "../../library/basicComponents"
import { FREQUENCY, KEYWORD, LOCATION, MULTISELECT, SOURCES, timezones } from "../../library/constants"
import Sidebar, { useSidebarFilters } from "../../library/filtersSidebar"
import { filterByTypeName } from "../../library/helpers"
import { Item } from "../../library/item"
import { useFilters } from "./filtersStore"
import { createFilter } from "./helpers"
import { useAvailableSources } from "./hooks"

const { Option } = Select
const { RangePicker } = DatePicker

const Form = styled(AntForm)`
  width: 100%;
`

export const Fields = ({ onSubmit, savedFields, range }) => {
  const {
    filters,
    setArray,
    addSidebarFilters,
    toggleByTypeName,
  } = useFilters()
  const {
    filtersLoading,
    filtersError,
    selectFilters,
    multiSelectFilters,
  } = useSidebarFilters()
  const { control, handleSubmit, errors } = useForm()
  const { sources, sourcesError, sourcesLoading } = useAvailableSources()
  const { user } = useContext(UserContext)

  // if we have data use that, if not use default (for creation)
  const [defaultEmail] = useState(savedFields?.email || user?.email)

  const onSidebarChange = sidebarFilters => addSidebarFilters(sidebarFilters)

  // save filters
  useEffect(() => {
    if (
      savedFields &&
      savedFields?.filters &&
      savedFields?.filters.length > 0
    ) {
      const { filters } = savedFields
      setArray(filters)
    }
  }, [])

  const submitHandler = fields => {
    return onSubmit({ fields, filters })
  }

  return (
    <Content>
      <Sidebar
        selectFilters={selectFilters}
        multiSelectFilters={multiSelectFilters}
        currentFilters={savedFields?.filters && savedFields.filters}
        filtersError={filtersError}
        filtersLoading={filtersLoading}
        hideButton
        select
        onChange={onSidebarChange}
        hideMultiSelectByTypeName="Sources"
      />
      {/* Inputs */}
      <ContentBody>
        <Content style={{overflow: 'auto'}}>
          <Form id="form" onSubmit={handleSubmit(submitHandler)}>
            {range && (
              <Controller
                name="range"
                label="Date Range"
                control={control}
                defaultValue={[
                  moment(savedFields?.startDate),
                  moment(savedFields?.endDate),
                ]}
                rules={{
                  required: "Please enter a range",
                  validate: ([start, end]) =>
                    new Date(end) < new Date()
                      ? true
                      : "You cannot use dates from the future",
                }}
                format="YYYY-MM-DD"
                onChange={([moment, formatted]) =>
                  formatted.map(date => new Date(date).toISOString())
                }
                as={
                  <Item errors={errors}>
                    <RangePicker showTime={false} />
                  </Item>
                }
              />
            )}
            {!range && (
              <Controller
                name="name"
                control={control}
                placeholder="Write a representative name for the schedule configuration"
                defaultValue={savedFields?.name}
                rules={{
                  required: "Please enter a name",
                }}
                as={
                  <Item errors={errors}>
                    <Input data-testid="name" />
                  </Item>
                }
              />
            )}
            {!range && (
              <Controller
                name="email"
                defaultValue={defaultEmail}
                control={control}
                placeholder="Destination email"
                rules={{
                  required: "Please enter your email address",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i,
                    message: "Invalid email address",
                  },
                }}
                as={
                  <Item errors={errors}>
                    <Input />
                  </Item>
                }
              />
            )}
            {/* <Input.Group>
              <Row gutter={15}>
                <Col span={12}> */}
            <Item name="Locations">
              <Select
                style={{ width: "100%" }}
                placeholder="Enter one or more locations"
                mode="tags"
                multiple
                defaultValue={filterByTypeName(savedFields?.filters)(
                  LOCATION
                ).map(({ value }) => value)}
                onChange={tags =>
                  Array.isArray(tags) &&
                  toggleByTypeName(
                    tags.map(item => createFilter(item, LOCATION)),
                    LOCATION
                  )
                }
              />
            </Item>
            {/* </Col>
                <Col span={12}> */}
            <Item name="Keywords">
              <Select
                style={{ width: "100%" }}
                placeholder="Enter one or more keywords"
                mode="tags"
                multiple
                defaultValue={filterByTypeName(savedFields?.filters)(
                  KEYWORD
                ).map(({ value }) => value)}
                onChange={tags =>
                  Array.isArray(tags) &&
                  toggleByTypeName(
                    tags.map(item => createFilter(item, KEYWORD)),
                    KEYWORD
                  )
                }
              />
            </Item>
            {/* </Col>
              </Row>
            </Input.Group> */}

            {!range && (
              <Controller
                name="emailTime"
                label="Time to send"
                control={control}
                rules={{
                  required: "Please enter an hour to get the email",
                }}
                defaultValue={savedFields?.time || "00:00:00"}
                as={
                  <Item errors={errors}>
                    <Input step="3600" type="time" />
                  </Item>
                }
              />
            )}

            {!range && (
              <Controller
                name="timezone"
                control={control}
                defaultValue={savedFields?.timezone}
                placeholder="Select a timezone to export"
                rules={{
                  required: "Please select a timezone",
                  validate: value => (value ? true : "Yo"),
                }}
                as={
                  <Item errors={errors}>
                    <Select>
                      {timezones.map((timezone) => (
                        <Option key={timezone.value} value={timezone.value}>
                          {timezone.name}
                        </Option>
                      ))}
                    </Select>
                  </Item>
                }
              />
            )}

            {sources && !sourcesError && !sourcesLoading && (
              <Item name="Platform">
                <Select
                  placeholder="Choose one or more platforms"
                  mode="multiple"
                  defaultValue={filterByTypeName(savedFields?.filters)(
                    SOURCES
                  ).map(({ value }) => value)}
                  onChange={tags =>
                    Array.isArray(tags) &&
                    toggleByTypeName(
                      tags.map(item =>
                        createFilter(item, SOURCES, MULTISELECT)
                      ),
                      SOURCES
                    )
                  }
                >
                  {sources.map(({ value }) => (
                    <Option key={value} value={value}>
                      {value}
                    </Option>
                  ))}
                </Select>
              </Item>
            )}
            {!range && (
              <Controller
                name="minimumCount"
                label="Minimum to export"
                control={control}
                defaultValue={100}
                placeholder="Select a minimum amount to export"
                rules={{
                  required: "Please select a minimum amount to export",
                  validate: value =>
                    value >= 100 ? true : "The minimum amount to export is 100",
                }}
                as={
                  <Item errors={errors}>
                    <InputNumber step={10} />
                  </Item>
                }
              />
            )}
            {!range && (
              <Controller
                name="frequency"
                control={control}
                defaultValue={savedFields?.frequency}
                placeholder="Select a frequency to export"
                rules={{
                  required: "Please select a frequency",
                  validate: value => (value ? true : "Yo"),
                }}
                as={
                  <Item errors={errors}>
                    <Select>
                      {FREQUENCY.map(([text, value]) => (
                        <Option key={value} value={value}>
                          {text}
                        </Option>
                      ))}
                    </Select>
                  </Item>
                }
              />
            )}
          </Form>
        </Content>
      </ContentBody>
    </Content>
  )
}

// export const FieldsWithLayout = ({
//   buttonLabel,
//   onSubmit,
//   uri,
//   savedFields,
// }) => {
//   // const back = `/${uri.split("/")[1]}`

//   return (
//     <p>Hola</p>
//     <Container>
//       <ContainerNavigation>
//         Personalized Ads
//         <Spacer>
//           <Button onClick={() => navigate(back)}>Back</Button>
//           <Button form="form" htmlType="submit" type="primary">
//             {buttonLabel}
//           </Button>
//         </Spacer>
//       </ContainerNavigation>
//       <Fields onSubmit={onSubmit} savedFields={savedFields} />
//     </Container>
//   )
// }
