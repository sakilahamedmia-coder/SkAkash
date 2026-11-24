import React from 'react';
import { Check } from 'lucide-react';

interface VerifiedBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'blue' | 'colorful';
  className?: string;
  showTooltip?: boolean;
}

export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({
  size = 'md',
  variant = 'blue',
  className = '',
  showTooltip = true
}) => {
  const sizeMap = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-6 h-6'
  };

  const checkMap = {
    sm: 'w-2 h-2 stroke-[3]',
    md: 'w-2.5 h-2.5 stroke-[3]',
    lg: 'w-3.5 h-3.5 stroke-[3]'
  };

  if (variant === 'colorful') {
    const svgSizeMap = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-7 h-7'
    };

    return (
      <span
        className={`inline-flex items-center justify-center shrink-0 select-none drop-shadow-[0_2px_6px_rgba(56,189,248,0.45)] ${svgSizeMap[size]} ${className}`}
        title={showTooltip ? 'Verified Account' : undefined}
        aria-label="Verified Account Badge"
      >
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <defs>
            <linearGradient id="colorfulVerifiedSeal" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#F59E0B" />
              <stop offset="35%" stopColor="#EC4899" />
              <stop offset="70%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#10B981" />
            </linearGradient>
          </defs>
          <path
            d="M12 1.5l2.38 1.98 3.04-.46 1.15 2.86 2.86 1.15-.46 3.04L22.95 12l-1.98 2.38.46 3.04-2.86 1.15-1.15 2.86-3.04-.46L12 22.95l-2.38-1.98-3.04.46-1.15-2.86-2.86-1.15.46-3.04L1.05 12l1.98-2.38-.46-3.04 2.86-1.15 1.15-2.86 3.04.46L12 1.5z"
            fill="url(#colorfulVerifiedSeal)"
          />
          <circle cx="12" cy="12" r="7.5" fill="rgba(15, 23, 42, 0.22)" />
          <path
            d="M8.6 12.2l2.25 2.25 4.75-4.75"
            stroke="#FFFFFF"
            strokeWidth="2.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 rounded-full bg-gradient-to-tr from-sky-600 via-blue-500 to-sky-400 text-white shadow-sm shadow-blue-500/40 select-none ${sizeMap[size]} ${className}`}
      title={showTooltip ? 'Verified Account' : undefined}
    >
      <Check className={checkMap[size]} />
    </span>
  );
};
