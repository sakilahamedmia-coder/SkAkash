import React from 'react';
import { DepositNetworkConfig } from '../types';

export interface DepositLogoPreset {
  key: string;
  label: string;
  defaultId: string;
  defaultCode: string;
  defaultName: string;
  defaultShortLabel: string;
  defaultMinDeposit: number;
  defaultEstimatedTime: string;
  defaultConfirmations: string;
  defaultFeeLabel: string;
  defaultExplorerTxBase: string;
}

export const DEPOSIT_LOGO_PRESETS: DepositLogoPreset[] = [
  {
    key: 'bep20',
    label: 'BNB Smart Chain (BEP20)',
    defaultId: 'BEP20',
    defaultCode: 'BSC (BEP20)',
    defaultName: 'BNB Smart Chain (BEP20)',
    defaultShortLabel: 'USDT BEP-20',
    defaultMinDeposit: 10,
    defaultEstimatedTime: '~2 mins',
    defaultConfirmations: '15 Block Confirmations',
    defaultFeeLabel: '0 USDT',
    defaultExplorerTxBase: 'https://bscscan.com/tx/'
  },
  {
    key: 'trc20',
    label: 'TRON (TRC20)',
    defaultId: 'TRC20',
    defaultCode: 'TRX (TRC20)',
    defaultName: 'TRON (TRC20)',
    defaultShortLabel: 'USDT TRC-20',
    defaultMinDeposit: 10,
    defaultEstimatedTime: '~1 min',
    defaultConfirmations: '1 Block Confirmation',
    defaultFeeLabel: '0 USDT',
    defaultExplorerTxBase: 'https://tronscan.org/#/transaction/'
  },
  {
    key: 'sol',
    label: 'Solana (SOL)',
    defaultId: 'SOL',
    defaultCode: 'SOL',
    defaultName: 'Solana',
    defaultShortLabel: 'USDT Solana',
    defaultMinDeposit: 5,
    defaultEstimatedTime: '~1 min',
    defaultConfirmations: '1 Confirmation',
    defaultFeeLabel: '0 USDT',
    defaultExplorerTxBase: 'https://solscan.io/tx/'
  },
  {
    key: 'polygon',
    label: 'Polygon (MATIC)',
    defaultId: 'POLYGON',
    defaultCode: 'MATIC (Polygon)',
    defaultName: 'Polygon POS',
    defaultShortLabel: 'USDT Polygon',
    defaultMinDeposit: 5,
    defaultEstimatedTime: '~3 mins',
    defaultConfirmations: '128 Block Confirmations',
    defaultFeeLabel: '0 USDT',
    defaultExplorerTxBase: 'https://polygonscan.com/tx/'
  },
  {
    key: 'erc20',
    label: 'Ethereum (ERC20)',
    defaultId: 'ERC20',
    defaultCode: 'ETH (ERC20)',
    defaultName: 'Ethereum (ERC20)',
    defaultShortLabel: 'USDT ERC-20',
    defaultMinDeposit: 20,
    defaultEstimatedTime: '~5 mins',
    defaultConfirmations: '6 Block Confirmations',
    defaultFeeLabel: '0 USDT',
    defaultExplorerTxBase: 'https://etherscan.io/tx/'
  },
  {
    key: 'ton',
    label: 'TON Network',
    defaultId: 'TON',
    defaultCode: 'TON',
    defaultName: 'The Open Network (TON)',
    defaultShortLabel: 'USDT TON',
    defaultMinDeposit: 5,
    defaultEstimatedTime: '~1 min',
    defaultConfirmations: '1 Confirmation',
    defaultFeeLabel: '0 USDT',
    defaultExplorerTxBase: 'https://tonviewer.com/transaction/'
  },
  {
    key: 'arb',
    label: 'Arbitrum One',
    defaultId: 'ARBITRUM',
    defaultCode: 'ARB (Arbitrum One)',
    defaultName: 'Arbitrum One',
    defaultShortLabel: 'USDT Arbitrum',
    defaultMinDeposit: 5,
    defaultEstimatedTime: '~2 mins',
    defaultConfirmations: '10 Block Confirmations',
    defaultFeeLabel: '0 USDT',
    defaultExplorerTxBase: 'https://arbiscan.io/tx/'
  },
  {
    key: 'op',
    label: 'Optimism (OP)',
    defaultId: 'OPTIMISM',
    defaultCode: 'OP (Optimism)',
    defaultName: 'Optimism Mainnet',
    defaultShortLabel: 'USDT Optimism',
    defaultMinDeposit: 5,
    defaultEstimatedTime: '~2 mins',
    defaultConfirmations: '10 Block Confirmations',
    defaultFeeLabel: '0 USDT',
    defaultExplorerTxBase: 'https://optimistic.etherscan.io/tx/'
  },
  {
    key: 'base',
    label: 'Base Network',
    defaultId: 'BASE',
    defaultCode: 'BASE',
    defaultName: 'Base Mainnet',
    defaultShortLabel: 'USDC/USDT Base',
    defaultMinDeposit: 5,
    defaultEstimatedTime: '~2 mins',
    defaultConfirmations: '5 Block Confirmations',
    defaultFeeLabel: '0 USDT',
    defaultExplorerTxBase: 'https://basescan.org/tx/'
  },
  {
    key: 'avax',
    label: 'Avalanche C-Chain',
    defaultId: 'AVAXC',
    defaultCode: 'AVAX C-Chain',
    defaultName: 'Avalanche C-Chain',
    defaultShortLabel: 'USDT AVAX-C',
    defaultMinDeposit: 10,
    defaultEstimatedTime: '~2 mins',
    defaultConfirmations: '10 Block Confirmations',
    defaultFeeLabel: '0 USDT',
    defaultExplorerTxBase: 'https://snowtrace.io/tx/'
  },
  {
    key: 'btc',
    label: 'Bitcoin (BTC)',
    defaultId: 'BTC',
    defaultCode: 'BTC',
    defaultName: 'Bitcoin Network',
    defaultShortLabel: 'BTC Market',
    defaultMinDeposit: 10,
    defaultEstimatedTime: '~15 mins',
    defaultConfirmations: '2 Block Confirmations',
    defaultFeeLabel: '0 USDT',
    defaultExplorerTxBase: 'https://mempool.space/tx/'
  },
  {
    key: 'binance',
    label: 'Binance Pay',
    defaultId: 'BINANCE_PAY',
    defaultCode: 'Binance Pay',
    defaultName: 'Binance Pay (UID / Pay ID)',
    defaultShortLabel: 'Binance Pay',
    defaultMinDeposit: 5,
    defaultEstimatedTime: 'Instant (~30 secs)',
    defaultConfirmations: 'Instant Internal Transfer',
    defaultFeeLabel: '0 USDT',
    defaultExplorerTxBase: 'https://www.binance.com/'
  },
  {
    key: 'bybit',
    label: 'Bybit Pay',
    defaultId: 'BYBIT_PAY',
    defaultCode: 'Bybit UID',
    defaultName: 'Bybit Internal Transfer',
    defaultShortLabel: 'Bybit Pay',
    defaultMinDeposit: 5,
    defaultEstimatedTime: 'Instant (~30 secs)',
    defaultConfirmations: 'Instant UID Transfer',
    defaultFeeLabel: '0 USDT',
    defaultExplorerTxBase: 'https://www.bybit.com/'
  },
  {
    key: 'okx',
    label: 'OKX Pay',
    defaultId: 'OKX_PAY',
    defaultCode: 'OKX UID',
    defaultName: 'OKX Internal Transfer',
    defaultShortLabel: 'OKX Pay',
    defaultMinDeposit: 5,
    defaultEstimatedTime: 'Instant (~30 secs)',
    defaultConfirmations: 'Instant UID Transfer',
    defaultFeeLabel: '0 USDT',
    defaultExplorerTxBase: 'https://www.okx.com/'
  },
  {
    key: 'bkash',
    label: 'bKash',
    defaultId: 'BKASH',
    defaultCode: 'bKash (BDT/USDT)',
    defaultName: 'bKash Agent / Personal',
    defaultShortLabel: 'bKash Market',
    defaultMinDeposit: 5,
    defaultEstimatedTime: '~3 mins',
    defaultConfirmations: 'TrxID Verification',
    defaultFeeLabel: '0%',
    defaultExplorerTxBase: 'https://www.bkash.com/'
  },
  {
    key: 'nagad',
    label: 'Nagad',
    defaultId: 'NAGAD',
    defaultCode: 'Nagad (BDT/USDT)',
    defaultName: 'Nagad Agent / Personal',
    defaultShortLabel: 'Nagad Market',
    defaultMinDeposit: 5,
    defaultEstimatedTime: '~3 mins',
    defaultConfirmations: 'TrxID Verification',
    defaultFeeLabel: '0%',
    defaultExplorerTxBase: 'https://nagad.com.bd/'
  },
  {
    key: 'usdt',
    label: 'Tether USDT (Generic)',
    defaultId: 'USDT_MARKET',
    defaultCode: 'USDT',
    defaultName: 'TetherUS Custom Market',
    defaultShortLabel: 'USDT Market',
    defaultMinDeposit: 10,
    defaultEstimatedTime: '~2 mins',
    defaultConfirmations: '1 Confirmation',
    defaultFeeLabel: '0 USDT',
    defaultExplorerTxBase: 'https://bscscan.com/tx/'
  }
];

