"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { ParticleButton } from "../ui/particle-button";
import { SparklesIcon, ArrowRightIcon } from "@heroicons/react/24/outline";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.4, 0.25, 1]
    }
  }
};

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
    <section className="relative overflow-hidden bg-slate-50/50 py-28">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:32px_32px]" />
      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className="absolute left-1/2 top-1/2 -z-10 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/15 blur-[120px]" 
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2, delay: 0.2, ease: "easeOut" }}
        className="absolute left-1/4 top-0 -z-10 h-[400px] w-[400px] bg-purple-500/15 blur-[100px]" 
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2, delay: 0.4, ease: "easeOut" }}
        className="absolute right-1/4 bottom-0 -z-10 h-[400px] w-[400px] bg-blue-500/15 blur-[100px]" 
      />
      
      <div className="relative z-10 mx-auto max-w-6xl px-6">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="mx-auto max-w-4xl overflow-hidden rounded-3xl border border-white/60 bg-white/70 p-12 text-center shadow-2xl shadow-indigo-500/10 backdrop-blur-xl transition-all duration-300 hover:shadow-indigo-500/15"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-transparent to-purple-50/30 opacity-0 transition-opacity duration-300 hover:opacity-100" />
          
          <div className="relative">
            <motion.div 
              variants={itemVariants}
              className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-200/80 bg-indigo-50/70 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-indigo-600 shadow-sm"
            >
              <SparklesIcon className="h-4 w-4" />
              Prompt Minder
            </motion.div>
            
            <motion.h2 
              variants={itemVariants}
              className="mb-6 text-4xl font-extrabold leading-tight text-slate-900 sm:text-5xl"
            >
              <span className="bg-gradient-to-br from-slate-900 via-indigo-800 to-slate-900 bg-clip-text text-transparent">
                {translations.title}
              </span>
            </motion.h2>
            
            <motion.p 
              variants={itemVariants}
              className="mb-10 text-lg text-slate-600 md:text-xl"
            >
              {translations.description}
            </motion.p>
            
            <motion.div 
              variants={itemVariants}
              className="flex flex-col justify-center gap-4 sm:flex-row"
            >
              <ParticleButton
                onClick={() => router.push(isSignedIn ? "/prompts" : "/sign-up")}
                className="group relative inline-flex h-14 items-center justify-center gap-2 overflow-hidden rounded-2xl bg-slate-900 px-8 text-lg font-semibold text-white shadow-xl shadow-slate-900/25 transition-all duration-300 hover:shadow-2xl hover:shadow-slate-900/35 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
              >
                <span className="relative z-10">
                  {isSignedIn ? translations.buttonLoggedIn : translations.buttonLoggedOut}
                </span>
                <ArrowRightIcon className="relative z-10 h-5 w-5 transition-transform duration-200 group-hover:translate-x-0.5" />
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-slate-800 to-slate-700 transition-transform duration-300 group-hover:translate-x-0" />
              </ParticleButton>
              
              <Link
                href="/public"
                className="group relative inline-flex h-14 items-center justify-center gap-2 overflow-hidden rounded-2xl border border-slate-200 bg-white px-8 text-lg font-semibold text-slate-900 shadow-sm transition-all duration-300 hover:bg-slate-50 hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
              >
                <span className="relative z-10">{translations.promptCollections}</span>
                <ArrowRightIcon className="h-5 w-5 text-slate-500 transition-all duration-200 group-hover:text-slate-700 group-hover:translate-x-0.5" />
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
