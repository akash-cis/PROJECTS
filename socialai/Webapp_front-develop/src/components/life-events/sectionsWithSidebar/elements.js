import styled from "styled-components"
import { Colors } from "../../../library/constants"

export const ContentSidebar = styled.div`
  ${props => (props.flex ? `flex: ${props.flex};` : "flex: 2;")};
  position: relative;
  min-width: 180px;
  max-width: 250px;
  padding: 1.5em 0;
  text-align: initial;
  border-right: 1px solid ${Colors.lightGray};
`
