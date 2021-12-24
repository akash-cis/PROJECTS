import { Modal } from "antd"
import { useEffect, useState } from "react"
import uniqBy from "lodash/uniqBy"
import orderBy from "lodash/orderBy"
import moment from "moment"

export const formatDate = dateString =>
  new Date(dateString).toLocaleString("us-EN", {
    month: "numeric",
    year: "numeric",
    day: "numeric",
  })

export const showConfirmationModal = (title, content, cb) => {
  Modal.confirm({
    title,
    content,
    okType: "danger",
    onOk() {
      cb()
    },
    onCancel() {},
  })
}

// filters specific
export const filterByType = data => type => {
  if (!data) return []
  return data.filter(item => item.type === type)
}

export const filterByTypeName = data => typeName => {
  if (!data) return []
  return data.filter(item => item.typeName === typeName)
}

export const capitalize = string =>
  String(string)
    .charAt(0)
    .toUpperCase() + string.slice(1)

const GRAPHQL_ERROR = "GraphQL error: "
export const displayGraphQLError = e =>
  e?.message ? e?.message.replace(GRAPHQL_ERROR, "") : "Unexpected Error"

export const usePersistedState = (key, defaultValue) => {
  const [state, setState] = useState(() =>
    JSON.parse(sessionStorage.getItem(key) || JSON.stringify(defaultValue))
  )
  useEffect(() => {
    sessionStorage.setItem(key, JSON.stringify(state))
  }, [key, state])
  return [state, setState]
}

export const filterAndSortingData = (data, sortBy, filter = null) => {
  let _data = uniqBy(data || [], sortBy)
  if (filter) {
    _data = _data.filter(el => el[filter?.key] == filter?.value)
  }
  _data = orderBy(_data, [sortBy], ["asc"]).map(el => ({
    id: el[sortBy],
    name: el[sortBy],
  }))
  return _data
}

export const getVehicleYears = () => {
  let years = []
  for (
    let i = 1995;
    i <=
    moment()
      .add(1, "years")
      .year();
    i++
  ) {
    years.push(i)
  }
  return years
}
