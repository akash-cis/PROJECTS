import React, { useContext } from "react"
import { Alert, Row } from "antd"
import { useQuery } from "@apollo/react-hooks"
import {
  AnalyticsLayout,
  ProspectAnalytics,
} from "../../components/analytics/kpis"
import PieChart from "../../library/pieChart"
import LineChart from "../../library/lineChart"
import BarChart from "../../library/barChart"
import GaugeChart from "../../library/gaugeChart"
import OptionsWrapper from "../../library/optionsWrapper"
import {
  GET_ANALYTICS_KPIS,
  GET_APP_USAGE,
  GET_APP_USAGE_ALL,
} from "../../graphql/query"
import {
  prospectAnalysis,
  countByStatus,
  teamManagement,
  prospectUsageOverTime,
  prospectUsage,
  getTotal,
  teamLeaderboard,
  engagedConverted,
  ENGAGED_SPEC,
} from "../../components/analytics/lambdas"
import { UserContext } from "../../amplify/authenticator-provider"
import TeamPicker from "../../library/teamPicker"
import TeamLeaderboard from "../../library/teamLeaderboard"
import { BAR, LINE } from "../../library/constants"
import { ContainerGroup } from "../../library/basicComponents"
// Mocked data
// const cardsSold = [
//   { date: "Used Cards", value: 70 },
//   { date: "New Cards", value: 30 },
// ]

// const leadsData = [
//   {
//     title: "Leads Provided",
//     amount: "18,283",
//     change: "18",
//     previous: "12,195",
//   },
//   {
//     title: "Engaged With",
//     amount: "10,000",
//     change: "-18",
//     previous: "12,195",
//   },
//   {
//     title: "Leads converted",
//     amount: "7,000",
//     change: "18",
//     previous: "12,195",
//   },
// ]

// This section is pretty weird sorry guys!
// Most of the logic can be better if done on the backend side instead of the frontend

// OptionsWrapper is the main component here. Please search for it if debugging is needed.
const AnalyticsPage = ({ location }) => {
  const [data, setData] = React.useState()
  const { user } = useContext(UserContext)
  const isTeamMember = user && user.teamsLeader && user.teamsLeader.length === 0
  const isTeamLeader = user && user.teamsLeader && user.teamsLeader.length > 0

  const { data: analyticsData, loading, error } = useQuery(GET_ANALYTICS_KPIS, {
    variables: {
      range: 180,
      teamId: isTeamLeader ? user.teamsLeader[0]["id"] : -1,
    },
    fetchPolicy: "network-only",
  })

  React.useEffect(() => {
    if (!loading && !error) {
      setData({
        analytics: analyticsData.getAnalyticsKpis,
      })
      if (isTeamLeader && analyticsData.team && analyticsData.team.members) {
        const team = analyticsData.team.members.map(({ member }) => ({
          value: member.id,
          text: member.fullName,
        }))
        setData(data => ({
          ...data,
          team,
        }))
      }
    }
  }, [loading, error])

  return (
    <AnalyticsLayout location={location}>
      {!error && (
        <>
          {isTeamMember && (
            <IndividualView loading={loading} data={data && data.analytics} />
          )}
          {isTeamLeader && (
            <ManagerView
              data={data && data.analytics}
              team={data && data.team}
              loading={loading}
            />
          )}
        </>
      )}
      {error && (
        <Alert
          message={"Something went wrong. Please contact support."}
          type={"error"}
          banner
        />
      )}
    </AnalyticsLayout>
  )
}

