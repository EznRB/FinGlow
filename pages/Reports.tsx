import React, { useState, useEffect } from 'react';
import { Layout } from '../components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Brain, Wallet, AlertOctagon, Sparkles, TrendingUp, PiggyBank, ShoppingBag, Home, Hourglass, Percent, AlertTriangle, Check, ArrowRight, BarChart3, CreditCard } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { FinancialReportData } from '../types';
import { useNavigate } from 'react-router-dom';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';

interface ReportsProps {
  onLogout: () => void;
}

export const Reports: React.FC<ReportsProps> = ({ onLogout }) => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [credits] = useState(3);
  const [data, setData] = useState<FinancialReportData | null>(null);

  useEffect(() => {
    // Load the latest report to show details
    const storedReport = localStorage.getItem('finglow_latest_report');
    if (storedReport) {
      try {
        setData(JSON.parse(storedReport));
      } catch (e) { console.error(e); }
    }
  }, []);

  if (!data) return (
     <Layout credits={credits} onLogout={onLogout}>
         <div className="flex flex-col items-center justify-center h-[60vh] text-center">
             <Brain className="w-16 h-16 text-slate-600 mb-4" />
             <h2 className="text-xl font-bold text-white mb-2">{t.reportsPage.noData}</h2>
             <button onClick={() => navigate('/upload')} className="text-emerald-400 hover:underline">
                 Go to Upload
             </button>
         </div>
     </Layout>
  );

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat(language === 'pt' ? 'pt-BR' : 'en-US', { 
        style: 'currency', 
        currency: language === 'pt' ? 'BRL' : 'USD' 
    }).format(val);
  };

  // Calculate Percentages for 50/30/20
  const total503020 = data.breakdown_50_30_20.needs + data.breakdown_50_30_20.wants + data.breakdown_50_30_20.savings;
  const pNeeds = Math.round((data.breakdown_50_30_20.needs / total503020) * 100) || 0;
  const pWants = Math.round((data.breakdown_50_30_20.wants / total503020) * 100) || 0;
  const pSavings = Math.round((data.breakdown_50_30_20.savings / total503020) * 100) || 0;

  return (
    <Layout credits={credits} onLogout={onLogout}>
      <div className="space-y-8 animate-in fade-in duration-500">
        
        {/* Header */}
        <div>
           <div className="flex items-center gap-2 mb-2 text-emerald-400">
              <Brain className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-widest">{t.sidebar.reports}</span>
           </div>
           <h1 className="text-3xl font-bold text-white tracking-tight">{t.reportsPage.title}</h1>
           <p className="text-slate-400 mt-1 max-w-2xl">{t.reportsPage.subtitle}</p>
        </div>

        {/* --- KPI CARDS --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <Card className="bg-slate-900 border-slate-800 hover:border-emerald-500/30 transition-colors">
              <CardContent className="p-6">
                 <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                       <Hourglass className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold bg-blue-500/10 text-blue-400 px-2 py-1 rounded">EST</span>
                 </div>
                 <h3 className="text-sm font-medium text-slate-400">{t.reportsPage.metrics.runway}</h3>
                 <div className="text-3xl font-bold text-white mt-1">{data.metrics.runway_days_estimate} Days</div>
                 <p className="text-xs text-slate-500 mt-2">{t.reportsPage.metrics.runwayDesc}</p>
              </CardContent>
           </Card>

           <Card className="bg-slate-900 border-slate-800 hover:border-emerald-500/30 transition-colors">
              <CardContent className="p-6">
                 <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                       <PiggyBank className="w-6 h-6" />
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded ${data.metrics.savings_rate_percentage >= 20 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                        {data.metrics.savings_rate_percentage}%
                    </span>
                 </div>
                 <h3 className="text-sm font-medium text-slate-400">{t.reportsPage.metrics.savingsRate}</h3>
                 <div className="text-3xl font-bold text-white mt-1">{data.metrics.savings_rate_percentage}%</div>
                 <p className="text-xs text-slate-500 mt-2">{t.reportsPage.metrics.savingsDesc}</p>
              </CardContent>
           </Card>

           <Card className="bg-slate-900 border-slate-800 hover:border-emerald-500/30 transition-colors">
              <CardContent className="p-6">
                 <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-violet-500/10 rounded-lg text-violet-400">
                       <Percent className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold bg-slate-800 text-slate-300 px-2 py-1 rounded">
                        Mix
                    </span>
                 </div>
                 <h3 className="text-sm font-medium text-slate-400">{t.reportsPage.metrics.discretionary}</h3>
                 <div className="text-3xl font-bold text-white mt-1">{data.metrics.discretionary_spending_percentage}%</div>
                 <p className="text-xs text-slate-500 mt-2">{t.reportsPage.metrics.discretionaryDesc}</p>
              </CardContent>
           </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column: Strategic Text & Anomalies */}
            <div className="lg:col-span-2 space-y-8">
                {/* Strategic Advice */}
                <Card className="bg-slate-900 border-emerald-500/20 overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-white">
                            <Sparkles className="w-5 h-5 text-emerald-400" />
                            {t.reportsPage.sections.strategy}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="relative z-10 space-y-6">
                        <div className="prose prose-invert max-w-none text-slate-300 leading-relaxed text-lg border-b border-slate-800 pb-6">
                            {data.insights.advice_text}
                        </div>
                        
                        {/* Action Items in Strategy */}
                        {data.insights.immediate_actions && data.insights.immediate_actions.length > 0 && (
                            <div>
                                <h4 className="text-sm font-bold text-white mb-3 uppercase tracking-wider">{t.reportsPage.sections.actions}</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {data.insights.immediate_actions.map((action, i) => (
                                        <div key={i} className="flex items-start p-3 rounded-lg bg-slate-950/50 border border-slate-800">
                                            <div className={`mt-0.5 p-1 rounded-full mr-3 shrink-0 ${
                                                action.type === 'danger' ? 'bg-red-500/20 text-red-400' :
                                                action.type === 'warning' ? 'bg-amber-500/20 text-amber-400' :
                                                'bg-emerald-500/20 text-emerald-400'
                                            }`}>
                                                <ArrowRight className="w-3 h-3" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-white">{action.title}</p>
                                                <p className="text-xs text-slate-400 mt-0.5">{action.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Category Analysis Chart */}
                <Card className="bg-slate-900 border-slate-800">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-white">
                            <BarChart3 className="w-5 h-5 text-indigo-400" />
                            {t.reportsPage.sections.categories}
                        </CardTitle>
                        <p className="text-xs text-slate-500">
                             {t.reportsPage.largestCat}: <span className="text-indigo-400 font-bold">{data.insights.largest_category}</span>
                        </p>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.categories} layout="vertical" margin={{ left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                                <XAxis type="number" hide />
                                <YAxis 
                                    dataKey="name" 
                                    type="category" 
                                    width={100} 
                                    tick={{ fill: '#94a3b8', fontSize: 12 }} 
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip 
                                    cursor={{fill: '#1e293b', opacity: 0.4}}
                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc', borderRadius: '8px' }}
                                    formatter={(value: number) => formatCurrency(value)}
                                />
                                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                                    {data.categories.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={['#10b981', '#8b5cf6', '#06b6d4', '#f59e0b', '#ef4444'][index % 5]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Subscription Table */}
                <Card className="bg-slate-900 border-slate-800">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-white">
                            <CreditCard className="w-5 h-5 text-blue-400" />
                            {t.reportsPage.sections.subscriptions}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-800 text-xs text-slate-500 uppercase">
                                        <th className="py-2 font-medium">Service Name</th>
                                        <th className="py-2 font-medium">Frequency</th>
                                        <th className="py-2 font-medium text-right">Cost</th>
                                        <th className="py-2 font-medium text-right">Yearly Proj.</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                    {data.subscriptions.length > 0 ? (
                                        data.subscriptions.map((sub, idx) => (
                                            <tr key={idx} className="group hover:bg-slate-800/50">
                                                <td className="py-3 text-sm font-medium text-white">{sub.name}</td>
                                                <td className="py-3 text-xs text-slate-400 capitalize">{sub.frequency}</td>
                                                <td className="py-3 text-sm text-slate-200 text-right">{formatCurrency(sub.cost)}</td>
                                                <td className="py-3 text-sm font-bold text-blue-400 text-right">{formatCurrency(sub.cost * 12)}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="py-4 text-center text-slate-500">No subscriptions detected.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Right Column: Flags & Waste */}
            <div className="lg:col-span-1 space-y-8">
                
                {/* 50/30/20 Breakdown */}
                <Card className="bg-slate-900 border-slate-800">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-white">
                            <Wallet className="w-5 h-5 text-violet-400" />
                            {t.reportsPage.sections.budget}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Needs */}
                        <div>
                            <div className="flex justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <Home className="w-4 h-4 text-slate-400" />
                                    <span className="text-sm font-medium text-slate-200">{t.reportsPage.budgetLabels.needs}</span>
                                </div>
                                <span className="text-sm font-bold text-white">{formatCurrency(data.breakdown_50_30_20.needs)} ({pNeeds}%)</span>
                            </div>
                            <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 rounded-full relative" style={{ width: `${pNeeds}%` }}>
                                    {pNeeds > 50 && <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/50 animate-pulse" />}
                                </div>
                                {/* Ideal Marker 50% */}
                                <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-slate-600 h-3" title="Ideal 50%" />
                            </div>
                            <p className="text-xs text-slate-500 mt-1">{pNeeds > 50 ? 'Over budget' : 'Within budget'}</p>
                        </div>

                        {/* Wants */}
                        <div>
                            <div className="flex justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <ShoppingBag className="w-4 h-4 text-slate-400" />
                                    <span className="text-sm font-medium text-slate-200">{t.reportsPage.budgetLabels.wants}</span>
                                </div>
                                <span className="text-sm font-bold text-white">{formatCurrency(data.breakdown_50_30_20.wants)} ({pWants}%)</span>
                            </div>
                            <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden relative">
                                <div className="h-full bg-rose-500 rounded-full" style={{ width: `${pWants}%` }}></div>
                                {/* Ideal Marker 30% approx position (30% of total width) */}
                                <div className="absolute top-0 bottom-0 left-[30%] w-0.5 bg-slate-600 h-3" />
                            </div>
                        </div>

                        {/* Savings */}
                        <div>
                            <div className="flex justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <PiggyBank className="w-4 h-4 text-slate-400" />
                                    <span className="text-sm font-medium text-slate-200">{t.reportsPage.budgetLabels.savings}</span>
                                </div>
                                <span className="text-sm font-bold text-white">{formatCurrency(data.breakdown_50_30_20.savings)} ({pSavings}%)</span>
                            </div>
                            <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden relative">
                                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pSavings}%` }}></div>
                                {/* Ideal Marker 20% */}
                                <div className="absolute top-0 bottom-0 left-[20%] w-0.5 bg-slate-600 h-3" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Wasteful Expenses */}
                <Card className="bg-slate-900 border-rose-500/20">
                     <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-white">
                            <TrendingUp className="w-5 h-5 text-rose-400" />
                            {t.reportsPage.sections.waste}
                        </CardTitle>
                        <p className="text-xs text-slate-500">{t.reportsPage.wasteDesc}</p>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {data.insights.wasteful_expenses && data.insights.wasteful_expenses.length > 0 ? (
                                data.insights.wasteful_expenses.map((expense, i) => (
                                    <div key={i} className="flex items-center p-3 bg-rose-500/5 border border-rose-500/10 rounded-lg">
                                        <div className="w-2 h-2 rounded-full bg-rose-500 mr-3" />
                                        <span className="text-slate-300 text-sm font-medium">{expense}</span>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center text-slate-500 py-4 italic">No wasteful expenses detected. Good job!</div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Anomalies */}
                <Card className="bg-slate-900 border-amber-500/20">
                     <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-white">
                            <AlertOctagon className="w-5 h-5 text-amber-400" />
                            {t.reportsPage.sections.anomalies}
                        </CardTitle>
                        <p className="text-xs text-slate-500">{t.reportsPage.anomalyDesc}</p>
                    </CardHeader>
                    <CardContent>
                        {data.insights.anomaly_detected ? (
                            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start">
                                <AlertTriangle className="w-5 h-5 text-amber-400 mr-3 shrink-0" />
                                <p className="text-amber-200 text-sm leading-relaxed font-medium">
                                    "{data.insights.anomaly_detected}"
                                </p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-6 text-slate-500">
                                <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-2">
                                    <Sparkles className="w-6 h-6 text-emerald-500" />
                                </div>
                                <span className="text-sm">No anomalies detected.</span>
                            </div>
                        )}
                    </CardContent>
                </Card>

            </div>
        </div>
      </div>
    </Layout>
  );
};