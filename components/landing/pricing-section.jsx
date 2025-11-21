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
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            选择适合您的方案
          </h2>
          <p className="text-gray-600">
            灵活的价格方案，满足不同规模团队的需求
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`p-8 rounded-xl border ${
                plan.popular
                  ? "border-blue-500 bg-white shadow-lg"
                  : "border-gray-200 bg-white hover:shadow-lg"
              } transition-all`}
            >
              {plan.popular && (
                <span className="text-blue-500 text-sm font-medium mb-2 block">
                  最受欢迎
                </span>
              )}
              <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                {plan.period && (
                  <span className="text-gray-600">{plan.period}</span>
                )}
              </div>
              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="text-gray-600 flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-green-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                href={plan.href}
                className={`block text-center py-3 px-6 rounded-lg font-medium transition-all ${
                  plan.popular
                    ? "bg-blue-500 text-white hover:bg-blue-600"
                    : "bg-gray-900 text-white hover:bg-gray-800"
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