import { Badge, Descriptions, Modal, Rate, Tag } from "antd"

const BadReviewModel = ({ visible, setVisible }) => {
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [error, setError] = useState("")

  const [submitSupport] = useMutation(SUBMIT_SUPPORT_TICKET)

  const handleSupportSubmit = () => {
    if (subject.trim() && body.trim()) {
      setError("")
      submitSupport({
        variables: {
          subject: subject,
          message: body,
        },
      }).then(d => {
        message.success("Message Sent")
        setVisible(false)
      })
    } else {
      setError("Please fill out all fields")
    }
  }
  return (
    <Modal
      title={"Need to report an issue? Have a question?"}
      visible={visible}
      onCancel={() => setVisible(false)}
      okText={"Send"}
      onOk={handleSupportSubmit}
    >
      <h4>Send us a message</h4>
      <p>
        Submit this form and a SocialMiningAi representative will contact you
        soon.
      </p>

      <label>Subject</label>
      <Input onChange={e => setSubject(e.target.value)} name={"subject"} />
      <br />
      <label>Message</label>
      <Input.TextArea
        rows={5}
        onChange={e => setBody(e.target.value)}
        name={"body"}
      />
      <br />
      {error && <Alert message={error} type={"error"} />}
    </Modal>
  )
}

export default BadReviewModel
