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
      </motion.div>

      {/* ─── floating decorative cards (hidden on mobile) ─── */}

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
    </section>
  );
}
