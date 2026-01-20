import React, { useState, useEffect } from 'react';
import { Layout } from '../components/layout/Layout';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Users, FileText, DollarSign, Activity, Search, ShieldAlert } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

export const Admin: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
    const { profile, isAdmin } = useAuth();
    const { t } = useLanguage();
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalReports: 0,
        totalRevenue: 0,
        activeToday: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            if (!isAdmin) return;

            try {
                // In a real app, these would be RPC calls or a specific admin API
                // For this MVP, we estimate/get count from profiles and reports
                const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
                const { count: reportCount } = await supabase.from('reports').select('*', { count: 'exact', head: true });

                // Sum revenue from completed transactions
                const { data: transactions } = await supabase
                    .from('transactions')
                    .select('amount')
                    .eq('status', 'completed');

                const revenue = transactions?.reduce((sum, tx) => sum + Number(tx.amount), 0) || 0;

                setStats({
                    totalUsers: userCount || 0,
                    totalReports: reportCount || 0,
                    totalRevenue: revenue,
                    activeToday: Math.floor((userCount || 0) * 0.4) // Simulated active users
                });
            } catch (error) {
                console.error('Error fetching admin stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [isAdmin]);

    if (!isAdmin) {
        return (
            <Layout credits={profile?.credits || 0} onLogout={onLogout}>
                <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                    <ShieldAlert className="w-16 h-16 text-rose-500 mb-4" />
                    <h1 className="text-2xl font-bold text-white mb-2">Acesso Negado</h1>
                    <p className="text-slate-400">Você não tem permissão para acessar esta área.</p>
                </div>
            </Layout>
        );
    }

    return (
        <Layout credits={profile?.credits || 0} onLogout={onLogout}>
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Painel Administrativo</h1>
                    <p className="text-slate-400 mt-1">Visão geral do sistema e métricas de uso.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        title="Total de Usuários"
                        value={stats.totalUsers}
                        icon={Users}
                        color="text-blue-400"
                        loading={loading}
                    />
                    <StatCard
                        title="Relatórios Gerados"
                        value={stats.totalReports}
                        icon={FileText}
                        color="text-emerald-400"
                        loading={loading}
                    />
                    <StatCard
                        title="Receita Total"
                        value={`R$ ${stats.totalRevenue.toFixed(2)}`}
                        icon={DollarSign}
                        color="text-amber-400"
                        loading={loading}
                    />
                    <StatCard
                        title="Usuários Ativos"
                        value={stats.activeToday}
                        icon={Activity}
                        color="text-rose-400"
                        loading={loading}
                    />
                </div>

                <Card className="bg-slate-900 border-slate-800">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Search className="w-4 h-4 text-slate-400" />
                            Logs de Atividade Recente
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center py-12 text-slate-500 italic">
                            A funcionalidade de monitoramento em tempo real será implementada na próxima fase.
                        </div>
                    </CardContent>
                </Card>
            </div>
        </Layout>
    );
};

interface StatCardProps {
    title: string;
    value: string | number;
    icon: any;
    color: string;
    loading: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color, loading }) => (
    <Card className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-all group">
        <CardContent className="p-6">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{title}</p>
                    {loading ? (
                        <div className="h-8 w-16 bg-slate-800 rounded animate-pulse" />
                    ) : (
                        <h3 className="text-2xl font-bold text-white group-hover:text-emerald-400 transition-colors">{value}</h3>
                    )}
                </div>
                <div className={`p-2 rounded-lg bg-slate-800 group-hover:bg-slate-700 transition-colors`}>
                    <Icon className={`w-5 h-5 ${color}`} />
                </div>
            </div>
        </CardContent>
    </Card>
);
