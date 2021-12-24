import React from "react";

const SvgCheckmark = props => (
  <svg width={24} height={24} {...props}>
    <defs>
      <path
        id='Checkmark_svg__a'
        d='M9.064 15.019l9.215-9.536a1.556 1.556 0 012.254 0 1.69 1.69 0 010 2.332L10.191 18.517a1.556 1.556 0 01-2.254 0l-4.47-4.626a1.69 1.69 0 010-2.332 1.556 1.556 0 012.254 0l3.343 3.46z'
      />
    </defs>
    <use fill='fill' fillRule='evenodd' xlinkHref='#Checkmark_svg__a' />
  </svg>
);

export default SvgCheckmark;
