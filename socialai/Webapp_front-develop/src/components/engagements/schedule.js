import React, { useState, useEffect, useContext, useMemo } from "react"
import {
  Button,
  Row,
  Col,
  Switch,
  Select,
  Alert,
  DatePicker,
  TimePicker,
  Radio,
  message,
  Collapse,
  Icon,
  Skeleton,
} from "antd"
import { useQuery, useMutation } from "@apollo/react-hooks"
import { UserContext } from "../../amplify/authenticator-provider"
import styled from "styled-components"
import Typography from "../../library/typography"
import {
  PaddedCol,
  Container,
  Content,
  ContentBody,
  Tag,
  SettingsSectionTitle,
  ContainerNavigation,
  IconCustom,
  FilterButtonGroup,
} from "../../library/basicComponents"
import ScheduleForm from "./scheduleForm"
import isEmpty from "lodash/isEmpty"
import moment from "moment"
import isUndefined from "lodash/isUndefined"
import orderBy from "lodash/orderBy"
import last from "lodash/last"
import { showConfirmationModal } from "../../library/helpers"
import {
  GET_LEAD_SOURCES,
  GET_ALL_CAMPAIGNS,
  GET_CAMPAIGN_DETAILS,
  GET_MY_COMPANY,
} from "../../graphql/query"
import {
  UPDATE_CAMPAIGN,
  DELETE_CAMPAIGN_SCHEDULE,
  UPDATE_COMPANY,
  CREATE_CAMPAIGN_SCHEDULE,
  CREATE_CAMPAIGN_TEMPLATE,
  UPDATE_CAMPAIGN_SCHEDULE_TEMPLATE,
  UPDATE_CAMPAIGN_SCHEDULE,
  UPDATE_CAMPAIGN_SCHEDULE_SORT_ORDERS,
} from "../../graphql/mutation"
import {
  sortableContainer,
  sortableElement,
  sortableHandle,
} from "react-sortable-hoc"
import { arrayMoveImmutable } from "array-move"
import { numToWord } from "../../library/utils"
const { Panel } = Collapse
const INITIAL_MESSAGE = "Hi, {firstName}"
const MODAL_TITLE = `Do you want to continue?`
const MODAL_CONTENT = `When clicked the OK button, it cannot be recovered`
const ContainerBody = styled.div`
  padding: ${props => (props.spaced ? "1.5rem" : "1em")};
  padding: ${props => (props.noVertical ? "0 1rem" : "1em")};
  margin-bottom: 1rem;
  > .ant-row > .ant-col {
    text-align: left !important;
  }
`
const SelectLabel = styled.div`
  padding-top: 0px;
`
const ContainerNavigationWrap = styled(ContainerNavigation)`
  border-bottom: 0;
  padding: 0 0.5rem;
`
const PWrap = styled.p`
  padding-top: 5px;
  width: 80%;
  min-width: 80%;
  color: #999;
`
const TagWrap = styled(Tag)`
  padding: 5px 5px;
  margin: 0 5px;
  border-radius: 4px;
  margin-left: ${props => (props.marginLeft ? props.marginLeft : "5px")};
`
const PanelWrap = styled(Panel)`
  margin-bottom: 1rem;
  border: 1px solid #f5f5f5;
  background: #f5f5f5;
  > .ant-collapse-content {
    > .ant-collapse-content-box {
      background: #fff;
    }
  }
  border-radius: 10px !important;
  /*box-shadow: 0 2px 2px 1px rgb(0 0 0 / 15%) !important;*/
  & .ant-collapse-header {
    display: inline-block;
    width: 98%;
    padding: 12px 14px;
    padding-right: 40px;
  }
  & .ant-collapse-header .ant-collapse-arrow {
    right: 16px;
    left: auto;
    position: absolute;
    top: 50%;
    display: inline-block;
    transform: translateY(-50%);
    text-align: center;
    vertical-align: -0.125em;
  }
`
const LabelWrapper = styled.label`
  color: #565050;
  margin-left: ${props => (props.marginLeft ? props.marginLeft : "0")};
  margin-right: ${props => (props.marginRight ? props.marginRight : "0")};
`
const TitleSpan = styled.span`
  color: #00648d;
  font-weight: 400;
  font-size: 16px;
`

const getDisabledHours = () => {
  var hours = []
  for (var i = 0; i < moment().hour(); i++) {
    hours.push(i)
  }
  return hours
}

const getDisabledMinutes = selectedHour => {
  var minutes = []
  if (selectedHour === moment().hour()) {
    for (var i = 0; i < moment().minute(); i++) {
      minutes.push(i)
    }
  }
  return minutes
}

const { Option } = Select

