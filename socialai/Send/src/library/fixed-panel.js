import React from "react"
import styled, { css } from "styled-components"

const StyledPanel = styled.div`
  padding: 24px;
  background: #ffffff;
  border-right: 1px solid #e8e8e8;
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

const FixedPanel = ({ children, ...props }) => {
  return (
    <PanelCntr {...props}>
      <StyledPanel {...props}>{children}</StyledPanel>
    </PanelCntr>
  )
}

export default FixedPanel
