import React, { useEffect, useContext, useReducer, createContext } from "react"
import * as am4core from "@amcharts/amcharts4/core"
import * as am4charts from "@amcharts/amcharts4/charts"
import { Colors, ChartColors, NOT_ENOUGH_DATA } from "./constants"
import styled from "styled-components"
import { CenteredContainer } from "./basicComponents"

let reducer = (state, action) => {
  switch (action.type) {
    case "build_chart":
      let { chart, dateAxis } = action.payload
      return {
        ...state,
        chart,
        dateAxis,
      }
    case "dispose_chart":
      console.log("up")
      action.payload.chart.dispose()
      return {
        ...state,
        chart: null,
        dateAxis: null,
      }
    case "update_start":
      state.dateAxis.start = action.payload
      return { ...state, start: action.payload }
    case "update_end":
      state.dateAxis.end = action.payload
      return { ...state, end: action.payload }
    case "update_range":
      state.dateAxis.start = action.payload[0]
      state.dateAxis.end = action.payload[1]
      return { ...state, start: action.payload[0], end: action.payload }
    default:
      return state
  }
}

const initialState = { chart: null, start: 0, end: 1, period: "day" }
export const BarChartContext = createContext(initialState)

export const BarChartProvider = ({ children, ...props }) => {
  const [state, dispatch] = useReducer(reducer, initialState)
  return (
    <BarChartContext.Provider value={{ state, dispatch }}>
      {children}
    </BarChartContext.Provider>
  )
}

const ChartDiv = styled.div`
  min-height: ${props => (props.minHeight ? props.minHeight : "260px")};
  width: 100%;
`

const amcoreColors = () => {
  return ChartColors.map(color => am4core.color(color))
}

const capitalize = str =>
  str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()

const fillFactory = (color = Colors.orange, value = null) => (fill, target) => {
  if (value && target.dataItem && target.dataItem.valueY >= value) {
    return am4core.color(color)
  } else {
    return fill
  }
}

const strokeFactory = (color = Colors.orange, value = null) => (
  stroke,
  target
) => {
  if (value && target.dataItem && target.dataItem.valueY >= value) {
    return am4core.color(color)
  } else {
    return stroke
  }
}
const buildRangeFactory = (
  color = Colors.orange,
  value = null,
  text = "Goal"
) => valueAxis => {
  if (value) {
    let range = valueAxis.axisRanges.create()
    range.value = value
    range.grid.stroke = am4core.color(color)
    range.grid.strokeWidth = 2
    range.grid.strokeOpacity = 1
    range.label.inside = true
    range.label.text = text
    range.label.fill = range.grid.stroke
    //range.label.align = "right";
    range.label.verticalCenter = "bottom"
    return range
  } else {
    return null
  }
}

const buildChart = (
  id,
  data,
  period,
  fill,
  stroke,
  buildRange,
  componentChart,
  scrollable = false,
  duration = false
) => {
  let chart = am4core.create(id, am4charts.XYChart)

  chart.colors.list = amcoreColors()
  chart.colors.list[0] = am4core.color(Colors.primaryBrandBlue)

  const [date, ...series] = Object.keys(data[0])
  let dateAxis = chart.xAxes.push(new am4charts.DateAxis())
  dateAxis.dataFields.category = date
  let valueAxis
  valueAxis = duration
    ? chart.yAxes.push(new am4charts.DurationAxis())
    : chart.yAxes.push(new am4charts.ValueAxis())
  valueAxis.renderer.labels.template.disable = true

  let allSeries = duration
    ? series.map(value => {
        let newSeries = chart.series.push(new am4charts.ColumnSeries())
        newSeries.dataFields.valueY = value
        newSeries.columns.template.tooltipText =
          "{name}: [bold]{valueY.formatDuration()}[/]"
        newSeries.name = capitalize(value)
        newSeries.dataFields.dateX = date
        newSeries.columns.template.adapter.add("fill", fill)
        newSeries.columns.template.adapter.add("stroke", stroke)
        buildRange(valueAxis)
        if (scrollable) {
          chart.scrollbarX = new am4core.Scrollbar()
        }
        newSeries.columns.template.adapter.add("custom", stroke)

        return newSeries
      })
    : series.map(value => {
        let newSeries = chart.series.push(new am4charts.ColumnSeries())
        newSeries.dataFields.valueY = value
        newSeries.columns.template.tooltipText = "{name}: [bold]{valueY}[/]"
        newSeries.name = capitalize(value)
        newSeries.dataFields.dateX = date
        newSeries.columns.template.adapter.add("fill", fill)
        newSeries.columns.template.adapter.add("stroke", stroke)
        buildRange(valueAxis)
        if (scrollable) {
          chart.scrollbarX = new am4core.Scrollbar()
        }
        newSeries.columns.template.adapter.add("custom", stroke)

        return newSeries
      })
  const periodFormatMap = {
    day: {
      format: "MM-dd-yyyy",
      timeUnit: "day",
      count: 1,
    },
    week: {
      format: "ww-yyyy",
      timeUnit: "week",
      count: 1,
    },
    month: {
      format: "MM-yyyy",
      timeUnit: "month",
      count: 1,
    },
  }
  chart.dateFormatter.inputDateFormat = periodFormatMap[period].format
  dateAxis.baseInterval = {
    timeUnit: periodFormatMap[period].timeUnit,
    count: periodFormatMap[period].count,
  }
  chart.data = data

  componentChart = chart
  return { chart, dateAxis }
}

const BarChart = ({
  data,
  period,
  id,
  level = {
    value: null,
    color: Colors.orange,
    text: "Goal",
  },
  scrollable = false,
  scroll = {
    start: 0,
    end: 1,
  },
  duration,
  minHeight = "260px",
  noDataMessage = NOT_ENOUGH_DATA,
  ...props
}) => {
  let componentChart = null
  const { state, dispatch } = useContext(BarChartContext)
  const { chart, start, end } = state
  const prevPeriod = state.period
  const hasAvailableData = data && data.length > 0

  const { fill, stroke, buildRange } = {
    fill: fillFactory(level.color, level.value),
    stroke: strokeFactory(level.color, level.value),
    buildRange: buildRangeFactory(level.color, level.value, level.text),
  }

  const destroyChart = () => {
    if (componentChart != null) componentChart.dispose()
    componentChart = null
  }

  const updateChart = (chart, range) => {
    chart.DateAxis.start = range.start
    chart.DateAxis.end = range.end
    return chart
  }
  useEffect(() => {
    //TODO: dispatch build_or_update_chart
    // should be enough checking the current
    // state and if the period changed
    // just rebuild.
    // Then it'll probably need a way to
    // update without redrawing within one same period
    if (hasAvailableData) {
      if (!chart) {
        dispatch({
          type: "build_chart",
          payload: buildChart(
            id,
            data,
            period,
            fill,
            stroke,
            buildRange,
            componentChart,
            scrollable,
            duration
          ),
        })
      } else {
        chart.dispose()
        dispatch({
          type: "build_chart",
          payload: buildChart(
            id,
            data,
            period,
            fill,
            stroke,
            buildRange,
            componentChart,
            scrollable,
            duration
          ),
        })
      }
    }

    /*return () => {
      destroyChart();
    };*/
  }, [period, data])

  return (
    <div>
      {hasAvailableData && (
        <BarChartProvider>
          <ChartDiv minHeight={minHeight} id={id} />
        </BarChartProvider>
      )}
      {!hasAvailableData && (
        <CenteredContainer height={minHeight}>
          {noDataMessage}
        </CenteredContainer>
      )}
    </div>
  )
}

export default BarChart
