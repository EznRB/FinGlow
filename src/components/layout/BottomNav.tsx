import React from 'react';
import { LayoutDashboard, History, PieChart, Settings, PlusCircle, UploadCloud } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export const BottomNav: React.FC = () => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-slate-950/90 backdrop-blur-md border-t border-slate-800 flex md:hidden justify-around items-center h-16 px-4 safe-area-bottom">
      <Link 
        to="/dashboard" 
        className={`flex flex-col items-center justify-center w-12 h-full space-y-1 ${isActive('/dashboard') ? 'text-emerald-400' : 'text-slate-500'}`}
      >
        <LayoutDashboard className="w-5 h-5" />
        <span className="text-[10px] font-medium">Home</span>
      </Link>

      <Link 
        to="/reports" 
        className={`flex flex-col items-center justify-center w-12 h-full space-y-1 ${isActive('/reports') ? 'text-emerald-400' : 'text-slate-500'}`}
      >
        <PieChart className="w-5 h-5" />
        <span className="text-[10px] font-medium">Insights</span>
      </Link>

      {/* Central Highlighted Action (Goes to Upload) */}
      <Link 
        to="/upload"
        className="flex flex-col items-center justify-center -mt-6"
      >
        <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg border-4 border-slate-950 transition-colors ${isActive('/upload') ? 'bg-emerald-500 shadow-emerald-500/30' : 'bg-slate-800 shadow-slate-900/50'}`}>
           <UploadCloud className={`w-6 h-6 ${isActive('/upload') ? 'text-white' : 'text-slate-300'}`} />
        </div>
      </Link>

      <Link 
        to="/history" 
        className={`flex flex-col items-center justify-center w-12 h-full space-y-1 ${isActive('/history') ? 'text-emerald-400' : 'text-slate-500'}`}
      >
        <History className="w-5 h-5" />
        <span className="text-[10px] font-medium">History</span>
      </Link>

      <Link 
        to="/settings" 
        className={`flex flex-col items-center justify-center w-12 h-full space-y-1 ${isActive('/settings') ? 'text-emerald-400' : 'text-slate-500'}`}
      >
        <Settings className="w-5 h-5" />
        <span className="text-[10px] font-medium">Config</span>
      </Link>
    </div>
  );
};