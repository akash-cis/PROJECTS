import React, { useEffect, useState, useContext } from "react"
import { useMutation, useQuery } from "@apollo/react-hooks"
import {
  Input,
  Button,
  DatePicker,
  Modal,
  Alert,
  message,
  Row,
  Col,
  Select,
  Tooltip,
  Icon,
} from "antd"
import { showConfirmationModal } from "../../library/helpers"
import moment from "moment-timezone"
import isEmpty from "lodash/isEmpty"
import isUndefined from "lodash/isUndefined"
import styled from "styled-components"
import Typography from "../../library/typography"
import {
  CREATE_APPOINTMENT,
  UPDATE_APPOINTMENT,
  DELETE_APPOINTMENT,
} from "../../graphql/mutation"
import { UserContext } from "../../amplify/authenticator-provider"
import { timezones } from "../../library/constants"
import { GET_COMPANY_WORK_HOURS } from "../../graphql/query"
import CustomTimePicker from "../../library/customTimePicker"
import { convertUtcToLocal } from "../../library/utils"

const MODAL_TITLE = `Do you want to continue?`
const MODAL_CONTENT = `When clicked the OK button, it cannot be recovered`

const { TextArea } = Input

const LabelWrap = styled.label`
  margin-bottom: 5px;
`
const SpanWrap = styled.span`
  color: red;
  margin-left: 2px;
`
const SelectWrap = styled(Select)`
  width: 100%;
`
const { Option } = Select
const AppointmentForm = ({
  lead,
  visibleModal,
  appointment = null,
  setAppointmentModelVisible,
  defaultDate = moment(),
  redirect = null,
  activeAppointments = [],
}) => {
  const { user } = useContext(UserContext)
  const defaultTitle = user ? `Appointment at ${user?.company?.name}` : ""

  const { data: respWorkHrs } = useQuery(GET_COMPANY_WORK_HOURS, {
    variables: {
      companyId: user?.company?.id || 0,
    },
  })
  const [createAppointment, { loading }] = useMutation(CREATE_APPOINTMENT)
  const [updateAppointment, { loading: updateLoading }] = useMutation(
    UPDATE_APPOINTMENT
  )
  const [deleteAppointment, { loading: deleteLoading }] = useMutation(
    DELETE_APPOINTMENT
  )

  const worksHours = respWorkHrs?.getCompanyWorkingHours || []
  const [error, setError] = useState("")
  const [appointmentDate, setAppointmentDate] = useState(
    defaultDate || moment()
  )
  const [appointmentTime, setAppointmentTime] = useState(
    moment()
      .add(1, "hours")
      .format("h:mm A")
  )

  const [note, setNote] = useState("")
  const [title, setTitle] = useState(defaultTitle)
  const [timezone, setTimezone] = useState(
    user?.company?.timezone || moment.tz.guess()
  )
  const [vehicle, setVehicle] = useState(null)
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
      setNote(appointment?.description || "")
      setTitle(appointment?.summary || "")
      setTimezone(appointment?.timezone || moment.tz.guess())
      setVehicle(String(appointment?.discussedVoiId || ""))
    }
  }, [appointment])

  const handleDeleteAppointment = e => {
    if (e && !isUndefined(appointment?.id)) {
      showConfirmationModal(MODAL_TITLE, MODAL_CONTENT, () =>
        deleteAppointment({
          variables: {
            appointmentId: appointment?.id,
          },
        })
          .then(resp => {
            if (resp?.data?.deleteAppointment?.ok) {
              message.success("Appointment successfully deleted!")
              setAppointmentModelVisible(true)
              if (redirect) {
                redirect(false)
              }
            }
          })
          .catch(mutationError => {
            const error = JSON.parse(JSON.stringify(mutationError))
            message.error(
              error?.graphQLErrors && error?.graphQLErrors[0]?.message
            )
          })
      )
    }
  }

  const handleSaveAppointment = e => {
    if (e) {
      if (isEmpty(title)) {
        setError("Please enter appointment title")
        return
      } else if (isEmpty(appointmentDate) || isEmpty(appointmentTime)) {
        setError("Please enter appointment start date time")
        return
      }
      const startDate =
        moment(appointmentDate).format("YYYY-MM-DD") +
        " " +
        moment(appointmentTime, "h:mm A").format("HH:mm:ss")

      if (!isUndefined(appointment?.id)) {
        let variables = {
          appointmentId: appointment?.id,
          summary: title,
          description: note,
          appointmentTimezone: timezone,
          startDate: moment(startDate)
            .utc()
            .format("YYYY-MM-DDTHH:mm:ss"),
          endDate: moment(startDate)
            .utc()
            .format("YYYY-MM-DDTHH:mm:ss"),
          discussedVoiId: vehicle,
        }
        if (!isUndefined(e?.status)) {
          variables["status"] = e.status
        }

        updateAppointment({
          variables,
        })
          .then(resp => {
            if (resp?.data?.updateAppointment?.ok) {
              setAppointmentModelVisible(true)
              redirect(false)
              message.success("Appointment successfully updated!")
            }
          })
          .catch(mutationError => {
            const error = JSON.parse(JSON.stringify(mutationError))
            message.error(
              error?.graphQLErrors && error?.graphQLErrors[0]?.message
            )
          })
      } else {
        createAppointment({
          variables: {
            leadId: lead?.id,
            summary: title,
            description: note,
            appointmentTimezone: timezone,
            startDate: moment(startDate)
              .utc()
              .format("YYYY-MM-DDTHH:mm:ss"),
            endDate: moment(startDate)
              .utc()
              .format("YYYY-MM-DDTHH:mm:ss"),
            discussedVoiId: vehicle,
          },
        })
          .then(resp => {
            if (resp?.data?.createAppointment?.ok) {
              setAppointmentModelVisible(true)
              redirect(false)
              message.success("Appointment successfully updated!")
            } else if ((resp?.errors || []).length > 0) {
              message.error(resp?.errors[0]?.message)
            }
          })
          .catch(mutationError => {
            const error = JSON.parse(JSON.stringify(mutationError))
            message.error(
              error?.graphQLErrors && error?.graphQLErrors[0]?.message
            )
          })
      }
    }
  }

  const disabledControl = () => {
    return (
      appointment?.appointmentStatus == "CANCELLED" ||
      appointment?.appointmentStatus == "NO_SHOWED"
    )
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

  const disableWeekDay = date => {
    const day = moment(date).format("dddd")
    const index = worksHours.findIndex(
      el => el.weekDay == day.toUpperCase() && !el.isWorkingDay
    )
    return index > -1
  }

  const onChange = e => {
    if (e) {
      setAppointmentDate(e)
      setAppointmentTime(null)
    }
  }
  const onTimeChange = e => {
    if (e) {
      setAppointmentTime(e)
    }
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
  const appointmentTitle = isUndefined(appointment?.id)
    ? "Create Appointment"
    : appointment?.appointmentStatus == "CANCELLED"
    ? "The Appointment is cancelled"
    : "Edit Appointment"

  const workingTime = workHoursTime()
  const disabledHours = getAppointmentTimes()

  const vehicles =
    lead?.vehicleOfInterest || appointment?.lead?.vehicleOfInterest || []

  return (
    <Modal
      title={appointmentTitle}
      maskClosable={false}
      destroyOnClose={true}
      visible={visibleModal}
      onOk={() => setAppointmentModelVisible(false)}
      onCancel={() => setAppointmentModelVisible(false)}
      width={500}
      footer={
        <FooterComponent
          appointment={appointment}
          setVisible={() => setAppointmentModelVisible()}
          saveAppointment={handleSaveAppointment}
          deleteAppointment={handleDeleteAppointment}
          loading={loading || updateLoading}
          deleteLoading={deleteLoading}
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
            Appointment For:{" "}
          </Typography>
          <a
            onClick={() => {
              setAppointmentModelVisible(false)
              if (redirect) {
                redirect(true)
              }
            }}
          >
            {appointment?.lead?.fullName || lead?.fullName}
          </a>
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
            disabled={disabledControl()}
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
            disabled={disabledControl()}
            defaultDate={appointmentDate}
          />
        </Col>
      </Row>
      <Row gutter={[4, 16]}>
        <Col span={24}>
          <LabelWrap>
            Timezone<SpanWrap>*</SpanWrap>{" "}
            <Tooltip
              placement="topLeft"
              title={
                "This is the lead’s timezone, not the sales person’s timezone."
              }
            >
              <Icon
                type="question-circle"
                style={{ color: "gray", marginLeft: 5 }}
              />
            </Tooltip>
          </LabelWrap>
          <SelectWrap
            value={timezone}
            placeholder="Select timezone"
            onChange={value => setTimezone(value)}
            disabled={disabledControl()}
          >
            {timezones.map(timezone => (
              <Select.Option key={timezone.value} value={timezone.value}>
                {timezone.name}
              </Select.Option>
            ))}
          </SelectWrap>
        </Col>
      </Row>
      <Row gutter={[4, 16]}>
        <Col span={24}>
          <LabelWrap>
            Title<SpanWrap>*</SpanWrap>
          </LabelWrap>
          <Input
            placeholder={"Appointment Title"}
            name={"title"}
            value={title}
            onChange={e => setTitle(e.target.value)}
            disabled={disabledControl()}
          />
        </Col>
      </Row>

      <Row gutter={[4, 16]}>
        <Col span={24}>
          <LabelWrap>Description</LabelWrap>
          <TextArea
            rows={5}
            //reference={additionalComments}
            placeholder={"Type description here"}
            name={"note"}
            value={note}
            onChange={e => setNote(e.target.value)}
            disabled={disabledControl()}
          />
        </Col>
      </Row>
      <Row gutter={[4, 16]}>
        <Col span={24}>
          <LabelWrap>Vehicle Of Interest</LabelWrap>
          <SelectWrap
            value={vehicle}
            placeholder="Select vehicle"
            onChange={value => setVehicle(value)}
            disabled={disabledControl()}
          >
            {vehicles.map(el => {
              let voi = ""
              if (!isUndefined(el.make)) voi = voi + el.make + " "
              if (!isUndefined(el.model)) voi = voi + el.model + " "
              if (!isUndefined(el.year)) voi = voi + el.year + " "
              return (
                <Select.Option key={el.id} value={el.id}>
                  {voi}
                </Select.Option>
              )
            })}
          </SelectWrap>
        </Col>
      </Row>
    </Modal>
  )
}
export default AppointmentForm

const FooterComponent = ({
  appointment = null,
  setVisible,
  saveAppointment,
  deleteAppointment,
  loading = false,
  deleteLoading = false,
}) => {
  const [status, setStatus] = useState(undefined)
  const handleStatusUpdate = e => {
    saveAppointment({ status: e })
  }
  let buttons = [
    <Button key="back" onClick={() => setVisible(false)}>
      Close
    </Button>,
  ]
  if (
    appointment?.appointmentStatus != "CANCELLED" &&
    appointment?.appointmentStatus != "NO_SHOWED"
  ) {
    buttons.unshift(
      <Button
        key="submit"
        type="primary"
        onClick={saveAppointment}
        loading={loading}
      >
        Save
      </Button>
    )
  }
  if (
    !isUndefined(appointment?.id) &&
    appointment?.appointmentStatus != "CANCELLED" &&
    appointment?.appointmentStatus != "NO_SHOWED" &&
    moment(appointment?.startDatetime)
      .utc()
      .format("MM/DD/YYYY") >=
      moment()
        .utc()
        .format("MM/DD/YYYY")
  ) {
    buttons.unshift(
      <Button
        key="back"
        type={"danger"}
        onClick={deleteAppointment}
        loading={deleteLoading}
      >
        Cancel Appointment
      </Button>
    )
  }
  if (
    !isUndefined(appointment?.id) &&
    appointment?.appointmentStatus != "CANCELLED" &&
    appointment?.appointmentStatus != "NO_SHOWED" &&
    moment(appointment?.startDatetime)
      .utc()
      .format("MM/DD/YYYY") <
      moment()
        .utc()
        .format("MM/DD/YYYY") &&
    !appointment.isConfirmed
  ) {
    buttons.unshift(
      <Select
        value={status}
        placeholder="Change status & Save"
        onChange={handleStatusUpdate}
        style={{ paddingRight: 10, width: 215 }}
        loading={loading}
      >
        <Select.Option key={"SHOWED"} value={"SHOWED"}>
          Showed
        </Select.Option>
        <Select.Option key={"NO_SHOWED"} value={"NO_SHOWED"}>
          No Show
        </Select.Option>
        <Select.Option key={"CANCELLED"} value={"CANCELLED"}>
          Cancel
        </Select.Option>
      </Select>
    )
  }
  return buttons
}
