'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Library } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { PromptLibraryModal } from './prompt-library-modal';

export function WelcomeScreen({ onSuggestionClick, onSelectPrompt }) {
  const { t, language } = useLanguage();
  const [showLibrary, setShowLibrary] = useState(false);

  const handleSelect = (prompt) => {
    onSelectPrompt?.(prompt);
    onSuggestionClick?.(prompt.content);
  };

  return (
    <div className="flex h-full min-h-full flex-col items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        className="flex flex-col items-center max-w-2xl"
      >
        {/* Logo */}
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-amber-500/20 rounded-3xl blur-2xl" />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 shadow-xl shadow-slate-900/25 ring-1 ring-amber-500/30 overflow-hidden">
            <img
              src="/decant-logo.svg"
              alt="Decant"
              className="h-16 w-16 object-contain"
            />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-zinc-900 mb-1 tracking-tight">
          {t.agent.welcome.title}
        </h1>
        <p className="text-lg text-zinc-500 mb-4">
          {t.agent.welcome.subtitle}
        </p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.35 }}
          className="mt-10 flex flex-col items-center gap-3"
        >
          <button
            onClick={() => setShowLibrary(true)}
            className="group flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-6 py-4 shadow-sm transition-all duration-200 hover:border-amber-300 hover:bg-amber-50/50 hover:shadow-md"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 group-hover:bg-amber-200 transition-colors">
              <Library className="h-4 w-4 text-amber-600" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-zinc-900">
                {t.agent?.promptLibrary?.buttonTitle || (language === 'zh' ? '从提示词库导入' : 'Import from Prompt Library')}
              </p>
              <p className="text-xs text-zinc-500 mt-0.5">
                {t.agent?.promptLibrary?.buttonSubtitle || (language === 'zh' ? '从您的提示词库中选择一个开始对话' : 'Choose a prompt from your library to get started')}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-zinc-400 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all ml-2" />
          </button>

          <p className="text-xs text-zinc-400">
            {language === 'zh' ? '或直接在下方输入框开始对话' : 'Or start typing in the input below'}
          </p>
        </motion.div>
      </motion.div>

      <PromptLibraryModal
        open={showLibrary}
        onOpenChange={setShowLibrary}
        onSelect={handleSelect}
      />
    </div>
  );
}
