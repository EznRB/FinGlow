import React, { useState, useEffect } from 'react';
import { UploadZone } from '../components/dashboard/UploadZone';
import { FinancialReport } from '../components/dashboard/FinancialReport';
import { AnamnesisModal } from '../components/dashboard/AnamnesisModal';
import { parseCSV } from '../services/csvService';
import { analyzeFinancesWithGemini } from '../services/geminiService';
import { FinancialReportData, AnalysisStatus, AnamnesisData } from '../types';
import { Layout } from '../components/layout/Layout';
import { CheckoutModal } from '../components/checkout/CheckoutModal';
import { Loader2, CheckCircle2, Circle, Plus } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface UploadPageProps {
  onLogout: () => void;
}

export const UploadPage: React.FC<UploadPageProps> = ({ onLogout }) => {
  const { t } = useLanguage();
  const [status, setStatus] = useState<AnalysisStatus>('idle');
  const [report, setReport] = useState<FinancialReportData | null>(null);
  const [credits, setCredits] = useState(3);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  
  // State for the upload flow
  const [csvString, setCsvString] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [showAnamnesis, setShowAnamnesis] = useState(false);
  
  // Optional: Store previous profile to skip anamnesis
  const [savedProfile, setSavedProfile] = useState<AnamnesisData | null>(null);

  useEffect(() => {
    let interval: any;
    if (status === 'parsing' || status === 'analyzing') {
      interval = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev < t.uploadPage.steps.length - 1) return prev + 1;
          return prev;
        });
      }, 1500); 
    } else {
      setCurrentStep(0);
    }
    return () => clearInterval(interval);
  }, [status, t.uploadPage.steps]);

  // Load saved profile on mount
  useEffect(() => {
    const storedLatest = localStorage.getItem('finglow_latest_report');
    if (storedLatest) {
        try {
            const data = JSON.parse(storedLatest);
            if (data.user_profile) {
                setSavedProfile(data.user_profile);
            }
        } catch (e) {
            console.error("Error loading saved profile", e);
        }
    }
  }, []);

  // Helper to save analysis to history
  const saveToHistory = (data: FinancialReportData, fileName: string) => {
    try {
      const id = Date.now().toString();
      const historyItem = {
        id: id,
        date: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
        name: fileName,
        score: data.financial_health_score,
        value: data.metrics.total_expense
      };

      // 1. Save the summary to the list
      const existingHistory = localStorage.getItem('finglow_history');
      const historyArray = existingHistory ? JSON.parse(existingHistory) : [];
      historyArray.unshift(historyItem); // Add to top
      localStorage.setItem('finglow_history', JSON.stringify(historyArray));
      
      // 2. Save the FULL report for retrieval later
      // We use a try-catch specifically for quota limits
      try {
        localStorage.setItem(`finglow_report_${id}`, JSON.stringify(data));
      } catch (e) {
        console.warn("Storage quota exceeded, could not save detailed history for this item.");
      }

      // 3. Set as latest for dashboard immediately
      localStorage.setItem('finglow_latest_report', JSON.stringify(data)); 
      
      // Update saved profile locally for next time without reload
      if (data.user_profile) {
          setSavedProfile(data.user_profile);
      }

    } catch (e) {
      console.error("Failed to save history", e);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (credits <= 0) {
      setIsCheckoutOpen(true);
      return;
    }

    try {
      setStatus('parsing');
      setErrorMsg(null);
      setCurrentStep(0);
      setFileName(file.name);
      
      const parsedData = await parseCSV(file);
      setCsvString(parsedData);
      
      // Instead of going straight to analysis, pause and show Anamnesis
      setStatus('anamnesis');
      setShowAnamnesis(true);

    } catch (error: any) {
      console.error(error);
      setStatus('error');
      setErrorMsg(error.message || "An error occurred during parsing.");
    }
  };

  const handleAnamnesisComplete = async (profileData: AnamnesisData) => {
    setShowAnamnesis(false);
    
    if (!csvString) {
        setStatus('error');
        return;
    }

    try {
      setStatus('analyzing');
      const analysisResult = await analyzeFinancesWithGemini(csvString, profileData);
      
      setReport(analysisResult);
      saveToHistory(analysisResult, fileName);
      setStatus('complete');
      setCredits(prev => prev - 1);
    } catch (error: any) {
      console.error(error);
      setStatus('error');
      setErrorMsg(error.message || "An error occurred during AI analysis.");
    }
  };

  const handleReset = () => {
    setStatus('idle');
    setReport(null);
    setErrorMsg(null);
    setCsvString(null);
    setFileName("");
  };

  return (
    <Layout credits={credits} onLogout={onLogout} onAddCredits={() => setIsCheckoutOpen(true)}>
      <CheckoutModal 
        isOpen={isCheckoutOpen} 
        onClose={() => setIsCheckoutOpen(false)} 
        onSuccess={(amount) => setCredits(c => c + amount)} 
      />

      <AnamnesisModal 
        isOpen={showAnamnesis} 
        onComplete={handleAnamnesisComplete} 
        initialData={savedProfile}
      />

      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">{t.uploadPage.title}</h1>
            <p className="text-slate-400 mt-1">
              {status === 'complete' 
                ? t.uploadPage.complete 
                : t.uploadPage.welcome}
            </p>
          </div>
          <div className="flex gap-3">
             {status === 'idle' && (
                <>
                  <button 
                    onClick={() => setIsCheckoutOpen(true)}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-emerald-500/20 flex items-center"
                  >
                    <Plus className="w-4 h-4 mr-2" /> {t.uploadPage.addCredits}
                  </button>
                </>
             )}
             {status === 'complete' && (
                <button 
                  onClick={handleReset}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-medium transition-colors border border-slate-700"
                >
                  {t.uploadPage.analyzeNew}
                </button>
             )}
          </div>
        </div>

        {errorMsg && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 flex items-center animate-in fade-in slide-in-from-top-2">
             <span className="mr-2">⚠️</span> {errorMsg}
          </div>
        )}

        {status === 'idle' && (
          <div className="flex flex-col items-center justify-center py-12 animate-in fade-in duration-700">
             <UploadZone onFileSelect={handleFileUpload} isProcessing={false} />
             
             <div className="mt-16 text-center w-full max-w-lg">
               <p className="text-[10px] text-slate-600 uppercase tracking-[0.2em] font-bold mb-6">{t.uploadPage.supportedBanks}</p>
               <div className="flex gap-8 justify-center items-center opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
                 <div className="text-lg font-bold text-slate-300">CHASE</div>
                 <div className="text-lg font-bold text-slate-300">Wells Fargo</div>
                 <div className="text-lg font-bold text-slate-300">CITI</div>
                 <div className="text-lg font-bold text-slate-300">BOA</div>
               </div>
             </div>
          </div>
        )}

        {/* Loading State during Parsing OR Analyzing (Anamnesis is handled by modal) */}
        {((status === 'parsing' || status === 'analyzing')) && (
           <div className="flex flex-col items-center justify-center py-12 animate-in fade-in duration-500 w-full max-w-2xl mx-auto">
              <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-50"></div>
                 
                 <div className="flex items-center mb-8">
                    <Loader2 className="w-6 h-6 text-emerald-500 animate-spin mr-3" />
                    <h3 className="text-xl font-bold text-white">{t.uploadPage.aiWorking}</h3>
                 </div>

                 <div className="space-y-4">
                    {t.uploadPage.steps.map((step, index) => {
                       const isActive = index === currentStep;
                       const isCompleted = index < currentStep;
                       
                       return (
                         <div key={index} className={`flex items-center transition-all duration-300 ${isActive || isCompleted ? 'opacity-100' : 'opacity-30'}`}>
                           <div className="mr-4">
                             {isCompleted ? (
                               <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                             ) : isActive ? (
                               <div className="w-5 h-5 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin"></div>
                             ) : (
                               <Circle className="w-5 h-5 text-slate-600" />
                             )}
                           </div>
                           <span className={`${isActive ? 'text-emerald-400 font-medium' : isCompleted ? 'text-slate-300' : 'text-slate-500'}`}>
                             {step}
                           </span>
                         </div>
                       );
                    })}
                 </div>

                 <div className="mt-8 pt-6 border-t border-slate-800 flex justify-between items-center text-xs text-slate-500">
                    <span>{t.uploadPage.securedBy}</span>
                    <span>{Math.round((currentStep / t.uploadPage.steps.length) * 100)}% Complete</span>
                 </div>
              </div>
           </div>
        )}

        {status === 'complete' && report && (
          <FinancialReport data={report} />
        )}
      </div>
    </Layout>
  );
};