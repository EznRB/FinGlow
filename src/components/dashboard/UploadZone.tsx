import React, { useCallback, useState } from 'react';
import { UploadCloud, FileText } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  isProcessing: boolean;
}

export const UploadZone: React.FC<UploadZoneProps> = ({ onFileSelect, isProcessing }) => {
  const { t } = useLanguage();
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  }, [onFileSelect]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };

  if (isProcessing) return null; // Handled by parent view

  return (
    <div className="w-full max-w-2xl mx-auto animate-in fade-in zoom-in duration-500">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative flex flex-col items-center justify-center w-full h-80 
          border-2 border-dashed rounded-3xl transition-all duration-300
          backdrop-blur-sm
          ${isDragging 
            ? 'border-emerald-400 bg-emerald-500/10 scale-[1.02] shadow-[0_0_30px_rgba(16,185,129,0.3)]' 
            : 'border-slate-700 bg-slate-900/40 hover:border-slate-500 hover:bg-slate-900/60'}
        `}
      >
        {/* Pulsing Border Effect for Drag State */}
        {isDragging && (
          <div className="absolute inset-0 rounded-3xl border-2 border-emerald-400 animate-ping opacity-20 pointer-events-none" />
        )}

        <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
            <div className={`p-5 rounded-full bg-slate-800/80 mb-6 shadow-xl transition-transform duration-300 ${isDragging ? 'scale-110 rotate-12 bg-emerald-900/50' : ''}`}>
              <UploadCloud className={`w-12 h-12 ${isDragging ? 'text-emerald-400' : 'text-slate-300'}`} />
            </div>
            
            <h3 className="mb-3 text-2xl font-bold text-white tracking-tight">
              {isDragging ? t.upload.active : t.upload.passive}
            </h3>
            
            <p className="text-slate-400 mb-8 max-w-sm leading-relaxed">
              {t.upload.desc}
              <br/>
              <span className="text-xs text-slate-500 mt-2 block">{t.upload.supports}</span>
            </p>

            <label className="group relative cursor-pointer">
              <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 opacity-70 blur group-hover:opacity-100 transition duration-200"></div>
              <span className="relative flex items-center bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 px-8 rounded-xl transition-colors border border-slate-700">
                <FileText className="w-4 h-4 mr-2 text-emerald-400" />
                {t.upload.selectBtn}
                <input type="file" className="hidden" accept=".csv" onChange={handleChange} />
              </span>
            </label>
        </div>
      </div>
    </div>
  );
};