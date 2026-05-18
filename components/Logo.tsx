import React from "react";

export const Logo: React.FC<{ className?: string }> = ({
  className = "h-20 w-auto",
}) => {
  return (
    <svg
      viewBox="0 0 400 120"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <style>
          {`
            .cls-hex { fill: #3d4d5b; }
            .cls-text { fill: #3d4d5b; font-family: 'Arial', sans-serif; font-weight: 800; font-size: 80px; letter-spacing: -2px; }
            .dark .cls-hex { fill: #FDB913; }
            .dark .cls-text { fill: #ffffff; }
          `}
        </style>
      </defs>
      <g transform="translate(10, 15)">
        {/* Text */}
        <text x="0" y="80" className="cls-text">
          Epiroc
        </text>
      </g>
    </svg>
  );
};
