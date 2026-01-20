import React, { useEffect, useState } from 'react';
import { Layout } from '../components/layout/Layout';
import { Search, Filter, FileText, Download, Eye, UploadCloud, Trash2, Calendar, DollarSign } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';

interface HistoryProps {
  onLogout: () => void;
}

interface HistoryItem {
  id: string;
  date: string;
  name: string;
  score: number;
  value: number;
}

export const History: React.FC<HistoryProps> = ({ onLogout }) => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [credits] = useState(3);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);

  useEffect(() => {
    const storedHistory = localStorage.getItem('finglow_history');
    if (storedHistory) {
      try {
        setHistoryItems(JSON.parse(storedHistory));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  const clearHistory = () => {
    if(window.confirm("Are you sure you want to clear your history? This will delete all saved reports.")) {
        localStorage.removeItem('finglow_history');
        // Also cleanup individual reports to free space
        historyItems.forEach(item => {
            localStorage.removeItem(`finglow_report_${item.id}`);
        });
        setHistoryItems([]);
    }
  };

  const handleViewReport = (id: string) => {
    const reportKey = `finglow_report_${id}`;
    const reportData = localStorage.getItem(reportKey);
    
    if (reportData) {
        // Set this as the "latest" report so Dashboard/Reports pages render it
        localStorage.setItem('finglow_latest_report', reportData);
        navigate('/dashboard');
    } else {
        alert(language === 'pt' 
            ? "Os detalhes deste relatório antigo não estão disponíveis no navegador." 
            : "Details for this older report are not available locally.");
    }
  };

  const handleDownloadReport = (item: HistoryItem) => {
    const reportKey = `finglow_report_${item.id}`;
    const reportData = localStorage.getItem(reportKey);

    if (reportData) {
        const blob = new Blob([reportData], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `Finglow_Report_${item.name}_${item.date}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } else {
        alert(language === 'pt' 
            ? "Não foi possível gerar o download. Dados detalhados ausentes." 
            : "Could not generate download. Detailed data missing.");
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat(language === 'pt' ? 'pt-BR' : 'en-US', { 
        style: 'currency', 
        currency: language === 'pt' ? 'BRL' : 'USD' 
    }).format(val);
  };

  const getBadgeColor = (score: number) => {
    if (score >= 90) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    if (score >= 70) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    if (score >= 50) return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    return 'bg-red-500/10 text-red-400 border-red-500/20';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return t.report.scores.excellent;
    if (score >= 70) return t.report.scores.good;
    if (score >= 50) return t.report.scores.good;
    return t.report.scores.needsWork;
  }

  return (
    <Layout credits={credits} onLogout={onLogout}>
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">{t.history.title}</h1>
              <p className="text-slate-400 mt-1 text-sm md:text-base">{t.history.subtitle}</p>
            </div>
            {historyItems.length > 0 && (
                <button onClick={clearHistory} className="text-slate-500 hover:text-rose-400 transition-colors p-2">
                    <Trash2 className="w-5 h-5" />
                </button>
            )}
        </div>

        {historyItems.length > 0 ? (
          <>
            {/* Toolbar */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row gap-4 justify-between items-center">
               <div className="relative w-full md:w-96">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input 
                    type="text" 
                    placeholder={t.history.search}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
               </div>
               <div className="flex gap-2 w-full md:w-auto">
                  <button className="flex-1 md:flex-none flex items-center justify-center px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 text-sm hover:bg-slate-800 transition-colors">
                     <span className="mr-2">{t.history.filterAll}</span>
                     <Filter className="w-3 h-3" />
                  </button>
               </div>
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-950/50 border-b border-slate-800 text-xs text-slate-500 uppercase tracking-wider">
                    <th className="p-4 font-medium">{t.history.table.date}</th>
                    <th className="p-4 font-medium">{t.history.table.file}</th>
                    <th className="p-4 font-medium">{t.history.table.score}</th>
                    <th className="p-4 font-medium">{t.history.table.value}</th>
                    <th className="p-4 font-medium text-right">{t.history.table.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {historyItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/50 transition-colors group">
                      <td className="p-4 text-slate-400 text-sm">{item.date}</td>
                      <td className="p-4">
                         <div className="flex items-center text-slate-200">
                            <FileText className="w-4 h-4 mr-2 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                            {item.name}
                         </div>
                      </td>
                      <td className="p-4">
                         <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getBadgeColor(item.score)}`}>
                            <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${item.score < 50 ? 'bg-red-400' : item.score < 75 ? 'bg-amber-400' : 'bg-emerald-400'}`}></div>
                            {item.score} ({getScoreLabel(item.score)})
                         </span>
                      </td>
                      <td className="p-4 text-slate-300 font-mono text-sm">
                         {formatCurrency(item.value)}
                      </td>
                      <td className="p-4">
                         <div className="flex justify-end gap-2">
                            <button 
                                onClick={() => handleDownloadReport(item)}
                                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                                title="Download JSON"
                            >
                               <Download className="w-4 h-4" />
                            </button>
                            <button 
                                onClick={() => handleViewReport(item.id)}
                                className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                                title="View Dashboard"
                            >
                               <Eye className="w-4 h-4" />
                            </button>
                         </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="p-4 border-t border-slate-800 flex justify-between items-center text-xs text-slate-500">
                 <span>Showing {historyItems.length} result(s)</span>
              </div>
            </div>

            {/* Mobile Cards (Stack) */}
            <div className="md:hidden space-y-4">
               {historyItems.map((item) => (
                 <div key={item.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-slate-800/50 rounded-full -translate-y-1/2 translate-x-1/2" />
                    
                    <div className="flex justify-between items-start relative z-10">
                       <div className="flex items-center text-slate-200 font-medium">
                          <FileText className="w-4 h-4 mr-2 text-emerald-400" />
                          <span className="truncate max-w-[200px]">{item.name}</span>
                       </div>
                       <div className="flex gap-2">
                           <button onClick={() => handleDownloadReport(item)} className="text-slate-500 hover:text-white p-1">
                              <Download className="w-4 h-4" />
                           </button>
                           <button onClick={() => handleViewReport(item.id)} className="text-emerald-500 hover:text-emerald-400 p-1">
                              <Eye className="w-4 h-4" />
                           </button>
                       </div>
                    </div>

                    <div className="flex justify-between items-center relative z-10">
                       <div className="flex items-center text-xs text-slate-500">
                          <Calendar className="w-3 h-3 mr-1" />
                          {item.date}
                       </div>
                       <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border ${getBadgeColor(item.score)}`}>
                          {item.score}
                       </span>
                    </div>

                    <div className="pt-3 border-t border-slate-800 flex justify-between items-center relative z-10">
                       <span className="text-xs text-slate-500 uppercase tracking-wider">Total Value</span>
                       <span className="text-slate-200 font-mono font-medium">
                          {formatCurrency(item.value)}
                       </span>
                    </div>
                 </div>
               ))}
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-20 bg-slate-900/50 border border-slate-800 rounded-2xl border-dashed">
             <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6">
                <UploadCloud className="w-10 h-10 text-slate-500" />
             </div>
             <h3 className="text-xl font-bold text-white mb-2">{t.emptyState.title}</h3>
             <p className="text-slate-400 mb-6 text-center max-w-sm">{t.emptyState.desc}</p>
             <button 
                onClick={() => navigate('/dashboard')}
                className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl transition-all hover:scale-105 shadow-lg shadow-emerald-500/20"
             >
                {t.emptyState.action}
             </button>
          </div>
        )}
      </div>
    </Layout>
  );
};