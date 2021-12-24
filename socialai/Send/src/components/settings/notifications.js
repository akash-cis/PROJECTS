import React, { useEffect, useState } from "react"
import {
  ContainerNavigation,
  Content,
  ContentBody,
  SettingsSectionTitle,
} from "../../library/basicComponents"
import { useQuery, useMutation } from "@apollo/react-hooks"
import gql from "graphql-tag"
import styled from "styled-components"
import { Select, Switch, Button, Alert, Checkbox, Input, Icon, message } from "antd"
import { timeMappings, timezones, intervals } from "../../library/constants"
import { GET_USER_FILTERS } from "../../graphql/query"

const GET_NOTIFICATION_CONFIG = gql`
  query GetNotificationConfig {
    me {
      id
      notificationConfig {
        id
        notificationsAllowed
        dndStart
        dndEnd
        timezone
        email
        app
        sms
        responses
        interval
        details {
          id
          setType
          filterSetId
          count
        }
      }
    }
  }
`


const SAVE_NOTIFICATION_CONFIG = gql`
  mutation SaveNotificationConfig(
    $notificationsAllowed: Boolean!
    $id: Int
    $dndStart: Time
    $dndEnd: Time
    $timezone: String
    $app: Boolean
    $sms: Boolean
    $responses: Boolean
    $email: Boolean
    $interval: String
    $details: [NotificationConfigDetailInputs]
  ) {
    saveNotificationConfig(
      notificationsAllowed: $notificationsAllowed
      id: $id
      dndStart: $dndStart
      dndEnd: $dndEnd
      timezone: $timezone
      app: $app
      sms: $sms
      responses: $responses
      email: $email
      interval: $interval
      details: $details
    ) {
      ok
    }
  }
`

const Label = styled.label`
  display: block;
  margin: 12px 0 4px 0;
`

const DndContainer = styled.div`
  width: 280px;
  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
  & > p {
    margin: 4px auto;
  }
`

const FormContainer = styled.div`
  padding: 38px;
`

const FlexRow = styled.div`
  display: flex;
  flex-direction: column;
  margin: 10px;
  justify-content: flex-end;
`

const defaultConfig = {
  notificationsAllowed: true,
  dndStart: null,
  dndEnd: null,
  timezone: null,
  email: false,
  app: false,
  sms: false,
  responses: true,
  interval: null,
  details: []
}

const defaultDetail = {
  index: null,
  setType: null, 
  filterSetId: null, 
  count: null
}

