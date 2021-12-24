import { List } from "antd"
import styled from "styled-components"
import { fadeIn, SVGIcon } from "../basicComponents"
import { Colors } from "../constants"

export const ProspectItem = styled(List.Item)`
  animation: 1s ${fadeIn} ease-in;
`

export const TestTag = styled.div`
  display: inline-block;
  background-color: ${props => (props.checked ? "#E6F0FF" : "#FFFFFF")};
  ${props => (props.checked ? "border: none;" : "border: 1px solid #EEEEF1;")};
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

export const Info = styled.div`
  display: flex;
`

export const BottomInfo = styled(Info)`
  margin-top: 8px;
  justify-content: space-between;
  flex-flow: row nowrap;
  @media (max-width: 668px) {
    flex-flow: column nowrap;
  }
`

export const ButtonInfo = styled.div`
  display: flex;
  flex-flow: row nowrap;
  @media (max-width: 668px) {
    margin: 8px 0 0 -8px;
  }
`

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

export const SourceText = styled(InfoText)`
  //font-size: 13px;
  flex-grow: 1.8;
  text-align: right;
  font-weight: bold;
  color: ${Colors.darkGray};
  @media (max-width: 968px) {
    text-align: left;
  }
`

export const InfoIcon = styled(SVGIcon)`
  height: 1em;
  font-family: Helvetica;
  font-size: 16px;
  color: #5e5e5e;
  letter-spacing: 0;
  line-height: 24px;
  margin: 0 0.5rem;
  vertical-align: text-top;
  @media (max-width: 968px) {
    margin: 0 0.3rem 0.3rem 0;
  }
`

export const SourceIcon = styled.img`
  width: 30px;
  height: 30px;
  border-radius: 50%;
  vertical-align: middle;
  margin: 0 8px;
  @media (max-width: 968px) {
    width: 22px;
    height: 22px;
    float: left;
    margin: -4px 8px 0 0;
  }
`

export const ResponseBody = styled.p`
  text-align: justify;
`

export const ResponseTitle = styled.div`
  display: flex;
  font-weight: bold;
`

export const SVGIconBadge = styled(SVGIcon)`
  padding: 6px;
`

export const ColdProgressBadge = styled.div`
  position: relative;
  top: -85px;
  left: 19px;
  height: 35px;
  width: 35px;
  border-radius: 30px;
  background: #ffffff;
  border: 2px solid rgba(0, 101, 147, 0.1);
  box-shadow: 0 1px 4px 0 rgba(55, 70, 95, 0.12);
`

export const HotProgressBadge = styled.div`
  position: relative;
  top: -85px;
  left: 19px;
  height: 35px;
  width: 35px;
  border-radius: 30px;
  background: #ffffff;
  border: 2px solid rgba(252, 90, 90, 0.1);
  box-shadow: 0 1px 4px 0 rgba(55, 70, 95, 0.12);
`

export const WarmProgressBadge = styled.div`
  position: relative;
  top: -20px;
  left: 19px;
  height: 35px;
  width: 35px;
  border-radius: 30px;
  background: #ffffff;
  border: 2px solid rgba(255, 190, 66, 0.1);
  box-shadow: 0 1px 4px 0 rgba(55, 70, 95, 0.12);
`

export const LoadingCntr = styled.div`
  margin: 8px auto;
  text-align: center;
`

export const savedActive = {
  background: "#FFEDC6",
}

export const ResponseTemplateCntr = styled.div`
  width: 100%;
  max-width: 600px;
  background-color: ${Colors.white};
  box-shadow: -4px 6px 4px 0px rgba(0, 0, 0, 0.35);
`

export const ResponseTemplateItem = styled.div`
  width: 100%;
  cursor: pointer;
  &:hover {
    background-color: ${Colors.lightBrandBlue};
  }
  & > p {
    width: 100%;
    padding: 12px 20px;
    margin: 0 auto;
  }
`

export const FilterButtonCntr = styled.div`
  display: flex;
  flex-flow: row wrap;
  @media (max-width: 992px) {
    min-height: 72px;
    align-content: space-between;
  }
`

export const ThreadTitle = styled.p`
  font-weight: bold;
  font-size: 14px;
  color: ${Colors.darkGray};
  margin: 0;
`
