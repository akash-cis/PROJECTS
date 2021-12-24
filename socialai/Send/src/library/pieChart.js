import React, { useEffect, useState } from "react"
import * as am4core from "@amcharts/amcharts4/core"
import * as am4charts from "@amcharts/amcharts4/charts"
import { ChartColors, NOT_ENOUGH_DATA } from "./constants"
import am4themes_animated from "@amcharts/amcharts4/themes/animated"
import styled from "styled-components"
import PropTypes from "prop-types"
import GaugeChartInfo from "./gaugeChartInfo"
import { NoData } from "../library/basicComponents"

am4core.useTheme(am4themes_animated)

const ContainerDiv = styled.div`
  min-height: ${({ hasTeam }) => (hasTeam ? "300px" : "260px")};
  width: 100%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
`

const ChartDiv = styled.div`
  min-height: ${({ hasTeam }) => (hasTeam ? "240px" : "200px")};
  width: 100%;
  position: relative;
`

const LegendWrapper = styled.div`
  max-height: 60px;
  overflow-x: hidden;
  overflow-y: auto;
  width: 100%;
`

const LegendDiv = styled.div`
  width: 100%;
  height: ${({ length }) => length * 20 + "px"};
`

const ChartContainer = styled.div`
  position: relative;
`

const PieChart = ({
  info,
  data,
  middle = false,
  id = "pieDefault",
  noDataMessage = NOT_ENOUGH_DATA,
  ...props
}) => {
  const [componentChart, setChart] = useState(null)
  const hasAvailableData = data && data[0]
  let error

  const buildChart = () => {
    if (componentChart) {
      destroyChart()
    }

    try {
      let chart = am4core.create(id, am4charts.PieChart)
      chart.innerRadius = middle ? am4core.percent(90) : am4core.percent(0)

      let category, value
      if (hasAvailableData) [category, value] = Object.keys(data[0])

      let pieSeries = chart.series.push(new am4charts.PieSeries())
      pieSeries.dataFields.category = category
      pieSeries.dataFields.value = value
      pieSeries.labels.template.disabled = true
      pieSeries.ticks.template.disabled = true
      pieSeries.colors.list = ChartColors.map(color => am4core.color(color))

      let legendCntr = am4core.create(id + "-legend", am4core.Container)
      legendCntr.width = am4core.percent(100)
      legendCntr.height = am4core.percent(100)

      chart.legend = new am4charts.Legend()
      chart.legend.parent = legendCntr
      chart.legend.fontFamily = "Roboto, sans-serif"
      chart.legend.fontSize = 12
      chart.legend.useDefaultMarker = true

      if (data.length > 3) {
        // chart.legend.labels.template.maxWidth = am4core.percent(90);
        chart.legend.labels.template.truncate = true
        chart.legend.labels.template.fullWords = true
        chart.legend.itemContainers.template.width = am4core.percent(45)
        chart.legend.labels.template.width = am4core.percent(90)
      }

      chart.legend.itemContainers.template.paddingBottom = -3
      chart.legend.itemContainers.template.paddingTop = 0
      chart.legend.itemContainers.template.paddingLeft = 10
      chart.legend.itemContainers.template.paddingRight = 0
      chart.legend.itemContainers.template.margin = (0, 0, 0, 0)
      chart.legend.markers.template.paddingTop = 6
      chart.legend.markers.template.paddingBottom = 0

      let marker = chart.legend.markers.template.children.getIndex(0)
      marker.cornerRadius(12, 12, 12, 12)
      marker.width = 10
      marker.height = 10

      chart.data = data
      setChart(chart)
    } catch (e) {
      error = "Not enough data"
    }
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
    buildChart()
    return () => {
      destroyChart()
    }
  }, [data])

  return (
    <ContainerDiv {...props}>
      {hasAvailableData && (
        <div>
          <ChartContainer>
            <ChartDiv id={id} {...props}></ChartDiv>
            {info && <GaugeChartInfo {...props} />}
          </ChartContainer>
          <LegendWrapper>
            <LegendDiv
              id={id + "-legend"}
              length={Math.ceil(data.length / 2)}
            />
          </LegendWrapper>
        </div>
      )}
      {!hasAvailableData && (
        <NoData>
          {noDataMessage.split("\n").map(item => (
            <p>{item}</p>
          ))}
        </NoData>
      )}
    </ContainerDiv>
  )
}

PieChart.propTypes = {
  data: PropTypes.array,
}

export default PieChart
