import React, { useState } from "react"
import { useQuery } from "@apollo/react-hooks"
import { Row, Col, Layout } from "antd"
import OptionsWrapper from "../../library/optionsWrapper"
import { ProspectAnalytics } from "../analytics/kpis"
import { ContainerGroup } from "../../library/basicComponents"
import {
  getChange,
  leadBySource,
  leadAnalysis,
  filterByStatus,
  responseByEngagement,
  activityAnalysis,
  appointmentsBySalesPerson,
} from "../analytics/lambdas"
import BarChart from "../../library/barChart"
import LineChart from "../../library/lineChart"
import { BAR, LINE } from "../../library/constants"
import {
  GET_ENGAGEMENT_ANALYTICS,
  GET_ENGAGEMENT_LEADS_ANALYTICS,
  GET_LEADS_ANALYTICS,
  GET_APPOINTMENT_ANALYSIS,
  GET_APPOINTMENTS_BY_SOURCE,
  GET_APPOINTMENTS_BY_SALES_PERSON,
} from "../../graphql/query"
import moment from "moment"


const currentDate = moment()
  .utc()
  .format()
const data = [
  {
    date: currentDate,
    userId: 168,
    status: "Accepted",
    count: 1,
    source: "Autotrader",
    userName: "James Anderson",
    __typename: "KPIResponse",
  },
  {
    date: currentDate,
    userId: 168,
    status: "Viewed",
    count: 300,
    source: "Autotrader",
    userName: "Ameny Lee",
    __typename: "KPIResponse",
  },
  {
    date: currentDate,
    userId: 168,
    status: "Viewed",
    count: 193,
    source: "Reddit",
    userName: "Jecica",
    __typename: "KPIResponse",
  },
  {
    date: currentDate,
    userId: 168,
    status: "Viewed",
    count: 55,
    source: "Cars.com",
    userName: "James Anderson",
    __typename: "KPIResponse",
  },
  {
    date: currentDate,
    userId: 168,
    status: "Deal Won",
    count: 502,
    source: "Cars.com",
    userName: "Ameny Lee",
    __typename: "KPIResponse",
  },
  {
    date: currentDate,
    userId: 580,
    status: "Pushed to CRM",
    count: 409,
    source: "Reddit",
    userName: "Ameny Lee",
    __typename: "KPIResponse",
  },
  {
    date: currentDate,
    userId: 168,
    status: "Viewed",
    count: 167,
    source: "Reddit",
    userName: "James Anderson",
    __typename: "KPIResponse",
  },
  {
    date: currentDate,
    userId: 168,
    status: "Viewed",
    count: 290,
    source: "Cars.com",
    userName: "Justine Smith",
    __typename: "KPIResponse",
  },
  {
    date: currentDate,
    userId: 168,
    status: "Viewed",
    count: 128,
    source: "Autotrader",
    userName: "Justine Smith",
    __typename: "KPIResponse",
  },
  {
    date: currentDate,
    userId: 168,
    status: "Available",
    count: 2915,
    source: "Cars.com",
    userName: "ALL TEAM",
    __typename: "KPIResponse",
  },
  {
    date: currentDate,
    userId: 168,
    status: "Available",
    count: 100,
    source: "Cars.com",
    userName: "ALL TEAM",
    __typename: "KPIResponse",
  },
  {
    date: currentDate,
    userId: 168,
    status: "Pushed to CRM",
    count: 520,
    source: "Autotrader",
    userName: "Justine Smith",
    __typename: "KPIResponse",
  },
  {
    date: currentDate,
    userId: 168,
    status: "Available",
    count: 100,
    source: "Autotrader",
    userName: "Justine Smith",
    __typename: "KPIResponse",
  },
  {
    date: currentDate,
    userId: 168,
    status: "Available",
    count: 250,
    source: "Autotrader",
    userName: "Ameny Lee",
    __typename: "KPIResponse",
  },
]

