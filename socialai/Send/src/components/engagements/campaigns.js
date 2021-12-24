import React, {
  forwardRef,
  useState,
  useImperativeHandle,
  useContext,
} from "react"
import moment from "moment"
import {
  Button,
  Row,
  Col,
  List,
  Card,
  Steps,
  Input,
  Checkbox,
  Switch,
  message,
  Tag,
  Modal,
  Alert,
  Tabs,
} from "antd"
import styled from "styled-components"
import { useQuery, useMutation } from "@apollo/react-hooks"
import { CustomerList } from "../life-events/customerList"
import { showConfirmationModal } from "../../library/helpers"
import {
  Container,
  Content,
  ContentBody,
  ContainerNavigation,
  NoPaddingButton,
  SecondaryButton,
  LoadingIcon,
  IconCustom,
} from "../../library/basicComponents"
import { InternalDivider } from "../../library/activityComponents"
import Typography from "../../library/typography"
import SelectSchedule from "../../library/selectSchedule"
import ScheduleView from "./schedule"

import CsvImport from "../life-events/csvImport"
import { isEmpty, map, uniqBy } from "lodash"
import { convertUtcToLocal } from "../../library/utils"

import {
  GET_CAMPAIGN_PAGINATED_LIST,
  GET_LEAD_SOURCES,
  GET_LEADS_COUNT_BY_CAMPAIGN,
  GET_CAMPAIGN_DETAILS,
  GET_LEAD_STATUS_TYPES,
} from "../../graphql/query"

import {
  CREATE_CAMPAIGN,
  UPDATE_CAMPAIGN,
  CREATE_CAMPAIGN_SELECTIONS,
  CLONE_CAMPAIGN,
  CREATE_CAMPAIGN_LEAD_SUMMARY,
  DELETE_CAMPAIGN,
} from "../../graphql/mutation"
import { UserContext } from "../../amplify/authenticator-provider"
import isUndefined from "lodash/isUndefined"
import TemplateDrawer from "./templateDrawer"
import CampaignDetails from "./campaignDetails"
const MODAL_TITLE = `Do you want to continue?`
const MODAL_CONTENT = `When clicked the OK button, it cannot be recovered`
const { TabPane } = Tabs

const ButtonWrap = styled(Button)`
  width: 170px;
`
const ContainerBody = styled.div`
  padding: ${props => (props.spaced ? "1.5rem" : "1em")};
  padding: ${props => (props.noVertical ? "0 1rem" : "1em")};
  margin-bottom: 1rem;
`
const ContentBodyWrapper = styled(ContentBody)`
  margin: 0 1em !important;
`

const Title = styled.div`
  padding-left: 1rem;
  font-weight: bold;
`
const CardWrapper = styled(Card)`
  box-shadow: 0 2px 4px 1px rgb(0 0 0 / 15%) !important;
  min-height: 450px;
  max-height: 450px;
  & .ant-card-head-title {
    color: #00648d !important;
  }
  .ant-card-actions {
    background-color: #fff;
  }
  .ant-card-body {
    padding: 15px 24px;
    overflow-x: auto;
    height: 335px;
    scrollbar-width: thin;
    &::-webkit-scrollbar {
      width: 7px;
      background-color: #f1f1f1;
    }

    &::-webkit-scrollbar-track {
      -webkit-box-shadow: inset 0 0 0px grey;
      border-radius: 3px;
    }

    &::-webkit-scrollbar-thumb {
      border-radius: 3px;
      -webkit-box-shadow: inset 0 0 6px grey;
      background-color: #fcfcfc;
    }
  }
`
const RowWrapper = styled.div`
  display: flex;
  flex-direction: row;
  padding: 5px 0;
  & button {
    margin-right: 5px;
  }
`

const StepsContent = styled.div`
  min-height: 200px;
  margin-top: 16px;
  padding: 20px 0;
  name-align: center;
  background-color: #fafafa;
  border: 1px dashed #e9e9e9;
  border-radius: 2px;
`
const StepsAction = styled.div`
  margin-top: 24px;
  display: flex;
  justify-content: flex-end;
`
const InputButtonGroupWrap = styled.div`
  margin: 0 auto;
  width: ${props => (props.width ? props.width : "100%")};
  display: flex;
  align-items: center;
  justify-content: ${props => (props.align ? props.align : "center")};
  flex-flow: row wrap !important;
  margin-top: 1rem;

  &:first-child {
    margin-top: 3rem !important;
  }
`

const FilterButtonGroup = styled.div`
  display: flex;
  flex-flow: row wrap;
  margin-bottom: ${props => (props.mb ? props.mb : "1rem")};
  margin-top: ${props => (props.mt ? props.mt : "0")};
  width: ${props => (props.width ? props.width : "100%")};
  @media (max-width: 992px) {
    min-height: 72px;
    align-content: space-between;
  }
`

const ButtonGroupWrap = styled(ContainerNavigation)`
  border: 0 !important;
  padding-left: 0 !important;
  padding-right: 0 !important;
`

const WhilteCardBox = styled(Card)`
  min-width: ${props => (props.width ? props.width : "100%")};
  padding: 1rem 0;
  border: ${props => (props.border ? "0" : "1px solid #e8e8e8")};
  background: ${props => (props.background ? props.background : "fff")};
  & .ant-card-body {
    padding-top: ${props => (props.pt ? props.pt : "0")} !important;
  }
`

