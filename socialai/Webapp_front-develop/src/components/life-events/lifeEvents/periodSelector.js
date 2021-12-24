import React from "react"
import {
  PeriodsMenu,
} from "../../../library/optionsWrapper"

export const PeriodSelector = ({ rangeFilter, onClick, options }) => {
  return <PeriodsMenu options={options} period={rangeFilter} onClick={onClick} />
}
