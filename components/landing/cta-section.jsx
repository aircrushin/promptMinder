"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { ParticleButton } from "../ui/particle-button";

export function CTASection({ t }) {
  const { isSignedIn } = useAuth();
  const router = useRouter();
  
  const fallback = {
    title: 'Ready to get started?',
    description: 'Join Prompt Minder now and start your AI prompt management journey',
    buttonLoggedIn: 'Go to Console',
    buttonLoggedOut: 'Sign Up for Free',
    promptCollections: 'Prompt Collections'
  };
  const translations = { ...fallback, ...(t || {}) };
  
  return (
    <section className="relative overflow-hidden bg-slate-50/50 py-24">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-blue-400 opacity-20 blur-[100px]" />
      <div className="absolute right-0 top-0 -z-10 h-[500px] w-[500px] bg-purple-500/10 blur-[120px]" />
      
      <div className="relative z-10 mx-auto max-w-6xl px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-4xl overflow-hidden rounded-[2rem] border border-white/40 bg-white/60 p-12 text-center shadow-2xl shadow-indigo-500/10 backdrop-blur-xl"
        >
          <div className="mx-auto mb-6 inline-flex items-center rounded-full border border-indigo-500/20 bg-indigo-50/50 px-4 py-1 text-xs font-bold uppercase tracking-[0.24em] text-indigo-600">
            Prompt Minder
          </div>
          <h2 className="mb-6 text-4xl font-extrabold leading-tight text-slate-900 sm:text-5xl">
            <span className="text-transparent bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 [-webkit-background-clip:text] [background-clip:text]">
              {translations.title}
            </span>
          </h2>
          <p className="mb-10 text-lg text-slate-600 md:text-xl">
            {translations.description}
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <ParticleButton
              onClick={() => router.push(isSignedIn ? "/prompts" : "/sign-up")}
              className="inline-flex h-14 items-center justify-center rounded-2xl bg-slate-900 px-8 text-lg font-semibold text-white shadow-xl shadow-slate-900/20 transition-all hover:bg-slate-800 hover:shadow-2xl hover:shadow-slate-900/30"
             >
              {isSignedIn ? translations.buttonLoggedIn : translations.buttonLoggedOut}
            </ParticleButton>
            <Link
              href="/public"
              className="inline-flex h-14 items-center justify-center rounded-2xl border border-slate-200 bg-white px-8 text-lg font-semibold text-slate-900 shadow-sm transition-all hover:bg-slate-50 hover:border-slate-300"
             >
              {translations.promptCollections}
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
