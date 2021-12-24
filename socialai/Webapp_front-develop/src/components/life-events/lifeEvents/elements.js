import styled from 'styled-components'

export const ButtonGroup = styled.div`
  button {
    width: 100%;

    &:first-child {
      margin-bottom: 0.5em
    }
  }
`

export const InfiniteContainer = styled.div`
  height: 100%;
  overflow: scroll;
`