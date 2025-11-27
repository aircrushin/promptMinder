"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function FAQSection({ t }) {
  const [openIndex, setOpenIndex] = useState(null);
  
  const fallback = {
    title: 'Frequently Asked Questions',
    description: 'Learn more about Prompt Minder',
    items: [
      { question: 'How to start using Prompt Minder?', answer: 'Simply register an account to get started. We provide detailed tutorials and documentation to help you get started quickly.' },
      { question: 'Does it support team collaboration?', answer: 'Yes, we offer complete team collaboration features, including member management, permission control, real-time synchronization, etc.' },
      { question: 'How is data security ensured?', answer: 'We use enterprise-level encryption technology to protect your data and support data export and backup functions.' },
      { question: 'Is private deployment supported?', answer: 'Enterprise plan users can choose a private deployment solution, and we provide complete deployment support and technical services.' }
    ]
  };
  const translations = { ...fallback, ...(t || {}) };
  const faqs = Array.isArray(translations.items) ? translations.items : fallback.items;

  return (
    <section className="relative overflow-hidden bg-slate-50/50 py-24">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      
      <div className="relative mx-auto max-w-4xl px-6">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-4xl font-extrabold leading-tight text-slate-900 sm:text-5xl">
            {translations.title}
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-slate-600">
            {translations.description}
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index}>
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className={`group w-full rounded-2xl border bg-white/60 p-6 text-left backdrop-blur-xl transition-all hover:shadow-lg ${
                  openIndex === index 
                    ? "border-indigo-200 shadow-md" 
                    : "border-white/40 hover:border-indigo-200/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <h3 className={`text-lg font-bold transition-colors ${
                    openIndex === index ? "text-indigo-600" : "text-slate-900"
                  }`}>
                    {faq.question}
                  </h3>
                  <span className={`flex h-8 w-8 items-center justify-center rounded-full border transition-all ${
                    openIndex === index 
                      ? "border-indigo-200 bg-indigo-50 text-indigo-600 rotate-180" 
                      : "border-slate-200 bg-white text-slate-400 group-hover:border-indigo-200 group-hover:text-indigo-600"
                  }`}>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </div>
                <AnimatePresence>
                  {openIndex === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <p className="mt-4 text-slate-600 leading-relaxed">
                        {faq.answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
} 
