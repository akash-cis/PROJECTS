import React from "react";

const SvgCalendar = props => (
  <svg width={24} height={24} {...props}>
    <g
      fill="none"
      fillRule="evenodd"
      stroke="#5E5E5E"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
    >
      <rect width={22.5} height={19.5} x={0.752} y={3.75} rx={1.5} />
      <path d="M.752 9.75h22.5M6.752 6V.75M17.252 6V.75" />
    </g>
  </svg>
);

export default SvgCalendar;