export function resolveDepositLogoKey(
  network?: Partial<DepositNetworkConfig> | string | null
): string {
  if (!network) return 'usdt';
  if (typeof network === 'string') {
    const s = network.toLowerCase();
    return matchLogoText(s);
  }
  if (network.logoKey && DEPOSIT_LOGO_PRESETS.some((p) => p.key === network.logoKey)) {
    return network.logoKey;
  }
  const combined = `${network.id || ''} ${network.code || ''} ${network.name || ''} ${network.shortLabel || ''}`.toLowerCase();
  return matchLogoText(combined);
}

function matchLogoText(text: string): string {
  if (text.includes('bkash')) return 'bkash';
  if (text.includes('nagad')) return 'nagad';
  if (text.includes('binance')) return 'binance';
  if (text.includes('bybit')) return 'bybit';
  if (text.includes('okx')) return 'okx';
  if (text.includes('bep20') || text.includes('bep-20') || text.includes('bsc') || text.includes('bnb')) return 'bep20';
  if (text.includes('trc20') || text.includes('trc-20') || text.includes('tron') || text.includes('trx')) return 'trc20';
  if (text.includes('sol')) return 'sol';
  if (text.includes('poly') || text.includes('matic')) return 'polygon';
  if (text.includes('erc20') || text.includes('erc-20') || text.includes('eth')) return 'erc20';
  if (text.includes('ton')) return 'ton';
  if (text.includes('arb')) return 'arb';
  if (text.includes('optim') || /\bop\b/.test(text)) return 'op';
  if (text.includes('base')) return 'base';
  if (text.includes('avax') || text.includes('avalanche')) return 'avax';
  if (text.includes('btc') || text.includes('bitcoin')) return 'btc';
  return 'usdt';
}

