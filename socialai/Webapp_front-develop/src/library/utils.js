import React from "react"
import styled from "styled-components"
import { Menu } from "antd"
import moment from "moment-timezone"
import isUndefined from "lodash/isUndefined"
import isEmpty from "lodash/isEmpty"

let numWords = [
  "",
  "First",
  "Second",
  "Third",
  "Fourth",
  "Fifth",
  "Sixth",
  "Seventh",
  "Eighth",
  "Ninth",
  "Tenth",
  "Eleventh",
  "Twelvth",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
]

export const Spacer = styled.div`
  > * {
    margin-right: ${props => (props.size ? `${props.size}` : "1rem")};
    &:last-child {
      margin-right: 0;
    }
  }
`

export const createMenu = items => (
  <Menu>
    {items.map(([text, value]) => (
      <Menu.Item key={value}>{text}</Menu.Item>
    ))}
  </Menu>
)

export const parseTimestamp = timestamp => {
  const date = timestamp
  // const date = moment('17/09/2020 15:20:00', 'DD/MM/YYYY HH:mm:ss');
  const now = moment()
  const months = now.diff(date, "months")
  if (months > 0) {
    // return months === 1 ? `${months} month ago` : `${months} months ago`;
    return `${moment(timestamp).format("MM/DD/YYYY")}`
  }
  const days = now.diff(date, "days")
  if (days > 0) {
    return days === 1 ? `${days} day ago` : `${days} days ago`
  }
  const hours = now.diff(date, "hours")
  if (hours > 0) {
    return hours === 1 ? `${hours} hour ago` : `${hours} hours ago`
  }
  const minutes = now.diff(date, "minutes")
  if (minutes > 0) {
    return minutes === 1 ? `${minutes} minute ago` : `${minutes} minutes ago`
  }
  return `${now.diff(date, "seconds")} seconds ago`
}

export const storeStorageData = (key, data) => {
  localStorage.setItem(key, JSON.stringify(data))
}

export const getStorageData = key => {
  return JSON.parse(localStorage.getItem(key))
}

export const convertUTCDate = custdate => {
  const mydate = moment(custdate)
  if (mydate.isValid()) {
    return mydate.utc().format()
  } else {
    return custdate
  }
}

export const convertUtcToLocal = (
  custdate,
  format = "MM/DD/YYYY",
  timezone = null
) => {
  const mydate = moment.utc(custdate)
  if (mydate.isValid()) {
    return timezone
      ? mydate.tz(timezone).format(format)
      : mydate.local().format(format)
  } else {
    return custdate
  }
}

export const numToWord = number => {
  return numWords[number]
}

export const parseLocation = item => {
  let address = " "
  if (item?.addresses && item?.addresses[0] != null) {
    if (
      !isUndefined(item?.addresses[0]?.addressLine1) &&
      item?.addresses[0]?.addressLine1 != null &&
      !isEmpty(item?.addresses[0]?.addressLine1)
    ) {
      address = item?.addresses[0]?.addressLine1
    }
    if (
      !isUndefined(item?.addresses[0]?.city) &&
      item?.addresses[0]?.city != null &&
      !isEmpty(item?.addresses[0]?.city)
    ) {
      address = address + ", " + item?.addresses[0]?.city
    }
    if (
      !isUndefined(item?.addresses[0]?.state) &&
      item?.addresses[0]?.state != null &&
      !isEmpty(item?.addresses[0]?.state)
    ) {
      address = address + ", " + item?.addresses[0]?.state
    }
    if (
      !isUndefined(item?.addresses[0]?.country) &&
      item?.addresses[0]?.country != null &&
      !isEmpty(item?.addresses[0]?.country)
    ) {
      address = address + ", " + item?.addresses[0]?.country
    }
  } else {
    address = "N/A"
  }
  address = address.indexOf(",") == 1 ? address.replace(/\,/, "") : address
  return address
}
