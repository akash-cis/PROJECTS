import React, { useState, useContext, useRef } from "react"
import { Row, Col, Card, List, Button, Table, Icon, Tag, Tabs } from "antd"
import { Container, ContainerNavigation } from "../../library/basicComponents"
import Typography from "../../library/typography"
import styled from "styled-components"

import {
  GET_CAMPAIGN_LEAD_SUMMARY,
  GET_LEAD_SOURCES,
  GET_LEAD_STATUS_TYPES,
} from "../../graphql/query"
import { useQuery } from "@apollo/react-hooks"
import { UserContext } from "../../amplify/authenticator-provider"
import FilterDropdown from "../../library/filterDropdown"
import FilterTextBox from "../../library/filterTextbox"
import moment from "moment"
import isEmpty from "lodash/isEmpty"
import { toSnake } from "../../utils"
import ScheduleView from "./schedule"
import { convertUtcToLocal } from "../../library/utils"

const Title = styled.div`
  padding-left: 0.5rem;
  font-weight: bold;
`
const CardWrapper = styled(Card)`
  padding: 15px;
  border: 0 !important;
`
const CardStatsBox = styled(Card)`
  box-shadow: 0 2px 4px 1px rgb(0 0 0 / 15%) !important;
  text-align: center;
  cursor: pointer;
  & .ant-card-head-title {
    color: #00648d !important;
  }
`

const CardTitle = styled(props => (
  <Typography variant="h4" weight="medium" {...props} />
))`
  text-transform: uppercase;
  color: #5e5e5e;
  padding-bottom: 0.5rem;
`
export const CardChange = styled.span`
  border-radius: 5px;
  padding: 8px;
  background-color: ${props => (props.positive ? "#E2F9F0" : "#FFE6E6")};
  color: ${props => (props.positive ? "#3ED57F" : "#FF4852")};
  display: inline-block;

  &:last-child {
    margin-bottom: 0;
  }
`
const Caret = styled.img`
  margin: 0;
  margin-right: 5px;
`

const { TabPane } = Tabs
const { Column } = Table

const SourcesTags = ({ data = [], sources = [] }) => {
  const tags = (data || []).map((el, index) => {
    let obj = (sources || []).find(e => e.id == el.value)
    if (obj) {
      return <Tag key={el.id}>{obj?.name} </Tag>
    }
  })
  return tags
}

