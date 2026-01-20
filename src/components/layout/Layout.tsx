import React from 'react';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { MobileHeader } from './MobileHeader';

interface LayoutProps {
  children: React.ReactNode;
  credits: number;
  onLogout: () => void;
  onAddCredits?: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, credits, onLogout, onAddCredits }) => {
  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-50 font-sans flex-col md:flex-row">
      <MobileHeader />
      <Sidebar credits={credits} onLogout={onLogout} onAddCredits={onAddCredits} />

      <main className="flex-1 overflow-y-auto relative h-screen">
        {/* Top subtle glow effect */}
        <div className="absolute top-0 left-0 w-full h-96 bg-emerald-500/5 blur-[120px] pointer-events-none" />

        {/* Content with padding adjustment for BottomNav on mobile */}
        <div className="relative z-10 p-4 pb-32 md:p-10 max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* Mobile Navigation */}
      <BottomNav />
    </div>
  );
};