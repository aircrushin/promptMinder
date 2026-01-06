"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";

const MotionDiv = dynamic(
  () => import("framer-motion").then((mod) => mod.motion.div),
  {
    loading: () => <div />,
    ssr: false,
  }
);
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { TypeAnimation } from "react-type-animation";
import { BoltIcon, GlobeAltIcon, ShieldCheckIcon, ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
import ShinyText from "../texts/ShinyText";
import { GitHubStars } from "../ui/github-stars";
import { ParticleButton } from "../ui/particle-button";

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
  const animatedText = Array.isArray(heroCopy.animatedText) && heroCopy.animatedText.length > 0
    ? heroCopy.animatedText
    : fallback.animatedText;
  const animationSignature = useMemo(
    () => animatedText.join("|"),
    [animatedText]
  );
  const animationSequence = useMemo(
    () => animatedText.flatMap((item) => [item, 2200]),
    [animationSignature]
  );

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
    <section className="relative flex min-h-[calc(100vh-4rem)] items-center overflow-hidden bg-slate-50/50">
      {/* Dynamic background with mesh gradients */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-blue-400 opacity-20 blur-[100px]" />
        <div className="absolute right-0 top-0 -z-10 h-[500px] w-[500px] bg-purple-500/10 blur-[120px]" />
        <div className="absolute bottom-0 left-0 -z-10 h-[500px] w-[500px] bg-indigo-500/10 blur-[120px]" />
      </div>

      <div className="relative mx-auto w-full max-w-6xl px-6 py-16 sm:px-10 lg:py-20">
        {/* Advertisement Banner */}
        <MotionDiv
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex justify-center mb-10"
        >
          <Link
            href="https://julebu.co/aff/RQH6MRYL"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative inline-flex items-center gap-2.5 rounded-full border-2 border-purple-200/60 bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 px-5 py-2.5 text-sm shadow-lg shadow-purple-200/50 backdrop-blur-sm transition-all duration-300 hover:border-purple-300 hover:shadow-xl hover:shadow-purple-300/50 hover:scale-105 hover:-translate-y-0.5 min-w-fit whitespace-nowrap"
          >
            <span className="absolute -top-3 -right-3 inline-flex items-center justify-center bg-gradient-to-r from-red-500 to-pink-500 px-2 py-1 text-[9px] font-extrabold text-white shadow-lg transform -rotate-6 skew-x-6 border-2 border-white/30">
              <span className="transform rotate-6 skew-x-0">{advertisement.specialOffer}</span>
              {/* Coupon notch effect */}
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-1 bg-white"></div>
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-1 bg-white"></div>
            </span>
            
            {/* Animated gradient overlay */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-400/0 via-purple-400/10 to-purple-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            {/* Content */}
            <span className="relative text-sm font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">{advertisement.brand}</span>
            <span className="relative text-sm font-medium text-slate-700">{advertisement.description}</span>
            <ArrowTopRightOnSquareIcon className="relative h-4 w-4 text-purple-500 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-purple-600 group-hover:scale-110" />
          </Link>
        </MotionDiv>

        <div className="grid gap-16 lg:grid-cols-12 lg:items-center">
          <MotionDiv
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="space-y-10 lg:col-span-6"
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-50/50 px-4 py-2 text-sm font-medium text-indigo-600 shadow-sm backdrop-blur-sm transition-colors hover:bg-indigo-100/50">
              <span>{heroCopy.subtitleStart}</span>
              <TypeAnimation
                key={animationSignature}
                sequence={animationSequence}
                wrapper="span"
                speed={44}
                className="font-bold text-indigo-600"
                repeat={Infinity}
              />
              <span>{heroCopy.subtitleEnd}</span>
            </div>

            {/* Main Title */}
            <h1 className="text-balance text-5xl font-extrabold leading-[1.1] tracking-tight text-slate-900 sm:text-6xl lg:text-7xl lg:leading-[1.1]">
              <ShinyText
                text={heroCopy.mainTitle}
                speed={3}
                className="text-transparent bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 [-webkit-background-clip:text] [background-clip:text] drop-shadow-sm"
              />
            </h1>

            {/* Description */}
            <p className="max-w-2xl text-lg leading-relaxed text-slate-600 sm:text-xl">
              {heroCopy.description}
            </p>

            {/* Buttons */}
            <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:gap-5">
              <ParticleButton
                onClick={() => router.push(isSignedIn ? "/prompts" : "/sign-up")}
                className="group relative inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-slate-900 px-8 text-lg font-semibold text-white shadow-xl shadow-slate-900/20 transition-all hover:bg-slate-800 hover:shadow-2xl hover:shadow-slate-900/30"
               >
                {heroCopy.ctaButton}
              </ParticleButton>
              <Link
                href="/public"
                className="inline-flex h-14 items-center justify-center rounded-2xl border border-slate-200 bg-white px-8 text-lg font-semibold text-slate-900 shadow-sm transition-all hover:bg-slate-50 hover:border-slate-300"
               >
                {heroCopy.secondaryCta}
              </Link>
            </div>

            {/* Stats/Social Proof */}
            <div className="flex flex-wrap items-center gap-8 pt-4">
              <GitHubStars className="rounded-full border border-slate-200 bg-white/60 px-4 py-2 shadow-sm backdrop-blur transition-colors hover:bg-white/80" />
              <div className="flex items-center gap-8 border-l border-slate-200 pl-8">
                {stats.map((stat) => (
                  <div key={stat.label} className="flex flex-col">
                    <span className="text-2xl font-bold text-slate-900">{stat.value}</span>
                    <span className="text-xs font-medium uppercase tracking-wider text-slate-500">{stat.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </MotionDiv>

          {/* Right Side Visuals */}
          <MotionDiv
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
            className="relative lg:col-span-6 perspective-[2000px]"
          >
            <div className="relative mx-auto max-w-lg transform-style-3d rotate-y-[-6deg] rotate-x-[6deg]">
              {/* Glow effects behind cards */}
              <div className="absolute -top-20 -right-20 h-[400px] w-[400px] rounded-full bg-indigo-500/10 blur-[100px]" />
              <div className="absolute -bottom-20 -left-20 h-[400px] w-[400px] rounded-full bg-blue-500/10 blur-[100px]" />

              {/* Main Card */}
              <MotionDiv
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="relative z-10 overflow-hidden rounded-[2rem] border border-white/40 bg-white/60 p-8 shadow-2xl shadow-indigo-500/10 backdrop-blur-xl"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-white/10" />
                <div className="relative">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-6">
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
                    {quickHighlights.map(({ title, description, Icon }) => (
                      <div key={title} className="group flex items-start gap-4 rounded-2xl bg-white p-4 shadow-sm transition-all hover:shadow-md hover:scale-[1.02]">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
                          <Icon className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900">{title}</h3>
                          <p className="text-sm text-slate-500">{description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </MotionDiv>

              {/* Floating Card */}
              <MotionDiv
                initial={{ x: 40, y: 40, opacity: 0 }}
                animate={{ x: -20, y: 20, opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.8 }}
                className="absolute -bottom-12 -right-12 z-20 w-80 rounded-[2rem] border border-white/40 bg-white/80 p-6 shadow-2xl shadow-slate-900/10 backdrop-blur-xl"
              >
                 <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{snapshot.badge}</span>
                    <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-[10px] font-bold text-indigo-600">{snapshot.status}</span>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="rounded-xl bg-slate-900 p-4 text-white shadow-lg">
                       <div className="flex items-center gap-2 opacity-50 mb-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-white"/>
                          <span className="text-[10px] font-medium uppercase tracking-wider">{snapshot.promptLabel}</span>
                       </div>
                       <p className="font-medium leading-snug">&ldquo;{snapshot.promptText}&rdquo;</p>
                    </div>
                    
                    <div className="flex gap-3">
                      <div className="flex-1 rounded-xl bg-white p-3 shadow-sm border border-slate-100">
                         <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">{snapshot.approvalLabel}</p>
                         <p className="font-bold text-slate-900 text-sm">{snapshot.approvalValue}</p>
                      </div>
                      <div className="flex-1 rounded-xl bg-white p-3 shadow-sm border border-slate-100">
                         <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">{snapshot.experimentsLabel}</p>
                         <p className="font-bold text-slate-900 text-sm">{snapshot.experimentsValue}</p>
                      </div>
                    </div>
                  </div>
              </MotionDiv>
            </div>
          </MotionDiv>
        </div>
      </div>
    </section>
  );
}
