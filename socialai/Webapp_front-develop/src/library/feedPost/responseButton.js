import { Dropdown, Modal } from "antd"
import moment from "moment"
import React, { useRef, useState } from "react"
import {
  ActionGroup,
  ButtonCustom,
  SVGIcon,
  TooltipButton,
} from "../basicComponents"
import { ResponseBody, ResponseTitle } from "./elements"
import TextInput from "../textInput"
import AirplaneIconWhite from "../../../static/icons/AirplaneIconWhite.svg"
import ResponseIcon from "../../../static/icons/ResponseIcon.svg"
import ChatIcon from "../../../static/icons/ChatIconWhite.svg"
import { ProspectStatus } from "../constants"

export const ResponseButtonModal = ({ selectedPost, show, closeModal, onClickBtn }) => {
  const response = useRef("")

  return (
    <Modal
      width={700}
      title={
        selectedPost
          ? `Response to ${selectedPost.name || "..."} from ${
              selectedPost.source
            }`
          : "Response"
      }
      visible={show}
      onOk={() => closeModal()}
      onCancel={() => {
        closeModal()
        // setResponseVisible(false)
        response.current.value = ""
      }}
      footer={
        <ActionGroup>
          <TextInput
            id="text"
            reference={response}
            placeholder={"Type a response"}
            name={"response"}
            small
          />
          <Dropdown overlay={() => {}} placement={"bottomRight"}>
            <ButtonCustom shape="circle">
              <SVGIcon component={ResponseIcon} alt="Response" />
            </ButtonCustom>
          </Dropdown>
          <TooltipButton
            type="primary"
            tooltip="Copy response & Go to post"
            shape="circle"
            onClick={() => {
              onClickBtn(selectedPost.id, ProspectStatus.ACCEPTED, selectedPost.url);
              if (selectedPost.url) {
                response.current.select()
                document.execCommand("copy")
                // setResponseVisible(false)
                window.open(selectedPost.url, "_blank")
                response.current.value = ""
              }
            }}
            component={AirplaneIconWhite}
            alt="Accept"
          />
        </ActionGroup>
      }
    >
      {selectedPost && (
        <div>
          URL: {selectedPost.url}
          <ResponseTitle>
            <p style={{ flex: 9 }}>PROSPECT'S POST</p>
            <p style={{ flex: 1 }}>
              {moment(selectedPost.timestamp).format("MM.DD.YYYY")}
            </p>
          </ResponseTitle>
          <ResponseBody>{selectedPost.body}</ResponseBody>
        </div>
      )}
    </Modal>
  )
}

export const ResponseButton = ({ item, updateStatus }) => {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <TooltipButton
        tooltip="Respond"
        type={"primary"}
        shape="circle"
        onClick={() => {
          setShowModal(true)
        }}
        component={ChatIcon}
        alt="Chat"
      />
      <ResponseButtonModal
        selectedPost={item}
        show={showModal}
        closeModal={() => setShowModal(false)}
        onClickBtn={updateStatus}
      />
    </>
  )
}