const getScheduleName = obj => {
  if (obj) {
    let name =
      obj.numericValue == 0
        ? "IMMEDIATELY"
        : (obj.numericValue || "") + " " + (obj.temporalValue || "")
    if (obj.type === "REPEAT") {
      name = "Every " + name
    }
    return name
  } else {
    return ""
  }
}
const DragHandle = sortableHandle(({ item }) => {
  if (item.numericValue == 0 || item.type == "REPEAT") {
    return (
      <a disabled>
        <Icon
          type={"stop"}
          style={{ cursor: "not-allowed", color: "#999", fontSize: 20 }}
        />
      </a>
    )
  } else {
    return (
      <Icon
        type={"menu"}
        style={{ cursor: "grab", color: "#999", fontSize: 20 }}
        disabled={item.numericValue == 0}
      />
    )
  }
})

const LeadScheduleView = ({
  currentCampaign = {},
  fromCampagin = false,
  setCurrentCampaign,
  campaignBy,
  showHeaderSection = true,
}) => {
  const { user } = useContext(UserContext)
  const [campaignDetails, setCampaignDetails] = useState(currentCampaign || {})
  const [selectedCampaignId, setSelectedCampaign] = useState(
    currentCampaign?.id || null
  )
  const [openSchedulePopup, setOpenSchedulePopup] = useState(false)
  const [error, setError] = useState("")
  const [method, setMethod] = useState("Text")
  const [engagementSchedules, setSchedules] = useState([])
  const [campaignSchedule, setCampaignSchedule] = useState(
    currentCampaign?.scheduleType == "DATE" ? 2 : 1
  )
  const [scheduleDate, setScheduleDate] = useState(
    currentCampaign?.startDate || null
  )
  const [scheduleTime, setScheduleTime] = useState(
    currentCampaign?.startDate || null
  )
  const [scheduleEndDate, setScheduleEndDate] = useState(
    currentCampaign?.endDate || null
  )
  const [scheduleEndTime, setScheduleEndTime] = useState(
    currentCampaign?.endDate || null
  )

  const [campaigns, setCampaigns] = useState(null)

  const [panelActiveKey, setPanelActiveKey] = useState("")

  let newScheduleObj = {
    title: "",
    numericValue: 1,
    type: "ONCE",
    temporalValue: "MINUTES",
    campaignTemplates: [
      { id: 0, templateText: INITIAL_MESSAGE, scheduleId: "", sourceId: 0 },
    ],
    sortOrder: 0,
  }
  const [scheduleDetails, setScheduleDetails] = useState({})

  const { data: respCompany, refetch: refreshCompany } = useQuery(
    GET_MY_COMPANY
  )
  const company = respCompany?.me?.company || {}

  const { data: sourcesData } = useQuery(GET_LEAD_SOURCES)

  const { data: campaignRes } = useQuery(GET_ALL_CAMPAIGNS, {
    fetchPolicy: "network-only",
    onCompleted: resp => {
      if ((resp?.campaigns || []).length > 0) {
        setCampaigns(resp?.campaigns)
      }
    },
  })
  //const campaigns = campaignRes?.campaigns || []

  useEffect(() => {
    if (campaigns && !fromCampagin) {
      setSelectedCampaign(campaigns[0]?.id)
      refetchCampaign()
    }
  }, [campaigns])

  const { data: campaignResp, refetch: refetchCampaign } = useQuery(
    GET_CAMPAIGN_DETAILS,
    {
      fetchPolicy: "network-only",
      variables: {
        id: selectedCampaignId ? selectedCampaignId : currentCampaign?.id || 0,
      },
      onCompleted: result => {
        const sortList = orderBy(
          result?.campaign?.campaignSchedules || [],
          ["sortOrder"],
          ["asc"]
        )
        setCampaignDetails({ ...result?.campaign, campaignSchedules: sortList })
        if (setCurrentCampaign && result?.campaign) {
          setCurrentCampaign({
            ...currentCampaign,
            campaignSchedules: sortList,
            id: result?.campaign?.id,
          })
        }
      },
    }
  )

  let sources = sourcesData?.leadSources || []
  let campaignSelections = (campaignDetails.campaignSelections || []).filter(
    el => el.type == "SOURCE"
  )

  if (
    (campaignBy != "FILE" && campaignBy != "" && !isUndefined(campaignBy)) ||
    !isEmpty(campaignSelections)
  ) {
    let campaignSources = (campaignSelections || []).map(e => String(e.value))
    sources = (sourcesData?.leadSources || []).filter(el => {
      return (currentCampaign?.campaignSources || campaignSources).includes(
        String(el.id)
      )
    })
  }

  const [updateCampaign, { loading: updateLoading }] = useMutation(
    UPDATE_CAMPAIGN
  )
  const [
    createCampaignSchedule,
    { loading: createScheduleLoading },
  ] = useMutation(CREATE_CAMPAIGN_SCHEDULE)
  const [
    updateCampaignSchedule,
    { loading: updateScheduleLoading },
  ] = useMutation(UPDATE_CAMPAIGN_SCHEDULE)
  const [updateCompany] = useMutation(UPDATE_COMPANY)
  const [deleteCampaignSchedule] = useMutation(DELETE_CAMPAIGN_SCHEDULE)
  const [
    createCampaignTemplate,
    { loading: createTemplateLoading },
  ] = useMutation(CREATE_CAMPAIGN_TEMPLATE)
  const [updateCampaignTemplate] = useMutation(
    UPDATE_CAMPAIGN_SCHEDULE_TEMPLATE
  )
  const [updateScheduleSortOrders] = useMutation(
    UPDATE_CAMPAIGN_SCHEDULE_SORT_ORDERS
  )

  useMemo(() => {
    setTimeout(() => {
      if (isEmpty(currentCampaign)) {
        const findCampaign = (campaigns || []).find(el => el.name == "Default")
        if (findCampaign) {
          setSelectedCampaign(findCampaign?.id)
        }
      }
    }, 100)
  }, [campaigns])

  const onAutoEngageStatusChange = checked => {
    updateCompany({
      variables: {
        id: parseInt(company.id),
        name: company.name,
        address: company.address || "",
        city: company.city || "",
        state: company.state || "",
        postalCode: company.postal_code || "",
        phone: company.phone || "",
        country: company.country || "",
        automaticEngagement: checked,
      },
    }).then(() => {
      refreshCompany()
      message.success("Record successfully updated")
    })
  }
  const onCampaignScheduleChange = e => {
    setCampaignSchedule(e.target.value)
    if (e.target.value == 1) {
      setScheduleDate(null)
      setScheduleEndDate(null)
    }
    if (setCurrentCampaign) {
      setCurrentCampaign({
        ...currentCampaign,
        scheduleType: e.target.value === 1 ? "IMMEDIATE" : "DATE",
      })
    }
  }

  const setCampaignScheduleDate = () => {
    let todayDate = new Date()
    let _scheduleDate = null
    let _scheduleEndDate = null

    if (campaignSchedule === 1) {
      _scheduleDate = moment(todayDate).format("YYYY-MM-DD HH:mm:ss")
      _scheduleEndDate = moment(todayDate).format("YYYY-MM-DD HH:mm:ss")
    } else {
      if (scheduleDate) {
        _scheduleDate = moment(scheduleDate).format("YYYY-MM-DD")
      }
      if (scheduleTime) {
        _scheduleDate =
          moment(scheduleDate).format("YYYY-MM-DD") +
          " " +
          moment(scheduleTime).format("HH:mm:ss")
      }
      if (scheduleEndDate) {
        _scheduleEndDate = moment(scheduleEndDate).format("YYYY-MM-DD")
      }
      if (scheduleEndTime) {
        _scheduleEndDate =
          moment(scheduleEndDate).format("YYYY-MM-DD") +
          " " +
          moment(scheduleEndTime).format("HH:mm:ss")
      }
    }

    if (setCurrentCampaign) {
      setCurrentCampaign({
        ...currentCampaign,
        startDate: _scheduleDate,
        endDate: _scheduleEndDate,
      })
    }
  }

  useEffect(() => {
    if (scheduleDate) {
      setCampaignScheduleDate()
    }
  }, [scheduleDate])

  useEffect(() => {
    if (scheduleTime) {
      setCampaignScheduleDate()
    }
  }, [scheduleTime])

  useEffect(() => {
    if (scheduleEndDate) {
      setCampaignScheduleDate()
    }
  }, [scheduleEndDate])

  useEffect(() => {
    if (scheduleEndTime) {
      setCampaignScheduleDate()
    }
  }, [scheduleEndTime])

  const onChange = e => {
    if (setScheduleDate) {
      setScheduleDate(e)
      setScheduleEndDate(null)
      setScheduleEndTime(null)
    }
  }
  const onTimeChange = e => {
    const currentTime = moment().unix()
    const startTime = moment(scheduleDate)
      .set("hour", e.format("HH"))
      .set("minute", e.format("mm"))
      .unix()
    if (setScheduleTime && scheduleDate && currentTime < startTime) {
      setScheduleTime(e)
    } else {
      message.error("Invalid start date & time selected")
    }
  }
  const onEndDateChange = e => {
    if (!isUndefined(setScheduleEndDate) && scheduleDate) {
      setScheduleEndDate(e)
    } else {
      message.error("Invalid start date")
    }
  }
  const onEndTimeChange = e => {
    if (scheduleDate == null || scheduleTime == null) {
      message.error("Invalid start & time date")
      return
    }

    const startTime = moment(scheduleDate)
      .set("hour", scheduleTime.format("HH"))
      .set("minute", scheduleTime.format("mm"))
      .unix()
    const endTime = moment(scheduleEndDate)
      .set("hour", e.format("HH"))
      .set("minute", e.format("mm"))
      .unix()
    if (
      !isUndefined(setScheduleEndTime) &&
      scheduleEndDate &&
      startTime < endTime
    ) {
      setScheduleEndTime(e)
    } else {
      message.error("Invalid end date & time selected")
    }
  }

  const onCamapignChange = e => {
    setSchedules([])
    setCampaignDetails({})
    setSelectedCampaign(e)
    setOpenSchedulePopup(false)
  }

  const saveSchedule = () => {
    if (isEmpty(engagementSchedules)) {
      setError("Please select at least one engagement schedules")
    } else {
      setError("")
      updateCampaign({
        variables: {
          id: parseInt(campaignDetails.id || currentCampaign?.id),
          userId: user?.id || 0,
          name: campaignDetails.name,
          method: method,
          textMessage: "",
        },
      })
    }
  }

  const handleDeleteCampaignSchedule = (e, id) => {
    e.stopPropagation()
    if (id) {
      showConfirmationModal(MODAL_TITLE, MODAL_CONTENT, () =>
        deleteCampaignSchedule({
          variables: {
            id: parseInt(id),
          },
        }).then(resp => {
          refetchCampaign({
            id: parseInt(campaignDetails?.id || currentCampaign?.id),
          }).then(result => {
            let newObj = {
              ...campaignDetails,
              campaignSchedules:
                result?.data?.campaign?.campaignSchedules || [],
              id: result?.data?.campaign?.id,
            }
            setCampaignDetails(newObj)
          })
        })
      )
    }
  }

  const handleAddNewScheduleClick = () => {
    setOpenSchedulePopup(true)
    setScheduleDetails({ ...newScheduleObj })
    setPanelActiveKey("new")
  }

  const campaignSchedules = (campaignDetails?.campaignSchedules || []).map(
    el => {
      const name = getScheduleName(el)
      return {
        ...el,
        name,
      }
    }
  )

  const sortOrderCount = () => {
    const sortSchedules = orderBy(
      campaignDetails?.campaignSchedules || [],
      ["sortOrder"],
      ["desc"]
    )
    let sortOrder = 0
    if (
      sortSchedules.length > 0 &&
      scheduleDetails.temporalValue != "IMMEDIATELY"
    ) {
      sortOrder =
        sortSchedules[0]?.sortOrder != null
          ? (sortSchedules[0]?.sortOrder || 0) + 1
          : 1
    }
    return sortOrder
  }

  const validateSchedule = (item, id) => {
    let isValidate = true
    let findList = (campaignDetails?.campaignSchedules || []).filter(el => {
      return el.numericValue == item.numericValue && item.numericValue == 0
    })
    let findRepeats = (campaignDetails?.campaignSchedules || []).filter(el => {
      return el.type == item.type && item.type == "REPEAT"
    })
    if (id > 0) {
      findList = (campaignDetails?.campaignSchedules || []).filter(el => {
        return (
          el.numericValue == item.numericValue &&
          item.numericValue == 0 &&
          el.id != id
        )
      })
      findRepeats = (campaignDetails?.campaignSchedules || []).filter(el => {
        return el.type == item.type && item.type == "REPEAT" && el.id != id
      })
    }

    if (!isEmpty(findList)) {
      message.error("Immediate schedule already setup.")
      //setError("Immediate schedule already setup.")
      isValidate = false
    }
    if (!isEmpty(findRepeats)) {
      message.error("Repeat type schedule already setup.")
      //setError("Repeat type schedule already setup.")
      isValidate = false
    }
    return isValidate
  }

  const handleSave = (item, id) => {
    let sourceIds = []
    let templateTexts = []
    let afterHourMessages = []
    const templates = item?.sourceTemplates || []
    templates.forEach((el, i) => {
      let sourceId = el.id
      sourceIds.push(sourceId)
      templateTexts.push(el.templateText)
      if (i == 0) {
        afterHourMessages.push(item?.afterHourTemplateText)
      } else {
        afterHourMessages.push("")
      }
    })
    if (validateSchedule(item, id)) {
      if (id > 0) {
        let sortOrder =
          item.type == "REPEAT"
            ? 999
            : scheduleDetails?.sortOrder != null
            ? scheduleDetails?.sortOrder
            : sortOrderCount()
        updateCampaignSchedule({
          variables: {
            id: parseInt(scheduleDetails?.id),
            type: item?.type,
            numericValue:
              item.temporalValue == "IMMEDIATELY" ? 0 : item.numericValue,
            temporalValue:
              item.temporalValue == "IMMEDIATELY"
                ? "MINUTES"
                : item.temporalValue,
            title: item.title,
            sortOrder: item.temporalValue == "IMMEDIATELY" ? 0 : sortOrder,
          },
        }).then(res => {
          updateCampaignTemplate({
            variables: {
              campaignId: parseInt(campaignDetails?.id || currentCampaign?.id),
              scheduleId: parseInt(scheduleDetails?.id),
              sources: sourceIds,
              templateText: templateTexts,
              afterHourTemplateText: afterHourMessages,
              isAfterHour: item?.isAfterHour,
            },
          }).then(result => {
            refetchCampaign({
              id: campaignDetails.id || currentCampaign?.id,
            }).then(resp => {
              const list = orderBy(
                resp?.data?.campaign?.campaignSchedules || [],
                ["sortOrder"],
                ["asc"]
              )
              let newObj = {
                ...campaignDetails,
                campaignSchedules: list,
                id: resp?.data?.campaign?.id,
              }
              setCampaignDetails(newObj)
              if (setCurrentCampaign) {
                setCurrentCampaign({
                  ...currentCampaign,
                  campaignSchedules: list,
                  id: resp?.data?.campaign?.id,
                })
              }
            })
            setOpenSchedulePopup(false)
            setPanelActiveKey("")
            message.success("Schedule successfully updated")
          })
        })
      } else {
        let sortOrder = item.type == "REPEAT" ? 999 : sortOrderCount()
        createCampaignSchedule({
          variables: {
            campaignId: parseInt(campaignDetails?.id || currentCampaign?.id),
            type: item.type,
            numericValue:
              item.temporalValue == "IMMEDIATELY" ? 0 : item.numericValue,
            temporalValue:
              item.temporalValue == "IMMEDIATELY"
                ? "MINUTES"
                : item.temporalValue,
            title: item.title,
            sortOrder: item.temporalValue == "IMMEDIATELY" ? 0 : sortOrder,
          },
        }).then(rep => {
          createCampaignTemplate({
            variables: {
              campaignId: parseInt(campaignDetails?.id || currentCampaign?.id),
              scheduleId: parseInt(
                rep?.data?.createCampaignSchedule?.campaignSchedule?.id
              ),
              sources: sourceIds,
              templateText: templateTexts,
              afterHourTemplateText: afterHourMessages,
              isAfterHour: item?.isAfterHour,
            },
          }).then(result => {
            refetchCampaign({
              id: parseInt(campaignDetails?.id || currentCampaign?.id),
            }).then(resp => {
              const list = orderBy(
                resp?.data?.campaign?.campaignSchedules || [],
                ["sortOrder"],
                ["asc"]
              )
              let newObj = {
                ...campaignDetails,
                campaignSchedules: list,
                id: resp?.data?.campaign?.id,
              }
              setCampaignDetails(newObj)
              if (setCurrentCampaign) {
                setCurrentCampaign({
                  ...currentCampaign,
                  campaignSchedules: list,
                  id: resp?.data?.campaign?.id,
                })
              }
            })
            setOpenSchedulePopup(false)
            setPanelActiveKey("")
            message.success("Schedule successfully created")
          })
        })
      }
    }
  }

  const handleCollapgeOnChange = e => {
    if (typeof e == "object") {
      e.preventDefault()
    } else if (e == "new") {
      setScheduleDetails({ ...newScheduleObj })
      setPanelActiveKey(e)
    } else {
      const schedule = (campaignDetails?.campaignSchedules || []).find(
        el => el.id == e
      )
      if (schedule) {
        setScheduleDetails({ ...schedule })
      }
      setPanelActiveKey(e)
    }
  }

  const handleSortEnd = ({ oldIndex, newIndex }) => {
    let list = []
    setCampaignDetails(prevState => {
      let newState = { ...prevState }
      const firstSchedules = (newState?.campaignSchedules || []).filter(
        e => e.numericValue == 0
      )
      const onceSchedules = (newState?.campaignSchedules || []).filter(
        e => e.numericValue != 0 && e.type == "ONCE"
      )
      const repeatSchedules = (newState?.campaignSchedules || []).filter(
        e => e.numericValue != 0 && e.type == "REPEAT"
      )
      let _onceSchedules = arrayMoveImmutable(onceSchedules, oldIndex, newIndex)
      newState.campaignSchedules = [
        ...firstSchedules,
        ..._onceSchedules,
        ...repeatSchedules,
      ]
      list = _onceSchedules
      return newState
    })
    let _schedules = []
    let _sortOrders = []
    list.forEach((el, i) => {
      _schedules.push(el.id)
      _sortOrders.push(parseInt(i) + 1)
    })
    updateScheduleSortOrders({
      variables: {
        schedules: _schedules,
        sortOrder: _sortOrders,
      },
    }).then(resp => {
      console.log("resp :>> ", resp)
    })
  }

  const SortableItem = sortableElement(({ item, campaign, ...keys }) => {
    const index = item?.index
    const prevSchedule =
      item?.firstSchedule && index == 0
        ? item.firstSchedule[0]
        : index > 0
        ? item?.schedules[index - 1]
        : null

    return (
      <PanelWrap
        {...keys}
        header={
          <ScheduleHeaderPanel
            schedule={item}
            prevSchedule={prevSchedule}
            sources={sources}
            handleDeleteSchedule={handleDeleteCampaignSchedule}
            onHeaderClick={handleCollapgeOnChange}
          />
        }
        key={item.id}
      >
        <ScheduleForm
          key={`key__${item.id}`}
          sources={sources}
          scheduleDetails={scheduleDetails}
          defaultMessage={""}
          prevSchedule={prevSchedule}
          onUpdateSchedule={payload => handleSave(payload, item.id)}
          campaign={campaign}
        />
      </PanelWrap>
    )
  })
  const SortableList = sortableContainer(
    ({ campaignSchedules, registerHandle }) => {
      const firstSchedule = (campaignSchedules || []).filter(
        e => e.numericValue == 0
      )
      const onceSchedules = (campaignSchedules || []).filter(
        e => e.numericValue != 0 && e.type == "ONCE"
      )
      return (
        <Collapse
          bordered={false}
          expandIconPosition={"right"}
          accordion
          activeKey={panelActiveKey}
          expandIcon={({ isActive }) => (
            <Icon
              type={"caret-right"}
              rotate={isActive ? 90 : 0}
              style={{ fontSize: 24 }}
            />
          )}
          onChange={handleCollapgeOnChange}
          style={{
            background: "#fff",
          }}
        >
          {firstSchedule.map((el, i) => (
            <PanelWrap
              header={
                <ScheduleHeaderPanel
                  schedule={el}
                  prevSchedule={null}
                  sources={sources}
                  handleDeleteSchedule={handleDeleteCampaignSchedule}
                  onHeaderClick={handleCollapgeOnChange}
                />
              }
              key={el.id}
            >
              <ScheduleForm
                key={`key__${el.id}`}
                sources={sources}
                scheduleDetails={scheduleDetails}
                onUpdateSchedule={payload => handleSave(payload, el.id)}
                loading={
                  createTemplateLoading ||
                  createScheduleLoading ||
                  updateScheduleLoading
                }
                campaign={campaignDetails}
                prevSchedule={null}
              />
            </PanelWrap>
          ))}
          {onceSchedules.map((el, i) => (
            <SortableItem
              key={`${el.id}`}
              item={{
                ...el,
                index: i,
                firstSchedule,
                schedules: onceSchedules,
              }}
              index={i}
              onDrag={registerHandle}
              disabled={el.numericValue == 0}
              campaign={campaignDetails}
            />
          ))}
          {(campaignSchedules || [])
            .filter(e => e.type == "REPEAT")
            .map((el, i) => (
              <PanelWrap
                header={
                  <ScheduleHeaderPanel
                    schedule={el}
                    prevSchedule={last(onceSchedules)}
                    sources={sources}
                    handleDeleteSchedule={handleDeleteCampaignSchedule}
                    onHeaderClick={handleCollapgeOnChange}
                  />
                }
                key={el.id}
              >
                <ScheduleForm
                  key={`key__${el.id}`}
                  sources={sources}
                  scheduleDetails={scheduleDetails}
                  onUpdateSchedule={payload => handleSave(payload, el.id)}
                  loading={createTemplateLoading}
                  prevSchedule={last(onceSchedules)}
                  campaign={campaignDetails}
                />
              </PanelWrap>
            ))}
          {openSchedulePopup && (
            <PanelWrap
              header={
                <AddScheduleHeaderPanel
                  key={"add_schedule"}
                  removeNewSchedule={e => setOpenSchedulePopup(false)}
                  campaignSchedules={campaignSchedules}
                />
              }
              key={"new"}
              onClick={e => e.stopPropagation()}
            >
              <ScheduleForm
                key={`key__new`}
                sources={sources}
                scheduleDetails={scheduleDetails}
                defaultMessage={`${numToWord(
                  campaignSchedules.length + 1
                )} message`}
                onUpdateSchedule={payload => handleSave(payload, 0)}
                prevSchedule={last(campaignSchedules)}
                loading={createTemplateLoading}
              />
            </PanelWrap>
          )}
        </Collapse>
      )
    }
  )

  return (
    <>
      <PaddedCol noMargin={fromCampagin}>
        <Container auto noMargin border={fromCampagin ? "0" : "1"}>
          {!fromCampagin && (
            <ContainerNavigation>
              <SettingsSectionTitle>Engagement Schedule</SettingsSectionTitle>
              {error && <Alert message={error} type={"error"} />}
              <Button
                type={"primary"}
                onClick={() => saveSchedule()}
                loading={updateLoading}
              >
                Save changes
                <IconCustom type={"check"} />
              </Button>
            </ContainerNavigation>
          )}
          <Content>
            <ContentBody>
              {showHeaderSection && (
                <>
                  <ContainerBody>
                    {!fromCampagin && (
                      <Row gutter={[4, 16]}>
                        <Col
                          xs={{ span: 24 }}
                          sm={{ span: 24 }}
                          md={{ span: 24 }}
                          xl={{ span: 4 }}
                          lg={{ span: 4 }}
                        >
                          Automatic Engagement
                        </Col>
                        <Col
                          xs={{ span: 24 }}
                          sm={{ span: 24 }}
                          md={{ span: 24 }}
                          xl={{ span: 20 }}
                          lg={{ span: 20 }}
                        >
                          <Switch
                            checkedChildren={"ON"}
                            unCheckedChildren={"OFF"}
                            checked={company?.automaticEngagement || false}
                            onChange={onAutoEngageStatusChange}
                          />
                        </Col>
                      </Row>
                    )}

                    <Row gutter={[4, 16]}>
                      <Col
                        xs={{ span: 24 }}
                        sm={{ span: 24 }}
                        md={{ span: 24 }}
                        xl={{ span: 4 }}
                        lg={{ span: 4 }}
                      >
                        <SelectLabel>Campaign Name</SelectLabel>
                      </Col>
                      <Col
                        xs={{ span: 24 }}
                        sm={{ span: 24 }}
                        md={{ span: 24 }}
                        xl={{ span: 20 }}
                        lg={{ span: 20 }}
                      >
                        {fromCampagin ? (
                          <SelectLabel>
                            {currentCampaign?.name || "Demo Campaign"}
                          </SelectLabel>
                        ) : (
                          <Select
                            value={selectedCampaignId}
                            style={{ width: "100%" }}
                            onChange={onCamapignChange}
                          >
                            {campaigns &&
                              campaigns.map(el => (
                                <Option value={el.id}>{el.name}</Option>
                              ))}
                          </Select>
                        )}
                      </Col>
                    </Row>
                    {fromCampagin && (
                      <>
                        <Row gutter={[4, 16]}>
                          <Col
                            sm={{ span: 24 }}
                            md={{ span: 24 }}
                            xl={{ span: 4 }}
                            lg={{ span: 4 }}
                          >
                            <SelectLabel>Start Duration</SelectLabel>
                          </Col>
                          <Col
                            sm={{ span: 24 }}
                            md={{ span: 24 }}
                            xl={{ span: 20 }}
                            lg={{ span: 20 }}
                          >
                            <Radio.Group
                              onChange={onCampaignScheduleChange}
                              value={campaignSchedule}
                            >
                              <Radio value={1}>Immediate</Radio>
                              <Radio value={2}> Schedule </Radio>
                            </Radio.Group>
                          </Col>
                        </Row>
                        <Row gutter={[4, 16]}>
                          <Col
                            xs={{ span: 24 }}
                            sm={{ span: 24 }}
                            md={{ span: 24 }}
                            xl={{ span: 4 }}
                            lg={{ span: 4 }}
                          >
                            {" "}
                          </Col>
                          <Col xs={24} sm={24} md={24} xl={8} lg={5}>
                            Start Date:
                            <DatePicker
                              value={
                                typeof scheduleDate == "string"
                                  ? moment(scheduleDate)
                                  : scheduleDate
                              }
                              placeholder={"Start Date"}
                              onChange={onChange}
                              style={{
                                paddingRight: "2px",
                                width: "110px",
                              }}
                              disabled={campaignSchedule === 1}
                              disabledDate={current => {
                                return moment().add(-1, "days") >= current
                              }}
                            />
                            <TimePicker
                              format={"HH:mm"}
                              value={
                                typeof scheduleTime == "string"
                                  ? moment(scheduleTime)
                                  : scheduleTime
                              }
                              placeholder={"Start Time"}
                              onChange={onTimeChange}
                              style={{ paddingRight: "5px", width: "110px" }}
                              disabled={campaignSchedule === 1}
                              //disabledHours={() => getDisabledHours()}
                              //disabledMinutes={() => getDisabledMinutes()}
                            />
                          </Col>
                          <Col xs={24} sm={24} md={24} xl={8} lg={5}>
                            End Date:
                            <DatePicker
                              value={
                                typeof scheduleEndDate == "string"
                                  ? moment(scheduleEndDate)
                                  : scheduleEndDate
                              }
                              placeholder={"End Date"}
                              onChange={onEndDateChange}
                              style={{
                                paddingRight: "2px",
                                width: "110px",
                              }}
                              disabled={campaignSchedule === 1}
                              disabledDate={current => {
                                return (
                                  moment().add(-1, "days") >= current ||
                                  moment(scheduleDate) >= current
                                )
                              }}
                            />
                            <TimePicker
                              value={
                                typeof scheduleEndTime == "string"
                                  ? moment(scheduleEndTime)
                                  : scheduleEndTime
                              }
                              format={"HH:mm"}
                              placeholder={"End Time"}
                              onChange={onEndTimeChange}
                              style={{ width: "110px" }}
                              disabled={campaignSchedule === 1}
                              //disabledHours={() => getDisabledHours()}
                              //disabledMinutes={() => getDisabledMinutes()}
                            />
                          </Col>
                        </Row>
                      </>
                    )}

                    <Row gutter={[4, 24]}>
                      <Col
                        sm={{ span: 24 }}
                        md={{ span: 6 }}
                        xl={{ span: 4 }}
                        lg={{ span: 4 }}
                      >
                        <SelectLabel>Engagement Method</SelectLabel>
                      </Col>
                      <Col
                        sm={{ span: 24 }}
                        md={{ span: 18 }}
                        xl={{ span: 20 }}
                        lg={{ span: 20 }}
                      >
                        <Select
                          value={method}
                          style={{ width: 120 }}
                          onChange={e => setMethod(e)}
                        >
                          <Option value="Text">Text</Option>
                          <Option value="Email" disabled>
                            Email
                          </Option>
                        </Select>
                      </Col>
                    </Row>
                  </ContainerBody>
                </>
              )}
              <ContainerNavigation style={{ border: 0 }}>
                <Typography variant={"h4"} weight={"medium"}>
                  Messages
                </Typography>
                <FilterButtonGroup>
                  <Button
                    type={"primary"}
                    onClick={() => handleAddNewScheduleClick()}
                  >
                    Add Message
                  </Button>
                </FilterButtonGroup>
              </ContainerNavigation>
              {isEmpty(campaignDetails) ? (
                <Skeleton
                  loading={isEmpty(campaignDetails)}
                  active
                  paragraph={{ rows: 10 }}
                />
              ) : (
                <SortableList
                  useDragHandle
                  campaignSchedules={campaignSchedules}
                  onSortEnd={handleSortEnd}
                  showHeaderSection={false}
                  campaignDetails={campaignDetails || currentCampaign}
                />
              )}
            </ContentBody>
          </Content>
        </Container>
      </PaddedCol>
    </>
  )
}
export default LeadScheduleView

