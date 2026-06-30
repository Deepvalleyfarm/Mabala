import React from "react";

interface MabalaLogoProps {
  className?: string;
  size?: number; // width/height of the icon/logo container
  variant?: "full" | "icon-only";
  theme?: "light" | "dark"; // 'light' is for light backgrounds (dark text), 'dark' is for dark backgrounds (white text)
}

export default function MabalaLogo({
  className = "",
  size = 40,
  variant = "full",
  theme = "light"
}: MabalaLogoProps) {
  const textColor = theme === "light" ? "text-slate-900" : "text-white";
  const subtextColor = theme === "light" ? "text-slate-500" : "text-emerald-400";
  const cardStroke = theme === "light" ? "#475569" : "#94a3b8";
  const cardFill = theme === "light" ? "#ffffff" : "#1e293b";

  // Calculate proportional dimensions
  const aspectRatio = variant === "full" ? "aspect-[1/1]" : "aspect-square";

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      <svg
        viewBox="0 0 200 200"
        style={{ width: size, height: size }}
        className={`shrink-0 ${aspectRatio}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Ground / Soil curve */}
        <path
          d="M45 142C80 132 120 132 155 142C130 146 70 146 45 142Z"
          fill="#78350f" // rich brown soil
          opacity="0.9"
        />
        <path
          d="M60 141C90 134 110 134 140 141C120 144 80 144 60 141Z"
          fill="#451a03" // darker shadow soil
        />

        {/* Card / Tablet behind the stem */}
        <rect
          x="104"
          y="72"
          width="48"
          height="34"
          rx="5"
          fill={cardFill}
          stroke={cardStroke}
          strokeWidth="3.5"
        />
        {/* Small tablet lines inside */}
        <line x1="112" y1="81" x2="132" y2="81" stroke={cardStroke} strokeWidth="2.5" strokeLinecap="round" />
        <line x1="112" y1="88" x2="140" y2="88" stroke={cardStroke} strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="138" cy="81" r="2.5" fill="#eab308" /> {/* gold indicator on card */}

        {/* Plant Stem */}
        <path
          d="M100 140C99 120 98 100 100 55"
          stroke="#15803d" // beautiful forest green stem
          strokeWidth="5"
          strokeLinecap="round"
        />

        {/* Central Yellow/Gold Leaf (Middle top) */}
        <path
          d="M100 55C86 35 100 12 100 12C100 12 114 35 100 55Z"
          fill="#f59e0b" // gold leaf
          stroke="#d97706"
          strokeWidth="1.5"
        />
        {/* Central leaf vein */}
        <path
          d="M100 45V15"
          stroke="#b45309"
          strokeWidth="1.5"
          strokeLinecap="round"
        />

        {/* Left Green Leaf */}
        <path
          d="M100 85C55 72 42 42 98 52C98 52 92 72 100 85Z"
          fill="#10b981" // emerald leaf
          stroke="#047857"
          strokeWidth="1.5"
        />
        {/* Left leaf vein */}
        <path
          d="M93 74C82 69 70 65 60 62"
          stroke="#047857"
          strokeWidth="1.5"
          strokeLinecap="round"
        />

        {/* Right Green Leaf */}
        <path
          d="M100 85C145 72 158 42 102 52C102 52 108 72 100 85Z"
          fill="#22c55e" // vibrant green leaf
          stroke="#15803d"
          strokeWidth="1.5"
        />
        {/* Right leaf vein */}
        <path
          d="M107 74C118 69 130 65 140 62"
          stroke="#15803d"
          strokeWidth="1.5"
          strokeLinecap="round"
        />

        {/* Minimal branding text inside the SVG itself for standard displays */}
        {variant === "full" && (
          <>
            {/* "Mabala" wordmark */}
            <text
              x="100"
              y="168"
              textAnchor="middle"
              className="font-sans"
              style={{
                fontFamily: "var(--font-sans), system-ui, sans-serif",
                fontWeight: 900,
                fontSize: "25px",
                letterSpacing: "-0.05em",
              }}
              fill="currentColor"
            >
              Mabala
            </text>
            {/* Subtext tagline */}
            <text
              x="100"
              y="186"
              textAnchor="middle"
              className="font-sans"
              style={{
                fontFamily: "var(--font-sans), system-ui, sans-serif",
                fontWeight: 600,
                fontSize: "9.5px",
                letterSpacing: "0.02em",
                fontStyle: "italic",
              }}
              fill="currentColor"
            >
              Built for Farmers by a Farmer
            </text>
          </>
        )}
      </svg>

      {/* Render HTML text next to SVG if we are in full layout and not drawing text entirely inside SVG */}
      {variant === "full" && (
        <div className="font-sans select-none pointer-events-none leading-none">
          <span className={`font-black text-[15px] tracking-tight block ${textColor}`}>
            Mabala
          </span>
          <span className={`text-[8.5px] font-bold uppercase tracking-wider block mt-0.5 ${subtextColor}`}>
            Agro OS
          </span>
        </div>
      )}
    </div>
  );
}
