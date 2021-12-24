import React from "react"
import styled, { css } from "styled-components"

export const StyledPanel = styled.div`
  padding: 24px;
  box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.125);
  border-radius: 4px;
  background: #ffffff;
  margin: 12px;
`

const PanelCntr = styled.div`
  ${props =>
    props.inline &&
    css`
      display: inline-block;
    `}

  ${props =>
    props.width &&
    css`
      width: ${props.width};
    `}
    
    @media(max-width: 998px) {
    width: 100%;
  }
`

export const Panel = ({ children, ...props }) => {
  return (
    <PanelCntr {...props}>
      <StyledPanel {...props}>{children}</StyledPanel>
    </PanelCntr>
  )
}

export default Panel
