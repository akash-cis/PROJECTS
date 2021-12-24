import React, { useEffect, useState, useRef } from "react"
import styled from "styled-components"
import { useQuery, useMutation } from "@apollo/react-hooks"
import {
  Button,
  Row,
  Col,
  Switch,
  Collapse,
  Icon,
  Input,
  InputNumber,
  Checkbox,
  message,
  Select,
} from "antd"
import PanelHeader from "../../library/panelHeader"
import Typography from "../../library/typography"
import {
  InputButtonGroup,
  NoPaddingButton,
  FilterButtonGroup,
} from "../../library/basicComponents"
import { GET_CAMPAIGN_NUDGE_EVENT } from "../../graphql/query"
import { UPDATE_COMPANY_NUDGE_SETTINGS } from "../../graphql/mutation"

const SaveButton = styled(Button)`
  margin-left: 14px;
`
const StyledLabel = styled(Typography)`
  margin-right: 5px;
  font-weight: 550;
`

const FormContainer = styled.div`
  padding: 16px 0;
`

const PanelHeaderTitle = styled.div`
  display: flex;
  justify-content: space-between;
`

const LabelWrapper = styled.label`
  margin: 0 10px;
`
const scheduleData = ["MINUTES", "HOURS", "DAYS"]
const defaultMessage = {
  firstMessage: `You have a new message from {leadName}`,
  firstMessageReminder: `Reminder: You have a new message from {leadName}`,
  appointmentMessage: `You have an appointment with {leadName}`,
  appointmentReminder: `Reminder: You have an appointment with {leadName}`,
  leadStatusMessage: `Did your appointment with {leadName} on {eventDateTime} go well?`,
  leadStatusReminder: `Reminder: Did your appointment with {leadName} on {eventDateTime} go well?`,
}

const { Option } = Select

const getDefaultMessage = code => {
  let msg = { firstMsg: "", reminderMsg: "" }
  if (code == "REMINDER_SP_LEAD_MESSAGE") {
    msg.firstMsg = defaultMessage.firstMessage
    msg.reminderMsg = defaultMessage.firstMessageReminder
  } else if (code == "REMINDER_SP_UPDATE_PAST_APPOINTMENT_STATUS") {
    msg.firstMsg = defaultMessage.appointmentMessage
    msg.reminderMsg = defaultMessage.appointmentReminder
  } else if (code == "REMINDER_SP_UPDATE_LEAD_STATUS_TO_LOST") {
    msg.firstMsg = defaultMessage.leadStatusMessage
    msg.reminderMsg = defaultMessage.leadStatusReminder
  }
  return msg
}

