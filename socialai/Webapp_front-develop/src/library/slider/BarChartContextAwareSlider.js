import React, { useContext } from "react"
import Slider from "./Slider"
const BarChartContextAwareSlider = ({ onUpdate, context, ...props }) => {
  const { state, dispatch } = context

  const handleUpdate = range => {
    dispatch({ type: "update_range", payload: range })
  }
  return <Slider onUpdate={handleUpdate} {...props} />
}

export default BarChartContextAwareSlider