const RowWrap = styled(Row)`
  padding: 15px 0;
`

const ColWrap = styled(Col)`
  text-align: ${props => (props.align ? props.align : "left")};
  padding-top: ${props => (props.align == "right" ? "8px" : "0px")};
  text-align: right;
  @media (max-width: 992px) {
    text-align: left;
  }
`

const ContainerNavigationWrap = styled(ContainerNavigation)`
  border-bottom: 0;
  padding: 0;
`

const { Step } = Steps

const CompaignView = forwardRef((props, ref) => {
  const [viewName, setView] = useState(
    (props?.leadData || []).length > 0 ? "wizardView" : ""
  )
  const [campaign, setCampaignDetails] = useState({})
  const [selectedLeads, setLeads] = useState(props?.leadData || null)
  const [campaignBy, setCampaignBy] = useState(
    (props?.leadData || []).length > 0 ? "LEAD" : ""
  )
  const [modal, setUploadModal] = useState(false)
  const [leadFileId, setUploadFile] = useState(false)

  const { data: sourcesData } = useQuery(GET_LEAD_SOURCES)

  const { data: resp } = useQuery(GET_LEAD_STATUS_TYPES)
  const leadStatusList = (resp?.leadStatusTypes || []).map(e => ({
    name: e?.type + " / " + e?.status.replace(/_/g, " "),
    id: e?.id,
  }))

  useImperativeHandle(ref, () => ({
    setBack() {
      handleClick()
    },
  }))

  const handleClick = () => {
    setLeads(null)
    setCampaignDetails({})
    setView("")
  }
  const handleCreadCampaignClick = payload => {
    setCampaignBy("LEAD")
    setLeads(payload)
    setView("wizardView")
  }

  const handleCampaignSourceClick = () => {
    setCampaignBy("SOURCE")
    setView("wizardView")
    setLeads(null)
  }

  const handleStatusClick = () => {
    setCampaignBy("STATUS")
    setView("wizardView")
    setLeads(null)
  }

  const handleWizardBack = () => {
    setCampaignDetails({})
    setLeads(null)
    setView("")
  }

  const handleUploadFile = () => {
    setCampaignBy("FILE")
    setUploadModal(true)
  }

  const handleCampaignDetailsView = e => {
    setCampaignDetails(e)
    setView("detailsView")
  }

  const handleCampaignDetailsBack = () => {
    setCampaignDetails({})
    setView("")
  }

  const handlePopupClose = payload => {
    setUploadModal(false)
    setUploadFile(payload.fileId || null)
    setView("")
  }

  const renderView = view => {
    switch (view) {
      case "leadView":
        return (
          <CustomerList
            showTitleRow={false}
            showCampaign={true}
            onBackClick={handleClick}
            onCreadCampaignClick={handleCreadCampaignClick}
          />
        )
      case "wizardView":
        return (
          <CampaignWizard
            campaignBy={campaignBy}
            onBackClick={handleWizardBack}
            campaignLeads={selectedLeads}
            leadFileId={leadFileId}
            sources={sourcesData?.leadSources || []}
            leadStatusList={leadStatusList}
          />
        )
      case "detailsView":
        return (
          <CampaignDetails
            campaignDetails={campaign}
            onBackClick={handleCampaignDetailsBack}
          />
        )
      default:
        return (
          <Container auto>
            <ContainerNavigation>
              <div>
                <Title>Campaigns</Title>
              </div>
              <div></div>
            </ContainerNavigation>
            <CampaignLayout
              onSelectLeadClick={() => setView("leadView")}
              onSetCampaignDetailsView={e => handleCampaignDetailsView(e)}
              onCampaignBySource={handleCampaignSourceClick}
              onCamapignByUpload={handleUploadFile}
              onCamapignByStatus={handleStatusClick}
              sources={sourcesData?.leadSources || []}
              statusData={leadStatusList}
            />
          </Container>
        )
    }
  }
  return (
    <>
      {renderView(viewName)}
      {modal && (
        <CsvImport
          isVisible={modal}
          setIsVisible={payload => handlePopupClose(payload)}
        />
      )}
    </>
  )
})
export default CompaignView

