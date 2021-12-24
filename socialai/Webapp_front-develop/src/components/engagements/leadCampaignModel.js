import React from "react"
import { Modal, Button } from "antd"
import styled from "styled-components"
import CampaignListView from "./campaignListView"

const ModelDiv = styled.div`
  & .ant-list-item-meta-content {
    padding-top: 10px;
  }
`
const ModalWrap = styled(Modal)`
  .ant-modal-body {
    padding: 0;
  }
`

const LeadCampaignModalPopup = ({ visible, onCancel, lead }) => {
  return (
    <ModalWrap
      title={`${lead?.fullName || ""} is part of below campaigns`}
      maskClosable={false}
      visible={visible}
      onCancel={() => onCancel(false)}
      width={450}
      footer={[
        <Button key="back" onClick={() => onCancel(false)}>
          Cancel
        </Button>,
      ]}
    >
      <ModelDiv>
        <CampaignListView leadId={lead?.id} />
      </ModelDiv>
    </ModalWrap>
  )
}
export default LeadCampaignModalPopup
