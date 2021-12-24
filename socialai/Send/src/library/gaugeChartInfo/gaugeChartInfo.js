import React from "react"
import Typography from "../typography"
import { Colors } from "../constants"
import SvgMessageBubbleCheck from "../../icons/js/MessageBubbleCheck"
import { InfoContainer, StyledValue, IconWrapper } from "./elements"

export const GaugeChartInfo = ({
  value,
  total,
  action = "default action",
  type = "default type",
  noBubble,
  bottom,
}) => {
  return (
    <InfoContainer bottom={bottom}>
      {!noBubble && (
        <IconWrapper>
          <SvgMessageBubbleCheck fill={Colors.green} />
        </IconWrapper>
      )}
      {type && (
        <Typography variant={"small"} color="#c4c1c2">
          {action}
        </Typography>
      )}
      {value && (
        <StyledValue variant={"huge"} inline>
          {value.toLocaleString()}
        </StyledValue>
      )}
      {total && (
        <Typography variant={"small"} color="#c4c1c2">
          of {total.toLocaleString() + " " + type}
        </Typography>
      )}
    </InfoContainer>
  )
}

export default GaugeChartInfo