const CampaignLayout = ({
  onSelectLeadClick,
  onCampaignBySource,
  onCamapignByUpload,
  onCamapignByStatus,
  onSetCampaignDetailsView,
  sources = [],
  statusData = [],
}) => {
  const { user } = useContext(UserContext)

  const [variables, setVariables] = useState({
    page: 1,
    pageSize: 25,
    status: "Active",
  })
  const [openClonePopup, setClonePopup] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState(false)
  const [updateCampaign] = useMutation(UPDATE_CAMPAIGN)
  const [deleteCampaign] = useMutation(DELETE_CAMPAIGN)
  const [cloneCamapaign] = useMutation(CLONE_CAMPAIGN)
  const [activeTab, setActiveTab] = useState("Active")
  const { data: resp, refetch: refetchCampaigns, loading } = useQuery(
    GET_CAMPAIGN_PAGINATED_LIST,
    {
      fetchPolicy: "network-only",
      variables: {
        ...variables,
        companyId: user?.company?.id || 0,
      },
    }
  )
  const campaigns = resp?.getCampaigns?.data

  const handleActiveToggle = (checked, e, item) => {
    if (e) {
      updateCampaign({
        variables: {
          id: parseInt(item.id),
          userId: user?.id || 0,
          name: item.name,
          textMessage: item.textMessage,
          method: "Text",
          activeInd: checked ? "Active" : "Inactive",
        },
      }).then(() => {
        refetchCampaigns()
        message.success(
          `Campaign successfully ${checked ? "activated" : "inactivated"}`
        )
      })
    }
  }

  const handleTitleClick = item => {
    onSetCampaignDetailsView(item)
  }

  const handleDeleteClick = item => {
    showConfirmationModal(MODAL_TITLE, MODAL_CONTENT, () =>
      deleteCampaign({ variables: { id: item.id } }).then(resp => {
        if (resp?.data?.deleteCampaign?.ok) {
          refetchCampaigns()
          message.success(`Campaign successfully created`)
        } else {
          message.success(`This Campaign couldn't deleted, as it is progress`)
        }
      })
    )
  }

  const handleCloneClick = e => {
    setClonePopup(true)
    setSelectedCampaign(e)
  }

  const handleCloneSave = payload => {
    setClonePopup(false)
    cloneCamapaign({
      variables: {
        campaignId: parseInt(selectedCampaign?.id || 0),
        userId: user?.id || 0,
        name: payload.name,
      },
    }).then(() => {
      refetchCampaigns()
      message.success(`Campaign successfully created`)
    })
  }

  return (
    <Content>
      <ContentBodyWrapper>
        <ContainerBody>
          <Row gutter={[4, 24]}>
            <Col>
              Create a text campaign by selecting existing leads or by uploading
              a csv file with the lead information
            </Col>
          </Row>
          <Row gutter={[4, 24]}>
            <Col sm={12} md={6} lg={6} xl={4} style={{ textAlign: "left" }}>
              <ButtonWrap type={"primary"} onClick={onSelectLeadClick}>
                Select Leads
              </ButtonWrap>
            </Col>
            <Col sm={12} md={6} lg={6} xl={4} style={{ textAlign: "left" }}>
              <ButtonWrap type={"primary"} onClick={onCampaignBySource}>
                Campaign By Source
              </ButtonWrap>
            </Col>
            <Col sm={12} md={6} lg={6} xl={4} style={{ textAlign: "left" }}>
              <ButtonWrap type={"primary"} onClick={onCamapignByUpload}>
                Upload File (csv)
              </ButtonWrap>
            </Col>
            <Col sm={12} md={6} lg={6} xl={4} style={{ textAlign: "left" }}>
              <ButtonWrap type={"primary"} onClick={onCamapignByStatus}>
                Campaign By Status
              </ButtonWrap>
            </Col>
          </Row>
          <Row gutter={[4, 24]}>
            <Col>
              <Tabs
                activeTab={activeTab}
                defaultActiveKey={activeTab}
                onChange={e => {
                  setActiveTab(e)
                  const status = e == "All" ? null : e
                  setVariables({ ...variables, page: 1, status })
                }}
              >
                <TabPane
                  tab={
                    <Typography variant={"h4"} weight={"medium"} inline>
                      All Campaigns
                    </Typography>
                  }
                  key="All"
                >
                  <ListView
                    key={"all_camapign"}
                    campaigns={campaigns}
                    resp={resp}
                    variables={variables}
                    setVariables={setVariables}
                    sources={sources}
                    statusData={statusData}
                    loading={loading}
                    handleTitleClick={handleTitleClick}
                    handleDeleteClick={handleDeleteClick}
                    handleActiveToggle={handleActiveToggle}
                    handleCloneClick={handleCloneClick}
                  />
                </TabPane>
                <TabPane
                  tab={
                    <Typography variant={"h4"} weight={"medium"} inline>
                      Active Campaigns
                    </Typography>
                  }
                  key="Active"
                >
                  <ListView
                    key={"active_camapign"}
                    campaigns={campaigns}
                    resp={resp}
                    variables={variables}
                    setVariables={setVariables}
                    sources={sources}
                    statusData={statusData}
                    loading={loading}
                    handleTitleClick={handleTitleClick}
                    handleDeleteClick={handleDeleteClick}
                    handleActiveToggle={handleActiveToggle}
                    handleCloneClick={handleCloneClick}
                  />
                </TabPane>
                <TabPane
                  tab={
                    <Typography variant={"h4"} weight={"medium"} inline>
                      Previous Campaigns
                    </Typography>
                  }
                  key="Inactive"
                >
                  <ListView
                    key={"inactive_camapign"}
                    campaigns={campaigns}
                    resp={resp}
                    variables={variables}
                    setVariables={setVariables}
                    sources={sources}
                    statusData={statusData}
                    loading={loading}
                    handleTitleClick={handleTitleClick}
                    handleDeleteClick={handleDeleteClick}
                    handleActiveToggle={handleActiveToggle}
                    handleCloneClick={handleCloneClick}
                  />
                </TabPane>
              </Tabs>
            </Col>
          </Row>
        </ContainerBody>
      </ContentBodyWrapper>
      {openClonePopup && (
        <CampaignCloneModal
          visible={openClonePopup}
          setVisible={e => setClonePopup(e)}
          onSave={e => handleCloneSave(e)}
          campaign={selectedCampaign}
        />
      )}
    </Content>
  )
}

