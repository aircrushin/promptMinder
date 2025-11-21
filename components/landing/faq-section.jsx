"use client";

import { useState } from "react";

// 接收 t prop
export function FAQSection({ t }) {
  const [openIndex, setOpenIndex] = useState(null);
  // 与其它区块保持一致：合并 props 与默认文案，确保健壮回退
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
    <section className="relative overflow-hidden bg-white py-24">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-20 h-64 w-[30rem] -translate-x-1/2 rounded-full bg-black/5 blur-[140px]" />
        <div className="absolute -right-20 bottom-8 h-72 w-72 rounded-full bg-black/5 blur-[160px]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold leading-tight text-slate-900 sm:text-5xl mb-4">
            {translations.title}
          </h2>
          <p className="text-lg text-slate-600 max-w-3xl mx-auto">
            {translations.description}
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          {faqs.map((faq, index) => (
            <div key={index} className="mb-4">
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full text-left rounded-2xl border border-border bg-white/80 p-6 transition-all duration-300 ease-in-out hover:-translate-y-1 hover:border-foreground/15 hover:shadow-[0_22px_70px_-48px_rgba(0,0,0,0.35)] backdrop-blur"
              >
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {faq.question}
                  </h3>
                  <span className="text-foreground text-xl">
                    {openIndex === index ? "−" : "+"}
                  </span>
                </div>
                {openIndex === index && (
                  <div className="mt-4">
                    <p className="text-gray-700 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
} 
