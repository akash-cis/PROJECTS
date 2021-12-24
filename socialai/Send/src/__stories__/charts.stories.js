import React from "react"
import PieChart from "../library/pieChart"
import GaugeChart from "../library/gaugeChart"
import LineChart from "../library/lineChart"
import BarChart from "../library/barChart"
import LeveledBarChart, {
  BarChartProvider,
} from "../library/leveledBarChart"
import { Colors } from "../library/constants"
import LayeredBarChart from "../library/layeredBarChart"

export default {
  title: "Charts",
}

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
    year2004: 2.6,
    year2005: 4.9,
  },
]

const data = [
  { date: "07-20-2019", value: 10 },
  { date: "07-21-2019", value: 21 },
  { date: "07-22-2019", value: 2 },
  { date: "07-23-2019", value: 16 },
]

export const pieChart = () => <PieChart data={data} />

export const gaugeChart = () => (
  <GaugeChart hand noBubble value={55} total={100} />
)

export const lineChart = () => <LineChart data={data} />

export const barChart = () => <BarChart data={data} />
const maxObj = (data, attr) =>
  data.reduce(
    (prev, current) => (prev[attr] > current[attr] ? prev : current),
    -Infinity
  )

export const leveledBarChart = () => (
  <BarChartProvider>
    <LeveledBarChart
      id={"barMock"}
      data={data}
      period="day"
      level={{
        value: maxObj(data, "value").value,
        color: Colors.orange,
        text: "Best",
      }}
      duration
    />
  </BarChartProvider>
)

export const layeredBarChart = () => <LayeredBarChart data={layeredData} />
