import React, { Fragment, useState, useRef, useContext, useEffect } from "react"
import { useQuery, useLazyQuery, useMutation } from "@apollo/react-hooks"

import {
  GET_MESSAGES,
  GET_PAGINATED_LEADS,
  GET_LEAD_SOURCES,
  GET_LEAD_COUNT_BY_STATUS,
  GET_ALL_USERS,
} from "../../graphql/query"
import {
  CREATE_MESSAGE,
  CREATE_MESSAGE_LOG,
  UPDATE_LEAD_CONSENT,
  UPDATE_LEAD_CONVERSATION_STATUS,
  UPDATE_LEAD_EMAIL,
  UPDATE_LEAD_PHONE,
  CREATE_LEAD_EMAIL,
  CREATE_LEAD_PHONE,
  UPDATE_LEAD,
} from "../../graphql/mutation"
import { TabContext } from "../../library/tabs"
import { UserContext } from "../../amplify/authenticator-provider"
import {
  ButtonCustom,
  SVGIcon,
  ContainerNavigation,
  TooltipButton,
  SecondaryButton,
  InputButtonGroup,
  IconCustom,
  FilterButtonGroup,
} from "../../library/basicComponents"

import {
  Input,
  Button,
  Icon,
  List,
  Spin,
  Tooltip,
  Row,
  Col,
  Badge,
  Alert,
  Collapse,
  Progress,
  Tag,
  message,
  Switch,
  Avatar,
  Drawer,
} from "antd"
import { formatPhoneNumber } from "react-phone-number-input"
import { parseTimestamp, convertUtcToLocal } from "../../library/utils"
import moment from "moment"
import NoteIcon from "../../../static/icons/AddNoteIcon.svg"
import ChatIcon2 from "../../../static/icons/ChatIcon2.svg"
import HandshakeIcon from "../../../static/icons/HandshakeIcon.svg"
import CloseIcon from "../../../static/icons/CloseIcon.svg"
import RemoveIcon from "../../../static/icons/RemoveIcon.svg"
import AirplaneIconWhite from "../../../static/icons/AirplaneIconWhite.svg"
import PushToCrmModal from "./PushToCrmModal"
import Typography from "../../library/typography"
import AppointmentModal from "./appointmentModal"
import AppointmentList from "./appointmentList"
import LeadEditModal from "../life-events/customerList/leadEditModal"
import { Spacer, parseLocation } from "../../library/utils"
import CampaignListView from "./campaignListView"

import {
  ContainerCustom,
  ContentCustom,
  ContentSidebarCustom,
  Conversations,
  ContentBodyConversations,
  SelectedDealCntr,
  DealInfoSideBar,
  InternalDivider,
  OptionContainer,
  OptionGroup,
  OptionGroupInfo,
  MessagesContainer,
  MessageBoxInfo,
  DealsContainer,
  SidebarArrow,
  DealContainer,
  DealDataContainer,
  DealData,
  DealInfoText,
  DealInfo,
  Author2,
  FiltersContainer,
  DrawerFooter,
} from "../../library/activityComponents"
import styled from "styled-components"
import { countByStatus } from "../analytics/lambdas"
import AddPhoneModal from "./AddPhoneModal"
import isEmpty from "lodash/isEmpty"
import isUndefined from "lodash/isUndefined"
import TemplateDrawer from "./templateDrawer"
import EditableTextBox from "../../library/editableTextbox"
import EditablePhoneInput from "../../library/editablePhoneInput"

const CustomCalendar = styled.div`
  width: 55px;
  height: 55px;
  position: relative;
  background-color: #d4d4d4;
  border-radius: 12px;
  color: #6a6a6a;
  /* font-weight: 700; */
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: auto;
  margin-top: 10px;
`
const CalMonth = styled.div`
  position: absolute;
  width: 100%;
  bottom: 0;
  text-align: center;
  background-color: #007dae;
  height: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  line-height: 15px;
  border-radius: 0 0 12px 12px;
  color: #fff;
  font-size: 13px;
`
const CalDate = styled.div`
  position: relative;
  bottom: 5px;
  span {
    font-size: 18px;
    font-weight: 700;
  }
`

const VehicleDiv = styled.div`
  text-align: left;
`
const IconMobile = styled(Icon)`
  font-size: 24px;
  margin: 0 5px;
`

const DrawerWrap = styled(Drawer)`
  @media only screen and (max-width: 1024px) {
    .ant-drawer-body {
      overflow-y: hidden;
      padding: 0;
    }
  }
`

const ResponsiveNavigation = styled(ContainerNavigation)`
  display: none;
  border-bottom: 2px solid #e8e8e8 !important;
  box-sizing: border-box !important;
  background-color: #fff;
  padding-bottom: 0.1rem !important;
  @media only screen and (max-width: 1024px) {
    display: flex;
  }
`

const InputButtonGroupWrapper = styled(InputButtonGroup)`
  width: 100%;
  margin-bottom: 6px;
  align-items: flex-start;
  b {
    margin-right: 10px;
  }
`
const FiltersContainerWrapper = styled(FiltersContainer)`
  webkit-flex: none;
  flex: none;
`
const TypographyWrap = styled(Typography)`
  padding: 8px 0;
`
const BadgeWrap = styled(Badge)`
  margin: 0 10px;
  .ant-badge-status-dot {
    width: 8px;
    height: 8px;
  }
`
const DealInfoSideBarWrap = styled(DealInfoSideBar)`
  padding-left: 0;
  padding-top: 0;
  & .ant-collapse-content-box {
    background: #fff;
  }
  & .ant-switch-disabled {
    background: red;
  }
  & .ant-switch-disabled {
    background: red;
  }
  & .ant-progress-inner {
    width: 110px !important;
    height: 110px !important;
    cursor: pointer;
  }
  .ant-collapse-content > .ant-collapse-content-box {
    padding: 10px;
  }
  @media only screen and (max-width: 1750px) {
    .ant-collapse-content > .ant-collapse-content-box {
      padding: 0;
    }
  }
  @media only screen and (max-width: 1024px) {
    /*display: none;*/
    min-width: 100%;
    max-width: 100% important;
    height: 240vh;
  }
  @media only screen and (max-width: 998px) {
    min-width: 100%;
    max-width: 100% important;
    height: 200vh;
  }

  .ant-progress-circle .ant-progress-text {
    width: 75%;
    word-break: break-word;
  }
`
const InternalDividerWrap = styled(InternalDivider)`
  height: 1px;
`

const MessageBoxWrap = styled.div`
  display: flex;
  justify-content: flex-end;
`
const AppointmentBox = styled.div`
  text-align: center;
  margin: 2rem auto;
  width: 45%;
  & .ant-alert-info {
    border: 0;
  }
  & .ant-alert-message {
    color: #999;
    font-size: 12px;
  }
  & .anticon-calendar {
    font-size: 20px;
    color: #007dae;
  }
`
const AppointmentBoxInfoSent = styled(MessageBoxInfo)`
  text-align: center;
  margin-top: 2px;
`

const MessageSentBox = styled.div`
  max-width: 65%;
`
const MessageRespBoxWrap = styled.div`
  display: flex;
  justify-content: flex-start;
`

const MessageRespBox = styled.div`
  max-width: 65%;
`
const MessageRespRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  background: #8e0b61;
  color: #ffffff;
  border-radius: 15px 15px 15px 0px;
  padding: 1em;
  margin: 16px 4px 4px 4px;
  position: relative;
`

const MessageBoxInfoResp = styled(MessageBoxInfo)`
  text-align: left;
  margin-left: 4px;
`

const MessageBoxInfoSent = styled(MessageBoxInfo)`
  text-align: right;
  margin-right: 4px;
`
const DealDataWrap = styled(DealData)`
  margin: 7px 0;
`
const MessageSentRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  background: #007dae;

  color: #ffffff;
  border-radius: 15px 15px 0px 15px;
  padding: 1em;
  margin: 16px 4px 4px 4px;
  position: relative;
  word-break: break-word;
`

