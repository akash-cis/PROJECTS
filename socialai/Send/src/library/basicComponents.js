import React from "react"
import styled, { keyframes, css } from "styled-components"
import {
  Switch,
  Button,
  Radio,
  Icon,
  Tooltip,
  Row,
  Col,
  Tabs,
  Checkbox,
  Alert,
} from "antd"
import { Colors } from "./constants"

const ButtonCustom = styled(Button)`
  margin: 0 0.4rem;
  ${props => props.active && props.activeclass}
  &:hover {
    ${props => props.active && props.activeclass}
  }
  background: ${props => props.secondary && Colors.brandPurple};
  border: ${props => props.secondary && `1px solid ${Colors.brandPurple}`};

  &:hover {
    background: ${props => props.secondary && Colors.brandPurple};
    border: ${props => props.secondary && `1px solid ${Colors.brandPurple}`};
    opacity: ${props => props.secondary && 0.85};
  }
`

const SecondaryButton = styled(props => <Button {...props} />)`
  background: ${Colors.brandPurple};
  border: ${`1px solid ${Colors.brandPurple}`};

  &:hover {
    background: ${Colors.brandPurple};
    border: ${`1px solid ${Colors.brandPurple}`};
    opacity: 0.85;
  }

  &:focus,
  &:active {
    background: ${Colors.brandPurple};
    border: ${`1px solid ${Colors.brandPurple}`};
  }
`
const ButtonGroupCustom = styled(Button.Group)`
  margin: 0 0.5rem;
`

const ButtonIcon = styled.img`
  height: 20px;
`

const SwitchCustom = styled(Switch)`
  margin: 0 0.5rem !important;
  /*&.checked {
    background: #3DD57F;
    box-shadow: 0 8px 16px 0 rgba(55,70,95,0.07);
  }*/
`

const fadeIn = keyframes`
0% {
opacity: 0;
}
100% {
opacity: 1;
}
`

const RadioGroupCustom = styled(Radio.Group)`
  display: flex !important;
  animation: 600ms ${fadeIn} ease-out;
  margin-bottom: 8px;
`
const FilterTab = styled(Tabs)`
  border: 1px solid #eeeef1;
  border-radius: 4px;
  // margin: ${props => (props.noMargin ? "0" : "0.5em")};
  margin-bottom: ${props => props.marginBottom && "8px"};
  margin-top: 20px;
`
const TabSection = styled.div`
  text-align: left;
  padding-left: 0.5em;
`

const RadioButtonCustom = styled(Radio.Button)`
  flex: 1;
  height: unset;
`

const InputButtonGroup = styled.div`
  margin: 0 auto;
  width: ${props => (props.fluid ? "100%" : "60%")};
  display: flex;
  align-items: center;
`

const ActionGroup = styled.div`
  display: flex;
  align-items: center;
`

const ActionIcon = styled.img`
  height: 1em;
  font-family: Helvetica;
  font-size: 16px;
  color: #5e5e5e;
  letter-spacing: 0;
  line-height: 24px;
`

const Tag = styled.div`
  display: inline-block;
  background-color: ${props => (props.gray ? "#EEEEF1" : "#e6f0ff")};
  color: ${props => !props.gray && "#00648d"};
  border-radius: 20px;
  font-family: Helvetica;
  font-size: 12px;
  letter-spacing: 0;
  line-height: 18px;
  padding: ${props => (props.small ? "0.3em" : "0.7em 1em")};
  margin: 0.5em;
  min-width: 50px;
  text-align: center;
`

export const TagColored = styled.div`
  display: inline-block;
  background-color: ${props => (props.color ? props.color : "#e6f0ff")};
  color: ${props => (props.color ? "#ffffff" : Colors.primaryBrandBlue)};
  border: ${props => (props.color ? "none" : "1px solid " + Colors.mediumGray)};
  border-radius: 3px;
  font-family: Helvetica;
  font-size: 12px;
  letter-spacing: 0;
  line-height: 18px;
  padding: 3px 6px;
  margin: 4px 1px;
  min-width: 50px;
  text-align: center;
`

const TagIcon = styled.img`
  height: 16px;
  margin-left: 0.1em;
`

