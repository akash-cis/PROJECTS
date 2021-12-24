import React, { useState, useEffect } from "react"
import styled from "styled-components"
import Typography from "./typography"
import { Separators, Colors } from "./constants"
import { Icon } from "antd"

const Select = styled.div`
  border: ${Separators("thin", "lightGray")};
  border-radius: 4px;
  position: relative;
  width: ${({ wide }) => (wide ? "260px" : "180px")};
  height: 40px;
  cursor: pointer;
  &:hover {
    border: ${Separators("thin", "gray")};
  }
  &:focus {
    outline: none;
  }
`

const Header = styled(Typography)`
  padding: 8px 12px;
`

const StyledIcon = styled.span`
  position: absolute;
  right: 12px;
  top: 8px;
  width: 22px;
  height: 22px;
`

const Dropdown = styled.div`
  position: absolute;
  top: 38px;
  left: 0;
  width: ${({ wide }) => (wide ? "260px" : "180px")};
  height: ${({ isOpen, amount }) =>
    isOpen && amount <= 5
      ? amount * 39 + 2 + "px"
      : isOpen && amount > 5
      ? "190px"
      : "0"};
  overflow: ${({ isOpen, amount }) =>
    isOpen && amount > 5 ? "auto" : "hidden"};
  transition: height 400ms;
  z-index: 5;
  border: ${({ isOpen }) =>
    isOpen ? Separators("thin", "lightGray") : "none"};
  box-shadow: ${({ isOpen }) =>
    isOpen ? "0 2px 4px 0 rgba(0, 0, 0, 0.125)" : "none"};
  background-color: #ffffff;
`

const Option = styled(Typography)`
  margin: 0;
  padding: 8px 12px;
  &:hover {
    background-color: ${Colors.lightGray};
  }
`

const SelectDropdown = ({ children, updateSelected, title, ...props }) => {
  const [header, setHeader] = useState(title)
  const [isOpen, setIsOpen] = useState(false)
  const [icon, setIcon] = useState("down")

  const amount = React.Children.count(children)

  useEffect(() => {
    setTimeout(() => {
      const newIcon = isOpen && icon === "down" ? "up" : "down"
      setIcon(newIcon)
    }, 350)
  }, [isOpen])

  useEffect(() => {
    if (props.reset) {
      setHeader(title)
      setIsOpen(false)
      setIcon("down")
    }
  }, [props.reset])

  return (
    <Select onClick={() => setIsOpen(!isOpen)} wide={props.wide} tabIndex={"0"}>
      <Header variant="regular">{header}</Header>
      <StyledIcon>
        <Icon type={icon} />
      </StyledIcon>
      <Dropdown isOpen={isOpen} amount={amount} wide={props.wide}>
        {React.Children.map(children, child => (
          <Option
            variant={
              child.props.small ? "small" : child.props.big ? "big" : "regular"
            }
            onClick={() => {
              setHeader(child)
              updateSelected(child.props.value)
            }}
          >
            {child}
          </Option>
        ))}
      </Dropdown>
    </Select>
  )
}

export default SelectDropdown
