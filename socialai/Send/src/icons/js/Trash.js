import React from "react";

const SvgTrash = props => (
  <svg width={24} height={24} {...props}>
    <path
      fill="none"
      stroke="#5E5E5E"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M1.751 6.368l20.541-4.366M13.6.783l-4.4.935A1.5 1.5 0 008.042 3.5l.312 1.468 7.336-1.56-.312-1.467A1.5 1.5 0 0013.6.783zM10.751 18v-7.5m4.5 7.5v-7.5M18.626 6h2.625l-1.385 15.874a1.5 1.5 0 01-1.5 1.376H7.631a1.5 1.5 0 01-1.494-1.376L5.1 9.377"
    />
  </svg>
);

export default SvgTrash;
