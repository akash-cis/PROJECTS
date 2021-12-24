import React from "react"
import { Collapse } from "antd"
import styled from "styled-components"
import { Colors } from "../../library/constants"

const FaqCntr = styled.div`
  margin: 0 auto;
  padding: 40px 32px;
`

const CollapseHeader = styled(Collapse)`
  & div.ant-collapse-header {
    background-color: ${Colors.lightBrandBlue};
  }
`

const FAQ = () => {
  const { Panel } = Collapse
  return (
    <FaqCntr>
      <h3>Frequently Asked Questions</h3>
      <p>
        Dont see your question? Contact us at{" "}
        <a href="mailto:support@socialminingai.com">
        support@socialminingai.com
        </a>{" "}
        and we would be glad to help.
      </p>
      <CollapseHeader>
        {faqInfo.map((faq, idx) => (
          <Panel key={idx} header={faq.question}>
            {faq.answer}
          </Panel>
        ))}
      </CollapseHeader>
    </FaqCntr>
  )
}

export default FAQ

const faqInfo = [
  {
    question: "How do I add filters to the Prospects page?",
    answer:
      "On the Prospects page, you can choose filters like “Buy Car”, “Sell Car”, or makes from the left side bar. Just click on the filters you would like to add and scroll down to press “Refresh Prospects” to see an updated list. For additional keyword, location, and source filters click the 'Manage filters' button on the top of the prospect page to bring up the filters modal.",
  },
  {
    question: "How do I set up teams and view my team’s analytics?",
    answer:
      "You can set up and manage teams from the Settings page. Once of the “Manage Teams” tab click the 'Add a team' button to create a new team or the 'Edit pencil' to edit an existing team. Once you have a team set up go “Analytics” page to get insights into your team’s performance.",
  },
  {
    question: "How do I set up response messages?",
    answer:
      "In Settings, go to the Response Templates tab to create and edit your responses. When you're ready to respond to a prospective customer, you'll have the option to choose one of these messages.",
  },
  {
    question: "How do I review my notification settings?",
    answer:
      "Make smarter decisions with specific preferences of all your prospective customers, including locations-based analytics.",
  },
]
