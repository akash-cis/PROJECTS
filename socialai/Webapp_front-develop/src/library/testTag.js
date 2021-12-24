import styled from "styled-components"

export const TestTag = styled.div`
  display: inline-block;
  background-color: ${props => (props.checked ? "#E6F0FF" : "#FFFFFF")};
  ${props => (props.checked ? "border: 1px solid #E6F0FF;" : "border: 1px solid #EEEEF1;")};
  color: ${props => (props.checked ? "#00648D" : "#5E5E5E")};
  border-radius: 20px;
  font-family: Helvetica;
  font-size: 12px;
  letter-spacing: 0;
  line-height: 18px;
  padding: 0.7em 1em 0.7em 1em;
  margin: 0.5em;
  min-width: 50px;
  text-align: center;
`
