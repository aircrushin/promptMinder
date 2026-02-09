"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { generateFAQPageSchema } from "@/lib/geo-utils";
import { ChevronDownIcon } from "@heroicons/react/24/outline";

export function FAQSection({ t, language = 'zh' }) {
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

  // Generate FAQ structured data (for GEO optimization)
  const faqSchema = useMemo(() => {
    return {
      "@context": "https://schema.org",
      ...generateFAQPageSchema(faqs, language),
    };
  }, [faqs, language]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1
      }
    }
  };

  const titleVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.25, 0.4, 0.25, 1]
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.25, 0.4, 0.25, 1]
      }
    }
  };

  return (
    <section 
      className="relative overflow-hidden bg-slate-50/50 py-28"
      itemScope 
      itemType="https://schema.org/FAQPage"
      aria-labelledby="faq-title"
    >
      {/* FAQ structured data - optimized for AI search engines */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:32px_32px]" />
      <div className="absolute left-0 top-1/2 -z-10 h-[500px] w-[500px] -translate-y-1/2 bg-indigo-500/8 blur-[120px]" />
      
      <div className="relative mx-auto max-w-4xl px-6">
        <motion.header 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={containerVariants}
          className="mb-16 text-center"
        >
          <motion.h2 
            id="faq-title"
            variants={titleVariants}
            className="mb-4 text-4xl font-extrabold leading-tight text-slate-900 sm:text-5xl bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 bg-clip-text text-transparent"
          >
            {translations.title}
          </motion.h2>
          <motion.p 
            variants={titleVariants}
            className="mx-auto max-w-2xl text-lg text-slate-600"
          >
            {translations.description}
          </motion.p>
        </motion.header>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="space-y-3"
          role="list" 
          aria-label="FAQ List"
        >
          {faqs.map((faq, index) => (
            <motion.article 
              key={index}
              variants={itemVariants}
              itemScope 
              itemProp="mainEntity" 
              itemType="https://schema.org/Question"
              role="listitem"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className={`group w-full rounded-2xl border bg-white/70 p-6 text-left backdrop-blur-xl transition-all duration-300 hover:shadow-lg ${
                  openIndex === index 
                    ? "border-indigo-300/80 shadow-lg shadow-indigo-500/10" 
                    : "border-slate-200/60 hover:border-indigo-300/60 hover:bg-white/90"
                }`}
                aria-expanded={openIndex === index}
                aria-controls={`faq-answer-${index}`}
              >
                <div className="flex items-center justify-between gap-4">
                  <h3 
                    itemProp="name"
                    className={`text-lg font-bold transition-colors duration-300 ${
                      openIndex === index ? "text-indigo-600" : "text-slate-900 group-hover:text-indigo-700"
                    }`}
                  >
                    {faq.question}
                  </h3>
                  <motion.span 
                    animate={{ rotate: openIndex === index ? 180 : 0 }}
                    transition={{ duration: 0.3, ease: [0.25, 0.4, 0.25, 1] }}
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-all duration-300 ${
                      openIndex === index 
                        ? "border-indigo-300 bg-indigo-50 text-indigo-600" 
                        : "border-slate-200 bg-white text-slate-400 group-hover:border-indigo-300 group-hover:text-indigo-600"
                    }`}
                    aria-hidden="true"
                  >
                    <ChevronDownIcon className="h-5 w-5" />
                  </motion.span>
                </div>
                
                <AnimatePresence initial={false}>
                  {openIndex === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: [0.25, 0.4, 0.25, 1] }}
                      className="overflow-hidden"
                      id={`faq-answer-${index}`}
                      itemScope 
                      itemProp="acceptedAnswer" 
                      itemType="https://schema.org/Answer"
                    >
                      <motion.p 
                        initial={{ y: -10 }}
                        animate={{ y: 0 }}
                        exit={{ y: -10 }}
                        transition={{ duration: 0.2 }}
                        itemProp="text"
                        className="mt-4 text-slate-600 leading-relaxed"
                      >
                        {faq.answer}
                      </motion.p>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {/* Hidden answer for SEO/GEO */}
                {openIndex !== index && (
                  <div 
                    itemScope 
                    itemProp="acceptedAnswer" 
                    itemType="https://schema.org/Answer"
                    className="sr-only"
                  >
                    <span itemProp="text">{faq.answer}</span>
                  </div>
                )}
              </button>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
} 
