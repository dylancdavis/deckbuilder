import * as React from "react";
const SvgComponent = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    xmlSpace="preserve"
    width={125}
    height={175}
    viewBox="-1 -1.4 127 177.8"
    {...props}
  >
    <path
      strokeLinecap="round"
      d="M32.903-86.129h-69.677L-61.29 4.194h49.032L-27.74 86.129 61.29-20.323H9.032z"
      style={{
        stroke: "#000",
        strokeWidth: 2,
        strokeDasharray: "none",
        strokeLinecap: "butt",
        strokeDashoffset: 0,
        strokeLinejoin: "miter",
        strokeMiterlimit: 4,
        fill: "#fff",
        fillRule: "nonzero",
        opacity: 1,
      }}
      transform="matrix(1.01974 0 0 1.01592 62.5 87.5)"
    />
  </svg>
);
export default SvgComponent;
