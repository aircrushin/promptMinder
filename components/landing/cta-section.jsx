"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";

export function CTASection({ t }) {
  const { isSignedIn } = useAuth();
  
  // 与其它区块保持一致：合并 props 与默认文案，确保健壮回退
  const fallback = {
    title: 'Ready to get started?',
    description: 'Join Prompt Minder now and start your AI prompt management journey',
    buttonLoggedIn: 'Go to Console',
    buttonLoggedOut: 'Sign Up for Free',
    promptCollections: 'Prompt Collections'
  };
  const translations = { ...fallback, ...(t || {}) };
  
  return (
    <section className="py-20 bg-white relative overflow-hidden">
      <div className="absolute top-0 left-1/4 -translate-x-1/2 w-[600px] h-[400px] opacity-30">
        <div className="absolute inset-0 bg-gradient-radial from-purple-100 via-blue-50 to-transparent blur-[80px]" />
      </div>
      <div className="absolute bottom-0 right-1/4 translate-x-1/2 w-[500px] h-[300px] opacity-20">
        <div className="absolute inset-0 bg-gradient-radial from-indigo-100 via-pink-50 to-transparent blur-[70px]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6 z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto text-center"
        >
          <h2 className="text-4xl font-bold leading-tight text-slate-900 sm:text-5xl mb-4">
            {translations.title}
          </h2>
          <p className="text-lg md:text-xl text-slate-600 mb-10">
            {translations.description}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={isSignedIn ? "/prompts" : "/sign-up"}
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-0.5 hover:shadow-xl"
            >
              {isSignedIn ? translations.buttonLoggedIn : translations.buttonLoggedOut}
            </Link>
            <Link
              href="/public"
              className="inline-flex items-center justify-center rounded-xl border border-blue-200/70 bg-white/70 px-8 py-4 text-lg font-semibold text-blue-700 transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-200"
            >
              {translations.promptCollections}
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}