import React, { useState } from "react"
import { Alert, Button, Input } from "antd"
import styled from "styled-components"
import { Container } from "../../library/basicComponents"
import { useQuery, useLazyQuery, useMutation } from "@apollo/react-hooks"
import { CREATE_REVIEW } from "../../graphql/mutation"
import { message } from "antd"
export const jwt = require('jsonwebtoken');
import { GET_COMPANY } from "../../graphql/query"



let endPoint = (
  process.env.GATSBY_API_URL || "http://localhost:5000/graphql"
).replace("/graphql", "")


const ContainerWrap = styled(Container)`
  display: grid;
  justify-content: center;
  align-items: center;
  padding: 40px;
  margin: 15px
  over-flow: none;
  .ant-fullcalendar-fullscreen .ant-fullcalendar-date {
    height: 80px;
  }
  .ant-radio-group ant-radio-group-outline ant-radio-group-default {
    display: none;
  }
  .ant-fullcalendar-fullscreen .ant-fullcalendar-header .ant-radio-group {
    display: none;
  }
`

const InlineFormButton = styled(Button)`
  margin: 12px 0 0 16px;
  max-width: 150px;
  float: right;
`

const BadReview = ({token, uri, location}) => {
  console.log('token: '+token)
  console.log('uri: '+uri)
  const decoded = jwt.verify(token, 'shhhhh')
  
  const [email, setEmail] = useState("")
  const [head, setHead] = useState("")
  const [body, setBody] = useState("")
  const [error, setError] = useState("")

  const [submitReview] = useMutation(CREATE_REVIEW)

  const handleReviewSubmit = () => {
    if (email.trim() && head.trim() && body.trim()) {
      setError("")
      console.log(email, head, body)

      submitReview({
        variables: {
          email: email,
          head: head,
          body: body,
          company: decoded.company,
          _type: "bad",
        },
      })
      .then(d => {
        message.success("Review Sent! We will try to improve our services.")
        // setBadVisible(false)
      })
    } else {
      setError("Please fill out all fields")
    }
  }
  return (
    <ContainerWrap auto>
      <strong level={5}>
        Please write to us. Why you dislike our service? We will try to get
        better in every aspect!
      </strong>
      <br />
      <br />
      <label>Email</label>
      <Input onChange={e => setEmail(e.target.value)} name={"email"} />
      <br />
      <label>Subject</label>
      <Input onChange={e => setHead(e.target.value)} name={"head"} />
      <br />
      <label>Message</label>
      <Input.TextArea
        rows={5}
        onChange={e => setBody(e.target.value)}
        name={"body"}
      />
      <br />
      {error && <Alert message={error} type={"error"} />}
      <InlineFormButton onClick={() => handleReviewSubmit()} type="primary">
        Submit
      </InlineFormButton>
    </ContainerWrap>
  )
}
export default BadReview
