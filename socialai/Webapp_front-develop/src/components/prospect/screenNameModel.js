import React, { useState } from "react"
import { Input, Modal } from "antd"

const ScreenNameModel = ({ visible, setVisible, post, submitScreenName }) => {
  const [screenName, setScreenName] = useState("")

  const handleAddScreenNameClick = () => {
    console.log(screenName)
    submitScreenName({
      screenName: screenName,
      source: post.source,
      sourceId: post.sourceId,
      sourceUrl: post.sourceUrl,
    })
  }

  return (
    <Modal
      visible={visible}
      onCancel={() => setVisible(false)}
      onOk={handleAddScreenNameClick}
      okText={"Add"}
      cancelText={"Do not track"}
      title={"Set your screen name"}
    >
      <h3>
        In order to track your responses and keep you informed of your
        conversation updates we need your user name for{" "}
        <a href={post.sourceUrl} target={"_blank"} rel={"noopener noreferrer"}>
          {post.source}
        </a>
        .
      </h3>
      <p>
        Please enter you user name below and we will notify you when{" "}
        {post.author} responds to you.
      </p>
      <Input
        placeholder={"User name"}
        name={"screenName"}
        onChange={e => setScreenName(e.target.value)}
      />
    </Modal>
  )
}

export default ScreenNameModel
