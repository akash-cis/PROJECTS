import React, { useState } from "react"
import { List, Avatar } from "antd"
import styled from "styled-components"
import { useQuery } from "@apollo/react-hooks"
import { GET_CAMPAIGN_BY_LEAD } from "../../graphql/query"
import Typography from "../../library/typography"
import LeadCampaignViewModal from "../life-events/customerList/leadCampaignView"

const ListContainer = styled.div`
  & .ant-list-item-meta {
    text-align: left;
  }
  & .ant-list-item-meta-title{
    font-size:16px;
  }
  & .ant-list-item-meta-description > p{
    margin:bottom:0.4rem;
  }
  .ant-list-items{
    /*min-height:40vh;*/
  } 
`

const CampignListView = ({ leadId }) => {
  const [variables, setVariables] = useState({
    page: 1,
    pageSize: 25,
    leadId: parseInt(leadId),
  })
  const [openCampaignPopup, setOpenCampaignPopup] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState({})
  const { data, loading } = useQuery(GET_CAMPAIGN_BY_LEAD, {
    variables,
  })

  const count = data?.getCampaignByLead?.count || 0

  const onTitleClick = item => {
    setOpenCampaignPopup(true)
    setSelectedCampaign(item)
  }
  return (
    <ListContainer>
      <List
        itemLayout="horizontal"
        key={"lead_grid_view"}
        bordered={true}
        dataSource={data?.getCampaignByLead?.data || []}
        loading={loading}
        pagination={
          count < 5
            ? null
            : {
                defaultCurrent: variables.page,
                current: variables.page,
                defaultPageSize: variables.pageSize,
                pageSize: variables.pageSize,
                total: count || 0,
                showTotal: (total, range) =>
                  `Total: ${total} ${total === 1 ? "campaign" : "campaigns"}`,
                pageSizeOptions: ["5", "25", "50"],
                showSizeChanger: true,
                onChange: (page, pageSize) => {
                  let newVariables = {
                    ...variables,
                    page: page,
                    pageSize: pageSize,
                  }
                  setVariables(newVariables)
                },
                onShowSizeChange: (current, size) => {
                  let newVariables = {
                    ...variables,
                    page: current,
                    pageSize: size,
                  }
                  setVariables(newVariables)
                },
              }
        }
        renderItem={(item, i) => (
          <List.Item>
            <List.Item.Meta
              avatar={
                <Avatar size={50}>
                  {item
                    ? item.name
                      ? item.name.substring(0, 1).toUpperCase()
                      : "C"
                    : "C"}
                </Avatar>
              }
              title={
                <a onClick={() => onTitleClick(item)}>
                  <Typography variant={"small"} weight={"medium"}>
                    {(item?.name || "").toUpperCase()}
                  </Typography>
                </a>
              }
            />
          </List.Item>
        )}
      />
      {openCampaignPopup && (
        <LeadCampaignViewModal
          campaign={selectedCampaign}
          visible={openCampaignPopup}
          onCancel={() => setOpenCampaignPopup(false)}
        />
      )}
    </ListContainer>
  )
}
export default CampignListView
