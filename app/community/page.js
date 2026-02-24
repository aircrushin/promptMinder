"use client";

import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/landing/header";
import { Users, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import dynamic from "next/dynamic";

const Footer = dynamic(() => import("@/components/layout/Footer"), {
  loading: () => <div className="h-32 bg-secondary/10" />
});

export default function CommunityPage() {
  const { t } = useLanguage();

  const safeT = t || {
    footer: { copyright: "© 2024 Prompt Minder. All rights reserved." }
  };

  return (
    <>
      <Header />
      <main className="flex-1 bg-gradient-to-b from-slate-50/50 via-white to-slate-50/30 min-h-screen">
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 via-transparent to-blue-50/30 pointer-events-none" />
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 relative">
            <div className="text-center space-y-6">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm font-medium">
                <Users className="w-4 h-4" />
                <span>加入我们的社区</span>
              </div>

              {/* Title */}
              <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight">
                为什么需要
                <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                  加入社区
                </span>
              </h1>

              {/* Description */}
              <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
                加入 whyPrompt 知识星球，与数千名 AI 提示词爱好者一起交流、学习、成长。
                在这里，你可以获取最新的提示词技巧、行业资讯和独家资源。
              </p>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* QR Code Card */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-500" />
              <div className="relative bg-white rounded-2xl p-8 shadow-xl border border-slate-100">
                <div className="aspect-[4/3] relative rounded-xl overflow-hidden bg-slate-50">
                  <Image
                    src="/zsqx.jpg"
                    alt="whyPrompt 知识星球二维码"
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
                <p className="text-center text-sm text-slate-500 mt-4">
                  微信扫码加入知识星球
                </p>
              </div>
            </div>

            {/* Benefits Section */}
            <div className="space-y-8">
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-slate-900">
                  社区权益
                </h2>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-900">独家提示词模板</h3>
                      <p className="text-sm text-slate-600 mt-1">
                        获取经过实战验证的高质量提示词模板，提升你的 AI 使用效率
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-900">专业交流圈</h3>
                      <p className="text-sm text-slate-600 mt-1">
                        与提示词工程师、AI 从业者和爱好者深度交流，拓展人脉
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                      <ArrowRight className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-900">最新行业动态</h3>
                      <p className="text-sm text-slate-600 mt-1">
                        第一时间了解 AI 行业资讯、新模型发布和最佳实践
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* CTA Button */}
              <div className="pt-4">
                <Link
                  href="https://t.zsxq.com/4ZWRZ"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    size="lg"
                    className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/20 transition-all duration-300"
                  >
                    立即加入星球
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
                <p className="text-sm text-slate-500 mt-3">
                  或使用微信扫描上方二维码加入
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer t={safeT.footer} />
    </>
  );
}