const Notifications = () => {
  const [notificationConfig, setNotificationConfig] = useState(defaultConfig)
  const [currentDetail, setCurrentDetail] = useState(defaultDetail)
  const [error, setError] = useState('')

  const { data: notificationData, refetch: refreshConfig } = useQuery(GET_NOTIFICATION_CONFIG)

  const [saveNotificationConfig, {loading: configSaving}] = useMutation(SAVE_NOTIFICATION_CONFIG)

  const userFilters = useQuery(GET_USER_FILTERS)
  const [presetFilters, setPresetFilters] = useState([])

  // Server persisted current filters
  useEffect(() => {
    // Check if they are some filters on the server
    setPresetFilters(userFilters.data?.me?.filterSets)
  }, [userFilters.data])

  useEffect(() => {
    if (
      notificationData &&
      notificationData.me.notificationConfig &&
      notificationData.me.notificationConfig.id
    ) {
      if (notificationData.me.notificationConfig.details) {
        notificationData.me.notificationConfig.details = 
          notificationData.me.notificationConfig.details.map((d, index) => {
          d.index = index + 1
          return d
        })
      }
      setNotificationConfig(notificationData.me.notificationConfig)
    }
  }, [notificationData])

  
  const handleChange = (field, value) => {
    let config = { ...notificationConfig }
    config[field] = value
    setNotificationConfig(config)
  }

  const handleSwitchChange = checked => {
    let config = { ...notificationConfig }
    config.notificationsAllowed = checked
    setNotificationConfig(config)
  }

  const addDetail = () => {
    let config = { ...notificationConfig }
    let detail = { ...defaultDetail }
    detail.index = config.details.length + 1;
    config.details.push(detail)
    setNotificationConfig(config)
    setCurrentDetail(detail)
  }

  const changeDetail = (detail, remove) => {
    let config = { ...notificationConfig }
    if (remove) {
      let details = config.details.filter(d => d.index !== detail.index)
      details = details.map((d, index) => {
        d.index = index + 1
        return d
      })
      config.details = details
      setNotificationConfig(config)
      setCurrentDetail(config.details[config.details.length - 1])
    } else {
      setCurrentDetail(config.details[detail.index - 1])
    }
  }

  const handleChangeDetail = (field, value) => {
    let detail = { ...currentDetail }
    detail[field] = value
    setCurrentDetail(detail)
    let config = { ...notificationConfig }
    config.details = config.details.map(d => {
      if (d.index === detail.index)
        d[field] = value
      return d
    })
  }

  const submitNotificationConfig = () => {
    if (validateInputs(notificationConfig, setError)) {
      setCurrentDetail(defaultDetail)
      notificationConfig.details.forEach(function(d){ delete d.index; delete d.__typename; });
      saveNotificationConfig({
        variables: notificationConfig,
      }).then(d => { 
        message.success("Notifications config successfully saved")
        refreshConfig()
      });
    }
  }

  return (
    <React.Fragment>
      <ContainerNavigation>
        <SettingsSectionTitle>Notifications</SettingsSectionTitle>
        <Button type={"primary"} onClick={submitNotificationConfig} loading={configSaving}>
          Update notification settings
        </Button>
      </ContainerNavigation>
      <Content style={{ overflow: 'auto'}}>
        <ContentBody>
          {error && <Alert message={error} type={"error"} />}
          <Label>Notifications Allowed</Label>
          <Switch
            checked={notificationConfig.notificationsAllowed}
            onChange={handleSwitchChange}
          />
          <Label>Notification Method</Label>
          <br/>
          <Checkbox
            checked={notificationConfig.email}
            onChange={() => handleChange('email', !notificationConfig.email)}
            disabled={!notificationConfig.notificationsAllowed}
          >
            Send me e-mail notifications
          </Checkbox><br/>
          <Checkbox
            checked={notificationConfig.app}
            onChange={() => handleChange('app', !notificationConfig.app)}
            disabled={!notificationConfig.notificationsAllowed}
          >
            Send me web app notifications
          </Checkbox><br/>
          <Checkbox
            checked={notificationConfig.responses}
            onChange={() => handleChange('responses', !notificationConfig.responses)}
            disabled={!notificationConfig.notificationsAllowed}
          >
            Send me responses
          </Checkbox><br/>
          {/* <Checkbox
            checked={notificationConfig.sms}
            onChange={() => handleChange('sms', !notificationConfig.sms)}
            disabled={!notificationConfig.notificationsAllowed}
          >
            Send me sms notifications
          </Checkbox> */}
          <br/>
          <Label>Notification Types</Label>
          {
            notificationConfig.details && notificationConfig.details.map((detail, index) => 
              <div key={index} style={{display: 'flex'}}>
                <FlexRow>
                  <Label>Type</Label>
                  <Select
                    onChange={val => handleChangeDetail("setType", val)}
                    key={"type"}
                    placeholder={"Select the type"}
                    style={{ width: "280px" }}
                    value={detail.setType || undefined}
                    disabled={detail.index !== currentDetail.index}
                  >
                    {[
                      { name: 'Life events', value: 'LIFE_EVENTS'}, 
                      {name: 'Prospects', value: 'PROSPECTS'}].map(type => (
                      <Select.Option key={type.value} value={type.value}>
                        {type.name}
                      </Select.Option>
                    ))}
                  </Select>
                </FlexRow>
                <FlexRow>
                  <Label>Preset</Label>
                  <Select
                    onChange={val => handleChangeDetail("filterSetId", val)}
                    key={"preset"}
                    placeholder={"Select the preset"}
                    style={{ width: "280px" }}
                    value={detail.filterSetId ? `${detail.filterSetId}` : undefined}
                    label="test"
                    disabled={detail.index !== currentDetail.index}
                  >
                    {presetFilters && presetFilters.filter(p => p.setType === detail.setType || p.setType === 'GENERAL').map(preset => (
                      <Select.Option key={preset.id} value={preset.id}>
                        {preset.name}
                      </Select.Option>
                    ))}
                  </Select>
                </FlexRow>
                <FlexRow>
                  <Label>Count</Label>
                  <Input
                    placeholder="Enter a value"
                    value={detail.count}
                    onChange={e => handleChangeDetail("count", e.target.value)}
                    disabled={detail.index !== currentDetail.index}
                  />
                </FlexRow>
                <FlexRow>
                  <Button 
                    type={"primary"} 
                    shape="circle" 
                    onClick={() => changeDetail(detail, false)}
                    disabled={!notificationConfig.notificationsAllowed}>
                      <Icon type={"edit"} />
                    </Button>
                </FlexRow>
                <FlexRow>
                  <Button 
                    type={"primary"} 
                    shape="circle" 
                    onClick={() => changeDetail(detail, true)}
                    disabled={!notificationConfig.notificationsAllowed}>
                      <Icon type={"delete"}/>
                    </Button>
                </FlexRow>
              </div>
            )
          }
          <br/>
          <Button type={"primary"} onClick={() => addDetail()} disabled={!notificationConfig.notificationsAllowed}>
            Add type
          </Button>
          <br/>
          <br/>
          <Label>Notification Interval</Label>
          <Select
            onChange={val => handleChange("interval", val)}
            key={"interval"}
            placeholder={"Select the interval"}
            style={{ width: "280px", margin: "18px auto" }}
            value={notificationConfig.interval || undefined}
            disabled={!notificationConfig.notificationsAllowed}
          >
            {intervals.map(interval => (
              <Select.Option key={interval.value} value={interval.value}>
                {interval.name}
              </Select.Option>
            ))}
          </Select>
          <br/>
          <Label>Do not disturb times</Label>
          <br/>
          <DndContainer>
            <Select
              onChange={val => handleChange("dndStart", val)}
              placeholder={"Start time"}
              style={{ width: "120px" }}
              value={notificationConfig.dndStart || undefined}
              disabled={!notificationConfig.notificationsAllowed}
            >
              {timeMappings.map(time => (
                <Select.Option key={'start', time.value} value={time.value}>
                  {time.name}
                </Select.Option>
              ))}
            </Select>
            <p>to</p>
            <Select
              onChange={val => handleChange("dndEnd", val)}
              key={"dndEnd"}
              placeholder={"End time"}
              style={{ width: "120px" }}
              value={notificationConfig.dndEnd || undefined}
              disabled={!notificationConfig.notificationsAllowed}
            >
              {timeMappings.map(time => (
                <Select.Option key={'end' + time.value} value={time.value}>
                  {time.name}
                </Select.Option>
              ))}
            </Select>
          </DndContainer>
          <Select
            onChange={val => handleChange("timezone", val)}
            key={"timezone"}
            placeholder={"Select your timezone"}
            style={{ width: "280px", margin: "18px auto" }}
            value={notificationConfig.timezone || undefined}
            disabled={!notificationConfig.notificationsAllowed}
          >
            {timezones.map(timezone => (
              <Select.Option key={timezone.value} value={timezone.value}>
                {timezone.name}
              </Select.Option>
            ))}
          </Select>
        </ContentBody>
      </Content>
    </React.Fragment>
  )
}

export default Notifications

const validateInputs = (inputs, setError) => {
  if (inputs.notificationsAllowed) {
    if (!inputs.sms && !inputs.app && !inputs.email && !inputs.responses) {
      setError('One notification method must be completed')
    } else if (inputs.details.length > 0) {
      let filtered = inputs.details.filter(val => !val.setType || !val.count);
      if (filtered.length > 0) {
        setError('Notifications types must indicates type and count')
        return false;
      } else {
        setError('')
        return true;
      }
    } else if (inputs.details.length == 0) {
      setError('One notification type must be completed')
      return false;
    } else if (!inputs.interval) {
      setError('Interval must be completed')
      return false;
    } else if (!((inputs.dndStart && inputs.dndEnd && inputs.timezone) ||
      (!inputs.dndStart && !inputs.dndEnd && !inputs.timezone))) {
      setError("All or No fields must be completed in the DND settings")
      return false;
    } else {
      setError("")
      return true;
    }
  } else {
    setError("")
    return true;
  }
  
}
