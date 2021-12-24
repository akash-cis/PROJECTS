import { Input, Button, Timeline, Divider } from "antd"

import {
  SVGIcon,
  Container,
  Content,
  ContentSidebar,
  ContentBody,
} from "./basicComponents"

import CSVIcon from "../../static/icons/CSVIcon.svg"
import XLSIcon from "../../static/icons/XLSIcon.svg"
import XMLIcon from "../../static/icons/XMLIcon.svg"
import PostIcon from "../../static/icons/PostIcon.svg"
import ChatIcon from "../../static/icons/ChatIcon.svg"
import UploadIcon from "../../static/icons/UploadIcon.svg"
import CheckIcon from "../../static/icons/CheckIcon.svg"

import styled, { css } from "styled-components"

import { Colors } from "./constants"

const CSVIconWhite = styled(CSVIcon)`
  g {
    stroke: white;
  }
`

const XLSIconWhite = styled(XLSIcon)`
  g {
    stroke: white;
  }
`

const XMLIconWhite = styled(XMLIcon)`
  g {
    stroke: white;
  }
`

const ChatIconWhite = styled(ChatIcon)`
  g {
    stroke: white;
  }
`

const PostIconWhite = styled(PostIcon)`
  g {
    stroke: white;
  }
`

const UploadIconWhite = styled(UploadIcon)`
  g {
    stroke: white;
  }
`

const CheckIconBlue = styled(CheckIcon)`
  g {
    stroke: #e6f0ff;
  }
`

const ContainerCustom = styled(Container)`
  display: flex;
  flex-direction: column;
  /*overflow: auto;*/
  height: ${props => (props.auto ? "auto" : "72vh")} !important;
  scrollbar-width: thin;
  &::-webkit-scrollbar {
    width: 7px;
    background-color: #f1f1f1;
  }

  &::-webkit-scrollbar-track {
    -webkit-box-shadow: inset 0 0 0px grey;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    border-radius: 3px;
    -webkit-box-shadow: inset 0 0 6px grey;
    background-color: #fcfcfc;
  }
  @media only screen and (max-width: 1024px) {
    margin-top: 0;
  }
`

// TODO: improve using refs
const ContentCustom = styled(Content)`
  height: calc(100% - 60px);
`

const ContentSidebarCustom = styled(ContentSidebar)`
  margin: 0;
  display: flex;
  flex-direction: column;
  min-width: 280px;
  max-width: 35% important;
  height: 64vh;
  @media only screen and (max-width: 1024px) {
    /*display: none;*/
    min-width: 100%;
    max-width: 100% important;
    height: auto;
    overflow: none;
  }
`

const FiltersContainer = styled.div`
  flex: 1;
`

const Conversations = styled.div`
  flex-grow: 1;
  overflow: auto;
  height: 100%;
  &::-webkit-scrollbar {
    width: 7px;
    background-color: #f1f1f1;
  }

  &::-webkit-scrollbar-track {
    -webkit-box-shadow: inset 0 0 0px grey;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    border-radius: 3px;
    -webkit-box-shadow: inset 0 0 6px grey;
    background-color: #fcfcfc;
  }
`

const ContentBodyConversations = styled(ContentBody)`
  margin: 0px;
  display: flex;
  flex-direction: column;
  min-width: 320px;
  height: 65vh;
`

const SelectedDealCntr = styled.div`
  display: flex;
  flex-flow: row wrap;
  justify-content: space-between;
  flex: 10;
`

const DealInfoSideBar = styled(ContentSidebar)`
  overflow: auto;
  min-width: 300px;
  width: 30% important;
  max-width: 25% important;
  border-left: 1px solid #e8e8e8;
  margin-top: 0;
  padding-top: 15px;
  padding-left: 15px;
  margin-left: 0;
  height: 64vh;
  @media (max-width: 767px) {
    border-top: 1px solid ${Colors.lightGray};
    padding-top: 38px;
  }
  scrollbar-width: thin;
  &::-webkit-scrollbar {
    width: 7px;
    background-color: #f1f1f1;
  }

  &::-webkit-scrollbar-track {
    -webkit-box-shadow: inset 0 0 0px grey;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    border-radius: 3px;
    -webkit-box-shadow: inset 0 0 6px grey;
    background-color: #fcfcfc;
  }
`

const RadioGroupTitle = styled.div`
  text-align: left;
  color: #c4c1c2;
  font-size: 10px;
  font-weight: bold;
  margin-top: 1em;
`

const InternalDivider = styled(Divider)`
  margin: 12px 0 !important;
  top: 0 !important;
`

