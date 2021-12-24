import React from "react";

const SvgCircularAdd = props => (
    <svg width={24} height={24} {...props}>
        <g fill="none" fillRule="evenodd">
            <circle cx={12} cy={12} r={11} fill="#FFF" />
            <circle cx={12} cy={11.999} r={11.25} stroke="#EEEEF1" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} />
            <path
                stroke="#5E5E5E"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M5.636 11.999h12.728M12 18.363V5.635"
            />
        </g>
    </svg>
);

export default SvgCircularAdd;