const normalizeWidth = width =>
  typeof width === "number" ? `${width * 100}%` : width

//Here we are assuming that if you use a width, it is for a child container
const Container = styled.div`
  margin-top: 2em;
  margin-bottom: 2em;
  background-color: #fff;
  border: ${props => (props.border == 0 ? "0" : "1px solid #eeeef1")};
  border-radius: 4px;
  height: ${props => (props.auto ? "auto" : "87vh")};
  width: 100%;
  ${props => (props.noMargin ? "margin: 0" : null)};

  ${props => props.scroll && "overflow: auto;"};
  font-family: Helvetica;

  &:last-child {
    margin-bottom: 0;
  }
  @media (max-width: 992px) {
    width: auto;
  }
`

const ContainerNavigation = styled.div`
  padding: ${props => (props.spaced ? "1.5rem" : "1em")};
  padding: ${props => (props.noVertical ? "0 1rem" : "1em")};
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgb(232, 232, 232);
  @media (max-width: 992px) {
    align-items: flex-start;
  }
`

export const PaddedCol = styled(props => <Col {...props} />)`
  display: flex;
  margin-top: ${props => (props.noMargin ? "0" : "2rem")};
  @media only screen and (max-width: 1024px) {
    margin-top: 0;
  }
`

const ContainerGroup = styled(Row)`
  display: flex;
  flex-flow: row wrap;
  justify-content: space-between;
  align-content: stretch;

  ${PaddedCol} {
    padding-right: 1rem;
    padding-left: 1rem;
    &:first-child {
      padding-left: 0;
    }
    &:last-child {
      padding-right: 0;
      /* padding: 1rem; */
    }

    @media (max-width: 668px) {
      padding: 0;
    }
  }
`

const Content = styled.div`
  display: ${props => (props.noFlex ? null : "flex")};
  height: 90%;
  padding: ${props => (props.padded ? "1.5rem" : null)};
  position: relative;
  max-width: 100%;
  @media (max-width: 1024px) {
    padding: 0;
    width: auto;
    max-width: auto;
  }
`

const Fader = styled.div`
  animation: 600ms ${fadeIn} ease-out;
`

const ContentSidebar = styled.div`
  ${props => (props.flex ? `flex: ${props.flex};` : "flex: 2;")};
  text-align: center;
  margin: 1em;
  position: relative;
  min-width: 200px;
  max-width: 25%;
  border-right: 1px solid #e8e8e8;
`

const ContentBody = styled.div`
  flex: 8;
  margin: ${props => (props.margin ? props.margin : "1em")};
  max-width: 100%;
  overflow: ${props => (props.scroll ? "scroll" : null)};

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

const LoadingIcon = styled(Icon)`
  width: 100%;
  font-size: 32px;
  color: ${Colors.primaryBrandBlue};
`

const SVGIcon = styled(Icon)`
  font-size: 18px;
  vertical-align: middle;
  line-height: 0 !important;
  color: ${Colors.lightBrandBlue};
`

const IconCustom = styled(Icon)`
  vertical-align: middle;
  margin-right: ${props => props.marginRight};
`

const SettingsSectionTitle = styled.div`
  font-family: Helvetica;
  font-size: 16px;
  color: #5e5e5e;
  letter-spacing: 0;
  line-height: 24px;
`

const Search = styled.div`
  display: flex;
  align-items: center;
`
const Flex = styled.div`
  display: flex;
  align-items: center;
`

const Label = styled.div`
  margin-bottom: 4px;
`

const TooltipButton = props => {
  return (
    <Tooltip placement="topLeft" title={props.tooltip}>
      <ButtonCustom
        activeclass={props.activeclass}
        active={props.active}
        disabled={props.disabled}
        shape={props.shape}
        onClick={props.onClick}
        type={props.type}
      >
        {props.icon ? (
          <Icon type={props.icon} style={{ fontSize: props?.fontSize || 14 }} />
        ) : (
          <SVGIcon
            type={props.icontype}
            component={props.component}
            alt={props.alt}
          />
        )}
      </ButtonCustom>
    </Tooltip>
  )
}

const TooltipIcon = props => {
  return (
    <Tooltip placement="topLeft" title={props.tooltip}>
      <SVGIcon
        style={{ fontSize: "12px" }}
        disabled={props.disabled}
        type={props.type}
        component={props.component}
        alt={props.alt}
        onClick={props.onClick}
      />
    </Tooltip>
  )
}

const TabsContainer = styled.div`
  margin-top: ${props => (props.fullScreen ? "0" : "1rem")};
  border-bottom: 1px solid rgb(232, 232, 232);
