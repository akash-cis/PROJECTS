import React, { useState, useContext } from "react"
import {
  Calendar,
  Badge,
  Button,
  Row,
  Col,
  Input,
  message,
  Tag,
  Popover,
  Tooltip,
} from "antd"
import styled from "styled-components"
import { useQuery } from "@apollo/react-hooks"
import {
  Container,
  ContainerNavigation,
  FilterButtonGroup,
} from "../../library/basicComponents"
import AppointmentList from "./appointmentList"
import AppointmentForm from "./appointmentForm"
import isEmpty from "lodash/isEmpty"
import isUndefined from "lodash/isUndefined"
import { UserContext } from "../../amplify/authenticator-provider"
import { GET_USER_APPOINTMENTS, GET_ALL_USERS } from "../../graphql/query"
import SelectSchedule from "../../library/selectSchedule"
import moment from "moment-timezone"
import { convertUtcToLocal } from "../../library/utils"
import Typography from "../../library/typography"
import { TabContext } from "../../library/tabs"
import { formatPhoneNumber } from "react-phone-number-input"

const TitleRow = styled.div`
  @media only screen and (max-width: 1024px) {
    width: 100%;
    justify-content: center;
  }
`
const FilterButtonGroupWrap = styled(FilterButtonGroup)`
  width: 100%;
  justify-content: flex-end;
  .ant-divider-vertical {
    height: 2rem;
  }
  @media only screen and (max-width: 1024px) {
    width: 100%;
    justify-content: center;
    align-items: center;
    padding: 5px;
    .ant-btn {
      margin: 10px 0;
    }
    label {
      display: none;
    }
    .ant-select {
      width: 85% !important;
    }
    .ant-select-disabled {
      width: 85% !important;
    }
    .ant-btn {
      width: 85% !important;
    }
  }
`

const Title = styled.div`
  padding-left: 0.5rem;
  font-weight: bold;
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
  @media (max-width: 992px) {
    height: 5px;
    margin: 2px 0;
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
const CalendarContainer = styled.div`
  border-right: 1px solid rgb(232, 232, 232);
  border-bottom: 1px solid rgb(232, 232, 232);
  padding: 10px 0;
  & .ant-fullcalendar-fullscreen {
    font-family: Roboto, sans-serif !important;
    & .ant-fullcalendar-table .ant-fullcalendar-column-header-inner {
      font-size: 18px;
      font-weight: 600;
      padding: 10px 0;
    }
  }
  & .ant-fullcalendar-header {
    padding: 4px 16px 8px 0;
    . ant-radio-group {
      dispaly: none;
    }
  }
`

const ListDiv = styled.div`
  padding-bottom: 20px;
  overflow: auto;
  overflow-x: hidden;
  height: 95vh;
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
  .ant-list-pagination {
    text-align: center;
    font-size: 12px;
  }
`

const BadgeWrap = styled(Badge)`
  margin: 0 10px;
  .ant-badge-status-dot {
    width: 12px;
    height: 12px;
  }
