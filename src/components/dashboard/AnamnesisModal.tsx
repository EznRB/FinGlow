import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Briefcase, DollarSign, Target, Users, ArrowRight, Zap, CheckCircle2, RotateCcw } from 'lucide-react';
import { Button } from '../ui/Button';
import { useLanguage } from '../../contexts/LanguageContext';
import { AnamnesisData } from '../../types';

interface AnamnesisModalProps {
  isOpen: boolean;
  onComplete: (data: AnamnesisData, savePersistent: boolean) => void;
  initialData?: AnamnesisData | null;
}

export const AnamnesisModal: React.FC<AnamnesisModalProps> = ({ isOpen, onComplete, initialData }) => {
  const { t } = useLanguage();
  const [step, setStep] = useState(1);
  const [savePersistent, setSavePersistent] = useState(true);
  const [formData, setFormData] = useState<AnamnesisData>({
    age: 30,
    occupation: '',
    totalInvested: 0,
    financialGoals: [],
    familyStatus: 'single'
  });

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        ...initialData
      }));
    }
  }, [initialData]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      onComplete(formData, savePersistent);
    }
  };

  const toggleGoal = (goal: string) => {
    setFormData(prev => {
      const goals = prev.financialGoals.includes(goal)
        ? prev.financialGoals.filter(g => g !== goal)
        : [...prev.financialGoals, goal];
      return { ...prev, financialGoals: goals };
    });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-950/90 backdrop-blur-md"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg max-h-[85vh] flex flex-col bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-800 flex-shrink-0 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-emerald-400" />
                {t.anamnesis.title}
              </h2>
              <p className="text-xs text-slate-400 mt-1">{t.anamnesis.subtitle}</p>
            </div>
            <div className="text-xs font-bold text-slate-500 bg-slate-800 px-3 py-1 rounded-full">
              Step {step} / 3
            </div>
          </div>

          <div className="p-8 min-h-[200px] overflow-y-auto custom-scrollbar">
            {/* Saved Profile Banner - Only show on Step 1 if initialData exists */}
            {step === 1 && initialData && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between group hover:bg-emerald-500/20 transition-all cursor-pointer"
                onClick={() => onComplete(formData, false)}
              >
                <div className="text-sm text-emerald-300">
                  <span className="block font-bold mb-1 flex items-center gap-1">
                    <Zap className="w-3 h-3 fill-emerald-500" /> {t.anamnesis.savedProfileFound}
                  </span>
                  <span className="opacity-80">{initialData.occupation}, {initialData.age} anos</span>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  className="flex-shrink-0 shadow-lg shadow-emerald-500/20"
                >
                  <ArrowRight className="w-3 h-3 mr-2" />
                  {t.anamnesis.useSaved}
                </Button>
              </motion.div>
            )}

            {/* Step 1: Personal Info */}
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-400 uppercase flex items-center gap-2">
                    <User className="w-4 h-4" /> {t.anamnesis.labels.age}
                  </label>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-400 uppercase flex items-center gap-2">
                    <Briefcase className="w-4 h-4" /> {t.anamnesis.labels.occupation}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Software Engineer, Teacher..."
                    value={formData.occupation}
                    onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-400 uppercase flex items-center gap-2">
                    <Users className="w-4 h-4" /> {t.anamnesis.labels.family}
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {['single', 'married', 'married_kids', 'single_parent'].map((status) => (
                      <button
                        key={status}
                        onClick={() => setFormData({ ...formData, familyStatus: status as any })}
                        className={`p-3 rounded-xl border text-sm transition-all ${formData.familyStatus === status
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 font-bold'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                          }`}
                      >
                        {t.anamnesis.options[status as keyof typeof t.anamnesis.options]}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: Assets */}
            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="p-4 bg-blue-500/10 rounded-xl border border-blue-500/20 mb-6">
                  <p className="text-blue-200 text-sm">
                    This helps our AI compare your wealth accumulation against benchmarks for your age group.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-400 uppercase flex items-center gap-2">
                    <DollarSign className="w-4 h-4" /> {t.anamnesis.labels.invested}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">R$</span>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={formData.totalInvested}
                      onChange={(e) => setFormData({ ...formData, totalInvested: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 pl-10 text-white focus:ring-1 focus:ring-emerald-500 outline-none text-lg font-mono"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 3: Goals */}
            {step === 3 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="space-y-4">
                  <label className="text-sm font-bold text-slate-400 uppercase flex items-center gap-2">
                    <Target className="w-4 h-4" /> {t.anamnesis.labels.goals} (Select multiple)
                  </label>
                  <div className="grid grid-cols-1 gap-3">
                    {[
                      'goal_retirement',
                      'goal_debt',
                      'goal_house',
                      'goal_travel',
                      'goal_emergency'
                    ].map((goalKey) => {
                      const isSelected = formData.financialGoals.includes(goalKey);
                      return (
                        <button
                          key={goalKey}
                          onClick={() => toggleGoal(goalKey)}
                          className={`flex items-center p-3 rounded-xl border text-sm transition-all ${isSelected
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 font-bold'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                            }`}
                        >
                          <div className={`w-5 h-5 rounded-full border mr-3 flex items-center justify-center ${isSelected ? 'border-emerald-500 bg-emerald-500' : 'border-slate-600'}`}>
                            {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
                          </div>
                          {t.anamnesis.options[goalKey as keyof typeof t.anamnesis.options]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-800">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={savePersistent}
                        onChange={(e) => setSavePersistent(e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`w-6 h-6 rounded-md border transition-all flex items-center justify-center ${savePersistent ? 'bg-emerald-500 border-emerald-500' : 'bg-slate-950 border-slate-700 group-hover:border-slate-500'
                        }`}>
                        {savePersistent && <CheckCircle2 className="w-4 h-4 text-white" />}
                      </div>
                    </div>
                    <span className="text-sm text-slate-300 group-hover:text-white transition-colors">
                      {t.anamnesis.saveForFuture || "Salvar informações para futuras análises"}
                    </span>
                  </label>
                </div>
              </motion.div>
            )}
          </div>

          <div className="p-6 border-t border-slate-800 flex-shrink-0 flex justify-end">
            <Button onClick={handleNext} className="w-full md:w-auto">
              {step === 3 ? t.anamnesis.analyze : t.anamnesis.next} <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};