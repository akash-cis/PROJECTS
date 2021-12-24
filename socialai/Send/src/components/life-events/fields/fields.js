import React from "react"
import { SidebarContent, Spacer } from "./elements"
import {
  ContentSidebar,
  ContentBody,
  Content,
} from "../../../library/basicComponents"
import { Avatar, Form as AntForm, Input } from "antd"
import { useForm, Controller } from "react-hook-form"
import styled from "styled-components"
import { Item } from "../../../library/item"

const Form = styled(AntForm)`
  width: 100%;
`
export const Fields = ({ onSubmit, savedFields, range }) => {
  const { control, handleSubmit, errors } = useForm()

  return (
    <>
      <ContentSidebar>
        <SidebarContent>
          <Avatar size={120} src={`/images/avatar1.png`} />
          <Spacer size={1} />
          {savedFields?.firstName || "Customer Name"}
          <span>
            {savedFields?.city || "City"}
            {", "}
            {savedFields?.state || "State"}
          </span>
          {savedFields?.country || "Country"}
        </SidebarContent>
      </ContentSidebar>
      <ContentBody>
        <Content>
          <Form id="form" onSubmit={handleSubmit(onSubmit)}>
            <Controller
              name="firstName"
              label="First Name"
              control={control}
              placeholder="Enter a first name"
              defaultValue={savedFields?.firstName}
              rules={{
                required: "Please enter a first name",
              }}
              as={
                <Item errors={errors}>
                  <Input data-testid="firstName" />
                </Item>
              }
            />
            <Controller
              name="middleName"
              label="Middle Name"
              control={control}
              placeholder="Enter a middle name"
              defaultValue={savedFields?.middleName}
              rules={{
                required: "Please enter a middle name",
              }}
              as={
                <Item errors={errors}>
                  <Input data-testid="middleName" />
                </Item>
              }
            />
            <Controller
              name="lastName"
              label="Last Name"
              control={control}
              placeholder="Enter a last name"
              defaultValue={savedFields?.lastName}
              rules={{
                required: "Please enter a last name",
              }}
              as={
                <Item errors={errors}>
                  <Input data-testid="lastName" />
                </Item>
              }
            />
            <Controller
              name="email"
              defaultValue={savedFields?.email}
              control={control}
              placeholder="Destination email"
              rules={{
                required: "Please enter your email address",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i,
                  message: "Invalid email address",
                },
              }}
              as={
                <Item errors={errors}>
                  <Input />
                </Item>
              }
            />
          </Form>
        </Content>
      </ContentBody>
    </>
  )
}
