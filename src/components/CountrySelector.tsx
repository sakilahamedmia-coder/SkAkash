import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search, Globe, X } from 'lucide-react';

export interface CountryOption {
  code: string;
  name: string;
  dialCode: string;
}

export const COUNTRY_OPTIONS: CountryOption[] = [
  { code: 'BD', name: 'Bangladesh', dialCode: '+880' },
  { code: 'IN', name: 'India', dialCode: '+91' },
  { code: 'PK', name: 'Pakistan', dialCode: '+92' },
  { code: 'NP', name: 'Nepal', dialCode: '+977' },
  { code: 'LK', name: 'Sri Lanka', dialCode: '+94' },
  { code: 'AE', name: 'United Arab Emirates', dialCode: '+971' },
  { code: 'SA', name: 'Saudi Arabia', dialCode: '+966' },
  { code: 'QA', name: 'Qatar', dialCode: '+974' },
  { code: 'KW', name: 'Kuwait', dialCode: '+965' },
  { code: 'OM', name: 'Oman', dialCode: '+968' },
  { code: 'BH', name: 'Bahrain', dialCode: '+973' },
  { code: 'MY', name: 'Malaysia', dialCode: '+60' },
  { code: 'SG', name: 'Singapore', dialCode: '+65' },
  { code: 'ID', name: 'Indonesia', dialCode: '+62' },
  { code: 'PH', name: 'Philippines', dialCode: '+63' },
  { code: 'TH', name: 'Thailand', dialCode: '+66' },
  { code: 'VN', name: 'Vietnam', dialCode: '+84' },
  { code: 'JP', name: 'Japan', dialCode: '+81' },
  { code: 'KR', name: 'South Korea', dialCode: '+82' },
  { code: 'US', name: 'United States', dialCode: '+1' },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44' },
  { code: 'CA', name: 'Canada', dialCode: '+1' },
  { code: 'AU', name: 'Australia', dialCode: '+61' },
  { code: 'DE', name: 'Germany', dialCode: '+49' },
  { code: 'FR', name: 'France', dialCode: '+33' },
  { code: 'IT', name: 'Italy', dialCode: '+39' },
  { code: 'ES', name: 'Spain', dialCode: '+34' },
  { code: 'NL', name: 'Netherlands', dialCode: '+31' },
  { code: 'CH', name: 'Switzerland', dialCode: '+41' },
  { code: 'TR', name: 'Turkey', dialCode: '+90' },
  { code: 'BR', name: 'Brazil', dialCode: '+55' },
  { code: 'NG', name: 'Nigeria', dialCode: '+234' },
  { code: 'KE', name: 'Kenya', dialCode: '+254' },
  { code: 'ZA', name: 'South Africa', dialCode: '+27' },
  { code: 'EG', name: 'Egypt', dialCode: '+20' }
];

export function getCountryByCode(code?: string): CountryOption | undefined {
  if (!code) return undefined;
  const upper = code.trim().toUpperCase();
  return COUNTRY_OPTIONS.find((c) => c.code === upper);
}

interface CountryFlagProps {
  code?: string;
  className?: string;
}

