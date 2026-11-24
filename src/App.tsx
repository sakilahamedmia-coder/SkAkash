import React, { useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AndroidFrame } from './components/AndroidFrame';
import { ReferralLandingPage } from './components/ReferralLandingPage';
import { ToastContainer } from './components/ToastContainer';

const MainLayout: React.FC = () => {
  const { theme, referralLandingCode } = useApp();

  useEffect(() => {
    document.title = referralLandingCode
      ? `Download Crypto Earn Go — Invite ${referralLandingCode}`
      : 'Crypto Earn Go — Android App';
  }, [referralLandingCode]);

  return (
    <div
      className={`min-h-[100dvh] flex flex-col ${
        theme === 'dark' ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'
      }`}
    >
      {referralLandingCode ? (
        <ReferralLandingPage code={referralLandingCode} />
      ) : (
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-y-auto bg-slate-950 flex flex-col items-center justify-center sm:py-4">
            <AndroidFrame />
          </div>
        </div>
      )}

      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
