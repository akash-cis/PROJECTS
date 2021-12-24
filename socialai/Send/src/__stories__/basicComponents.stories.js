import React from "react"
import { Button } from "antd"
import {
  ButtonCustom,
  ButtonGroupCustom,
  SwitchCustom,
  Tag,
  Container,
} from "../library/basicComponents"

export default {
  title: "Basic Components",
}

export const customButton = () => <ButtonCustom>Button</ButtonCustom>

export const buttonGroupCustom = () => (
  <ButtonGroupCustom>
    <Button>First</Button>
    <Button>Second</Button>
  </ButtonGroupCustom>
)

export const switchCustom = () => <SwitchCustom />

export const tag = () => <Tag>Hola</Tag>

export const container = () => (
  <Container style={{ border: "1px dashed red" }}></Container>
)

