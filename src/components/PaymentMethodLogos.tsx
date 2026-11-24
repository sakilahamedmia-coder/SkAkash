import React from 'react';
import { PaymentMethodBadge } from '../types';

export type WalletRegion = 'global' | 'bd' | 'in' | 'np';

export interface PaymentMethodMeta {
  id: PaymentMethodBadge;
  name: string;
  bengaliName: string;
  region: WalletRegion;
  regionLabel: string;
  accentBg: string;
  accentBorder: string;
  accentText: string;
}

export const WALLET_REGIONS: { key: WalletRegion; label: string }[] = [
  { key: 'global', label: 'Crypto & Global' },
  { key: 'bd', label: 'Bangladesh Wallets' },
  { key: 'in', label: 'India Wallets' },
  { key: 'np', label: 'Nepal Wallets' }
];

export const PAYMENT_METHOD_OPTIONS: PaymentMethodMeta[] = [
  // Global / Crypto
  {
    id: 'binance',
    name: 'Binance',
    bengaliName: 'Binance',
    region: 'global',
    regionLabel: 'Global',
    accentBg: 'bg-[#F0B90B]/15',
    accentBorder: 'border-[#F0B90B]/45',
    accentText: 'text-[#FCD535]'
  },
  {
    id: 'crypto',
    name: 'Crypto',
    bengaliName: 'Crypto',
    region: 'global',
    regionLabel: 'Global',
    accentBg: 'bg-[#26A17B]/15',
    accentBorder: 'border-[#26A17B]/45',
    accentText: 'text-[#4CE0B3]'
  },

  // Bangladesh Wallets
  {
    id: 'bkash',
    name: 'bKash',
    bengaliName: 'bKash',
    region: 'bd',
    regionLabel: 'Bangladesh',
    accentBg: 'bg-[#E2136E]/15',
    accentBorder: 'border-[#E2136E]/45',
    accentText: 'text-[#FF5FA2]'
  },
  {
    id: 'nagad',
    name: 'Nagad',
    bengaliName: 'Nagad',
    region: 'bd',
    regionLabel: 'Bangladesh',
    accentBg: 'bg-[#F7941D]/15',
    accentBorder: 'border-[#F7941D]/45',
    accentText: 'text-[#FFB347]'
  },
  {
    id: 'rocket',
    name: 'Rocket',
    bengaliName: 'Rocket',
    region: 'bd',
    regionLabel: 'Bangladesh',
    accentBg: 'bg-[#8C3494]/20',
    accentBorder: 'border-[#8C3494]/50',
    accentText: 'text-[#E18EE8]'
  },
  {
    id: 'upay',
    name: 'Upay',
    bengaliName: 'Upay',
    region: 'bd',
    regionLabel: 'Bangladesh',
    accentBg: 'bg-[#FFC805]/15',
    accentBorder: 'border-[#FFC805]/45',
    accentText: 'text-[#FFD84D]'
  },

  // India Wallets
  {
    id: 'phonepe',
    name: 'PhonePe',
    bengaliName: 'PhonePe',
    region: 'in',
    regionLabel: 'India',
    accentBg: 'bg-[#5F259F]/20',
    accentBorder: 'border-[#8C4CD9]/50',
    accentText: 'text-[#C69EFF]'
  },
  {
    id: 'gpay',
    name: 'GPay',
    bengaliName: 'Google Pay',
    region: 'in',
    regionLabel: 'India',
    accentBg: 'bg-[#4285F4]/15',
    accentBorder: 'border-[#4285F4]/45',
    accentText: 'text-[#8AB4F8]'
  },
  {
    id: 'paytm',
    name: 'Paytm',
    bengaliName: 'Paytm',
    region: 'in',
    regionLabel: 'India',
    accentBg: 'bg-[#00BAF2]/15',
    accentBorder: 'border-[#00BAF2]/45',
    accentText: 'text-[#5CD6FF]'
  },
  {
    id: 'upi',
    name: 'UPI',
    bengaliName: 'UPI',
    region: 'in',
    regionLabel: 'India',
    accentBg: 'bg-[#FF7909]/15',
    accentBorder: 'border-[#138808]/45',
    accentText: 'text-[#FFB266]'
  },

  // Nepal Wallets
  {
    id: 'esewa',
    name: 'eSewa',
    bengaliName: 'eSewa',
    region: 'np',
    regionLabel: 'Nepal',
    accentBg: 'bg-[#60BB46]/15',
    accentBorder: 'border-[#60BB46]/45',
    accentText: 'text-[#8CE070]'
  },
  {
    id: 'khalti',
    name: 'Khalti',
    bengaliName: 'Khalti',
    region: 'np',
    regionLabel: 'Nepal',
    accentBg: 'bg-[#5C2D91]/20',
    accentBorder: 'border-[#8A4CD4]/50',
    accentText: 'text-[#C89EFF]'
  },
  {
    id: 'imepay',
    name: 'IME Pay',
    bengaliName: 'IME Pay',
    region: 'np',
    regionLabel: 'Nepal',
    accentBg: 'bg-[#D71920]/15',
    accentBorder: 'border-[#D71920]/45',
    accentText: 'text-[#FF787D]'
  }
];

