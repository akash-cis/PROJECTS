import React, { useState, useEffect } from "react"
import { SVGIcon, Tag, TagColored } from "../../library/basicComponents"
import CloseIconBlue from "../../../static/icons/CloseIconBlue.svg"
import { Colors } from "../../library/constants"
import styled from "styled-components"
import { Icon } from "antd"

const FilterTag = styled(TagColored)`
  background-color: ${props => (props.disabled ? Colors.lightGray : "none")};
  cursor: ${props => (props.disabled ? "not-allowed" : "default")} !important;
`

const RemoveIcon = styled(SVGIcon)`
  font-size: 12px;
  margin: 0 0 2px 5px;
  cursor: ${props => (props.disabled ? "not-allowed" : "pointer")} !important;
`

const ClearAllIcon = styled(Icon)`
  color: #ffffff;
  font-size: 12px;
  margin: 0 0 2px 5px;
  cursor: pointer;
`

const FilterLabel = styled.span`
  width: 100px;
  display: inline-block;
`

const FilterBreadcrumbs = ({
  userCurrentFilters,
  removeText,
  removeMulti,
  removeSelect,
  removeRange,
  refresh,
  refreshingPosts,
  clearAll,
}) => {
  const [breadcrumbs, setBreadcrumbs] = useState({})
  const [pendingUpdate, setPendingUpdate] = useState(false)
  const [filtersSaved, setFiltersSaved] = useState(false)

  const handleRemove = filter => {
    if (!pendingUpdate) {
      setPendingUpdate(true)
      if (filter.type === "Text" || filter.type === "Template") {
        removeText(filter.id)
      } else if (filter.type === "Multiselect") {
        removeMulti(filter)
      } else if (filter.type === "Select") {
        removeSelect(filter)
      } else if (filter.type === "Range") {
        removeRange(filter)
      }
      removeBreadcrumb(filter)
    }
  }

  const removeBreadcrumb = filter => {
    const keyName = filter.type !== "Select" ? filter.typeName : "Auto"
    let updatedBreadcrumbs = {
      ...breadcrumbs,
      [keyName]: breadcrumbs[keyName].filter(x => x.value !== filter.value),
    }
    if (updatedBreadcrumbs[keyName].length === 0) {
      delete updatedBreadcrumbs[keyName]
    }
    setBreadcrumbs(updatedBreadcrumbs)
  }

  const handleClearAll = () => {
    setPendingUpdate(true)
    setBreadcrumbs({})
    clearAll()
  }

  const updateFilters = () => {
    const filters = {}
    // userCurrentFilters.filter(x => x.type !== "Range").map(f => {
    userCurrentFilters.map(f => {
      const keyName = f.type !== "Select" ? f.typeName : "Auto"
      if (filters.hasOwnProperty(keyName)) {
        filters[keyName].push(f)
      } else {
        filters[keyName] = [f]
      }
    })
    setBreadcrumbs(filters)
  }

  useEffect(() => {
    if (filtersSaved) {
      updateFilters()
    }
  }, [filtersSaved])

  useEffect(() => {
    if (!refreshingPosts && pendingUpdate) {
      setPendingUpdate(false)
    }
    if (!refreshingPosts && !filtersSaved) {
      setFiltersSaved(true)
    }
  }, [refreshingPosts])

  useEffect(() => {
    setFiltersSaved(false)
    if (pendingUpdate) {
      refresh()
    }
  }, [userCurrentFilters])

  return (
    <div
      style={
        Object.keys(breadcrumbs).length > 0 || refreshingPosts
          ? {
              borderBottom: `1px solid #e8e8e8`,
              paddingBottom: "8px",
              minHeight: "40px"
            }
          : {minHeight: "40px"}
      }
    >
      {Object.keys(breadcrumbs).length > 0 ? (
        <TagColored
          style={{ cursor: "pointer" }}
          color={Colors.primaryBrandBlue}
          onClick={handleClearAll}
        >
          Clear all filters
          <ClearAllIcon type={"close-circle"} alt="Clear all" />
        </TagColored>
      ) : refreshingPosts ? (
        <Icon
          style={{ fontSize: "28px", color: Colors.primaryBrandBlue }}
          type={"loading"}
        />
      ) : null}
      {Object.entries(breadcrumbs).map(([name, filters]) =>
        filters.length > 0 ? (
          <div key={name}>
            <FilterLabel>{name}:</FilterLabel>
            {filters.map(filter => (
              <Filter
                key={filter.id}
                filter={filter}
                remove={handleRemove}
                disabled={pendingUpdate || refreshingPosts}
              />
            ))}
          </div>
        ) : null
      )}
    </div>
  )
}

export default FilterBreadcrumbs

const Filter = ({ filter, remove, disabled }) => (
  <FilterTag disabled={disabled}>
    {filter.type === "Template" ? JSON.parse(filter.value).value : filter.value}
    <RemoveIcon
      component={CloseIconBlue}
      alt="Remove"
      disabled={disabled}
      onClick={() => remove(filter)}
    />
  </FilterTag>
)
