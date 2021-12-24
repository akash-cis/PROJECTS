import React from "react";

const SvgLine = props => (
  <svg width={24} height={24} {...props}>
    <path
      fill='none'
      stroke='stroke'
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth={1.5}
      d='M.749 23.25h21.75M6.883 10.121l-4.017 4.013m11.445-2.809l-4.674-1.25m10.755-2.186l-3.581 2.8m-8.562.312a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM21.75 8.75a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm-6 4.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM2.249 17.001a1.5 1.5 0 100-3 1.5 1.5 0 000 3z'
    />
  </svg>
);

export default SvgLine;