export const PaymentMethodSvg: React.FC<{ method: PaymentMethodBadge; className?: string }> = ({
  method,
  className = 'w-5 h-5'
}) => {
  switch (method) {
    case 'bkash':
      return (
        <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="bKash Official Logo">
          <rect width="32" height="32" rx="8" fill="#E2136E" />
          {/* Authentic multi-facet origami Doyel bird */}
          <path d="M6.4 12.6L12.6 15.8L10.8 19.6L6.4 12.6Z" fill="#B50953" />
          <path d="M8.6 10.6L16.2 7.2L19.6 14.2L12.6 15.8L8.6 10.6Z" fill="#FFFFFF" />
          <path d="M19.6 14.2L25.4 11.4L21.5 17.6L16.2 18.1L19.6 14.2Z" fill="#FFD1E4" />
          <path d="M12.6 15.8L19.6 14.2L15.4 25.2L10.8 19.6L12.6 15.8Z" fill="#FFFFFF" />
          <path d="M19.6 14.2L21.5 17.6L15.4 25.2L19.6 14.2Z" fill="#FF9AC3" />
        </svg>
      );

    case 'nagad':
      return (
        <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Nagad Official Logo">
          <defs>
            <linearGradient id="nagadOfficialGrad" x1="2" y1="2" x2="30" y2="30" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#F7941D" />
              <stop offset="55%" stopColor="#F15A24" />
              <stop offset="100%" stopColor="#ED1C24" />
            </linearGradient>
          </defs>
          <rect width="32" height="32" rx="8" fill="url(#nagadOfficialGrad)" />
          {/* Authentic Nagad sun/flame ring */}
          <circle cx="16" cy="16" r="9.2" stroke="#FFFFFF" strokeWidth="2.1" />
          <path
            d="M16.2 8.9C18.5 11.8 19.8 14.2 19.8 16.6C19.8 19.1 18.1 21 16 21C13.9 21 12.2 19.1 12.2 16.6C12.2 14.8 13.1 13.3 14.5 12C14.7 13.6 15.5 14.7 16.5 15.2C16.2 13.4 15.9 11.4 16.2 8.9Z"
            fill="#FFFFFF"
          />
        </svg>
      );

    case 'rocket':
      return (
        <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="DBBL Rocket Official Logo">
          <defs>
            <linearGradient id="rocketOfficialGrad" x1="3" y1="3" x2="29" y2="29" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#A136A8" />
              <stop offset="100%" stopColor="#6D1E75" />
            </linearGradient>
          </defs>
          <rect width="32" height="32" rx="8" fill="url(#rocketOfficialGrad)" />
          <circle cx="16" cy="16" r="10.2" stroke="#FFFFFF" strokeOpacity="0.3" strokeWidth="1.4" />
          <path
            d="M21.8 10.2C18.2 10.2 14.6 12.1 12.6 14.9L9.8 15.5L8.6 18.1L12.1 18.9L13.1 19.9L13.9 23.4L16.5 22.2L17.1 19.4C19.9 17.4 21.8 13.8 21.8 10.2Z"
            fill="#FFFFFF"
          />
          <circle cx="17.3" cy="14.7" r="1.7" fill="#8C3494" />
          <path d="M8.5 23.5L11.2 20.8" stroke="#FFD54F" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    case 'upay':
      return (
        <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Upay Official Logo">
          <rect width="32" height="32" rx="8" fill="#FFD100" />
          {/* Authentic Upay navy-blue curved emblem */}
          <path
            d="M9.5 9.2H13.8V17.4C13.8 19.1 14.7 20.1 16.1 20.1C17.5 20.1 18.4 19.1 18.4 17.4V9.2H22.7V17.5C22.7 21.4 20 23.8 16.1 23.8C12.2 23.8 9.5 21.4 9.5 17.5V9.2Z"
            fill="#004C97"
          />
          <circle cx="22.4" cy="8.4" r="2.1" fill="#E31837" />
        </svg>
      );

    case 'phonepe':
      return (
        <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="PhonePe Official Logo">
          <rect width="32" height="32" rx="8" fill="#5F259F" />
          {/* Devanagari 'पे' iconic PhonePe mark */}
          <path
            d="M10.5 9.8H21.8M13.2 9.8V16.2C13.2 18 14.4 19.2 16.2 19.2C17.7 19.2 18.8 18.2 19.2 16.8M19.2 9.8V23"
            stroke="#FFFFFF"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M19.2 9.8L15.4 6.8" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      );

    case 'gpay':
      return (
        <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Google Pay Official Logo">
          <rect width="32" height="32" rx="8" fill="#FFFFFF" />
          {/* Official 4-color Google G mark */}
          <path d="M24.6 16.2C24.6 15.5 24.5 14.9 24.4 14.3H16V18H20.8C20.6 19.2 19.9 20.2 18.9 20.8V23.2H21.9C23.6 21.6 24.6 19.1 24.6 16.2Z" fill="#4285F4" />
          <path d="M16 25C18.4 25 20.5 24.2 21.9 23.2L18.9 20.8C18.1 21.4 17.1 21.7 16 21.7C13.7 21.7 11.8 20.2 11.1 18.1H8V20.5C9.5 23.2 12.5 25 16 25Z" fill="#34A853" />
          <path d="M11.1 18.1C10.9 17.5 10.8 16.8 10.8 16C10.8 15.2 10.9 14.5 11.1 13.9V11.5H8C7.3 12.9 7 14.4 7 16C7 17.6 7.3 19.1 8 20.5L11.1 18.1Z" fill="#FBBC05" />
          <path d="M16 10.3C17.3 10.3 18.5 10.8 19.5 11.7L22 9.2C20.5 7.8 18.4 7 16 7C12.5 7 9.5 8.8 8 11.5L11.1 13.9C11.8 11.8 13.7 10.3 16 10.3Z" fill="#EA4335" />
        </svg>
      );

    case 'paytm':
      return (
        <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Paytm Official Logo">
          <rect width="32" height="32" rx="8" fill="#FFFFFF" />
          <rect x="3" y="7.5" width="26" height="9" rx="3" fill="#002970" />
          <rect x="3" y="17.5" width="26" height="7" rx="2.5" fill="#00BAF2" />
          <text x="16" y="13.8" textAnchor="middle" fill="#FFFFFF" fontSize="6.4" fontWeight="900" fontFamily="sans-serif">
            Pay
          </text>
          <text x="16" y="22.8" textAnchor="middle" fill="#FFFFFF" fontSize="5.8" fontWeight="900" fontFamily="sans-serif">
            TM
          </text>
        </svg>
      );

    case 'upi':
      return (
        <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="BHIM UPI Official Logo">
          <rect width="32" height="32" rx="8" fill="#FFFFFF" />
          {/* Authentic Saffron & India Green twin directional triangles */}
          <path d="M14.2 6.8L21.5 16L11.6 25.2L14.2 6.8Z" fill="#FF7909" />
          <path d="M18.6 6.8L25.8 16L16 25.2L18.6 6.8Z" fill="#138808" />
          <path d="M6.4 14.5H12.2" stroke="#0B4C8C" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      );

    case 'esewa':
      return (
        <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="eSewa Official Logo">
          <rect width="32" height="32" rx="8" fill="#60BB46" />
          {/* Authentic eSewa green 'e' mark inside ring */}
          <circle cx="16" cy="16" r="10.2" stroke="#FFFFFF" strokeWidth="1.8" strokeOpacity="0.9" />
          <path
            d="M20.8 16.5H12.1C12.3 18.7 14 20.1 16.3 20.1C17.8 20.1 19 19.6 19.9 18.7L21.2 20.3C19.9 21.6 18.2 22.3 16.1 22.3C12.2 22.3 9.5 19.6 9.5 15.9C9.5 12.2 12.1 9.5 15.8 9.5C19.5 9.5 21.8 12.1 21.8 15.7C21.8 16 21.8 16.3 20.8 16.5ZM12.2 14.6H19.2C19 12.8 17.7 11.6 15.8 11.6C13.9 11.6 12.5 12.8 12.2 14.6Z"
            fill="#FFFFFF"
          />
        </svg>
      );

    case 'khalti':
      return (
        <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Khalti Official Logo">
          <rect width="32" height="32" rx="8" fill="#5C2D91" />
          {/* Authentic Khalti wallet/K emblem with saffron pocket accent */}
          <path d="M8.5 9.5H12.5V22.5H8.5V9.5Z" fill="#FFFFFF" />
          <path d="M13 16L20.5 9.5H24.2L16.5 16L24.2 22.5H20.5L13 16Z" fill="#F47920" />
          <circle cx="22.4" cy="16" r="2.1" fill="#FFFFFF" />
        </svg>
      );

    case 'imepay':
      return (
        <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="IME Pay Official Logo">
          <rect width="32" height="32" rx="8" fill="#D71920" />
          <circle cx="16" cy="16" r="9.6" stroke="#FFFFFF" strokeWidth="1.9" />
          <path d="M10.2 12.6V19.4" stroke="#FFFFFF" strokeWidth="2.3" strokeLinecap="round" />
          <path d="M13.6 19.4V12.6L16.4 16.8L19.2 12.6V19.4" stroke="#FFFFFF" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="22.2" cy="16" r="1.6" fill="#FFD100" />
        </svg>
      );

    case 'crypto':
      return (
        <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Tether USDT Crypto Official Logo">
          <rect width="32" height="32" rx="8" fill="#26A17B" />
          <path
            d="M17.55 17.08v-.002c-.09.006-.546.034-1.566.034-.814 0-1.387-.024-1.589-.034v.002c-3.136-.138-5.475-.684-5.475-1.337 0-.652 2.34-1.198 5.475-1.338v2.132c.205.015.792.049 1.603.049.973 0 1.461-.04 1.552-.048v-2.132c3.13.14 5.463.686 5.463 1.337 0 .653-2.334 1.197-5.463 1.337m0-2.895v-1.908h4.366V9.366H10.032v2.91h4.366v1.907c-3.548.163-6.216.866-6.216 1.708 0 .842 2.668 1.544 6.216 1.708v6.114h3.155v-6.115c3.542-.163 6.204-.865 6.204-1.707 0-.84-2.662-1.543-6.204-1.708"
            fill="#FFFFFF"
          />
        </svg>
      );

    case 'binance':
    default:
      return (
        <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Binance Official Logo">
          <rect width="32" height="32" rx="8" fill="#181A20" />
          <path d="M16 6.2L21.4 11.6L19.2 13.8L16 10.6L12.8 13.8L10.6 11.6L16 6.2Z" fill="#F0B90B" />
          <path d="M16 25.8L21.4 20.4L19.2 18.2L16 21.4L12.8 18.2L10.6 20.4L16 25.8Z" fill="#F0B90B" />
          <path d="M8.4 13.8L10.6 16L8.4 18.2L6.2 16L8.4 13.8Z" fill="#F0B90B" />
          <path d="M23.6 13.8L25.8 16L23.6 18.2L21.4 16L23.6 13.8Z" fill="#F0B90B" />
          <path d="M16 13.4L18.6 16L16 18.6L13.4 16L16 13.4Z" fill="#F0B90B" />
        </svg>
      );
  }
};

export const PaymentBadgeChip: React.FC<{
  method: PaymentMethodBadge;
  compact?: boolean;
}> = ({ method, compact = false }) => {
  const meta = PAYMENT_METHOD_OPTIONS.find((m) => m.id === method);
  if (!meta) return null;

  return (
    <div
      className={`inline-flex items-center space-x-1.5 rounded-lg border ${meta.accentBg} ${meta.accentBorder} ${
        compact ? 'px-2 py-1' : 'px-2.5 py-1.5'
      }`}
      title={`${meta.bengaliName} (${meta.name}) · ${meta.regionLabel}`}
    >
      <PaymentMethodSvg method={method} className={compact ? 'w-4 h-4 shrink-0' : 'w-5 h-5 shrink-0'} />
      <span className={`text-[11px] font-bold leading-none whitespace-nowrap ${meta.accentText}`}>
        {meta.bengaliName}
      </span>
    </div>
  );
};

export const WhatsappOfficialSvg: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="WhatsApp Official Logo">
    <defs>
      <linearGradient id="whatsappOfficialGrad" x1="4" y1="3" x2="28" y2="29" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#5FFC7B" />
        <stop offset="100%" stopColor="#1FAF38" />
      </linearGradient>
    </defs>
    <rect width="32" height="32" rx="8" fill="url(#whatsappOfficialGrad)" />
    <path
      d="M16.05 6.8C11.02 6.8 6.95 10.85 6.95 15.84C6.95 17.59 7.45 19.22 8.32 20.61L7.1 25.08L11.71 23.88C13.03 24.6 14.5 24.98 16.05 24.98C21.08 24.98 25.15 20.93 25.15 15.94C25.15 10.95 21.08 6.8 16.05 6.8Z"
      fill="#FFFFFF"
    />
    <path
      d="M16.05 8.6C20.09 8.6 23.36 11.86 23.36 15.88C23.36 19.9 20.09 23.16 16.05 23.16C14.66 23.16 13.36 22.78 12.25 22.11L11.98 21.95L9.47 22.6L10.14 20.16L9.96 19.88C9.22 18.71 8.83 17.34 8.83 15.88C8.83 11.86 12.01 8.6 16.05 8.6Z"
      fill="#25D366"
    />
    <path
      d="M13.78 11.98C13.59 11.57 13.4 11.56 13.21 11.55C13.06 11.54 12.88 11.54 12.7 11.54C12.52 11.54 12.23 11.61 11.98 11.88C11.73 12.15 11.04 12.79 11.04 14.11C11.04 15.42 12 16.69 12.14 16.87C12.27 17.05 14.01 19.84 16.75 20.92C19.04 21.82 19.5 21.64 20 21.6C20.5 21.55 21.6 20.94 21.82 20.31C22.05 19.68 22.05 19.14 21.98 19.03C21.91 18.92 21.73 18.85 21.46 18.72C21.19 18.58 19.86 17.93 19.62 17.84C19.37 17.75 19.19 17.71 19.01 17.98C18.83 18.25 18.31 18.85 18.15 19.03C17.99 19.21 17.83 19.23 17.56 19.1C17.29 18.96 16.43 18.68 15.41 17.78C14.61 17.07 14.07 16.2 13.92 15.93C13.76 15.66 13.9 15.52 14.04 15.38C14.16 15.26 14.31 15.07 14.44 14.91C14.58 14.75 14.62 14.64 14.71 14.46C14.8 14.28 14.76 14.12 14.69 13.99C14.62 13.85 14.1 12.53 13.78 11.98Z"
      fill="#FFFFFF"
    />
  </svg>
);

export const TelegramOfficialSvg: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Telegram Official Logo">
    <defs>
      <linearGradient id="telegramOfficialGrad" x1="16" y1="2" x2="16" y2="30" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#37AEE2" />
        <stop offset="100%" stopColor="#1E96C8" />
      </linearGradient>
    </defs>
    <rect width="32" height="32" rx="8" fill="url(#telegramOfficialGrad)" />
    <path
      d="M24.2 8.7L21.1 23.3C20.9 24.2 20.3 24.4 19.5 24L15.1 20.8L13 22.8C12.8 23 12.6 23.2 12.2 23.2L12.5 18.7L20.7 11.3C21.1 11 20.6 10.8 20.1 11.1L10 17.5L5.6 16.1C4.7 15.8 4.7 15.2 5.8 14.8L22.9 8.2C23.7 7.9 24.4 8.4 24.2 8.7Z"
      fill="#FFFFFF"
    />
  </svg>
);

