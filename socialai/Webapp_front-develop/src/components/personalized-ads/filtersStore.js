import { useReducer } from "react"

//constans
const MULTISELECT = "Multiselect"
const SELECT = "Select"
const TOGGLE_ARRAY = "TOGGLE_ARRAY"
const SET_ARRAY = "SET_ARRAY"
const ADD_FILTER = "ADD_FILTER"
const REMOVE_FILTER = "REMOVE_FILTER"
const ADD_SIDEBAR_FILTERS = "ADD_FILTERS"
const TOGGLE_BY_TYPE_NAME = "TOGGLE_BY_TYPE_NAME"

const filtersReducer = (filters, action) => {
  switch (action.type) {
    case ADD_FILTER:
      if (
        filters.find(item => {
          if (item.value === action.payload.id) {
            return true
          }
          return false
        })
      ) {
        return filters
      }
      return [...filters, action.payload]
    case REMOVE_FILTER:
      const newFilters = filters.filter(item => item.id !== action.payload.id)
      return newFilters
    case TOGGLE_ARRAY:
      if (filters.length === action.payload.length) {
        return []
      }
      return action.payload
    case SET_ARRAY:
      return action.payload
    case TOGGLE_BY_TYPE_NAME:
      // remove all sidebar filters (selects and multiselects)
      // because sidebar onChange gives us its complete new state
      if (!Array.isArray(action.payload)) {
        return filters
      }

      const withoutTypeName = filters.filter(
        item => item.typeName !== action.typeName
      )

      return [...withoutTypeName, ...action.payload]
    // return ficjolters
    case ADD_SIDEBAR_FILTERS:
      // remove all sidebar filters (selects and multiselects)
      // because sidebar onChange gives us its complete new state
      const withoutSidebarFilters = filters
        .filter(item => item.type !== MULTISELECT)
        .filter(item => item.type !== SELECT)
      // return ficjolters
      return [...withoutSidebarFilters, ...action.payload]
    default:
      throw new Error("Please use one of the known cases")
  }
}

export const useFilters = () => {
  const [filters, dispatch] = useReducer(filtersReducer, [])
  const makeAction = query => payload => dispatch({ type: query, payload })

  const toggleArray = makeAction(TOGGLE_ARRAY)
  const addFilter = makeAction(ADD_FILTER)
  const removeFilter = makeAction(REMOVE_FILTER)
  const setArray = makeAction(SET_ARRAY)
  const addSidebarFilters = makeAction(ADD_SIDEBAR_FILTERS)
  const toggleByTypeName = (payload, typeName) =>
    dispatch({ type: TOGGLE_BY_TYPE_NAME, payload, typeName })

  const filtersStore = {
    toggleArray,
    addFilter,
    removeFilter,
    addSidebarFilters,
    setArray,
    toggleByTypeName,
    filters,
  }

  return filtersStore
}
