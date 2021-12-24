import React, { useEffect, useState } from "react"
import * as am4core from "@amcharts/amcharts4/core"
import * as am4charts from "@amcharts/amcharts4/charts"
import { Colors } from "../constants"
import { InnerContainer } from "./elements"
import styled from "styled-components"
import GaugeChartInfo from "../gaugeChartInfo"

const ChartDiv = styled.div`
  min-height: 180px;
  width: 100%;
  margin-bottom: 2rem;
`

const Container = styled.div`
  position: relative;
`

const GaugeChart = ({
  value = 20,
  total = 100,
  id = "gaugeDefault",
  hand,
  children,
  ...props
}) => {
  const [componentChart, setChart] = useState(null)

  const buildChart = hand => {
    if (componentChart) {
      destroyChart()
    }

    // am4core.useTheme(am4themes_animated)
    let chart = am4core.create(id, am4charts.GaugeChart)
    chart.innerRadius = am4core.percent(95)
    chart.startAngle = -200
    chart.endAngle = 20
    chart.strokeLinecap = "round"
    chart.strokeLinejoin = "round"

    let axis = chart.xAxes.push(new am4charts.ValueAxis())
    axis.min = 0
    axis.max = total
    axis.renderer.radius = am4core.percent(95)
    axis.strictMinMax = true
    axis.renderer.inside = true
    axis.renderer.grid.template.disabled = true
    axis.renderer.labels.template.disabled = true
    axis.renderer.ticks.template.disabled = hand ? false : true
    axis.renderer.ticks.template.strokeOpacity = 0.1

    var axis2 = chart.xAxes.push(new am4charts.ValueAxis())
    axis2.min = 0
    axis2.max = total
    axis2.strictMinMax = true
    axis2.renderer.labels.template.disabled = true
    axis2.renderer.radius = am4core.percent(110)
    axis2.renderer.ticks.template.disabled = true
    axis2.renderer.grid.template.disabled = true

    let range = axis2.axisRanges.create()
    range.value = 0
    range.endValue = value
    range.axisFill.fill = am4core.color(Colors.green)
    range.axisFill.fillOpacity = 1
    range.axisFill.strokeWidth = 5

    let unusedRange = axis2.axisRanges.create()
    unusedRange.value = value
    unusedRange.endValue = total
    unusedRange.axisFill.fill = am4core.color(Colors.lightGray)
    unusedRange.strokeLinejoin = "round"
    unusedRange.axisFill.fillOpacity = 1
    unusedRange.axisFill.strokeWidth = 5
    unusedRange.axisFill.strokeLinejoin = "round"

    if (hand) {
      var hand = chart.hands.push(new am4charts.ClockHand())
      hand.height = am4core.percent(100)
      hand.axis = axis2
      hand.fill = am4core.color("#5E5E5E")
      hand.stroke = am4core.color("#5E5E5E")
      hand.strokeWidth = 5
      hand.strokeLinecap = "round"
      hand.strokeLinejoin = "round"
      hand.pin = new am4charts.CircleBullet()
      hand.pin.fill = am4core.color("#ffffff")
      hand.pin.stroke = am4core.color("#ffffff")
      hand.pin.strokeWidth = 0.5
      hand.startWidth = 10
      hand.value = value
    }

    chart.endValue = total
    chart.value = value

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
    buildChart(hand)
    return () => {
      destroyChart()
    }
  }, [value, total, hand])

  return (
    <Container>
      <ChartDiv id={id} />
      <GaugeChartInfo {...props} bottom={hand} value={value} total={total} />
      {children && <InnerContainer>{children}</InnerContainer>}
    </Container>
  )
}

export default GaugeChart
