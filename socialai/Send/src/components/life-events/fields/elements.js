import styled from "styled-components"

export const SidebarContent = styled.div`
  padding: 1em;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  flex-direction: column;
`

export const Spacer = styled.div`
  height: ${props => `${props.size}rem`};
  width: 100%;
`
