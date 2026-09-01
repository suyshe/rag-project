import React from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { clsx } from 'clsx';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title?: string;
  message: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-md w-full px-4 sm:px-0">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={clsx(
            'flex items-start gap-3 p-4 rounded-xl border shadow-lg backdrop-blur-md transition-all animate-in slide-in-from-bottom-5',
            toast.type === 'error' && 'bg-rose-950/90 border-rose-800/80 text-rose-100',
            toast.type === 'success' && 'bg-emerald-950/90 border-emerald-800/80 text-emerald-100',
            toast.type === 'info' && 'bg-slate-900/95 border-slate-700 text-slate-100'
          )}
        >
          <div className="shrink-0 mt-0.5">
            {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-400" />}
            {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
            {toast.type === 'info' && <Info className="w-5 h-5 text-sky-400" />}
          </div>

          <div className="flex-1 text-sm">
            {toast.title && <div className="font-semibold mb-0.5">{toast.title}</div>}
            <div className="text-xs sm:text-sm opacity-90">{toast.message}</div>
          </div>

          <button
            onClick={() => onDismiss(toast.id)}
            className="shrink-0 p-1 rounded-md hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
