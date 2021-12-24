import styled from "styled-components"
import { Colors } from "../../library/constants"

export const TabsContainer = styled.div`
  display: flex;
  justify-content: center;
`

export const InlineTabs = styled.div`
  border-bottom: ${props =>
    props.active
      ? `2px solid ${Colors.primaryBrandBlue}`
      : "2px solid transparent"};
  margin: 0;
  cursor: pointer;
  line-height: 60px;
  margin-right: 1rem;
`

export const squashByKeySumByOther = (data, key, sumKey, cb = kpi => kpi) => {
  let newArray = []
  // we apply the callback just before pushing it
  const pushKpi = key => {
    newArray.push(cb(key))
  }
  data.forEach(kpi => {
    const cbKpi = cb(kpi)
    const sameNameKpi = newArray.find(newKpi =>
      newKpi && newKpi[key] ? newKpi[key] === cbKpi[key] : null
    )
    if (sameNameKpi) {
      let ob
      newArray = newArray.filter(newKpi => newKpi[key] !== sameNameKpi[key])
      if (cbKpi[sumKey] >= 0 && typeof sameNameKpi[sumKey] === "number") {
        if (sameNameKpi.hasOwnProperty("children")) {
          ob = {
            ...sameNameKpi,
            [sumKey]: sameNameKpi[sumKey] + cbKpi[sumKey],
            children: [
              ...sameNameKpi.children,
              { name: cbKpi.model, count: cbKpi.total },
            ],
          }
        } else {
          ob = {
            ...sameNameKpi,
            [sumKey]: sameNameKpi[sumKey] + cbKpi[sumKey],
            children: [{ name: cbKpi.model, count: cbKpi.total }],
          }
        }
      }
      if (ob) return pushKpi(ob)
    }
    pushKpi(cbKpi)
  })
  return newArray
}

const NAME = "name"
const TOTAL = "total"
const CHILDREN = "children"

export const toTreeMapCompatible = data => {
  if (!data) return null
  const newData = data.map(({ make, count, model }) => ({
    name: make,
    total: count,
    model: model,
  }))
  const squashed = squashByKeySumByOther(newData, NAME, TOTAL, item => {
    if (!item.hasOwnProperty(CHILDREN)) {
      return { ...item, children: [{ name: item.model, count: item.total }] }
    }
    return item
  })
  return squashed
}
