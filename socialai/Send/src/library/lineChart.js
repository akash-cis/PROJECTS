import React, { useEffect, useState } from "react"
import * as am4core from "@amcharts/amcharts4/core"
import * as am4charts from "@amcharts/amcharts4/charts"
import { ChartColors, NOT_ENOUGH_DATA } from "./constants"
import styled from "styled-components"
import { CenteredContainer } from "./basicComponents"

const ChartDiv = styled.div`
  min-height: ${props => (props.minHeight ? props.minHeight : "260px")};
  width: 100%;
`

const amcoreColors = () => {
  return ChartColors.map(color => am4core.color(color))
}

const LineChart = ({
  data,
  id = "line-chart",
  interval = "day",
  goals = false,
  minHeight = "260px",
  noDataMessage = NOT_ENOUGH_DATA
}) => {
  const [componentChart, setChart] = useState(null)
  const hasAvailableData = data && data.length > 0

  const buildChart = () => {
    let chart = am4core.create(id, am4charts.XYChart)
    chart.colors.list = amcoreColors()

    const [date, ...series] = Object.keys(data[0])
    let dateAxis = chart.xAxes.push(new am4charts.DateAxis())
    dateAxis.dataFields.category = date
    dateAxis.renderer.grid.template.strokeOpacity = 0
    dateAxis.renderer.labels.template.opacity = 0
    dateAxis.cursorTooltipEnabled = false
    let valueAxis = chart.yAxes.push(new am4charts.ValueAxis())
    valueAxis.renderer.grid.template.strokeOpacity = 0.1
    valueAxis.renderer.grid.template.strokeDasharray = "8"
    valueAxis.renderer.labels.template.disabled = true
    valueAxis.renderer.baseGrid.disabled = true
    valueAxis.cursorTooltipEnabled = false

    if (goals) {
      goals.map((goal, idx) => {
        let axisGoal = valueAxis.axisRanges.create()
        axisGoal.value = goal
        axisGoal.grid.strokeOpacity = 1
        axisGoal.grid.stroke = am4core.color(ChartColors[idx])
        axisGoal.grid.strokeWidth = 2
        axisGoal.grid.strokeDasharray = "1"
        axisGoal.label.text = "Goal"
        axisGoal.label.align = "left"
        axisGoal.label.rotation = 270
        axisGoal.label.horizontalCenter = "left"
        axisGoal.label.fill = am4core.color(ChartColors[idx])
      })
    }

    let allSeries = series.map(value => {
      let newSeries = chart.series.push(new am4charts.LineSeries())
      newSeries.dataFields.valueY = value
      newSeries.name = value
      newSeries.dataFields.dateX = date
      newSeries.strokeWidth = 3
      newSeries.name = value.charAt(0).toUpperCase() + value.slice(1)
      newSeries.tooltipText =
        interval === "day"
          ? "{dateX.formatDate('MMM d')}\n{name}: [bold]{valueY}"
          : "{dateX.formatDate('MMM yyyy')}\n{name}: [bold]{valueY}"

      let circleBullet = newSeries.bullets.push(new am4charts.CircleBullet())
      circleBullet.circle.fill = am4core.color("#fff")
      circleBullet.circle.strokeWidth = 3

      return newSeries
    })

    chart.dateFormatter.inputDateFormat = "MM-dd-yyyy"
    dateAxis.baseInterval = {
      timeUnit: "interval",
      count: 1,
    }

    chart.cursor = new am4charts.XYCursor()
    chart.cursor.lineY.disabled = true
    chart.cursor.lineX.disabled = true

    chart.legend = new am4charts.Legend()
    chart.legend.fontFamily = "Roboto, sans-serif"
    chart.legend.fontSize = 14
    chart.legend.useDefaultMarker = true
    chart.legend.itemContainers.template.paddingTop = 5
    chart.legend.itemContainers.template.paddingBottom = 5

    let marker = chart.legend.markers.template.children.getIndex(0)
    marker.cornerRadius(12, 12, 12, 12)
    marker.width = 14
    marker.height = 14

    chart.data = data

    setChart(chart)
  }

  const destroyChart = () => {
    if (componentChart) {
      componentChart.dispose()
    }
  }

  useEffect(() => {
    return () => {
      destroyChart()
    }
  }, [])

  useEffect(() => {
    destroyChart()
    if (hasAvailableData) {
      buildChart()
    }
  }, [data])

  return (
    <>
      {hasAvailableData && <ChartDiv minHeight={minHeight} id={id} />}
      {!hasAvailableData && (
        <CenteredContainer height={minHeight}>
          {noDataMessage}
        </CenteredContainer>
      )}
    </>
  )
}

export default LineChart
