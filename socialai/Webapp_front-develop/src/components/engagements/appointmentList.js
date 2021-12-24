import React, { useState, useContext, useEffect } from "react"
import { List, Avatar } from "antd"
import moment from "moment"
import styled from "styled-components"
import { useQuery, useLazyQuery } from "@apollo/react-hooks"
import { GET_USER_APPOINTMENTS } from "../../graphql/query"
import { UserContext } from "../../amplify/authenticator-provider"
import { LoadingIcon } from "../../library/basicComponents"
import { convertUtcToLocal } from "../../library/utils"
const ListContainer = styled.div`
  & .ant-list-item-meta {
    text-align: left;
  }
  & .ant-list-item-meta-title{
    font-size:16px;
  }
  & .ant-list-item-meta-description > p{
    margin:bottom:0.4rem;
  }
  .ant-list-items{
    min-height:75vh;
  } 
`
const AvtarWrap = styled(Avatar)`
  height: ${props => (props.height ? props.height : "90px")};
  width: ${props => (props.width ? props.width : "80px")};
  padding-top: 0.5rem;
  border-radius: 10px;
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
  & p {
    margin-bottom: 0;
    margin-block-start: 0;
    margin-block-end: 0;
    line-height: 18px;
  }
`

const AppointmentList = ({
  searchKey = "",
  height = "90px",
  width = "80px",
  leadId,
  refetch = false,
}) => {
  const { user } = useContext(UserContext)
  const [appointments, setAppointments] = useState([])
  const [totalCount, setCount] = useState(0)
  const [variables, setVariables] = useState({
    userId: user?.id || null,
    search: searchKey,
    page: 1,
    pageSize: 10,
    orderBy: "id",
    orderDirection: "asc",
    dateFilter: null,
    companyId: null,
    leadId: leadId || null,
  })

  const [getAppointments, { loading }] = useLazyQuery(GET_USER_APPOINTMENTS, {
    variables: {
      ...variables,
    },
    fetchPolicy: "network-only",
    onCompleted: resp => {
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
      const totalCount = resp?.getUserAppointment?.count || 0
      setAppointments(appointments)
      setCount(totalCount)
    },
  })

  useEffect(() => {
    getAppointments({ variables: { ...variables, search: searchKey } })
  }, [searchKey])

  useEffect(() => {
    getAppointments({ variables: { ...variables, leadId: leadId } })
  }, [leadId])

  useEffect(() => {
    if (refetch) {
      getAppointments({ variables: { ...variables, leadId: leadId } })
    }
  }, [refetch])

  return (
    <ListContainer>
      <List
        loading={loading && <LoadingIcon type={"loading"} />}
        itemLayout="horizontal"
        dataSource={appointments}
        pagination={
          totalCount < 5
            ? null
            : {
                defaultCurrent: variables.page,
                current: variables.page,
                defaultPageSize: variables.pageSize,
                pageSize: variables.pageSize,
                total: totalCount,
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
                  getAppointments({ variables: newVariables })
                },
                onShowSizeChange: (current, size) => {
                  let newVariables = {
                    ...variables,
                    page: current,
                    pageSize: size,
                  }
                  setVariables(newVariables)
                  getAppointments({ variables: newVariables })
                },
              }
        }
        renderItem={item => (
          <List.Item style={{ padding: "10px 10px" }}>
            <List.Item.Meta
              avatar={
                <AvtarWrap
                  shape="square"
                  height={height}
                  width={width}
                  status={item.type}
                >
                  <span style={{ fontSize: 30 }}>
                    {convertUtcToLocal(item.startDatetime, "DD")}
                  </span>
                  <p>
                    <small>
                      {convertUtcToLocal(item.startDatetime, "MMM, YYYY")}
                    </small>
                  </p>
                  <p>
                    <small>
                      {convertUtcToLocal(item.startDatetime, "h:mm a")}
                    </small>
                  </p>
                </AvtarWrap>
              }
              title={item.summary}
              description={
                <>
                  <p>{item.description}</p>
                </>
              }
            />
          </List.Item>
        )}
      />
    </ListContainer>
  )
}
export default AppointmentList
