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
import { useAuth } from "@clerk/nextjs";
import { TypeAnimation } from "react-type-animation";
import { BoltIcon, GlobeAltIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";
import ShinyText from "../texts/ShinyText";
import { GitHubStars } from "../ui/github-stars";

const HeroGrid = () => (
  <svg
    aria-hidden="true"
    className="absolute inset-0 h-full w-full text-white/10"
    viewBox="0 0 400 400"
    preserveAspectRatio="none"
  >
    <defs>
      <pattern
        id="hero-grid-pattern"
        width="40"
        height="40"
        patternUnits="userSpaceOnUse"
      >
        <path
          d="M 40 0 L 0 0 0 40"
          fill="none"
          stroke="currentColor"
          strokeWidth=".35"
        />
      </pattern>
    </defs>
    <rect width="400" height="400" fill="url(#hero-grid-pattern)" />
  </svg>
);

const OrbitLines = () => (
  <svg
    aria-hidden="true"
    className="hidden lg:block absolute -right-28 top-10 h-80 w-80 text-white/25"
    viewBox="0 0 200 200"
  >
    <circle cx="100" cy="100" r="70" fill="none" stroke="currentColor" strokeWidth=".6" />
    <circle cx="100" cy="100" r="50" fill="none" stroke="currentColor" strokeWidth=".6" strokeDasharray="6 8" />
    <circle cx="100" cy="100" r="30" fill="none" stroke="currentColor" strokeWidth=".6" opacity=".8" />
    <circle cx="145" cy="55" r="6" fill="currentColor" opacity=".4" />
    <circle cx="58" cy="140" r="4" fill="currentColor" opacity=".6" />
    <circle cx="130" cy="150" r="3" fill="currentColor" opacity=".85" />
  </svg>
);

export function HeroSection({ t }) {
  const { isSignedIn } = useAuth();

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

  return (
    <section className="relative isolate flex min-h-[calc(100vh-4rem)] items-center overflow-hidden bg-black text-white">
      <HeroGrid />
      <OrbitLines />
      <div className="pointer-events-none absolute left-1/2 top-10 h-64 w-64 -translate-x-1/2 rounded-full border border-white/5" />
      <div className="relative z-10 mx-auto w-full max-w-6xl px-6 py-16 sm:px-10 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
          <MotionDiv
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="space-y-8"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-xs uppercase tracking-[0.4em] text-white/70">
              <span>{heroCopy.subtitleStart}</span>
              <TypeAnimation
                key={animationSignature}
                sequence={animationSequence}
                wrapper="span"
                speed={46}
                className="font-semibold text-white"
                repeat={Infinity}
              />
              <span>{heroCopy.subtitleEnd}</span>
            </div>

            <div className="space-y-4 text-balance">
              <p className="text-sm font-mono uppercase text-white/50">Prompt Minder</p>
              <h1 className="text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
                <ShinyText
                  text={heroCopy.mainTitle}
                  speed={2.4}
                  className="text-white"
                />
              </h1>
            </div>

            <p className="max-w-2xl text-lg leading-relaxed text-white/70 sm:text-xl">
              {heroCopy.description}
            </p>

            <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:gap-4">
              <Link
                href={isSignedIn ? "/prompts" : "/sign-up"}
                className="inline-flex items-center justify-center rounded-full bg-white px-8 py-4 text-lg font-medium text-black transition-all hover:-translate-y-0.5 hover:bg-neutral-100"
              >
                {heroCopy.ctaButton}
              </Link>
              <Link
                href="/public"
                className="inline-flex items-center justify-center rounded-full border border-white/30 px-8 py-4 text-lg font-medium text-white transition-all hover:-translate-y-0.5 hover:border-white/60"
              >
                {heroCopy.secondaryCta}
              </Link>
            </div>

            <div className="flex flex-col gap-6 text-sm text-white/70">
              <GitHubStars className="inline-flex w-max items-center rounded-full border border-white/20 px-4 py-2 font-medium text-white/80" />
              <div className="grid gap-6 sm:grid-cols-3">
                {stats.map((stat) => (
                  <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-5 text-left backdrop-blur">
                    <p className="text-2xl font-semibold text-white">{stat.value}</p>
                    <p className="mt-1 text-xs uppercase tracking-wide text-white/50">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </MotionDiv>

          <MotionDiv
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.1, ease: "easeOut" }}
            className="relative"
          >
            <div className="relative mx-auto w-full max-w-xl space-y-6">
              <MotionDiv
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.25 }}
                className="rounded-3xl border border-white/15 bg-white/5 p-8 shadow-[0_60px_120px_rgba(0,0,0,0.35)] backdrop-blur"
              >
                <div className="text-sm uppercase tracking-[0.35em] text-white/50">Highlights</div>
                <div className="mt-6 space-y-5 text-left">
                  {quickHighlights.map(({ title, description, Icon }) => (
                    <div key={title} className="flex items-start gap-4 border-t border-white/10 pt-5 first:border-t-0 first:pt-0">
                      <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-full border border-white/30">
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-base font-semibold text-white">{title}</p>
                        <p className="text-sm text-white/60">{description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </MotionDiv>

              <MotionDiv
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.45 }}
                className="rounded-3xl border border-white/10 bg-white text-black p-6 shadow-[0_40px_80px_rgba(0,0,0,0.45)]"
              >
                <div className="mb-5 flex items-center justify-between text-xs uppercase tracking-[0.3em] text-neutral-500">
                  <span>{snapshot.badge}</span>
                  <span className="rounded-full border border-neutral-300 px-3 py-1 text-[0.7rem] font-semibold text-neutral-900">
                    {snapshot.status}
                  </span>
                </div>
                <div className="space-y-4 text-left">
                  <div className="rounded-2xl border border-black/10 bg-black text-white p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-white/60">{snapshot.promptLabel}</p>
                    <p className="mt-2 text-lg font-semibold leading-snug">&ldquo;{snapshot.promptText}&rdquo;</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-black/10 bg-white p-4">
                      <p className="text-xs uppercase tracking-wide text-neutral-500">{snapshot.approvalLabel}</p>
                      <p className="mt-2 text-base font-semibold text-neutral-900">{snapshot.approvalValue}</p>
                    </div>
                    <div className="rounded-2xl border border-black/10 bg-white p-4">
                      <p className="text-xs uppercase tracking-wide text-neutral-500">{snapshot.experimentsLabel}</p>
                      <p className="mt-2 text-base font-semibold text-neutral-900">{snapshot.experimentsValue}</p>
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