const ContentBodyConversationsWrap = styled(ContentBodyConversations)`
  height: ${props => (props.height ? props.height : "64vh")};
  border-left: 0;
  border-right: 0;
`

const ConversationsWrap = styled(Conversations)`
  /*height: 100%;*/
  scrollbar-width: thin !important;
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
`

const InputContainer = styled.div`
  background: rgb(245, 245, 245);
  padding: 20px 20px;
  border-radius: 10px;
  width: 100%;
  position: relative;
`

const InputTextWrap = styled.input`
  background: rgb(245, 245, 245) !important;
  border: none !important;
  color: #000000;
  width: 100%;
  &:hover {
    outline: none !important;
    border: none !important;
  }
  &:focus {
    outline: none !important;
    border: none !important;
    border-right-width: 0 !important;
    background: rgb(245, 245, 245) !important;
  }
  &:selected {
    background: rgb(245, 245, 245) !important;
  }
`

const ListItemWrap = styled(List.Item)`
  padding: 1rem;
  padding-left: 0.5rem;
  border-left-style: solid;
  border-left-color: ${props =>
    props.stripcolor ? props.stripcolor : "#007dae"};
  border-left-width: 0.5rem;
  margin-bottom: 0.2rem;
  cursor: pointer;
`
const SourceIcon = styled.img`
  width: ${props => (props.width ? props.width : "18px")};
  height: 18px;
  border-radius: 50%;
  vertical-align: middle;
  margin: 0 4px 0 0;
  @media (max-width: 968px) {
    float: left;
    margin: -2px 4px 0 0;
  }
`
const CountSpan = styled.p`
  margin-bottom: 0 !important;
`
const colorCode = {
  RESPONDED: "#8E0B61",
  WAITING_FOR_REPLY: "#007dae",
  UNCONTACTED: "#ff4500",
}

const OptionRow = styled.div`
  width: 100%;
  display: flex;
  flex-direction: row-reverse;
  /*padding-right: 85px;*/
`

const DealInfoTextName = styled(DealInfoText)`
  /*width: 260px;*/
  line-height: 36px;
`
const AvtarWrap = styled(Avatar)`
  height: ${props => (props.height ? props.height : "60px")};
  width: ${props => (props.width ? props.width : "60px")};
  padding-top: 0.3rem;
  background-image: url("/images/sources/calendar.png");
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center;
  background-color: transparent;
  color: #4d4c4c;
  line-height: 12px;
  .ant-avatar-string {
    top: 50%;
    span {
      font-weight: 600;
    }
  }
  & p {
    margin-bottom: 0;
    margin-block-start: 0;
    margin-block-end: 0;
    line-height: 14px;
  }
`

const DealStatusIcon = ({ status, msg }) => {
  switch (status) {
    case "ACTIVE":
      return (
        <>
          <Tooltip placement="topLeft" title={msg}>
            <SVGIcon
              style={{ fontSize: "14px", marginRight: "4px" }}
              component={ChatIcon2}
              alt={"Active"}
            />
            <Tag color="#2db7f5">Active</Tag>
          </Tooltip>
        </>
      )
    case "SOLD":
      return (
        <>
          <Tooltip placement="topLeft" title={msg}>
            <SVGIcon
              style={{ fontSize: "16px", marginRight: "4px" }}
              component={HandshakeIcon}
              alt={"Lead Sold"}
            />
            <Tag color="#87d068">Lead Sold</Tag>
          </Tooltip>
        </>
      )
    case "ARCHIVED":
      return (
        <>
          <Tooltip placement="topLeft" title={msg}>
            <SVGIcon
              style={{ fontSize: "14px", marginRight: "4px" }}
              component={RemoveIcon}
              alt={"Archived"}
            />
            Archived
          </Tooltip>
        </>
      )
    case "LOST":
      return (
        <>
          <Tooltip placement="topLeft" title={msg}>
            <SVGIcon
              style={{ fontSize: "14px", marginRight: "4px" }}
              component={CloseIcon}
              alt={"Lead lost"}
            />
            <Tag color="#cd201f">Lead Lost</Tag>
          </Tooltip>
        </>
      )
    default:
      return status
  }
}

const renderLead = (item, sourcesData) => {
  let vehicle = ""
  if ((item?.vehicleOfInterest || []).length > 0) {
    if (item?.vehicleOfInterest[0]?.make) {
      vehicle = vehicle + item?.vehicleOfInterest[0]?.make
    }
    if (item?.vehicleOfInterest[0]?.model) {
      vehicle = vehicle + " " + item?.vehicleOfInterest[0]?.model
    }
    if (item?.vehicleOfInterest[0]?.year) {
      vehicle = vehicle + " " + item?.vehicleOfInterest[0]?.year
    }
    vehicle = vehicle == "" ? "N/A" : vehicle
  } else {
    vehicle = "No Vehicles"
  }

  let leadDate = item?.leadCreatedDate
    ? parseTimestamp(moment.utc(item?.leadCreatedDate).local())
    : parseTimestamp(new Date())
  if (item?.messages && item?.messages[0] != null) {
    leadDate = item.messages[0].dateReceived
      ? parseTimestamp(moment.utc(item.messages[0].dateReceived).local())
      : parseTimestamp(moment.utc(item.messages[0].dateSent).local())
  }

  const leadSource = (sourcesData?.leadSources || []).find(
    el => el.id == (item?.leadSourceOriginalId || 0)
  )
  const fullName = item?.fullName || ""
  return (
    <DealContainer>
      <DealDataContainer>
        <DealDataWrap>
          <DealInfo flex={1} align={"initial"}>
            <DealInfoTextName align={"left"} fontSize={16}>
              {fullName.length < 50
                ? fullName
                : fullName.substring(0, 50) + "..."}
            </DealInfoTextName>
            <DealInfoText fontSize={14} color={"#333"}>
              {
                <SourceIcon
                  width={
                    leadSource && leadSource?.name.toLowerCase() == "cars.com"
                      ? "38px"
                      : "18px"
                  }
                  src={`/images/sources/${(leadSource?.name || "marketplace")
                    .toLowerCase()
                    .replace(".", "-")}.png`}
                  onError={e => {
                    e.target.src = "/images/sources/forum.png"
                  }}
                />
              }
              <Tooltip
                placement="topLeft"
                title={item?.otherSource || leadSource?.name}
              >
                <Typography variant={"h4"} weight={"medium"} inline>
                  {(leadSource?.name || "Direct").toUpperCase()}
                </Typography>
              </Tooltip>
            </DealInfoText>
            <DealInfoText color={"#333"}>
              <Icon type="phone" style={{ color: "#00648d" }} />{" "}
              {item?.phoneNumbers && (item?.phoneNumbers[0]?.phone || "N/A")}
            </DealInfoText>
            <DealInfoText align={"left"} color={"#333"}>
              <Icon type="car" style={{ color: "#00648d" }} /> {vehicle}
            </DealInfoText>
          </DealInfo>
          <DealInfo flex={1} align={"end"}>
            <DealInfoText fontSize={12} color={"#333"}>
              {item?.unreadCount > 0 && <Badge count={25} offset={[5, 0]} />}
            </DealInfoText>
            <DealInfoText fontSize={12} color={"#333"}>
              <Icon type="message" style={{ color: "#00648d" }} />{" "}
              {` ${leadDate}`}
            </DealInfoText>
            <DealInfoText color={"green"}>
              <DealStatusIcon
                status={item?.leadStatusType?.type || ""}
                msg={(item?.leadStatusType?.status || "").replace(/_/g, " ")}
              />
            </DealInfoText>
            {item?.leadStatusType?.type == "ACTIVE" && (
              <DealInfoText color={"green"}>
                <Tooltip
                  placement="topLeft"
                  title={
                    "Appointment: " +
                    convertUtcToLocal(
                      item?.activeAppointment?.startDatetime,
                      "ddd, MMMM Do YYYY, h:mm:ss A"
                    )
                  }
                >
                  <CustomCalendar>
                    <CalDate>
                      <span>
                        {convertUtcToLocal(
                          item?.activeAppointment?.startDatetime,
                          "DD"
                        )}
                      </span>
                    </CalDate>
                    <CalMonth>
                      <small>
                        {convertUtcToLocal(
                          item?.activeAppointment?.startDatetime,
                          "MMM"
                        )}
                      </small>
                    </CalMonth>
                  </CustomCalendar>
                </Tooltip>
              </DealInfoText>
            )}
          </DealInfo>
        </DealDataWrap>
      </DealDataContainer>
    </DealContainer>
  )
}

