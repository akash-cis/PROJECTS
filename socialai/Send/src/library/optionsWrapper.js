/*
This component is the backbone if KPIS Analytics View
Its used to display each of the blocks of that view (e.g.: Leads Engaged with)

The most important function here is the `lambda` which is actually a callback
The `lambdas` for each block are defined on `lambdas.js`

These callbacks basically take the data from the network and sort/map to
what is needed to display. See propTypes for details on props. 

It uses render props pattern to modify data and pass it to the children.

This component also holds internal state for options like: TeamMember and Period(1 week, 1 day, etc)
*/

import React from "react"
import { Button, Dropdown, Icon, Menu } from "antd"
import PropTypes from "prop-types"
import {
  Container,
  PaddedCol,
  ContainerNavigation,
  Content,
  NoPaddingButton,
  LoadingIcon,
  CenteredContainer,
  Fader,
} from "../library/basicComponents"
import { Spacer } from "../library/utils"
import Typography from "../library/typography"
import TeamPicker from "./teamPicker"
import lineIcon from "../icons/svg/Charts/Line.svg"
import barIcon from "../icons/svg/Charts/Vertical-Bar.svg"
import { BAR, LINE } from "./constants"

const ICONS = { [BAR]: barIcon, [LINE]: lineIcon }
const MILISECONDS_DAY = 86400000

const diffDates = (dateA, dateB) => {
  return Math.ceil((dateA - dateB) / 1000 / 60 / 60 / 24)
}

const zeroDate = date =>
  date ? new Date(date) : new Date().setHours(0, 0, 0, 0)

export const filterByRange = (data, range, date = null, team) =>
  data
    .filter(kpi => {
      const diff = diffDates(
        date ? zeroDate(date) : zeroDate(),
        zeroDate(kpi.date)
      )
      // filter by team member
      if (team && kpi.userName !== "ALL_TEAM") {
        return diff <= range - 1 && diff >= 0 && team.indexOf(kpi.userName) >= 0
      }

      return diff <= range - 1 && diff >= 0
    })
    .map(item => {
      let localDate = item.date

      return {
        ...item,
        date: localDate, // we manually set the time to zero because of possible time discrepancies
      }
    })

export const substractDays = (date, days) => {
  return zeroDate(date) - MILISECONDS_DAY * days
}

// Actions
const SET_PERIOD = "SET_PERIOD"
const SET_CHANGE = "SET_CHANGE"
const SET_TEAM = "SET_TEAM"
const SET_GRAPH_TYPE = "SET_GRAPH_TYPE"

// Constants
export const THREE_MONTHS = "THREE_MONTHS"
export const ONE_MONTH = "ONE_MONTH"
const ONE_WEEK = "ONE_WEEK"
export const TWO_WEEKS = "TWO_WEEKS"
const QUARTER_LAST = "QUARTER_LAST"
const MONTH_LAST = "MONTH_LAST"
const WEEK_LAST = "WEEK_LAST"

// Menus are Maps
export const periodsMenu = {
  ONE_WEEK: { label: "1 week", range: 7 },
  TWO_WEEKS: { label: "2 weeks", range: 15 },
  ONE_MONTH: { label: "1 month", range: 30 },
  THREE_MONTHS: { label: "3 months", range: 90 },
}

const changeMenu = {
  WEEK_LAST: { label: "This week vs last", range: 14 },
  MONTH_LAST: { label: "This month vs last", range: 60 },
  QUARTER_LAST: { label: "This quarter vs last", range: 180 },
}

const reducer = (state, action) => {
  switch (action.type) {
    case SET_PERIOD:
      return { ...state, period: action.payload }
    case SET_CHANGE:
      return { ...state, change: action.payload }
    case SET_TEAM:
      return { ...state, selectedTeam: action.payload }
    case SET_GRAPH_TYPE:
      return { ...state, graphType: action.payload }
    default:
      throw new Error("Plaser provide a valid type")
  }
}

const createActions = dispatch => ({
  setPeriod: payload => dispatch({ type: SET_PERIOD, payload }),
  setChange: payload => dispatch({ type: SET_CHANGE, payload }),
  setSelectedTeam: payload => dispatch({ type: SET_TEAM, payload }),
  setGraphType: payload => dispatch({ type: SET_GRAPH_TYPE, payload }),
})

export const mapify = object =>
  Object.entries(object).map(([key, value]) => [key, value.label])

const createMenu = (items, onClick) => (
  <Menu selectable>
    {items.map(([value, text]) => (
      <Menu.Item
        data-testid="menu-item"
        key={value}
        onClick={() => onClick(value)}
      >
        {text}
      </Menu.Item>
    ))}
  </Menu>
)

