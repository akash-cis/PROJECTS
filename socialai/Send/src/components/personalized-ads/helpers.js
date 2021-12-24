import React from "react"
import { filterByType, filterByTypeName } from "../../library/helpers"
import { MULTISELECT, SELECT, ALL } from "../../library/constants"

export const normalizeFilters = data =>
  data.map(item => ({
    value: item?.value,
    typeName: item?.typeName,
    type: item?.type,
  }))

export const validateMulti = text => array =>
  Array.isArray(array) && array.length > 0
    ? true
    : `Please enter one or more ${text}`

export const createFilter = (value, typeName, type) => ({
  type: type || "Text",
  typeName,
  value,
})

export const showByTypeName = filters => typeName => {
  let MAX_FILTERS = 3
  let filtersByTypeName = []
  let filtersToShow = []

  if (typeName !== ALL) {
    MAX_FILTERS = 3
    filtersByTypeName = filterByTypeName(filters)(typeName)
    filtersToShow = filtersByTypeName.slice(0, MAX_FILTERS)

    if (filtersByTypeName.length <= 0)
      return `No ${String(typeName).toLocaleLowerCase()} filters`
  } else {
    MAX_FILTERS = 12
    const selects = filterByType(filters)(SELECT)
    const multiselects = filterByType(filters)(MULTISELECT)
    filtersByTypeName = filtersByTypeName.concat(selects)
    filtersByTypeName = filtersByTypeName.concat(multiselects)
    filtersToShow = filtersByTypeName.slice(0, MAX_FILTERS)
    
    if (filtersByTypeName.length <= 0)
      return `No filters`
  }

  return (
    <>
      {filtersToShow.map(({ value }, idx) => (
        <React.Fragment key={value}>
          {value}
          {idx < filtersToShow.length - 1 && ", "}
        </React.Fragment>
      ))}
      {filtersByTypeName.length > MAX_FILTERS && "..."}
    </>
  )
}
