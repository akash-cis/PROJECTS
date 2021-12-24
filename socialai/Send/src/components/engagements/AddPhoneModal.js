import React, { useState } from "react"
import { useMutation, useLazyQuery } from "@apollo/react-hooks"
import { Input, Button, List, Modal, message, Avatar, Row, Col } from "antd"
import PhoneInput from "react-phone-number-input"
import "react-phone-number-input/style.css"
import styled from "styled-components"
import { GET_PAGINATED_LEADS } from "../../graphql/query"
import Typography from "../../library/typography"
import isEmpty from "lodash/isEmpty"
import isUndefined from "lodash/isUndefined"

import { CREATE_LEAD, CREATE_LEAD_PHONE } from "../../graphql/mutation"

const ModelDiv = styled.div`
  & .ant-list-item-meta-content {
    padding-top: 10px;
  }
`
const PhoneDiv = styled.div`
  input {
    border: 1px solid #d9d9d9;
    width: 373px;
    padding: 5px;
    border-radius: 4px;
  }
`
const LabelWrap = styled.label`
  margin-bottom: 5px;
`
const SpanWrap = styled.span`
  color: red;
  margin-left: 2px;
`

const AddPhoneModal = ({
  phoneNumber,
  openModal = false,
  setModalVisible,
  onSetLead,
  variables,
  sources,
}) => {
  let _phone = isUndefined(phoneNumber)
    ? ""
    : phoneNumber.length == 10
    ? `+1${phoneNumber}`
    : phoneNumber.length == 11
    ? `+${phoneNumber}`
    : phoneNumber

  const [phone, setPhone] = useState(_phone)
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [leads, setLeads] = useState([])

  const [createLead, { loading: leadsLoading }] = useMutation(CREATE_LEAD)
  const [createLeadPhone, { loading: phoneLoading }] = useMutation(
    CREATE_LEAD_PHONE
  )

  const [getLeads, { loading }] = useLazyQuery(GET_PAGINATED_LEADS, {
    fetchPolicy: "network-only",
    variables: { ...variables, pageSize: 5 },
    onCompleted: resp => {
      setLeads(resp?.getLeads?.data || [])
    },
  })
  const handleSearch = e => {
    getLeads({ variables: { ...variables, page: 1, search: e } })
  }
  const handleSave = e => {
    if (e) {
      if (isEmpty(phone)) {
        message.error("Please enter phone number")
        return
      }
      if (isEmpty(firstName)) {
        message.error("Please enter first name")
        return
      }
      if (isEmpty(lastName)) {
        message.error("Please enter last name")
        return
      }
      const _sources = _.orderBy(sources, ["isSource", "id"], ["asc", "asc"])
      const defaultSource = _sources[0]?.id || 7
      createLead({
        variables: {
          firstName: firstName,
          lastName: lastName,
          fullName: `${firstName} ${lastName}`,
          leadSourceType: "MANUAL",
          leadSourceOriginalId: defaultSource,
          phone: phone,
        },
      }).then(res => {
        if (res?.data?.createLead?.statusCode == 200) {
          const lead = res?.data?.createLead?.lead || {}
          if (!isEmpty(lead)) {
            createLeadPhone({
              variables: {
                leadId: lead?.id,
                phone: phone,
              },
            }).then(resp => {
              if (resp?.data?.createLeadPhone?.statusCode == 200) {
                message.success("Successfully added phone.")
                onSetLead(
                  {
                    ...lead,
                    phoneNumbers: [{ phone: phone }],
                  },
                  "new"
                )
                setModalVisible(false)
              } else {
                message.error(resp?.data?.createLeadPhone?.message)
              }
            })
          }
        } else {
          message.error(res?.data?.createLead?.message)
        }
      })
    }
  }
  return (
    <Modal
      title={
        <Typography variant={"small"} weight={"medium"}>
          Add Phone
        </Typography>
      }
      maskClosable={false}
      visible={openModal}
      onOk={() => setModalVisible(false)}
      onCancel={() => setModalVisible(false)}
      width={400}
      footer={[
        <Button key="back" onClick={() => setModalVisible(false)}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          onClick={e => handleSave(e)}
          loading={phoneLoading || leadsLoading}
          disabled={leads.length > 0}
        >
          Save
        </Button>,
      ]}
    >
      <ModelDiv>
        <Row gutter={[4, 16]}>
          <Col span={24}>
            <LabelWrap>
              Phone Number<SpanWrap>*</SpanWrap>
            </LabelWrap>
            <PhoneDiv>
              <PhoneInput
                defaultCountry="US"
                value={phone}
                placeholder="Enter phone number"
                onChange={e => {
                  if (e != "" && (e || "").length > 3) {
                    handleSearch(e)
                  }
                  setPhone(e)
                }}
              />
            </PhoneDiv>
          </Col>
        </Row>
        {leads.length > 0 && !isEmpty(phone) && (
          <Row gutter={[4, 16]}>
            <Col span={24}>
              <Typography variant={"small"} weight={"medium"}>
                Lead is already exists for this phone number, so you can just
                click on this lead and go to activity center.
              </Typography>
            </Col>
          </Row>
        )}

        {leads.length > 0 && !isEmpty(phone) && (
          <Row gutter={[4, 16]}>
            <Col span={24}>
              <List
                itemLayout="horizontal"
                dataSource={leads}
                loading={loading}
                pagination={false}
                renderItem={item => (
                  <List.Item>
                    <List.Item.Meta
                      onClick={() => {
                        onSetLead({ ...item }, "")
                        setModalVisible(false)
                      }}
                      avatar={
                        <Avatar size={40}>
                          {item?.fullName
                            ? item?.fullName.substring(0, 1).toUpperCase()
                            : "X"}
                        </Avatar>
                      }
                      title={
                        <a>
                          <Typography variant={"small"} weight={"medium"}>
                            {item?.fullName || ""}{" "}
                            {
                              <>
                                (
                                {item?.phoneNumbers &&
                                  (item?.phoneNumbers[0]?.phone || "")}
                                )
                              </>
                            }
                          </Typography>
                        </a>
                      }
                    />
                  </List.Item>
                )}
              />
            </Col>
          </Row>
        )}
        {leads.length <= 0 && !isEmpty(phone) && (
          <>
            <Row gutter={[4, 16]}>
              <Col span={24}>
                <LabelWrap>
                  First Name<SpanWrap>*</SpanWrap>
                </LabelWrap>
                <Input
                  placeholder={"First Name"}
                  name={"firstName"}
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                />
              </Col>
            </Row>
            <Row gutter={[4, 16]}>
              <Col span={24}>
                <LabelWrap>
                  Last Name<SpanWrap>*</SpanWrap>
                </LabelWrap>
                <Input
                  placeholder={"Last Name"}
                  name={"lastName"}
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                />
              </Col>
            </Row>
          </>
        )}
      </ModelDiv>
    </Modal>
  )
}

export default AddPhoneModal
