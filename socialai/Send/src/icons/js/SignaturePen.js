import React from "react";

const SvgSignaturePen = props => (
  <svg width={24} height={24} {...props}>
    <path
      fill="none"
      stroke="#5E5E5E"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M12.037 23.25c.75-.75 6.213-11.769 6.213-11.769a3 3 0 00-.1-2.456l-2.4-3.775h-7.5l-2.4 3.775a3 3 0 00-.1 2.456S11.287 22.5 12.037 23.25zM12 16.5v-4.02m0 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm3.75-7.23h-7.5L6.961 1.98A.75.75 0 017.537.75h9a.75.75 0 01.576 1.23L15.75 5.25z"
    />
  </svg>
);

export default SvgSignaturePen;