export function buildWhatsappUrl(raw?: string): string | null {
  if (!raw) return null;
  const cleaned = raw
    .replace(/^https?:\/\/(api\.whatsapp\.com\/send\?phone=|wa\.me\/)/i, '')
    .replace(/^wa\.me\//i, '')
    .replace(/[^0-9]/g, '');
  if (cleaned.length < 6 || cleaned.length > 16) return null;
  return `https://wa.me/${cleaned}`;
}

export function buildTelegramUrl(raw?: string): string | null {
  if (!raw) return null;
  const cleaned = raw
    .trim()
    .replace(/^https?:\/\/(t\.me|telegram\.me)\//i, '')
    .replace(/^(t\.me|telegram\.me)\//i, '')
    .replace(/^@+/, '')
    .split(/[?#]/)[0]
    .replace(/\/+$/, '')
    .trim();
  if (!/^(\+[A-Za-z0-9_-]{8,32}|[A-Za-z0-9_]{3,32})$/.test(cleaned)) return null;
  return `https://t.me/${cleaned}`;
}

export function formatTelegramHandle(raw?: string): string {
  const url = buildTelegramUrl(raw);
  if (!url) return '';
  const handle = url.replace('https://t.me/', '');
  return handle.startsWith('+') ? handle : `@${handle}`;
}

export const VerifiedContactChips: React.FC<{
  whatsappNumber?: string;
  telegramLink?: string;
  compact?: boolean;
  showMessageHint?: boolean;
}> = ({ whatsappNumber, telegramLink, compact = false, showMessageHint = true }) => {
  const waUrl = buildWhatsappUrl(whatsappNumber);
  const tgUrl = buildTelegramUrl(telegramLink);

  if (!waUrl && !tgUrl) return null;

  return (
    <>
      {waUrl && (
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center space-x-1.5 rounded-lg border bg-[#25D366]/15 border-[#25D366]/45 hover:bg-[#25D366]/25 transition-colors ${
            compact ? 'px-2.5 py-1.5 min-h-[36px]' : 'px-3 py-2 min-h-[44px]'
          }`}
          title={`Message on WhatsApp: ${whatsappNumber}`}
        >
          <WhatsappOfficialSvg className={compact ? 'w-4 h-4 shrink-0' : 'w-5 h-5 shrink-0'} />
          <span className="text-[11px] font-bold leading-none whitespace-nowrap text-[#5FFC7B]">
            {showMessageHint ? 'WhatsApp · Message' : 'WhatsApp'}
          </span>
        </a>
      )}
      {tgUrl && (
        <a
          href={tgUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center space-x-1.5 rounded-lg border bg-[#229ED9]/15 border-[#229ED9]/45 hover:bg-[#229ED9]/25 transition-colors ${
            compact ? 'px-2.5 py-1.5 min-h-[36px]' : 'px-3 py-2 min-h-[44px]'
          }`}
          title={`Message on Telegram: ${formatTelegramHandle(telegramLink)}`}
        >
          <TelegramOfficialSvg className={compact ? 'w-4 h-4 shrink-0' : 'w-5 h-5 shrink-0'} />
          <span className="text-[11px] font-bold leading-none whitespace-nowrap text-[#67C7F2]">
            {showMessageHint ? 'Telegram · Message' : 'Telegram'}
          </span>
        </a>
      )}
    </>
  );
};

