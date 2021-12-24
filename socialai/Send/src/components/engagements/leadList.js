import React, { useContext } from "react"
import { CustomerList } from "../life-events/customerList"
import { TabContext } from "../../library/tabs"

const LeadListView = ({ onClick }) => {
  const tabContext = useContext(TabContext)
  const handleClick = e => {
    if (e.tab === "activity-center") {
      tabContext.setActiveTab("activity-center")
    } else if (e.tab === "campaigns") {
      tabContext.setActiveTab("campaigns")
    }
    onClick(e)
  }
  return (
    <CustomerList
      path="/customers"
      showTitleRow={false}
      onRowClick={handleClick}
    />
  )
}
export default LeadListView
