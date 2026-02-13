// @ts-nocheck
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { BoltIcon, GlobeAltIcon, ShieldCheckIcon, ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
import { GitHubStars } from "../ui/github-stars";
import { ParticleButton } from "../ui/particle-button";
import { motion } from "framer-motion";

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

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.7,
      ease: [0.25, 0.4, 0.25, 1]
    }
  }
};

const floatingCardVariants = {
  hidden: { opacity: 0, x: 40, y: 20 },
  visible: {
    opacity: 1,
    x: 0,
    y: 0,
    transition: {
      duration: 0.8,
      delay: 0.4,
      ease: [0.25, 0.4, 0.25, 1]
    }
  }
};

export function HeroSection({ t }) {
  const { isSignedIn } = useAuth();
  const router = useRouter();

  const fallback = {
    mainTitle: "Make AI Prompt Management Simpler",
    subtitleStart: "An open-source prompt management platform built for ",
    animatedText: ["AI practitioners", "content creators", "developers", "researchers"],
    subtitleEnd: "",
    description:
      "Supports version control, team collaboration, smart categorization, and more. Streamline your workflow and unlock the full potential of your AI prompts.",
    ctaButton: "Get Started for Free",
    ctaButtonLoggedIn: "Go to Console",
    secondaryCta: "Explore prompt gallery",
    quickHighlights: [
      {
        title: "Version aware",
        description: "Branch, compare, and roll back prompts without fear.",
      },
      {
        title: "Collaborative",
        description: "Bring product, research, and ops into the same workspace.",
      },
      {
        title: "Secure by default",
        description: "Enterprise grade protection and audit trails built in.",
      },
    ],
    stats: [
      { label: "Teams onboarded", value: "2.3K+" },
      { label: "Prompts versioned", value: "68K" },
      { label: "Avg. time saved", value: "41%" },
    ],
    snapshot: {
      badge: "Workflow snapshot",
      status: "Live sync",
      promptLabel: "Prompt version #24",
      promptText: "Generate a launch plan for a multi-region rollout",
      approvalLabel: "Approval",
      approvalValue: "2 reviewers left feedback",
      experimentsLabel: "Experiments",
      experimentsValue: "92% success rate",
    },
    advertisement: {
      brand: "julebu",
      description: "An addictive English learning tool",
      specialOffer: "SPECIAL OFFER",
    },
  };

  const heroCopy = { ...fallback, ...(t || {}) };
  const displayText = Array.isArray(heroCopy.animatedText) && heroCopy.animatedText.length > 0
    ? heroCopy.animatedText[0]
    : fallback.animatedText[0];

  const highlightConfig = [
    { Icon: BoltIcon, defaults: fallback.quickHighlights[0] },
    { Icon: GlobeAltIcon, defaults: fallback.quickHighlights[1] },
    { Icon: ShieldCheckIcon, defaults: fallback.quickHighlights[2] },
  ];

  const quickHighlights = highlightConfig.map(({ Icon, defaults }, index) => {
    const source = heroCopy.quickHighlights?.[index] ?? {};
    return {
      Icon,
      title: source.title || defaults.title,
      description: source.description || defaults.description,
    };
  });

  const stats = (heroCopy.stats || fallback.stats).map((stat, index) => ({
    label: stat.label || fallback.stats[index]?.label || "",
    value: stat.value || fallback.stats[index]?.value || "",
  }));

  const snapshot = {
    badge: heroCopy.snapshot?.badge || fallback.snapshot.badge,
    status: heroCopy.snapshot?.status || fallback.snapshot.status,
    promptLabel: heroCopy.snapshot?.promptLabel || fallback.snapshot.promptLabel,
    promptText: heroCopy.snapshot?.promptText || fallback.snapshot.promptText,
    approvalLabel: heroCopy.snapshot?.approvalLabel || fallback.snapshot.approvalLabel,
    approvalValue: heroCopy.snapshot?.approvalValue || fallback.snapshot.approvalValue,
    experimentsLabel: heroCopy.snapshot?.experimentsLabel || fallback.snapshot.experimentsLabel,
    experimentsValue: heroCopy.snapshot?.experimentsValue || fallback.snapshot.experimentsValue,
  };

  const advertisement = {
    brand: heroCopy.advertisement?.brand || fallback.advertisement.brand,
    description: heroCopy.advertisement?.description || fallback.advertisement.description,
    specialOffer: heroCopy.advertisement?.specialOffer || fallback.advertisement.specialOffer,
  };

  return (
    <section className="relative flex min-h-[calc(100vh-2rem)] items-center overflow-hidden bg-slate-50/50 pt-28">
      {/* Animated background with mesh gradients */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:32px_32px]" />
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute left-1/4 top-1/4 -z-10 h-[400px] w-[400px] rounded-full bg-blue-400/20 blur-[120px]"
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5, delay: 0.2, ease: "easeOut" }}
          className="absolute right-0 top-0 -z-10 h-[600px] w-[600px] bg-purple-500/15 blur-[140px]"
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5, delay: 0.4, ease: "easeOut" }}
          className="absolute bottom-0 left-0 -z-10 h-[600px] w-[600px] bg-indigo-500/15 blur-[140px]"
        />
      </div>

      <div className="relative mx-auto w-full max-w-6xl px-6 py-12 sm:px-10 lg:py-16">
        {/* Advertisement Banner */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex justify-center mb-8"
        >
          <Link
            href="https://julebu.co/aff/RQH6MRYL"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative inline-flex items-center gap-2.5 rounded-full border border-purple-200/80 bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 px-5 py-2.5 text-sm shadow-lg shadow-purple-200/50 backdrop-blur-sm transition-all duration-300 hover:border-purple-300 hover:shadow-xl hover:shadow-purple-300/50 hover:scale-[1.02] hover:-translate-y-0.5"
          >
            <span className="absolute -top-3 -right-3 inline-flex items-center justify-center bg-gradient-to-r from-red-500 to-pink-500 px-2 py-1 text-[9px] font-extrabold text-white shadow-lg transform -rotate-6 skew-x-6 border-2 border-white/30 transition-transform duration-300 group-hover:scale-105">
              <span className="transform rotate-6 skew-x-0">{advertisement.specialOffer}</span>
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-1 bg-white"></div>
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-1 bg-white"></div>
            </span>
            
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-400/0 via-purple-400/10 to-purple-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <span className="relative text-sm font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">{advertisement.brand}</span>
            <span className="relative text-sm font-medium text-slate-700">{advertisement.description}</span>
            <ArrowTopRightOnSquareIcon className="relative h-4 w-4 text-purple-500 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-purple-600 group-hover:scale-110" />
          </Link>
        </motion.div>

        <div className="grid gap-16 lg:grid-cols-12 lg:items-center">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8 lg:col-span-6"
          >
            {/* Badge */}
            <motion.div 
              variants={itemVariants}
              className="inline-flex items-center gap-2 rounded-full border border-indigo-200/50 bg-indigo-50/60 px-4 py-2 text-sm font-medium text-indigo-700 shadow-sm backdrop-blur-sm transition-all duration-200 hover:bg-indigo-100/60 hover:shadow-md cursor-default"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
              <span>{heroCopy.subtitleStart}</span>
              <span className="font-bold text-indigo-700">{displayText}</span>
              <span>{heroCopy.subtitleEnd}</span>
            </motion.div>

            {/* Main Title */}
            <motion.h1 
              variants={itemVariants}
              className="text-balance text-5xl font-extrabold leading-[1.1] tracking-tight text-slate-900 sm:text-6xl lg:text-7xl lg:leading-[1.1]"
            >
              <span className="bg-gradient-to-br from-slate-900 via-indigo-800 to-slate-900 bg-clip-text text-transparent">
                {heroCopy.mainTitle}
              </span>
            </motion.h1>

            {/* Description */}
            <motion.p 
              variants={itemVariants}
              className="max-w-2xl text-lg leading-relaxed text-slate-600 sm:text-xl"
            >
              {heroCopy.description}
            </motion.p>

            {/* Buttons */}
            <motion.div 
              variants={itemVariants}
              className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:gap-5"
            >
              <ParticleButton
                onClick={() => router.push(isSignedIn ? "/prompts" : "/sign-up")}
                className="group relative inline-flex h-14 items-center justify-center gap-2 overflow-hidden rounded-2xl bg-slate-900 px-8 text-lg font-semibold text-white shadow-xl shadow-slate-900/20 transition-all duration-300 hover:shadow-2xl hover:shadow-slate-900/30 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
              >
                <span className="relative z-10">{isSignedIn ? (heroCopy.ctaButtonLoggedIn || heroCopy.ctaButton) : heroCopy.ctaButton}</span>
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-slate-800 to-slate-700 transition-transform duration-300 group-hover:translate-x-0" />
              </ParticleButton>
              <Link
                href="/public"
                className="group relative inline-flex h-14 items-center justify-center gap-2 overflow-hidden rounded-2xl border border-slate-200 bg-white px-8 text-lg font-semibold text-slate-900 shadow-sm transition-all duration-300 hover:bg-slate-50 hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
              >
                <span className="relative z-10">{heroCopy.secondaryCta}</span>
                <ArrowTopRightOnSquareIcon className="h-5 w-5 text-slate-500 transition-all duration-200 group-hover:text-slate-700 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </motion.div>

            {/* Stats/Social Proof */}
            <motion.div 
              variants={itemVariants}
              className="flex flex-wrap items-center gap-6 pt-4"
            >
              <GitHubStars className="rounded-xl border border-slate-200 bg-white/70 px-4 py-2 shadow-sm backdrop-blur-sm transition-all duration-200 hover:bg-white/90 hover:shadow-md" />
              <div className="flex items-center gap-8 border-l border-slate-200 pl-8">
                {stats.map((stat, index) => (
                  <motion.div 
                    key={stat.label} 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 + index * 0.1, duration: 0.5 }}
                    className="flex flex-col"
                  >
                    <span className="text-2xl font-bold text-slate-900">{stat.value}</span>
                    <span className="text-xs font-medium uppercase tracking-wider text-slate-500">{stat.label}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>

          {/* Right Side Visuals */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            className="relative lg:col-span-6"
          >
            <div className="relative mx-auto max-w-lg">
              {/* Glow effects behind cards */}
              <div className="absolute -top-20 -right-20 h-[400px] w-[400px] rounded-full bg-indigo-500/15 blur-[100px]" />
              <div className="absolute -bottom-20 -left-20 h-[400px] w-[400px] rounded-full bg-blue-500/15 blur-[100px]" />

              {/* Main Card */}
              <motion.div 
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                className="relative z-10 overflow-hidden rounded-3xl border border-white/60 bg-white/70 p-8 shadow-2xl shadow-indigo-500/10 backdrop-blur-xl transition-all duration-300 hover:shadow-indigo-500/15"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-white/40 to-transparent" />
                <div className="relative">
                  <div className="flex items-center justify-between border-b border-slate-100/80 pb-6">
                    <span className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">Prompt Minder</span>
                    <span className="flex items-center gap-1.5 rounded-full bg-green-500/10 px-3 py-1 text-[11px] font-bold text-green-600">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                      </span>
                      LIVE
                    </span>
                  </div>
                  <div className="mt-6 space-y-4">
                    {quickHighlights.map(({ title, description, Icon }, index) => (
                      <motion.div 
                        key={title} 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 + index * 0.1, duration: 0.5 }}
                        className="group flex items-start gap-4 rounded-2xl bg-white/80 p-4 shadow-sm border border-slate-100/50 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/10 hover:scale-[1.02] hover:bg-white cursor-pointer"
                      >
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition-all duration-300 group-hover:bg-indigo-600 group-hover:text-white group-hover:shadow-lg group-hover:shadow-indigo-500/25 group-hover:scale-105">
                          <Icon className="h-6 w-6 transition-transform duration-300 group-hover:scale-110" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900">{title}</h3>
                          <p className="text-sm text-slate-500">{description}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Floating Card */}
              <motion.div 
                variants={floatingCardVariants}
                initial="hidden"
                animate="visible"
                className="absolute -bottom-12 -right-12 z-20 w-80 rounded-3xl border border-white/60 bg-white/85 p-6 shadow-2xl shadow-slate-900/10 backdrop-blur-xl transition-all duration-300 hover:shadow-xl hover:shadow-slate-900/15 hover:scale-[1.02]"
              >
                 <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{snapshot.badge}</span>
                    <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-[10px] font-bold text-indigo-600">{snapshot.status}</span>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="rounded-xl bg-slate-900 p-4 text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:shadow-slate-900/20 hover:scale-[1.02]">
                       <div className="flex items-center gap-2 opacity-50 mb-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-white"/>
                          <span className="text-[10px] font-medium uppercase tracking-wider">{snapshot.promptLabel}</span>
                       </div>
                       <p className="font-medium leading-snug">&ldquo;{snapshot.promptText}&rdquo;</p>
                    </div>
                    
                    <div className="flex gap-3">
                      <motion.div 
                        whileHover={{ scale: 1.03, y: -2 }}
                        transition={{ duration: 0.2 }}
                        className="flex-1 rounded-xl bg-white p-3 shadow-sm border border-slate-100 transition-all duration-200 hover:shadow-md cursor-pointer"
                      >
                         <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">{snapshot.approvalLabel}</p>
                         <p className="font-bold text-slate-900 text-sm">{snapshot.approvalValue}</p>
                      </motion.div>
                      <motion.div 
                        whileHover={{ scale: 1.03, y: -2 }}
                        transition={{ duration: 0.2 }}
                        className="flex-1 rounded-xl bg-white p-3 shadow-sm border border-slate-100 transition-all duration-200 hover:shadow-md cursor-pointer"
                      >
                         <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">{snapshot.experimentsLabel}</p>
                         <p className="font-bold text-slate-900 text-sm">{snapshot.experimentsValue}</p>
                      </motion.div>
                    </div>
                  </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
