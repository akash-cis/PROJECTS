import React from "react";

const SvgCircularRemove = ({
    border = {
        default: "#EEEEF1",
        hover: "#000",
        focus: "#000"
    },
    color = {
        default: "#5E5E5E",
        hover: "#000",
        focus: "#000"
    },
    size = 24,
    stroke = "blue",
    ...props
}) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        {...props}
        css={`
            &:hover > path {
                stroke: ${border.hover};
            }
            &:focus > path {
                stroke: ${color.focus};
            }
        `}>
        <path
            fill="none"
            stroke={stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 23.249c6.213 0 11.25-5.037 11.25-11.25S18.213.749 12 .749.75 5.786.75 11.999 5.787 23.249 12 23.249zm-4.5-6.75l9-9m0 9l-9-9"
        />
    </svg>
);

export default SvgCircularRemove;
