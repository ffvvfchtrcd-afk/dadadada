import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, X, Info } from 'lucide-react';

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  warning: AlertCircle,
};

const styles = {
  success: 'border-green-500/30 bg-green-500/10',
  error: 'border-red-500/30 bg-red-500/10',
  info: 'border-brand-500/30 bg-brand-500/10',
  warning: 'border-yellow-500/30 bg-yellow-500/10',
};

const iconColors = {
  success: 'text-green-400',
  error: 'text-red-400',
  info: 'text-brand-400',
  warning: 'text-yellow-400',
};

export default function ToastContainer({ toasts, onRemove }) {
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3 max-w-sm">
      <AnimatePresence>
        {toasts.map(toast => {
          const Icon = icons[toast.type] || Info;
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 100, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.9 }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-xl shadow-2xl ${styles[toast.type]}`}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 ${iconColors[toast.type]}`} />
              <p className="text-sm text-gray-200 flex-1">{toast.message}</p>
              <button onClick={() => onRemove(toast.id)} className="text-gray-500 hover:text-gray-300 flex-shrink-0">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
