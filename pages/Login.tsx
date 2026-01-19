import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { motion } from 'framer-motion';
import { Activity, Lock, Mail, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface LoginProps {
  onLogin: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate network request
    setTimeout(() => {
        setIsLoading(false);
        onLogin();
    }, 1500);
  };

  return (
    <div className="min-h-screen flex w-full bg-slate-950 font-sans selection:bg-emerald-500/30">
      
      {/* Left Panel - Visuals */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden bg-slate-900 items-center justify-center p-12">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-emerald-500/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[100px]" />
        
        <div className="relative z-10 max-w-lg">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-6">
              <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></span>
              {t.login.tagline}
            </div>
            <h1 className="text-5xl font-bold text-white mb-6 leading-tight">
              {t.login.heroTitle} <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">{t.login.heroSubtitle}</span>
            </h1>
            <p className="text-slate-400 text-lg mb-8 leading-relaxed">
              {t.login.heroDesc}
            </p>

            <div className="space-y-4">
              {t.login.features.map((item, i) => (
                <div key={i} className="flex items-center text-slate-300">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 mr-3" />
                  {item}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative">
        <div className="absolute top-0 right-0 p-8">
          <div className="text-slate-500 text-sm">
            {t.login.needAccount} <span className="text-emerald-400 font-medium cursor-pointer hover:underline">{t.login.requestAccess}</span>
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="mb-10 text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start mb-4">
               <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 mr-3">
                 <Activity className="w-6 h-6 text-white" />
               </div>
               <span className="text-2xl font-bold text-white">FinGlow</span>
            </div>
            <h2 className="text-2xl font-semibold text-white mb-2">{t.login.welcome}</h2>
            <p className="text-slate-400">{t.login.enterDetails}</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300 ml-1">{t.login.emailLabel}</label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
                <input 
                  type="email" 
                  defaultValue="demo@finglow.ai" 
                  className="w-full h-12 pl-10 pr-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-50 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                  placeholder={t.login.emailPlaceholder}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center ml-1">
                <label className="text-sm font-medium text-slate-300">{t.login.passwordLabel}</label>
                <a href="#" className="text-xs text-emerald-400 hover:text-emerald-300">{t.login.forgotPass}</a>
              </div>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
                <input 
                  type="password" 
                  defaultValue="password" 
                  className="w-full h-12 pl-10 pr-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-50 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <Button 
              type="submit" 
              size="lg"
              disabled={isLoading}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl h-12 shadow-lg shadow-emerald-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                  <>
                    <span className="mr-2">{t.login.signInBtn}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
              )}
            </Button>
          </form>

          <div className="mt-8 flex items-center justify-between gap-4">
             <div className="h-[1px] bg-slate-800 flex-1"></div>
             <span className="text-xs uppercase text-slate-600 font-medium tracking-wider">{t.login.orContinue}</span>
             <div className="h-[1px] bg-slate-800 flex-1"></div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <button type="button" className="flex items-center justify-center h-11 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 transition-colors">
               <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
               {t.login.google}
            </button>
            <button type="button" className="flex items-center justify-center h-11 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 transition-colors">
               <svg className="w-5 h-5 mr-2 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M16.365 1.43c0 1.14-.493 2.27-1.177 3.08-.684.816-1.813 1.37-2.932 1.37-.11 0-.17 0-.258-.01.01-1.07.493-2.237 1.147-3.043.684-.816 1.843-1.43 2.963-1.43.056 0 .157.01.257.033zm3.743 12.98c-.167.275-.367.575-.58.85 0 0-1.045 1.252-2.698 3.003-.76.81-1.614 1.76-2.924 1.76-1.156 0-1.618-.722-3.033-.722-1.47 0-1.897.712-3.055.712-1.182 0-2.316-1.12-3.52-2.872-1.95-2.83-1.745-6.8 1.135-8.083.837-.36 2.07-.63 2.92-.63 1.05 0 2.036.726 2.662.726.608 0 1.62-.726 2.864-.726.96 0 2.395.347 3.3.93-2.843 1.74-2.345 6.06.928 7.05z"/></svg>
               {t.login.apple}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};