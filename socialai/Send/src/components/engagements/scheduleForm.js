import React, { useEffect, useState, useRef } from "react"
import {
  Tabs,
  Row,
  Col,
  Button,
  Input,
  Radio,
  Select,
  InputNumber,
  Alert,
  Checkbox,
} from "antd"
import styled from "styled-components"
import {
  NoPaddingButton,
  FilterButtonGroup,
  InputButtonGroup,
} from "../../library/basicComponents"
import isEmpty from "lodash/isEmpty"
import TemplateDrawer from "./templateDrawer"
import moment from "moment"
const { Option } = Select
const CardSection = styled.div`
  background: #f5f5f5;
  overflow: hidden;
  padding: 24px;
`
const CardContainer = styled.div`
  & .ant-tabs-tab {
    border-radius: 8px 0 0 8px;
  }
  & .ant-tabs .ant-tabs-left-bar {
    width: 150px;
  }
  & .ant-tabs .ant-tabs-left-content {
    padding-left: 0;
  }
  & .ant-tabs-card > .ant-tabs-content {
    margin-top: -16px;
  }
  & .ant-tabs-card > .ant-tabs-content > .ant-tabs-tabpane {
    background: #fff;
    padding: 16px;
  }
  & .ant-tabs-card > .ant-tabs-bar {
    border-color: #fff;
  }
  & .ant-tabs-card > .ant-tabs-bar .ant-tabs-tab {
    border-color: transparent;
    background: transparent;
  }

  & .ant-tabs-card > .ant-tabs-bar .ant-tabs-tab-active {
    border-color: #fff;
    background: #fff;
    /*border-right: 0 !important;*/
  }
`
const LabelWrapper = styled.label`
  margin: 0 10px;
`
const scheduleData = [
  {
    id: 0,
    name: "IMMEDIATELY",
  },
  {
    id: 1,
    name: "MINUTES",
  },
  {
    id: 2,
    name: "HOURS",
  },
  {
    id: 3,
    name: "DAYS",
  },
  {
    id: 4,
    name: "WEEKS",
  },
]
const { TabPane } = Tabs

const MessageBox = ({ key, templateText, onTemplateClick, setBody }) => {
  const htmlElRef = useRef(null)
  const handleAddKeyword = (e, keyword) => {
    setBody(templateText + " " + keyword)
    if (htmlElRef.current) {
      htmlElRef.current.focus()
    }
  }

  return (
    <React.Fragment key={key}>
      <Row>
        <Col span={24} style={{ textAlign: "left" }}>
          Click on placeholder to append into Text Message
        </Col>
      </Row>
      <Row gutter={[4, 24]}>
        <Col span={24} style={{ textAlign: "left" }}>
          <FilterButtonGroup>
            <NoPaddingButton
              type="link"
              onClick={e => handleAddKeyword(e, "{fistName}")}
            >
              {"{firstName}"}
            </NoPaddingButton>
            <NoPaddingButton
              type="link"
              onClick={e => handleAddKeyword(e, "{lastName}")}
            >
              {"{lastName}"}
            </NoPaddingButton>
            <NoPaddingButton
              type="link"
              onClick={e => handleAddKeyword(e, "{sourceName}")}
            >
              {"{sourceName}"}
            </NoPaddingButton>
            <NoPaddingButton
              type="link"
              onClick={e => handleAddKeyword(e, "{dealerName}")}
            >
              {"{dealerName}"}
            </NoPaddingButton>
            <NoPaddingButton
              type="link"
              onClick={e => handleAddKeyword(e, "{vehicleOfInterest}")}
            >
              {"{vehicleOfInterest}"}
            </NoPaddingButton>
            <Button
              type={"primary"}
              style={{ marginLeft: "20px" }}
              onClick={e => {
                e.preventDefault()
                onTemplateClick(true)
              }}
            >
              Select Template
            </Button>
          </FilterButtonGroup>
        </Col>
      </Row>
      <Row>
        <Col span={24} style={{ textAlign: "left" }}>
          Text Message
        </Col>
      </Row>
      <Row>
        <Col span={24} style={{ textAlign: "left" }}>
          <Input.TextArea
            autoFocus
            ref={htmlElRef}
            rows={5}
            value={templateText}
            onChange={e => {
              setBody(e.target.value)
            }}
            name={"body"}
          />
        </Col>
      </Row>
    </React.Fragment>
  )
}