const ShowConsent = (selectedLead, user) => {
  return (
    <Tooltip title={ConentStatus(selectedLead?.textConsentStatus)}>
      <Icon
        type={ConentIconType(
          selectedLead?.textConsentStatus,
          user?.company?.isOptinConsentMethod
        )}
        style={{
          color: ConentStatusColor(selectedLead?.textConsentStatus),
          fontSize: 20,
          marginLeft: 5,
        }}
      />{" "}
      <small>
        {formatPhoneNumber(
          selectedLead?.phoneNumbers
            ? selectedLead?.phoneNumbers[0]?.phone
            : "N/A"
        )}
      </small>
    </Tooltip>
  )
}
const pageSize = 100
let page = 1
let lastLead = ""
const LeadActivityView = ({ queryString, lead, onBackClick, onFullScreen }) => {
  const tabContext = useContext(TabContext)
  const { user, setMaximizeScreen, notificationData } = useContext(UserContext)
  const text = useRef("")
  const messagesEndRef = useRef(null)
  const msgContainerRef = useRef(null)

  const [showSidebar, setShowSideBar] = useState(true)
  const [showDetails, setShowDetails] = useState(true)
  const [leadList, setLeadList] = useState([])
  const [fullScreen, setFullScreen] = useState(false)
  const [selectedLead, setSelectedLead] = useState(lead || null)
  const [searchKey, setSearchKey] = useState(queryString || "")
  const [showLeadSection, setShowLeadSection] = useState(
    window.innerWidth > 1024 ? true : false
  )
  const [showProfileSection, setShowProfileSection] = useState(
    window.innerWidth > 1024 ? true : false
  )

  const [userIdMap, setUserIdMap] = useState({})
  const [changeState, setChangeState] = useState(true)
  //const [choosenLead, setChoosenLead] = useState(lead)
  const [leadCount, setLeadCount] = useState(0)
  const [openCRMModal, setPushToCrmModalVisible] = useState(false)
  const [openAppointmentDrawer, setOpenAppointmentDrawer] = useState(false)
  const [openAddModal, setAddPhoneModalVisible] = useState(false)
  const [openTemplateModal, setTemplateModal] = useState(false)
  const [openEditPopup, setOpenEditPopup] = useState(false)
  const [refetchAppointment, setRefetchAppointment] = useState(false)
  const [inlineField, setInlineEditField] = useState("")

  const { data: userData } = useQuery(GET_ALL_USERS, {
    variables: { companyId: user?.company?.id || 0 },
    onCompleted: res => {
      let obj = userIdMap
      if (res?.getUsers?.data || []) {
        let users = res?.getUsers?.data || []
        users.forEach(el => {
          const id = el?.id
          obj = {
            ...obj,
            [id]: el?.firstName || "Ott",
          }
        })
        setUserIdMap({ ...obj })
      }
    },
  })

  const [variables, setVariables] = useState({
    search: "",
    source: [],
    sourceOriginal: [],
    combinedSource: [],
    voi: [],
    page: 1,
    pageSize: 25,
    orderBy: "latest_chat",
    orderDirection: "desc",
    status: "",
  })
  const [
    getMessages,
    { loading, error, data: leadMessagesData },
  ] = useLazyQuery(GET_MESSAGES, {
    //pollInterval: 10000,
    fetchPolicy: "network-only",
    onCompleted: res => {
      lastLead = res?.messages?.lastId || ""
      const messageData = res?.messages?.data || []
      let _messages = messageData.filter(
        x => !(selectedLead?.messages || []).includes(x)
      )

      if (messageData && _messages.length > 0) {
        _messages = [...(selectedLead?.messages || []), ..._messages]
        const _lead = { ...selectedLead, messages: _messages }
        setSelectedLead({ ..._lead })
        setChangeState(!changeState)
      }
    },
  })

  const { data: sourcesData } = useQuery(GET_LEAD_SOURCES)

  const {
    data: leadData,
    loading: leadsLoading,
    error: leadsError,
    refetch: refetchLeads,
  } = useQuery(GET_PAGINATED_LEADS, {
    fetchPolicy: "network-only",
    notifyOnNetworkStatusChange: true,
    variables,
    onCompleted: res => {
      if (res?.getLeads?.count > 0) {
        let leadList = res.getLeads.data
        setLeadCount(res.getLeads.count)
        leadList = leadList.filter(x => x.id !== lead.id)
        if (
          !(
            lead &&
            Object.keys(lead).length === 0 &&
            lead.constructor === Object
          ) &&
          variables?.search.length === 0 &&
          variables?.source.length === 0 &&
          variables?.voi.length === 0
        ) {
          leadList.unshift(lead)
          page = 1
          getMessages({
            variables: { leadId: lead.id, lastId: lastLead, page: 1, pageSize },
          })
        } else {
          let _lead = selectedLead
          if (isEmpty(selectedLead)) {
            _lead = leadList[0]
            setSelectedLead({ ..._lead, messages: [] })
          }

          page = 1
          getMessages({
            variables: {
              leadId: _lead?.id,
              lastId: lastLead,
              page: 1,
              pageSize,
            },
          })
        }
        setLeadList(leadList)
      } else if (!isUndefined(queryString) && !isEmpty(queryString)) {
        setAddPhoneModalVisible(true)
      } else if (res?.getLeads?.count == 0) {
        setLeadList([])
        setLeadCount(0)
      }
    },
  })
  const [createMessage] = useMutation(CREATE_MESSAGE)
  const [createMessageLog] = useMutation(CREATE_MESSAGE_LOG)
  const [updateLeadConsent] = useMutation(UPDATE_LEAD_CONSENT)
  const [
    updateLeadConversionStatus,
    { loading: updateStatusLoading },
  ] = useMutation(UPDATE_LEAD_CONVERSATION_STATUS)
  const [updateLeadPhone, { loading: updatePhoneLoading }] = useMutation(
    UPDATE_LEAD_PHONE
  )
  const [createLeadPhone, { loading: phoneLoading }] = useMutation(
    CREATE_LEAD_PHONE
  )
  const [updateLeadEmail, { loading: updateEmailLoading }] = useMutation(
    UPDATE_LEAD_EMAIL
  )
  const [createLeadEmail, { loading: createEmailLoading }] = useMutation(
    CREATE_LEAD_EMAIL
  )

  const [updateLead, { loading: createLoading }] = useMutation(UPDATE_LEAD)

  useEffect(() => {
    //console.log(`notificationData`, notificationData)
    if (notificationData) {
      if (notificationData?.lead_id == selectedLead.id) {
        if (notificationData?.lead_message) {
          setSelectedLead(prevState => {
            let newState = { ...prevState }
            newState.messages.push({
              id: notificationData?.lead_message?.id,
              campaignId: notificationData?.lead_message?.campaign_id,
              content: notificationData?.lead_message?.content,
              dateReceived: notificationData?.lead_message?.date_received,
              dateSent: notificationData?.lead_message?.date_sent,
              direction: notificationData?.lead_message?.direction,
              leadId: notificationData?.lead_message?.lead_id,
              userId: notificationData?.lead_message?.user_id,
              systemUserId: notificationData?.lead_message?.system_user_id,
              messageLog: {
                id: notificationData?.lead_message?.message_log?.id,
                messageId:
                  notificationData?.lead_message?.message_log?.message_id,
                toPhone: notificationData?.lead_message?.message_log?.to_phone,
                fromPhone:
                  notificationData?.lead_message?.message_log?.from_phone,
              },
            })
            return newState
          })
        }
      }
    }
  }, [notificationData])

  useEffect(() => {
    if (!isUndefined(queryString) && searchKey != "") {
      handleSearch(searchKey)
    }
  }, [searchKey])

  const onClickHandler = (content, lead, userId) => {
    if (!isEmpty(content)) {
      let message = {
        leadId: lead?.id,
        userId: userId,
        direction: "TO_LEAD",
        content: content,
        toPhone: lead?.phoneNumbers[0]?.phone,
      }
      let messageLog = {
        toPhone: lead?.phoneNumbers[0]?.phone,
      }
      let _selectedLead = {
        ...selectedLead,
        textConsentStatus:
          lead?.textConsentStatus || selectedLead?.textConsentStatus,
      }
      if ((selectedLead?.messages || []).length <= 0) {
        _selectedLead = { ..._selectedLead, messages: [] }
      }
      _selectedLead.messages.push({
        ...message,
        type: "new",
      })
      //setPage(1)
      page = 1
      setSelectedLead(_selectedLead)
      text.current.value = ""
      const res = createMessage({
        variables: {
          ...message,
        },
      }).then(res => {
        if (res?.data?.createMessage?.statusCode == 200) {
          let resMessage = res?.data?.createMessage?.leadMessage || {}
          const id = parseInt(resMessage?.id)
          createMessageLog({
            variables: {
              messageId: id,
              ...messageLog,
            },
          })
          let _lead = { ..._selectedLead }
          let findIndex = _lead.messages.findIndex(el => el?.type == "new")
          if (findIndex > -1) {
            _lead.messages[findIndex].type = ""
            _lead.messages[findIndex].id = resMessage?.id
            _lead.messages[findIndex].dateSent = resMessage?.dateSent
          }
          setSelectedLead({ ..._lead })
          setChangeState(!changeState)
        } else {
          message.error(res?.data?.createMessage?.message)
        }
      })
    }
  }

  const handleBackClick = () => {
    tabContext.setActiveTab("lead-center")
    onBackClick()
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    if ((selectedLead?.messages || []).length > 0 && page == 1) {
      scrollToBottom()
    }
  }, [selectedLead])

  const handleSearch = e => {
    page = 0
    lastLead = ""
    setSelectedLead({})
    setSearchKey(e)
    setVariables({ ...variables, page: 1, search: e })
  }

  const handleAddAppointment = e => {
    setOpenAppointmentDrawer(true)
    setRefetchAppointment(false)
  }

  const handleActiveToggle = async e => {
    await updateLeadConversionStatus({
      variables: { leadId: selectedLead?.id, disableConversation: e },
    }).then(resp => {
      if (resp?.data?.enableDisableLeadConversation?.statusCode == 200) {
        const respLead = resp?.data?.enableDisableLeadConversation?.lead || {}
        setSelectedLead(prevState => {
          let newState = { ...prevState }
          if (newState.conversationStatus) {
            newState.conversationStatus.disableConversation = e
          } else {
            newState = {
              ...newState,
              conversationStatus: respLead?.conversationStatus || {},
            }
          }
          return newState
        })
        setLeadList(prevState => {
          let newState = [...prevState]
          const findIndex = newState.findIndex(el => el.id == selectedLead.id)
          if (findIndex > -1) {
            if (newState[findIndex].conversationStatus) {
              newState[findIndex].conversationStatus.disableConversation = e
            } else {
              newState[findIndex] = {
                ...newState[findIndex],
                conversationStatus: respLead?.conversationStatus || {},
              }
            }
          }
          return newState
        })
        message.success(
          `The Lead auto message feature has been updated successfully`
        )
      }
    })
  }
  //console.log(`user?.company`, user?.company)
  const handleSendConsentClick = async e => {
    if (e) {
      e.preventDefault()
      let content = `${user?.company?.name ||
        "The dealer"} wants to message you. Reply STOP to opt out.`
      if (user?.company?.isOptinConsentMethod) {
        content = `${user?.company?.name ||
          "The dealer"} wants to message you. Reply YES to opt in, or STOP to opt out.`
      }
      await updateLeadConsent({ variables: { leadId: selectedLead?.id } }).then(
        resp => {
          if (resp?.data?.updateLeadConsentStatus?.ok) {
            const respLead = resp?.data?.updateLeadConsentStatus?.lead || {}
            console.log(`respLead`, respLead)
            setSelectedLead(prevState => {
              let newState = { ...prevState }
              newState.textConsentStatus =
                respLead?.textConsentStatus || "PENDING"
              newState.textConsentDate = respLead?.textConsentDate || moment()
              return newState
            })
            setLeadList(prevState => {
              let newState = [...prevState]
              const findIndex = newState.findIndex(
                el => el.id == selectedLead.id
              )
              if (findIndex > -1) {
                newState[findIndex].textConsentStatus =
                  respLead?.textConsentStatus
                newState[findIndex].textConsentDate = respLead?.textConsentDate
              }
              return newState
            })
            message.success(`The consent has been sent successfully`)
          }
        }
      )
      onClickHandler(
        content,
        { ...selectedLead, textConsentStatus: "PENDING" },
        user?.id
      )
    }
  }

  const { data: result } = useQuery(GET_LEAD_COUNT_BY_STATUS, {
    fetchPolicy: "network-only",
    variables: {
      range: 180,
    },
  })

  const handleAddPhoneClick = () => {
    setAddPhoneModalVisible(true)
  }

  const handleStatusFilter = status => {
    setVariables({ ...variables, page: 1, search: "", status })
  }

  const handleClearFilter = () => {
    setSearchKey("")
    setVariables({ ...variables, page: 1, search: "", status: "" })
  }

  const handleSetDefinedTemplate = msg => {
    text.current.value = msg
  }

  const onMsgScroll = e => {
    const scrollTop = msgContainerRef.current.scrollTop
    if (scrollTop == 0 && !isEmpty(selectedLead?.messages)) {
      page = page + 1
      getMessages({
        variables: {
          leadId: selectedLead.id,
          lastId: lastLead,
          page: page,
          pageSize,
        },
      })
    }
  }

  const handleUpdate = async payload => {
    if (payload) {
      let lead = { ...selectedLead }
      if (payload?.key == "fullName") {
        let leadResp = await updateLead({
          variables: {
            id: lead.id,
            fullName: payload?.value || "",
          },
        })
        if (leadResp?.data?.updateLead?.statusCode != 200) {
          message.error(leadResp?.data?.updateLead?.message)
          return
        } else {
          lead = {
            ...lead,
            fullName: leadResp?.data?.updateLead?.lead?.fullName,
          }
          setLeadList(prevState => {
            let newState = [...prevState]
            const findIndex = newState.findIndex(el => el.id == selectedLead.id)
            if (findIndex > -1) {
              newState[findIndex].fullName = lead.fullName
            }
            return newState
          })
        }
      }
      if (payload?.key == "phone") {
        //update or create phone
        let phoneResp = null
        if (
          (lead?.phoneNumbers || []).length > 0 &&
          lead?.phoneNumbers[0] != null
        ) {
          phoneResp = await updateLeadPhone({
            variables: {
              id: parseInt(lead?.phoneNumbers[0].id),
              phone: payload?.value || "",
            },
          })
          if (phoneResp?.data?.updateLeadPhone?.statusCode != 200) {
            message.error(phoneResp?.data?.updateLeadPhone?.message)
            return
          } else {
            lead.phoneNumbers[0] = {
              ...phoneResp?.data?.updateLeadPhone?.leadPhone,
            }
          }
        } else {
          phoneResp = await createLeadPhone({
            variables: {
              leadId: parseInt(selectedLead.id),
              phone: payload?.value || "",
            },
          })
          if (phoneResp?.data?.createLeadPhone?.statusCode != 200) {
            message.error(phoneResp?.data?.createLeadPhone?.message)
            return
          } else {
            lead = {
              ...lead,
              phoneNumbers: [
                { ...phoneResp?.data?.createLeadPhone?.leadPhone },
              ],
            }
          }
        }
        setLeadList(prevState => {
          let newState = [...prevState]
          const findIndex = newState.findIndex(el => el.id == selectedLead.id)
          if (findIndex > -1) {
            newState[findIndex].phoneNumbers[0] = lead.phoneNumbers[0]
          }
          return newState
        })
      }
      if (payload?.key == "email") {
        //update or create email
        let emailResp = null
        if ((lead?.emails || []).length > 0 && lead?.emails[0] != null) {
          emailResp = await updateLeadEmail({
            variables: {
              id: parseInt(parseInt(lead?.emails[0].id)),
              email: payload?.value || "",
            },
          })
          if (!emailResp?.data?.updateLeadEmail?.ok) {
            message.error("Lead email couldn't update due to internal error")
            return
          } else {
            lead.emails[0] = {
              ...emailResp?.data?.updateLeadEmail?.leadEmail,
            }
          }
        } else {
          emailResp = await createLeadEmail({
            variables: {
              leadId: parseInt(selectedLead.id),
              email: payload?.value || "",
            },
          })
          if (!emailResp?.data?.createLeadEmail?.leadEmail) {
            message.error("Lead email couldn't create due to internal error")
            return
          } else {
            lead = {
              ...lead,
              emails: [{ ...emailResp?.data?.createLeadEmail?.leadEmail }],
            }
          }
        }
        setLeadList(prevState => {
          let newState = [...prevState]
          const findIndex = newState.findIndex(el => el.id == selectedLead.id)
          if (findIndex > -1) {
            newState[findIndex].emails[0] = lead.emails[0]
          }
          return newState
        })
      }

      setSelectedLead(lead)
      setInlineEditField(null)
    }
  }

  const countData = result?.leadsByStatus || []
  const sentCount = countByStatus(countData)(["WAITING_FOR_REPLY"])
  const respondedCount = countByStatus(countData)(["RESPONDED"])
  const unContactedCount = countByStatus(countData)(["UNCONTACTED"])

  const updateLoading =
    updatePhoneLoading ||
    phoneLoading ||
    updateEmailLoading ||
    createEmailLoading

  return (
    <>
      <ResponsiveNavigation style={{ border: 0 }}>
        <Tooltip placement="top" title={"Show Leads"}>
          <IconMobile
            type="unordered-list"
            onClick={() => setShowLeadSection(true)}
          />
        </Tooltip>
        <div style={{ textAlign: "center" }}>
          <Typography variant={"h4"} weight={"medium"} inline>
            {selectedLead?.fullName || ""}
            <p>{ShowConsent(selectedLead, user)}</p>
          </Typography>
        </div>
        <FilterButtonGroup>
          <Tooltip placement="top" title={"Show lead profile"}>
            <IconMobile
              type="user"
              onClick={() => setShowProfileSection(true)}
            />
          </Tooltip>
          <Tooltip
            placement="top"
            title={fullScreen ? "Minimize screen" : "Maximize screen"}
          >
            <IconMobile
              type={fullScreen ? "fullscreen-exit" : "fullscreen"}
              onClick={() => {
                setFullScreen(!fullScreen)
                onFullScreen(!fullScreen)
                setMaximizeScreen(!fullScreen)
              }}
            />
          </Tooltip>
        </FilterButtonGroup>
      </ResponsiveNavigation>
      <ContainerCustom id={"conversation-cntr"} auto>
        {!fullScreen && (
          <ContainerNavigation>
            <InputButtonGroup style={{ width: "30%", margin: 0 }}>
              <Input.Search
                onSearch={e => handleSearch(e)}
                placeholder={"Search leads by details"}
                name={"search"}
                allowClear={true}
                value={searchKey}
                onChange={e => setSearchKey(e.target.value)}
              />
              {(variables?.search != "" || variables?.status != "") && (
                <ButtonCustom
                  type="primary"
                  style={{ marginLeft: "5px" }}
                  onClick={() => handleClearFilter()}
                >
                  Clear Filters <IconCustom type="close-circle" />
                </ButtonCustom>
              )}
            </InputButtonGroup>
            <div>
              <SecondaryButton
                type="primary"
                onClick={() => handleAddPhoneClick()}
                icon="plus"
                style={{ marginRight: "5px" }}
              >
                Add Phone
              </SecondaryButton>
              <Button type={"default"} onClick={() => handleBackClick()}>
                Back
              </Button>
            </div>
          </ContainerNavigation>
        )}

        <ContentCustom>
          {window.innerWidth > 1024 ? (
            <LeadSection
              showSidebar={showSidebar}
              setShowSideBar={setShowSideBar}
              respondedCount={respondedCount}
              sentCount={sentCount}
              unContactedCount={unContactedCount}
              selectedLead={selectedLead}
              leadsError={leadsError}
              leadsLoading={leadsLoading}
              leadList={leadList}
              variables={variables}
              leadCount={leadCount}
              lastLead={lastLead}
              pageSize={pageSize}
              setVariables={setVariables}
              setSelectedLead={setSelectedLead}
              getMessages={getMessages}
              sourcesData={sourcesData}
              handleStatusFilter={handleStatusFilter}
            />
          ) : (
            showLeadSection && (
              <DrawerWrap
                title=""
                placement="left"
                closable={false}
                width={350}
                onClose={() => setShowLeadSection(false)}
                visible={showLeadSection}
              >
                <LeadSection
                  showSidebar={showSidebar}
                  setShowSideBar={setShowSideBar}
                  respondedCount={respondedCount}
                  sentCount={sentCount}
                  unContactedCount={unContactedCount}
                  selectedLead={selectedLead}
                  leadsError={leadsError}
                  leadsLoading={leadsLoading}
                  leadList={leadList}
                  variables={variables}
                  leadCount={leadCount}
                  lastLead={lastLead}
                  pageSize={pageSize}
                  setVariables={setVariables}
                  setSelectedLead={setSelectedLead}
                  getMessages={getMessages}
                  sourcesData={sourcesData}
                  handleStatusFilter={handleStatusFilter}
                />
                <DrawerFooter>
                  <Button onClick={() => setShowLeadSection(false)}>
                    Close
                  </Button>
                </DrawerFooter>
              </DrawerWrap>
            )
          )}

          <SelectedDealCntr>
            <ContentBodyConversationsWrap height={fullScreen ? "88vh" : "64vh"}>
              <ConversationsWrap ref={msgContainerRef} onScroll={onMsgScroll}>
                <MessagesContainer>
                  <div style={{ textAlign: "center" }}>
                    {loading && (
                      <Spin
                        spinning={loading}
                        tip={
                          loading
                            ? "Loading messages..."
                            : "Loading more messages..."
                        }
                      />
                    )}
                  </div>
                  {!loading &&
                    !error &&
                    selectedLead &&
                    selectedLead?.messages?.length > 0 &&
                    selectedLead?.messages
                      .sort((a, b) => {
                        let aPostTime = 0
                        let bPostTime = 0
                        if (a?.dateSent) {
                          aPostTime = moment(a?.dateSent).valueOf()
                        } else {
                          aPostTime = moment(a?.dateReceived).valueOf()
                        }
                        if (b?.dateSent) {
                          bPostTime = moment(b?.dateSent).valueOf()
                        } else {
                          bPostTime = moment(b?.dateReceived).valueOf()
                        }
                        if (aPostTime < bPostTime) {
                          return -1
                        }
                        if (aPostTime > bPostTime) {
                          return 1
                        }
                        return 0
                      })
                      .map(
                        c =>
                          (c?.content || "") != "" && (
                            <Fragment key={c?.id}>
                              {(c?.content || "")
                                .toLowerCase()
                                .includes("appointment") ? (
                                <AppointmentBox>
                                  <Icon type={"calendar"} />
                                  <Alert
                                    message={<>{SetContentBy(c, userIdMap)}</>}
                                  />
                                  <AppointmentBoxInfoSent>
                                    {convertUtcToLocal(
                                      c?.dateSent,
                                      "ddd, MMMM Do YYYY, h:mm:ss A"
                                    )}
                                  </AppointmentBoxInfoSent>
                                </AppointmentBox>
                              ) : (
                                <>
                                  {c?.dateReceived ? (
                                    <MessageRespBoxWrap key={c?.id}>
                                      <MessageRespBox>
                                        <MessageRespRow>
                                          <div>{c?.content || ""}</div>
                                        </MessageRespRow>
                                        <MessageBoxInfoResp>
                                          {selectedLead?.fullName} posted at{" "}
                                          {convertUtcToLocal(
                                            c?.dateReceived,
                                            "ddd, MMMM Do YYYY, h:mm:ss A"
                                          )}
                                        </MessageBoxInfoResp>
                                      </MessageRespBox>
                                    </MessageRespBoxWrap>
                                  ) : (
                                    <MessageBoxWrap key={c?.id} sent>
                                      <MessageSentBox>
                                        <MessageSentRow>
                                          <div>{c?.content || ""}</div>
                                          <Icon
                                            type={
                                              c?.type == "new"
                                                ? "loading"
                                                : "check"
                                            }
                                            style={{
                                              fontSize: "14px",
                                              marginLeft: 10,
                                            }}
                                          />
                                        </MessageSentRow>
                                        <MessageBoxInfoSent>
                                          {c?.systemUserId
                                            ? userIdMap &&
                                              userIdMap[c?.systemUserId]
                                            : userIdMap &&
                                              userIdMap[c?.userId]}{" "}
                                          posted at{" "}
                                          {convertUtcToLocal(
                                            c?.dateSent,
                                            "ddd, MMMM Do YYYY, h:mm:ss A"
                                          )}
                                        </MessageBoxInfoSent>
                                      </MessageSentBox>
                                    </MessageBoxWrap>
                                  )}
                                </>
                              )}
                            </Fragment>
                          )
                      )}
                </MessagesContainer>
                <div ref={messagesEndRef} />
              </ConversationsWrap>
              <InternalDividerWrap />
              <OptionContainer>
                {/* <OptionRow>
                  <Button type="link" onClick={e => setTemplateModal(true)}>
                    <Typography
                      variant={"small"}
                      weight={"medium"}
                      color={"blue"}
                    >
                      Select Message Template
                    </Typography>
                  </Button>
                </OptionRow> */}

                <Row gutter={[0, 4]}>
                  <Col lg={20} xl={20} sm={24} md={24}>
                    <InputContainer>
                      <InputTextWrap
                        id="text"
                        ref={text}
                        placeholder={"Type a text..."}
                        name={"text"}
                        id={"text"}
                        onKeyUp={e => {
                          if (e.key === "Enter") {
                            onClickHandler(
                              text.current.value,
                              selectedLead,
                              user?.id
                            )
                          }
                        }}
                      />
                    </InputContainer>
                  </Col>
                  <Col
                    lg={4}
                    xl={4}
                    sm={24}
                    md={24}
                    style={{
                      textAlign: window.innerWidth > 1366 ? "left" : "right",
                      paddingTop: 14,
                    }}
                  >
                    <TooltipButton
                      tooltip="Send SMS"
                      type="primary"
                      disabled={!selectedLead}
                      shape="circle"
                      onClick={() => {
                        onClickHandler(
                          text.current.value,
                          selectedLead,
                          user?.id
                        )
                      }}
                      component={AirplaneIconWhite}
                      alt="Send"
                    />
                    <TooltipButton
                      tooltip="Select Template"
                      type="secondary"
                      shape="circle"
                      icon={"profile"}
                      onClick={e => setTemplateModal(true)}
                      alt="Select Template"
                      fontSize={18}
                    />

                    <TooltipButton
                      tooltip="Add Appointment"
                      disabled={!selectedLead}
                      shape="circle"
                      onClick={e => handleAddAppointment(e)}
                      component={NoteIcon}
                      alt="Appointment"
                    />
                  </Col>
                </Row>
              </OptionContainer>
            </ContentBodyConversationsWrap>
            {window.innerWidth > 1024 ? (
              <ProfileSection
                selectedLead={selectedLead}
                showDetails={showDetails}
                setPushToCrmModalVisible={setPushToCrmModalVisible}
                setOpenEditPopup={setOpenEditPopup}
                handleUpdate={handleUpdate}
                refetchAppointment={refetchAppointment}
                handleSendConsentClick={handleSendConsentClick}
                handleActiveToggle={handleActiveToggle}
                setInlineEditField={setInlineEditField}
                updateLoading={updateLoading}
                inlineField={inlineField}
                user={user}
                updateStatusLoading={updateStatusLoading}
              />
            ) : (
              showProfileSection && (
                <DrawerWrap
                  title=""
                  placement="right"
                  closable={false}
                  width={350}
                  onClose={() => setShowProfileSection(false)}
                  visible={showProfileSection}
                >
                  <ProfileSection
                    selectedLead={selectedLead}
                    showDetails={showDetails}
                    setPushToCrmModalVisible={setPushToCrmModalVisible}
                    setOpenEditPopup={setOpenEditPopup}
                    handleUpdate={handleUpdate}
                    refetchAppointment={refetchAppointment}
                    handleSendConsentClick={handleSendConsentClick}
                    handleActiveToggle={handleActiveToggle}
                    setInlineEditField={setInlineEditField}
                    updateLoading={updateLoading}
                    inlineField={inlineField}
                    user={user}
                    updateStatusLoading={updateStatusLoading}
                  />
                  <DrawerFooter>
                    <Button onClick={() => setShowProfileSection(false)}>
                      Close
                    </Button>
                  </DrawerFooter>
                </DrawerWrap>
              )
            )}
          </SelectedDealCntr>
        </ContentCustom>
        {openCRMModal && (
          <PushToCrmModal
            pushToCrmModalVisible={openCRMModal}
            setPushToCrmModalVisible={setPushToCrmModalVisible}
            changeDealStatus={""}
            conversations={
              selectedLead && selectedLead.messages.length
                ? selectedLead.messages
                : []
            }
            selectedLead={selectedLead}
            users={userIdMap}
          />
        )}
        {openAppointmentDrawer && (
          <AppointmentModal
            lead={selectedLead}
            openAppointmentDrawer={openAppointmentDrawer}
            setOpenDrawer={flag => {
              setOpenAppointmentDrawer(flag)
              setRefetchAppointment(prevState => {
                let newState = { ...prevState }
                return newState
              })
            }}
            onClick={item => {
              setOpenAppointmentDrawer(false)
              setSelectedLead({ ...item })
              page = 1
              getMessages({
                variables: {
                  leadId: item?.id,
                  lastId: lastLead,
                  page: 1,
                  pageSize,
                },
              })
            }}
          />
        )}
        {openAddModal && (
          <AddPhoneModal
            phoneNumber={queryString}
            openModal={openAddModal}
            setModalVisible={setAddPhoneModalVisible}
            variables={variables}
            data={leadList}
            sources={sourcesData?.leadSources || []}
            onSetLead={(item, mode) => {
              let _item = { ...item, messages: [] }
              setSelectedLead(_item)
              page = 1
              getMessages({
                variables: {
                  leadId: item.id,
                  lastId: lastLead,
                  page: 1,
                  pageSize,
                },
              })
              if (mode == "new") {
                leadList.unshift(_item)
              }
            }}
          />
        )}
        {openTemplateModal && (
          <TemplateDrawer
            openTemplateDrawer={openTemplateModal}
            setOpenTemplateDrawer={setTemplateModal}
            onApply={handleSetDefinedTemplate}
          />
        )}
        {openEditPopup && (
          <LeadEditModal
            lead={selectedLead}
            visibleModal={openEditPopup}
            setModelVisible={setOpenEditPopup}
            refetch={payload => {
              setSelectedLead({ ...payload })
              refetchLeads()
            }}
          />
        )}
      </ContainerCustom>
    </>
  )
}
export default LeadActivityView