const responseData = [
  {
    date: currentDate,
    status: "Sent",
    count: 150,
    source: "Autotrader",
    attampt: "1st Attampt",
    type: "appointment",
  },
  {
    date: currentDate,
    status: "Sent",
    count: 409,
    source: "Autotrader",
    attampt: "2nd Attampt",
    type: "appointment",
  },
  {
    date: currentDate,
    status: "Sent",
    count: 405,
    source: "Autotrader",
    attampt: "3rd Attampt",
    type: "appointment",
  },
  {
    date: currentDate,
    status: "Sent",
    count: 300,
    source: "Reddit",
    attampt: "1st Attampt",
    type: "appointment",
  },
  {
    date: currentDate,
    status: "Sent",
    count: 300,
    source: "Reddit",
    attampt: "2st Attampt",
    type: "appointment",
  },
  {
    date: currentDate,
    status: "Sent",
    count: 300,
    source: "Reddit",
    attampt: "3rd Attampt",
    type: "appointment",
  },
  {
    date: currentDate,
    status: "Sent",
    count: 300,
    source: "Cars.com",
    attampt: "1st Attampt",
    type: "appointment",
  },
  {
    date: currentDate,
    status: "Sent",
    count: 300,
    source: "Cars.com",
    attampt: "2nd Attampt",
    type: "appointment",
  },
  {
    date: currentDate,
    status: "Sent",
    count: 300,
    source: "Cars.com",
    attampt: "3rd Attampt",
    type: "appointment",
  },
  {
    date: currentDate,
    status: "Received",
    count: 193,
    source: "Autotrader",
    attampt: "1st Attampt",
    type: "appointment",
  },
  {
    date: currentDate,
    status: "Received",
    count: 155,
    source: "Autotrader",
    attampt: "2nd Attampt",
    type: "appointment",
  },
  {
    date: currentDate,
    status: "Received",
    count: 105,
    source: "Autotrader",
    attampt: "3rd Attampt",
    type: "appointment",
  },
  {
    date: currentDate,
    status: "Received",
    count: 193,
    source: "Reddit",
    attampt: "1st Attampt",
    type: "appointment",
  },
  {
    date: currentDate,
    status: "Received",
    count: 155,
    source: "Reddit",
    attampt: "2nd Attampt",
    type: "appointment",
  },
  {
    date: currentDate,
    status: "Received",
    count: 105,
    source: "Reddit",
    attampt: "3rd Attampt",
    type: "appointment",
  },
  {
    date: currentDate,
    status: "Received",
    count: 193,
    source: "Cars.com",
    attampt: "1st Attampt",
    type: "appointment",
  },
  {
    date: currentDate,
    status: "Received",
    count: 155,
    source: "Cars.com",
    attampt: "2nd Attampt",
    type: "appointment",
  },
  {
    date: currentDate,
    status: "Received",
    count: 105,
    source: "Cars.com",
    attampt: "3rd Attampt",
    type: "appointment",
  },
]

export const appointmentsAnalytics = (data, range) => {
  // actual
  const _data = (data || []).map(el => ({
    ...el,
    previous: el.prevCount,
    change: getChange(el.count, el.prevCount),
  }))

  return _data
}

export const engagedConverted = (data, range) => {
  const engaged = 1000
  const converted = 800

  if (engaged === 0 && converted === 0) return null
  return [
    { type: "Engaged", value: engaged },
    { type: "Converted", value: converted },
  ]
}

