import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, QrCode, CreditCard, CheckCircle2, Copy } from 'lucide-react';
import { Button } from '../ui/Button';
import { useLanguage } from '../../contexts/LanguageContext';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (credits: number) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { t } = useLanguage();
  const [selectedPlan, setSelectedPlan] = useState<'1' | '5'>('5');
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card'>('pix');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handlePayment = () => {
    setIsProcessing(true);
    // Simulate API call
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
      setTimeout(() => {
        onSuccess(selectedPlan === '1' ? 1 : 5);
        setIsSuccess(false);
        onClose();
      }, 2000);
    }, 2000);
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
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        />

        {/* Modal/Drawer */}
        <motion.div 
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full sm:max-w-md bg-slate-900 border-t sm:border border-slate-800 rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <span className="text-emerald-500 text-lg">⚡</span>
              </div>
              <h2 className="text-xl font-bold text-white">{t.checkout.title}</h2>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {!isSuccess ? (
              <>
                {/* Plan Selection */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t.checkout.planLabel}</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => setSelectedPlan('1')}
                      className={`relative p-4 rounded-xl border text-left transition-all ${
                        selectedPlan === '1' 
                          ? 'border-emerald-500 bg-emerald-500/10' 
                          : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-slate-200 font-medium">{t.checkout.oneCredit}</span>
                        {selectedPlan === '1' && <div className="w-4 h-4 rounded-full border-2 border-emerald-500 bg-emerald-500" />}
                        {selectedPlan !== '1' && <div className="w-4 h-4 rounded-full border-2 border-slate-600" />}
                      </div>
                      <div className="text-2xl font-bold text-white">$2.99</div>
                      <div className="text-xs text-slate-500 mt-1">{t.checkout.oneTime}</div>
                    </button>

                    <button 
                      onClick={() => setSelectedPlan('5')}
                      className={`relative p-4 rounded-xl border text-left transition-all ${
                        selectedPlan === '5' 
                          ? 'border-emerald-500 bg-emerald-500/10' 
                          : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
                      }`}
                    >
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {t.checkout.bestValue}
                      </div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-slate-200 font-medium">{t.checkout.fiveCredits}</span>
                        {selectedPlan === '5' && <div className="w-4 h-4 rounded-full border-2 border-emerald-500 bg-emerald-500" />}
                        {selectedPlan !== '5' && <div className="w-4 h-4 rounded-full border-2 border-slate-600" />}
                      </div>
                      <div className="text-2xl font-bold text-white">$9.99</div>
                      <div className="text-xs text-emerald-400 mt-1">{t.checkout.save}</div>
                    </button>
                  </div>
                </div>

                {/* Payment Method Tabs */}
                <div>
                   <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 block">{t.checkout.methodLabel}</label>
                   <div className="flex border-b border-slate-800 mb-6">
                      <button 
                        onClick={() => setPaymentMethod('pix')}
                        className={`flex items-center pb-2 px-4 text-sm font-medium transition-colors relative ${
                          paymentMethod === 'pix' ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        <QrCode className="w-4 h-4 mr-2" /> {t.checkout.pix}
                        {paymentMethod === 'pix' && <motion.div layoutId="activeTab" className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-emerald-500" />}
                      </button>
                      <button 
                         onClick={() => setPaymentMethod('card')}
                         className={`flex items-center pb-2 px-4 text-sm font-medium transition-colors relative ${
                          paymentMethod === 'card' ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        <CreditCard className="w-4 h-4 mr-2" /> {t.checkout.card}
                        {paymentMethod === 'card' && <motion.div layoutId="activeTab" className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-emerald-500" />}
                      </button>
                   </div>

                   {/* Payment Content */}
                   {paymentMethod === 'pix' ? (
                     <div className="bg-white p-4 rounded-xl flex flex-col items-center justify-center">
                        <div className="w-32 h-32 bg-slate-200 mb-4 rounded-lg flex items-center justify-center text-slate-400 text-xs">
                           <img src="https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg" alt="QR Code" className="w-full h-full mix-blend-multiply opacity-80" />
                        </div>
                        <p className="text-slate-900 text-sm font-medium mb-3">{t.checkout.scanPix}</p>
                        <button className="w-full flex items-center justify-center py-2 px-3 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 text-sm font-medium transition-colors">
                           <Copy className="w-4 h-4 mr-2" /> {t.checkout.copyPix}
                        </button>
                     </div>
                   ) : (
                     <div className="space-y-4">
                        <div className="space-y-1">
                          <label className="text-xs text-slate-400">{t.checkout.cardNumber}</label>
                          <input type="text" placeholder="0000 0000 0000 0000" className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:ring-1 focus:ring-emerald-500 outline-none" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-1">
                             <label className="text-xs text-slate-400">{t.checkout.expiry}</label>
                             <input type="text" placeholder="MM/YY" className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:ring-1 focus:ring-emerald-500 outline-none" />
                           </div>
                           <div className="space-y-1">
                             <label className="text-xs text-slate-400">{t.checkout.cvc}</label>
                             <input type="text" placeholder="123" className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:ring-1 focus:ring-emerald-500 outline-none" />
                           </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs text-slate-400">{t.checkout.cardholder}</label>
                          <input type="text" placeholder="ALEXANDRE SILVA" className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:ring-1 focus:ring-emerald-500 outline-none" />
                        </div>
                     </div>
                   )}
                </div>

                {/* Footer Totals */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                  <div>
                    <div className="text-slate-400 text-xs">{t.checkout.total}</div>
                    <div className="text-xl font-bold text-white">
                      {selectedPlan === '1' ? '$2.99' : '$9.99'}
                    </div>
                  </div>
                  <Button 
                    onClick={handlePayment} 
                    disabled={isProcessing}
                    className="w-40 bg-emerald-500 hover:bg-emerald-600 text-white"
                  >
                    {isProcessing ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <span className="flex items-center">
                         <span className="mr-2">{t.checkout.confirm}</span>
                         <CheckCircle2 className="w-4 h-4" />
                      </span>
                    )}
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-10">
                <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">{t.checkout.successTitle}</h3>
                <p className="text-slate-400 text-center mb-6">
                  {selectedPlan === '1' ? t.checkout.successDescOne : t.checkout.successDescFive}
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};