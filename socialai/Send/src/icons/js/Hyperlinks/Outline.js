import React from "react";

const SvgOutline = props => (
  <svg width={24} height={24} {...props}>
    <path
      fill="none"
      stroke="#5E5E5E"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M6.75 17.249l10.5-10.5m-9.515 5.272a4.472 4.472 0 00-3.417 1.3l-2.25 2.25a4.5 4.5 0 006.364 6.364l2.25-2.25a4.472 4.472 0 001.3-3.417m4.283-4.292a4.473 4.473 0 003.417-1.3l2.25-2.25a4.5 4.5 0 00-6.364-6.364l-2.25 2.25a4.475 4.475 0 00-1.295 3.417"
    />
  </svg>
);

export default SvgOutline;