`

const NoPaddingButton = styled(Button)`
  padding: 0 5px;
`

const CenteredContainer = styled.div`
  min-height: ${props =>
    props.noHeight ? "0" : props.minHeight ? props.minHeight : `200px`};
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
`

const NoData = styled.p`
  text-align: center;
`
const CustomCheckbox = styled(Checkbox)`
  width: 100%;
  margin-left: 0 !important;
  display: ${props => props.activeOnly && !props.checked && "none"}};

  &:last-child {
    margin-bottom: 16px;
  }
`

const LoadingCircle = ({ height }) => (
  <CenteredContainer height={height && "450px"}>
    <LoadingIcon type="loading" />
  </CenteredContainer>
)
const Error = ({ message }) => (
  <Alert
    message={message || "Something went wrong. Please contact support."}
    type="error"
    banner
    style={{ marginBottom: 20 }}
  />
)
const Loading = ({ message }) => (
  <Alert
    message={message || "Loading..."}
    type="info"
    banner
    style={{ marginBottom: 20 }}
  />
)
const Sucess = ({ message }) => (
  <Alert
    message={message || "Success!"}
    type="success"
    banner
    style={{ marginBottom: 20 }}
  />
)

const NavItem = styled.div`
  width: 100%;
  /* min-width: 220px; */
  padding: 0.5em 2em;
  cursor: ${({ disabled }) => (disabled ? "not-allowed" : "pointer")};
  background-color: ${({ disabled }) =>
    disabled ? Colors.veryLightGray : "inherit"};
  &:hover {
    background-color: ${Colors.lightGray};
  }
  ${props =>
    props.active &&
    css`
      background-color: ${Colors.lightBrandBlue};
      color: ${Colors.primaryBrandBlue};
      &:hover {
        background-color: ${Colors.lightBrandBlue};
      }
    `};
`

const Marginify = styled.span`
  margin-right: 5px;
`
const NavItemWithIcon = ({ children, icon, ...props }) => {
  return (
    <NavItem {...props}>
      <Marginify>{icon}</Marginify>
      {children}
    </NavItem>
  )
}

const Heighter = styled.div`
  width: 100%;
  height: ${props => (props.size ? props.size : "1rem")};
`

const Divider = styled.div`
  width: 100%;
  height: 1px;
  background-color: ${Colors.lightGray};
  margin: 1em 0;
`

const FilterButtonGroup = styled.div`
  display: flex;
  flex-flow: row wrap;
  @media (max-width: 992px) {
    /*min-height: 72px;*/
    min-height: 35px;
    align-content: space-between;
  }
`

export {
  ButtonCustom,
  ButtonGroupCustom,
  ButtonIcon,
  SwitchCustom,
  RadioButtonCustom,
  RadioGroupCustom,
  InputButtonGroup,
  ActionGroup,
  ActionIcon,
  Tag,
  TagIcon,
  Container,
  ContainerNavigation,
  Content,
  ContentSidebar,
  ContentBody,
  LoadingIcon,
  SVGIcon,
  TooltipButton,
  TooltipIcon,
  IconCustom,
  SettingsSectionTitle,
  ContainerGroup,
  TabsContainer,
  Search,
  Label,
  NoPaddingButton,
  NoData,
  CenteredContainer,
  fadeIn,
  Fader,
  Flex,
  FilterTab,
  TabSection,
  CustomCheckbox,
  Loading,
  Error,
  Sucess,
  LoadingCircle,
  SecondaryButton,
  NavItem,
  NavItemWithIcon,
  Heighter,
  Divider,
  FilterButtonGroup,
}
