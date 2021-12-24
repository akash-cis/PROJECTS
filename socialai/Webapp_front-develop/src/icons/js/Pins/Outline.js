import React from "react";

const SvgOutline = props => (
  <svg width={24} height={24} {...props}>
    <path
      fill="none"
      stroke="#5E5E5E"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M12 12a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5zM12 .75a7.5 7.5 0 017.5 7.5c0 3.407-5.074 11.95-6.875 14.665a.75.75 0 01-1.25 0C9.574 20.2 4.5 11.657 4.5 8.25A7.5 7.5 0 0112 .75z"
    />
  </svg>
);

export default SvgOutline;
