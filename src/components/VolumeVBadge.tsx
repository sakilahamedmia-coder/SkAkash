import React, { useId } from 'react';

export const VOLUME_VBADGE_THRESHOLD = 2000;

interface VolumeVBadgeProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showTooltip?: boolean;
}

/**
 * Colorful Royal V-Badge (High-Volume Transaction Crest)
 * Automatically awarded beside a user's name once their completed transaction volume exceeds $2,000 USDT.
 */
export const VolumeVBadge: React.FC<VolumeVBadgeProps> = ({
  size = 'md',
  className = '',
  showTooltip = true
}) => {
  const uid = useId().replace(/:/g, '');
  const rimGradId = `vbadge-rim-${uid}`;
  const coreGradId = `vbadge-core-${uid}`;
  const letterGradId = `vbadge-letter-${uid}`;
  const shineGradId = `vbadge-shine-${uid}`;

  const sizeMap = {
    xs: 'w-3.5 h-3.5',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-7 h-7',
    xl: 'w-12 h-12'
  };

  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 select-none drop-shadow-[0_2px_8px_rgba(245,158,11,0.45)] ${sizeMap[size]} ${className}`}
      title={
        showTooltip
          ? '$2,000+ Volume Completed — Auto Colorful V-Badge (High-Volume VIP)'
          : undefined
      }
      aria-label="Colorful $2,000+ Transaction V-Badge"
    >
      <svg
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <defs>
          <linearGradient id={rimGradId} x1="2" y1="2" x2="30" y2="30" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FF3B8D" />
            <stop offset="28%" stopColor="#F59E0B" />
            <stop offset="56%" stopColor="#10B981" />
            <stop offset="80%" stopColor="#06B6D4" />
            <stop offset="100%" stopColor="#8B5CF6" />
          </linearGradient>
          <linearGradient id={coreGradId} x1="6" y1="4" x2="26" y2="28" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#1E1B4B" />
            <stop offset="55%" stopColor="#0F172A" />
            <stop offset="100%" stopColor="#172554" />
          </linearGradient>
          <linearGradient id={letterGradId} x1="10" y1="9" x2="22" y2="24" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFF7D6" />
            <stop offset="50%" stopColor="#FDE047" />
            <stop offset="100%" stopColor="#FB923C" />
          </linearGradient>
          <linearGradient id={shineGradId} x1="8" y1="3" x2="24" y2="16" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Outer Prismatic Crown-Shield Crest */}
        <path
          d="M16 1.5L20.5 4.2L26.2 4.8L27.5 10.4L30.5 15.2L27.2 20.3L25.4 25.8L19.8 27.6L16 30.8L12.2 27.6L6.6 25.8L4.8 20.3L1.5 15.2L4.5 10.4L5.8 4.8L11.5 4.2L16 1.5Z"
          fill={`url(#${rimGradId})`}
        />

        {/* Inner Faceted Jewel Core */}
        <path
          d="M16 4.2L19.6 6.4L24 6.9L25 11.2L27.4 15.1L24.7 19.1L23.3 23.5L19 25L16 27.5L13 25L8.7 23.5L7.3 19.1L4.6 15.1L7 11.2L8 6.9L12.4 6.4L16 4.2Z"
          fill={`url(#${coreGradId})`}
          stroke="rgba(255,255,255,0.28)"
          strokeWidth="0.7"
        />

        {/* Top Specular Facet Highlight */}
        <path
          d="M16 4.2L19.6 6.4L24 6.9L25 11.2L16 14.5L7 11.2L8 6.9L12.4 6.4L16 4.2Z"
          fill={`url(#${shineGradId})`}
        />

        {/* Radiant Crown Diamond Accent Above V */}
        <path
          d="M16 6.5L17.6 8.3L16 10.1L14.4 8.3L16 6.5Z"
          fill="#38BDF8"
        />

        {/* Bold Gleaming "V" Monogram */}
        <path
          d="M9.6 11.2H13.1L16 19.4L18.9 11.2H22.4L17.6 23.4H14.4L9.6 11.2Z"
          fill={`url(#${letterGradId})`}
          stroke="#FFFFFF"
          strokeOpacity="0.45"
          strokeWidth="0.5"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
};
