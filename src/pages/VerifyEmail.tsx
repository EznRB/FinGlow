import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { LayoutDashboard, CheckCircle2, Zap } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { motion } from 'framer-motion';

export const VerifyEmail: React.FC = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans text-slate-50">

            {/* Background Glow */}
            <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-violet-600/5 rounded-full blur-[100px] pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="max-w-md w-full bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl shadow-2xl relative z-10 text-center"
            >
                <div className="inline-flex items-center px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-widest mb-6">
                    <Zap className="w-3 h-3 mr-2 fill-emerald-400" />
                    {t.verifyEmail.tagline}
                </div>

                <div className="w-20 h-20 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/20">
                    <CheckCircle2 className="w-12 h-12 text-emerald-400" />
                </div>

                <h1 className="text-3xl font-bold text-white mb-4">
                    {t.verifyEmail.title}
                </h1>

                <p className="text-slate-400 mb-8 leading-relaxed">
                    {t.verifyEmail.message}
                </p>

                <Button
                    onClick={() => navigate('/dashboard')}
                    size="lg"
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl h-14 shadow-lg shadow-emerald-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                    <LayoutDashboard className="w-5 h-5 mr-3" />
                    {t.verifyEmail.backToDashboard}
                </Button>
            </motion.div>

            {/* Decorative background grid */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
        </div>
    );
};
