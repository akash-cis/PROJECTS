import React, { useState } from "react"
import { useQuery, useLazyQuery, useMutation } from "@apollo/react-hooks"
import { Input, Button, List, Modal, message, Avatar, Row, Col } from "antd"
import PhoneInput from "react-phone-number-input"
import "react-phone-number-input/style.css"
import styled from "styled-components"
import { GET_PAGINATED_LEADS } from "../../graphql/query"
import Typography from "../../library/typography"
import isEmpty from "lodash/isEmpty"
import isUndefined from "lodash/isUndefined"
import { ImageGroup, Image } from 'react-fullscreen-image'

import { GET_PAGINATED_REVIEW_MESSAGE_TEMPLATE } from "../../graphql/query"

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

let images = []

const ReviewSendConfirmationModal = ({
  selectedLead,
  user,
  openModal = false,
  setModalVisible,
  sendSendReview
}) => {
  const getImages = useQuery(GET_PAGINATED_REVIEW_MESSAGE_TEMPLATE, {
    variables: { companyId: user?.company?.id || 0, userID: user?.id || 0 },
    onCompleted: res => {
      console.log('user:'+user)
      console.log(res.getPaginatedReviewMessageTemplate.data)
      // let images = []
      for (const element of res.getPaginatedReviewMessageTemplate.data) {
        console.log(element.fullFilePath)
        images.push(element.fileName)
      }
      console.log(images)
      console.log(images[0])
    },
  })

  return (
    <Modal
      title={
        <Typography variant={"small"} weight={"medium"}>
          Send a review message to
        </Typography>
      }
      maskClosable={false}
      visible={openModal}
      onOk={() => sendSendReview()}
      onCancel={() => setModalVisible(false)}
      width={400}
      footer={[
        <Button onClick={() => setModalVisible(false)}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          onClick={e => {
            sendSendReview()
            setModalVisible(false)
          }}
        >
          Send
        </Button>,
      ]}
    >


      <ModelDiv>
        {/* <p>Message will be sent to -</p> */}
        <Row gutter={[4, 16]}>
          <Col span={24}>
            <LabelWrap>
              <b>Full Name:</b>{" "}{selectedLead?.fullName || "N/A"}{" "}
              <br/>
              <b>Phone Number:</b>{" "}{selectedLead?.phoneNumbers
                ? selectedLead?.phoneNumbers[0]?.phone
                : "N/A"}
            </LabelWrap>

          </Col>
          {/* <Col style={{textAlign: 'center'}} span={24}>
            <img src="https://images.ctfassets.net/t21gix3kzulv/2VCzvnu6f2Rn7GgGdSac1B/ef81004b8e07b6af376608aa1745a0cb/templates-hero-desktop.jpg" height={200} />
            </Col> */}

        </Row>


      </ModelDiv>
    </Modal>
  )
}

export default ReviewSendConfirmationModal
