import styled from "styled-components"
import { Colors } from '../../../library/constants'

export const Container = styled.div`
  width: 100%;
  padding: 1em 0;
`
export const TitleContainer = styled.div`
  padding: 1em;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid ${Colors.lightGray};

  p {
    margin: 0;
  }
`

export const TableContainer = styled.div`
  padding: 1em;
`
