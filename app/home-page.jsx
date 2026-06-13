"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import { Header } from "@/components/landing/header";
import { HeroSection } from "@/components/landing/hero-section";
import { useLanguage } from "@/contexts/LanguageContext";
import { Skeleton } from "@/components/ui/skeleton";

const Footer = dynamic(() => import("@/components/layout/Footer"), {
  loading: () => <div className="h-32 bg-secondary/10" />,
});

const FeatureSection = dynamic(
  () =>
    import("@/components/landing/feature-section").then((mod) => ({
      default: mod.FeatureSection,
    })),
  {
    loading: () => (
      <div className="py-16">
        <div className="container mx-auto px-4">
          <Skeleton className="h-8 w-48 mx-auto mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="h-12 w-12" />
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-16 w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
  }
);

const TestimonialSection = dynamic(
  () =>
    import("@/components/landing/testimonial-section").then((mod) => ({
      default: mod.TestimonialSection,
    })),
  {
    loading: () => (
      <div className="py-16 bg-secondary/5">
        <div className="container mx-auto px-4">
          <Skeleton className="h-8 w-48 mx-auto mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="space-y-4 p-6 bg-background rounded-lg">
                <Skeleton className="h-16 w-full" />
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
  }
);

const FAQSection = dynamic(
  () =>
    import("@/components/landing/faq-section").then((mod) => ({
      default: mod.FAQSection,
    })),
  {
    loading: () => (
      <div className="py-16">
        <div className="container mx-auto px-4">
          <Skeleton className="h-8 w-48 mx-auto mb-8" />
          <div className="space-y-4 max-w-2xl mx-auto">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="border rounded-lg p-4">
                <Skeleton className="h-6 w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
  }
);

const CTASection = dynamic(
  () =>
    import("@/components/landing/cta-section").then((mod) => ({
      default: mod.CTASection,
    })),
  {
    loading: () => (
      <div className="py-16 bg-primary/5">
        <div className="container mx-auto px-4 text-center">
          <Skeleton className="h-8 w-64 mx-auto mb-4" />
          <Skeleton className="h-6 w-96 mx-auto mb-8" />
          <Skeleton className="h-10 w-32 mx-auto" />
        </div>
      </div>
    ),
  }
);

const GptImage2Section = dynamic(
  () =>
    import("@/components/landing/gpt-image2-section").then((mod) => ({
      default: mod.GptImage2Section,
    })),
  {
    loading: () => (
      <div className="py-28 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(320px,0.7fr)]">
            <div className="space-y-6">
              <Skeleton className="h-6 w-48 rounded-full bg-slate-100" />
              <Skeleton className="h-12 w-80 bg-slate-100" />
              <Skeleton className="h-16 w-full max-w-lg bg-slate-100" />
            </div>
            <Skeleton className="h-72 w-full rounded-xl bg-slate-100" />
          </div>
        </div>
      </div>
    ),
  }
);

const CLISection = dynamic(
  () =>
    import("@/components/landing/cli-section").then((mod) => ({
      default: mod.CLISection,
    })),
  {
    loading: () => (
      <div className="py-28 bg-slate-950">
        <div className="container mx-auto px-4">
          <div className="grid gap-12 lg:grid-cols-2">
            <Skeleton className="h-72 w-full bg-slate-800 rounded-2xl" />
          </div>
        </div>
      </div>
    ),
  }
);

export default function HomePage() {
  const { t } = useLanguage();

  const safeT = t || {
    hero: {
      title: "Prompt Minder",
      subtitle: "专业的AI提示词管理平台",
      cta: "开始使用",
    },
    features: { title: "核心功能", items: [] },
    gptImage2: {
      title: "GPT Image2 + Suno Prompts",
      primaryCta: "浏览 GPT Image2",
      secondaryCta: "浏览 Suno",
    },
    cli: { title: "One command to rule your prompts" },
    testimonials: { title: "用户评价", items: [] },
    faq: { title: "常见问题", items: [] },
    cta: {
      title: "立即开始",
      description: "免费体验所有功能",
      button: "免费开始",
    },
    footer: { copyright: "© 2024 Prompt Minder. All rights reserved." },
  };

  return (
    <>
      <Header />
      <main className="flex min-h-screen flex-col">
        <HeroSection t={safeT.hero} />
        <Suspense
          fallback={
            <div className="py-16 flex justify-center">
              <div className="rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          }
        >
          <FeatureSection t={safeT.features} />
        </Suspense>
        <Suspense
          fallback={
            <div className="py-28 flex justify-center">
              <div className="rounded-full h-6 w-6 border-b-2 border-amber-400" />
            </div>
          }
        >
          <GptImage2Section t={safeT.gptImage2} />
        </Suspense>
        <Suspense
          fallback={
            <div className="py-28 bg-slate-950 flex justify-center">
              <div className="rounded-full h-6 w-6 border-b-2 border-indigo-400" />
            </div>
          }
        >
          <CLISection t={safeT.cli} />
        </Suspense>
        <Suspense
          fallback={
            <div className="py-16 flex justify-center">
              <div className="rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          }
        >
          <TestimonialSection t={safeT.testimonials} />
        </Suspense>
        <Suspense
          fallback={
            <div className="py-16 flex justify-center">
              <div className="rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          }
        >
          <FAQSection t={safeT.faq} />
        </Suspense>
        <Suspense
          fallback={
            <div className="py-16 flex justify-center">
              <div className="rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          }
        >
          <CTASection t={safeT.cta} />
        </Suspense>
      </main>
      <Suspense fallback={<div className="h-32 bg-secondary/10" />}>
        <Footer t={safeT.footer} />
      </Suspense>
    </>
  );
}
