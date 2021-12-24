import React, { useContext } from "react"
import { Button } from "antd"
import LeveledBarChart, {
  BarChartProvider,
  BarChartContext,
} from "../../library/leveledBarChart"
import { Colors } from "../../library/constants"
import OptionsWrapper from "../../library/optionsWrapper"
import { AnalyticsLayout } from "../../components/analytics/kpis"
import { UserContext } from "../../amplify/authenticator-provider"
import LayeredChart from "../../library/layeredBarChart"
import { useQuery } from "@apollo/react-hooks"
import { GET_APP_USAGE_ALL, GET_APP_USAGE } from "../../graphql/query"
import { managerAppUsage } from "../../components/analytics/lambdas"
import Typography from "../../library/typography"
import {
  Container,
  ContainerNavigation,
  PaddedCol,
  Content,
  CenteredContainer,
  LoadingIcon,
  Flex,
} from "../../library/basicComponents"
import { useState } from "react"
import BarChartContextAwareSlider from "../../library/slider/BarChartContextAwareSlider"

// Mocked data
const data = [
  { date: "2020-01-31T00:00:00", time: 1200 },
  { date: "2020-01-23T00:00:00", time: 2300 },
  { date: "2020-02-06T00:00:00", time: 700 },
  { date: "2020-01-29T00:00:00", time: 6400 },
]

const layeredData = [
  {
    country: "USA",
    year2004: 4.5,
    year2005: 4.2,
  },
  {
    country: "UK",
    year2004: 1.7,
    year2005: 3.1,
  },
  {
    country: "Canada",
    year2004: 2.8,
    year2005: 2.9,
  },
  {
    country: "Japan",
    year2004: 2.6,
    year2005: 2.3,
  },
  {
    country: "France",
    year2004: 1.4,
    year2005: 2.1,
  },
  {
    country: "Brazil",
    year2004: 4.6,
    year2005: 4.9,
  },
]

const maxObj = (data, attr) =>
  data.reduce(
    (prev, current) => (prev[attr] > current[attr] ? prev : current),
    -Infinity
  )

const UsagePage = ({ location }) => {
  const { user } = useContext(UserContext)
  const isTeamMember = user && user.teamsLeader && user.teamsLeader.length === 0
  const isTeamLeader = user && user.teamsLeader && user.teamsLeader.length > 0
  const { data, loading } = useQuery(GET_APP_USAGE, {
    fetchPolicy: "network-only",
  })

  return (
    <BarChartProvider>
      <AnalyticsLayout location={location}>
        {isTeamMember && (
          <IndividualView data={data?.getAnalyticsAppUsage} loading={loading} />
        )}
        {isTeamLeader && (
          <ManagerView data={data?.getAnalyticsAppUsage} loading={loading} />
        )}
      </AnalyticsLayout>
    </BarChartProvider>
  )
}

const IndividualView = ({ data: appUsage, loading }) => {
  const [period, setPeriod] = useState("day")
  const context = useContext(BarChartContext)

  return (
    <PaddedCol>
      <Container auto noMargin={true}>
        <ContainerNavigation>
          <Typography weight="medium">App usage over time</Typography>
          <Flex>
            <BarChartContextAwareSlider context={context} />
            <Button.Group>
              <Button onClick={() => setPeriod("month")}>Monthly</Button>
              <Button onClick={() => setPeriod("week")}>Weekly</Button>
              <Button onClick={() => setPeriod("day")}>Daily</Button>
            </Button.Group>
          </Flex>
        </ContainerNavigation>
        <Content noFlex>
          {loading && (
            <CenteredContainer>
              <LoadingIcon type="loading" />
            </CenteredContainer>
          )}
          {appUsage && (
            <LeveledBarChart
              id={"barMock"}
              data={appUsage}
              period={period}
              level={{
                value: maxObj(appUsage, "time").time,
                color: Colors.orange,
                text: "Best",
              }}
              duration
            />
          )}
        </Content>
      </Container>
    </PaddedCol>
  )
}

const ManagerView = ({ data, loading }) => (
  <OptionsWrapper
    changes
    data={data}
    lambda={managerAppUsage}
    loading={loading}
    title="Team app usage"
  >
    {({ data: orderedData }) => {
      return <LayeredChart data={orderedData} />
    }}
  </OptionsWrapper>
)

export default UsagePage
