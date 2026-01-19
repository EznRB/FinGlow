import React from 'react';
import { FinancialReportData, Transaction } from '../../types';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts';
import { AlertTriangle, TrendingUp, TrendingDown, Wallet, Activity, Zap, Target, ArrowUpRight, Check, Printer, Calendar, Utensils, ShoppingBag, Car, Home, Briefcase, Coffee, HeartPulse, Film } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../contexts/LanguageContext';

interface FinancialReportProps {
  data: FinancialReportData;
}

const COLORS = ['#10b981', '#8b5cf6', '#06b6d4', '#f59e0b', '#ef4444', '#ec4899'];

// Icon mapping helper
const getCategoryIcon = (category: string) => {
  const cat = category.toLowerCase();
  if (cat.includes('food') || cat.includes('dining') || cat.includes('alimentação') || cat.includes('restaurante')) return <Utensils className="w-4 h-4" />;
  if (cat.includes('shop') || cat.includes('compra')) return <ShoppingBag className="w-4 h-4" />;
  if (cat.includes('transport') || cat.includes('uber') || cat.includes('gas')) return <Car className="w-4 h-4" />;
  if (cat.includes('home') || cat.includes('housing') || cat.includes('casa') || cat.includes('habitação')) return <Home className="w-4 h-4" />;
  if (cat.includes('work') || cat.includes('salary') || cat.includes('trabalho')) return <Briefcase className="w-4 h-4" />;
  if (cat.includes('coffee') || cat.includes('cafe')) return <Coffee className="w-4 h-4" />;
  if (cat.includes('health') || cat.includes('saude') || cat.includes('drogasil')) return <HeartPulse className="w-4 h-4" />;
  if (cat.includes('entertainment') || cat.includes('netflix') || cat.includes('entretenimento')) return <Film className="w-4 h-4" />;
  return <Activity className="w-4 h-4" />;
};

const getCategoryColor = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('food') || cat.includes('alimentação')) return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
    if (cat.includes('transport') || cat.includes('transporte')) return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
    if (cat.includes('health') || cat.includes('saúde')) return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
    if (cat.includes('entertainment') || cat.includes('subscription') || cat.includes('entretenimento')) return 'text-violet-400 bg-violet-400/10 border-violet-400/20';
    return 'text-slate-400 bg-slate-800 border-slate-700';
};

// ... Gauge Component ...
const GaugeScore = ({ score, labels }: { score: number, labels: any }) => {
  let color = '#ef4444'; 
  let label = labels.needsWork;
  if (score > 75) { color = '#10b981'; label = labels.excellent; }
  else if (score > 50) { color = '#f59e0b'; label = labels.good; }
  
  return (
    <div className="flex flex-col items-center justify-center h-full relative">
       <div className="absolute inset-0 flex items-center justify-center opacity-10">
          <Activity className="w-32 h-32" style={{ color }} />
       </div>
       <span className="text-5xl font-bold text-white mb-2">{score}</span>
       <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-900 border border-slate-700" style={{ color }}>
         {label}
       </span>
    </div>
  );
};

