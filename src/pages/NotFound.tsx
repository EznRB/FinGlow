import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout'; // Optional: Use layout or standalone
import { Button } from '../components/ui/Button';
import { LayoutDashboard, Bell, CreditCard } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export const NotFound: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col relative overflow-hidden font-sans text-slate-50">
       
       {/* Mock Header for immersion */}
       <div className="h-16 border-b border-slate-800 flex items-center justify-between px-8 bg-slate-950/50 backdrop-blur-md z-20">
          <div className="flex items-center gap-2">
             <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
             </div>
             <span className="font-bold text-lg">FinGlow</span>
          </div>
          <div className="flex gap-4">
             <Bell className="w-5 h-5 text-slate-500" />
             <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700" />
          </div>
       </div>

       <div className="flex-1 flex flex-col items-center justify-center p-6 z-10">
          <div className="relative w-64 h-40 mb-8">
             {/* Broken Chart Visualization */}
             <svg viewBox="0 0 200 120" className="w-full h-full drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                {/* Grid */}
                <path d="M0 120 H200" stroke="#334155" strokeWidth="1" />
                <path d="M0 0 V120" stroke="#334155" strokeWidth="1" />
                
                {/* Line Up */}
                <path d="M0 80 C 40 70, 60 40, 100 20" stroke="#10b981" strokeWidth="3" fill="none" strokeLinecap="round" />
                {/* Dot at break */}
                <circle cx="100" cy="20" r="3" fill="#10b981" />
                
                {/* Line Down (Crash) */}
                <path d="M106 22 L 130 110" stroke="#f43f5e" strokeWidth="3" fill="none" strokeLinecap="round" className="animate-[pulse-slow_3s_infinite]" />
                <circle cx="130" cy="110" r="3" fill="#f43f5e" />
             </svg>
             
             {/* 404 Text Background */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[120px] font-bold text-slate-900 select-none z-[-1]">
                404
             </div>
          </div>

          <h1 className="text-3xl font-bold text-white mb-3 text-center">{t.error404.title}</h1>
          <p className="text-slate-400 max-w-md text-center mb-8 leading-relaxed">
             {t.error404.message}
          </p>

          <Button 
             onClick={() => navigate('/dashboard')}
             className="bg-emerald-500 hover:bg-emerald-600 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all duration-300"
          >
             <LayoutDashboard className="w-4 h-4 mr-2" />
             {t.error404.backBtn}
          </Button>
       </div>

       {/* Background Grid */}
       <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
    </div>
  );
};