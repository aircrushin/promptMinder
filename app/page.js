"use client"; // 必须是客户端组件才能使用 hooks
import Link from "next/link";
import dynamic from "next/dynamic";
import { Suspense } from "react";
// import { Metadata } from "next"; // 移除静态 Metadata 导入
import { Header } from "@/components/landing/header";
import { useLanguage } from '@/contexts/LanguageContext';
import { Skeleton } from "@/components/ui/skeleton";

// Dynamic imports for landing page sections
const Footer = dynamic(() => import("@/components/layout/Footer"), {
  loading: () => <div className="h-32 bg-secondary/10 animate-pulse" />
});

const HeroSection = dynamic(() => import("@/components/landing/hero-section").then(mod => ({ default: mod.HeroSection })), {
  loading: () => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="space-y-4 text-center">
        <Skeleton className="h-12 w-96 mx-auto" />
        <Skeleton className="h-6 w-64 mx-auto" />
        <Skeleton className="h-10 w-32 mx-auto" />
      </div>
    </div>
  )
});

const FeatureSection = dynamic(() => import("@/components/landing/feature-section").then(mod => ({ default: mod.FeatureSection })), {
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
  )
});

const TestimonialSection = dynamic(() => import("@/components/landing/testimonial-section").then(mod => ({ default: mod.TestimonialSection })), {
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
  )
});

const FAQSection = dynamic(() => import("@/components/landing/faq-section").then(mod => ({ default: mod.FAQSection })), {
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
  )
});

const CTASection = dynamic(() => import("@/components/landing/cta-section").then(mod => ({ default: mod.CTASection })), {
  loading: () => (
    <div className="py-16 bg-primary/5">
      <div className="container mx-auto px-4 text-center">
        <Skeleton className="h-8 w-64 mx-auto mb-4" />
        <Skeleton className="h-6 w-96 mx-auto mb-8" />
        <Skeleton className="h-10 w-32 mx-auto" />
      </div>
    </div>
  )
});

// 移除本地 translations 对象
// const translations = { en, zh };

// 移除本地 translations 对象
// const translations = { en, zh };

export default function Home() {
  // 使用 Context 获取翻译对象 t
  const { t } = useLanguage();

  // 移除本地状态和 effects
  // const [language, setLanguage] = useState('zh');
  // const t = translations[language];
  // useEffect(() => { ... }, [language]);

  // 提供默认翻译对象作为后备
  const safeT = t || {
    hero: { title: "Prompt Minder", subtitle: "专业的AI提示词管理平台", cta: "开始使用" },
    features: { title: "核心功能", items: [] },
    testimonials: { title: "用户评价", items: [] },
    faq: { title: "常见问题", items: [] },
    cta: { title: "立即开始", description: "免费体验所有功能", button: "免费开始" },
    footer: { copyright: "© 2024 Prompt Minder. All rights reserved." }
  }; 

  return (
    <>
      {/* Header 现在从 Context 获取状态，无需 props */}
      <Header /> 
      <main className="flex min-h-screen flex-col pt-16">
        {/* 将 Context 中的 t 传递给子组件 */}
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
          <HeroSection t={safeT.hero} />
        </Suspense>
        <Suspense fallback={<div className="py-16 flex justify-center"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div></div>}>
          <FeatureSection t={safeT.features} />
        </Suspense>
        {/* <PricingSection /> */}
        <Suspense fallback={<div className="py-16 flex justify-center"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div></div>}>
          <TestimonialSection t={safeT.testimonials} />
        </Suspense>
        <Suspense fallback={<div className="py-16 flex justify-center"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div></div>}>
          <FAQSection t={safeT.faq} />
        </Suspense>
        <Suspense fallback={<div className="py-16 flex justify-center"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div></div>}>
          <CTASection t={safeT.cta} />
        </Suspense>
      </main>
      {/* 将 Context 中的 t 传递给 Footer */}
      <Suspense fallback={<div className="h-32 bg-secondary/10 animate-pulse"></div>}>
        <Footer t={safeT.footer} />
      </Suspense>
    </>
  );
}