export const PeriodsMenu = ({ options, period, onClick: onPeriodClick }) => {
  return (
    <Dropdown
      overlay={createMenu(
        options.map(x => [x.selectionOption.value, x.selectionOption.value]),
        onPeriodClick
      )}
    >
      <Button data-testid="period">
        {period || "Time Period"}
        <Icon type="down" />
      </Button>
    </Dropdown>
  )
}

const OptionsWrapper = React.memo(
  ({
    children,
    title,
    data,
    periods = false,
    changes = false,
    team,
    span,
    padded,
    lambda = a => a,
    date = null,
    showTeam = team,
    graphTypes,
    loading,
    error,
    noLoading,
    scroll = false,
  }) => {
    const [state, dispatch] = React.useReducer(reducer, {
      period: ONE_MONTH,
      change: MONTH_LAST,
      selectedTeam: team || [],
      graphType: (graphTypes && graphTypes[0]) || null,
    })
    const { period, change, selectedTeam, graphType } = state
    const {
      setPeriod,
      setChange,
      setSelectedTeam,
      setGraphType,
    } = createActions(dispatch)
    const isSafePeriod = data && periods
    const isSafeChange = data && changes

    const onPeriodClick = value => {
      setPeriod(value)
    }
    const onChangeClick = value => {
      setChange(value)
    }

    return (
      <PaddedCol
        lg={span}
        md={span <= 8 ? 12 : 24}
        sm={span <= 8 ? 24 : 24}
        xs={24}
      >
        <Container scroll={scroll} auto noMargin={true}>
          <ContainerNavigation>
            <Typography weight="medium">{title}</Typography>
            <Spacer>
              {graphTypes && (
                <Button.Group>
                  {graphTypes.map(type => (
                    <NoPaddingButton
                      onClick={() => setGraphType(type)}
                      key={type}
                    >
                      <img src={ICONS[type]} alt="Graph Icon" />
                    </NoPaddingButton>
                  ))}
                </Button.Group>
              )}
              {team && showTeam && (
                <TeamPicker team={team} setOuter={setSelectedTeam} />
              )}
              {periods && (
                <Dropdown
                  overlay={createMenu(mapify(periodsMenu), onPeriodClick)}
                >
                  <Button data-testid="period">
                    {periodsMenu[period]["label"] || period}{" "}
                    <Icon type="down" />
                  </Button>
                </Dropdown>
              )}
              {changes && (
                <Dropdown
                  overlay={createMenu(mapify(changeMenu), onChangeClick)}
                >
                  <Button data-testid="changes">
                    {changeMenu[change]["label"] || change} <Icon type="down" />
                  </Button>
                </Dropdown>
              )}
            </Spacer>
          </ContainerNavigation>
          <Content noFlex padded={padded}>
            {!loading && !noLoading && (
              <Fader>
                {isSafePeriod &&
                  children({
                    data: lambda(
                      filterByRange(
                        data,
                        periodsMenu[period]["range"],
                        date,
                        team &&
                          selectedTeam &&
                          selectedTeam.map(item => item.text)
                      ),
                      periodsMenu[period]["range"]
                    ),
                    period: periodsMenu[period].range,
                    setSelectedTeam,
                    graphType,
                  })}
                {isSafeChange &&
                  children({
                    data: lambda(
                      filterByRange(
                        data,
                        changeMenu[change]["range"],
                        date,
                        team &&
                          selectedTeam &&
                          selectedTeam.map(item => item.text)
                      ),
                      changeMenu[change]["range"]
                    ),
                    change,
                    setSelectedTeam,
                    graphType,
                  })}
              </Fader>
            )}
            {loading && (
              <CenteredContainer>
                <LoadingIcon type="loading" />
              </CenteredContainer>
            )}
            {error && (
              <CenteredContainer>Something went wrong.</CenteredContainer>
            )}
          </Content>
        </Container>
      </PaddedCol>
    )
  }
)

OptionsWrapper.propTypes = {
  children: PropTypes.func, // content
  periods: PropTypes.bool, // activate periods dropdown
  change: PropTypes.bool, // activate changes dropdown
  title: PropTypes.string, // set title of the warapper
  data: PropTypes.arrayOf(PropTypes.object), // THE data
  team: PropTypes.array, // activate team picker (pass teams data)
  span: PropTypes.number, // ant.d columns spanned
  padded: PropTypes.bool, // adds padding
  lambda: PropTypes.func, // callback to apply to the data
  date: PropTypes.string, // date--most useful for testing
  graphTypes: PropTypes.array, // array with type graphs constants
}
export default OptionsWrapper
