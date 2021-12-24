import React, { useState, useEffect } from "react"
import styled, { keyframes } from "styled-components"
import {
  ContentSidebar,
  RadioGroupCustom,
  RadioButtonCustom,
  FilterTab,
  TabSection,
  CustomCheckbox,
} from "./basicComponents"
import { Tabs, Divider, Button, Tooltip } from "antd"
import { filterByTypeName } from "./helpers"
import { GET_DISPLAY_FILTERS } from "../graphql/query"
import { useQuery } from "@apollo/react-hooks"
import { SOURCES } from "./constants"
//helpers
const getTypeNames = multiSelectArray => {
  if (!multiSelectArray) {
    return []
  }
  return multiSelectArray.reduce((acc, curr) => {
    if (acc.indexOf(curr.typeName) >= 0) return acc
    return [...acc, curr.typeName]
  }, [])
}

const backgroundAnimator = keyframes`
    0% {
      background-position: -100px;
    }

    100% {
      background-position: 250px;
    }
`
const LoadingDiv = styled.div`
  background-image: linear-gradient(
    90deg,
    #efefef 0px,
    #f9f9f9 40px,
    #efefef 100px
  );
  animation: ${backgroundAnimator} 1s linear infinite;
  background-color: #efefef;
  background-size: 600px;
  height: 100%;
  width: 100%;
  border-radius: 5px;
`

//constans
const MULTISELECT = "Multiselect"
const SELECT = "Select"
const RANGE = "Range"

const rangeFilterSelector = item => item.type === RANGE
const selectFilterSelector = item => item.type === SELECT
const multiSelectFilterSelector = item =>
  item.typeName !== SOURCES && item.type === MULTISELECT // we dont want sources in our multise

export const useSidebarFilters = (options) => {
  const {
    data: filtersData,
    loading: filtersLoading,
    error: filtersError,
  } = useQuery(GET_DISPLAY_FILTERS, {})


  let filters = filtersData?.getUserDisplayFilters || [];

  if(options?.filterFunction){
    filters = filters.filter(options.filterFunction);
  }

  const selectFilters = filters.filter(
    selectFilterSelector
  )
  const multiSelectFilters = filters.filter(
    multiSelectFilterSelector
  )

  const rangeFilters = filters.filter(
    rangeFilterSelector
  ).sort((x1, x2) => {
    if(Number(x1.selectionOption.query) > Number(x2.selectionOption.query)) return 1;
    if(Number(x1.selectionOption.query) <= Number(x2.selectionOption.query)) return -1;
  })

  return {
    filtersData,
    filtersLoading,
    filtersError,
    multiSelectFilters,
    selectFilters,
    rangeFilters,
  }
}

