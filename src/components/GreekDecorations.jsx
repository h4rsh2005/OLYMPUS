import React from 'react';

/**
 * Classical Greek Ornamental SVGs and Crests
 * Styled with ancient stone, bronze, and subtle divine gold accents.
 */

// Greek Key (Meander) Corner Ornament
export function GreekCorner({ className = "", position = "top-left" }) {
  const getRotation = () => {
    switch (position) {
      case "top-right": return "rotate-90";
      case "bottom-right": return "rotate-180";
      case "bottom-left": return "-rotate-90";
      default: return "";
    }
  };

  return (
    <div className={`pointer-events-none absolute w-10 h-10 ${getRotation()} ${className}`}>
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-slate-400/20">
        <path
          d="M5 5 H95 V25 H30 V45 H70 V65 H50 V75 H60 V95 H5 Z"
          stroke="currentColor"
          strokeWidth="3.5"
          fill="none"
        />
        <circle cx="15" cy="15" r="3" fill="currentColor" />
      </svg>
    </div>
  );
}

// Mount Olympus Crest / Divine Sun Sigil
export function OlympusSigil({ className = "" }) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Outer rotating celestial ring */}
      <svg
        viewBox="0 0 200 200"
        className="w-full h-full animate-spin-very-slow text-amber-200/25"
      >
        <circle cx="100" cy="100" r="90" stroke="currentColor" strokeWidth="1.2" strokeDasharray="6 8" fill="none" />
        <circle cx="100" cy="100" r="82" stroke="currentColor" strokeWidth="0.75" fill="none" opacity="0.5" />
        {/* 12 Olympian Ray Markers */}
        {[...Array(12)].map((_, i) => {
          const angle = (i * 30 * Math.PI) / 180;
          const x1 = 100 + Math.cos(angle) * 82;
          const y1 = 100 + Math.sin(angle) * 82;
          const x2 = 100 + Math.cos(angle) * 94;
          const y2 = 100 + Math.sin(angle) * 94;
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="currentColor" strokeWidth="1.5" />;
        })}
      </svg>

      {/* Inner counter-rotating ring with Greek runes */}
      <svg
        viewBox="0 0 160 160"
        className="absolute w-[80%] h-[80%] animate-spin-reverse-slow text-amber-200/40"
      >
        <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="1" strokeDasharray="3 6" fill="none" />
        <polygon points="80,18 95,72 150,80 95,88 80,142 65,88 10,80 65,72" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.4" />
      </svg>

      {/* Center Olympian Mountain & Lightning Crest */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-amber-200">
        <svg viewBox="0 0 100 100" className="w-1/2 h-1/2 text-amber-200/80">
          {/* Mountain Silhouette */}
          <polygon points="50,15 88,85 12,85" stroke="#FDE68A" strokeWidth="2.0" fill="rgba(180, 83, 9, 0.12)" />
          {/* Peak Snow / Divine Crown */}
          <polygon points="50,15 62,38 54,34 50,42 46,34 38,38" fill="#FFFFFF" opacity="0.85" />
          {/* Lightning Bolt of Zeus */}
          <path
            d="M53 38 L44 56 L52 56 L47 75 L61 52 L52 52 Z"
            fill="#FDE68A"
            stroke="#FFFFFF"
            strokeWidth="0.5"
            className="animate-pulse"
          />
        </svg>
      </div>
    </div>
  );
}

// Laurel Wreath ornament for buttons and headers
export function LaurelWreath({ className = "" }) {
  return (
    <svg viewBox="0 0 120 40" fill="none" className={`text-amber-200/40 ${className}`}>
      <path
        d="M60 20 C45 20 30 12 10 28 M60 20 C75 20 90 12 110 28"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      {/* Laurel leaves left */}
      <circle cx="25" cy="18" r="2.5" fill="currentColor" />
      <circle cx="38" cy="14" r="3" fill="currentColor" />
      <circle cx="50" cy="17" r="3" fill="currentColor" />
      {/* Laurel leaves right */}
      <circle cx="95" cy="18" r="2.5" fill="currentColor" />
      <circle cx="82" cy="14" r="3" fill="currentColor" />
      <circle cx="70" cy="17" r="3" fill="currentColor" />
      {/* Center Star */}
      <polygon points="60,8 62,14 68,14 63,18 65,24 60,20 55,24 57,18 52,14 58,14" fill="#FDE68A" />
    </svg>
  );
}
