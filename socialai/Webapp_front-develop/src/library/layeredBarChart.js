import React from "react"
import * as am4core from "@amcharts/amcharts4/core"
import * as am4charts from "@amcharts/amcharts4/charts"
import styled from "styled-components"
import { ChartColors, NOT_ENOUGH_DATA } from "../library/constants"
import { CenteredContainer } from "./basicComponents"

const ChartDiv = styled.div`
  min-height: ${props => (props.minHeight ? props.minHeight : "350px")};
  width: 100%;
`
const amcoreColors = () => {
  return ChartColors.map(color => am4core.color(color))
}

const LayeredChart = ({
  id = "layered",
  data,
  minHeight = "350px",
  noDataMessage = NOT_ENOUGH_DATA,
}) => {
  const [componentChart, setChart] = React.useState(null)
  const hasAvailableData = data && data.length > 0

  const buildChart = () => {
    // Create chart instance
    let chart = am4core.create(id, am4charts.XYChart)
    chart.colors.list = amcoreColors()
    // Add percent sign to all numbers
    // chart.numberFormatter.numberFormat = "#.#'%'"

    // Create axes
    const [category, front, back] = Object.keys(data[0])
    // const category = "userName"
    // const front = "time"
    // const back = "previous"
    let categoryAxis = chart.yAxes.push(new am4charts.CategoryAxis())
    categoryAxis.dataFields.category = category
    categoryAxis.renderer.grid.template.location = 0
    categoryAxis.renderer.minGridDistance = 30

    let valueAxis = chart.xAxes.push(new am4charts.DurationAxis())
    // valueAxis.title.text = "GDP growth rate"
    valueAxis.title.fontWeight = 800

    // Create series
    let series = chart.series.push(new am4charts.ColumnSeries())
    series.dataFields.valueX = back
    series.dataFields.categoryY = category
    series.clustered = false
    series.fillOpacity = 0.5
    series.tooltipText = "Previous: [bold]{valueX.formatDuration()}[/]"
    series.columns.template.height = am4core.percent(60)
    series.columns.template.column.cornerRadius(0, 5, 0, 5)
    series.columns.template.adapter.add("fill", (fill, target) => {
      return target.dataItem
        ? chart.colors.getIndex(target.dataItem.index)
        : fill
    })
    series.columns.template.adapter.add("stroke", (fill, target) => {
      return target.dataItem
        ? chart.colors.getIndex(target.dataItem.index)
        : fill
    })

    let series2 = chart.series.push(new am4charts.ColumnSeries())
    series2.dataFields.valueX = front
    series2.dataFields.categoryY = category
    series2.columns.template.height = am4core.percent(40)
    series2.clustered = false
    series2.columns.template.column.cornerRadius(0, 5, 0, 5)
    series2.tooltipText = "Current: [bold]{valueX.formatDuration()}[/]"
    series2.columns.template.adapter.add("fill", (fill, target) => {
      return target.dataItem
        ? chart.colors.getIndex(target.dataItem.index)
        : fill
    })
    series2.columns.template.adapter.add("stroke", (fill, target) => {
      return target.dataItem
        ? chart.colors.getIndex(target.dataItem.index)
        : fill
    })
    var label = series2.bullets.push(new am4charts.LabelBullet())
    label.label.text = "{valueX.formatDuration()}"
    label.label.fill = am4core.color("#fff")
    label.label.strokeWidth = 0
    label.label.truncate = false
    label.label.hideOversized = true
    label.locationX = 0.5

    chart.cursor = new am4charts.XYCursor()

    chart.cursor.lineX.disabled = true
    chart.cursor.lineY.disabled = true
    chart.data = data

    setChart(chart)
  }

  const destroyChart = () => {
    if (componentChart) {
      componentChart.dispose()
    }
  }

  React.useEffect(() => {
    return () => {
      destroyChart()
    }
  }, [])

  React.useEffect(() => {
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

export default LayeredChart
