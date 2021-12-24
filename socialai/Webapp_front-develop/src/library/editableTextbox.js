import React, { useState, useEffect } from "react"
import styled from "styled-components"
import { Input } from "antd"
import { Colors } from "./constants"

const SpanWrap = styled.span`
  color: red;
  margin-left: 2px;
`
const InputWrap = styled(Input)`
  background-color: transparent;
  border: 0;
  font-size: ${props => (props.fontSize ? props.fontSize : "14px")};
  font-weight: ${props => (props.bold ? 600 : 0)};
  &:hover {
    background-color: ${Colors.lightGray};
    cursor: pointer;
  }
`
const FlexDiv = styled.div`
  flex: 1;
`
const EditableTextBox = ({ key, value, onSave, fontSize, bold }) => {
  const [text, setText] = useState(value || "")
  const [error, setError] = useState("")
  useEffect(() => {
    setText(value || "")
  }, [value])

  const onKeyDown = event => {
    if (event.key === "Enter" || event.key === "Escape") {
      event.target.blur()
    }
  }
  const onBlur = event => {
    if (event.target.value.trim() === "") {
      setError("Please enter value")
    } else {
      onSave(text)
      setText(event.target.value)
    }
  }

  return (
    <FlexDiv>
      {<SpanWrap>{error}</SpanWrap>}
      <InputWrap
        size={"small"}
        key={key}
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={onBlur}
        fontSize={fontSize}
        bold={bold}
        placeholder={"N/A"}
      />
    </FlexDiv>
  )
}

export default EditableTextBox
