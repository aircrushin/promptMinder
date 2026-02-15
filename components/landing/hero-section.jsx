"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { motion } from "framer-motion";

/* ─── animation variants ─── */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.15 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.4, 0.25, 1] },
  },
};

/* subtle infinite float for decorative cards */
const floatAnimation = (delay = 0) => ({
  y: [0, -8, 0],
  transition: {
    duration: 4,
    repeat: Infinity,
    repeatType: "mirror",
    ease: "easeInOut",
    delay,
  },
});

/* entrance for each floating card */
const cardEntrance = (x, y, rotate, delay) => ({
  hidden: { opacity: 0, x, y, rotate: 0, scale: 0.92 },
  visible: {
    opacity: 1,
    x: 0,
    y: 0,
    rotate,
    scale: 1,
    transition: { duration: 0.8, delay, ease: [0.25, 0.4, 0.25, 1] },
  },
});

export function HeroSection({ t }) {
  const { isSignedIn } = useAuth();
  const router = useRouter();

  /* ─── fallback copy ─── */
  const fallback = {
    mainTitle: "Make AI Prompt Management Simpler",
    headingLine1: "Create, version, and share",
    headingLine2: "your AI prompts",
    description:
      "An open-source platform for managing, versioning, and collaborating on AI prompts. Built for teams and individuals alike.",
    ctaButton: "Get Started for Free",
    ctaButtonLoggedIn: "Go to Console",
    secondaryCta: "Browse Collections",
    trustText: "2,300+ teams trust PromptMinder",
    trustBadges: {
      openSource: "Open Source",
      secure: "Secure",
      teamReady: "Team Ready",
    },
  };

  const heroCopy = { ...fallback, ...(t || {}) };

  return (
    <section className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden bg-slate-50/50">
      {/* dot grid background */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:32px_32px]" />

      {/* ─── center content ─── */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 flex flex-col items-center px-6 py-24 text-center"
      >
        {/* small logo icon */}
        <motion.div
          variants={itemVariants}
          className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-md"
        >
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-blue-500"
          >
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </motion.div>

        {/* two-line heading */}
        <motion.h1
          variants={itemVariants}
          className="max-w-2xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl"
        >
          <span className="block text-gray-900">
            {heroCopy.headingLine1 || fallback.headingLine1}
          </span>
          <span className="block font-medium text-gray-400">
            {heroCopy.headingLine2 || fallback.headingLine2}
          </span>
        </motion.h1>

        {/* subtitle */}
        <motion.p
          variants={itemVariants}
          className="mt-5 max-w-lg text-base leading-relaxed text-gray-500 sm:text-lg"
        >
          {heroCopy.description}
        </motion.p>

        {/* CTA button */}
        <motion.div variants={itemVariants} className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
          <button
            onClick={() => router.push(isSignedIn ? "/prompts" : "/sign-up")}
            className="inline-flex h-12 items-center justify-center rounded-lg bg-blue-500 px-8 text-base font-semibold text-white shadow-lg shadow-blue-500/25 transition-all duration-200 hover:bg-blue-600 hover:shadow-xl hover:shadow-blue-600/30 hover:-translate-y-0.5 active:translate-y-0"
          >
            {isSignedIn
              ? heroCopy.ctaButtonLoggedIn || fallback.ctaButtonLoggedIn
              : heroCopy.ctaButton || fallback.ctaButton}
          </button>
          <Link
            href="/public"
            className="inline-flex h-12 items-center justify-center rounded-lg border border-gray-300 bg-white px-8 text-base font-semibold text-gray-700 transition-all duration-200 hover:border-gray-400 hover:text-gray-900 hover:-translate-y-0.5 active:translate-y-0"
          >
            {heroCopy.secondaryCta || fallback.secondaryCta}
          </Link>
        </motion.div>

        {/* trust badges — in flow below CTA */}
        <motion.div
          variants={itemVariants}
          className="mt-8 flex flex-col items-center gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {/* real team logos */}
              {/* Google */}
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white ring-2 ring-white shadow-sm">
                <svg width="16" height="16" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              </div>
              {/* Notion */}
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white ring-2 ring-white shadow-sm">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#000"><path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L18.29 2.21c-.42-.326-.98-.7-2.055-.607L3.01 2.72c-.466.046-.56.28-.374.466l1.823 1.022zm.793 3.358v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.84-.046.933-.56.933-1.167V6.63c0-.606-.233-.933-.746-.886l-15.177.886c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.886l-.7.14v10.264c-.606.327-1.166.514-1.633.514-.746 0-.933-.234-1.493-.933l-4.571-7.177v6.944l1.446.327s0 .84-1.166.84l-3.218.187c-.093-.187 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.451-.233 4.758 7.27V9.481l-1.213-.14c-.094-.514.28-.886.747-.933l3.218-.187z"/></svg>
              </div>
              {/* Slack */}
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white ring-2 ring-white shadow-sm">
                <svg width="14" height="14" viewBox="0 0 24 24"><path d="M5.042 15.165a2.528 2.528 0 01-2.52 2.523A2.528 2.528 0 010 15.165a2.527 2.527 0 012.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 012.521-2.52 2.527 2.527 0 012.521 2.52v6.313A2.528 2.528 0 018.834 24a2.528 2.528 0 01-2.521-2.522v-6.313z" fill="#E01E5A"/><path d="M8.834 5.042a2.528 2.528 0 01-2.521-2.52A2.528 2.528 0 018.834 0a2.528 2.528 0 012.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 012.521 2.521 2.528 2.528 0 01-2.521 2.521H2.522A2.528 2.528 0 010 8.834a2.528 2.528 0 012.522-2.521h6.312z" fill="#36C5F0"/><path d="M18.956 8.834a2.528 2.528 0 012.522-2.521A2.528 2.528 0 0124 8.834a2.528 2.528 0 01-2.522 2.521h-2.522V8.834zm-1.271 0a2.528 2.528 0 01-2.521 2.521 2.528 2.528 0 01-2.521-2.521V2.522A2.528 2.528 0 0115.164 0a2.528 2.528 0 012.521 2.522v6.312z" fill="#2EB67D"/><path d="M15.164 18.956a2.528 2.528 0 012.521 2.522A2.528 2.528 0 0115.164 24a2.528 2.528 0 01-2.521-2.522v-2.522h2.521zm0-1.271a2.528 2.528 0 01-2.521-2.521 2.528 2.528 0 012.521-2.521h6.314A2.528 2.528 0 0124 15.164a2.528 2.528 0 01-2.522 2.521h-6.314z" fill="#ECB22E"/></svg>
              </div>
              {/* Figma */}
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white ring-2 ring-white shadow-sm">
                <svg width="12" height="16" viewBox="0 0 38 57"><path d="M19 28.5a9.5 9.5 0 119.5 9.5A9.5 9.5 0 0119 28.5z" fill="#1ABCFE"/><path d="M0 47.5A9.5 9.5 0 019.5 38H19v9.5a9.5 9.5 0 11-19 0z" fill="#0ACF83"/><path d="M19 0v19h9.5a9.5 9.5 0 000-19H19z" fill="#FF7262"/><path d="M0 9.5A9.5 9.5 0 009.5 19H19V0H9.5A9.5 9.5 0 000 9.5z" fill="#F24E1E"/><path d="M0 28.5A9.5 9.5 0 009.5 38H19V19H9.5A9.5 9.5 0 000 28.5z" fill="#A259FF"/></svg>
              </div>
              {/* Vercel */}
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white ring-2 ring-white shadow-sm">
                <svg width="14" height="12" viewBox="0 0 76 65" fill="#000"><path d="M37.5274 0L75.0548 65H0L37.5274 0Z"/></svg>
              </div>
            </div>
            <span className="text-sm text-gray-500">{heroCopy.trustText || fallback.trustText}</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-500 shadow-sm">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              {heroCopy.trustBadges?.openSource || fallback.trustBadges.openSource}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-500 shadow-sm">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              {heroCopy.trustBadges?.secure || fallback.trustBadges.secure}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-500 shadow-sm">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-500"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              {heroCopy.trustBadges?.teamReady || fallback.trustBadges.teamReady}
            </span>
          </div>
        </motion.div>
      </motion.div>

      {/* ─── floating decorative cards (hidden on mobile) ─── */}

      {/* ── Sparkle dots — scattered decorative dots ── */}
      <div className="pointer-events-none absolute inset-0 hidden lg:block">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} transition={{ delay: 1 }} className="absolute left-[18%] top-[30%] h-2 w-2 rounded-full bg-blue-400" />
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.3 }} transition={{ delay: 1.2 }} className="absolute right-[20%] top-[38%] h-1.5 w-1.5 rounded-full bg-indigo-400" />
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.35 }} transition={{ delay: 1.4 }} className="absolute left-[30%] bottom-[22%] h-2 w-2 rounded-full bg-emerald-400" />
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.3 }} transition={{ delay: 1.1 }} className="absolute right-[28%] bottom-[28%] h-1.5 w-1.5 rounded-full bg-amber-400" />
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.25 }} transition={{ delay: 1.3 }} className="absolute left-[12%] bottom-[40%] h-1 w-1 rounded-full bg-rose-400" />
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.3 }} transition={{ delay: 1.5 }} className="absolute right-[14%] top-[22%] h-1 w-1 rounded-full bg-sky-400" />
      </div>

      {/* ── Sticky Note — top-left ── */}
      <motion.div
        variants={cardEntrance(-40, 30, -3, 0.4)}
        initial="hidden"
        animate="visible"
        className="absolute left-[4%] top-[12%] z-20 hidden w-60 lg:block xl:left-[8%]"
      >
        <motion.div animate={floatAnimation(0)}>
          <div className="relative rounded-2xl bg-amber-100 p-5 shadow-lg rotate-[-3deg]">
            {/* pushpin */}
            <span className="absolute -top-2 left-6 text-lg">📌</span>
            <p className="font-medium leading-snug text-amber-900/80" style={{ fontFamily: "'Georgia', serif" }}>
              &ldquo;Organize your prompts, track versions, and collaborate with your team effortlessly.&rdquo;
            </p>
          </div>
          {/* checkmark badge */}
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 1.2, type: "spring", stiffness: 400, damping: 15 }}
            className="absolute -bottom-3 -right-3 flex h-8 w-8 items-center justify-center rounded-full bg-green-500 text-sm text-white shadow-md"
          >
            ✓
          </motion.span>
        </motion.div>
      </motion.div>

      {/* ── Reminder Card — top-right ── */}
      <motion.div
        variants={cardEntrance(40, 30, 2, 0.55)}
        initial="hidden"
        animate="visible"
        className="absolute right-[4%] top-[10%] z-20 hidden w-56 lg:block xl:right-[8%]"
      >
        <motion.div animate={floatAnimation(0.6)}>
          <div className="rounded-2xl bg-white p-5 shadow-lg rotate-[2deg]">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-500">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Latest Version
              </span>
            </div>
            <p className="text-sm font-bold text-gray-900">v2.4 — Optimized prompt</p>
            <p className="mt-1 text-xs text-gray-400">Updated 2h ago</p>
          </div>
        </motion.div>
      </motion.div>

      {/* ── Tasks Card — bottom-left ── */}
      <motion.div
        variants={cardEntrance(-40, -20, 2, 0.7)}
        initial="hidden"
        animate="visible"
        className="absolute bottom-[10%] left-[3%] z-20 hidden w-64 lg:block xl:left-[6%]"
      >
        <motion.div animate={floatAnimation(1.2)}>
          <div className="rounded-2xl bg-white p-5 shadow-lg rotate-[2deg]">
            <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-400">
              Active Prompts
            </p>

            {/* prompt item 1 */}
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[11px] font-bold text-indigo-600">
                A
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">Blog writer v3</p>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                  <div className="h-full w-[78%] rounded-full bg-indigo-400" />
                </div>
              </div>
              <span className="text-[11px] font-medium text-gray-400">78%</span>
            </div>

            {/* prompt item 2 */}
            <div className="flex items-center gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[11px] font-bold text-emerald-600">
                B
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">Code reviewer</p>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                  <div className="h-full w-[54%] rounded-full bg-emerald-400" />
                </div>
              </div>
              <span className="text-[11px] font-medium text-gray-400">54%</span>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* ── Integrations Card — bottom-right ── */}
      <motion.div
        variants={cardEntrance(40, -20, -2, 0.85)}
        initial="hidden"
        animate="visible"
        className="absolute bottom-[8%] right-[3%] z-20 hidden w-56 lg:block xl:right-[7%]"
      >
        <motion.div animate={floatAnimation(1.8)}>
          <div className="rounded-2xl bg-white p-5 shadow-lg rotate-[-2deg]">
            <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-400">
              AI Models
            </p>
            <div className="flex items-center gap-3">
              {/* GPT */}
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 shadow-sm" title="GPT">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M22.282 9.821a5.985 5.985 0 00-.516-4.91 6.046 6.046 0 00-6.51-2.9A6.065 6.065 0 0011.708.2a6.046 6.046 0 00-5.764 4.162 5.985 5.985 0 00-4.006 2.903 6.046 6.046 0 00.749 7.091 5.985 5.985 0 00.516 4.911 6.046 6.046 0 006.51 2.9A6.065 6.065 0 0013.292 23.8a6.046 6.046 0 005.764-4.162 5.985 5.985 0 004.006-2.903 6.046 6.046 0 00-.749-7.091z" fill="#10a37f" fillOpacity="0.15" stroke="#10a37f" strokeWidth="1.2"/>
                </svg>
              </div>
              {/* Claude */}
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 shadow-sm" title="Claude">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="#d97706" fillOpacity="0.15" stroke="#d97706" strokeWidth="1.5"/>
                  <path d="M8 12h8M12 8v8" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              {/* Gemini */}
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 shadow-sm" title="Gemini">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L4 7v10l8 5 8-5V7l-8-5z" fill="#4285f4" fillOpacity="0.15" stroke="#4285f4" strokeWidth="1.5" strokeLinejoin="round"/>
                  <circle cx="12" cy="12" r="3" fill="#4285f4" fillOpacity="0.3" stroke="#4285f4" strokeWidth="1"/>
                </svg>
              </div>
              {/* More */}
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 text-xs font-bold text-gray-400 shadow-sm">
                +5
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* ── Diff/Version Card — middle-left edge ── */}
      <motion.div
        variants={cardEntrance(-30, 0, -1.5, 0.95)}
        initial="hidden"
        animate="visible"
        className="absolute left-[2%] top-[48%] z-20 hidden w-52 lg:block xl:left-[5%]"
      >
        <motion.div animate={floatAnimation(2.2)}>
          <div className="rounded-2xl bg-white p-4 shadow-lg rotate-[-1.5deg]">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">Diff Preview</p>
            <div className="space-y-1 rounded-lg bg-gray-50 p-3 font-mono text-[11px]">
              <p className="text-red-400 line-through">- Write a blog post about AI</p>
              <p className="text-emerald-500">+ Write a detailed, SEO-optimized blog post about AI trends in 2025</p>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* ── Tag Cloud — middle-right edge ── */}
      <motion.div
        variants={cardEntrance(30, 0, 1.5, 1.0)}
        initial="hidden"
        animate="visible"
        className="absolute right-[2%] top-[52%] z-20 hidden w-48 lg:block xl:right-[5%]"
      >
        <motion.div animate={floatAnimation(2.6)}>
          <div className="rounded-2xl bg-white p-4 shadow-lg rotate-[1.5deg]">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400">Tags</p>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: 'GPT-4', color: 'bg-emerald-50 text-emerald-600' },
                { label: 'Writing', color: 'bg-blue-50 text-blue-600' },
                { label: 'Code', color: 'bg-purple-50 text-purple-600' },
                { label: 'Marketing', color: 'bg-amber-50 text-amber-600' },
                { label: 'Research', color: 'bg-rose-50 text-rose-600' },
                { label: 'Chat', color: 'bg-sky-50 text-sky-600' },
              ].map((tag) => (
                <span key={tag.label} className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${tag.color}`}>
                  {tag.label}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
