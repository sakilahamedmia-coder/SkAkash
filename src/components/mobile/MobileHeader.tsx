import React from 'react';

export const MobileHeader: React.FC = () => {
  return (
    <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-2.5 flex items-center justify-center gap-2.5 text-white shadow-sm">
      <img
        src="/assets/aistudio/file_00000000b1a881fa9f8249d48e315dcc_d0d81d28.png"
        alt="Crypto Earn Go Logo"
        className="w-8 h-8 rounded-xl object-cover border border-amber-500/40 shadow-md shadow-amber-500/10 shrink-0"
      />
      <h1 className="font-extrabold text-base tracking-tight text-white">
        Crypto Earn Go
      </h1>
    </header>
  );
};



