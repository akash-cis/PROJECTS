import React from "react"
import Typography from "../typography"
import { Colors, Separators } from "../constants"
import styled from "styled-components"
import SvgMessageBubbleCheck from "../../icons/js/MessageBubbleCheck"

const InfoContainer = styled.div`
  width: 100%;
  margin: 0 auto;
  text-align: center;
  position: absolute;
  bottom: 16px;
`

const StyledValue = styled(Typography)`
  border-bottom: ${Separators("medium", "mediumGray")};
  display: inline-block;
  padding-bottom: 4px;
  margin-bottom: 4px;
`

const IconWrapper = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: ${Colors.lightGreen};
  margin: 8px auto;
  paddig: 7px;
`

export const InnerContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
`

export const GaugeChartInfo = ({
  value,
  total,
  action = "default action",
  type = "default type",
}) => {
  return (
    <InfoContainer>
      <IconWrapper>
        <SvgMessageBubbleCheck fill={Colors.green} />
      </IconWrapper>
      <Typography variant={"small"} dim>
        {action}
      </Typography>
      <StyledValue variant={"huge"} inline>
        {value.toLocaleString()}
      </StyledValue>
      <Typography variant={"small"} dim>
        of {total.toLocaleString() + " " + type}
      </Typography>
    </InfoContainer>
  )
}

export default GaugeChartInfo
