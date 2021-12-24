import React, { useState, useEffect } from "react"
import { useMutation, useQuery } from "@apollo/react-hooks"
import {
  Calendar,
  Card,
  Button,
  Modal,
  Alert,
  Row,
  Col,
  message,
  DatePicker,
  Select,
  Badge,
} from "antd"
import {
  Container,
  ContainerNavigation,
  SVGIcon,
  SecondaryButton,
} from "../library/basicComponents"
import ApolloClient from "apollo-boost"
import { InMemoryCache } from "apollo-cache-inmemory"
import resolvers from "../graphql/resolvers"
import typeDefs from "../graphql/typeDefs"
import { RESCHEDULE_APPOINTMENT } from "../graphql/mutation"
import { GET_APPOINTMENTS_FOR_CUSTOMER } from "../graphql/query"
import Typography from "../library/typography"
import styled from "styled-components"
import Logo from "../../static/Logo.svg"
import moment from "moment-timezone"
import { timezones } from "../library/constants"
import isEmpty from "lodash/isEmpty"
import { convertUtcToLocal } from "../library/utils"
import CustomTimePicker from "../library/customTimePicker"

const SelectWrap = styled(Select)`
  width: 100%;
`

const LabelWrap = styled.label`
  margin-bottom: 5px;
`
const SpanWrap = styled.span`
  color: red;
  margin-left: 2px;
`

const HomeImg = styled(SVGIcon)`
  font-size: 48px;
  margin-bottom: 1rem;
`

const ContainerWrap = styled(Container)`
  padding-top: 0;
  margin-top: 0;
  over-flow: none;
  .ant-fullcalendar-fullscreen .ant-fullcalendar-date {
    height: 80px;
  }
  .ant-radio-group ant-radio-group-outline ant-radio-group-default {
    display: none;
  }
  .ant-fullcalendar-fullscreen .ant-fullcalendar-header .ant-radio-group {
    display: none;
  }
`
const CardWrapper = styled(Card)`
  box-shadow: 0 2px 4px 1px rgb(0 0 0 / 15%) !important;
  /*min-height: ${props => `${props.height}px`};*/
  /*max-height: ${props => `${props.height}px`};*/
  & .ant-card-head-title {
    color: #00648d !important;
  }
  .ant-card-actions {
    background-color: #fff;
  }
  .ant-card-body {
    padding: 15px 24px;
    overflow-x: auto;
    height: ${props => `${props.height - 40}px`};
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
const ContainerNavigationWrap = styled(ContainerNavigation)`
  border-bottom: 0;
  padding: 0;
  text-align: center;
  width: 100%;
`
const UlWrap = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  & .ant-badge-status {
    width: 100%;
    overflow: hidden;
    font-size: 12px;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  & .ant-badge-status-text {
    font-size: 14px;
    background: #00a1c9;
    padding: 10px;
    color: #fff;
    border-radius: 12px;
  }
`
const LIWrap = styled.li`
  .ant-badge-status-text {
    background: ${props =>
      props.status == "error"
        ? "#ff4d4f"
        : props.status == "success"
        ? "green"
        : props.status == "default"
        ? "#00648d"
        : props.status == "noshow"
        ? "grey"
        : props.status == "show"
        ? "#A70E72"
        : "#2db7f5"};
    color: "#fff";
  }
`

