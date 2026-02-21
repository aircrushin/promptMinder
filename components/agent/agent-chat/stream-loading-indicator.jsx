'use client';

import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bot } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export function StreamLoadingIndicator() {
  const { t } = useLanguage();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
      className="group relative px-4 py-6 sm:px-6"
    >
      <div className="mx-auto max-w-3xl flex gap-4">
        {/* Avatar */}
        <div className="relative">
          <Avatar className="h-8 w-8 shrink-0 ring-2 ring-offset-2 shadow-sm bg-zinc-900 ring-zinc-300 overflow-hidden">
            <AvatarImage
              src="/decant-logo.svg"
              alt="Decant"
              className="object-contain"
            />
            <AvatarFallback className="bg-transparent text-white">
              <Bot className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
          <span className="absolute inset-0 rounded-full animate-ping bg-zinc-400 opacity-20" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-3">
          <motion.div
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-50 to-zinc-100 border border-zinc-200 p-4"
            initial={{ scale: 0.98 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            {/* Shimmer effect */}
            <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent" />

            <div className="flex items-center gap-3">
              <div className="relative flex-shrink-0">
                <motion.div
                  className="w-10 h-10 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center shadow-lg"
                  animate={{
                    boxShadow: [
                      '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      '0 10px 15px -3px rgba(0, 0, 0, 0.2)',
                      '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                    className="flex items-center justify-center"
                  >
                    <img
                      src="/decant-logo.svg"
                      alt="Decant"
                      className="h-5 w-5 object-contain"
                    />
                  </motion.div>
                </motion.div>
                <motion.span
                  className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
                />
                <motion.span
                  className="absolute -bottom-1 -left-1 w-1.5 h-1.5 bg-emerald-400 rounded-full"
                  animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                />
              </div>

              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-zinc-700">{t.agent.chat.thinking}</span>
                  <motion.span
                    className="flex gap-0.5"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        className="w-1 h-1 bg-zinc-400 rounded-full"
                        animate={{ y: [0, -3, 0], opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
                      />
                    ))}
                  </motion.span>
                </div>

                <div className="space-y-1.5">
                  <motion.div
                    className="h-2 bg-zinc-200 rounded-full"
                    animate={{ width: ['60%', '80%', '60%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  />
                  <motion.div
                    className="h-2 bg-zinc-200 rounded-full"
                    animate={{ width: ['40%', '55%', '40%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-3 h-1 w-full bg-zinc-200 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-zinc-400 via-zinc-600 to-zinc-400 rounded-full"
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                style={{ width: '40%' }}
              />
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