const LeadSection = ({
  showSidebar,
  setShowSideBar,
  respondedCount,
  sentCount,
  unContactedCount,
  selectedLead,
  leadsError,
  leadsLoading,
  leadList,
  variables,
  leadCount,
  lastLead,
  pageSize,
  setVariables,
  setSelectedLead,
  getMessages,
  sourcesData,
  handleStatusFilter,
}) => {
  return (
    <>
      {!showSidebar && (
        <Tooltip
          placement="topLeft"
          title={showSidebar ? "Hide Conversations" : "Show Conversations"}
        >
          <SidebarArrow left onClick={() => setShowSideBar(true)}>
            <Icon type="right" />
          </SidebarArrow>
        </Tooltip>
      )}
      {showSidebar && (
        <ContentSidebarCustom flex={4}>
          <Tooltip
            placement="top"
            title={showSidebar ? "Hide Conversations" : "Show Conversations"}
          >
            <SidebarArrow right onClick={() => setShowSideBar(false)}>
              <Icon type="left" />
            </SidebarArrow>
          </Tooltip>
          <FiltersContainerWrapper>
            <Row gutter={[0, 0]} style={{ display: "flex" }}>
              <Col span={8} style={{ background: colorCode["RESPONDED"] }}>
                <a onClick={() => handleStatusFilter("RESPONDED")}>
                  <TypographyWrap
                    variant={"tiny"}
                    weight={"medium"}
                    color={"white"}
                  >
                    AWAITING YOUR RESPONSE{" "}
                    <CountSpan>({respondedCount})</CountSpan>
                  </TypographyWrap>
                </a>
              </Col>
              <Col
                span={8}
                style={{ background: colorCode["WAITING_FOR_REPLY"] }}
              >
                <a onClick={() => handleStatusFilter("WAITING_FOR_REPLY")}>
                  <TypographyWrap
                    variant={"tiny"}
                    weight={"medium"}
                    color={"white"}
                  >
                    AWAITING LEAD RESPONSE
                    <CountSpan> ({sentCount})</CountSpan>
                  </TypographyWrap>
                </a>
              </Col>
              <Col
                span={8}
                style={{
                  background: colorCode["UNCONTACTED"],
                }}
              >
                <a onClick={() => handleStatusFilter("UNCONTACTED")}>
                  <TypographyWrap
                    variant={"tiny"}
                    weight={"medium"}
                    color={"white"}
                  >
                    UNCONTACTED <CountSpan> ({unContactedCount})</CountSpan>
                  </TypographyWrap>
                </a>
              </Col>
            </Row>
          </FiltersContainerWrapper>
          <DealsContainer>
            {!leadsError && (
              <List
                itemLayout="horizontal"
                loading={leadsLoading}
                dataSource={leadList}
                pagination={
                  leadCount < 5
                    ? null
                    : {
                        defaultCurrent: variables.page,
                        current: variables.page,
                        defaultPageSize: variables.pageSize,
                        pageSize: variables.pageSize,
                        total: leadCount,
                        showTotal: (total, range) =>
                          `Total: ${total} ${total === 1 ? "lead" : "leads"}`,
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
                renderItem={(item, i) => {
                  return (
                    <ListItemWrap
                      key={item.id}
                      stripcolor={colorCode[item?.status]}
                      style={{
                        background:
                          selectedLead && selectedLead.id === item.id
                            ? "#E6F0FF"
                            : "none",
                      }}
                    >
                      <List.Item.Meta
                        description={renderLead(item, sourcesData)}
                        onClick={() => {
                          let _item = { ...item, messages: [] }
                          setSelectedLead(_item)
                          page = 1
                          getMessages({
                            variables: {
                              leadId: item.id,
                              lastId: lastLead,
                              page: 1,
                              pageSize,
                            },
                          })
                        }}
                      />
                    </ListItemWrap>
                  )
                }}
              />
            )}
          </DealsContainer>
        </ContentSidebarCustom>
      )}
    </>
  )
}

const ProfileSection = ({
  selectedLead,
  showDetails,
  setPushToCrmModalVisible,
  setOpenEditPopup,
  handleUpdate,
  refetchAppointment,
  handleSendConsentClick,
  handleActiveToggle,
  setInlineEditField,
  updateLoading,
  inlineField,
  user,
  updateStatusLoading = false,
}) => {
  return (
    <DealInfoSideBarWrap flex={3}>
      <ButtonCustom
        type="primary"
        style={{ margin: "15px 0", width: "95%" }}
        onClick={() => setPushToCrmModalVisible(true)}
      >
        Push to CRM
      </ButtonCustom>

      <Collapse
        bordered={false}
        expandIconPosition={"right"}
        defaultActiveKey={["1", "2", "3"]}
        expandIcon={({ isActive }) => (
          <Icon type="caret-right" rotate={isActive ? 90 : 0} />
        )}
      >
        <Collapse.Panel
          header={
            <>
              {"Profile"}{" "}
              <a
                onClick={e => {
                  e.stopPropagation()
                  setOpenEditPopup(true)
                }}
              >
                <Icon type={"edit"} onClick={e => setOpenEditPopup(true)} />
              </a>
            </>
          }
          key="1"
        >
          <OptionContainer>
            <InputButtonGroup>
              <EditableTextBox
                key="fullName"
                value={selectedLead?.fullName || ""}
                placeholder={"Enter Email"}
                onSave={val => handleUpdate({ key: "fullName", value: val })}
                fontSize={"18px"}
                bold={true}
              />
            </InputButtonGroup>
            {showDetails && (
              <>
                <OptionContainer>
                  <OptionGroupInfo>
                    <InputButtonGroupWrapper>
                      <b>Email:</b>
                      <EditableTextBox
                        key="email"
                        value={
                          selectedLead?.emails
                            ? selectedLead?.emails[0]?.email
                            : "N/A"
                        }
                        placeholder={"Enter Email"}
                        onSave={val =>
                          handleUpdate({ key: "email", value: val })
                        }
                        isEdit={inlineField == "email"}
                        onCancel={e => setInlineEditField("")}
                        onSetEditable={e => setInlineEditField("email")}
                        loading={updateLoading}
                      />
                    </InputButtonGroupWrapper>
                    <InputButtonGroupWrapper>
                      <b>Phone:</b>
                      <EditablePhoneInput
                        key="phone"
                        value={
                          selectedLead?.phoneNumbers
                            ? selectedLead?.phoneNumbers[0]?.phone
                            : "N/A"
                        }
                        onSave={val =>
                          handleUpdate({ key: "phone", value: val })
                        }
                      />
                    </InputButtonGroupWrapper>
                    <InputButtonGroupWrapper>
                      <b>Vehicles: </b>
                      <VehicleDiv>
                        {vehicles(selectedLead?.vehicleOfInterest || [])}
                      </VehicleDiv>
                    </InputButtonGroupWrapper>
                    <InputButtonGroupWrapper>
                      <b>Location:</b>
                      <VehicleDiv>{parseLocation(selectedLead)}</VehicleDiv>
                    </InputButtonGroupWrapper>
                  </OptionGroupInfo>
                </OptionContainer>
              </>
            )}
          </OptionContainer>
        </Collapse.Panel>
        <Collapse.Panel header="Consents" key="2">
          <Row>
            <Col style={{ padding: 10 }}>
              {selectedLead?.textConsentStatus == "ACCEPTED" && (
                <p>
                  <Typography variant={"small"} weight={"medium"}>
                    {`Consent expires in ${selectedLead?.consentExpireDay} days`}
                  </Typography>
                </p>
              )}
              <a
                onClick={e => handleSendConsentClick(e)}
                disabled={["DECLINED", "ACCEPTED", "PENDING"].includes(
                  selectedLead?.textConsentStatus
                )}
              >
                <Progress
                  type="circle"
                  percent={100}
                  strokeColor={ConentStatusColor(
                    selectedLead?.textConsentStatus,
                    user?.company?.isOptinConsentMethod
                  )}
                  format={percent => (
                    <Typography
                      variant={"small"}
                      weight={"medium"}
                      color={ConentColor(
                        selectedLead?.textConsentStatus,
                        user?.company?.isOptinConsentMethod
                      )}
                    >
                      <Icon
                        style={{ marginBottom: 10 }}
                        type={ConentIconType(
                          selectedLead?.textConsentStatus,
                          user?.company?.isOptinConsentMethod
                        )}
                      />
                      <p>{` ${ConentStatus(
                        selectedLead?.textConsentStatus,
                        user?.company?.isOptinConsentMethod
                      )}`}</p>
                    </Typography>
                  )}
                />
              </a>{" "}
              <p>
                <Typography variant={"small"} weight={"medium"}>
                  {selectedLead?.textConsentStatus == "ACCEPTED"
                    ? `Consent opted-in on ${convertUtcToLocal(
                        selectedLead?.textConsentDate,
                        "MM/DD/YYYY hh:mm A"
                      )}`
                    : selectedLead?.textConsentStatus == "DECLINED"
                    ? `Consent opted-out on ${convertUtcToLocal(
                        selectedLead?.textConsentDate,
                        "MM/DD/YYYY hh:mm A"
                      )}`
                    : selectedLead?.textConsentStatus == "PENDING"
                    ? `Consent sent on ${convertUtcToLocal(
                        selectedLead?.textConsentDate,
                        "MM/DD/YYYY hh:mm A"
                      )}`
                    : ""}
                </Typography>
              </p>
              <p style={{ textAlign: "left" }}>
                <BadgeWrap color="#52c41a" text="Opted In" />
                <BadgeWrap color="#ffbf00" text="Pending" />
                <BadgeWrap color="#FC5A5A" text="Opted Out" />
                <BadgeWrap color="#EEEEF1" text="No Consent" />
              </p>
              <p>
                <Typography variant={"small"} weight={"medium"} inline>
                  Otto Bot:{" "}
                </Typography>
                <Switch
                  checked={
                    selectedLead?.conversationStatus?.disableConversation
                  }
                  onChange={e => handleActiveToggle(e)}
                  loading={updateStatusLoading}
                />
              </p>
              <p>
                <Typography variant={"small"} weight={"medium"}>
                  {`${
                    selectedLead?.conversationStatus?.disableConversation
                      ? "Enabled"
                      : "Disabled"
                  }  by ${user?.fullName || ""} on ${convertUtcToLocal(
                    selectedLead?.conversationStatus?.createdOn,
                    "MMMM Do YYYY"
                  )}`}
                </Typography>
              </p>
            </Col>
          </Row>
        </Collapse.Panel>
        <Collapse.Panel
          header={
            <>
              {"Lead Info"}{" "}
              <a
                onClick={e => {
                  e.stopPropagation()
                  setOpenEditPopup(true)
                }}
              >
                <Icon type={"edit"} onClick={e => setOpenEditPopup(true)} />
              </a>
            </>
          }
          key="3"
        >
          <OptionContainer>
            <OptionGroupInfo>
              <InputButtonGroupWrapper>
                <b>Status:</b>
                <Tooltip
                  placement="topLeft"
                  title={
                    selectedLead?.leadStatusType
                      ? selectedLead?.leadStatusType?.status.replace(/_/g, " ")
                      : ""
                  }
                >
                  {selectedLead?.leadStatusType
                    ? LeadStatus(selectedLead?.leadStatusType?.type)
                    : "N/A"}
                </Tooltip>
              </InputButtonGroupWrapper>
              <InputButtonGroupWrapper>
                <b>Source:</b> {selectedLead?.leadSource?.name || ""}
              </InputButtonGroupWrapper>
            </OptionGroupInfo>
          </OptionContainer>
        </Collapse.Panel>
        <Collapse.Panel header="Campaigns" key="5">
          <CampaignListView leadId={selectedLead?.id} />
        </Collapse.Panel>
        <Collapse.Panel header="Appointments" key="6">
          <AppointmentList
            width={"80px"}
            leadId={selectedLead?.id}
            refetch={refetchAppointment}
          />
        </Collapse.Panel>
      </Collapse>
    </DealInfoSideBarWrap>
  )
}

const LeadStatus = status => {
  if (status == "ACTIVE") {
    return <Tag color="#2db7f5">Active</Tag>
  } else if (status == "LOST") {
    return <Tag color="#cd201f">Lost</Tag>
  } else if (status == "SOLD") {
    return <Tag color="#87d068">Sold</Tag>
  } else {
    return "N/A"
  }
}

const vehicles = vehicles => {
  let list = []
  if (vehicles.length > 0) {
    list = vehicles.map(el => {
      let voi = ""
      if (!isUndefined(el.make)) voi = voi + el.make + " "
      if (!isUndefined(el.model)) voi = voi + el.model + " "
      if (!isUndefined(el.year)) voi = voi + el.year + " "

      return (
        <Tooltip
          placement="topLeft"
          title={
            el?.isCurrent ? "Previous/Current Vehicle" : "Vehicle of Interest"
          }
        >
          <Tag color={el?.isCurrent ? "magenta" : "blue"}>{voi}</Tag>
        </Tooltip>
      )
    })
  }
  return list
}

const ConentIconType = (consent, status) => {
  return `${
    consent == "ACCEPTED"
      ? "check-circle"
      : consent == "PENDING" && status
      ? "clock-circle"
      : consent == "PENDING" && !status
      ? "check-circle"
      : consent == "DECLINED"
      ? "close-circle"
      : "exclamation-circle"
  }`
}

const ConentColor = (consent, status) => {
  const color = `${
    consent == "ACCEPTED"
      ? "green"
      : consent == "PENDING" && status
      ? "orange"
      : consent == "PENDING" && !status
      ? "green"
      : consent == "DECLINED"
      ? "red"
      : "brandPurple"
  }`
  return color
}

const ConentStatusColor = (consent, status) => {
  return `${
    consent == "ACCEPTED"
      ? "#52c41a"
      : consent == "PENDING" && status
      ? "#ffbf00"
      : consent == "PENDING" && !status
      ? "#52c41a"
      : consent == "DECLINED"
      ? "#FC5A5A"
      : "#EEEEF1"
  }`
}
const ConentStatus = (consent, status) => {
  return `${
    consent == "ACCEPTED"
      ? "Opted-In"
      : consent == "PENDING" && status
      ? "Pending Consent"
      : consent == "PENDING" && !status
      ? "Implied Consent"
      : consent == "DECLINED"
      ? "Opted-Out"
      : "Send Consent"
  }`
}

const SetContentBy = (item, userIdMap) => {
  const user = item?.systemUserId
    ? userIdMap && userIdMap[item?.systemUserId]
    : userIdMap && userIdMap[item?.userId]

  if ((item?.content || "").toLowerCase().includes("booked")) {
    return (item?.content || "")
      .toLowerCase()
      .replace("booked", `booked by ${user}`)
  } else if ((item?.content || "").toLowerCase().includes("rescheduled")) {
    return (item?.content || "")
      .toLowerCase()
      .replace("rescheduled", `rescheduled by ${user}`)
  } else if ((item?.content || "").toLowerCase().includes("cancelled")) {
    return (item?.content || "").replace("cancelled", `cancelled by ${user}`)
  } else {
    return item?.content || ""
  }
}
