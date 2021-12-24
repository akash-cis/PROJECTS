import styled, { css } from "styled-components"
import Typography from "../typography"
import { Colors, Separators } from "../constants"

const centered = css`
  top: 50%;
  transform: translate(-50%, -50%);
`

const bottom = css`
  bottom: -30%;
  transform: translateX(-50%);
`
export const InfoContainer = styled.div`
  width: 50%;
  margin: 0 auto;
  color: #c4c1c2;
  text-align: center;
  position: absolute;
  left: 50%;
  ${props => (props.bottom ? bottom : centered)};
`

export const StyledValue = styled(Typography)`
  border-bottom: ${Separators("medium", "mediumGray")};
  display: inline-block;
  padding-bottom: 4px;
  margin-bottom: 4px;
`

export const IconWrapper = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: ${Colors.lightGreen};
  margin: 8px auto;
  padding: 7px;
`
