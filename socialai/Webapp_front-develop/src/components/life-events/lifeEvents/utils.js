import { message } from "antd"

// Constants
export const MULTISELECT = "Multiselect"
export const SELECT = "Select"
export const TOGGLE_ARRAY = "TOGGLE_ARRAY"
export const SET_ARRAY = "SET_ARRAY"
export const ADD_FILTER = "ADD_FILTER"
export const REMOVE_FILTER = "REMOVE_FILTER"
export const ADD_SIDEBAR_FILTERS = "ADD_FILTERS"
export const SOURCES = "Sources"

// LIFE_EVENTS is the seType
export const LIFE_EVENTS = "LIFE_EVENTS"
// Events is the typeName
export const EVENTS = "Events"

const RANGE = "Range"

export const rangeFilterSelector = item => item.type === RANGE

export const filterSidebarFilters = data =>
  data.filter(item => item.type === MULTISELECT)

export const filterBySetType = item => item?.setType === LIFE_EVENTS

export const multiSelectFilterSelector = typeName => item =>
  item.typeName === typeName && item.type === MULTISELECT 

// export const lifeEventsFilterByType = item => types=>
//   item.typeName === LIFE_EVENTS && item.type ===

export const sanitizeData = data =>
  data.map(item => ({
    value: item?.value,
    typeName: item?.typeName,
    type: item?.type,
  }))

export const showMessage = string => {
  return message.success(string)
}

export const STATIC_MULTISELECT = [
  {
    id: "1205",
    type: "Multiselect",
    typeName: "Event",
    value: "Company",
    checked: false,
  },
  {
    id: "1206",
    type: "Multiselect",
    typeName: "Event",
    value: "Competitor",
    checked: false,
  },
  {
    id: "1207",
    type: "Multiselect",
    typeName: "Event",
    value: "Job",
    checked: false,
  },
  {
    id: "1208",
    type: "Multiselect",
    typeName: "Event",
    value: "Relocation",
    checked: false,
  },
  {
    id: "1209",
    type: "Multiselect",
    typeName: "Event",
    value: "Birthday",
    checked: false,
  },
  {
    id: "1210",
    type: "Multiselect",
    typeName: "Event",
    value: "New Car",
    checked: false,
  },
  {
    id: "1211",
    type: "Multiselect",
    typeName: "Event",
    value: "New Home",
    checked: false,
  },
  {
    id: "1212",
    type: "Multiselect",
    typeName: "Event",
    value: "Graduation",
    checked: false,
  },
  {
    id: "1213",
    type: "Multiselect",
    typeName: "Event",
    value: "Marriage",
    checked: false,
  },
  {
    id: "1214",
    type: "Multiselect",
    typeName: "Event",
    value: "Baby",
    checked: false,
  },
]

export const STATIC_SOURCES = [
  {
    id: "1211",
    type: "Multiselect",
    typeName: "Sources",
    value: "Facebook",
    checked: false,
  },
  {
    id: "1211",
    type: "Multiselect",
    typeName: "Sources",
    value: "Twitter",
    checked: false,
  },
  {
    id: "1211",
    type: "Multiselect",
    typeName: "Sources",
    value: "Reddit",
    checked: false,
  },
  {
    id: "1211",
    type: "Multiselect",
    typeName: "Sources",
    value: "Forum",
    checked: false,
  },
]
