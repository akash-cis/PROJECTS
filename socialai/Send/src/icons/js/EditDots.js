import React from "react";

const SvgEditDots = props => (
  <svg width={24} height={24} {...props}>
    <g fill="#5E5E5E" fillRule="evenodd">
      <circle cx={12} cy={4} r={2} />
      <circle cx={12} cy={12} r={2} />
      <circle cx={12} cy={20} r={2} />
    </g>
  </svg>
);

export default SvgEditDots;
