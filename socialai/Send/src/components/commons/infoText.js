import React from "react"
import styled from "styled-components"
import { Colors } from "../../library/constants"

export const InfoText = styled.div`
  font-family: Helvetica;
  font-size: 12px;
  color: ${Colors.medDarkgray};
  letter-spacing: 0;
  line-height: 16px;
  flex: 1;
  min-width: 165px;
  padding-top: 8px;
  @media (max-width: 968px) {
    min-width: 100%;
    margin-bottom: 4px;
    padding-top: 0;
  }
  & > span {
    font-size: 14px;
    font-weight: bold;
    color: ${Colors.darkGray};
  }
`