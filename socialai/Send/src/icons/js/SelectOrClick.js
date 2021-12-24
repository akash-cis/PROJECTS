import React from "react";

const SvgSelectOrClick = props => (
  <svg width={24} height={24} {...props}>
    <path
      fill="none"
      stroke="#5E5E5E"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M10.536 11.568l2.68 8.931a.83.83 0 001.382.349l1.365-1.365 3.522 3.522a.83.83 0 001.174 0l2.348-2.348a.83.83 0 000-1.174l-3.522-3.522L20.85 14.6a.83.83 0 00-.348-1.382l-8.932-2.68a.831.831 0 00-1.034 1.03zM21.723 10.5A10.5 10.5 0 1010.5 21.721M16.813 9A6 6 0 109 16.811"
    />
  </svg>
);

export default SvgSelectOrClick;