const InfoText = styled.div`
  font-family: Helvetica;
  font-size: ${props => (props.fontSize ? props.fontSize : "14px")};
  color: #5e5e5e;
  letter-spacing: 0;
  line-height: 30px;
`

const OptionContainer = styled.div`
  margin: 1em 0.5em 1em 0.5em;
  @media only screen and (max-width: 1024px) {
    margin: 5px;
  }
`

const ButtonOptionContainer = styled.div`
  display: flex;
  flex-direction: column;
`

const OptionGroup = styled.div`
  display: flex;
  align-items: center;
  color: #c4c1c2;
  line-height: 24px;
`
const OptionGroupInfo = styled.div`
  align-items: center;
  color: #5e5e5e;
  line-height: 24px;
`

const OptionGroupTitle = styled.div`
  color: #5e5e5e;
  line-height: 24px;
  font-weight: bold;
  font-family: Roboto, sans-serif;
  font-size: 14px;
  margin-bottom: 0.5rem;
`

const OptionGroupIcon = styled(SVGIcon)`
  margin-right: 1em;
`

const DateOption = styled.div`
  flex: 2;
  margin: 1em;
`

const ExportGroup = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`

const ExportButton = styled(Button)`
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
`

const Author = styled.div`
  font-family: Helvetica;
  font-size: 16px;
  color: #5e5e5e;
  letter-spacing: 0;
  line-height: 24px;
  /*font-weight: bold;*/
`
const Author2 = styled.div`
  font-family: Helvetica;
  font-size: 16px;
  color: #5e5e5e;
  letter-spacing: 0;
  line-height: 24px;
  font-weight: bold;
  font-size: 16px;
`

const Card = styled.div`
  border: 1px solid #eeeef1;
  border-radius: 8px;
  padding: 1em;
  margin: 1em;
`

const CardTitle = styled.div`
  font-family: Helvetica;
  font-size: 16px;
  color: #5e5e5e;
  letter-spacing: 0;
  line-height: 24px;
  display: flex;
  justify-content: space-between;
`

const CardSubTitle = styled.p`
  font-family: Helvetica;
  font-size: 12px;
  color: #c4c1c2;
  letter-spacing: 0;
  line-height: 16px;
`

const MessagesContainer = styled.div`
  margin: 1em;
`

const MessageBox = styled.div`
  background: ${props =>
    props.sent
      ? Colors.lightPrimaryBrandBlue
      : props.original
      ? Colors.lightBrandBlue
      : Colors.darkBrandPurple};
  color: ${props =>
    props.sent ? "#FFFFFF;" : props.original ? "#5E5E5E;" : "#FFFFFF;"}
  border-radius: 8px;
  padding: 1em;
  margin: 16px 4px;
  width: 94%;
  position: relative;
  left: ${props => (props.sent ? "6%" : "0")};
`

const MessageBoxInfo = styled.p`
  font-size: 10px;
`

const SwitchContainer = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 1em;
`

const TimelineItem = styled(Timeline.Item)`
  padding: 0 !important;
  text-align: left;
`

const DealsContainer = styled.div`
  margin: 0;
  flex-grow: 2;
  overflow: auto;
  overflow-x: hidden;
  scrollbar-width: thin;
  &::-webkit-scrollbar {
    width: 7px;
    background-color: #f1f1f1;
  }

  &::-webkit-scrollbar-track {
    -webkit-box-shadow: inset 0 0 0px grey;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    border-radius: 3px;
    -webkit-box-shadow: inset 0 0 6px grey;
    background-color: #fcfcfc;
  }
  & .ant-list-pagination {
    text-align: center;
    font-size: 12px;
    & .ant-pagination-options {
      padding: 15px;
    }
    & .ant-pagination-total-text {
      width: 100%;
    }
  }
`

const TagsContainer = styled.div`
  text-align: left;
`

const InputWithoutBorder = styled(Input)`
  border: none !important;
  box-shadow: inset 0px 0px 0px 0px !important;
  background: none !important;
`

const ColdProgressBar = styled.div`
  width: 15px;
  height: 100px;
  background: #fbfafa;
  border-radius: 8.5px;
`

const ColdProgressBadge = styled.div`
  position: relative;
  top: -5px;
  left: -10px;
  height: 35px;
  width: 35px;
  border-radius: 30px;
  background: #ffffff;
  border: 2px solid rgba(0, 101, 147, 0.1);
  box-shadow: 0 1px 4px 0 rgba(55, 70, 95, 0.12);
`

const HotProgressBar = styled.div`
  width: 15px;
  height: 100px;
  background-image: linear-gradient(
    180deg,
    #eb4949 0%,
    #fc5a5a 50%,
    #ffbe42 100%
  );
  border-radius: 8.5px;
`

