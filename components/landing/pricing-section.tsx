"use client";

import { motion } from "framer-motion";
import Link from "next/link";

const plans = [
  {
    name: "免费版",
    price: "0",
    features: [
      "最多存储100个提示词",
      "基础版本控制",
      "单人使用",
      "社区支持",
    ],
    cta: "开始使用",
    href: "/sign-up",
  },
  {
    name: "专业版",
    price: "99",
    period: "/月",
    features: [
      "无限存储提示词",
      "完整版本控制",
      "最多5人团队",
      "优先技术支持",
      "高级API访问",
    ],
    cta: "升级专业版",
    href: "/pricing",
    popular: true,
  },
  {
    name: "企业版",
    price: "联系我们",
    features: [
      "私有部署选项",
      "定制化功能开发",
      "无限团队成员",
      "24/7专属支持",
      "SLA保障",
    ],
    cta: "联系销售",
    href: "/contact",
  },
  ];

export function PricingSection() {
  return (
    <section className="relative overflow-hidden bg-slate-50/50 py-24">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

      <div className="relative container mx-auto px-4">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-4xl font-extrabold text-slate-900 md:text-5xl">
            选择适合您的方案
          </h2>
          <p className="text-lg text-slate-600">
            灵活的价格方案，满足不同规模团队的需求
          </p>
        </div>

        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-3">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1, ease: "easeOut" }}
              className={`relative flex flex-col overflow-hidden rounded-[2rem] p-8 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 ${
                plan.popular
                  ? "border-2 border-indigo-500 bg-white shadow-2xl shadow-indigo-500/20"
                  : "border border-white/40 bg-white/60 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-slate-200/60"
              }`}
            >
              {plan.popular && (
                <div className="absolute right-0 top-0 rounded-bl-2xl bg-indigo-500 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white">
                  最受欢迎
                </div>
              )}
              
              <h3 className="mb-2 text-xl font-bold text-slate-900">{plan.name}</h3>
              <div className="mb-6 flex items-baseline">
                <span className="text-4xl font-extrabold text-slate-900">{plan.price}</span>
                {plan.period && (
                  <span className="ml-1 text-slate-500">{plan.period}</span>
                )}
              </div>
              
              <ul className="mb-8 space-y-4 flex-1">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-600">
                    <div className={`flex h-5 w-5 items-center justify-center rounded-full ${
                      plan.popular ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-500"
                    }`}>
                      <svg
                        className="h-3 w-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth={3}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>
              
              <Link
                href={plan.href}
                className={`block w-full rounded-2xl py-4 text-center text-base font-semibold transition-all ${
                  plan.popular
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 hover:shadow-indigo-500/40"
                    : "bg-slate-900 text-white shadow-lg shadow-slate-900/10 hover:bg-slate-800 hover:shadow-slate-900/20"
                }`}
               >
                {plan.cta}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
