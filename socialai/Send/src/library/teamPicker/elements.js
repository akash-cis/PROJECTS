import React from "react"
import { Menu } from "antd"
import styled from "styled-components"

// Take an array of Items and converts them to Bubbles with their initials
export const Bubbles = ({ selected }) => {
  const MAX_NAMES = 2
  const isMoreThanMax =
    selected.length > MAX_NAMES ? selected.length - MAX_NAMES : false

  return (
    <>
      {selected
        // if its more than max we cut the array
        .slice(0, isMoreThanMax ? MAX_NAMES : selected.length)
        .map(({ value, text }) => (
          <Bubble key={value}>{convertToInitials(text)}</Bubble>
        ))}
      {isMoreThanMax && (
        <Bubble>+ {isMoreThanMax ? isMoreThanMax : null}</Bubble>
      )}
    </>
  )
}

// convert to initials
export const convertToInitials = string => {
  if (typeof string !== "string") {
    return null
  }
  return string
    .split(" ")
    .slice(0, 2)
    .map(word => word.slice(0, 1).toUpperCase())
    .join("")
}

//create a menu based on items, onclick, selecetd, and onclickall
export const createMenu = (items, onClick, selected, onClickAll) => (
  <Menu selectedKeys={selected}>
    {selected.length === items.length && (
      <Menu.Item onClick={() => onClickAll(items)}>Unselect All</Menu.Item>
    )}
    {selected.length !== items.length && (
      <Menu.Item onClick={() => onClickAll(items)}>Select all</Menu.Item>
    )}
    <Menu.Divider />
    {items.map(({ value, text }) => (
      <Menu.Item key={value} onClick={() => onClick({ value, text })}>
        {text}
      </Menu.Item>
    ))}
  </Menu>
)

const bubbleDiameter = `22px`
export const Bubble = styled.span`
  color: #00648d;
  border-radius: 50%;
  font-weight: 600;
  font-size: 10px;
  width: ${bubbleDiameter};
  height: ${bubbleDiameter};
  background-color: #e6f0ff;
  border-radius: 50%;
  line-height: 19.5px;
  border: 1px solid #fff;
  box-sizing: border-box;
  margin-left: -5px;

  /* bubbles with color per position */
  &:nth-child(2) {
    color: #ffc74b;
    background-color: #ffedc6;
  }
  &:nth-child(3) {
    color: #a70e72;
    background-color: #e4b6d4;
    margin-right: 5px;
  }
`

// consistent height
export const PickerText = styled.span`
  line-height: ${bubbleDiameter};
`