export const FinancialReport: React.FC<FinancialReportProps> = ({ data }) => {
  const { t, language } = useLanguage();
  
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat(language === 'pt' ? 'pt-BR' : 'en-US', { 
        style: 'currency', 
        currency: language === 'pt' ? 'BRL' : 'USD' 
    }).format(val);
  };
  
  const totalSubscriptionsCost = data.subscriptions.reduce((acc, sub) => acc + sub.cost, 0);

  // Animation variants
  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  // Only use data from the analysis, no fallback to mockups
  const immediateActions = data.insights.immediate_actions || [];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-slate-800">
         <div>
            <div className="flex items-center text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
               <CheckCircle2 className="w-4 h-4 mr-2" /> {t.report.analysisComplete}
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-white">{t.report.titlePrefix}: {new Date().toLocaleDateString(language === 'pt' ? 'pt-BR' : 'en-US', { month: 'long', year: 'numeric' })}</h2>
            <div className="flex items-center text-slate-400 text-sm mt-1">
               <Calendar className="w-4 h-4 mr-2" /> {t.report.detectedPeriod}: {new Date().toLocaleDateString()}
            </div>
         </div>
         <button className="flex items-center px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 text-sm font-medium transition-colors w-full md:w-auto justify-center">
            <Printer className="w-4 h-4 mr-2" /> {t.report.printBtn}
         </button>
      </div>

      {/* --- SECTION 1: AI INSIGHTS & ACTIONS --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Left: AI Text Analysis */}
         <motion.div variants={item} className="lg:col-span-2">
            <Card className="h-full bg-slate-900/50 border-slate-800">
               <CardHeader>
                  <CardTitle className="flex items-center text-emerald-400">
                     <Zap className="w-5 h-5 mr-2" /> {t.report.aiAnalysisTitle}
                  </CardTitle>
               </CardHeader>
               <CardContent>
                  <div className="prose prose-invert prose-sm max-w-none text-slate-300">
                     <p className="leading-relaxed text-base">{data.insights.advice_text}</p>
                     
                     {data.insights.anomaly_detected && (
                        <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start">
                           <AlertTriangle className="w-5 h-5 text-amber-400 mr-3 flex-shrink-0 mt-0.5" />
                           <div>
                              <h4 className="text-amber-400 font-bold text-sm mb-1">{t.report.anomalyTitle}</h4>
                              <p className="text-amber-200/80 text-sm">{data.insights.anomaly_detected}</p>
                           </div>
                        </div>
                     )}
                  </div>
               </CardContent>
            </Card>
         </motion.div>

         {/* Right: Immediate Actions */}
         <motion.div variants={item} className="lg:col-span-1 space-y-3">
             <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{t.report.actionsTitle}</h3>
             {immediateActions.length > 0 ? (
                immediateActions.map((action, idx) => (
                    // Safety check if action is undefined
                    action ? (
                       <div key={idx} className={`p-4 rounded-xl border flex items-start transition-transform hover:scale-[1.02] cursor-pointer ${
                          action.type === 'danger' ? 'bg-red-500/5 border-red-500/20' :
                          action.type === 'warning' ? 'bg-amber-500/5 border-amber-500/20' :
                          'bg-emerald-500/5 border-emerald-500/20'
                       }`}>
                          <div className={`mt-0.5 mr-3 p-1.5 rounded-full ${
                             action.type === 'danger' ? 'bg-red-500/20 text-red-400' :
                             action.type === 'warning' ? 'bg-amber-500/20 text-amber-400' :
                             'bg-emerald-500/20 text-emerald-400'
                          }`}>
                             {action.type === 'danger' ? <XCircleIcon /> : action.type === 'warning' ? <AlertTriangle className="w-3 h-3" /> : <Check className="w-3 h-3" />}
                          </div>
                          <div>
                             <h4 className={`text-sm font-bold ${
                                action.type === 'danger' ? 'text-red-400' :
                                action.type === 'warning' ? 'text-amber-400' :
                                'text-emerald-400'
                             }`}>{action.title}</h4>
                             <p className="text-xs text-slate-400 mt-1">{action.description}</p>
                          </div>
                       </div>
                    ) : null
                 ))
             ) : (
                <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/50 text-center text-slate-500 text-sm">
                   No specific immediate actions detected.
                </div>
             )}
         </motion.div>
      </div>

      {/* --- SECTION 2: SUBSCRIPTION HUNTER BANNER --- */}
      <motion.div variants={item}>
         <div className="relative overflow-hidden rounded-2xl border border-blue-500/30 bg-gradient-to-r from-blue-900/40 to-slate-900">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            
            <div className="relative z-10 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
               <div className="flex items-start gap-4">
                  <div className="p-4 bg-blue-500/20 rounded-2xl border border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.15)]">
                     <Target className="w-8 h-8 text-blue-400" />
                  </div>
                  <div>
                     <h3 className="text-2xl font-bold text-white mb-2">{t.report.subscriptionTitle}</h3>
                     <p className="text-blue-200/70 max-w-md">
                        {t.report.subscriptionDesc.replace('{count}', data.subscriptions.length.toString())}
                     </p>
                  </div>
               </div>

               <div className="text-right bg-slate-950/30 p-4 rounded-xl border border-blue-500/20 backdrop-blur-md min-w-[200px] w-full md:w-auto flex flex-row md:flex-col justify-between md:justify-center items-center md:items-end">
                  <p className="text-xs text-blue-300 font-bold uppercase tracking-wider mb-0 md:mb-1">{t.report.annualCost}</p>
                  <div>
                    <div className="text-3xl font-bold text-white text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                       {formatCurrency(totalSubscriptionsCost * 12)}
                    </div>
                    <p className="text-xs text-slate-500 mt-1 text-right">{t.report.perYear}</p>
                  </div>
               </div>
            </div>
         </div>
      </motion.div>

      {/* --- SECTION 3: BENTO GRID SUMMARY (Compact) --- */}
      <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-4 gap-4">
         <Card className="md:col-span-1 bg-slate-900/40">
            <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-400">{t.report.healthScore}</CardTitle></CardHeader>
            <CardContent><GaugeScore score={data.financial_health_score} labels={t.report.scores} /></CardContent>
         </Card>
         <Card className="md:col-span-2 bg-slate-900/40">
            <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-400">{t.report.burnRate}</CardTitle></CardHeader>
            <CardContent className="h-[180px]">
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.daily_burn_rate}>
                     <defs><linearGradient id="colorC" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient></defs>
                     <Area type="monotone" dataKey="amount" stroke="#10b981" fillOpacity={1} fill="url(#colorC)" strokeWidth={2} />
                     <XAxis dataKey="date" hide />
                  </AreaChart>
               </ResponsiveContainer>
            </CardContent>
         </Card>
         <Card className="md:col-span-1 bg-slate-900/40">
            <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-400">{t.report.spendingMix}</CardTitle></CardHeader>
            <CardContent className="h-[180px]">
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                     <Pie data={data.categories} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value">
                        {data.categories.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                     </Pie>
                  </PieChart>
               </ResponsiveContainer>
            </CardContent>
         </Card>
      </motion.div>

      {/* --- SECTION 4: CATEGORIZED TRANSACTIONS TABLE --- */}
      <motion.div variants={item}>
         <div className="flex items-center justify-between mb-4 mt-4">
            <h3 className="text-lg font-bold text-white">{t.report.transactionsTitle}</h3>
            <button className="text-emerald-400 text-sm hover:underline flex items-center">
               {t.report.viewAll} <ArrowUpRight className="w-4 h-4 ml-1" />
            </button>
         </div>
         
         {/* Desktop Table */}
         <div className="hidden md:block bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="bg-slate-950/50 border-b border-slate-800 text-xs text-slate-400 uppercase tracking-wider">
                     <th className="p-4 font-medium">{t.report.table.transaction}</th>
                     <th className="p-4 font-medium">{t.report.table.category}</th>
                     <th className="p-4 font-medium">{t.report.table.date}</th>
                     <th className="p-4 font-medium text-right">{t.report.table.value}</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-800">
                  {data.transactions && data.transactions.length > 0 ? (
                     data.transactions.map((tx, i) => (
                     <tr key={i} className="hover:bg-slate-800/50 transition-colors group">
                        <td className="p-4">
                           <div className="flex items-center">
                              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 mr-3 group-hover:bg-slate-700 transition-colors">
                                 {getCategoryIcon(tx.category)}
                              </div>
                              <span className="font-medium text-slate-200">{tx.description}</span>
                           </div>
                        </td>
                        <td className="p-4">
                           <span className={`px-2.5 py-1 rounded text-xs font-bold border ${getCategoryColor(tx.category)}`}>
                              {tx.category}
                           </span>
                        </td>
                        <td className="p-4 text-slate-400 text-sm">
                           {tx.date}
                        </td>
                        <td className="p-4 text-right font-bold text-slate-200">
                           {formatCurrency(tx.amount)}
                        </td>
                     </tr>
                  ))
                  ) : (
                     <tr>
                        <td colSpan={4} className="p-8 text-center text-slate-500">
                           No transactions found in this analysis.
                        </td>
                     </tr>
                  )}
               </tbody>
            </table>
         </div>

         {/* Mobile Cards (Transactions) */}
         <div className="md:hidden space-y-3">
             {data.transactions && data.transactions.length > 0 ? (
                 data.transactions.map((tx, i) => (
                    <div key={i} className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                             {getCategoryIcon(tx.category)}
                          </div>
                          <div>
                             <p className="text-slate-200 font-medium text-sm truncate max-w-[150px]">{tx.description}</p>
                             <div className="flex items-center gap-2 mt-0.5">
                                <span className={`text-[10px] px-1.5 py-0.5 rounded border ${getCategoryColor(tx.category)}`}>{tx.category}</span>
                                <span className="text-[10px] text-slate-500">{tx.date}</span>
                             </div>
                          </div>
                       </div>
                       <div className="font-bold text-slate-200 text-sm">
                          {formatCurrency(tx.amount)}
                       </div>
                    </div>
                 ))
             ) : (
                 <div className="p-6 text-center text-slate-500 text-sm bg-slate-900 border border-slate-800 rounded-xl">
                    No transactions found.
                 </div>
             )}
         </div>
      </motion.div>
    </motion.div>
  );
};

// Simple Fallback icon
const XCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
);

function CheckCircle2(props: any) {
    return <Check {...props} />;
}