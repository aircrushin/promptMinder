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
    <section className="relative overflow-hidden bg-[radial-gradient(circle_at_20%_10%,rgba(0,0,0,0.08),transparent_32%),radial-gradient(circle_at_80%_0%,rgba(0,0,0,0.06),transparent_28%),linear-gradient(180deg,#f9fafb,#ffffff)] py-20">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      <div className="absolute top-6 left-1/4 -translate-x-1/2 w-[520px] h-[420px] opacity-30">
        <div className="absolute inset-0 rounded-full bg-gradient-radial from-black/10 via-black/5 to-transparent blur-[90px]" />
      </div>
      <div className="absolute bottom-0 right-1/4 translate-x-1/2 w-[460px] h-[340px] opacity-25">
        <div className="absolute inset-0 rounded-full bg-gradient-radial from-black/8 via-black/4 to-transparent blur-[80px]" />
      </div>
      <div className="relative z-10 mx-auto max-w-6xl px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-4xl overflow-hidden rounded-3xl border border-border bg-white/80 p-10 text-center shadow-[0_28px_90px_-60px_rgba(0,0,0,0.35)] backdrop-blur"
        >
          <div className="mx-auto mb-3 inline-flex items-center rounded-full border border-border bg-white/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-foreground">
            Prompt Minder
          </div>
          <h2 className="text-4xl font-bold leading-tight text-slate-900 sm:text-5xl mb-4">
            {translations.title}
          </h2>
          <p className="text-lg md:text-xl text-slate-600 mb-10">
            {translations.description}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={isSignedIn ? "/prompts" : "/sign-up"}
              className="inline-flex items-center justify-center rounded-xl bg-primary px-8 py-4 text-lg font-semibold text-primary-foreground shadow-[0_22px_80px_-42px_rgba(0,0,0,0.55)] transition-all hover:-translate-y-0.5 hover:shadow-[0_24px_90px_-40px_rgba(0,0,0,0.6)]"
             >
              {isSignedIn ? translations.buttonLoggedIn : translations.buttonLoggedOut}
            </Link>
            <Link
              href="/public"
              className="inline-flex items-center justify-center rounded-xl border border-border bg-white/70 px-8 py-4 text-lg font-semibold text-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:border-foreground/15 hover:shadow-[0_16px_60px_-46px_rgba(0,0,0,0.45)]"
             >
              {translations.promptCollections}
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
