import React from "react"
import styled from "styled-components"
import { Separators, Colors } from "./constants"
import Typography from "./typography"

const InputWrapper = styled.div`
  width: ${({ width }) => width};
  ${props => (props.noBorder ? "padding: 0;" : `padding: 8px;`)};
  position: relative;
`

const StyledLabel = styled(Typography)`
  margin: 4px 0;
`

const StyledInput = styled.input`
  ${props => (props.noBorder ? "padding: 0;" : `padding: 8px 12px;`)}
  ${props =>
    props.noBorder
      ? "border: none;"
      : `border: ${Separators("thin", "lightGray")};`}
  border-radius: 4px;
  width: 100%;
  color: ${Colors.darkGray};
  box-sizing: border-box;
  font-size: ${({ size }) =>
    size === "small" ? "12px" : size === "big" ? "18px" : "14px"};
  &:hover {
    border-color: ${Colors.gray};
  }
  &:focus {
    outline: none;
    border-color: ${Colors.primaryBrandBlue};
  }
  &:disabled {
    background-color: ${Colors.disabledGray};
    cursor: not-allowed;
  }
  &::placeholder {
    color: ${Colors.gray};
  }
`
const SpanRequired = styled.span`
  color: red;
  margin-left: 2px;
`

const TextInput = ({
  reference,
  placeholder = "",
  name,
  label = "",
  width = "100%",
  type = "text",
  onKeyUp = () => {},
  onChange = () => {},
  children,
  ...props
}) => {
  const size = props.small ? "small" : props.big ? "big" : "regular"
  return (
    <InputWrapper width={width} inline={props.inline} noBorder={props.noBorder}>
      {label && (
        <StyledLabel variant={size}>
          {label}
          {props?.require && <SpanRequired>*</SpanRequired>}
        </StyledLabel>
      )}

      <StyledInput
        type={type}
        ref={reference}
        name={name}
        id={name}
        placeholder={placeholder}
        size={size}
        disabled={props.disabled}
        onKeyUp={onKeyUp}
        noBorder={props.noBorder}
        defaultValue={props.defaultValue}
        onChange={onChange}
        maxLength={props?.maxLength ? props.maxLength : ""}
      />
      {children}
    </InputWrapper>
  )
}

export default TextInput