`

const { Search } = Input
const AppointmentView = ({ lead = null, onBackClick, onClick }) => {
  const { user } = useContext(UserContext)
  const tabContext = useContext(TabContext)
  const [openAppointmentPopup, setAppointmentPopupVisible] = useState(false)
  const [appointment, setAppointment] = useState({})
  const [defaultDate, setDefaultDate] = useState(null)
  const [selectedUser, setSelectedUser] = useState(user?.id || "All")
  const [search, setSearch] = useState("")
  const [variables, setVariables] = useState({
    userId: user?.id || null,
    startDate: moment()
      .utc()
      .startOf("month")
      .format("YYYY-MM-DD"),
    endDate: moment()
      .utc()
      .endOf("month")
      .format("YYYY-MM-DD"),
    companyId: null,
  })

  const { data: respUsers } = useQuery(GET_ALL_USERS, {
    variables: {
      companyId: user?.company?.id || 0,
    },
    fetchPolicy: "network-only",
  })
  const { data: resp, refetch } = useQuery(GET_USER_APPOINTMENTS, {
    variables: {
      ...variables,
    },
    fetchPolicy: "network-only",
  })
  const appointments = (resp?.getUserAppointment?.data || []).map(el => ({
    ...el,
    type:
      el.appointmentStatus == "CANCELLED"
        ? "error"
        : el.isConfirmed
        ? "success"
        : el.appointmentStatus == "SHOWED"
        ? "show"
        : el.appointmentStatus == "NO_SHOWED"
        ? "noshow"
        : moment(el?.startDatetime).format("MM/DD/YYYYTHH:mm") <
          moment()
            .utc()
            .format("MM/DD/YYYYTHH:mm")
        ? "default"
        : "processing",
    content: el.summary,
  }))

  const handleEventClick = (e, item) => {
    if (e) {
      e.stopPropagation()
      setAppointment({ ...item })
      setAppointmentPopupVisible(true)
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

  const dateCellRender = value => {
    const list = (appointments || []).filter(el => {
      return (
        convertUtcToLocal(el?.startDatetime, "MM/DD/YYYY") ==
        value.format("MM/DD/YYYY")
      )
    })
    return (
      <UlWrap>
        {list.map(item => {
          const popoverContent = (
            <div>
              <p>Lead Name: {item?.lead?.fullName}</p>
              <p>
                Phone:{" "}
                {item?.lead?.phoneNumbers &&
                  (formatPhoneNumber(item?.lead?.phoneNumbers[0]?.phone) ||
                    "N/A")}
              </p>
              <p>
                Email:{" "}
                {item?.lead?.emails && (item?.lead?.emails[0]?.email || "N/A")}
              </p>
              <p>Source: {item?.lead?.leadSource?.name || ""}</p>
              <p>Vehicles: {vehicles(item?.lead?.vehicleOfInterest)}</p>
            </div>
          )
          return (
            <LIWrap
              key={item.content}
              onClick={e => handleEventClick(e, item)}
              status={item.type}
            >
              {window.innerWidth > 992 ? (
                <Popover content={popoverContent} title={"Lead Details"}>
                  <Badge
                    status={item.type}
                    text={
                      convertUtcToLocal(item.startDatetime, "h:mm a") +
                      " - " +
                      item.content
                    }
                  />
                </Popover>
              ) : (
                <> </>
              )}
            </LIWrap>
          )
        })}
      </UlWrap>
    )
  }

  const onSelectDate = value => {
    if (!isEmpty(lead) && isUndefined(appointment?.id)) {
      if (moment().format("MM/DD/YYYY") > value.format("MM/DD/YYYY")) {
        message.error("You can not create appointment for past date")
      } else {
        setDefaultDate(value)
        setAppointmentPopupVisible(true)
      }
    }
  }

  const onPanelChange = value => {
    if (!isEmpty(value)) {
      setVariables({
        ...variables,
        startDate: value
          .utc()
          .startOf("month")
          .format("YYYY-MM-DD"),
        endDate: value
          .utc()
          .endOf("month")
          .format("YYYY-MM-DD"),
      })
    }
  }

  const userList = (respUsers?.getUsers?.data || []).map(el => ({
    id: el.id,
    name: el.firstName + " " + el.lastName,
  }))

  const handleAppointmentModalClose = status => {
    setAppointmentPopupVisible(false)
    setAppointment(null)
    setDefaultDate(null)

    if (status) {
      refetch()
    }
  }

  return (
    <>
      <Container auto noMargin={!isEmpty(lead)}>
        <ContainerNavigation>
          <TitleRow>
            <Typography variant={"h4"} weight={"medium"}>
              Appointments
            </Typography>
          </TitleRow>
          <FilterButtonGroupWrap>
            <label style={{ padding: "5px" }}>Filter By User:</label>
            <SelectSchedule
              mode={"single"}
              value={selectedUser}
              placeholder={"Filter By User"}
              showAll={true}
              onChange={e => {
                setSelectedUser(e)
              }}
              data={userList}
              width={"20%"}
              disabled
            />
            {!isEmpty(lead) && (
              <>
                <Button
                  type={"primary"}
                  onClick={() => setAppointmentPopupVisible(true)}
                  style={{ marginRight: 10, marginLeft: 10 }}
                >
                  Create Appointment
                </Button>
                <Button onClick={onBackClick}>Back</Button>
              </>
            )}
          </FilterButtonGroupWrap>
        </ContainerNavigation>
        <ContainerNavigation>
          <FilterButtonGroupWrap>
            <div style={{ paddingTop: 5 }}>
              <BadgeWrap color="#2db7f5" text="Scheduled" />
              <BadgeWrap color="green" text="Confimred" />
              <BadgeWrap color="#ff4d4f" text="Cancelled" />
              <BadgeWrap color="#00648d" text="Past Appointment" />
              <BadgeWrap color="#A70E72" text="Showed" />
              <BadgeWrap color="grey" text="No Showed" />
            </div>
          </FilterButtonGroupWrap>
        </ContainerNavigation>
        <Row gutter={[4, 24]}>
          <Col sm={24} md={24} lg={18} xl={18}>
            <CalendarContainer>
              <Calendar
                dateCellRender={dateCellRender}
                //monthCellRender={monthCellRender}
                onSelect={e => {
                  setTimeout(() => {
                    onSelectDate(e)
                  }, 300)
                }}
                onPanelChange={e => onPanelChange(e)}
              />
            </CalendarContainer>
          </Col>
          <Col sm={24} md={24} lg={6} xl={6}>
            <ContainerNavigation>
              <Search
                //onChange={e => setSearch(e.target.value)}
                onSearch={e => setSearch(e)}
                placeholder="Search appointment"
                allowClear={true}
              />
            </ContainerNavigation>
            <ListDiv>
              <AppointmentList searchKey={search} />
            </ListDiv>
          </Col>
        </Row>
      </Container>
      {openAppointmentPopup && (
        <AppointmentForm
          lead={lead}
          visibleModal={openAppointmentPopup}
          appointment={appointment}
          defaultDate={defaultDate}
          setAppointmentModelVisible={handleAppointmentModalClose}
          redirect={e => {
            if (isEmpty(lead) && e) {
              tabContext.setActiveTab("activity-center")
              onClick({
                data: appointment?.lead || lead,
                tab: "activity-center",
              })
            } else {
              onClick(appointment?.lead || lead)
            }
          }}
          activeAppointments={(appointments || []).filter(el =>
            ["default", "processing"].includes(el.type)
          )}
        />
      )}
    </>
  )
}

export default AppointmentView