const columnCount = () => {
  return window.innerWidth > 1024
    ? 4
    : window.innerWidth <= 1024 && window.innerWidth > 980
    ? 3
    : window.innerWidth <= 980 && window.innerWidth > 480
    ? 2
    : 1
}

const ListView = ({
  key,
  campaigns,
  resp,
  variables,
  setVariables,
  loading,
  handleTitleClick,
  handleDeleteClick,
  handleActiveToggle,
  handleCloneClick,
  sources,
  statusData,
}) => {
  const todaDate = moment().utc()

  return (
    <List
      key={key}
      grid={{
        gutter: 16,
        column: columnCount(),
      }}
      dataSource={campaigns}
      loading={loading && <LoadingIcon type="loading" />}
      pagination={
        resp?.getCampaigns?.count < 5
          ? null
          : {
              defaultCurrent: variables.page,
              current: variables.page,
              defaultPageSize: variables.pageSize,
              pageSize: variables.pageSize,
              total: resp?.getCampaigns?.count || 0,
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
          <CardWrapper
            title={
              <ContainerNavigationWrap>
                <a onClick={() => handleTitleClick(item)}>{item.name}</a>
                <a
                  onClick={() => handleDeleteClick(item)}
                  disabled={
                    (item.startDate == null
                      ? todaDate
                      : moment(item.startDate).utc()) < moment().utc()
                  }
                >
                  <IconCustom type={"delete"} />
                </a>
              </ContainerNavigationWrap>
            }
            actions={[
              <Switch
                checked={item.activeInd !== "INACTIVE"}
                checkedChildren={"Active"}
                unCheckedChildren={"Inactive"}
                onChange={(checked, e) =>
                  showConfirmationModal(MODAL_TITLE, MODAL_CONTENT, () =>
                    handleActiveToggle(checked, e, item)
                  )
                }
                key={`key__${item.id}`}
              />,
              <SecondaryButton
                type="primary"
                onClick={() => handleCloneClick(item)}
                icon="copy"
                size="small"
                style={{ marginLeft: "5px" }}
                disabled={item.name == "Default"}
              >
                Clone
              </SecondaryButton>,
            ]}
          >
            <p>
              <b>Date:</b>{" "}
              {moment(item.dateCreated).format("MM/DD/YYYY hh:mm A")}
            </p>
            {!isEmpty(item?.startDate) ? (
              <>
                <p>
                  <b>Start Date:</b>{" "}
                  {item.startDate &&
                    convertUtcToLocal(item.startDate, "MM/DD/YYYY hh:mm A")}
                </p>
                <p>
                  <b>End Date:</b>{" "}
                  {item.endDate &&
                    convertUtcToLocal(item.endDate, "MM/DD/YYYY hh:mm A")}
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
              <b>Sales Person:</b> {item?.user?.fullName}
            </p>
            <p>
              <b>Leads Uncontacted:</b>{" "}
              {(resp?.getCampaigns?.leadMessageCount || []).find(
                c => c.campaignId == item.id
              )?.totalUncontacted || 0}
            </p>
            <p>
              <b>Leads Reached:</b>{" "}
              {(resp?.getCampaigns?.leadMessageCount || []).find(
                c => c.campaignId == item.id
              )?.totalDelivered || 0}
            </p>
            <p>
              <b>Leads Responded:</b>{" "}
              {(resp?.getCampaigns?.leadMessageCount || []).find(
                c => c.campaignId == item.id
              )?.totalResponded || 0}
            </p>
            <p>
              <b>Sources: </b>{" "}
              {(item?.campaignSelections || []).filter(
                el => el.type == "SOURCE"
              ).length > 0 ? (
                <SourcesTags
                  data={(item?.campaignSelections || []).filter(
                    el => el.type == "SOURCE"
                  )}
                  sources={sources}
                />
              ) : (
                <Tag key={"key_all"}>All</Tag>
              )}
            </p>
            <p>
              <b>Status: </b>{" "}
              {(item?.campaignSelections || []).filter(
                el => el.type == "STATUS"
              ).length > 0 ? (
                <StatusTags
                  data={(item?.campaignSelections || []).filter(
                    el => el.type == "STATUS"
                  )}
                  statusList={statusData}
                />
              ) : (
                <Tag key={"key_all"}>All</Tag>
              )}
            </p>
          </CardWrapper>
        </List.Item>
      )}
    />
  )
}

const SourcesTags = ({ data = [], sources = [] }) => {
  const tags = (data || []).map((el, index) => {
    let obj = (sources || []).find(e => e.id == el.value)
    if (obj) {
      return <Tag key={el.id}>{obj?.name} </Tag>
    }
  })
  return tags
}

const StatusTags = ({ data = [], statusList = [] }) => {
  const tags = (data || []).map((el, index) => {
    let obj = (statusList || []).find(e => e.id == el.value)
    if (obj) {
      return <Tag key={el.id}>{obj?.name}</Tag>
    }
  })
  return tags
}

const steps = [
  {
    title: "Campaign",
  },
  {
    title: "Scheduler",
  },
  {
    title: "Condition",
  },
]

const saveCamapignSelections = (
  campaignBy,
  campaignLeads,
  campaign,
  leadFileId,
  createCampaignSelections,
  campaignId
) => {
  let values = [{ value: 0 }]
  let secondaryValues = []
  let secondaryType = ""
  console.log(`campaign?.campaignSources`, campaign?.campaignSources)
  if (campaignBy === "LEAD") {
    values = (campaignLeads || []).map(el => ({ value: el.id }))
  } else if (campaignBy === "SOURCE") {
    values = (campaign?.campaignSources || []).map(el => ({ value: el }))
    secondaryValues = (campaign?.campaignStatus || []).map(el => ({
      value: el,
    }))
    secondaryType = "STATUS"
  } else if (campaignBy === "FILE") {
    values = [{ value: leadFileId }]
  } else if (campaignBy === "STATUS") {
    values = (campaign?.campaignStatus || []).map(el => ({ value: el }))
    secondaryValues = (campaign?.campaignSources || []).map(el => ({
      value: el,
    }))
    secondaryType = "SOURCE"
  }

  let variables = {
    campaignId: parseInt(campaignId),
    values: values,
    type: campaignBy,
  }
  if (secondaryValues.length > 0) {
    variables = { ...variables, secondaryValues, secondaryType }
  }
  console.log(`variables`, variables)
  createCampaignSelections({
    variables,
  })
}

const CampaignWizard = ({
  campaignBy,
  onBackClick,
  campaignLeads,
  leadFileId,
  sources = [],
  leadStatusList = [],
}) => {
  const { user } = useContext(UserContext)
  const [current, setCurrent] = useState(0)
  const [campaign, setCampaign] = useState({})
  const [error, setError] = useState("")
  const [openConfirmPopup, setConfirmPopup] = useState(false)

  const [createCampaign] = useMutation(CREATE_CAMPAIGN, {
    onCompleted: result => {
      if (!isUndefined(result?.createCampaign?.campaign)) {
        const selectedLeadSources = map(
          uniqBy(campaignLeads, "leadSourceOriginalId"),
          el => {
            return String(el.leadSourceOriginalId)
          }
        )
        setCampaign({
          ...campaign,
          id: result?.createCampaign?.campaign.id,
          campaignSources: campaign?.campaignSources || selectedLeadSources,
        })
        // save campaign selections
        saveCamapignSelections(
          campaignBy,
          campaignLeads,
          campaign,
          leadFileId,
          createCampaignSelections,
          result?.createCampaign?.campaign.id
        )
      }
    },
  })
  const [updateCampaign] = useMutation(UPDATE_CAMPAIGN)
  const [createCampaignSelections] = useMutation(CREATE_CAMPAIGN_SELECTIONS)
  const [createCampaignLeadSummary] = useMutation(CREATE_CAMPAIGN_LEAD_SUMMARY)

  const next = () => {
    if (isUndefined(campaign.name) || isEmpty(campaign.name)) {
      setError("Please enter campaign name to proceed")
      return
    }

    if (
      !isEmpty(String(campaign.id)) &&
      current == 1 &&
      isEmpty(campaign?.campaignSchedules || [])
    ) {
      setError(
        "Please make sure campaign have schedule and each schedule has a message template associated with it to proceed"
      )
      return
    }

    setError("")

    setCurrent(current + 1)
    if (isUndefined(campaign.id)) {
      createCampaign({
        variables: {
          companyId: parseInt(user?.company?.id || 0),
          userId: user?.id || 0,
          name: campaign.name,
          method: "Text",
          textMessage: "",
          activeInd: "Active",
          isDisabled: true,
          isPrioritize: false,
        },
      })
    } else if (!isEmpty(String(campaign.id))) {
      let startDate = campaign?.startDate || new Date()
      let endDate = null
      if (campaign?.scheduleType === "IMMEDIATE") {
        startDate = null
      } else if (campaign?.scheduleType === "DATE" && campaign?.endDate) {
        endDate = campaign?.endDate
      }

      let campaignObj = {
        id: parseInt(campaign.id),
        userId: user?.id || 0,
        name: campaign.name,
        method: "Text",
        textMessage: "",
        startDate:
          campaign?.scheduleType == "IMMEDIATE"
            ? null
            : moment(startDate)
                .utc()
                .format("YYYY-MM-DDTHH:mm:ss"),
        isDisabled: true,
        scheduleType: campaign?.scheduleType || "IMMEDIATE",
        isPrioritize: campaign?.isPrioritize || false,
      }
      if (endDate) {
        campaignObj = {
          ...campaignObj,
          endDate: moment(endDate)
            .utc()
            .format("YYYY-MM-DDTHH:mm:ss"),
        }
      }

      updateCampaign({
        variables: { ...campaignObj },
      }).then(resp => {
        //update campaign selections
        setCampaign({
          ...campaignObj,
          campaignSchedules: resp?.data?.campaign?.campaignSchedules || [],
          campaignTemplates: resp?.data?.campaignTemplates || [],
          campaignSources: campaign.campaignSources || [],
        })

        if (
          (campaignBy === "SOURCE" || campaignBy === "STATUS") &&
          current === 0
        ) {
          saveCamapignSelections(
            campaignBy,
            campaignLeads,
            campaign,
            leadFileId,
            createCampaignSelections,
            campaign?.id
          )
        }
      })
    }
  }

  const prev = () => {
    setCurrent(current - 1)
  }

  const confirmSaveCampaign = payload => {
    setError("")
    let campaignObj = {
      ...campaign,
      acceptTerms: true,
      isDisabled: false,
      startDate:
        !isUndefined(campaign.startDate) && campaign.startDate != null
          ? moment(campaign.startDate)
              .utc()
              .format("YYYY-MM-DDTHH:mm:ss")
          : null,
      isPrioritize: payload.prioritize,
      method: "Text",
      activeInd: "Active",
      textMessage: "",
      endDate:
        !isUndefined(campaign.endDate) && campaign.endDate != null
          ? moment(campaign.endDate)
              .utc()
              .format("YYYY-MM-DDTHH:mm:ss")
          : null,
    }
    updateCampaign({
      variables: { ...campaignObj },
    }).then(resp => {
      createCampaignLeadSummary({
        variables: { campaignId: campaign?.id },
      })
      message.success(`Campaign successfully created`)
    })
    onBackClick()
  }

  const onCompleted = () => {
    if (isUndefined(campaign?.acceptTerms) || !campaign?.acceptTerms) {
      setError("Please accept terms and conditions")
    } else {
      setConfirmPopup(true)
    }
  }

  const handleConfirmation = payload => {
    setConfirmPopup(false)
    confirmSaveCampaign(payload)
  }

  return (
    <Container auto>
      <ContainerNavigation>
        <div>
          <Title>Create Campaign</Title>
        </div>
        <div>{error && <Alert message={error} type={"error"} />}</div>
        <div>
          <Button type={"default"} onClick={onBackClick}>
            Back
          </Button>
        </div>
      </ContainerNavigation>
      <ContentBodyWrapper>
        <ContainerBody>
          <Steps current={current}>
            {steps.map(item => (
              <Step key={item.title} title={item.title} />
            ))}
          </Steps>
          <StepsContent>
            <StepContentComponent
              current={current}
              campaignBy={campaignBy}
              campaign={campaign}
              onSetCampaignInfo={setCampaign}
              sources={sources}
              leadStatusList={leadStatusList}
            />
          </StepsContent>
          <StepsAction>
            {current > 0 && (
              <Button style={{ margin: "0 8px" }} onClick={() => prev()}>
                Previous
              </Button>
            )}
            {current < steps.length - 1 && (
              <Button type="primary" onClick={() => next()}>
                Next
              </Button>
            )}
            {current === steps.length - 1 && (
              <Button type="primary" onClick={() => onCompleted()}>
                Complete
              </Button>
            )}
          </StepsAction>
        </ContainerBody>
      </ContentBodyWrapper>
      {openConfirmPopup && (
        <CampaignConfirmModal
          visible={openConfirmPopup}
          setPopupVisible={setConfirmPopup}
          onConfirm={handleConfirmation}
          campaign={campaign}
          campaignBy={campaignBy}
          sources={sources}
          statusData={leadStatusList}
        />
      )}
    </Container>
  )
}

const StepContentComponent = ({
  current,
  campaignBy,
  campaign,
  onSetCampaignInfo,
  sources = [],
  leadStatusList = [],
}) => {
  switch (current) {
    case 0:
      return (
        <CampaignStart
          campaignBy={campaignBy}
          campaign={campaign}
          onSetCampign={onSetCampaignInfo}
          sourceData={sources}
          leadStatusList={leadStatusList}
        />
      )
    case 1:
      return (
        <CampaignSchedule
          campaignBy={campaignBy}
          campaign={campaign}
          onSetCampign={onSetCampaignInfo}
        />
      )
    case 2:
      return (
        <CampaignCondition
          campaignBy={campaignBy}
          campaign={campaign}
          onSetCampign={onSetCampaignInfo}
        />
      )
    default:
      return null
  }
}

const CampaignStart = ({
  campaignBy,
  onSetCampign,
  campaign,
  sourceData,
  leadStatusList = [],
}) => {
  const [campignName, setCampaignName] = useState(campaign?.name || "")
  const [selectedSource, setCampaignSource] = useState(
    campaign?.campaignSources || []
  )
  const [selectedStatus, setCampaignStatus] = useState([])

  return (
    <>
      <Typography variant={"h4"} style={{ textAlign: "center" }}>
        Setup Your Campaign
      </Typography>

      <InputButtonGroupWrap>
        <WhilteCardBox width={"80%"}>
          <RowWrap>
            <ColWrap xs={24} sm={24} md={24} xl={8} lg={8}>
              <label style={{ paddingRight: "5px" }}>Name of Campaign: </label>
            </ColWrap>
            <ColWrap xs={24} sm={24} md={24} xl={16} lg={16}>
              <Input
                value={campignName || ""}
                onChange={e => {
                  setCampaignName(e.target.value)
                  onSetCampign({
                    ...campaign,
                    name: e.target.value,
                  })
                }}
                name={"campignName"}
                style={{ width: "80%" }}
                size={"large"}
              />
            </ColWrap>
          </RowWrap>
          {campaignBy === "SOURCE" && (
            <>
              <RowWrap>
                <ColWrap xs={24} sm={24} md={24} xl={8} lg={8} align={"right"}>
                  <label style={{ paddingRight: "5px" }}>Select Source: </label>
                </ColWrap>
                <ColWrap xs={24} sm={24} md={24} xl={16} lg={16} align={"left"}>
                  <SelectSchedule
                    mode={"multiple"}
                    value={selectedSource}
                    placeholder={"Select Sources"}
                    showAll={false}
                    onChange={e => {
                      setCampaignSource(e)
                      onSetCampign({
                        ...campaign,
                        campaignSources: e,
                      })
                    }}
                    data={sourceData}
                    width={"80%"}
                    size={"large"}
                  />
                </ColWrap>
              </RowWrap>
              <RowWrap>
                <ColWrap xs={24} sm={24} md={24} xl={8} lg={8} align={"right"}>
                  <label style={{ paddingRight: "5px" }}>Select Status: </label>
                </ColWrap>
                <ColWrap xs={24} sm={24} md={24} xl={16} lg={16} align={"left"}>
                  <SelectSchedule
                    mode={"multiple"}
                    value={selectedStatus}
                    placeholder={"Select Status"}
                    showAll={false}
                    onChange={e => {
                      setCampaignStatus(e)
                      onSetCampign({
                        ...campaign,
                        campaignStatus: e,
                      })
                    }}
                    data={leadStatusList || []}
                    width={"80%"}
                    size={"large"}
                  />
                </ColWrap>
              </RowWrap>
            </>
          )}
          {campaignBy === "STATUS" && (
            <>
              <RowWrap>
                <ColWrap xs={24} sm={24} md={24} xl={8} lg={8} align={"right"}>
                  <label style={{ paddingRight: "5px" }}>Select Status: </label>
                </ColWrap>
                <ColWrap xs={24} sm={24} md={24} xl={16} lg={16} align={"left"}>
                  <SelectSchedule
                    mode={"multiple"}
                    value={selectedStatus}
                    placeholder={"Select Status"}
                    showAll={false}
                    onChange={e => {
                      setCampaignStatus(e)
                      onSetCampign({
                        ...campaign,
                        campaignStatus: e,
                      })
                    }}
                    data={leadStatusList || []}
                    width={"80%"}
                    size={"large"}
                  />
                </ColWrap>
              </RowWrap>
              <RowWrap>
                <ColWrap xs={24} sm={24} md={24} xl={8} lg={8} align={"right"}>
                  <label style={{ paddingRight: "5px" }}>Select Source: </label>
                </ColWrap>
                <ColWrap xs={24} sm={24} md={24} xl={16} lg={16} align={"left"}>
                  <SelectSchedule
                    mode={"multiple"}
                    value={selectedSource}
                    placeholder={"Select Sources"}
                    showAll={false}
                    onChange={e => {
                      setCampaignSource(e)
                      onSetCampign({
                        ...campaign,
                        campaignSources: e,
                      })
                    }}
                    data={sourceData}
                    width={"80%"}
                    size={"large"}
                  />
                </ColWrap>
              </RowWrap>
            </>
          )}
        </WhilteCardBox>
      </InputButtonGroupWrap>
    </>
  )
}

const CampaignSchedule = ({ onSetCampign, campaign, campaignBy }) => {
  return (
    <>
      <Typography variant={"h4"} style={{ textAlign: "center" }}>
        Scheduler
      </Typography>
      <InputButtonGroupWrap width={"95%"} align="flex-start">
        <WhilteCardBox background={"#fafafa"} border={"0"} pt={"2rem"}>
          <ScheduleView
            currentCampaign={campaign}
            fromCampagin={true}
            setCurrentCampaign={payload => {
              onSetCampign({
                ...campaign,
                startDate: payload?.startDate || null,
                endDate: payload?.endDate || null,
                scheduleType: payload?.scheduleType || "IMMEDIATE",
                campaignSchedules: payload.campaignSchedules || [],
                campaignTemplates: payload.campaignTemplates || [],
              })
            }}
            campaignBy={campaignBy}
          />
        </WhilteCardBox>
      </InputButtonGroupWrap>
    </>
  )
}

const CampaignCondition = ({ onSetCampign, campaign }) => {
  const onChange = e => {
    onSetCampign({
      ...campaign,
      acceptTerms: e.target.checked,
      acceptTermsDate: moment()
        .utc()
        .format("YYYY-MM-DDTHH:mm:ss"),
    })
  }
  return (
    <>
      <Typography variant={"h4"} style={{ textAlign: "center" }}>
        Terms and Conditions
      </Typography>
      <InputButtonGroupWrap width={window.innerWidth > 1024 ? "65%" : "90%"}>
        <WhilteCardBox pt={"2rem"}>
          <Checkbox onChange={onChange}>
            <Typography variant={"small"} weight={"medium"} inline>
              I accept that the client list I will be broadcasting to has given
              me authority to reach to them through SMS for any promotional
              related communications.
            </Typography>
          </Checkbox>
        </WhilteCardBox>
      </InputButtonGroupWrap>
    </>
  )
}
const CampaignCloneModal = ({ visible, setVisible, onSave, campaign }) => {
  const [name, setName] = useState(campaign?.name)
  const [error, setError] = useState("")

  return (
    <Modal
      width={450}
      title={"Clone Campaign"}
      visible={visible}
      closable={false}
      footer={null}
    >
      <lable>Camapign Name</lable>
      <Input
        value={name}
        onChange={e => setName(e.target.value)}
        name={"name"}
      />
      <br />
      <br />
      {error && <Alert message={error} type={"error"} />}
      <br />
      <br />
      <ContainerNavigation>
        <div>
          <Button
            key="Cancel"
            onClick={() => {
              setName("")
              setVisible(false)
            }}
          >
            Cancel
          </Button>
        </div>
        <Button
          key="save"
          type={"primary"}
          onClick={() => {
            onSave({ ...campaign, name: name })
            setVisible(false)
          }}
        >
          Save
        </Button>
      </ContainerNavigation>
    </Modal>
  )
}

const CampaignConfirmModal = ({
  visible,
  setPopupVisible,
  onConfirm,
  campaign,
  campaignBy,
  sources = [],
  statusData = [],
}) => {
  const [prioritize, setPrioritize] = useState(campaign?.isPrioritize || false)
  const { data } = useQuery(GET_LEADS_COUNT_BY_CAMPAIGN, {
    fetchPolicy: "network-only",
    variables: {
      source: [],
      sourceOriginal: [],
      combinedSource: [],
      search: "",
      voi: [],
      campaignId: parseInt(campaign?.id || 0),
      leadStatusTypes: [],
    },
  })

  const { data: campaignDetails } = useQuery(GET_CAMPAIGN_DETAILS, {
    variables: {
      id: parseInt(campaign?.id || 0),
    },
  })

  const onEngrollChange = e => {
    if (e) {
      setPrioritize(e.target.checked)
    }
  }
  console.log(`campaignDetails?.campaign?.campaignSelections`, campaignDetails)
  const campaignSources = (
    campaignDetails?.campaign?.campaignSelections || []
  ).filter(el => el.type == "SOURCE")
  const campaignStatus = (
    campaignDetails?.campaign?.campaignSelections || []
  ).filter(el => el.type == "STATUS")
  console.log(
    `campaignStatus, campaignSources`,
    campaignStatus,
    campaignSources
  )
  return (
    <Modal
      width={450}
      title={
        <Typography variant={"small"} weight={"medium"}>
          {"Do you want to continue to create campaign?"}
        </Typography>
      }
      visible={visible}
      closable={false}
      footer={null}
      destroyOnClose={true}
    >
      <div>
        <p>
          <Typography variant={"small"} weight={"bold"}>
            When you clicked the Confirm button, system will send message to all
            leads in this campaign.
          </Typography>
        </p>
        <InternalDivider />
        {campaign.startDate ? (
          <>
            <p>
              <Typography variant={"small"} weight={"bold"} inline>
                Start Date:{" "}
              </Typography>
              {campaign.startDate &&
                moment(campaign.startDate).format("MM/DD/YYYY hh:mm A")}
            </p>
            <p>
              <Typography variant={"small"} weight={"bold"} inline>
                End Date:{" "}
              </Typography>
              {campaign.endDate &&
                moment(campaign.endDate).format("MM/DD/YYYY hh:mm A")}
            </p>
          </>
        ) : (
          <>
            <Typography variant={"small"} weight={"medium"} inline>
              The campaign will be start immediately after completed the setup.
            </Typography>
          </>
        )}
        <p style={{ marginTop: 10 }}>
          <Typography variant={"small"} weight={"bold"} inline>
            Sources:{" "}
          </Typography>
          {campaignSources.length > 0 ? (
            <SourcesTags data={campaignSources} sources={sources} />
          ) : (
            <Tag key={"key_all"}>All</Tag>
          )}
        </p>
        <p style={{ marginTop: 10 }}>
          <Typography variant={"small"} weight={"bold"} inline>
            Status:{" "}
          </Typography>
          {campaignStatus.length > 0 ? (
            <StatusTags data={campaignStatus} statusList={statusData} />
          ) : (
            <Tag key={"key_all"}>All</Tag>
          )}
        </p>
        <p>
          <Typography variant={"small"} weight={"bold"} inline>
            Total Leads Affected:{" "}
          </Typography>
          {data?.getLeads?.count || 0}
        </p>
      </div>
      <InternalDivider />
      <Alert
        message="Warning: "
        description="One or more leads in this campaign is also targeted by another active campaign. Sending too many messages to the leads may result in a higher chance of disengagement. To turn off messages from other campaigns to such leads while this campaign is in effect, select the following option"
        type="warning"
      />
      <br />
      <Checkbox onChange={onEngrollChange} checked={prioritize}>
        <Typography variant={"small"} inline>
          Prioritize messages from this campaign for leads that are enrolled in
          multiple active campaigns.
        </Typography>
      </Checkbox>

      <InternalDivider />
      <ContainerNavigation>
        <div>
          <Button
            key="Cancel"
            onClick={() => {
              setPopupVisible(false)
            }}
          >
            Cancel
          </Button>
        </div>
        <Button
          key="save"
          type={"primary"}
          onClick={() => {
            onConfirm({ prioritize })
          }}
        >
          Confirm
        </Button>
      </ContainerNavigation>
    </Modal>
  )
}
