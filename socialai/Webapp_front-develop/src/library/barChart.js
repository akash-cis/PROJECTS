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

const KpiBarChart = ({
  data,
  id = "bar-chart",
  period,
  interval = period > 60 ? "month" : "day",
  goals = false,
  horizontal,
  labels,
  dateLabels = false,
  noLegend = false,
  color,
  noDataMessage = NOT_ENOUGH_DATA,
  minHeight = "260px",
  yAxis,
}) => {
  const [componentChart, setChart] = useState(null)
  const hasAvailableData = data && data.length > 0
  const buildChart = () => {
    let chart = am4core.create(id, am4charts.XYChart)
    if (color) {
      chart.colors.list = [am4core.color(color)]
    } else {
      chart.colors.list = amcoreColors()
    }
    const [date, ...series] = Object.keys(data[0])
    let dateAxis = chart.xAxes.push(
      horizontal ? new am4charts.ValueAxis() : new am4charts.DateAxis()
    )
    if (!dateLabels) dateAxis.renderer.labels.template.disabled = true
    if (!horizontal) dateAxis.dataFields.category = date
    if (!yAxis) {
      dateAxis.renderer.grid.template.strokeOpacity = 0
    }
    // dateAxis.renderer.labels.template.opacity = 0
    // dateAxis.renderer.labels.template.fontSize = 12

    let valueAxis = chart.yAxes.push(
      horizontal ? new am4charts.DateAxis() : new am4charts.ValueAxis()
    )
    if (horizontal) {
      valueAxis.dataFields.category = date
    }
    valueAxis.renderer.grid.template.strokeOpacity = 0.1
    valueAxis.renderer.grid.template.strokeDasharray = "8"
    if (!yAxis) {
      valueAxis.renderer.labels.template.disabled = true
      valueAxis.renderer.baseGrid.disabled = true
    }

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
      let newSeries = chart.series.push(new am4charts.ColumnSeries())
      newSeries.dataFields[horizontal ? "valueX" : "valueY"] = value
      newSeries.name = value
      newSeries.dataFields[horizontal ? "dateY" : "dateX"] = date
      if (horizontal) {
        newSeries.columns.template.column.cornerRadius(0, 5, 0, 5)
      } else {
        newSeries.columns.template.column.cornerRadius(5, 5, 0, 0)
      }
      newSeries.name = value.charAt(0).toUpperCase() + value.slice(1)
      newSeries.columns.template.tooltipText =
        interval === "day"
          ? `${
              horizontal
                ? "{name}: [bold]{valueX}"
                : "{dateX.formatDate('MMM d')}\n{name}: [bold]{valueY}"
            }`
          : `${
              horizontal
                ? "{name}: [bold]{valueX}"
                : "{dateX.formatDate('MMM yyyy')}\n{name}: [bold]{valueY}"
            }`

      if (horizontal) {
        var label = newSeries.bullets.push(new am4charts.LabelBullet())
        label.label.text = "{name} • {valueX}"
        label.label.fill = am4core.color("#fff")
        label.label.strokeWidth = 0
        label.label.truncate = false
        label.label.hideOversized = true
        label.locationX = 0.5
      }

      return newSeries
    })

    chart.dateFormatter.inputDateFormat = "MM-dd-yyyy"
    dateAxis.baseInterval = {
      timeUnit: interval,
      count: 1,
    }

    if (!noLegend) {
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
    }

    chart.data = data

    setChart(chart)
  }

  const destroyChart = () => {
    if (componentChart) {
      componentChart.dispose()
      setChart(null)
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
  }, [data, goals])

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

export default KpiBarChart