// this sidebar component can be used as a standalone component if everything inside
// and refetch is provided
const Sidebar = ({
  selectFilters,
  multiSelectFilters: originalMultiSelectFilters,
  filtersLoading,
  filtersError,
  currentFilters,
  onButtonClick,
  hideButton,
  onChange,
  hideMultiSelectByTypeName,
  extraButton,
  top,
  buttonText,
  typeNameOrder = []
}) => {
  const [activeOnly, setActiveOnly] = useState(false)
  const [filters, setFilters] = useState([])
  const multiSelectFilters = (hideMultiSelectByTypeName
    ? originalMultiSelectFilters?.filter(
        item => item.typeName !== hideMultiSelectByTypeName
      )
    : originalMultiSelectFilters).sort((x1, x2) => {
      if(typeNameOrder.indexOf(x1.typeName) > typeNameOrder.indexOf(x2.typeName)) return 1;
      if(typeNameOrder.indexOf(x1.typeName) < typeNameOrder.indexOf(x2.typeName)) return -1;

      if(x1.value > x2.value) return 1;
      if(x1.value < x2.value) return -1;

    })

  const toggleFilter = selected => {
    if (filters.find(item => item.value === selected.value)) {
      const newFilters = filters.filter(item => item.value !== selected.value)
      return setFilters(newFilters)
    }
    return setFilters([...filters, selected])
  }

  const selectFilter = selected => {
    if (filters.find(item => item.typeName === selected.typeName)) {
      const newFilters = filters.filter(
        item => item.typeName !== selected.typeName
      )
      return setFilters([...newFilters, selected])
    }
    return setFilters([...filters, selected])
  }

  const toggleAllMultiselect = () => {
    const updatedFilters = filters.filter(item => item.type !== MULTISELECT)
    if (
      filters.filter(item => item.type === MULTISELECT).length ===
      multiSelectFilters.length
    ) {
      setFilters(updatedFilters)
    } else {
      setFilters([...updatedFilters, ...multiSelectFilters])
    }
  }

  const cleanSelects = () => {
    setFilters(filters.filter(filter => filter.type !== SELECT))
  }
  //constant for all button
  const ALL = "ALL"

  useEffect(() => {
    if (onChange) onChange(filters)
  }, [filters])

  // set filters
  useEffect(() => {
    if (
      currentFilters &&
      Array.isArray(currentFilters)
    ) {
      const allowedTypeNames = [...new Set(originalMultiSelectFilters.map(x => x.typeName) || [])];
      setFilters(
        currentFilters.filter(
          item => (((item?.type === MULTISELECT && allowedTypeNames.includes(item?.typeName)) || item?.type === SELECT))
        )
      )
    }
  }, [currentFilters])

  const checkItem = item =>
    filters.find(filter => filter.value === item.value) ? true : false

  const checkTypeName = typeName => {
    const match = filters.find(filter => filter.typeName === typeName)
    if (match) return match?.value
    return null
  }

  const checkSelectAll = filters.find(item => item.type === SELECT) ? null : ALL

  return (
    <ContentSidebar>
      {filtersLoading && <p>Loading filters...</p>}
      {!filtersLoading && !filtersError && (
        <>
          {!top && (
            <>
              <RadioGroupCustom
                buttonStyle="solid"
                defaultValue={ALL}
                value={checkSelectAll}
              >
                <Tooltip
                  placement="bottom"
                  title={"All"}
                >
                  <RadioButtonCustom
                    data-testid="all-button"
                    value={ALL}
                    onClick={() => cleanSelects()}
                  >
                    All
                  </RadioButtonCustom>
                </Tooltip>
              </RadioGroupCustom>
              {getTypeNames(selectFilters).map(typeName => (
                <RadioGroupCustom
                  buttonStyle="solid"
                  value={checkTypeName(typeName)}
                  key={typeName}
                >
                  {filterByTypeName(selectFilters)(typeName).map(item => (
                    <Tooltip
                      placement="bottom"
                      title={item.value === "Parts" ? "Parts & Accessories" : item.value}
                    >
                      <RadioButtonCustom
                        onChange={() => selectFilter(item)}
                        data-testid="select"
                        // checked={checkItem(item)}
                        value={item.value}
                        key={item.value}
                      >
                        {item.value}
                      </RadioButtonCustom>
                    </Tooltip>
                  ))}
                </RadioGroupCustom>
              ))}
            </>
          )}

          {top && top}

          <FilterTab
            noMargin
            marginBottom
            defaultActiveKey="Makes"
            tabPosition="top"
            animated={false}
          >
            {getTypeNames(multiSelectFilters).map(typeName => (
              <Tabs.TabPane
                tab={typeName}
                style={{ maxHeight: "400px", overflow: "auto" }}
                key={typeName}
              >
                <TabSection>
                  <CustomCheckbox
                    onChange={() => setActiveOnly(active => !active)}
                    checked={activeOnly}
                  >
                    Show active only
                  </CustomCheckbox>
                  <CustomCheckbox
                    data-testid="toggle-all-multiSelect"
                    onChange={() => {
                      toggleAllMultiselect(multiSelectFilters)
                    }}
                    checked={
                      multiSelectFilters.length ===
                      filters.filter(item => item.type === MULTISELECT).length
                    }
                  >
                    Select/deselect all
                  </CustomCheckbox>
                </TabSection>
                <Divider style={{ margin: "16px 0" }} />
                <TabSection>
                  {filterByTypeName(multiSelectFilters)(typeName).map(item => (
                    <CustomCheckbox
                      data-key={item.value}
                      checked={checkItem(item)}
                      key={item.value}
                      onChange={() => toggleFilter(item)}
                      activeOnly={activeOnly}
                      data-testid="multiSelect"
                    >
                      {item.value}
                    </CustomCheckbox>
                  ))}
                </TabSection>
              </Tabs.TabPane>
            ))}
          </FilterTab>
          {!hideButton && (
            <Button
              type="primary"
              style={{ width: "100%" }}
              onClick={() => onButtonClick(filters)}
            >
              {buttonText || "Update Analytics"}
            </Button>
          )}
          {extraButton && extraButton}
        </>
      )}
    </ContentSidebar>
  )
}

export default Sidebar
