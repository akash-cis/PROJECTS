import React from "react";

const SvgVerticalBar = props => (
  <svg width={24} height={24} {...props}>
    <path
      fill="none"
      stroke="stroke"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M6 12.25a.75.75 0 01.743.648L6.75 13v9.75h-4.5V13a.75.75 0 01.648-.743L3 12.25h3zm4.5-9h3a.75.75 0 01.743.648L14.25 4v18.75h-4.5V4a.75.75 0 01.648-.743l.102-.007h3zM21 7.75a.75.75 0 01.75.75h0v14.25h-4.5V8.5a.75.75 0 01.75-.75h0z"
    />
  </svg>
);

export default SvgVerticalBar;
