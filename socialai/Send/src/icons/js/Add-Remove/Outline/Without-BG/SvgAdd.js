import React from "react";

const SvgAdd = ({ fill = "#e5e5e5", size = 24, ...props }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...props}>
        <path fill={fill} d="M24 10h-10v-10h-4v10h-10v4h10v10h4v-10h10z" />
    </svg>
);

export default SvgAdd;
