import React from 'react';

interface HssePlnLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export const HssePlnLogo: React.FC<HssePlnLogoProps> = ({
  className = '',
  size = 'md',
  showText = true
}) => {
  const iconDimensions = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  }[size];

  const textStyles = {
    sm: 'text-[10px]',
    md: 'text-xs',
    lg: 'text-sm'
  }[size];

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`} title="HSSE PLN • K3 Keselamatan dan Kesehatan Kerja">
      {/* SVG Emblem HSSE PLN */}
      <div className={`${iconDimensions} relative shrink-0 flex items-center justify-center filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)]`}>
        <svg
          viewBox="0 0 200 200"
          className="w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Cyan/Blue Gear Outer Silhouette */}
          <path
            d="M 90,12 L 110,12 L 113,32 Q 123,35 132,41 L 149,29 L 163,43 L 151,60 Q 157,69 160,79 L 180,82 L 180,102 L 160,105 Q 157,115 151,124 L 163,141 L 149,155 L 132,143 Q 123,149 113,152 L 110,172 L 90,172 L 87,152 Q 77,149 68,143 L 51,155 L 37,141 L 49,124 Q 43,115 40,105 L 20,102 L 20,82 L 40,79 Q 43,69 49,60 L 37,43 L 51,29 L 68,41 Q 77,35 87,32 Z"
            fill="#009fe3"
          />

          {/* White Central Disk */}
          <circle cx="100" cy="92" r="54" fill="#ffffff" stroke="#009fe3" strokeWidth="4" />

          {/* Green Ring Outline */}
          <circle cx="100" cy="92" r="46" fill="#ffffff" stroke="#00a859" strokeWidth="6" />

          {/* Green K3 Medical/Safety Cross */}
          <path
            d="M 91,62 L 109,62 L 109,83 L 130,83 L 130,101 L 109,101 L 109,122 L 91,122 L 91,101 L 70,101 L 70,83 L 91,83 Z"
            fill="#00a859"
          />

          {/* Green Lotus/Pedal Foundation (Bottom Base Leaves) */}
          <g fill="#00a859">
            {/* Center Leaf */}
            <path d="M 100,132 C 90,146 88,172 100,188 C 112,172 110,146 100,132 Z" />
            {/* Left Leaf 1 */}
            <path d="M 86,136 C 70,146 58,166 70,182 C 86,174 88,154 86,136 Z" />
            {/* Right Leaf 1 */}
            <path d="M 114,136 C 130,146 142,166 130,182 C 114,174 112,154 114,136 Z" />
            {/* Left Leaf 2 (Outer) */}
            <path d="M 68,138 C 48,142 36,156 46,168 C 62,166 68,152 68,138 Z" />
            {/* Right Leaf 2 (Outer) */}
            <path d="M 132,138 C 152,142 164,156 154,168 C 138,166 132,152 132,138 Z" />
          </g>
        </svg>
      </div>

      {/* HSSE PLN Brand Typography */}
      {showText && (
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1.5 leading-none">
            <span className={`font-black tracking-tight text-cyan-300 uppercase ${textStyles} text-sm md:text-base drop-shadow-xs`}>
              HSSE PLN
            </span>
            <span className="px-1.5 py-0.5 rounded bg-emerald-400/25 text-emerald-200 text-[9px] font-extrabold border border-emerald-400/40">
              K3
            </span>
          </div>
          <span className="text-[9px] font-bold text-teal-100/90 tracking-wider uppercase mt-1">
            Safety First • Zero Accident
          </span>
        </div>
      )}
    </div>
  );
};
