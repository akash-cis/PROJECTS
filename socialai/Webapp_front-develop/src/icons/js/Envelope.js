import React from "react";

const SvgEnvelope = props => (
  <svg width={24} height={24} {...props}>
    <path
      fill="none"
      stroke="#5E5E5E"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M2.25 4.5h19.5a1.5 1.5 0 011.5 1.5v12a1.5 1.5 0 01-1.5 1.5H2.25A1.5 1.5 0 01.75 18V6a1.5 1.5 0 011.5-1.5zm13.437 5.475L19.5 13.5M8.313 9.975L4.5 13.5m18.38-8.486l-9.513 6.56a2.406 2.406 0 01-2.734 0L1.12 5.014"
    />
  </svg>
);

export default SvgEnvelope;
