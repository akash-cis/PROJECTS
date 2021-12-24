import React, { useState, useEffect } from "react"
import * as am4core from "@amcharts/amcharts4/core"
import * as am4charts from "@amcharts/amcharts4/charts"
import { CenteredContainer } from "./basicComponents"
import { NOT_ENOUGH_DATA } from "./constants"

const TreeMap = ({
  data,
  noDataMessage = NOT_ENOUGH_DATA,
  minHeight = "450px",
  onLevel1Click
}) => {
  const [componentChart, setChart] = useState(null)
  const hasAvailableData = data && data.length > 0

  const buildChart = () => {
    let chart = am4core.create("tree-map", am4charts.TreeMap)
    chart.hiddenState.properties.opacity = 0

    chart.maxLevels = 1
    chart.dataFields.value = "count"
    chart.dataFields.name = "name"
    chart.dataFields.children = "children"

    let level0SeriesTemplate = chart.seriesTemplates.create("0")
    level0SeriesTemplate.strokeWidth = 2

    level0SeriesTemplate.bulletsContainer.hiddenState.properties.opacity = 1
    level0SeriesTemplate.bulletsContainer.hiddenState.properties.visible = true

    let hoverState = level0SeriesTemplate.columns.template.states.create(
      "hover"
    )

    hoverState.adapter.add("fill", (fill, target) => {
      return am4core.color(am4core.colors.brighten(fill.rgb, -0.2))
    })
    let level1SeriesTemplate = chart.seriesTemplates.create("1")
    let bullet1 = level1SeriesTemplate.bullets.push(new am4charts.LabelBullet())
    bullet1.locationX = 0.5
    bullet1.locationY = 0.5
    bullet1.label.text = "{name}"
    bullet1.label.fill = am4core.color("#ffffff")
    bullet1.label.cursorOverStyle = am4core.MouseCursorStyle.pointer;

    bullet1.label.events.on("hit", (ev, d) => {
      if(onLevel1Click){
        onLevel1Click(ev.target.dataItem.dataContext, ev.target.parent.parent.dataItem.dataContext)
      }
    });

    level1SeriesTemplate.columns.template.fillOpacity = 0

    level1SeriesTemplate.columns.template.events.on("hit", (ev, d) => {
      if(onLevel1Click){
        onLevel1Click(ev.target.dataItem.dataContext, ev.target.parent.dataItem.dataContext)
      }
    });

    // level2 series template
    var level2SeriesTemplate = chart.seriesTemplates.create("2")
    var bullet2 = level2SeriesTemplate.bullets.push(new am4charts.LabelBullet())
    bullet2.locationX = 0.5
    bullet2.locationY = 0.5
    bullet2.label.text = "{name}"
    bullet2.label.fill = am4core.color("#ffffff")

    // level3 series template
    var level3SeriesTemplate = chart.seriesTemplates.create("3")
    var bullet3 = level3SeriesTemplate.bullets.push(new am4charts.LabelBullet())
    bullet3.locationX = 0.5
    bullet3.locationY = 0.5
    bullet3.label.text = "{name}"
    bullet3.label.fill = am4core.color("#ffffff")

    // add image
    var image = level0SeriesTemplate.columns.template.createChild(am4core.Image)
    image.opacity = 0.15
    image.align = "center"
    image.valign = "middle"
    image.width = am4core.percent(80)
    image.height = am4core.percent(80)

    // add adapter for href to load correct image
    image.adapter.add("href", function(href, target) {
      var dataItem = target.parent.dataItem
      if (dataItem) {
        return (
          "/auto_logos/" + dataItem.treeMapDataItem.name.toLowerCase() + ".png"
        )
      }
    })

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
  }, [data])

  return (
    <>
      {hasAvailableData && (
        <div id="tree-map" style={{ width: "100%", minHeight }} />
      )}
      {!hasAvailableData && (
        <CenteredContainer height={minHeight}>
          {noDataMessage}
        </CenteredContainer>
      )}
    </>
  )
}

export default TreeMap