const ScheduleForm = ({
  sources = [],
  scheduleDetails,
  defaultMessage,
  prevSchedule,
  onUpdateSchedule,
  loading = false,
  campaign,
}) => {
  const msgRef = useRef(null)
  const [error, setError] = useState("")
  const [openTemplateDrawer, setOpenTemplateDrawer] = useState(false)
  const [title, setTitle] = useState(defaultMessage)
  const [type, setType] = useState("ONCE")
  const [temporalValue, setTemporalValue] = useState("MINUTES")
  const [numericValue, setNumericValue] = useState(5)
  const [sourceTemplates, setSourceTemplates] = useState([])
  const [activeTab, setActiveTab] = useState("0")
  const [overnightMessage, setOvernightMessage] = useState("")
  const [checkOvernightMsg, setCheckOvernightMsg] = useState(false)

  useEffect(() => {
    if (scheduleDetails) {
      setTitle(scheduleDetails?.title || defaultMessage)
      setType(scheduleDetails?.type)
      const temporalValue =
        scheduleDetails?.numericValue == 0
          ? "IMMEDIATELY"
          : scheduleDetails?.temporalValue
      setTemporalValue(temporalValue)
      setNumericValue(scheduleDetails?.numericValue)
      if (scheduleDetails?.campaignTemplates) {
        setSourceTemplates(prevState => {
          let newState = [...prevState]
          scheduleDetails?.campaignTemplates.forEach(el => {
            let sourceId = el.sourceId == null ? 0 : el.sourceId
            newState.push({ id: sourceId, templateText: el.templateText })
          })
          return newState
        })
        let immediateTemplates = scheduleDetails?.campaignTemplates || []

        if (immediateTemplates.length > 0) {
          setOvernightMessage(immediateTemplates[0].afterHourTemplateText || "")
          setCheckOvernightMsg(immediateTemplates[0].isAfterHour || false)
        }
      } else {
        setSourceTemplates([])
      }
    }
  }, [scheduleDetails])

  const handleSubmit = e => {
    if (e) {
      if (isEmpty(title)) {
        message.error("Please enter the schedule title.")
        return
      } else if (isEmpty(sourceTemplates)) {
        message.error("Please enter message for source")
        return
      } else if (isEmpty(String(numericValue)) || numericValue == null) {
        message.error("Please enter schedule value.")
        return
      }
      onUpdateSchedule({
        title,
        type,
        temporalValue,
        numericValue,
        afterHourTemplateText: overnightMessage,
        isAfterHour: checkOvernightMsg,
        sourceTemplates: sourceTemplates,
      })
    }
  }

  const handleTempalte = (msg, id) => {
    setSourceTemplates(prevState => {
      let newState = [...prevState]
      const index = newState.findIndex(el => el.id == id)
      if (index <= -1) {
        newState.push({ id, templateText: msg, isCopy: false })
      } else {
        newState[index].templateText = msg
        newState[index].isCopy = false
      }
      if (id == 0) {
        sourcesList.forEach(s => {
          const index = newState.findIndex(el => el.id == s.id)
          if (index <= -1) {
            newState.push({
              id: parseInt(s.id),
              templateText: msg,
              isCopy: true,
            })
          } else if (newState[index]?.isCopy) {
            newState[index].templateText = msg
          }
        })
      }
      return newState
    })
  }

  const handleSetDefinedTemplate = textMessage => {
    handleTempalte(textMessage, activeTab)
  }

  const handlePlaceholder = (e, msg) => {
    setOvernightMessage(overnightMessage + " " + msg)
    if (msgRef.current) {
      msgRef.current.focus()
    }
  }

  const options = scheduleData.map(el => {
    return <Option value={el.name}>{el.name}</Option>
  })
  let sourcesList = [...sources]
  sourcesList.unshift({ id: "0", name: "All" })
  const prevTitle =
    prevSchedule == null
      ? "the lead comes in."
      : prevSchedule?.title != null
      ? `${prevSchedule?.title}.`
      : ""
  return (
    <>
      <Row>
        <Col span={24} style={{ textAlign: "center" }}>
          {error && <Alert message={error} type={"error"} />}
        </Col>
      </Row>
      <Row gutter={[4, 16]}>
        <Col span={24}>
          <InputButtonGroup fluid>
            <LabelWrapper>Send </LabelWrapper>
            {temporalValue != "IMMEDIATELY" && (
              <InputNumber
                min={0}
                max={60}
                value={numericValue}
                onChange={e => {
                  setNumericValue(e)
                }}
                name={"numericValue"}
                style={{ width: 80 }}
              />
            )}
            <Select
              value={temporalValue}
              style={{ width: 150 }}
              onChange={e => {
                if (e == "IMMEDIATELY") {
                  setNumericValue(0)
                }
                setTemporalValue(e)
              }}
            >
              {options}
            </Select>
            <LabelWrapper>{prevTitle && `after ${prevTitle}`}</LabelWrapper>
          </InputButtonGroup>
        </Col>
      </Row>
      <Row gutter={[4, 16]}>
        <Col span={24} style={{ textAlign: "left" }}>
          <LabelWrapper>Title</LabelWrapper>
          <Input
            defaultValue={title}
            value={title}
            onChange={e => {
              setTitle(e.target.value)
            }}
            name={"title"}
            style={{ width: 400, marginLeft: 7 }}
          />
        </Col>
      </Row>
      {temporalValue != "IMMEDIATELY" && (
        <Row gutter={[4, 16]}>
          <Col span={24} style={{ textAlign: "left", paddingLeft: 18 }}>
            <Radio.Group
              value={type}
              buttonStyle="solid"
              style={{ width: "100%" }}
              onChange={e => setType(e.target.value)}
            >
              <Radio.Button
                value="ONCE"
                style={{ width: "220px", textAlign: "center" }}
              >
                Once
              </Radio.Button>
              <Radio.Button
                value="REPEAT"
                style={{ width: "220px", textAlign: "center" }}
              >
                Repeat
              </Radio.Button>
            </Radio.Group>
          </Col>
        </Row>
      )}
      <Row gutter={[4, 16]}>
        <Col span={24}>
          <CardSection>
            <CardContainer>
              <Tabs
                type="card"
                activeKey={activeTab}
                onChange={setActiveTab}
                style={{ textAlign: "left" }}
              >
                {sourcesList.map((el, i) => {
                  const sourceTemplate = (sourceTemplates || []).find(
                    t => t.id == el.id
                  )
                  return (
                    <TabPane tab={el.name} key={el.id}>
                      <MessageBox
                        key={`key_message_box_${i}`}
                        templateText={sourceTemplate?.templateText || ""}
                        onTemplateClick={e => setOpenTemplateDrawer(e)}
                        setBody={msg => handleTempalte(msg, el.id)}
                      />
                    </TabPane>
                  )
                })}
              </Tabs>
            </CardContainer>
          </CardSection>
        </Col>
      </Row>
      {prevSchedule == null && (
        <Row gutter={[6, 24]}>
          <Col span={24} style={{ textAlign: "left", paddingLeft: 18 }}>
            <Checkbox
              key={"chk"}
              checked={checkOvernightMsg}
              onChange={e => setCheckOvernightMsg(e.target.checked)}
            >
              After work hours message
            </Checkbox>
          </Col>
        </Row>
      )}

      {checkOvernightMsg && prevSchedule == null && (
        <Row gutter={[6, 24]}>
          <Col span={24} style={{ textAlign: "left", paddingLeft: 18 }}>
            <FilterButtonGroup>
              <NoPaddingButton
                type="link"
                onClick={e => handlePlaceholder(e, "{fistName}")}
              >
                {"{firstName}"}
              </NoPaddingButton>
              <NoPaddingButton
                type="link"
                onClick={e => handlePlaceholder(e, "{lastName}")}
              >
                {"{lastName}"}
              </NoPaddingButton>
              <NoPaddingButton
                type="link"
                onClick={e => handlePlaceholder(e, "{sourceName}")}
              >
                {"{sourceName}"}
              </NoPaddingButton>
              <NoPaddingButton
                type="link"
                onClick={e => handlePlaceholder(e, "{dealerName}")}
              >
                {"{dealerName}"}
              </NoPaddingButton>
              <NoPaddingButton
                type="link"
                onClick={e => handlePlaceholder(e, "{vehicleOfInterest}")}
              >
                {"{vehicleOfInterest}"}
              </NoPaddingButton>
            </FilterButtonGroup>
            <Input.TextArea
              ref={msgRef}
              rows={5}
              value={overnightMessage}
              onChange={e => {
                setOvernightMessage(e.target.value)
              }}
              name={"overnight_message"}
            />
          </Col>
        </Row>
      )}
      <Row gutter={[6, 24]}>
        <Col span={24} style={{ textAlign: "right" }}>
          <Button
            key="save"
            type={"primary"}
            style={{ marginRight: "5px" }}
            onClick={e => handleSubmit(e)}
            loading={loading}
            disabled={
              campaign &&
              moment(campaign?.startDate)
                .utc()
                .isBefore(moment().utc()) &&
              campaign?.activeInd == "ACTIVE"
            }
          >
            Save
          </Button>
        </Col>
      </Row>
      {openTemplateDrawer && (
        <TemplateDrawer
          openTemplateDrawer={openTemplateDrawer}
          setOpenTemplateDrawer={setOpenTemplateDrawer}
          onApply={handleSetDefinedTemplate}
        />
      )}
    </>
  )
}
export default ScheduleForm
