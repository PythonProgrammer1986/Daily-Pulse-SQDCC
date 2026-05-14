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
        {/* Epiroc Hexagon symbol */}
        <path
          className="cls-hex"
          d="M45,0 L90,26 L90,78 L45,104 L0,78 L0,26 Z M45,18 L75,35 L75,69 L45,86 L15,69 L15,35 Z"
          fillRule="evenodd"
        />
        {/* Inner 'e' shape */}
        <path
          className="cls-hex"
          d="M15,45 L45,62 L75,45 L75,55 L45,72 L15,55 Z"
        />
        <path className="cls-hex" d="M15,55 L45,72 L45,86 L15,69 Z" />

        {/* Text */}
        <text x="110" y="80" className="cls-text">
          Epiroc
        </text>
      </g>
    </svg>
  );
};
