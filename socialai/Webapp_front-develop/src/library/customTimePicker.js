import React, { useState, useEffect } from "react"
import styled from "styled-components"
import { Select } from "antd"
import { Colors } from "./constants"
import moment from "moment"

const SpanWrap = styled.span`
  color: red;
  margin-left: 2px;
`
const FlexDiv = styled.div`
  flex: 1;
`
const SelectWrap = styled(Select)`
  width: 100%;
`
const { Option } = Select

const CustomTimePicker = ({
  fkey,
  value = null,
  onChange,
  startTime = "9:00 AM",
  endTime = "7:00 PM",
  minuteStep = 15,
  placeholder = "Select time",
  disabledTimes = [],
  disabled = false,
  defaultDate = moment(),
}) => {
  return (
    <FlexDiv key={`div__fkey`}>
      <SelectWrap
        key={fkey}
        defaultValue={value || ""}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
      >
        {renderOptions(
          startTime,
          endTime,
          minuteStep,
          disabledTimes,
          defaultDate
        )}
      </SelectWrap>
    </FlexDiv>
  )
}

export default CustomTimePicker

const isEarlierThanEndLimit = (timeValue, endLimit, lastValue) => {
  let timeValueIsEarlier =
    moment(timeValue, "h:mm A").diff(moment(endLimit, "h:mm A")) < 0
  let timeValueIsLaterThanLastValue =
    lastValue === undefined
      ? true
      : moment(lastValue, "h:mm A").diff(moment(timeValue, "h:mm A")) < 0
  return timeValueIsEarlier && timeValueIsLaterThanLastValue
}

const renderOptions = (
  startTime,
  endTime,
  minuteStep,
  disabledTimes,
  defaultDate
) => {
  let timeValue = startTime || "9:00 AM"
  let lastValue
  let endLimit = endTime || "7:00 PM"
  let step = minuteStep || 15
  let options = []
  let index = 0
  options.push(
    <Option
      key={`key__${index}`}
      value={timeValue}
      disabled={
        disabledTimes.includes(timeValue) ||
        (moment().format("HH:mm") >=
          moment(timeValue, "h:mm A").format("HH:mm") &&
          defaultDate.format("MM/DD/YYYY") <= moment().format("MM/DD/YYYY"))
      }
    >
      {timeValue}
    </Option>
  )

  while (isEarlierThanEndLimit(timeValue, endLimit, lastValue)) {
    lastValue = timeValue
    timeValue = moment(timeValue, "h:mm A")
      .add(step, "minutes")
      .format("h:mm A")
    index = index + 1
    options.push(
      <Option
        key={`key__${index}`}
        value={timeValue}
        disabled={
          disabledTimes.includes(timeValue) ||
          (moment().format("HH:mm") >=
            moment(timeValue, "h:mm A").format("HH:mm") &&
            defaultDate.format("MM/DD/YYYY") <= moment().format("MM/DD/YYYY"))
        }
      >
        {timeValue}
      </Option>
    )
  }
  return options
}
