import React from "react"
import { colorSchemes } from "../molecules/ProgressBar2"
import TimeProgressBar from "../molecules/TimeProgressBar"
import Typography from "../atoms/Typography"
// asumes time is in seconds
Array.prototype.groupBy = function(funcProp) {
  return this.reduce(function(acc, val) {
    ;(acc[funcProp(val)] = acc[funcProp(val)] || []).push(val)
    return acc
  }, {})
}
let a = []
for (const [id, entries] of Object.entries(
  window.usage.users.groupBy(event => event["id"])
)) {
  a.push(entries[0])
}
const TimeUsageComparison = ({ data, ...props }) => {
  const maxTime = (() => {
    let MaxVal = -Infinity
    for (var i = 0; i < data.length; i++) {
      let currentEntryMax = Math.max(data[i].prev.value, data[i].current.vale)
      if (MaxVal < currentEntryMax) MaxVal = currentEntryMax
    }
    return MaxVal
  })()
  const maxWidth = maxTime
  return (
    <table>
      <tbody>
        {data.map(({ id, name, prev, current }, index) => (
          <tr key={index}>
            <td
              css={`
                white-space: nowrap;
                overflow: hidden;
              `}
            >
              <Typography>{name}</Typography>
            </td>
            <td
              css={`
                width: 100%;
              `}
            >
              <TimeProgressBar
                key={id}
                prev={prev.value < 60 && prev.value > 0 ? 60 : prev.value}
                current={
                  current.value < 60 && current.value > 0 ? 60 : current.value
                }
                width={
                  (100 * Math.max(prev.value, current.value)) / maxWidth + "%"
                }
                color={colorSchemes[index % data.length]}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default TimeUsageComparison