const NudgeSettings = ({
  setCompany,
  newCoSetup,
  setActiveTab,
  company,
  showCloseBtn,
}) => {
  const { data: resp } = useQuery(GET_CAMPAIGN_NUDGE_EVENT, {
    variables: { companyId: company?.id || 0 },
    onCompleted: res => {
      let nudgeData = res?.getCompanyNudgeEvent || []
      if (nudgeData.length > 0) {
        let expandsIds = []
        setNudgeSettings(prevState => {
          let newState = [...prevState]
          for (let i = 0; i < nudgeData.length; i++) {
            if (!nudgeData[i].companyNudgeEvent) {
              const defaultText = getDefaultMessage(
                nudgeData[i].nudgeEvent["code"]
              )
              nudgeData[i]["companyNudgeEvent"] = {
                nudgeEventId: nudgeData[i].nudgeEvent["id"],
                startDelay: 0,
                startDelayType: "MINUTES",
                frequency: 60,
                frequencyType: "MINUTES",
                firstTemplateText: defaultText.firstMsg,
                reminderTemplateText: defaultText.reminderMsg,
                isSms: true,
                isWebPush: true,
                isActive: true,
              }
            }
            expandsIds.push(nudgeData[i].nudgeEvent.code)
          }
          newState = nudgeData
          return newState
        })
        setExpandPanels(expandsIds)
      }
    },
  })
  const [nudgeStatus, setNudgeStatus] = useState(false)
  const [nudgeSettings, setNudgeSettings] = useState([])
  const [expandPanels, setExpandPanels] = useState([])

  useEffect(() => {
    setNudgeStatus(
      (nudgeSettings || []).findIndex(el => !el.companyNudgeEvent?.isActive) ==
        -1
    )
  }, [nudgeSettings])

  const [updateNudgeSettings] = useMutation(UPDATE_COMPANY_NUDGE_SETTINGS)

  const handleUpdateNudgeSettingObj = (index, key, value) => {
    setNudgeSettings(prevState => {
      let newState = [...prevState]
      newState[index].companyNudgeEvent[key] = value
      return newState
    })
  }
  const handleNudgeStatus = e => {
    setNudgeStatus(e)
    setNudgeSettings(prevState => {
      let newState = [...prevState]
      for (let i = 0; i < newState.length; i++) {
        newState[i].companyNudgeEvent["isActive"] = e
      }
      return newState
    })
  }

  const handleSave = e => {
    if (e) {
      const companyNudgeEventInputs = nudgeSettings.map(el => {
        delete el.companyNudgeEvent.id
        delete el.companyNudgeEvent.__typename
        return {
          ...el.companyNudgeEvent,
        }
      })

      updateNudgeSettings({
        variables: {
          companyId: company.id,
          companyNudgeEventInputs,
        },
      }).then(res => {
        if (res?.data?.updateCompanyNudgeEvent?.statusCode == 200) {
          message.success(res?.data?.updateCompanyNudgeEvent?.message)
          const updatedData =
            res?.data?.updateCompanyNudgeEvent?.companyNudgeEvents || []
          if (updatedData.length > 0) {
            setNudgeSettings(prevState => {
              let newState = [...prevState]
              newState = updatedData
              return newState
            })
          }
          if (newCoSetup && setActiveTab) {
            setActiveTab("CRM Integration")
          }
        } else {
          message.error(res?.data?.updateCompanyNudgeEvent?.message)
        }
      })
    }
  }

  return (
    <React.Fragment>
      <PanelHeader title={"Manage Nudge Settings"}>
        <React.Fragment>
          {!newCoSetup && setCompany && (
            <Button onClick={() => setCompany(null)}>Close</Button>
          )}
          <SaveButton type={"primary"} onClick={e => handleSave(e)}>
            {newCoSetup ? "Save & Continue" : "Save"}
          </SaveButton>
        </React.Fragment>
      </PanelHeader>
      <FormContainer>
        <Row gutter={[4, 16]}>
          <Col xs={24} sm={24} md={24} xl={6} lg={6}>
            <StyledLabel variant={"small"} inline>
              Auto Nudge Bot:{" "}
            </StyledLabel>
            <Switch
              checkedChildren={"ON"}
              unCheckedChildren={"OFF"}
              checked={nudgeStatus}
              onChange={e => handleNudgeStatus(e)}
            />
          </Col>
        </Row>
        <Row>
          <Col md={24}>
            <Collapse
              expandIconPosition={"right"}
              activeKey={expandPanels}
              expandIcon={({ isActive }) => (
                <Icon type="caret-right" rotate={isActive ? 90 : 0} />
              )}
              onChange={e => setExpandPanels(e)}
            >
              {nudgeSettings.map((el, i) => (
                <Collapse.Panel
                  header={
                    <HeaderPanel
                      code={el?.nudgeEvent?.code}
                      title={el?.nudgeEvent?.title || ""}
                      nudgeSetting={el?.companyNudgeEvent || {}}
                      updateNudgeSettingObj={(key, value) =>
                        handleUpdateNudgeSettingObj(i, key, value)
                      }
                    />
                  }
                  key={el.nudgeEvent.code}
                >
                  <NudgeSettingForm
                    code={el?.nudgeEvent?.code}
                    nudgeSetting={el?.companyNudgeEvent || {}}
                    updateNudgeSettingObj={(key, value) =>
                      handleUpdateNudgeSettingObj(i, key, value)
                    }
                  />
                </Collapse.Panel>
              ))}
            </Collapse>
          </Col>
        </Row>
      </FormContainer>
    </React.Fragment>
  )
}
export default NudgeSettings

const HeaderPanel = ({ code, title, nudgeSetting, updateNudgeSettingObj }) => {
  return (
    <PanelHeaderTitle key={code} onClick={e => e.stopPropagation()}>
      <StyledLabel variant={"h4"} inline>
        {title}{" "}
      </StyledLabel>
      <Switch
        checkedChildren={"ON"}
        unCheckedChildren={"OFF"}
        checked={nudgeSetting?.isActive || false}
        checkedChildren={"Active"}
        unCheckedChildren={"Inactive"}
        onChange={e => {
          updateNudgeSettingObj("isActive", e)
        }}
      />
    </PanelHeaderTitle>
  )
}

