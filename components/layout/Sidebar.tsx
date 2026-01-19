import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  UploadCloud, 
  Settings, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  Zap,
  PieChart,
  History as HistoryIcon,
  Plus,
  Globe
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';

interface SidebarProps {
  credits: number;
  onLogout: () => void;
  onAddCredits?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ credits, onLogout, onAddCredits }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const { t, language, toggleLanguage } = useLanguage();
  
  // Avatar state for sidebar
  const [avatar, setAvatar] = useState<string | null>(null);

  useEffect(() => {
    // Initial Load
    const saved = localStorage.getItem('finglow_avatar');
    if(saved) setAvatar(saved);

    // Listen for updates from Settings
    const handleAvatarUpdate = () => {
        setAvatar(localStorage.getItem('finglow_avatar'));
    }

    window.addEventListener('avatar-update', handleAvatarUpdate);
    return () => window.removeEventListener('avatar-update', handleAvatarUpdate);
  }, []);

  const menuItems = [
    { icon: LayoutDashboard, label: t.sidebar.dashboard, path: '/dashboard' },
    { icon: UploadCloud, label: t.sidebar.upload, path: '/upload' },
    { icon: HistoryIcon, label: t.sidebar.audits, path: '/history' },
    { icon: PieChart, label: t.sidebar.reports, path: '/reports' },
    { icon: Settings, label: t.sidebar.settings, path: '/settings' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <motion.div 
      animate={{ width: isCollapsed ? 80 : 280 }}
      className="hidden md:flex h-screen bg-slate-950 border-r border-slate-800 flex-col sticky top-0 z-50 transition-all duration-300 shadow-2xl shadow-black/50"
    >
      {/* Logo Area */}
      <div className="h-20 flex items-center px-6 border-b border-slate-800/50 justify-between">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="min-w-[32px] h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Zap className="w-5 h-5 text-white" fill="currentColor" />
          </div>
          {!isCollapsed && (
            <motion.span 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 whitespace-nowrap"
            >
              FinGlow
            </motion.span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 py-8 px-4 space-y-2">
        {menuItems.map((item, index) => (
          <Link
            key={index}
            to={item.path}
            className={`w-full flex items-center p-3 rounded-xl transition-all duration-200 group relative
              ${isActive(item.path) 
                ? 'bg-emerald-500/10 text-emerald-400' 
                : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100'
              }
            `}
          >
            <item.icon className={`w-5 h-5 ${isCollapsed ? 'mx-auto' : 'mr-3'}`} />
            {!isCollapsed && (
              <span className="font-medium text-sm">{item.label}</span>
            )}
            {isActive(item.path) && !isCollapsed && (
              <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            )}
          </Link>
        ))}
      </div>

      {/* Language Toggle */}
      <div className="px-6 mb-4">
        <button 
          onClick={toggleLanguage}
          className={`flex items-center justify-center w-full py-2 rounded-lg border transition-all ${isCollapsed ? 'px-0' : 'px-4'} 
            border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white`}
        >
          <Globe className="w-4 h-4" />
          {!isCollapsed && <span className="ml-2 text-xs font-bold uppercase tracking-widest">{language === 'en' ? 'English' : 'Português'}</span>}
        </button>
      </div>

      {/* Credits Card */}
      {!isCollapsed ? (
        <div className="p-6 pt-0">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-4 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
              <Zap className="w-12 h-12" />
            </div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">{t.sidebar.credits}</p>
            <div className="flex items-end gap-1 mb-3">
              <span className="text-2xl font-bold text-white">{credits}</span>
              <span className="text-sm text-slate-500 mb-1">/ 10</span>
            </div>
            <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden mb-3">
              <div 
                className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${(credits / 10) * 100}%` }}
              />
            </div>
            <button 
              onClick={onAddCredits}
              className="w-full py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center"
            >
              <Plus className="w-3 h-3 mr-1" /> {t.sidebar.topUp}
            </button>
          </div>
        </div>
      ) : (
        <div className="p-4 pt-0 flex flex-col items-center gap-2">
           <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-emerald-400 font-bold text-sm">
             {credits}
           </div>
           <button 
              onClick={onAddCredits}
              className="w-8 h-8 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center"
           >
              <Plus className="w-4 h-4" />
           </button>
        </div>
      )}

      {/* Footer / User / Logout */}
      <div className="p-4 border-t border-slate-800/50 bg-slate-900/50">
        {!isCollapsed && (
           <div className="flex items-center gap-3 mb-3 px-2">
               {avatar ? (
                   <img src={avatar} alt="User" className="w-8 h-8 rounded-full object-cover border border-emerald-500/30" />
               ) : (
                   <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-xs font-bold text-emerald-500 border border-emerald-500/30">
                     AS
                   </div>
               )}
               <div className="overflow-hidden">
                   <p className="text-sm font-medium text-white truncate">Ana Silva</p>
                   <p className="text-[10px] text-slate-500 truncate">ana@finglow.ai</p>
               </div>
           </div>
        )}

        <button 
          onClick={onLogout}
          className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-start'} p-2 rounded-lg text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-colors`}
        >
          <LogOut className="w-5 h-5" />
          {!isCollapsed && <span className="ml-3 text-sm font-medium">{t.sidebar.signOut}</span>}
        </button>
      </div>

      {/* Collapse Toggle */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-24 bg-slate-800 border border-slate-700 text-slate-400 hover:text-white rounded-full p-1 shadow-lg transform transition-transform hover:scale-110"
      >
        {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </motion.div>
  );
};