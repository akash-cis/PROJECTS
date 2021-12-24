import React from "react"
import { Label } from "./basicComponents"
import { capitalize } from "./helpers"
import { Form } from "antd"

export const Item = ({ children, errors, name, label, value, ...props }) => {
  return (
    <>
      <Label>{label ? label : capitalize(name)}</Label>
      <Form.Item
        name={name}
        validateStatus={errors && errors[name] && "error"}
        help={errors && errors[name] && errors[name].message}
      >
        {React.cloneElement(children, {
          name,
          defaultValue: value || children.props.defaultValue,
          ...props,
        })}
      </Form.Item>
    </>
  )
}