const NudgeSettingForm = ({ code, nudgeSetting, updateNudgeSettingObj }) => {
  const firstMsgRef = useRef(null)
  const reminderMsgRef = useRef(null)
  const handleAddKeyword = (e, keyword, field) => {
    if (field == "firstTemplateText") {
      updateNudgeSettingObj(
        field,
        nudgeSetting?.firstTemplateText + " " + keyword
      )
      if (firstMsgRef.current) {
        firstMsgRef.current.focus()
      }
    } else {
      updateNudgeSettingObj(
        field,
        nudgeSetting?.reminderTemplateText + " " + keyword
      )
      if (reminderMsgRef.current) {
        reminderMsgRef.current.focus()
      }
    }
  }
  return (
    <div key={code}>
      <Row gutter={[4, 12]}>
        <Col span={24}>
          <InputButtonGroup fluid>
            <LabelWrapper style={{ marginLeft: 0 }}>
              First text message with delay of{" "}
            </LabelWrapper>
            <InputNumber
              size="small"
              min={0}
              max={7200}
              value={nudgeSetting?.startDelay || 0}
              onChange={e => {
                updateNudgeSettingObj("startDelay", e)
              }}
              style={{ width: 80 }}
            />
            <Select
              size="small"
              value={nudgeSetting?.startDelayType || "MINUTES"}
              style={{ width: 100, marginLeft: 5 }}
              onChange={e => {
                updateNudgeSettingObj("startDelayType", e)
              }}
            >
              {scheduleData.map(el => {
                return <Option value={el}>{el}</Option>
              })}
            </Select>
          </InputButtonGroup>
        </Col>
      </Row>
      <Row gutter={[4, 12]}>
        <Col span={24} style={{ textAlign: "left" }}>
          <FilterButtonGroup>
            <NoPaddingButton
              type="link"
              onClick={e =>
                handleAddKeyword(e, "{leadName}", "firstTemplateText")
              }
            >
              {"{leadName}"}
            </NoPaddingButton>
            <NoPaddingButton
              type="link"
              onClick={e =>
                handleAddKeyword(e, "{vehicleOfInterest}", "firstTemplateText")
              }
            >
              {"{vehicleOfInterest}"}
            </NoPaddingButton>
          </FilterButtonGroup>
          <Input.TextArea
            rows={2}
            value={nudgeSetting?.firstTemplateText}
            onChange={e => {
              updateNudgeSettingObj("firstTemplateText", e.target.value)
            }}
            ref={firstMsgRef}
          />
        </Col>
      </Row>
      <Row gutter={[4, 12]}>
        <Col span={24}>
          <InputButtonGroup fluid>
            <LabelWrapper style={{ marginLeft: 0 }}>
              Reminder text message with every{" "}
            </LabelWrapper>
            <InputNumber
              size="small"
              min={0}
              max={7200}
              value={nudgeSetting?.frequency || 0}
              onChange={e => {
                updateNudgeSettingObj("frequency", e)
              }}
              style={{ width: 80 }}
            />
            <Select
              size="small"
              value={nudgeSetting?.frequencyType || "MINUTES"}
              style={{ width: 100, marginLeft: 5 }}
              onChange={e => {
                updateNudgeSettingObj("frequencyType", e)
              }}
            >
              {scheduleData.map(el => {
                return <Option value={el}>{el}</Option>
              })}
            </Select>
          </InputButtonGroup>
        </Col>
      </Row>
      <Row gutter={[4, 12]}>
        <Col span={24} style={{ textAlign: "left" }}>
          <FilterButtonGroup>
            <NoPaddingButton
              type="link"
              onClick={e =>
                handleAddKeyword(e, "{leadName}", "reminderTemplateText")
              }
            >
              {"{leadName}"}
            </NoPaddingButton>

            <NoPaddingButton
              type="link"
              onClick={e =>
                handleAddKeyword(
                  e,
                  "{vehicleOfInterest}",
                  "reminderTemplateText"
                )
              }
            >
              {"{vehicleOfInterest}"}
            </NoPaddingButton>
            {code != "REMINDER_SP_LEAD_MESSAGE" && (
              <NoPaddingButton
                type="link"
                onClick={e =>
                  handleAddKeyword(e, "{eventDateTime}", "reminderTemplateText")
                }
              >
                {"{eventDateTime}"}
              </NoPaddingButton>
            )}
          </FilterButtonGroup>
          <Input.TextArea
            rows={2}
            value={nudgeSetting?.reminderTemplateText}
            onChange={e => {
              updateNudgeSettingObj("reminderTemplateText", e.target.value)
            }}
            ref={reminderMsgRef}
          />
        </Col>
      </Row>
      <Row gutter={[4, 12]}>
        <Col xs={12} sm={8} md={6} xl={2} lg={2}>
          <Checkbox
            checked={nudgeSetting?.isSms || false}
            onChange={e => {
              updateNudgeSettingObj("isSms", e.target.checked)
            }}
          >
            SMS
          </Checkbox>
        </Col>
        <Col xs={12} sm={8} md={6} xl={4} lg={4}>
          <Checkbox
            checked={nudgeSetting?.isWebPush || false}
            onChange={e => {
              updateNudgeSettingObj("isWebPush", e.target.checked)
            }}
          >
            Push Notification
          </Checkbox>
        </Col>
      </Row>
    </div>
  )
}
