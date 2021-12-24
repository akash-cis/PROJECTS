import React, { useState, useEffect, useRef } from "react"
import styled from "styled-components"
import Typography from "./typography"
import { Separators, Colors } from "./constants"
import { Icon } from "antd"

const Select = styled.div`
  border: ${Separators("thin", "lightGray")};
  border-radius: 4px;
  position: relative;
  width: 260px;
  height: 40px;
  cursor: pointer;
  text-align: center;
  &:hover {
    border: ${Separators("thin", "gray")};
  }
`

const Header = styled(Typography)`
  padding: 8px 12px;
  display: table;
  width: 100%;
  margin: 0 auto;
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
  width: 260px;
  height: ${({ isOpen, amount }) =>
    isOpen && amount <= 5
      ? (amount + 1) * 39 + 2 + "px"
      : isOpen && amount > 5
      ? "190px"
      : "0"};
  overflow: ${({ isOpen }) => (isOpen ? "auto" : "hidden")};
  transition: height 400ms;
  z-index: 2;
  border: ${({ isOpen }) =>
    isOpen ? Separators("thin", "lightGray") : "none"};
  box-shadow: ${({ isOpen }) =>
    isOpen ? "0 2px 4px 0 rgba(0, 0, 0, 0.125)" : "none"};
  background-color: #ffffff;
  text-align: left;
`

const Option = styled(Typography)`
  margin: 0;
  padding: 8px 12px;
  background-color: ${({ selected }) =>
    selected ? Colors.blue : "transparant"};
  color: ${({ selected }) => (selected ? Colors.white : "inherit")};
  &:hover {
    background-color: ${({ selected }) =>
      selected ? "none" : Colors.lightGray};
  }
`

const MultiSelectDropdown = ({
  children,
  updateSelected,
  header,
  selected,
  save,
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [icon, setIcon] = useState("down")

  const amount = React.Children.count(children)

  const saveSelected = () => {
    setIsOpen(false)
    save()
  }

  useEffect(() => {
    setTimeout(() => {
      const newIcon = isOpen && icon === "down" ? "up" : "down"
      setIcon(newIcon)
    }, 350)
  }, [isOpen])

  return (
    <React.Fragment>
      <Select
        onClick={() => (!isOpen ? setIsOpen(!isOpen) : null)}
        {...props}
        tabIndex={"0"}
        onBlur={isOpen ? saveSelected : null}
      >
        <Header variant="regular" onClick={isOpen ? saveSelected : null}>
          {header}
        </Header>
        <StyledIcon onClick={isOpen ? saveSelected : null}>
          {<Icon type={icon} />}
        </StyledIcon>

        <Dropdown isOpen={isOpen} amount={amount}>
          <Option
            variant="small"
            selected={selected.length === amount}
            onClick={() =>
              selected.length < amount
                ? updateSelected("ALL")
                : selected.length === amount
                ? updateSelected("NONE")
                : null
            }
          >
            <div>Select All</div>
          </Option>
          {React.Children.map(children, child => (
            <Option
              variant={child.props.size}
              selected={selected.indexOf(child.props.value) >= 0}
              onClick={() => {
                updateSelected(child.props.value)
              }}
            >
              {child}
            </Option>
          ))}
        </Dropdown>
      </Select>
    </React.Fragment>
  )
}

export default MultiSelectDropdown
