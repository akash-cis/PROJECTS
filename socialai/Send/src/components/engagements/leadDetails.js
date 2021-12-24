import React from "react"
import { CustomerDetails } from "../life-events"

const LeadDetailsView = ({ id, onClick }) => {
  return <CustomerDetails id={id} section={"profile"} onBackClick={onClick} />
}
export default LeadDetailsView