const IndividualView = ({ data, loading }) => {
  const {
    data: analyticsData,
    loading: teamLoading,
    error: teamError,
  } = useQuery(GET_ANALYTICS_KPIS, {
    variables: {
      range: 180,
      teamId: -1,
      allMembers: true,
    },
    fetchPolicy: "network-only",
  })

  return (
    <>
      {/*Prospect Analytics*/}
      <Row>
        <OptionsWrapper
          changes
          lambda={prospectAnalysis}
          data={data}
          loading={loading}
          title="Prospect analysis"
        >
          {({ data }) => <ProspectAnalytics data={data} width={"70%"} />}
        </OptionsWrapper>
      </Row>
      {/*Leads*/}
      <ContainerGroup
      // style={{ flexFlow: "row wrap", justifyContent: "space-between" }}
      >
        <OptionsWrapper
          span={8}
          periods
          data={data}
          loading={loading}
          lambda={data => ({
            value: countByStatus(data)(ENGAGED_SPEC),
            total: getTotal(data),
          })}
          title="Leads engaged with"
        >
          {({ data }) => (
            <GaugeChart
              action="Engaged with"
              type="provided leads"
              {...data}
              noBubble
              hand
            />
          )}
        </OptionsWrapper>
        <OptionsWrapper
          span={8}
          data={data}
          loading={loading}
          periods
          lambda={engagedConverted}
          title="Engaged/Converted"
        >
          {({ data }) => <PieChart id="-cards-sold" data={data} />}
        </OptionsWrapper>
        <OptionsWrapper
          span={8}
          loading={teamLoading}
          data={analyticsData?.getAnalyticsKpis}
          lambda={teamManagement}
          error={teamError}
          periods
          title="Team engagement"
        >
          {({ data }) => (
            <PieChart
              id="-team-management"
              middle
              info
              action="Total Engaged Leads"
              {...data}
            />
          )}
        </OptionsWrapper>
      </ContainerGroup>

      {/*Prospect usage over time*/}
      <OptionsWrapper
        periods
        lambda={prospectUsageOverTime}
        data={data}
        loading={loading}
        graphTypes={[LINE, BAR]}
      >
        {({ data, period, graphType }) => (
          <>
            {graphType === BAR && (
              <BarChart period={period} id="prospect" data={data} />
            )}
            {graphType === LINE && <LineChart data={data} />}
          </>
        )}
      </OptionsWrapper>
    </>
  )
}

const ManagerView = ({ data, loading, team }) => {
  const { data: teamData, loading: teamLoading, error: teamError } = useQuery(
    GET_APP_USAGE_ALL,
    {
      variables: {
        range: 180,
        teamId: -1,
        allMembers: true,
      },
      fetchPolicy: "network-only",
    }
  )

  return (
    <>
      {/*Prospect Analytics*/}
      <Row>
        <OptionsWrapper
          changes
          lambda={prospectAnalysis}
          data={data}
          loading={loading}
          title="Prospect analysis"
          team={team}
        >
          {({ data }) => <ProspectAnalytics data={data} width={"70%"} />}
        </OptionsWrapper>
      </Row>
      {/*Leads*/}
      <ContainerGroup>
        <OptionsWrapper
          span={8}
          periods
          data={data}
          loading={loading}
          lambda={data => ({
            value: countByStatus(data)(ENGAGED_SPEC),
            total: getTotal(data),
          })}
          title="Leads engaged with"
          showTeam={false}
          team={team}
        >
          {({ data, setSelectedTeam }) => (
            <GaugeChart action="Engaged with" type="provided leads" {...data}>
              <TeamPicker team={team} setOuter={setSelectedTeam} />
            </GaugeChart>
          )}
        </OptionsWrapper>
        <OptionsWrapper
          team={team}
          data={data}
          loading={loading}
          lambda={prospectUsage}
          span={16}
          periods
          title="Leads engaged with"
        >
          {({ data }) => <BarChart horizontal={true} data={data} />}
        </OptionsWrapper>
      </ContainerGroup>

      {/* Team Leaderboard */}
      <OptionsWrapper
        padded
        title="Team Leaderboard"
        data={teamData?.getAnalyticsAppUsage}
        loading={teamLoading}
        lambda={teamLeaderboard}
        periods
        scroll={true}
      >
        {({ data }) => <TeamLeaderboard data={data} />}
      </OptionsWrapper>

      {/*Leads*/}
      {/* <ContainerGroup>
      <OptionsWrapper span={8} periods title="Leads engaged (by type)">
        {props => (
          <PieChart id="-team-management" data={teamManagement} {...props} />
        )}
      </OptionsWrapper>
      <OptionsWrapper span={8} periods title="Leads engaged with">
        {props => (
          <PieChart id="-team-management2" data={teamManagement} {...props} />
        )}
      </OptionsWrapper>
      <OptionsWrapper span={8} periods title="Leads engaged/converted">
        {props => (
          <PieChart id="-team-management3" data={teamManagement} {...props} />
        )}
      </OptionsWrapper>
        </ContainerGroup*/}

      {/*Prospect usage over time*/}
      <OptionsWrapper
        periods
        team={team}
        lambda={prospectUsageOverTime}
        loading={loading}
        data={data}
        graphTypes={[LINE, BAR]}
      >
        {({ data, period, graphType }) => (
          <>
            {graphType === BAR && (
              <BarChart period={period} id="prospect" data={data} />
            )}
            {graphType === LINE && <LineChart data={data} />}
          </>
        )}
      </OptionsWrapper>
    </>
  )
}

export default AnalyticsPage