const EngagementDashboardView = ({ location }) => {
  // const { data: respSummary, loading } = useQuery(GET_CAMPAIGN_LEAD_SUMMARY, {
  //   fetchPolicy: "network-only",
  //   variables: {
  //     range: 180,
  //   },
  // })
  // const summaryData = resp?.getCampaignLeadSummary?.leadMessageCount || []
  const { data: resp, loading } = useQuery(GET_ENGAGEMENT_ANALYTICS, {
    fetchPolicy: "network-only",
    variables: {
      range: 180,
    },
  })
  const analyticsData = resp?.getEngagementAnalytics || []

  const { data: result } = useQuery(GET_ENGAGEMENT_LEADS_ANALYTICS, {
    fetchPolicy: "network-only",
    variables: {
      range: 180,
    },
  })
  const analyticsLeadsData = result?.getEngagementLeadAnalytics || []

  const { data: resLeads, loading: leadLoading } = useQuery(
    GET_LEADS_ANALYTICS,
    {
      fetchPolicy: "network-only",
      variables: {
        range: 180,
      },
    }
  )
  const leadsAnalyticsData = resLeads?.getLeadAnalytics || []

  const { data: resAppointments, loading: aptLoading } = useQuery(
    GET_APPOINTMENT_ANALYSIS,
    {
      fetchPolicy: "network-only",
      variables: {
        range: 180,
      },
    }
  )

  const { data: resAppSource, loading: aptSourceLoading } = useQuery(
    GET_APPOINTMENTS_BY_SOURCE,
    {
      fetchPolicy: "network-only",
      variables: {
        range: 180,
      },
    }
  )

  const { data: resAppSalesPerson, loading: aptSalesPersonLoading } = useQuery(
    GET_APPOINTMENTS_BY_SALES_PERSON,
    {
      fetchPolicy: "network-only",
      variables: {
        range: 180,
      },
    }
  )

  const conductedLeads = filterByStatus(analyticsLeadsData)([
    "SENT",
    "OPT_PUT",
    "DELIVERED",
    "RESPONDED",
    "ENGAGED",
  ])

  const receivedRespLeads = filterByStatus(analyticsLeadsData)(["RESPONDED"])
  let leadsData = [...analyticsLeadsData]
  leadsAnalyticsData.forEach(el => {
    leadsData.push({
      ...el,
      status: "N/A",
      date: "",
    })
  })

  return (
    // <PaddedCol>
    <>
      
      <Row>
        <OptionsWrapper
          changes
          lambda={activityAnalysis}
          data={analyticsData}
          loading={loading}
          title="Engagement Analysis"
        >
          {({ data }) => <ProspectAnalytics data={data} />}
        </OptionsWrapper>
      </Row>
      <ContainerGroup>
        <OptionsWrapper
          span={12}
          periods
          lambda={responseByEngagement}
          loading={loading}
          data={analyticsData}
          graphTypes={[BAR]}
          title="Responses Received By Attempt"
        >
          {({ data, period, graphType }) => (
            <>
              {graphType === BAR && (
                <BarChart
                  period={period}
                  id="resp-received-by-source"
                  //horizontal={true}
                  data={data}
                />
              )}
              {graphType === LINE && <LineChart data={data} />}
            </>
          )}
        </OptionsWrapper>
        <OptionsWrapper
          span={12}
          periods
          lambda={leadBySource}
          loading={loading}
          data={receivedRespLeads}
          graphTypes={[BAR, LINE]}
          title="Responses By Source"
        >
          {({ data, period, graphType }) => (
            <>
              {graphType === BAR && (
                <BarChart
                  period={period}
                  id="response-source"
                  horizontal={true}
                  data={data}
                />
              )}
              {graphType === LINE && <LineChart data={data} />}
            </>
          )}
        </OptionsWrapper>
      </ContainerGroup>
      <Row>
        <Col>
          <OptionsWrapper
            changes
            lambda={appointmentsAnalytics}
            data={resAppointments?.getAppointmentAnalysis || []}
            loading={aptLoading}
            title="Appointments Analysis"
            //span={12}
          >
            {({ data }) => <ProspectAnalytics data={data} />}
          </OptionsWrapper>
        </Col>
      </Row>
      <ContainerGroup>
        <OptionsWrapper
          span={12}
          periods
          lambda={leadBySource}
          loading={aptSourceLoading}
          data={resAppSource?.getAppointmentSource || []}
          graphTypes={[BAR, LINE]}
          title="Appointments By Source "
        >
          {({ data, period, graphType }) => (
            <>
              {graphType === BAR && (
                <BarChart
                  period={period}
                  id="appointment-source"
                  horizontal={false}
                  data={data}
                />
              )}
              {graphType === LINE && <LineChart data={data} />}
            </>
          )}
        </OptionsWrapper>
        <OptionsWrapper
          span={12}
          periods
          lambda={appointmentsBySalesPerson}
          loading={false}
          data={resAppSalesPerson?.getAppointmentSalesperson || []}
          graphTypes={[BAR, LINE]}
          title="Appointments By Sales Person"
        >
          {({ data, period, graphType }) => (
            <>
              {graphType === BAR && (
                <BarChart
                  period={period}
                  id="appointment-by-sales-person"
                  horizontal={true}
                  data={data}
                />
              )}
              {graphType === LINE && <LineChart data={data} />}
            </>
          )}
        </OptionsWrapper>
      </ContainerGroup>
      <Row>
        <Col>
          <OptionsWrapper
            changes
            lambda={leadAnalysis}
            data={leadsData}
            loading={leadLoading}
            title="Lead Analysis"
            //span={12}
          >
            {({ data }) => <ProspectAnalytics data={data} width={"70%"} />}
          </OptionsWrapper>
        </Col>
      </Row>
      <ContainerGroup>
        <OptionsWrapper
          span={12}
          periods
          lambda={leadBySource}
          loading={leadLoading}
          data={leadsAnalyticsData}
          graphTypes={[BAR, LINE]}
          title="Lead By Source "
        >
          {({ data, period, graphType }) => (
            <>
              {graphType === BAR && (
                <BarChart
                  period={period}
                  id="lead-by-source"
                  horizontal={false}
                  data={data}
                />
              )}
              {graphType === LINE && <LineChart data={data} />}
            </>
          )}
        </OptionsWrapper>
        <OptionsWrapper
          span={12}
          periods
          lambda={leadBySource}
          loading={leadLoading}
          data={conductedLeads}
          graphTypes={[BAR, LINE]}
          title="Lead Contacted By Source "
        >
          {({ data, period, graphType }) => (
            <>
              {graphType === BAR && (
                <BarChart
                  period={period}
                  id="lead-conducted-by-source"
                  horizontal={false}
                  data={data}
                />
              )}
              {graphType === LINE && <LineChart data={data} />}
            </>
          )}
        </OptionsWrapper>
      </ContainerGroup>
    </>
    // </PaddedCol>
  )
}

export default EngagementDashboardView
