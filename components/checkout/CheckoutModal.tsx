import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Zap, Trophy, ArrowRight, ShieldCheck, HeartPulse } from 'lucide-react';
import { Button } from '../ui/Button';
import { useLanguage } from '../../contexts/LanguageContext';
import { redirectToCheckout, PACKAGES, PackageType } from '../../services/apiService';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (credits: number) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { t, language } = useLanguage();
  const [selectedPackage, setSelectedPackage] = useState<PackageType>('pack5');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePayment = async () => {
    setIsProcessing(true);
    setError(null);
    try {
      await redirectToCheckout(selectedPackage);
      // The browser will redirect, so we don't need to do anything else here
    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.message || 'Erro ao processar pagamento. Tente novamente.');
      setIsProcessing(false);
    }
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat(language === 'pt' ? 'pt-BR' : 'en-US', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/90 backdrop-blur-md"
        />

        {/* Modal/Drawer */}
        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className="relative w-full sm:max-w-2xl bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[95vh] flex flex-col"
        >
          {/* Decorative glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-50" />

          {/* Header */}
          <div className="flex items-center justify-between p-6 sm:p-8 border-b border-slate-800 bg-slate-900/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <Zap className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">{t.checkout.title}</h2>
                <p className="text-slate-400 text-sm mt-0.5">Escolha o melhor plano para sua auditoria</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6 sm:p-8 space-y-8 overflow-y-auto custom-scrollbar">
            {/* Package Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Single */}
              <button
                onClick={() => setSelectedPackage('single')}
                className={`group relative p-6 rounded-2xl border text-left transition-all duration-300 ${selectedPackage === 'single'
                    ? 'border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500/50'
                    : 'border-slate-800 bg-slate-800/20 hover:border-slate-700'
                  }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-2 rounded-lg ${selectedPackage === 'single' ? 'bg-emerald-500/20' : 'bg-slate-800'}`}>
                    <Zap className={`w-5 h-5 ${selectedPackage === 'single' ? 'text-emerald-500' : 'text-slate-400'}`} />
                  </div>
                </div>
                <div className="text-slate-200 font-bold text-lg mb-1">{t.checkout.oneCredit}</div>
                <div className="text-3xl font-black text-white mb-2">{formatPrice(PACKAGES.single.amount)}</div>
                <div className="text-xs text-slate-500">{t.checkout.oneTime}</div>
              </button>

              {/* Pack 5 - Popular */}
              <button
                onClick={() => setSelectedPackage('pack5')}
                className={`group relative p-6 rounded-2xl border text-left transition-all duration-300 ${selectedPackage === 'pack5'
                    ? 'border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500/50'
                    : 'border-slate-800 bg-slate-800/20 hover:border-slate-700'
                  }`}
              >
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg shadow-emerald-500/20">
                  {t.checkout.popular}
                </div>
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-2 rounded-lg ${selectedPackage === 'pack5' ? 'bg-emerald-500/20' : 'bg-slate-800'}`}>
                    <Sparkles className={`w-5 h-5 ${selectedPackage === 'pack5' ? 'text-emerald-500' : 'text-slate-400'}`} />
                  </div>
                </div>
                <div className="text-slate-200 font-bold text-lg mb-1">{t.checkout.fiveCredits}</div>
                <div className="text-3xl font-black text-white mb-2">{formatPrice(PACKAGES.pack5.amount)}</div>
                <div className="text-xs text-emerald-400 font-bold">{t.checkout.save}</div>
              </button>

              {/* Pack 10 - Best Value */}
              <button
                onClick={() => setSelectedPackage('pack10')}
                className={`group relative p-6 rounded-2xl border text-left transition-all duration-300 ${selectedPackage === 'pack10'
                    ? 'border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500/50'
                    : 'border-slate-800 bg-slate-800/20 hover:border-slate-700'
                  }`}
              >
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-violet-500 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg shadow-violet-500/20">
                  {t.checkout.bestValue}
                </div>
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-2 rounded-lg ${selectedPackage === 'pack10' ? 'bg-emerald-500/20' : 'bg-slate-800'}`}>
                    <Trophy className={`w-5 h-5 ${selectedPackage === 'pack10' ? 'text-emerald-500' : 'text-slate-400'}`} />
                  </div>
                </div>
                <div className="text-slate-200 font-bold text-lg mb-1">{t.checkout.tenCredits}</div>
                <div className="text-3xl font-black text-white mb-2">{formatPrice(PACKAGES.pack10.amount)}</div>
                <div className="text-xs text-violet-400 font-bold">Mais Econômico</div>
              </button>
            </div>

            {/* Features List */}
            <div className="bg-slate-800/30 rounded-2xl p-6 border border-slate-800/50 space-y-4">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" /> Benefícios do Plano
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <p className="text-sm text-slate-300">Análises detalhadas com IA Gemini 2.5 Flash</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <p className="text-sm text-slate-300">Detecção automática de assinaturas e vazamentos</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <p className="text-sm text-slate-300">Relatórios em PDF e histórico vitalício</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <p className="text-sm text-slate-300">Suporte prioritário e auditoria estratégica</p>
                </div>
              </div>
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm flex items-center gap-3">
                <HeartPulse className="w-5 h-5" />
                {error}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 sm:p-8 bg-slate-900/80 backdrop-blur-sm border-t border-slate-800 mt-auto flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="text-center sm:text-left">
              <div className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">{t.checkout.total}</div>
              <div className="text-3xl font-black text-white">
                {formatPrice(PACKAGES[selectedPackage].amount)}
              </div>
            </div>

            <Button
              onClick={handlePayment}
              disabled={isProcessing}
              className="w-full sm:w-64 h-16 bg-emerald-500 hover:bg-emerald-600 text-white text-lg font-bold rounded-2xl shadow-xl shadow-emerald-500/20 active:scale-95 transition-all group"
            >
              {isProcessing ? (
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Processando...</span>
                </div>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <span>{t.checkout.confirm}</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              )}
            </Button>
          </div>

          <div className="px-8 pb-4 text-center">
            <p className="text-[10px] text-slate-600 font-medium">Pagamento processado com segurança via AbacatePay. PIX e Cartão suportados.</p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
