"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";

const Checkerboard = () => (
  <svg
    aria-hidden="true"
    className="absolute inset-0 h-full w-full text-white/5"
    viewBox="0 0 160 160"
  >
    <defs>
      <pattern id="cta-checker" width="20" height="20" patternUnits="userSpaceOnUse">
        <rect width="20" height="20" fill="currentColor" opacity="0.1" />
        <rect width="10" height="10" fill="currentColor" opacity="0.35" />
        <rect x="10" y="10" width="10" height="10" fill="currentColor" opacity="0.35" />
      </pattern>
    </defs>
    <rect width="160" height="160" fill="url(#cta-checker)" />
  </svg>
);

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
    <section className="relative overflow-hidden bg-black py-24 text-white">
      <Checkerboard />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      <div className="relative mx-auto max-w-5xl px-6 text-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-8"
        >
          <p className="text-sm font-mono uppercase tracking-[0.4em] text-white/60">
            Commitment
          </p>
          <h2 className="text-4xl font-semibold leading-tight sm:text-5xl">
            {translations.title}
          </h2>
          <p className="text-lg md:text-xl text-white/70">
            {translations.description}
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
            <Link
              href={isSignedIn ? "/prompts" : "/sign-up"}
              className="inline-flex min-w-[220px] items-center justify-center rounded-full bg-white px-8 py-4 text-lg font-medium text-black transition-all hover:-translate-y-0.5 hover:bg-neutral-100"
            >
              {isSignedIn ? translations.buttonLoggedIn : translations.buttonLoggedOut}
            </Link>
            <Link
              href="/public"
              className="inline-flex min-w-[220px] items-center justify-center rounded-full border border-white/40 px-8 py-4 text-lg font-medium text-white transition-all hover:-translate-y-0.5 hover:border-white/70"
            >
              {translations.promptCollections}
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}