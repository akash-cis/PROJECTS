import React from "react";

const SvgHorizontalBar = props => (
  <svg width={24} height={24} {...props}>
    <path
      fill="none"
      stroke="#5E5E5E"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M.75.75v22.5h22.5M13.5 6.75H.75v-3H13.5a.766.766 0 01.767.767v1.466a.767.767 0 01-.767.767h0zm0 6H.75v-3H13.5a.766.766 0 01.767.767v1.466a.767.767 0 01-.767.767h0zm5.983 6H.75v-3h18.733a.766.766 0 01.767.767v1.466a.767.767 0 01-.767.767z"
    />
  </svg>
);

export default SvgHorizontalBar;
