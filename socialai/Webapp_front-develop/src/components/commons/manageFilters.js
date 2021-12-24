import { Button, Modal, Tabs } from "antd"
import React, { useRef, useState } from "react"
import AddIcon from "../../../static/icons/AddIcon.svg"
import CloseIconBlue from "../../../static/icons/CloseIconBlue.svg"
import CheckIconBlue from "../../../static/icons/CheckIconBlue.svg"
import FilterIcon from "../../../static/icons/FilterIcon2.svg"
import {
  ButtonCustom,
  InputButtonGroup,
  SVGIcon,
  Tag,
} from "../../library/basicComponents"
import { KEYWORD, LOCATION, SOURCES } from "../../library/constants"
import { filterByTypeName } from "../../library/helpers"
import TextInput from "../../library/textInput"
import { TestTag } from "../../library/testTag"
import { arraysAreEqual } from "../../utils"

// Filter filters by typename
const filterByTypes = item =>
  item?.typeName === LOCATION ||
  item?.typeName === KEYWORD ||
  item?.typeName === SOURCES

export const ManageFilters = ({ currentFilters, sources, onSave }) => {
  const [modal, setModal] = useState(false)
  const [filters, setFilters] = useState([])
  const locationTag = useRef("")
  const keywordTag = useRef("")

  // We save the previous filters to then compare and update based on that
  // We useRef because we don't want to re-render based on this, just internal state
  const previousFilters = useRef([])

  React.useEffect(() => {
    if (arraysAreEqual(previousFilters.current, currentFilters)) return

    if (currentFilters) {
      setFilters(currentFilters?.filter(filterByTypes))
      previousFilters.current = currentFilters
    }
  }, [currentFilters])

  const createFilter = (value, typeName) => ({
    id: null,
    type: "Text",
    typeName,
    value,
  })

  // const cleanInput = filter => {
  //   if (filter?.typeName === LOCATION) locationTag.current = ""
  //   if (filter?.typeName === KEYWORD) keywordTag.current = ""
  // }

  const addFilter = filter => {
    const newFilter = filter
    setFilters(filters => [...filters, newFilter])
    // cleanInput(filter)
  }

  const removeFilter = filter => {
    setFilters(filters => filters.filter(item => item.value !== filter.value))
  }

  return (
    <>
      <ButtonCustom onClick={() => setModal(true)}>
        Manage filters
        <SVGIcon component={FilterIcon} alt="Prospects" />
      </ButtonCustom>

      <Modal
        visible={modal}
        onOk={() => setModal(false)}
        onCancel={() => {
          setModal(false)
          onSave(filters)
          // updateFilters().then(() => refetchData())
        }}
        bodyStyle={{ padding: 0 }}
        footer={null}
        title={
          <Tabs
            defaultActiveKey="2"
            size="small"
            tabPosition="top"
            animated={false}
          >
            <Tabs.TabPane tab="Locations" key="1">
              {filters &&
                filterByTypeName(filters)(LOCATION).map(filter => (
                  <Tag key={filter.value}>
                    {filter.value}{" "}
                    <SVGIcon
                      component={CloseIconBlue}
                      alt="Remove"
                      onClick={() => {
                        removeFilter(filter)
                      }}
                    />
                  </Tag>
                ))}
              <InputButtonGroup>
                <TextInput
                  style={{ flex: 2 }}
                  reference={locationTag}
                  placeholder={"Add location filter"}
                  name={"locationTag"}
                  small
                />
                <Button
                  style={{ flex: 1 }}
                  onClick={() => {
                    const trimmedValue = locationTag?.current?.value?.trim();
                    if (!!trimmedValue) {
                      const filter = createFilter(
                        locationTag?.current?.value,
                        LOCATION
                      )
                      addFilter(filter)
                    }
                  }}
                >
                  <SVGIcon component={AddIcon} alt="Add" />
                </Button>
              </InputButtonGroup>
            </Tabs.TabPane>
            <Tabs.TabPane tab="Keywords" key="2">
              {filters &&
                filterByTypeName(filters)(KEYWORD).map(filter => (
                  <Tag key={filter.value}>
                    {filter.value}{" "}
                    <SVGIcon
                      component={CloseIconBlue}
                      alt="Remove"
                      onClick={() => removeFilter(filter)}
                    />
                  </Tag>
                ))}
              <InputButtonGroup>
                <TextInput
                  style={{ flex: 2 }}
                  reference={keywordTag}
                  placeholder={"Add keyword filter"}
                  name={"keywordTag"}
                  small
                />
                <Button
                  style={{ flex: 1 }}
                  onClick={() => {
                    const trimmedValue = keywordTag?.current?.value?.trim();
                    if (!!trimmedValue) {
                      addFilter(createFilter(trimmedValue, KEYWORD))
                    }
                  }}
                >
                  <SVGIcon component={AddIcon} alt="Add" />
                </Button>
              </InputButtonGroup>
            </Tabs.TabPane>
            {sources && (
              <Tabs.TabPane tab="Sources" key="3">
                {sources.map(source => {
                  // Double bang to cast to a boolean
                  const isSelected = filters.find(
                    item => item?.value === source?.value
                  )
                  return (
                    <TestTag checked={isSelected} key={source.value}>
                      {source.value}{" "}
                      {isSelected && (
                        <SVGIcon
                          component={CheckIconBlue}
                          alt="Remove"
                          onClick={() => removeFilter(source)}
                        />
                      )}
                      {!isSelected && (
                        <SVGIcon
                          component={AddIcon}
                          alt="Add"
                          onClick={() => addFilter(source)}
                        />
                      )}
                    </TestTag>
                  )
                })}
              </Tabs.TabPane>
            )}
          </Tabs>
        }
      />
    </>
  )
}
