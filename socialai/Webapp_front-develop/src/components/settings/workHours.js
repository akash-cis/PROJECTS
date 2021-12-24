import React, {
  useState,
  forwardRef,
  useImperativeHandle,
  useEffect,
} from "react"
import { Row, Col, Switch, TimePicker, Divider, message } from "antd"
import styled from "styled-components"
import Typography from "../../library/typography"
import moment from "moment"
import { useQuery, useMutation } from "@apollo/react-hooks"
import { GET_COMPANY_WORK_HOURS } from "../../graphql/query"
import { UPDATE_COMPANY_WORK_HOURS } from "../../graphql/mutation"
import range from "lodash/range"

const InternalDivider = styled(Divider)`
  margin: 12px 0 !important;
  top: 0 !important;
`

const InfoCntr = styled.div`
  padding: 24px;
  margin: 12px 21px;
`
const days = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
]

const WorkHours = forwardRef((props, ref) => {
  useImperativeHandle(ref, () => ({
    saveWorkHours() {
      submitCompany()
    },
  }))

  let dayStatus = {}
  days.forEach(
    e =>
      (dayStatus = {
        ...dayStatus,
        [e]: {
          status: e != "SUNDAY" && e != "SATURDAY",
          startTime: moment("09:00", "HH:mm"),
          endTime: moment("09:00", "HH:mm").add(8, "hours"),
        },
      })
  )

  const [workDays, setWorkDays] = useState(dayStatus)

  const { data, refetch: refreshWorkHours, loading: fetchLoading } = useQuery(
    GET_COMPANY_WORK_HOURS,
    {
      variables: { companyId: parseInt(props?.company?.id || 0) },
      onCompleted: res => {
        const data = res?.getCompanyWorkingHours || []

        if (data.length > 0) {
          let dayStatus = {}
          data.forEach(e => {
            dayStatus = {
              ...dayStatus,
              [e.weekDay]: {
                status: e.isWorkingDay,
                startTime: moment(e?.startTime || "09:00", "HH:mm"),
                endTime: moment(e?.endTime || "05:00", "HH:mm"),
              },
            }
          })
          setWorkDays({ ...dayStatus })
        }
      },
    }
  )

  useEffect(() => {
    if (props?.company) {
      refreshWorkHours()
    }
  }, [props])

  const [updateWorkingHours, { loading }] = useMutation(
    UPDATE_COMPANY_WORK_HOURS
  )

  const handleStatusChange = (e, day) => {
    setWorkDays(prevState => {
      let newState = { ...prevState }
      newState[day]["status"] = e
      return newState
    })
  }

  const handleTimeChange = (e, day, key) => {
    if (e) {
      setWorkDays(prevState => {
        let newState = { ...prevState }
        newState[day][key] = e
        return newState
      })
    }
  }

  const submitCompany = () => {
    let saveObj = []
    days.map(dayName => {
      saveObj.push({
        weekDay: dayName,
        isWorkingDay: workDays[dayName]?.status,
        startTime: workDays[dayName]?.startTime.format("HH:mm"),
        endTime: workDays[dayName]?.endTime.format("HH:mm"),
      })
    })
    if (saveObj.length > 0) {
      updateWorkingHours({
        variables: {
          companyId: props?.company?.id,
          inputWorkingHours: saveObj,
        },
      }).then(resp => {
        if (resp?.data?.updateWorkingHours?.statusCode == 200) {
          try {
            refreshWorkHours()
          } catch (err) {}

          if (!props?.showTitle) {
            message.success(resp?.data?.updateWorkingHours?.message)
          }
          if (props?.setActiveTab && props?.newCoSetup) {
            props?.setActiveTab("Company filters")
          }
        } else {
          message.error(resp?.data?.updateWorkingHours?.message)
        }
      })
    }
  }

  const disabledOpeningHours = dayName => {
    const closingHour = workDays[dayName]["endTime"]
    return closingHour ? range(closingHour.hour(), 24) : []
  }

  const disabledClosingHours = dayName => {
    const openingHour = workDays[dayName]["startTime"]
    return openingHour ? range(0, openingHour.hour()) : []
  }

  return (
    <InfoCntr>
      {props?.showTitle == true && (
        <Row>
          <Col span={12}>
            <Typography variant={"h4"} weight={"bold"}>
              Working Hours
            </Typography>
          </Col>
          {/* <Col span={12} style={{ textAlign: "right" }}>
            <Button
              type={"primary"}
              onClick={() => submitCompany()}
              disabled={!props?.isCompanyAdmin}
              loading={loading}
            >
              Save
            </Button>
          </Col> */}
        </Row>
      )}

      <Row gutter={[4, 30]}>
        <Col span={8}>
          <span>{"Day"}</span>
        </Col>
        <Col span={8}>
          <span>{"Opening Hours"}</span>
        </Col>
        <Col span={8}>
          <span>{"Closing Hours"}</span>
        </Col>
      </Row>
      <InternalDivider />
      {days.map(dayName => {
        return (
          <Row gutter={[4, 30]}>
            <Col span={8}>
              <Switch
                size="small"
                checked={workDays[dayName]?.status}
                onChange={e => handleStatusChange(e, dayName)}
                disabled={!props?.isEdit}
              />
              <span> {dayName}</span>
            </Col>
            <Col span={8}>
              <TimePicker
                use12Hours={true}
                style={{ width: "100%" }}
                minuteStep={15}
                format={"hh:mm a"}
                hideDisabledOptions={true}
                value={workDays[dayName]?.startTime}
                onChange={e => handleTimeChange(e, dayName, "startTime")}
                disabled={!workDays[dayName]?.status || !props?.isEdit}
                disabledHours={() => disabledOpeningHours(dayName)}
              />
            </Col>
            <Col span={8}>
              <TimePicker
                use12Hours={true}
                style={{ width: "100%" }}
                minuteStep={15}
                format={"hh:mm a"}
                hideDisabledOptions={true}
                value={workDays[dayName]?.endTime}
                onChange={e => handleTimeChange(e, dayName, "endTime")}
                disabled={!workDays[dayName]?.status || !props?.isEdit}
                disabledHours={() => disabledClosingHours(dayName)}
              />
            </Col>
          </Row>
        )
      })}
    </InfoCntr>
  )
})
export default WorkHours
