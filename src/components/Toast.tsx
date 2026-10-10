import React from 'react';
import { Check } from 'lucide-react';

interface ToastProps {
  message: string | null;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message }) => {
  if (!message) return null;

  return (
    <div 
      role="status" 
      aria-live="polite"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl border border-slate-700/60 animate-in fade-in slide-in-from-bottom-3 duration-200"
    >
      <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
        <Check className="w-3.5 h-3.5 stroke-[3]" />
      </div>
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
};
