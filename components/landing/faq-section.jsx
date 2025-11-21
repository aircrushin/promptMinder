"use client";

import { useState } from "react";

// 接收 t prop
const FAQStripes = () => (
  <svg
    aria-hidden="true"
    className="absolute right-8 top-12 h-32 w-32 text-black/5"
    viewBox="0 0 120 120"
  >
    {[0, 20, 40, 60, 80, 100].map((y) => (
      <line
        key={y}
        x1="0"
        y1={y}
        x2="120"
        y2={y}
        stroke="currentColor"
        strokeWidth="1"
      />
    ))}
  </svg>
);

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
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-black/10 to-transparent" />
        <FAQStripes />
        <div className="relative mx-auto max-w-6xl px-6">
          <div className="text-center mb-16">
            <p className="text-sm font-mono uppercase tracking-[0.4em] text-neutral-500">
              Answers
            </p>
            <h2 className="mt-4 text-4xl font-semibold leading-tight text-neutral-900 sm:text-5xl">
              {translations.title}
            </h2>
            <p className="mt-4 text-lg text-neutral-600 max-w-3xl mx-auto">
              {translations.description}
            </p>
          </div>

          <div className="max-w-5xl mx-auto divide-y divide-black/10 border border-black/10 rounded-2xl bg-neutral-50">
            {faqs.map((faq, index) => (
              <button
                key={index}
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full text-left px-6 py-5"
              >
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-lg font-semibold text-neutral-900">
                    {faq.question}
                  </h3>
                  <span className="text-2xl font-light text-neutral-500">
                    {openIndex === index ? "−" : "+"}
                  </span>
                </div>
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    openIndex === index ? "mt-3 max-h-96" : "max-h-0"
                  }`}
                >
                  <p className="text-base leading-relaxed text-neutral-600">
                    {faq.answer}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>
    );
} 