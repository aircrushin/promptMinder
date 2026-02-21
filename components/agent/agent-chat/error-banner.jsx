'use client';

import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';

export function ErrorBanner({ error, onRetry, onDismiss }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="mx-4 mb-4"
    >
      <div className="mx-auto max-w-3xl rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 flex items-center gap-3">
        <AlertCircle className="h-5 w-5 text-rose-500 shrink-0" />
        <p className="flex-1 text-sm text-rose-700">
          {error?.message || 'Something went wrong. Please try again.'}
        </p>
        <div className="flex gap-2">
          <button
            onClick={onRetry}
            className="text-sm font-medium text-rose-600 hover:text-rose-700 px-3 py-1 rounded-lg hover:bg-rose-100 transition-colors"
          >
            Retry
          </button>
          <button
            onClick={onDismiss}
            className="text-sm text-rose-500 hover:text-rose-600 px-2 py-1 rounded-lg hover:bg-rose-100 transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    </motion.div>
  );
}
