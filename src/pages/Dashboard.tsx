import React, { useState, useEffect, useMemo } from 'react';
import { Layout } from '../components/layout/Layout';
import { Card, CardContent } from '../components/ui/Card';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { FinancialReportData } from '../types';
import { Activity, TrendingUp, TrendingDown, MoreHorizontal, Sparkles, ArrowRight, UploadCloud } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';
import { CheckoutModal } from '../components/checkout/CheckoutModal';
import { useNavigate } from 'react-router-dom';

interface DashboardProps {
  onLogout: () => void;
}

const COLORS = ['#10b981', '#8b5cf6', '#06b6d4', '#f59e0b', '#ef4444', '#ec4899'];

export const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
  const { t, language } = useLanguage();
  const { profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<FinancialReportData | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [timeRange, setTimeRange] = useState<'30d' | '3m' | '1y'>('30d');

  useEffect(() => {
    // Check for payment success
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success') {
      refreshProfile();
      // Remove the param from URL without reloading
      window.history.replaceState({}, '', window.location.pathname);
    }

    // Load ONLY real report from local storage
    const storedReport = localStorage.getItem('finglow_latest_report');
    if (storedReport) {
      try {
        setData(JSON.parse(storedReport));
      } catch (e) { console.error(e); }
    }
  }, []);

  // Filter daily burn rate based on selected time range
  const filteredBurnRate = useMemo(() => {
    if (!data || !data.daily_burn_rate) return [];

    // Sort by date just in case
    const sorted = [...data.daily_burn_rate].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (timeRange === '30d') return sorted.slice(-30);
    if (timeRange === '3m') return sorted.slice(-90);
    return sorted; // 1y or All
  }, [data, timeRange]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat(language === 'pt' ? 'pt-BR' : 'en-US', {
      style: 'currency',
      currency: language === 'pt' ? 'BRL' : 'USD'
    }).format(val);
  };

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-20 bg-slate-900/50 border border-slate-800 rounded-2xl border-dashed">
      <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6">
        <UploadCloud className="w-10 h-10 text-slate-500" />
      </div>
      <h3 className="text-xl font-bold text-white mb-2">{t.emptyState.title}</h3>
      <p className="text-slate-400 mb-6 text-center max-w-sm">{t.emptyState.desc}</p>
      <button
        onClick={() => navigate('/upload')}
        className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl transition-all hover:scale-105 shadow-lg shadow-emerald-500/20"
      >
        {t.emptyState.action}
      </button>
    </div>
  );

  return (
    <Layout credits={profile?.credits || 0} onLogout={onLogout} onAddCredits={() => setIsCheckoutOpen(true)}>
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onSuccess={(amount) => refreshProfile()}
      />

      <div className="space-y-6 animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">{t.dashboard.title}</h1>
            <p className="text-slate-400 mt-1">{t.dashboard.subtitle}</p>
          </div>
          {data && (
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-1 flex">
              <button
                onClick={() => setTimeRange('30d')}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${timeRange === '30d' ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-400 hover:text-white'}`}
              >
                {t.dashboard.timeFilters.days30}
              </button>
              <button
                onClick={() => setTimeRange('3m')}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${timeRange === '3m' ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-400 hover:text-white'}`}
              >
                {t.dashboard.timeFilters.months3}
              </button>
              <button
                onClick={() => setTimeRange('1y')}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${timeRange === '1y' ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-400 hover:text-white'}`}
              >
                {t.dashboard.timeFilters.year}
              </button>
            </div>
          )}
        </div>

        {!data ? (
          <EmptyState />
        ) : (
          /* Bento Grid - Real Data */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Health Score - Fixed Alignment */}
            <Card className="bg-slate-900 border-slate-800 md:row-span-2 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-50">
                <Activity className="w-6 h-6 text-emerald-500" />
              </div>
              <CardContent className="h-full flex flex-col items-center justify-center p-6 z-10 text-center">
                <h3 className="text-slate-400 font-medium mb-6 w-full text-left">{t.dashboard.cards.health}</h3>

                <div className="relative w-48 h-48 mb-6 flex items-center justify-center">
                  {/* Circular Progress SVG - Fixed ViewBox and Rotation */}
                  <svg className="w-full h-full" viewBox="0 0 192 192">
                    {/* Background Circle */}
                    <circle
                      cx="96"
                      cy="96"
                      r="80"
                      stroke="#1e293b"
                      strokeWidth="12"
                      fill="none"
                    />
                    {/* Progress Circle - Rotated internally around center */}
                    <circle
                      cx="96"
                      cy="96"
                      r="80"
                      stroke="#10b981"
                      strokeWidth="12"
                      fill="none"
                      strokeDasharray="502"
                      strokeDashoffset={502 - (502 * data.financial_health_score) / 100}
                      strokeLinecap="round"
                      transform="rotate(-90 96 96)"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pt-1">
                    <span className="text-6xl font-bold text-white leading-none tracking-tighter">{data.financial_health_score}</span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">de 100</span>
                  </div>
                </div>

                <div className="text-center">
                  <h4 className="text-emerald-400 font-bold text-lg mb-1">
                    {data.financial_health_score >= 80 ? t.dashboard.healthStatus.excellent :
                      data.financial_health_score >= 60 ? t.dashboard.healthStatus.good :
                        t.dashboard.healthStatus.poor}
                  </h4>
                  <p className="text-slate-400 text-sm max-w-[200px] leading-relaxed mx-auto">
                    {t.dashboard.healthStatus.desc.replace('{percent}', Math.max(10, data.financial_health_score + 5).toString())}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Total Income */}
            <Card className="bg-slate-900 border-slate-800 relative overflow-hidden group hover:border-slate-700 transition-colors">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-emerald-500/10 transition-colors" />
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-emerald-500">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <span className="text-slate-400 text-sm font-medium">{t.dashboard.cards.income}</span>
                </div>
                <div className="text-3xl font-bold text-white mb-2">{formatCurrency(data.metrics.total_income)}</div>
                <div className="flex items-center text-xs">
                  {/* We don't have historical comparison data in standard CSV, using placeholders for UI consistency or calculating if data allows */}
                  <span className="text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded mr-2">--</span>
                  <span className="text-slate-500">{t.dashboard.lessThanLast}</span>
                </div>
              </CardContent>
            </Card>

            {/* Total Expense */}
            <Card className="bg-slate-900 border-slate-800 relative overflow-hidden group hover:border-slate-700 transition-colors">
              <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-rose-500/10 transition-colors" />
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-rose-500">
                    <TrendingDown className="w-4 h-4" />
                  </div>
                  <span className="text-slate-400 text-sm font-medium">{t.dashboard.cards.expenses}</span>
                </div>
                <div className="text-3xl font-bold text-white mb-2">{formatCurrency(data.metrics.total_expense)}</div>
                <div className="flex items-center text-xs">
                  <span className="text-slate-500">{t.dashboard.lessThanLast}</span>
                </div>
              </CardContent>
            </Card>

            {/* Cash Flow Chart - Spans 2 cols */}
            <Card className="bg-slate-900 border-slate-800 md:col-span-2 h-[320px]">
              <CardContent className="p-6 h-full flex flex-col">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-white font-bold mb-1">{t.dashboard.cards.cashflow}</h3>
                    <p className="text-xs text-slate-500">
                      {timeRange === '30d' ? t.dashboard.timeFilters.days30 : timeRange === '3m' ? t.dashboard.timeFilters.months3 : t.dashboard.timeFilters.year}
                    </p>
                  </div>
                  <button className="text-slate-500 hover:text-white"><MoreHorizontal className="w-5 h-5" /></button>
                </div>
                <div className="flex-1 w-full min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={filteredBurnRate}>
                      <defs>
                        <linearGradient id="colorFlow" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis
                        dataKey="date"
                        tick={{ fill: '#64748b', fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                        minTickGap={30}
                      />
                      <YAxis
                        tick={{ fill: '#64748b', fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc', borderRadius: '8px' }}
                        itemStyle={{ color: '#10b981' }}
                        formatter={(value: number) => [formatCurrency(value), t.report.burnRate]}
                      />
                      <Area
                        type="monotone"
                        dataKey="cumulative"
                        stroke="#10b981"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorFlow)"
                        activeDot={{ r: 6, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Subscriptions List */}
            <Card className="bg-slate-900 border-slate-800 h-[300px] overflow-hidden flex flex-col">
              <CardContent className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-white">{t.dashboard.cards.subscriptions}</h3>
                  <button
                    onClick={() => navigate('/reports')}
                    className="text-xs text-emerald-400 hover:underline"
                  >
                    {t.dashboard.viewAll}
                  </button>
                </div>
                <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-1">
                  {data.subscriptions.length > 0 ? (
                    data.subscriptions.map((sub, idx) => (
                      <div key={idx} className="flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-slate-300 text-xs shrink-0">
                            {sub.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm text-white font-medium truncate">{sub.name}</p>
                            <p className="text-[10px] text-slate-500 capitalize">{sub.frequency || 'Monthly'}</p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold text-white">{formatCurrency(sub.cost)}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-slate-500 text-xs py-10">No subscriptions detected.</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* AI Tip Card */}
            <Card className="bg-slate-900 border border-emerald-500/30 md:col-span-2 h-[300px] relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-emerald-950/20" />
              <div className="absolute bottom-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl translate-y-1/2 translate-x-1/2" />

              <CardContent className="p-8 relative z-10 flex flex-col justify-center h-full">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-bold text-white">{t.dashboard.cards.aiTip}</span>
                </div>

                <p className="text-slate-300 text-lg leading-relaxed max-w-2xl">
                  "{data.insights.advice_text.length > 200 ? data.insights.advice_text.substring(0, 200) + '...' : data.insights.advice_text}"
                </p>

                <div
                  onClick={() => navigate('/reports')}
                  className="mt-6 flex items-center gap-2 text-emerald-400 text-sm font-bold cursor-pointer hover:gap-3 transition-all"
                >
                  {t.dashboard.viewAll} <ArrowRight className="w-4 h-4" />
                </div>
              </CardContent>
            </Card>

          </div>
        )}
      </div>
    </Layout>
  );
};