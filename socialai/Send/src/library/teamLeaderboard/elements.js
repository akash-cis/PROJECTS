import styled from "styled-components"
import React from "react"
import humanizeDuration from "humanize-duration"

export const ProgressLine = styled.div`
  width: 100%;
  height: 4px;
  border-radius: 3px;
  background-color: #eeeef1;
  position: relative;

  &:before {
    content: "";
    height: 4px;
    width: ${props => `${props.progress}%`};
    border-radius: 3px;
    background-color: #006593;
    position: absolute;
    left: 0;
  }
`

export const ProgressBar = ({ value, total, percentage, time }) => {
  const shortEnglishHumanizer = humanizeDuration.humanizer({
    language: "shortEn",
    languages: {
      shortEn: {
        y: () => "y",
        mo: () => "mo",
        w: () => "w",
        d: () => "d",
        h: () => "h",
        m: () => "m",
        s: () => "s",
        ms: () => "ms",
      },
    },
  })

  return (
    <div>
      {time ? shortEnglishHumanizer(value * 1000) : value}
      {percentage && "%"}
      <ProgressLine progress={(value * 100) / total} />
    </div>
  )
}