const AppointmentCalendar = ({}) => {
  const [openAppointmentPopup, setAppointmentPopupVisible] = useState(false)
  const [defaultDate, setDefaultDate] = useState(null)
  const [appointment, setAppointment] = useState({})
  const location = window.location.pathname.replace("/acal/", "")
  const [successStatus, setSuccessStatus] = useState(false)
  const [worksHours, setWorksHours] = useState([])
  const [activeAppointments, setActiveAppointments] = useState([])
  const [company, setCompany] = useState(null)

  const { data: resp } = useQuery(GET_APPOINTMENTS_FOR_CUSTOMER, {
    variables: {
        appointmentId: location,
      },
    fetchPolicy: "network-only",
    onCompleted:(result) =>{
      if (result?.getLeadAppointmentDetails?.statusCode == 200) {
        setWorksHours(
          result?.getLeadAppointmentDetails?.workingHours || []
        )
        setAppointment(
          result?.getLeadAppointmentDetails?.appointment || null
        )
        setActiveAppointments(
          result?.getLeadAppointmentDetails?.activeAppointments || []
        )
        setCompany(result?.getLeadAppointmentDetails?.company || null)
      }
    }
  })

  const onSelectDate = value => {
    if (moment().format("MM/DD/YYYY") > value.format("MM/DD/YYYY")) {
      message.error("You can not reschedule appointment for past date")
    } else {
      setDefaultDate(value)
      setAppointmentPopupVisible(true)
    }
  }
  const onPanelChange = value => {}
  const handleAppointmentModalClose = e => {
    setAppointmentPopupVisible(false)
    setAppointment(null)
    setDefaultDate(null)
  }
 
  const dateCellRender = value => {
    const list = (activeAppointments || []).filter(el => {
      return (
        convertUtcToLocal(el?.startDatetime, "MM/DD/YYYY") ==
        value.format("MM/DD/YYYY")
      )
    })
    return (
      <UlWrap>
        {list.map(item => {
          return (
            <LIWrap
              key={item.content}
              status={item?.id == appointment?.id ? "processing" : "default"}
            >
              <Badge
                status={"default"}
                text={
                  convertUtcToLocal(item.startDatetime, "h:mm a") + " - Booked"
                }
              />
            </LIWrap>
          )
        })}
      </UlWrap>
    )
  }
  return (
    <ContainerWrap auto>
      <ContainerNavigation>
        <div style={{ textAlign: "center", width: "100%" }}>
          {company && company?.profilePic != null && (
            <HomeImg component={Logo} alt="SocialMiningAi" />
          )}
          <Typography variant={"h3"} weight={"bold"}>
            {company?.name || ""}
          </Typography>
        </div>
      </ContainerNavigation>
      <CardWrapper
        bordered={false}
        height={window.innerHeight - 160}
        title={
          <ContainerNavigationWrap>
            <div style={{ textAlign: "center", width: "100%" }}>
              {successStatus ? (
                <Alert
                  message={`Your appointment has been successfully rescheduled on ${convertUtcToLocal(
                    appointment?.startDate,
                    "dddd, MMMM Do YYYY, h:mm A"
                  )}`}
                  type={"success"}
                  style={{ margin: "0 19px" }}
                  showIcon
                />
              ) : (
                <Typography variant={"h4"} weight={"medium"}>
                  Schedule Appointment
                </Typography>
              )}
            </div>
          </ContainerNavigationWrap>
        }
        actions={[
          <SecondaryButton
            type="primary"
            //onClick={() => handleCloneClick(item)}
            //size="small"
            style={{ marginLeft: "5px" }}
          >
            Cancel
          </SecondaryButton>,
        ]}
      >
        <Calendar
          dateCellRender={dateCellRender}
          onSelect={e => {
            setTimeout(() => {
              onSelectDate(e)
            }, 300)
          }}
          onPanelChange={e => onPanelChange(e)}
        />
      </CardWrapper>
      {openAppointmentPopup && (
        <AppointmentForm
          visibleModal={openAppointmentPopup}
          appointment={appointment}
          defaultDate={defaultDate}
          setAppointmentModelVisible={handleAppointmentModalClose}
          activeAppointments={activeAppointments}
          showMessage={e => setSuccessStatus(e)}
          setAppointment={e => setAppointment(e)}
          worksHours={worksHours}
        />
      )}
    </ContainerWrap>
  )
}
export default AppointmentCalendar
const AppointmentForm = ({
  visibleModal,
  appointment = null,
  setAppointmentModelVisible,
  defaultDate = moment(),
  activeAppointments = [],
  showMessage,
  setAppointment,
  worksHours,
}) => {
  const [error, setError] = useState("")
  const [appointmentDate, setAppointmentDate] = useState(
    defaultDate || moment()
  )
  const [appointmentTime, setAppointmentTime] = useState(
    moment()
      .add(1, "hours")
      .format("h:mm A")
  )
  //const [loading, setLoading] = useState(false)
  const [timezone, setTimezone] = useState(moment.tz.guess())

  const [rescheduleAppointment, { loading }] = useMutation(RESCHEDULE_APPOINTMENT)

  useEffect(() => {
    if (appointment && !isEmpty(appointment)) {
      setAppointmentDate(
        moment.utc(appointment?.startDatetime).local() || moment()
      )
      setAppointmentTime(
        moment
          .utc(appointment?.startDatetime)
          .local()
          .format("h:mm A") ||
          moment()
            .add(1, "hours")
            .format("h:mm A")
      )
      setTimezone(appointment?.timezone || moment.tz.guess())
    }
  }, [appointment])

  const onChange = e => {
    if (e) {
      setAppointmentTime(null)
      setAppointmentDate(e)
    }
  }
  const onTimeChange = e => {
    if (e) {
      setAppointmentTime(e)
    }
  }

  const disableWeekDay = date => {
    const day = moment(date).format("dddd")
    const index = worksHours.findIndex(
      el => el.weekDay == day.toUpperCase() && !el.isWorkingDay
    )
    return index > -1
  }

  const handleSaveAppointment = () => {
    if (isEmpty(appointmentDate) || isEmpty(appointmentTime)) {
      setError("Please enter appointment start date time")
      return
    }
    const statDate =
      moment(appointmentDate).format("YYYY-MM-DD") +
      " " +
      moment(appointmentTime, "h:mm A").format("HH:mm:ss")

    const findIndex = activeAppointments.findIndex(
      el =>
        el.id != appointment?.id &&
        moment.utc(el?.startDatetime).format("YYYY-MM-DDTHH:mm:ss") ==
          moment(statDate)
            .utc()
            .format("YYYY-MM-DDTHH:mm:ss")
    )

    if (findIndex > -1) {
      setError("Already reserved this time slot")
      return
    }
    
    rescheduleAppointment({
      variables: {
          appointmentId: appointment?.id,
          appointmentTimezone: timezone,
          startDate: moment(statDate)
            .utc()
            .format("YYYY-MM-DDTHH:mm:ss"),
          endDate: moment(statDate)
            .utc()
            .format("YYYY-MM-DDTHH:mm:ss"),
        },
    }).then(result => {
        if (result?.data?.rescheduleAppointment?.statusCode == 200) {
          setAppointmentModelVisible(false)
          showMessage(true)
          setAppointment({
            ...appointment,
            startDate: moment(statDate)
              .utc()
              .format("YYYY-MM-DDTHH:mm:ss"),
            endDate: moment(statDate)
              .utc()
              .format("YYYY-MM-DDTHH:mm:ss"),
          })
        } else {
          message.error(result?.data?.rescheduleAppointment?.message)
        }
        
      })
      .catch(error => {
        console.log(error)
      })
      
  }

  const workHoursTime = () => {
    const day = moment(appointmentDate).format("dddd")
    const workDay = worksHours.find(el => el.weekDay == day.toUpperCase())
    let hours = []
    let startHrs =
      workDay && moment(workDay.startTime, "HH:mm:ss").format("h:mm A")
    if (startHrs) {
      hours.push(startHrs)
    }
    let endHrs = workDay && moment(workDay.endTime, "HH:mm:ss").format("h:mm A")
    if (endHrs) {
      hours.push(endHrs)
    }
    return hours
  }
  const getAppointmentTimes = () => {
    const list = (activeAppointments || []).filter(el => {
      return (
        convertUtcToLocal(el?.startDatetime, "MM/DD/YYYY") ==
        moment(appointmentDate).format("MM/DD/YYYY")
      )
    })
    const hours = (list || []).map(el => {
      return convertUtcToLocal(el?.startDatetime, "h:mm A")
    })
    return hours
  }

  const workingTime = workHoursTime()
  const disabledHours = getAppointmentTimes()

  return (
    <Modal
      title={"Reschedule Appointment"}
      maskClosable={false}
      destroyOnClose={true}
      visible={visibleModal}
      onOk={() => setAppointmentModelVisible(false)}
      onCancel={() => setAppointmentModelVisible(false)}
      width={450}
      footer={
        <FooterComponent
          appointment={appointment}
          setVisible={() => setAppointmentModelVisible()}
          saveAppointment={handleSaveAppointment}
          loading={loading}
        />
      }
    >
      {error && (
        <Row gutter={[4, 16]}>
          <Col>
            <Alert
              message={error}
              type={"error"}
              style={{ margin: "0 19px" }}
              showIcon
            />
          </Col>
        </Row>
      )}
      <Row gutter={[4, 16]}>
        <Col span={24}>
          <Typography variant={"h4"} weight={"bold"} inline>
            Appointment For: {appointment?.lead?.fullName || lead?.fullName}
          </Typography>
        </Col>
      </Row>
      <Row gutter={[4, 16]}>
        <Col span={12}>
          <LabelWrap>
            Appointment Date<SpanWrap>*</SpanWrap>
          </LabelWrap>
          <DatePicker
            format={"MM/DD/YYYY"}
            value={
              typeof appointmentDate == "string"
                ? moment.utc(appointmentDate).local()
                : appointmentDate
            }
            placeholder={"Select Date"}
            onChange={onChange}
            style={{
              width: "100%",
            }}
            disabledDate={current => {
              return (
                moment().add(-1, "days") >= current ||
                moment().add(1, "month") <= current ||
                disableWeekDay(current)
              )
            }}
          />
        </Col>
        <Col span={12}>
          <LabelWrap>
            Appointment Time<SpanWrap>*</SpanWrap>
          </LabelWrap>
          <CustomTimePicker
            fkey={"appointment_time"}
            value={appointmentTime}
            startTime={workingTime && workingTime[0]}
            endTime={workingTime && workingTime[1]}
            onChange={e => onTimeChange(e)}
            placeholder={"Select time"}
            disabledTimes={disabledHours}
            defaultDate={appointmentDate}
          />
        </Col>
      </Row>
      <Row gutter={[4, 16]}>
        <Col span={24}>
          <LabelWrap>
            Timezone<SpanWrap>*</SpanWrap>
          </LabelWrap>
          <SelectWrap
            value={timezone}
            placeholder="Select timezone"
            onChange={value => setTimezone(value)}
          >
            {timezones.map(timezone => (
              <Select.Option key={timezone.value} value={timezone.value}>
                {timezone.name}
              </Select.Option>
            ))}
          </SelectWrap>
        </Col>
      </Row>
    </Modal>
  )
}

const FooterComponent = ({ setVisible, saveAppointment, loading }) => {
  let buttons = [
    <Button
      key="submit"
      type="primary"
      onClick={saveAppointment}
      loading={loading}
    >
      Save
    </Button>,
    <Button key="back" onClick={() => setVisible(false)}>
      Close
    </Button>,
  ]

  return buttons
}
