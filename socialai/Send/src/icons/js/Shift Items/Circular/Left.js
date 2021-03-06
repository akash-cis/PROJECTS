import React from "react";

const SvgLeft = props => (
  <svg width={24} height={24} {...props}>
    <g fill="none" fillRule="evenodd">
      <circle cx={12} cy={12} r={12} fill="#5E5E5E" />
      <path
        fill="#FFF"
        d="M17.691 5.304c.407.401.413 1.05.012 1.457l-5.21 5.135a.146.146 0 000 .208l5.21 5.135c.4.407.395 1.056-.012 1.457a1.065 1.065 0 01-1.478.012l-5.69-5.606a1.542 1.542 0 010-2.204l5.69-5.606a1.065 1.065 0 011.478.012zm-6.061 0c.407.401.412 1.05.012 1.457L6.43 11.896a.146.146 0 000 .208l5.21 5.135c.401.407.396 1.056-.011 1.457a1.065 1.065 0 01-1.479.012l-5.689-5.606a1.542 1.542 0 010-2.204l5.689-5.606a1.065 1.065 0 011.479.012z"
      />
    </g>
  </svg>
);

export default SvgLeft;
