import React, { useState, useEffect } from "react"
import styled from "styled-components"
import { Colors } from "./constants"
import PhoneInput from "react-phone-number-input"
import isEmpty from "lodash/isEmpty"

const SpanWrap = styled.span`
  color: red;
  margin-left: 2px;
`
const PhoneInputWrap = styled(PhoneInput)`
  input {
    background-color: transparent;
    border: 0;
    width: 120px;
  }
  input:hover {
    background-color: ${Colors.lightGray};
    cursor: pointer;
    border: 1px solid ${Colors.lightGray};
  }
`

const EditablePhoneInput = ({ key, value, onSave }) => {
  const [text, setText] = useState(value || "")
  const [error, setError] = useState("")
  const [editable, setEditable] = useState(false)

  useEffect(() => {
    setText(isEmpty(value) ? "N/A" : value || "")
  }, [value])

  const onKeyDown = event => {
    if (event.key === "Enter" || event.key === "Escape") {
      event.target.blur()
    }
  }

  const onBlur = event => {
    if (text.trim() === "") {
      setError("Please enter value")
    } else {
      onSave(text)
      setText(text)
    }
  }

  return (
    <>
      {<SpanWrap>{error}</SpanWrap>}
      <PhoneInputWrap
        international
        withCountryCallingCode
        countryCallingCodeEditable={false}
        defaultCountry="US"
        value={text}
        onChange={val => setText(val)}
        onFocus={e => setEditable(true)}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        placeholder={"N/A"}
      />
    </>
  )
}

export default EditablePhoneInput
