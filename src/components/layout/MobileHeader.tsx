import React from 'react';
import { Zap, Globe } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { motion } from 'framer-motion';

export const MobileHeader: React.FC = () => {
    const { language, toggleLanguage } = useLanguage();

    return (
        <header className="flex md:hidden items-center justify-between px-6 h-16 bg-slate-950/80 backdrop-blur-lg border-b border-slate-800 sticky top-0 z-[60]">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <Zap className="w-5 h-5 text-white" fill="currentColor" />
                </div>
                <span className="text-xl font-bold text-white tracking-tight">FinGlow</span>
            </div>

            <button
                onClick={toggleLanguage}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-emerald-400 transition-colors active:scale-95"
            >
                <Globe className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest">
                    {language === 'en' ? 'EN' : 'PT'}
                </span>
            </button>
        </header>
    );
};
