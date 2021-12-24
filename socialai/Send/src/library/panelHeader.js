import React from "react"
import styled from "styled-components"
import { Separators } from "./constants"
import Typography from "./typography"

const StyledHeader = styled.div`
  margin: 0 -24px;
  padding: 0 24px;
  border-bottom: ${Separators("thin", "lightGray")};
  display: flex;
  justify-content: space-between;
`

const StyledTitle = styled(Typography)`
  margin-bottom: 24px;
  font-weight: 400;
`

const AdditionalChildren = styled.div`
  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
`

const ChildPadding = styled.div`
  padding-left: 8px;
`

const PanelHeader = ({ children, title, ...props }) => {
  return (
    <StyledHeader {...props}>
      <StyledTitle variant={"regular"} inline>
        {title}
      </StyledTitle>
      <AdditionalChildren>
        {React.Children.map(children, child => (
          <ChildPadding>{child}</ChildPadding>
        ))}
      </AdditionalChildren>
    </StyledHeader>
  )
}

export default PanelHeader
