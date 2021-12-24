import React from "react"
import styled from "styled-components"
import { Colors } from "./constants"

const variantMap = {
  h1: {
    tag: "h1",
    fontFamily: "Roboto, sans-serif",
    fontSize: "38px",
  },
  h2: {
    tag: "h2",
    fontFamily: "Roboto, sans-serif",
    fontSize: "32px",
  },
  h3: {
    tag: "h3",
    fontFamily: "Roboto, sans-serif",
    fontSize: "20px",
  },
  h4: {
    tag: "h4",
    fontFamily: "Roboto, sans-serif",
    fontSize: "16px",
  },
  huge: {
    fontFamily: "Roboto, sans-serif",
    fontSize: "24px",
  },
  big: {
    fontFamily: "Roboto, sans-serif",
    fontSize: "18px",
  },
  regular: {
    fontFamily: "Roboto, sans-serif",
    fontSize: "16px",
  },
  small: {
    fontFamily: "Roboto, sans-serif",
    fontSize: "14px",
  },
  tiny: {
    fontFamily: "Roboto, sans-serif",
    fontSize: "12px",
  },
}

const weightMap = {
  bold: "bold",
  medium: "400",
  normal: "unset",
}

// Color takes precedence on dim; and it breaks if it's not a valid one
const StyledDiv = styled.div`
  font-family: ${({ variant }) => variantMap[variant].fontFamily};
  font-size: ${({ variant }) => variantMap[variant].fontSize};
  font-weight: ${({ variant, weight }) =>
    weight
      ? weightMap[weight]
      : variant && variantMap[variant].tag
      ? weightMap.bold
      : weightMap.normal};
  color: ${({ color, dim }) =>
    color ? Colors[color] : dim ? Colors.lightGray : Colors.darkGray};
  display: ${({ inline }) => (inline ? "inline" : "block")};
  // overides stupid bootstrap rules...
  text-shadow: none;
`
const Typography = ({ children, variant = "regular", ...props }) => {
  return (
    //{...props} variant={variant} <=> {...{ ...props, variant }}
    <StyledDiv {...props} variant={variant}>
      {children}
    </StyledDiv>
  )
}
export default Typography
