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
    <section className="relative flex min-h-[calc(100vh-4rem)] items-center overflow-hidden bg-gradient-to-br from-white to-slate-50">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        <div className="absolute -left-12 top-28 h-52 w-52 rounded-full bg-black/5 blur-[120px]" />
        <div className="absolute right-4 top-12 h-64 w-64 rounded-full bg-black/5 blur-[140px]" />
        <div className="absolute left-1/2 bottom-6 h-64 w-[28rem] -translate-x-1/2 rounded-full bg-gradient-to-r from-[rgba(0,0,0,0.07)] via-[rgba(0,0,0,0.03)] to-transparent blur-[160px]" />
      </div>
      <div className="relative mx-auto w-full max-w-6xl px-6 py-10 sm:px-10 lg:py-12">
        <div className="grid gap-12 lg:grid-cols-12 lg:items-center lg:gap-16">
          <MotionDiv
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="space-y-8 lg:col-span-6"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white/80 px-4 py-2 text-sm font-medium text-primary shadow-sm backdrop-blur">
              <span>{heroCopy.subtitleStart}</span>
              <TypeAnimation
                key={animationSignature}
                sequence={animationSequence}
                wrapper="span"
                speed={44}
                className="font-semibold text-primary"
                repeat={Infinity}
              />
              <span>{heroCopy.subtitleEnd}</span>
            </div>

            <h1 className="text-balance text-5xl font-extrabold leading-tight text-slate-900 sm:text-6xl">
              <ShinyText
                text={heroCopy.mainTitle}
                speed={3}
                className="text-transparent bg-gradient-to-r from-slate-900 via-slate-800 to-slate-500 [-webkit-background-clip:text] [background-clip:text]"
              />
            </h1>

            <p className="max-w-2xl text-lg leading-relaxed text-slate-600 sm:text-xl">
              {heroCopy.description}
            </p>

            <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:gap-5">
              <Link
                href={isSignedIn ? "/prompts" : "/sign-up"}
                className="inline-flex items-center justify-center rounded-xl bg-primary px-8 py-4 text-lg font-semibold text-primary-foreground shadow-[0_22px_70px_-42px_rgba(0,0,0,0.55)] transition-all hover:-translate-y-0.5 hover:shadow-[0_24px_90px_-40px_rgba(0,0,0,0.6)]"
               >
                {heroCopy.ctaButton}
              </Link>
              <Link
                href="/public"
                className="inline-flex items-center justify-center rounded-xl border border-border bg-white/70 px-8 py-4 text-lg font-semibold text-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-[0_16px_60px_-46px_rgba(0,0,0,0.45)]"
               >
                {heroCopy.secondaryCta}
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
              <GitHubStars className="rounded-full border border-border bg-white/80 px-4 py-2 shadow-sm backdrop-blur" />
              <div className="flex flex-wrap items-center gap-6 rounded-2xl border border-border bg-white/70 px-5 py-4 shadow-sm backdrop-blur">
                {stats.map((stat) => (
                  <div key={stat.label} className="flex flex-col text-left">
                    <span className="text-lg font-semibold text-slate-900">{stat.value}</span>
                    <span className="text-xs uppercase tracking-wide text-muted-foreground">{stat.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </MotionDiv>

          <MotionDiv
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.1, ease: "easeOut" }}
            className="relative lg:col-span-6"
          >
            <div className="relative mx-auto max-w-lg space-y-5">
              <div className="absolute -top-10 -left-10 h-40 w-40 rounded-full bg-gradient-to-br from-black/10 via-transparent to-transparent blur-3xl" />
              <div className="absolute -bottom-12 -right-14 h-52 w-52 rounded-full bg-black/10 blur-[120px]" />

              <MotionDiv
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.25 }}
                className="relative overflow-hidden rounded-3xl border border-border bg-white/80 p-8 shadow-[0_30px_90px_-60px_rgba(0,0,0,0.4)] backdrop-blur"
              >
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.26em] text-primary">
                  <span>Prompt Minder</span>
                  <span className="rounded-full bg-foreground/10 px-3 py-1 text-[11px] font-semibold text-foreground">Live</span>
                </div>
                <div className="mt-6 space-y-4 text-left">
                  {quickHighlights.map(({ title, description, Icon }) => (
                    <div key={title} className="flex items-start gap-4 rounded-2xl border border-border bg-white/70 p-3 shadow-sm">
                      <div className="mt-1 flex h-11 w-11 items-center justify-center rounded-2xl bg-foreground/5">
                        <Icon className="h-5 w-5 text-foreground" />
                      </div>
                      <div>
                        <p className="text-base font-semibold text-slate-900">{title}</p>
                        <p className="text-sm text-slate-600">{description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </MotionDiv>

              <MotionDiv
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.45 }}
                className="rounded-3xl border border-border bg-gradient-to-br from-white via-slate-50 to-white p-6 shadow-[0_28px_80px_-56px_rgba(0,0,0,0.35)] backdrop-blur"
              >
                <div className="mb-6 flex items-center justify-between">
                  <span className="text-sm font-medium uppercase tracking-wide text-muted-foreground">{snapshot.badge}</span>
                  <span className="rounded-full bg-foreground/10 px-3 py-1 text-xs font-semibold text-foreground">{snapshot.status}</span>
                </div>
                <div className="space-y-4">
                  <div className="rounded-2xl border border-border bg-gradient-to-r from-slate-900 via-slate-800 to-slate-600 p-4 text-primary-foreground shadow-lg">
                    <p className="text-sm uppercase tracking-wide text-primary-foreground/80">{snapshot.promptLabel}</p>
                    <p className="mt-2 text-lg font-semibold">&ldquo;{snapshot.promptText}&rdquo;</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-border bg-white/80 p-4 text-left shadow-sm">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">{snapshot.approvalLabel}</p>
                      <p className="mt-1 text-base font-semibold text-slate-900">{snapshot.approvalValue}</p>
                    </div>
                    <div className="rounded-2xl border border-border bg-white/80 p-4 text-left shadow-sm">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">{snapshot.experimentsLabel}</p>
                      <p className="mt-1 text-base font-semibold text-slate-900">{snapshot.experimentsValue}</p>
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
