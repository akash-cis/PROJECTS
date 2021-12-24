import React from "react";
import { css } from "styled-components";
const SvgCircularRemove = ({
  border = {
    default: "#EEEEF1",
    hover: "#000",
    focus: "#000"
  },
  color = {
    default: "#5E5E5E",
    hover: "#000",
    focus: "#000"
  },
  ...props
}) => (
  <svg
    width={24}
    height={24}
    {...props}
    css={`
      &:hover g > circle {
        stroke: ${border.hover};
      }
      &:focus g > circle {
        stroke: ${border.focus};
      }
      &:hover g > path {
        stroke: ${color.hover};
      }
      &:focus g > path {
        stroke: ${color.focus};
      }
    `}
  >
    <g fill='none' fillRule='evenodd'>
      <circle cx={12} cy={12} r={11} fill='#FFF' />
      <circle
        cx={12}
        cy={11.999}
        r={11.25}
        stroke={border.default}
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={1.5}
      />
      <path
        stroke={color.default}
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={1.5}
        d='M7.5 7.499l9 9m-9 0l9-9'
      />
    </g>
  </svg>
);

export default SvgCircularRemove;