const HotProgressBadge = styled.div`
  position: relative;
  top: -105px;
  left: -10px;
  height: 35px;
  width: 35px;
  border-radius: 30px;
  background: #ffffff;
  border: 2px solid rgba(252, 90, 90, 0.1);
  box-shadow: 0 1px 4px 0 rgba(55, 70, 95, 0.12);
`

const WarmProgressBar = styled.div`
  width: 15px;
  height: 50px;
  background-image: linear-gradient(
    180deg,
    #eb4949 0%,
    #fc5a5a 50%,
    #ffbe42 100%
  );
  border-radius: 8.5px;
`

const WarmProgressBar2 = styled.div`
  width: 15px;
  height: 50px;
  background: #fbfafa;
  border-radius: 8.5px;
`

const WarmProgressBadge = styled.div`
  position: relative;
  top: -65px;
  left: -10px;
  height: 35px;
  width: 35px;
  border-radius: 30px;
  background: #ffffff;
  border: 2px solid rgba(255, 190, 66, 0.1);
  box-shadow: 0 1px 4px 0 rgba(55, 70, 95, 0.12);
`

const SVGIconBadge = styled(SVGIcon)`
  padding: 0.3em;
`

const left = css`
  left: -0.2rem;
  padding-left: 0.5rem;
`
const SidebarArrow = styled.div`
  position: absolute;
  padding: 10px 5px;
  top: 50%;
  ${props => props.right && "right: -0.2rem"};
  ${props => props.left && left};
  background-color: #fff;
  border: 1px solid #eeeef1;
  border-radius: 4px;
  z-index: 1;
  cursor: pointer;
  ${props =>
    props.left &&
    css`
      background-color: ${Colors.lightBrandBlue};
      //&::before {
      //  display: inline-block;
      //  content: "Conversation List";
      //  transform: rotate(270deg);
      //  transform-origin: left;
      //}
    `}
`

const DealContainer = styled.div`
  display: flex;
`

const DealProgressContainer = styled.div`
  flex: 1;
  max-height: 120px;
`

const DealDataContainer = styled.div`
  flex: 6;
  display: flex;
  flex-direction: column;
`

const DealData = styled.div`
  display: flex;
  alignitems: flex-start;
  color: #00648d;
`

const DealInfoText = styled(InfoText)`
  color: ${props => (props.color ? `${props.color}` : "#00648d")};
  font-size: ${props => (props.fontSize ? `${props.fontSize}px` : "14px")};
  text-align: ${props => (props.align ? `${props.align}` : "")};
`

const DealInfo = styled.div`
  flex: ${props => (props.flex ? props.flex : 1)};
  text-align: ${props => (props.align ? props.align : "initial")};
`

const PushToCrmContainer = styled.div`
  width: 100%;
  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
`

const FormContainer = styled.div`
  display: flex;
  flex-flow: row wrap;
`

const DrawerFooter = styled.div`
  position: absolute;
  right: 0;
  bottom: 0;
  width: 100%;
  border-top: 1px solid #e9e9e9;
  padding: 10px 16px;
  background: #fff;
  text-align: right;
`

export {
  CSVIconWhite,
  XLSIconWhite,
  XMLIconWhite,
  ChatIconWhite,
  UploadIconWhite,
  PostIconWhite,
  CheckIconBlue,
  ContainerCustom,
  ContentCustom,
  ContentSidebarCustom,
  FiltersContainer,
  Conversations,
  ContentBodyConversations,
  SelectedDealCntr,
  DealInfoSideBar,
  RadioGroupTitle,
  InternalDivider,
  InfoText,
  OptionContainer,
  ButtonOptionContainer,
  OptionGroup,
  OptionGroupInfo,
  OptionGroupTitle,
  OptionGroupIcon,
  DateOption,
  ExportGroup,
  ExportButton,
  Author,
  Author2,
  Card,
  CardTitle,
  CardSubTitle,
  MessagesContainer,
  MessageBox,
  MessageBoxInfo,
  SwitchContainer,
  TimelineItem,
  DealsContainer,
  TagsContainer,
  InputWithoutBorder,
  ColdProgressBar,
  ColdProgressBadge,
  HotProgressBar,
  HotProgressBadge,
  WarmProgressBar,
  WarmProgressBar2,
  WarmProgressBadge,
  SVGIconBadge,
  left,
  SidebarArrow,
  DealContainer,
  DealProgressContainer,
  DealDataContainer,
  DealData,
  DealInfoText,
  DealInfo,
  PushToCrmContainer,
  FormContainer,
  DrawerFooter,
}
