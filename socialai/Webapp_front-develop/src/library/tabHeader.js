import styled from "styled-components"
import { Separators } from "./constants"

const TabPanelHeader = styled.div`
  border-bottom: ${Separators("thin", "lightGray")};
  padding: 0 24px 18px 24px;
  margin: 0 -24px 18px -24px;
  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
`

export default TabPanelHeader
