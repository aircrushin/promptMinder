"use client";

import dynamic from "next/dynamic";

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
    <section className="relative flex min-h-[calc(100vh-4rem)] items-center overflow-hidden bg-gradient-to-b from-white via-white to-blue-50/70">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-12 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute left-1/2 top-32 h-80 w-80 -translate-x-1/2 rounded-full bg-indigo-500/10 blur-[120px]" />
        <div className="absolute -right-12 bottom-0 h-64 w-64 rounded-full bg-sky-400/20 blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-6xl px-6 py-16 sm:px-10 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-12 lg:items-center lg:gap-16">
          <MotionDiv
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="lg:col-span-6 space-y-8"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100/70 bg-white/70 px-4 py-2 text-sm text-blue-600 shadow-sm backdrop-blur">
              <span>{heroCopy.subtitleStart}</span>
              <TypeAnimation
                sequence={animatedText.flatMap((item) => [item, 2200])}
                wrapper="span"
                speed={44}
                className="font-semibold text-indigo-600"
                repeat={Infinity}
              />
              <span>{heroCopy.subtitleEnd}</span>
            </div>

            <h1 className="text-balance text-5xl font-extrabold leading-tight text-slate-900 sm:text-6xl">
              <ShinyText
                text={heroCopy.mainTitle}
                speed={3}
                className="text-transparent bg-gradient-to-r from-slate-900 via-indigo-700 to-blue-600 [-webkit-background-clip:text] [background-clip:text]"
              />
            </h1>

            <p className="max-w-2xl text-lg leading-relaxed text-slate-600 sm:text-xl">
              {heroCopy.description}
            </p>

            <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:gap-5">
              <Link
                href={isSignedIn ? "/prompts" : "/sign-up"}
                className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-0.5 hover:shadow-xl"
              >
                {heroCopy.ctaButton}
              </Link>
              <Link
                href="/public"
                className="inline-flex items-center justify-center rounded-xl border border-blue-200/70 bg-white/70 px-8 py-4 text-lg font-semibold text-blue-700 transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-200"
              >
                {heroCopy.secondaryCta}
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-sm text-slate-500">
              <GitHubStars className="scale-105 rounded-full border border-blue-100/70 bg-white/80 px-4 py-2 backdrop-blur" />
              <div className="flex flex-wrap items-center gap-6 rounded-2xl border border-blue-100/60 bg-white/70 px-6 py-4 shadow-sm backdrop-blur">
                {stats.map((stat) => (
                  <div key={stat.label} className="flex flex-col text-left">
                    <span className="text-lg font-semibold text-slate-900">{stat.value}</span>
                    <span className="text-xs uppercase tracking-wide text-slate-500">{stat.label}</span>
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
            <div className="relative mx-auto max-w-lg">
              <div className="absolute -top-8 -left-8 h-40 w-40 rounded-full bg-gradient-to-br from-blue-400/40 via-transparent to-transparent blur-3xl" />
              <div className="absolute -bottom-10 -right-10 h-52 w-52 rounded-full bg-indigo-400/30 blur-[120px]" />

              <div className="relative flex flex-col gap-5">
                <MotionDiv
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.25 }}
                  className="rounded-3xl border border-white/20 bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-slate-800/60 p-8 text-white shadow-2xl backdrop-blur"
                >
                  <div className="text-sm uppercase tracking-[0.3em] text-blue-200/90">Prompt Minder</div>
                  <div className="mt-5 space-y-4 text-left">
                    {quickHighlights.map(({ title, description, Icon }) => (
                      <div key={title} className="flex items-start gap-4">
                        <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
                          <Icon className="h-5 w-5 text-blue-200" />
                        </div>
                        <div>
                          <p className="text-base font-semibold text-white/95">{title}</p>
                          <p className="text-sm text-white/70">{description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </MotionDiv>

                <MotionDiv
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.45 }}
                  className="rounded-3xl border border-blue-100/40 bg-white/80 p-6 shadow-xl shadow-blue-200/60 backdrop-blur"
                >
                  <div className="mb-6 flex items-center justify-between">
                    <span className="text-sm font-medium uppercase tracking-wide text-slate-500">{snapshot.badge}</span>
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">{snapshot.status}</span>
                  </div>
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-blue-100/60 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 p-4 text-white shadow-lg">
                      <p className="text-sm uppercase tracking-wide text-white/70">{snapshot.promptLabel}</p>
                      <p className="mt-2 text-lg font-semibold">&ldquo;{snapshot.promptText}&rdquo;</p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-blue-100/70 bg-white/80 p-4 text-left">
                        <p className="text-xs uppercase tracking-wide text-slate-500">{snapshot.approvalLabel}</p>
                        <p className="mt-1 text-base font-semibold text-slate-800">{snapshot.approvalValue}</p>
                      </div>
                      <div className="rounded-2xl border border-blue-100/70 bg-white/80 p-4 text-left">
                        <p className="text-xs uppercase tracking-wide text-slate-500">{snapshot.experimentsLabel}</p>
                        <p className="mt-1 text-base font-semibold text-slate-800">{snapshot.experimentsValue}</p>
                      </div>
                    </div>
                  </div>
                </MotionDiv>
              </div>
            </div>
          </MotionDiv>
        </div>
      </div>
    </section>
  );
}