export const DepositMarketLogo: React.FC<{
  network?: Partial<DepositNetworkConfig> | string | null;
  logoKey?: string;
  className?: string;
}> = ({ network, logoKey, className = 'w-7 h-7' }) => {
  const key = logoKey || resolveDepositLogoKey(network);

  switch (key) {
    case 'bep20':
      return (
        <svg viewBox="0 0 32 32" fill="none" className={className} aria-label="BNB Smart Chain Logo">
          <circle cx="16" cy="16" r="16" fill="#F0B90B" />
          <path d="M16 7L20.5 11.5L18.6 13.4L16 10.8L13.4 13.4L11.5 11.5L16 7Z" fill="#181A20" />
          <path d="M16 25L20.5 20.5L18.6 18.6L16 21.2L13.4 18.6L11.5 20.5L16 25Z" fill="#181A20" />
          <path d="M9 14L10.9 16L9 18L7 16L9 14Z" fill="#181A20" />
          <path d="M23 14L25 16L23 18L21.1 16L23 14Z" fill="#181A20" />
          <path d="M16 13.6L18.4 16L16 18.4L13.6 16L16 13.6Z" fill="#181A20" />
        </svg>
      );

    case 'trc20':
      return (
        <svg viewBox="0 0 32 32" fill="none" className={className} aria-label="TRON TRC20 Logo">
          <circle cx="16" cy="16" r="16" fill="#EF0027" />
          <path d="M8.5 9.2L22.8 11.8L25 14.5L14.2 24.5L8.5 9.2Z" stroke="#FFFFFF" strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M8.5 9.2L16.5 15.2L22.8 11.8" stroke="#FFFFFF" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M16.5 15.2L14.2 24.5" stroke="#FFFFFF" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M16.5 15.2L25 14.5" stroke="#FFFFFF" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      );

    case 'sol':
      return (
        <svg viewBox="0 0 32 32" fill="none" className={className} aria-label="Solana Logo">
          <defs>
            <linearGradient id="solBg" x1="4" y1="28" x2="28" y2="4" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#9945FF" />
              <stop offset="50%" stopColor="#19FB9B" />
              <stop offset="100%" stopColor="#00FFA3" />
            </linearGradient>
          </defs>
          <circle cx="16" cy="16" r="16" fill="#12161F" />
          <path d="M9.5 10.2C9.7 9.9 10 9.8 10.4 9.8H23.2C23.7 9.8 23.9 10.4 23.6 10.8L21.7 12.7C21.5 12.9 21.2 13 20.8 13H8.1C7.6 13 7.3 12.4 7.7 12L9.5 10.2Z" fill="url(#solBg)" />
          <path d="M9.5 19.2C9.7 19 10 18.9 10.4 18.9H23.2C23.7 18.9 23.9 19.5 23.6 19.9L21.7 21.8C21.5 22 21.2 22.1 20.8 22.1H8.1C7.6 22.1 7.3 21.5 7.7 21.1L9.5 19.2Z" fill="url(#solBg)" />
          <path d="M21.7 14.7C21.5 14.5 21.2 14.4 20.8 14.4H8.1C7.6 14.4 7.3 15 7.7 15.4L9.5 17.3C9.7 17.5 10 17.6 10.4 17.6H23.2C23.7 17.6 23.9 17 23.6 16.6L21.7 14.7Z" fill="url(#solBg)" />
        </svg>
      );

    case 'polygon':
      return (
        <svg viewBox="0 0 32 32" fill="none" className={className} aria-label="Polygon Logo">
          <circle cx="16" cy="16" r="16" fill="#8247E5" />
          <path
            d="M20.4 13.2C20 13 19.5 13 19.1 13.2L16.2 14.9L14.2 16L11.3 17.7C10.9 17.9 10.4 17.9 10 17.7L7.7 16.4C7.3 16.2 7.1 15.7 7.1 15.3V12.7C7.1 12.3 7.3 11.8 7.7 11.6L10 10.3C10.4 10.1 10.9 10.1 11.3 10.3L13.6 11.6C14 11.8 14.2 12.3 14.2 12.7V14.4L16.2 13.3V11.5C16.2 11.1 16 10.6 15.6 10.4L11.4 8C11 7.8 10.5 7.8 10.1 8L5.9 10.4C5.5 10.6 5.2 11.1 5.2 11.5V16.4C5.2 16.8 5.4 17.3 5.8 17.5L10 19.9C10.4 20.1 10.9 20.1 11.3 19.9L14.2 18.2L16.2 17.1L19.1 15.4C19.5 15.2 20 15.2 20.4 15.4L22.7 16.7C23.1 16.9 23.3 17.4 23.3 17.8V20.4C23.3 20.8 23.1 21.3 22.7 21.5L20.4 22.8C20 23 19.5 23 19.1 22.8L16.8 21.5C16.4 21.3 16.2 20.8 16.2 20.4V18.7L14.2 19.8V21.5C14.2 21.9 14.4 22.4 14.8 22.6L19 25C19.4 25.2 19.9 25.2 20.3 25L24.5 22.6C24.9 22.4 25.2 21.9 25.2 21.5V16.6C25.2 16.2 25 15.7 24.6 15.5L20.4 13.2Z"
            fill="#FFFFFF"
          />
        </svg>
      );

    case 'erc20':
      return (
        <svg viewBox="0 0 32 32" fill="none" className={className} aria-label="Ethereum ERC20 Logo">
          <circle cx="16" cy="16" r="16" fill="#627EEA" />
          <path d="M16.2 5.5V13.3L22.7 16.2L16.2 5.5Z" fill="#FFFFFF" fillOpacity="0.7" />
          <path d="M16.2 5.5L9.7 16.2L16.2 13.3V5.5Z" fill="#FFFFFF" />
          <path d="M16.2 21.2V26.5L22.7 17.5L16.2 21.2Z" fill="#FFFFFF" fillOpacity="0.7" />
          <path d="M16.2 26.5V21.2L9.7 17.5L16.2 26.5Z" fill="#FFFFFF" />
          <path d="M16.2 20L22.7 16.2L16.2 13.3V20Z" fill="#FFFFFF" fillOpacity="0.4" />
          <path d="M9.7 16.2L16.2 20V13.3L9.7 16.2Z" fill="#FFFFFF" fillOpacity="0.85" />
        </svg>
      );

    case 'ton':
      return (
        <svg viewBox="0 0 32 32" fill="none" className={className} aria-label="TON Network Logo">
          <circle cx="16" cy="16" r="16" fill="#0098EA" />
          <path
            d="M10.4 10.5H21.6C22.7 10.5 23.4 11.7 22.8 12.7L16.9 22.8C16.5 23.5 15.5 23.5 15.1 22.8L9.2 12.7C8.6 11.7 9.3 10.5 10.4 10.5Z"
            stroke="#FFFFFF"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path d="M16 10.5V23" stroke="#FFFFFF" strokeWidth="1.8" />
        </svg>
      );

    case 'arb':
      return (
        <svg viewBox="0 0 32 32" fill="none" className={className} aria-label="Arbitrum One Logo">
          <circle cx="16" cy="16" r="16" fill="#213147" />
          <path d="M16 6L24.5 11V21L16 26L7.5 21V11L16 6Z" stroke="#12AAFF" strokeWidth="2" />
          <path d="M12.5 20.5L16 10.5L19.5 20.5" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M14.2 17.5H17.8" stroke="#12AAFF" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    case 'op':
      return (
        <svg viewBox="0 0 32 32" fill="none" className={className} aria-label="Optimism Logo">
          <circle cx="16" cy="16" r="16" fill="#FF0420" />
          <circle cx="12.2" cy="16" r="3.6" stroke="#FFFFFF" strokeWidth="2.1" />
          <path d="M18 19.6V12.4H20.6C22.1 12.4 23.1 13.3 23.1 14.7C23.1 16.1 22.1 17 20.6 17H18" stroke="#FFFFFF" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    case 'base':
      return (
        <svg viewBox="0 0 32 32" fill="none" className={className} aria-label="Base Network Logo">
          <circle cx="16" cy="16" r="16" fill="#0052FF" />
          <circle cx="16" cy="16" r="8.2" stroke="#FFFFFF" strokeWidth="2.5" />
          <path d="M8 16H16" stroke="#FFFFFF" strokeWidth="2.6" strokeLinecap="round" />
        </svg>
      );

    case 'avax':
      return (
        <svg viewBox="0 0 32 32" fill="none" className={className} aria-label="Avalanche Logo">
          <circle cx="16" cy="16" r="16" fill="#E84142" />
          <path d="M16 8.2L22.8 20.8H18.4L16 16.2L13.6 20.8H9.2L16 8.2Z" fill="#FFFFFF" />
          <path d="M21.2 17.6L23.4 20.8H19L21.2 17.6Z" fill="#FFD1D1" />
        </svg>
      );

    case 'btc':
      return (
        <svg viewBox="0 0 32 32" fill="none" className={className} aria-label="Bitcoin Logo">
          <circle cx="16" cy="16" r="16" fill="#F7931A" />
          <path
            d="M20.6 14.3C20.9 12.4 19.4 11.4 17.4 10.7L18 8.3L16.5 7.9L15.9 10.3C15.5 10.2 15.1 10.1 14.7 10L15.3 7.6L13.8 7.2L13.2 9.6C12.9 9.5 12.5 9.4 12.2 9.4L10.2 8.9L9.8 10.5C9.8 10.5 10.9 10.7 10.9 10.8C11.5 10.9 11.6 11.3 11.6 11.6L10.9 14.3L10 18C9.9 18.2 9.7 18.6 9.1 18.4C9.1 18.4 8 18.2 8 18.2L7.3 19.9L9.2 20.4L10.2 20.6L9.6 23.1L11.1 23.5L11.7 21C12.1 21.1 12.5 21.2 12.9 21.3L12.3 23.8L13.8 24.2L14.4 21.7C17 22.2 19 22 19.8 19.6C20.5 17.7 19.8 16.6 18.4 15.9C19.4 15.7 20.4 15.2 20.6 14.3ZM17.3 18.6C16.8 20.5 13.7 19.5 12.7 19.2L13.5 16C14.5 16.3 17.8 16.7 17.3 18.6ZM17.8 14.2C17.4 15.9 14.8 15 13.9 14.8L14.6 11.9C15.5 12.1 18.2 12.5 17.8 14.2Z"
            fill="#FFFFFF"
          />
        </svg>
      );

    case 'binance':
      return (
        <svg viewBox="0 0 32 32" fill="none" className={className} aria-label="Binance Pay Logo">
          <circle cx="16" cy="16" r="16" fill="#181A20" />
          <path d="M16 6.2L21.4 11.6L19.2 13.8L16 10.6L12.8 13.8L10.6 11.6L16 6.2Z" fill="#F0B90B" />
          <path d="M16 25.8L21.4 20.4L19.2 18.2L16 21.4L12.8 18.2L10.6 20.4L16 25.8Z" fill="#F0B90B" />
          <path d="M8.4 13.8L10.6 16L8.4 18.2L6.2 16L8.4 13.8Z" fill="#F0B90B" />
          <path d="M23.6 13.8L25.8 16L23.6 18.2L21.4 16L23.6 13.8Z" fill="#F0B90B" />
          <path d="M16 13.4L18.6 16L16 18.6L13.4 16L16 13.4Z" fill="#F0B90B" />
        </svg>
      );

    case 'bybit':
      return (
        <svg viewBox="0 0 32 32" fill="none" className={className} aria-label="Bybit Pay Logo">
          <circle cx="16" cy="16" r="16" fill="#17181E" />
          <path d="M8 11H12.5C14.2 11 15.2 11.9 15.2 13.2C15.2 14.1 14.6 14.8 13.8 15.1C14.8 15.4 15.5 16.2 15.5 17.3C15.5 18.9 14.3 20 12.5 20H8V11Z" stroke="#FFFFFF" strokeWidth="1.9" strokeLinejoin="round" />
          <path d="M20.5 10V15.5" stroke="#F7A600" strokeWidth="2.6" strokeLinecap="round" />
          <path d="M20.5 18.8V21.5" stroke="#F7A600" strokeWidth="2.6" strokeLinecap="round" />
        </svg>
      );

    case 'okx':
      return (
        <svg viewBox="0 0 32 32" fill="none" className={className} aria-label="OKX Logo">
          <circle cx="16" cy="16" r="16" fill="#0B0C0E" />
          <rect x="8.5" y="8.5" width="4.6" height="4.6" rx="0.8" fill="#FFFFFF" />
          <rect x="18.9" y="8.5" width="4.6" height="4.6" rx="0.8" fill="#FFFFFF" />
          <rect x="13.7" y="13.7" width="4.6" height="4.6" rx="0.8" fill="#FFFFFF" />
          <rect x="8.5" y="18.9" width="4.6" height="4.6" rx="0.8" fill="#FFFFFF" />
          <rect x="18.9" y="18.9" width="4.6" height="4.6" rx="0.8" fill="#FFFFFF" />
        </svg>
      );

    case 'bkash':
      return (
        <svg viewBox="0 0 32 32" fill="none" className={className} aria-label="bKash Logo">
          <circle cx="16" cy="16" r="16" fill="#E2136E" />
          <path d="M8.5 11.2L15.8 7.5L19.4 14.3L12.6 15.8L8.5 11.2Z" fill="#FFFFFF" />
          <path d="M19.4 14.3L24.5 11.5L21.1 17.8L15.8 18.2L19.4 14.3Z" fill="#FFD1E4" />
          <path d="M12.6 15.8L19.4 14.3L15.4 24.5L11.2 19.8L12.6 15.8Z" fill="#FFFFFF" />
          <path d="M6.8 13.8L12.6 15.8L11.2 19.8L6.8 13.8Z" fill="#FFB3D2" />
        </svg>
      );

    case 'nagad':
      return (
        <svg viewBox="0 0 32 32" fill="none" className={className} aria-label="Nagad Logo">
          <defs>
            <linearGradient id="nagadMarketGrad" x1="2" y1="2" x2="30" y2="30" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#F7941D" />
              <stop offset="100%" stopColor="#ED1C24" />
            </linearGradient>
          </defs>
          <circle cx="16" cy="16" r="16" fill="url(#nagadMarketGrad)" />
          <circle cx="16" cy="16" r="8.5" stroke="#FFFFFF" strokeWidth="2.1" />
          <path
            d="M16 9.5C18.3 12.1 19.5 14.4 19.5 16.5C19.5 18.8 17.9 20.6 16 20.6C14.1 20.6 12.5 18.8 12.5 16.5C12.5 14.9 13.3 13.4 14.6 12.1C14.8 13.6 15.5 14.6 16.4 15.1C16.1 13.4 15.8 11.6 16 9.5Z"
            fill="#FFFFFF"
          />
        </svg>
      );

    case 'usdt':
    default:
      return (
        <svg viewBox="0 0 32 32" fill="none" className={className} aria-label="USDT Market Logo">
          <circle cx="16" cy="16" r="16" fill="#26A17B" />
          <path
            d="M17.922 17.383v-.002c-.11.008-.677.042-1.942.042-1.01 0-1.721-.03-1.971-.042v.003c-3.888-.171-6.79-.848-6.79-1.658 0-.809 2.902-1.486 6.79-1.66v2.644c.254.018.982.061 1.988.061 1.207 0 1.812-.05 1.925-.06v-2.643c3.88.173 6.775.85 6.775 1.658 0 .81-2.895 1.485-6.775 1.657m0-3.59v-2.366h5.414V7.819H8.595v3.608h5.414v2.365c-4.4.202-7.709 1.074-7.709 2.118 0 1.044 3.309 1.915 7.709 2.118v7.582h3.913v-7.584c4.393-.202 7.694-1.073 7.694-2.116 0-1.043-3.301-1.914-7.694-2.117"
            fill="#FFFFFF"
          />
        </svg>
      );
  }
};