const ScheduleHeaderPanel = ({
  schedule,
  prevSchedule,
  sources,
  handleDeleteSchedule,
  onHeaderClick,
}) => {
  const msgIndex = (schedule?.campaignTemplates || []).findIndex(
    e => e.sourceId == null
  )

  const title =
    schedule?.title == null ? `${schedule?.name} message` : schedule?.title
  //console.log("prevSchedule :>> ", prevSchedule)
  const prevTitle =
    prevSchedule == null
      ? "the lead comes in."
      : prevSchedule?.title != null
      ? `${prevSchedule?.title}.`
      : ""

  const message = (schedule?.campaignTemplates || []).filter(
    el => el.templateText != ""
  )

  return (
    <ContainerNavigationWrap
      key={`key__panel__${schedule.id}`}
      //onClick={event => event.stopPropagation()}
    >
      <div style={{ width: "98%" }}>
        <Row onClick={() => onHeaderClick(schedule.id)}>
          <Col span={1}></Col>
          <Col
            span={23}
            style={{ textAlign: "left", paddingTop: 10, paddingLeft: 15 }}
          >
            <Typography variant={"h4"} weight={"medium"}>
              {title}{" "}
              <b>
                {schedule?.numericValue == 0
                  ? "immediately"
                  : schedule?.numericValue +
                    " " +
                    (schedule?.temporalValue || "").toLowerCase()}{" "}
              </b>{" "}
              {prevTitle && `after ${prevTitle}`}
            </Typography>
          </Col>
        </Row>
        <Row
          onClick={() => onHeaderClick(schedule.id)}
          style={{ paddingRight: 10 }}
        >
          <Col span={1}>
            <DragHandle item={schedule} />
          </Col>
          <Col span={19} style={{ textAlign: "left", paddingLeft: 15 }}>
            <PWrap>
              {(message || []).length > 0 ? (
                message[0].templateText
              ) : (
                <Alert
                  message={"Message template not setup yet for this schedule"}
                  type={"error"}
                />
              )}
            </PWrap>
          </Col>
          <Col span={4} style={{ textAlign: "right" }}>
            <Button
              key="Cancel"
              type={"danger"}
              icon={"delete"}
              onClick={e => handleDeleteSchedule(e, schedule.id)}
            />
          </Col>
        </Row>
        <Row>
          <Col span={1}></Col>
          <Col span={23} style={{ textAlign: "left", paddingLeft: 15 }}>
            {msgIndex > -1 && (
              <TagWrap key={`key__all`} marginLeft={"0"}>
                All Sources
              </TagWrap>
            )}
            {(sources || []).map((el, i) => {
              const sourceTemplateExist = (
                schedule?.campaignTemplates || []
              ).find(e => e.sourceId == el.id)
              if (sourceTemplateExist) {
                return (
                  <TagWrap
                    key={`key__${el.id}`}
                    marginLeft={i == 0 ? "0" : "5px"}
                  >
                    {el.name}
                  </TagWrap>
                )
              }
            })}
          </Col>
        </Row>
      </div>
    </ContainerNavigationWrap>
  )
}
const AddScheduleHeaderPanel = ({ removeNewSchedule, campaignSchedules }) => {
  const appendIndex = campaignSchedules.length + 1
  const prevSchedule = last(campaignSchedules)

  return (
    <ContainerNavigationWrap key={`key__panel__new`} style={{ width: "98%" }}>
      <div style={{ width: "80%", textAlign: "left" }}>
        <b>
          {numToWord(appendIndex)} message
          {(prevSchedule && ` after ` + prevSchedule?.title) || ""}
        </b>
      </div>
      <FilterButtonGroup style={{ paddingRight: 10 }}>
        <Button
          key="Cancel"
          type={"danger"}
          icon={"delete"}
          onClick={e => removeNewSchedule(e)}
        />
      </FilterButtonGroup>
    </ContainerNavigationWrap>
  )
}
