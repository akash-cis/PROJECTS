import React, { useContext, useEffect, useState } from "react"
import styled from "styled-components"
import { Button, Modal, Upload, Popover, Icon, message } from "antd"
//import { UserContext } from "../../amplify/authenticator-provider"

const RequirementsCntr = styled.div`
  cursor: pointer;
  margin-bottom: 26px;
`

const TwoColumns = styled.div`
  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
  width: 100%;
  & ul {
    width: 49%;
  }
`

const ReviewTemplate = ({ sources, isVisible, setIsVisible }) => {
  const [file, setFile] = useState(null)
  // const [showModal, setShowModal] = useState(isVisible)
  //const { user } = useContext(UserContext)

  let api_url = process.env.GATSBY_API_URL || "http://localhost:5000/graphql"
  api_url = api_url.split("/graph")[0]

  const uploadProps = {
    accept: ".jpg",
    beforeUpload: file => {
      console.log(file)
      setFile(file)
      return false
    },
    onRemove: file => {
      setFile(null)
    },
  }

  const handleUpload = () => {
    console.log("Starting upload....")
    const hide = message.loading("Upload In Progress...", 0)
    const formData = new FormData()
    formData.append("file", file)
    fetch(api_url + "/review-template/upload", {
      method: "POST",
      mode: "cors",
      headers: {
        Authorization: "Bearer " + sessionStorage.getItem("token"),
      },
      body: formData,
    })
      .then(res => res.json())
      .then(results => {
        hide()
        if (results && results.ok) {
          message.success("Successfully uploaded")
        } else {
          message.error("Unable to upload document. Please try again")
        }
        setFile(null)
        setShowModal(false)
        if (setIsVisible) {
          setIsVisible({
            visible: false
            // fileId: results?.file_id,
          })
        }
      })
      .catch(err => {
        hide()
        console.log(err)
        message.error("Error occured during upload.")
      })
  }

  // Used to keep default hide/show animation for modal
  // useEffect(() => {
  //   setTimeout(() => {
  //     setIsVisible(showModal)
  //   }, 800)
  // }, [showModal])

  return (
    <Modal
      title={"Import Customer list"}
      visible={isVisible}
      onCancel={() => {
        // setShowModal(false)
        setIsVisible(false)
        // if (setIsVisible) {
        //   setIsVisible({
        //     visible: false,
        //   })
        // }
      }}
      onOk={handleUpload}
      okText={"Upload"}
      okButtonProps={file ? {} : { disabled: true }}
    >
      <RequirementsCntr>
        <p>
          Upload a Review message template that you can send 
          to the client while sending your review message.
        </p>
      </RequirementsCntr>
      <Upload {...uploadProps} multiple="false" maxCount={1}>
        <Button icon={"upload"}>Select jpg image template</Button>
      </Upload>
    </Modal>
  )
}

export default ReviewTemplate