export const CountryFlag: React.FC<CountryFlagProps> = ({ code, className = 'w-6 h-4' }) => {
  const upper = (code || '').trim().toUpperCase();
  const uid = `flag-${upper || 'XX'}`;

  const renderArtwork = () => {
    switch (upper) {
      case 'BD':
        return (
          <>
            <rect width="28" height="20" fill="#006A4E" />
            <circle cx="12.5" cy="10" r="5.5" fill="#F42A41" />
          </>
        );
      case 'IN':
        return (
          <>
            <rect width="28" height="6.7" y="0" fill="#FF9933" />
            <rect width="28" height="6.6" y="6.7" fill="#FFFFFF" />
            <rect width="28" height="6.7" y="13.3" fill="#138808" />
            <circle cx="14" cy="10" r="2.4" fill="none" stroke="#000080" strokeWidth="0.9" />
            <circle cx="14" cy="10" r="0.7" fill="#000080" />
          </>
        );
      case 'PK':
        return (
          <>
            <rect width="7" height="20" x="0" fill="#FFFFFF" />
            <rect width="21" height="20" x="7" fill="#01411C" />
            <circle cx="17.8" cy="10" r="4.8" fill="#FFFFFF" />
            <circle cx="19.3" cy="9" r="4.1" fill="#01411C" />
            <polygon points="19.5,6.8 20.1,8.3 21.7,8.3 20.4,9.2 20.9,10.7 19.5,9.8 18.1,10.7 18.6,9.2 17.3,8.3 18.9,8.3" fill="#FFFFFF" />
          </>
        );
      case 'NP':
        return (
          <>
            <rect width="28" height="20" fill="#0F172A" />
            <polygon points="4,2 20,9.5 11,9.5 22,18 4,18" fill="#DC143C" stroke="#003893" strokeWidth="1.2" strokeLinejoin="round" />
            <circle cx="9.2" cy="7.4" r="1.4" fill="#FFFFFF" />
            <circle cx="9.5" cy="14" r="1.7" fill="#FFFFFF" />
          </>
        );
      case 'LK':
        return (
          <>
            <rect width="28" height="20" fill="#FFBE29" />
            <rect x="2" y="2" width="4" height="16" fill="#00534E" />
            <rect x="6" y="2" width="4" height="16" fill="#EB7400" />
            <rect x="11.5" y="2" width="14.5" height="16" fill="#8D153A" />
            <circle cx="18.8" cy="10" r="3.4" fill="#FFBE29" />
            <rect x="17.2" y="8.5" width="3.2" height="3" rx="0.6" fill="#8D153A" />
          </>
        );
      case 'AE':
        return (
          <>
            <rect width="28" height="6.7" y="0" fill="#00732F" />
            <rect width="28" height="6.6" y="6.7" fill="#FFFFFF" />
            <rect width="28" height="6.7" y="13.3" fill="#000000" />
            <rect width="7" height="20" x="0" fill="#FF0000" />
          </>
        );
      case 'SA':
        return (
          <>
            <rect width="28" height="20" fill="#006C35" />
            <rect x="6.5" y="6.2" width="15" height="2.4" rx="1" fill="#FFFFFF" />
            <rect x="9" y="10" width="10" height="1.4" rx="0.7" fill="#FFFFFF" />
            <rect x="7" y="13.2" width="14" height="1.2" rx="0.6" fill="#FFFFFF" />
            <rect x="19" y="12.2" width="1.2" height="3.2" rx="0.4" fill="#FFFFFF" />
          </>
        );
      case 'QA':
        return (
          <>
            <rect width="28" height="20" fill="#8D1B3D" />
            <polygon points="0,0 8.5,0 10.5,2 8.5,4 10.5,6 8.5,8 10.5,10 8.5,12 10.5,14 8.5,16 10.5,18 8.5,20 0,20" fill="#FFFFFF" />
          </>
        );
      case 'KW':
        return (
          <>
            <rect width="28" height="6.7" y="0" fill="#007A3D" />
            <rect width="28" height="6.6" y="6.7" fill="#FFFFFF" />
            <rect width="28" height="6.7" y="13.3" fill="#CE1126" />
            <polygon points="0,0 8,6.7 8,13.3 0,20" fill="#000000" />
          </>
        );
      case 'OM':
        return (
          <>
            <rect width="28" height="6.7" y="0" fill="#FFFFFF" />
            <rect width="28" height="6.6" y="6.7" fill="#DB161B" />
            <rect width="28" height="6.7" y="13.3" fill="#008000" />
            <rect width="7.5" height="20" x="0" fill="#DB161B" />
            <circle cx="3.8" cy="4.2" r="1.4" fill="#FFFFFF" />
          </>
        );
      case 'BH':
        return (
          <>
            <rect width="28" height="20" fill="#CE1126" />
            <polygon points="0,0 8.5,0 11,2.5 8.5,5 11,7.5 8.5,10 11,12.5 8.5,15 11,17.5 8.5,20 0,20" fill="#FFFFFF" />
          </>
        );
      case 'MY':
        return (
          <>
            <rect width="28" height="20" fill="#FFFFFF" />
            <rect width="28" height="2.8" y="0" fill="#CC0001" />
            <rect width="28" height="2.8" y="5.6" fill="#CC0001" />
            <rect width="28" height="2.8" y="11.2" fill="#CC0001" />
            <rect width="28" height="3.2" y="16.8" fill="#CC0001" />
            <rect width="14" height="11.2" fill="#010066" />
            <circle cx="5.8" cy="5.6" r="3.2" fill="#FFCC00" />
            <circle cx="7" cy="5.6" r="2.6" fill="#010066" />
            <circle cx="9.8" cy="5.6" r="1.4" fill="#FFCC00" />
          </>
        );
      case 'SG':
        return (
          <>
            <rect width="28" height="10" y="0" fill="#EF3340" />
            <rect width="28" height="10" y="10" fill="#FFFFFF" />
            <circle cx="6.2" cy="5" r="3.2" fill="#FFFFFF" />
            <circle cx="7.4" cy="5" r="2.7" fill="#EF3340" />
            <circle cx="9.2" cy="3.5" r="0.6" fill="#FFFFFF" />
            <circle cx="10.8" cy="4.8" r="0.6" fill="#FFFFFF" />
            <circle cx="9.8" cy="6.6" r="0.6" fill="#FFFFFF" />
            <circle cx="7.9" cy="6.6" r="0.6" fill="#FFFFFF" />
          </>
        );
      case 'ID':
        return (
          <>
            <rect width="28" height="10" y="0" fill="#FF0000" />
            <rect width="28" height="10" y="10" fill="#FFFFFF" />
          </>
        );
      case 'PH':
        return (
          <>
            <rect width="28" height="10" y="0" fill="#0038A8" />
            <rect width="28" height="10" y="10" fill="#CE1126" />
            <polygon points="0,0 13.5,10 0,20" fill="#FFFFFF" />
            <circle cx="4.8" cy="10" r="2.2" fill="#FCD116" />
            <circle cx="2" cy="3.5" r="0.8" fill="#FCD116" />
            <circle cx="2" cy="16.5" r="0.8" fill="#FCD116" />
            <circle cx="10.5" cy="10" r="0.8" fill="#FCD116" />
          </>
        );
      case 'TH':
        return (
          <>
            <rect width="28" height="3.2" y="0" fill="#A51931" />
            <rect width="28" height="3.3" y="3.2" fill="#F4F5F8" />
            <rect width="28" height="7" y="6.5" fill="#2D2A4A" />
            <rect width="28" height="3.3" y="13.5" fill="#F4F5F8" />
            <rect width="28" height="3.2" y="16.8" fill="#A51931" />
          </>
        );
      case 'VN':
        return (
          <>
            <rect width="28" height="20" fill="#DA251D" />
            <polygon
              points="14,4.2 15.6,8.8 20.5,8.8 16.5,11.6 18,16.2 14,13.4 10,16.2 11.5,11.6 7.5,8.8 12.4,8.8"
              fill="#FFFF00"
            />
          </>
        );
      case 'JP':
        return (
          <>
            <rect width="28" height="20" fill="#FFFFFF" />
            <circle cx="14" cy="10" r="5.2" fill="#BC002D" />
          </>
        );
      case 'KR':
        return (
          <>
            <rect width="28" height="20" fill="#FFFFFF" />
            <circle cx="14" cy="10" r="4.5" fill="#CD2E3A" />
            <path d="M9.5,10 A4.5,4.5 0 0,0 18.5,10 A2.25,2.25 0 0,1 14,10 A2.25,2.25 0 0,0 9.5,10 Z" fill="#0047A0" />
            <rect x="4" y="3.5" width="3.5" height="1.1" transform="rotate(-35 5.7 4)" fill="#000000" />
            <rect x="20.5" y="3.5" width="3.5" height="1.1" transform="rotate(35 22.2 4)" fill="#000000" />
            <rect x="4" y="15.4" width="3.5" height="1.1" transform="rotate(35 5.7 16)" fill="#000000" />
            <rect x="20.5" y="15.4" width="3.5" height="1.1" transform="rotate(-35 22.2 16)" fill="#000000" />
          </>
        );
      case 'US':
        return (
          <>
            <rect width="28" height="20" fill="#FFFFFF" />
            <rect width="28" height="2.8" y="0" fill="#B22234" />
            <rect width="28" height="2.8" y="5.6" fill="#B22234" />
            <rect width="28" height="2.8" y="11.2" fill="#B22234" />
            <rect width="28" height="3.2" y="16.8" fill="#B22234" />
            <rect width="12.5" height="11.2" fill="#3C3B6E" />
            <circle cx="3" cy="2.8" r="0.7" fill="#FFFFFF" />
            <circle cx="6.2" cy="2.8" r="0.7" fill="#FFFFFF" />
            <circle cx="9.4" cy="2.8" r="0.7" fill="#FFFFFF" />
            <circle cx="4.6" cy="5.6" r="0.7" fill="#FFFFFF" />
            <circle cx="7.8" cy="5.6" r="0.7" fill="#FFFFFF" />
            <circle cx="3" cy="8.4" r="0.7" fill="#FFFFFF" />
            <circle cx="6.2" cy="8.4" r="0.7" fill="#FFFFFF" />
            <circle cx="9.4" cy="8.4" r="0.7" fill="#FFFFFF" />
          </>
        );
      case 'GB':
        return (
          <>
            <rect width="28" height="20" fill="#012169" />
            <path d="M0,0 L28,20 M28,0 L0,20" stroke="#FFFFFF" strokeWidth="3.5" />
            <path d="M0,0 L28,20 M28,0 L0,20" stroke="#C8102E" strokeWidth="1.8" />
            <path d="M14,0 V20 M0,10 H28" stroke="#FFFFFF" strokeWidth="5.2" />
            <path d="M14,0 V20 M0,10 H28" stroke="#C8102E" strokeWidth="3" />
          </>
        );
      case 'CA':
        return (
          <>
            <rect width="7" height="20" x="0" fill="#FF0000" />
            <rect width="14" height="20" x="7" fill="#FFFFFF" />
            <rect width="7" height="20" x="21" fill="#FF0000" />
            <polygon
              points="14,4.2 15.2,7.2 17.5,6.4 16.5,9.5 18.8,10.2 16.8,11.6 17.2,13 14.5,12.5 14.5,15.8 13.5,15.8 13.5,12.5 10.8,13 11.2,11.6 9.2,10.2 11.5,9.5 10.5,6.4 12.8,7.2"
              fill="#FF0000"
            />
          </>
        );
      case 'AU':
        return (
          <>
            <rect width="28" height="20" fill="#00008B" />
            <rect width="13" height="9.5" fill="#012169" />
            <path d="M0,0 L13,9.5 M13,0 L0,9.5" stroke="#FFFFFF" strokeWidth="1.6" />
            <path d="M6.5,0 V9.5 M0,4.75 H13" stroke="#FFFFFF" strokeWidth="2.6" />
            <path d="M6.5,0 V9.5 M0,4.75 H13" stroke="#C8102E" strokeWidth="1.4" />
            <circle cx="6.5" cy="14.5" r="1.5" fill="#FFFFFF" />
            <circle cx="21" cy="5.5" r="1.1" fill="#FFFFFF" />
            <circle cx="23.5" cy="9.5" r="1.1" fill="#FFFFFF" />
            <circle cx="19" cy="10.5" r="1" fill="#FFFFFF" />
            <circle cx="21.5" cy="15" r="1.2" fill="#FFFFFF" />
          </>
        );
      case 'DE':
        return (
          <>
            <rect width="28" height="6.7" y="0" fill="#000000" />
            <rect width="28" height="6.6" y="6.7" fill="#DD0000" />
            <rect width="28" height="6.7" y="13.3" fill="#FFCE00" />
          </>
        );
      case 'FR':
        return (
          <>
            <rect width="9.3" height="20" x="0" fill="#002395" />
            <rect width="9.4" height="20" x="9.3" fill="#FFFFFF" />
            <rect width="9.3" height="20" x="18.7" fill="#ED2939" />
          </>
        );
      case 'IT':
        return (
          <>
            <rect width="9.3" height="20" x="0" fill="#009246" />
            <rect width="9.4" height="20" x="9.3" fill="#FFFFFF" />
            <rect width="9.3" height="20" x="18.7" fill="#CE2B37" />
          </>
        );
      case 'ES':
        return (
          <>
            <rect width="28" height="5" y="0" fill="#AA151B" />
            <rect width="28" height="10" y="5" fill="#F1BF00" />
            <rect width="28" height="5" y="15" fill="#AA151B" />
            <rect x="6.5" y="7.4" width="3.2" height="4.8" rx="1" fill="#AA151B" />
          </>
        );
      case 'NL':
        return (
          <>
            <rect width="28" height="6.7" y="0" fill="#AE1C28" />
            <rect width="28" height="6.6" y="6.7" fill="#FFFFFF" />
            <rect width="28" height="6.7" y="13.3" fill="#21468B" />
          </>
        );
      case 'CH':
        return (
          <>
            <rect width="28" height="20" fill="#FF0000" />
            <rect x="12" y="4.5" width="4" height="11" fill="#FFFFFF" />
            <rect x="8.5" y="8" width="11" height="4" fill="#FFFFFF" />
          </>
        );
      case 'TR':
        return (
          <>
            <rect width="28" height="20" fill="#E30A17" />
            <circle cx="11.5" cy="10" r="4.8" fill="#FFFFFF" />
            <circle cx="12.8" cy="10" r="3.9" fill="#E30A17" />
            <polygon points="17.8,7.6 18.4,9.1 20,9.1 18.7,10 19.2,11.5 17.8,10.6 16.4,11.5 16.9,10 15.6,9.1 17.2,9.1" fill="#FFFFFF" />
          </>
        );
      case 'BR':
        return (
          <>
            <rect width="28" height="20" fill="#009B3A" />
            <polygon points="14,2.5 25,10 14,17.5 3,10" fill="#FEDF00" />
            <circle cx="14" cy="10" r="4.2" fill="#002776" />
            <path d="M10,9.5 Q14,8.2 18,10.8" fill="none" stroke="#FFFFFF" strokeWidth="1" />
          </>
        );
      case 'NG':
        return (
          <>
            <rect width="9.3" height="20" x="0" fill="#008751" />
            <rect width="9.4" height="20" x="9.3" fill="#FFFFFF" />
            <rect width="9.3" height="20" x="18.7" fill="#008751" />
          </>
        );
      case 'KE':
        return (
          <>
            <rect width="28" height="5.8" y="0" fill="#000000" />
            <rect width="28" height="1.2" y="5.8" fill="#FFFFFF" />
            <rect width="28" height="6" y="7" fill="#BB0000" />
            <rect width="28" height="1.2" y="13" fill="#FFFFFF" />
            <rect width="28" height="5.8" y="14.2" fill="#006600" />
            <ellipse cx="14" cy="10" rx="2.6" ry="4.8" fill="#BB0000" stroke="#FFFFFF" strokeWidth="0.9" />
          </>
        );
      case 'ZA':
        return (
          <>
            <rect width="28" height="10" y="0" fill="#DE3831" />
            <rect width="28" height="10" y="10" fill="#002395" />
            <polygon points="0,0 13.5,10 0,20" fill="#007A4D" stroke="#FFFFFF" strokeWidth="1.6" />
            <rect x="11" y="8" width="17" height="4" fill="#007A4D" stroke="#FFFFFF" strokeWidth="1" />
            <polygon points="0,3.2 9,10 0,16.8" fill="#000000" stroke="#FFB612" strokeWidth="1.4" />
          </>
        );
      case 'EG':
        return (
          <>
            <rect width="28" height="6.7" y="0" fill="#CE1126" />
            <rect width="28" height="6.6" y="6.7" fill="#FFFFFF" />
            <rect width="28" height="6.7" y="13.3" fill="#000000" />
            <rect x="12.5" y="7.6" width="3" height="4.8" rx="0.8" fill="#C09300" />
          </>
        );
      default:
        return (
          <>
            <rect width="28" height="20" fill="#1E293B" />
            <circle cx="14" cy="10" r="5" fill="none" stroke="#94A3B8" strokeWidth="1.4" />
            <path d="M9,10 H19 M14,5 V15" stroke="#94A3B8" strokeWidth="1.1" />
          </>
        );
    }
  };

  return (
    <svg
      viewBox="0 0 28 20"
      className={`${className} rounded-[3px] shrink-0 overflow-hidden shadow-sm ring-1 ring-white/15`}
      role="img"
      aria-label={upper ? `${upper} flag` : 'Country flag'}
    >
      <defs>
        <clipPath id={uid}>
          <rect width="28" height="20" rx="2.5" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${uid})`}>{renderArtwork()}</g>
    </svg>
  );
};

interface CountrySelectorProps {
  value?: string;
  onChange: (countryCode: string) => void;
  disabled?: boolean;
  label?: string;
  compact?: boolean;
}

export const CountrySelector: React.FC<CountrySelectorProps> = ({
  value,
  onChange,
  disabled = false,
  label = 'Country / Region',
  compact = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selected = getCountryByCode(value);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 40);
    } else {
      setSearchTerm('');
    }
  }, [isOpen]);

  const filteredCountries = COUNTRY_OPTIONS.filter((c) => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q) ||
      c.dialCode.includes(q)
    );
  });

  return (
    <div ref={containerRef} className="relative w-full">
      {label && (
        <label className="text-[11px] font-bold text-slate-300 mb-1.5 flex items-center space-x-1.5">
          <Globe className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>{label}</span>
        </label>
      )}

      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full ${
          compact ? 'min-h-[42px] px-3 py-2' : 'min-h-[46px] px-3.5 py-2.5'
        } rounded-xl bg-slate-950 border ${
          isOpen ? 'border-amber-500 ring-1 ring-amber-500/30' : 'border-slate-800 hover:border-slate-700'
        } text-left flex items-center justify-between gap-2 transition-all disabled:opacity-60`}
      >
        <div className="flex items-center space-x-2.5 min-w-0">
          {selected ? (
            <>
              <CountryFlag code={selected.code} className="w-7 h-5" />
              <div className="min-w-0 flex items-center space-x-1.5">
                <span className="text-xs font-extrabold text-white truncate">
                  {selected.name}
                </span>
                <span className="text-[10px] font-mono text-slate-400 shrink-0">
                  ({selected.code})
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="w-7 h-5 rounded-[3px] bg-slate-900 border border-slate-700 flex items-center justify-center shrink-0">
                <Globe className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <span className="text-xs font-medium text-slate-400 truncate">
                Select your country...
              </span>
            </>
          )}
        </div>

        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-150 ${
            isOpen ? 'rotate-180 text-amber-400' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          className="absolute left-0 right-0 mt-1.5 z-50 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl shadow-black/60 overflow-hidden"
        >
          {/* Search Input */}
          <div className="p-2 border-b border-slate-800 bg-slate-950/70">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search country..."
                className="w-full min-h-[36px] bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-7 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Options */}
          <div className="max-h-56 overflow-y-auto divide-y divide-slate-800/50 p-1">
            {filteredCountries.length > 0 ? (
              filteredCountries.map((country) => {
                const isSelected = selected?.code === country.code;
                return (
                  <button
                    key={country.code}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onChange(country.code);
                      setIsOpen(false);
                    }}
                    className={`w-full min-h-[42px] px-2.5 py-2 rounded-xl flex items-center justify-between text-left transition-colors ${
                      isSelected
                        ? 'bg-amber-500/15 text-amber-300'
                        : 'text-slate-200 hover:bg-slate-800/70'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <CountryFlag code={country.code} className="w-6 h-4" />
                      <span className="text-xs font-bold truncate">{country.name}</span>
                      <span className="text-[10px] font-mono text-slate-400 shrink-0">
                        {country.dialCode}
                      </span>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-amber-400 shrink-0" />}
                  </button>
                );
              })
            ) : (
              <div className="py-5 text-center text-xs text-slate-400">
                No matching countries found.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