const campaignDetails = ({
  campaignDetails,
  onBackClick,
  showTitleRow = true,
}) => {
  const { user } = useContext(UserContext)
  const searchInputRef = useRef("")
  const [activeTab, setActiveTab] = useState("details")
  const [campaignStatsData, setCampaignStatsData] = useState([])

  const { data: sourcesData } = useQuery(GET_LEAD_SOURCES)
  const [variables, setVariables] = useState({
    campaignId: campaignDetails?.id,
    page: 1,
    pageSize: 25,
    search: "",
  })

  const { data: respStatus } = useQuery(GET_LEAD_STATUS_TYPES)
  const leadStatusList = (respStatus?.leadStatusTypes || []).map(e => ({
    name: e?.type + " / " + e?.status.replace(/_/g, " "),
    id: e?.id,
  }))

  const { data: resp, refetch, loading } = useQuery(GET_CAMPAIGN_LEAD_SUMMARY, {
    fetchPolicy: "network-only",
    variables,
    onCompleted: result => {
      if (!isEmpty(result?.getCampaignLeadSummary?.leadMessageCount)) {
        const messageCount =
          result?.getCampaignLeadSummary?.leadMessageCount || {}
        let statsData = [
          {
            id: 1,
            title: "Messages Sent",
            count: messageCount?.totalSent || 0,
            isPositive: true,
            change: 100,
            previous: 350,
            isPercentage: false,
          },
          {
            id: 2,
            title: "Responses Received",
            count: messageCount?.totalResponded || 0,
            isPositive: true,
            change: 20,
            previous: 280,
            isPercentage: false,
          },
          {
            id: 3,
            title: "Engagements",
            count: messageCount?.totalEngaged || 0,
            isPositive: true,
            change: messageCount?.totalEngaged || 0,
            previous: 395,
            isPercentage: false,
          },
          {
            id: 4,
            title: "Avg Attempts Before Response",
            count: messageCount?.avgAttemptsBeforeResponse || 0,
            isPositive: true,
            change: 0.5,
            previous: 2,
            isPercentage: false,
          },
          {
            id: 5,
            title: "Response Rate",
            count: messageCount?.responseRate || 0,
            isPositive: true,
            change: 8,
            previous: 35,
            isPercentage: true,
          },
          {
            id: 6,
            title: "Opt. Out Rate",
            count: messageCount?.optOutRate || 0,
            isPositive: true,
            change: 1,
            previous: 3,
            isPercentage: true,
          },
        ]
        setCampaignStatsData(statsData)
      }
    },
  })

  let leadData = resp?.getCampaignLeadSummary?.data || []

  const handleNameSearch = e => {
    setVariables({ ...variables, page: 1, search: e })
  }

  const handleStatusSearch = e => {
    if (e) {
      setVariables({ ...variables, page: 1, status: e })
    }
  }

  const handleAttempSearch = e => {
    if (e) {
      setVariables({ ...variables, page: 1, attempt: e })
    }
  }

  const columnCount = () => {
    return window.innerWidth > 980
      ? 3
      : window.innerWidth <= 980 && window.innerWidth > 480
      ? 2
      : 1
  }

  return (
    <Container auto style={{ marginTop: !showTitleRow ? 0 : "2rem" }}>
      {showTitleRow && (
        <ContainerNavigation>
          <Typography variant={"h4"} weight={"medium"}>
            {campaignDetails?.name}
          </Typography>

          <div>
            <Button onClick={onBackClick}>Back</Button>
          </div>
        </ContainerNavigation>
      )}

      <Row gutter={[4, 0]}>
        <Col xs={24} sm={24} md={6} lg={6} xl={6}>
          <CardWrapper>
            <p>
              <Typography variant={"h4"} weight={"bold"} inline>
                Date:{" "}
              </Typography>

              {moment
                .utc(campaignDetails.dateCreated)
                .format("MM/DD/YYYY hh:mm A")}
            </p>
            {!isEmpty(campaignDetails?.startDate) ? (
              <>
                <p>
                  <Typography variant={"h4"} weight={"bold"} inline>
                    Start Date:{" "}
                  </Typography>

                  {campaignDetails.startDate &&
                    convertUtcToLocal(
                      campaignDetails.startDate,
                      "MM/DD/YYYY hh:mm A"
                    )}
                </p>
                <p>
                  <Typography variant={"h4"} weight={"bold"} inline>
                    End Date:{" "}
                  </Typography>

                  {campaignDetails.endDate &&
                    convertUtcToLocal(
                      campaignDetails.endDate,
                      "MM/DD/YYYY hh:mm A"
                    )}
                </p>
              </>
            ) : (
              <>
                <p>
                  <b>This campaign have immediate start schedule</b>{" "}
                </p>
              </>
            )}

            <p>
              <Typography variant={"h4"} weight={"bold"} inline>
                Sales Person:{" "}
              </Typography>
              {campaignDetails?.user?.fullName || ""}
            </p>
            <p>
              <Typography variant={"h4"} weight={"bold"} inline>
                Total Leads:{" "}
              </Typography>
              {resp?.getCampaignLeadSummary?.count || 0}
            </p>
            <p>
              <Typography variant={"h4"} weight={"bold"} inline>
                Leads Uncontacted:{" "}
              </Typography>
              {resp?.getCampaignLeadSummary?.leadMessageCount
                ?.totalUncontacted || 0}
            </p>
            <p>
              <Typography variant={"h4"} weight={"bold"} inline>
                Leads Reached:{" "}
              </Typography>

              {resp?.getCampaignLeadSummary?.leadMessageCount?.totalDelivered ||
                0}
            </p>
            <p>
              <Typography variant={"h4"} weight={"bold"} inline>
                Leads Responded:{" "}
              </Typography>

              {resp?.getCampaignLeadSummary?.leadMessageCount?.totalResponded ||
                0}
            </p>
            <p>
              <Typography variant={"h4"} weight={"bold"} inline>
                Sources:{" "}
              </Typography>
              {(campaignDetails?.campaignSelections || []).filter(
                el => el.type == "SOURCE"
              ).length > 0 ? (
                <SourcesTags
                  data={(campaignDetails?.campaignSelections || []).filter(
                    el => el.type == "SOURCE"
                  )}
                  sources={sourcesData?.leadSources || []}
                />
              ) : (
                <Tag key={"key_all"}>All</Tag>
              )}
            </p>
            <p>
              <Typography variant={"h4"} weight={"bold"} inline>
                Status:{" "}
              </Typography>
              {(campaignDetails?.campaignSelections || []).filter(
                el => el.type == "STATUS"
              ).length > 0 ? (
                <SourcesTags
                  data={(campaignDetails?.campaignSelections || []).filter(
                    el => el.type == "STATUS"
                  )}
                  sources={leadStatusList}
                />
              ) : (
                <Tag key={"key_all"}>All</Tag>
              )}
            </p>
          </CardWrapper>
        </Col>
        <Col
          style={{ padding: "24px" }}
          xs={24}
          sm={24}
          md={18}
          lg={18}
          xl={18}
        >
          <List
            grid={{ gutter: 20, column: columnCount() }}
            dataSource={campaignStatsData}
            renderItem={item => (
              <List.Item>
                <CardStatsBox key={item.id} onClick={() => {}}>
                  <CardTitle>{item.title}</CardTitle>
                  <Typography weight="bold" variant="h1">
                    {item.isPercentage
                      ? parseFloat(item.count).toFixed(2)
                      : item.count}
                    {item.isPercentage && "%"}
                  </Typography>
                </CardStatsBox>
              </List.Item>
            )}
          />
        </Col>
      </Row>
      <Row>
        <Col span={24} style={{ padding: "24px", paddingTop: 0 }}>
          <Tabs activeTab={activeTab} onChange={setActiveTab}>
            <TabPane
              tab={
                <Typography variant={"h4"} weight={"medium"} inline>
                  Details
                </Typography>
              }
              key="details"
            >
              <Table
                dataSource={leadData}
                rowKey={"id"}
                onChange={(pagination, filters, sorter) => {
                  const parsedSorter = {}

                  switch (sorter.order) {
                    case "ascend":
                      parsedSorter.orderDirection = "asc"
                      break
                    case "descend":
                      parsedSorter.orderDirection = "desc"
                      break
                    default:
                      parsedSorter.orderDirection = null
                      break
                  }

                  parsedSorter.orderBy = toSnake(sorter.columnKey) || ""

                  let newVariables = {
                    ...variables,
                    ...parsedSorter,
                    page:
                      variables.pageSize !== pagination.pageSize
                        ? 1
                        : pagination.current,
                    pageSize: pagination.pageSize,
                  }

                  if (!parsedSorter.orderBy || !parsedSorter.orderDirection) {
                    delete newVariables.orderBy
                    delete newVariables.orderDirection
                  }

                  setVariables(newVariables)
                }}
                pagination={{
                  defaultCurrent: variables.page,
                  current: variables.page,
                  defaultPageSize: variables.pageSize,
                  pageSize: variables.pageSize,
                  total: resp?.getCampaignLeadSummary?.count,
                  showTotal: (total, range) =>
                    `Total: ${total} ${total === 1 ? "leads" : "leads"}`,
                  pageSizeOptions: ["5", "25", "50"],
                  showSizeChanger: true,
                }}
              >
                <Column
                  title={"Name"}
                  dataIndex={"fullName"}
                  key={"fullName"}
                  defaultSortOrder={"ascend"}
                  sorter={true}
                  render={(value, record) => {
                    return record?.lead?.fullName || ""
                  }}
                  filterIcon={filtered => (
                    <Icon
                      type="search"
                      style={{ color: filtered ? "#1890ff" : undefined }}
                    />
                  )}
                  filterDropdown={props => (
                    <FilterTextBox
                      {...props}
                      searchInputRef={searchInputRef}
                      confirm={e => handleNameSearch(e)}
                    />
                  )}
                  onFilter={(value, record) => record.fullName.includes(value)}
                />
                <Column
                  title={"Status"}
                  dataIndex={"status"}
                  key={"status"}
                  sorter={true}
                  filters={[
                    {
                      text: "UNCONTACTED",
                      value: "UNCONTACTED",
                    },
                    {
                      text: "QUEUED",
                      value: "QUEUED",
                    },
                    {
                      text: "SENT",
                      value: "SENT",
                    },
                    {
                      text: "FAILED",
                      value: "FAILED",
                    },
                    {
                      text: "DELIVERED",
                      value: "DELIVERED",
                    },
                    {
                      text: "RESPONDED",
                      value: "RESPONDED",
                    },
                    {
                      text: "ENGAGED",
                      value: "ENGAGED",
                    },
                    {
                      text: "OPT_OUT",
                      value: "OPT_OUT",
                    },
                  ]}
                  filterDropdown={props => (
                    <FilterDropdown
                      {...props}
                      dataIndex={"Status"}
                      confirm={e => handleStatusSearch(e)}
                    />
                  )}
                />
                <Column
                  title={"Last Message Sent"}
                  dataIndex={"lastMessageSentDate"}
                  key={"lastMessageSentDate"}
                  sorter={true}
                  render={(value, record) => {
                    if (record.lastMessageSentDate !== null) {
                      return moment
                        .utc(record.lastMessageSentDate)
                        .format("MM/DD/YYYY hh:mm A")
                    } else {
                      return "N/A"
                    }
                  }}
                />
                <Column
                  title={"Last Response Received"}
                  dataIndex={"lastMessageReceivedDate"}
                  key={"lastMessageReceivedDate"}
                  sorter={true}
                  render={(value, record) => {
                    if (record.lastMessageReceivedDate !== null) {
                      return moment
                        .utc(record.lastMessageReceivedDate)
                        .format("MM/DD/YYYY hh:mm A")
                    } else {
                      return "N/A"
                    }
                  }}
                />
                <Column
                  title={"Attempts Before Response"}
                  dataIndex={"numAttemptsBeforeResponse"}
                  key={"numAttemptsBeforeResponse"}
                  align={"center"}
                  sorter={true}
                  render={(value, record) => {
                    return record.numAttemptsBeforeResponse != 0
                      ? record.numAttemptsBeforeResponse
                      : "N/A"
                  }}
                  filters={[
                    {
                      text: "N/A",
                      value: "0",
                    },
                    {
                      text: "1",
                      value: "1",
                    },
                    {
                      text: "2",
                      value: "2",
                    },
                    {
                      text: "3",
                      value: "3",
                    },
                    {
                      text: "4",
                      value: "4",
                    },
                    {
                      text: "> 4",
                      value: ">4",
                    },
                  ]}
                  filterDropdown={props => (
                    <FilterDropdown
                      {...props}
                      dataIndex={"Attempts"}
                      confirm={handleAttempSearch}
                    />
                  )}
                />
              </Table>
            </TabPane>
            <TabPane
              tab={
                <Typography variant={"h4"} weight={"medium"} inline>
                  Messages
                </Typography>
              }
              key="messages"
            >
              <ScheduleView
                currentCampaign={campaignDetails}
                fromCampagin={true}
                campaignBy={
                  (campaignDetails?.campaignSelections || []).length > 0 &&
                  campaignDetails?.campaignSelections[0].type
                }
                showHeaderSection={false}
              />
            </TabPane>
          </Tabs>
        </Col>
      </Row>
    </Container>
  )
}
export default campaignDetails
