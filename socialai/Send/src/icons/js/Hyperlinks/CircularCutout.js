import React from "react";

const SvgCircularCutout = props => (
  <svg width={24} height={24} {...props}>
    <path
      fill="#5E5E5E"
      fillRule="evenodd"
      d="M12 0c6.627 0 12 5.373 12 12s-5.373 12-12 12S0 18.627 0 12 5.373 0 12 0zM7.117 11.228l-2.06 2.057a2.913 2.913 0 000 4.114l1.544 1.543a2.91 2.91 0 004.113 0l2.058-2.057c.623-.625.81-1.562.473-2.378a.727.727 0 10-1.345.556.727.727 0 01-.157.793l-2.057 2.057a1.455 1.455 0 01-2.057 0l-1.543-1.542a1.455 1.455 0 010-2.058l2.06-2.056a.737.737 0 01.793-.158.727.727 0 10.555-1.345 2.207 2.207 0 00-2.377.474zM14.572 8.4l-5.658 5.657a.727.727 0 000 1.028c.286.28.743.28 1.029 0L15.6 9.428a.727.727 0 00-1.028-1.029zm-1.286-3.342l-2.058 2.056a2.186 2.186 0 00-.473 2.378.727.727 0 101.345-.556.727.727 0 01.157-.79l2.057-2.056a1.455 1.455 0 012.058 0l1.542 1.542a1.455 1.455 0 010 2.058l-2.06 2.053a.738.738 0 01-.793.158.728.728 0 10-.556 1.344 2.2 2.2 0 002.378-.473l2.057-2.057a2.914 2.914 0 00.003-4.115L17.4 5.057a2.913 2.913 0 00-4.114 0z"
    />
  </svg>
);

export default SvgCircularCutout;