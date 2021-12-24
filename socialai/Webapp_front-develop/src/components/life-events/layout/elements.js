import styled from "styled-components"

export const Rows = styled.div`
  width: 100%;
`

export const FirstRow = styled.div`
  width: 100%;
  border-bottom: ${props =>
    props.secondRow ? "1px solid rgb(232, 232, 232)" : null};
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: ${props => (props.secondRow ? "1em" : null)};
  margin-bottom: ${props => (props.secondRow ? "1em" : null)};
`
export const SecondRow = styled.div`
  width: 100%;
  display: flex;
  justify-content: space-between;
  flex-flow: row wrap;
  .ant-input-search {
    width: 20%;
    @media only screen and (max-width: 1024px) {
      width: 100%;
    }
  }
`
