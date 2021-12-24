import React, { useState } from "react"
import { Drawer, message, Button } from "antd"
import CampaignDetailView from "../../engagements/campaignDetails"
import styled from "styled-components"
import Typography from "../../../library/typography"

const DrawerWrapper = styled(Drawer)`
  .ant-drawer-body {
    padding: 0;
  }
`
const DrawerBody = styled.div`
  & .ant-list-item {
    &:last-child {
      border-bottom: 1px solid #f1ecec;
    }
  }
`

const DrawerFooter = styled.div`
  position: absolute;
  right: 0;
  bottom: 0;
  width: 100%;
  padding: 10px 16px;
  background: #fff;
  text-align: right;
  border-top: 1px solid rgb(232, 232, 232);
`

const LeadCampaignViewModal = ({ visible, onCancel, campaign }) => {
  //const [campaignDetails, setCampaignDetails] = useState(campaign || {})
  return (
    <DrawerWrapper
      title={
        <Typography variant={"h4"} weight={"medium"}>
          {campaign?.name}
        </Typography>
      }
      placement="right"
      closable={false}
      visible={visible}
      width={"95%"}
      onClose={() => setOpenDrawer(false)}
    >
      <DrawerBody>
        <CampaignDetailView campaignDetails={campaign} showTitleRow={false} />
      </DrawerBody>
      <DrawerFooter>
        <Button style={{ marginRight: 20 }} onClick={() => onCancel()}>
          Close
        </Button>
      </DrawerFooter>
    </DrawerWrapper>
  )
}
export default LeadCampaignViewModal
