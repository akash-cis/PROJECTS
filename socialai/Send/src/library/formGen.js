import { Button, DatePicker, Form, Input, Select, Row, Col } from "antd"
import moment from "moment"
import React, { useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { Item } from "../library/item"
import {
  prependArticleToWord,
  snakeCaseToTitleCase,
  capitalize,
} from "../utils"
import { Spacer } from "./utils"
import { useTranslation } from "react-i18next"
import PhoneInput from "react-phone-number-input"
import "react-phone-number-input/style.css"
import styled from "styled-components"
const { Option } = Select

export const BOOLEAN = "Boolean"
export const STRING = "String"
export const DATETIME = "DateTime"
export const ENUM = "Enum"
export const DATE_FORMAT = "YYYY-MM-DD"

export const FormButtons = ({ onCancel, formId, loading = false }) => (
  <Spacer size={10}>
    <Button htmlType="submit" form={formId} type="primary" loading={loading}>
      Save
    </Button>
    <Button onClick={onCancel}>Cancel</Button>
  </Spacer>
)

const FormDiv = styled.div`
  .PhoneInput {
    line-height: 30px !important;
  }
  .PhoneInput--focus {
    border: 1px solid #d9d9d9 !important;
  }
  .PhoneInputInput {
    border: 1px solid #d9d9d9 !important;
    width: 373px !important;
    border-radius: 4px !important;
  }
  .PhoneInputInput--focus {
    border: 1px solid #d9d9d9 !important;
  }
  .ant-form-item {
    margin-bottom: 0;
  }
`

export const FormGen = ({
  formId,
  submitHandler,
  fields,
  forceFields,
  initialValue,
}) => {
  const { t } = useTranslation()
  const { control, handleSubmit, errors } = useForm()
  const [formFields, setFields] = useState(fields || [])

  const handleSelect = (e, key) => {
    if (key === "leadSourceOriginalId") {
      setFields(prevState => {
        const newState = [...prevState]
        const findIndex = newState.findIndex(e => e.dataIndex == "otherSource")
        if (findIndex > -1) {
          newState[findIndex].isDisplay = e[1]?.props?.children == "Other"
        }
        return newState
      })
    }
  }

  return (
    <Form id={formId} onSubmit={handleSubmit(submitHandler)}>
      <Row gutter={[4, 12]}>
        {formFields &&
          formFields.map(field => {
            let _field = field
            if (forceFields && forceFields[field?.key]) {
              _field = { ...field, ...forceFields[field?.key] }
            }
            const {
              dataIndex,
              key,
              title,
              type,
              nullable,
              options,
              placeholder,
              isDisplay,
            } = _field

            const rules = {
              validate: value =>
                (value || typeof value === "boolean") &&
                String(value).length > 0
                  ? true
                  : `Please enter a ${String(title).toLowerCase()}`,
            }
            const translation = `labels.${key}`
            const i18n = t(translation) === translation ? title : t(translation)

            return (
              dataIndex && (
                <Col span={12} key={key}>
                  <FormDiv>
                    {type !== BOOLEAN && type !== DATETIME && type !== ENUM && (
                      <Controller
                        key={key}
                        name={dataIndex}
                        label={i18n}
                        defaultValue={initialValue?.[dataIndex]}
                        rules={!nullable ? rules : null}
                        control={control}
                        placeholder={
                          placeholder || `Enter ${i18n.toLowerCase()}`
                        }
                        as={
                          <Item errors={errors}>
                            {key == "phone" ? (
                              <PhoneInput
                                international
                                withCountryCallingCode
                                countryCallingCodeEditable={false}
                                defaultCountry="US"
                                value={initialValue?.[dataIndex]}
                              />
                            ) : (
                              <Input />
                            )}
                          </Item>
                        }
                      />
                    )}
                    {type === BOOLEAN && (
                      <Controller
                        key={key}
                        name={dataIndex}
                        label={title}
                        defaultValue={initialValue?.[dataIndex]}
                        rules={!nullable ? rules : null}
                        control={control}
                        placeholder={`Select an option`}
                        as={
                          <Item errors={errors}>
                            <Select>
                              <Option value={true}>Yes</Option>
                              <Option value={false}>No</Option>
                            </Select>
                          </Item>
                        }
                      />
                    )}
                    {type === ENUM && (
                      <Controller
                        key={key}
                        name={dataIndex}
                        label={title}
                        defaultValue={
                          key == "country"
                            ? initialValue?.[dataIndex] || "US"
                            : initialValue?.[dataIndex]
                        }
                        rules={!nullable ? rules : null}
                        control={control}
                        placeholder={
                          placeholder ||
                          `Select ${
                            title === "Type"
                              ? "type"
                              : prependArticleToWord(title)
                          }`
                        }
                        onChange={e => handleSelect(e, key)}
                        as={
                          <Item errors={errors}>
                            <Select showSearch disabled={key == "country"}>
                              {options?.map(option => {
                                let name = option
                                let value = option

                                if (Array.isArray(option)) {
                                  value = option[1]
                                  name = option[0]
                                }
                                return (
                                  <Option value={value} key={value}>
                                    {capitalize(snakeCaseToTitleCase(name))}
                                  </Option>
                                )
                              })}
                            </Select>
                          </Item>
                        }
                      />
                    )}
                    {type === DATETIME && (
                      <Controller
                        name={key}
                        label={title}
                        control={control}
                        defaultValue={
                          initialValue?.[dataIndex]
                            ? moment(initialValue?.[dataIndex])
                            : null
                        }
                        // defaultValue={moment('2015-01-01', 'YYYY-MM-DD')}
                        // defaultValue={[
                        //   moment(savedFields?.startDate),
                        //   moment(savedFields?.endDate),
                        // ]}
                        rules={!nullable ? rules : null}
                        format="YYYY-MM-DD"
                        // onChange={([moment, formatted]) =>
                        //   formatted.map(date => new Date(date).toISOString())
                        // }
                        placeholder={placeholder || "2015-01-01"}
                        as={
                          <Item errors={errors}>
                            <DatePicker showTime={false} />
                          </Item>
                        }
                        disabledDate={current => {
                          return moment() <= current && key == "dateOfBirth"
                        }}
                      />
                    )}
                  </FormDiv>
                </Col>
              )
            )
          })}
      </Row>
    </Form>
  )
}
